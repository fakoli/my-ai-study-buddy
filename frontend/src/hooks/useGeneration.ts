import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generationApi } from '../api/generation';
import type {
  GenerateFlashcardsRequest,
  GenerateModuleContentRequest,
  GenerateQuizRequest,
  GenerateVisualRequest,
  SuggestModulesRequest,
} from '../types';

/**
 * Hook to generate suggested module structure for an AI-enabled course.
 *
 * Token cost: 10
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data, error } = useSuggestModules();
 *
 * const handleSuggest = () => {
 *   mutate({ course_id: courseId });
 * };
 * ```
 */
export function useSuggestModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SuggestModulesRequest) =>
      generationApi.suggestModules(request),
    onSuccess: () => {
      // Invalidate user data to update token balance
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to generate full module content including markdown, flashcards, and quiz.
 *
 * Token cost: 25
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data } = useGenerateModuleContent();
 *
 * const handleGenerate = () => {
 *   mutate({
 *     course_id: courseId,
 *     module_title: 'Introduction to React',
 *     module_prompt: 'Cover React basics including components, props, and state',
 *     generate_flashcards: true,
 *     flashcard_count: 15,
 *     generate_quiz: true,
 *     quiz_question_count: 10,
 *   });
 * };
 * ```
 */
export function useGenerateModuleContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateModuleContentRequest) =>
      generationApi.generateModuleContent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to generate flashcards from existing module content.
 *
 * Token cost: 8
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data } = useGenerateFlashcards();
 *
 * const handleGenerate = () => {
 *   mutate({
 *     course_id: courseId,
 *     module_id: moduleId,
 *     count: 15,
 *   });
 * };
 * ```
 */
export function useGenerateFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateFlashcardsRequest) =>
      generationApi.generateFlashcards(request),
    onSuccess: (_, variables) => {
      // Invalidate module data to show new flashcards after saving
      queryClient.invalidateQueries({
        queryKey: ['module', variables.course_id, variables.module_id],
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to generate a quiz from existing module content.
 *
 * Token cost: 10
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data } = useGenerateQuiz();
 *
 * const handleGenerate = () => {
 *   mutate({
 *     course_id: courseId,
 *     module_id: moduleId,
 *     question_count: 10,
 *   });
 * };
 * ```
 */
export function useGenerateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateQuizRequest) =>
      generationApi.generateQuiz(request),
    onSuccess: (_, variables) => {
      // Invalidate module data to show new quiz after saving
      queryClient.invalidateQueries({
        queryKey: ['module', variables.course_id, variables.module_id],
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to generate an educational visual using AI image generation.
 *
 * Token cost: 5
 *
 * @example
 * ```tsx
 * const { mutate, isPending, data } = useGenerateVisual();
 *
 * const handleGenerate = () => {
 *   mutate({
 *     course_id: courseId,
 *     module_id: moduleId,
 *     description: 'A diagram showing the component lifecycle',
 *     style: 'educational_diagram',
 *     model: 'flash',
 *     aspect: 'landscape',
 *   });
 * };
 * ```
 */
export function useGenerateVisual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateVisualRequest) =>
      generationApi.generateVisual(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
