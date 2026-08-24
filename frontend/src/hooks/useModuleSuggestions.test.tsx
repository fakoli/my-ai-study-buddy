import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useModuleSuggestions } from './useModuleSuggestions';
import { useSuggestModules, useGenerateModuleContent } from './useGeneration';
import { useBatchCreateModules } from './useModules';
import { modulesApi } from '../api/modules';
import { ToastContext, type ToastContextValue } from '../components/common/ToastProvider';

vi.mock('../api/modules', () => ({
  modulesApi: { create: vi.fn(), batchCreate: vi.fn(), delete: vi.fn() },
}));
vi.mock('../hooks/useGeneration', () => ({
  useSuggestModules: vi.fn(),
  useGenerateModuleContent: vi.fn(),
}));
vi.mock('../hooks/useModules', () => ({
  useBatchCreateModules: vi.fn(),
  useDeleteModule: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));
vi.mock('../utils/errors', () => ({
  isInsufficientTokensError: vi.fn(() => false),
}));

const mockModulesApi = vi.mocked(modulesApi);

function makeToast(): ToastContextValue & { errorSpy: ReturnType<typeof vi.fn>; successSpy: ReturnType<typeof vi.fn> } {
  const errorSpy = vi.fn();
  const successSpy = vi.fn();
  return { toast: vi.fn(), success: successSpy, error: errorSpy, info: vi.fn(), errorSpy, successSpy };
}

function makeWrapper(toastValue: ToastContextValue) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>
        <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
      </QueryClientProvider>
    ),
  };
}

describe('useModuleSuggestions error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: suggestions succeed with one module suggestion.
    vi.mocked(useSuggestModules).mockReturnValue({
      mutateAsync: vi
        .fn()
        .mockResolvedValue({
          suggestions: [{ title: 'M1', description: 'd', objectives: ['o'] }],
          tokens_used: 10,
        }),
      isPending: false,
      data: undefined,
    } as never);
    vi.mocked(useGenerateModuleContent).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        content_markdown: '# M1',
        flashcards: [],
        quiz: undefined,
      }),
    } as never);
    // Per-module create used by the generateContent path.
    mockModulesApi.create.mockResolvedValue({ id: 'm1', title: 'M1' } as never);
  });

  it('fetchSuggestions shows an error toast when suggestModules fails', async () => {
    const toast = makeToast();
    const { wrapper } = makeWrapper(toast);
    vi.mocked(useSuggestModules).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('backend down')),
      isPending: false,
      data: undefined,
    } as never);

    const { result } = renderHook(() => useModuleSuggestions(), { wrapper });
    await act(async () => {
      await result.current.fetchSuggestions('c1', false);
    });

    expect(toast.errorSpy).toHaveBeenCalledWith(
      'Failed to generate module suggestions. Please try again.',
    );
    expect(result.current.isOpen).toBe(false); // no suggestions -> modal stays closed
  });

  it('confirmSuggestions with generateContent=false creates modules via batch and shows success toast', async () => {
    const toast = makeToast();
    const { wrapper } = makeWrapper(toast);
    vi.mocked(useBatchCreateModules).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ created: [{ id: 'm1', title: 'M1' }], count: 1 }),
    } as never);

    const { result } = renderHook(() => useModuleSuggestions(), { wrapper });
    // openModal is internal; fetchSuggestions (which calls it) populates the
    // modal with suggestions.
    vi.mocked(useSuggestModules).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ suggestions: [{ title: 'M1', description: 'd', objectives: ['o'] }], tokens_used: 10 }),
      isPending: false,
      data: undefined,
    } as never);
    await act(async () => {
      await result.current.fetchSuggestions('c1', false);
    });
    expect(result.current.isOpen).toBe(true); // modal opened with the suggestion
    expect(result.current.suggestions.length).toBe(1);
    // generateContent defaults to true — flip it to exercise the batch path.
    await act(async () => {
      result.current.updateOptions({ generateContent: false });
    });
    await act(async () => {
      await result.current.confirmSuggestions('c1', [], [], () => {});
    });

    // The hook routes through useBatchCreateModules' mutateAsync (mocked),
    // not modulesApi.batchCreate directly, so assert on the success toast.
    expect(mockModulesApi.batchCreate).not.toHaveBeenCalled();
    expect(toast.successSpy).toHaveBeenCalledWith('Created 1 modules!');
  });

  it('confirmSuggestions shows the generic failure toast when no modules can be created', async () => {
    const toast = makeToast();
    const { wrapper } = makeWrapper(toast);
    vi.mocked(useGenerateModuleContent).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('gen failed')),
    } as never);

    const { result } = renderHook(() => useModuleSuggestions(), { wrapper });
    await act(async () => {
      await result.current.fetchSuggestions('c1', false); // uses beforeEach default
    });
    await act(async () => {
      await result.current.confirmSuggestions('c1', [], [], () => {});
    });

    expect(toast.errorSpy).toHaveBeenCalledWith('Failed to create any modules. Please try again.');
  });
});
