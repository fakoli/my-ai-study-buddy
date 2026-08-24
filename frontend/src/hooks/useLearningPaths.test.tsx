import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useCreateLearningPath,
  useUpdateLearningPath,
  useDeleteLearningPath,
  useAddCourseToPath,
} from './useLearningPaths';
import { learningPathsApi } from '../api/learningPaths';

vi.mock('../api/learningPaths', () => ({
  learningPathsApi: {
    list: vi.fn(),
    listMine: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addCourse: vi.fn(),
    removeCourse: vi.fn(),
    reorderCourses: vi.fn(),
  },
}));

const mockApi = vi.mocked(learningPathsApi);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  return {
    qc,
    invalidateSpy,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('learning path mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useCreateLearningPath succeeds and invalidates the paths list', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    mockApi.create.mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useCreateLearningPath(), { wrapper });
    result.current.mutate({ title: 'New Path' } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.create).toHaveBeenCalledWith({ title: 'New Path' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paths'] });
  });

  it('useCreateLearningPath surfaces errors (the "failed to create learning path" class)', async () => {
    const { wrapper } = makeWrapper();
    mockApi.create.mockRejectedValue(new Error('boom') as never);

    const { result } = renderHook(() => useCreateLearningPath(), { wrapper });
    result.current.mutate({ title: 'X' } as never);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('useUpdateLearningPath invalidates both the list and the single path', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    mockApi.update.mockResolvedValue({ id: 'p1' } as never);

    const { result } = renderHook(() => useUpdateLearningPath(), { wrapper });
    result.current.mutate({ pathId: 'p1', data: { title: 'Updated' } } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.update).toHaveBeenCalledWith('p1', { title: 'Updated' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paths'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['path', 'p1'] });
  });

  it('useDeleteLearningPath invalidates the list on success', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    mockApi.delete.mockResolvedValue({} as never);

    const { result } = renderHook(() => useDeleteLearningPath(), { wrapper });
    result.current.mutate('p1' as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paths'] });
  });

  it('useAddCourseToPath invalidates paths, path, and course discovery', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    mockApi.addCourse.mockResolvedValue({} as never);

    const { result } = renderHook(() => useAddCourseToPath(), { wrapper });
    result.current.mutate({ pathId: 'p1', courseId: 'c1' } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['paths'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['path', 'p1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['courses', 'discover'] });
  });

  it('useDeleteLearningPath surfaces API errors to the caller', async () => {
    const { wrapper } = makeWrapper();
    mockApi.delete.mockRejectedValue(new Error('boom') as never);

    const { result } = renderHook(() => useDeleteLearningPath(), { wrapper });
    result.current.mutate('p1' as never);
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
