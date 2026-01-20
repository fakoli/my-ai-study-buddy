import { api } from './client';
import type {
  GeneratedModuleContent,
  GeneratedVisual,
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  GenerateModuleContentRequest,
  GenerateQuizRequest,
  GenerateQuizResponse,
  GenerateVisualRequest,
  SuggestModulesRequest,
  SuggestModulesResponse,
} from '../types';

/**
 * API client for AI-powered content generation.
 *
 * Token costs:
 * - suggestModules: 10 tokens
 * - generateModuleContent: 25 tokens
 * - generateFlashcards: 8 tokens
 * - generateQuiz: 10 tokens
 * - generateVisual: 5 tokens
 */
export const generationApi = {
  /**
   * Generate suggested module structure for an AI-enabled course.
   * Uses the course's instructions (purpose, audience, objectives) to suggest
   * a logical module structure.
   *
   * Token cost: 10
   */
  suggestModules: (request: SuggestModulesRequest) =>
    api.post<SuggestModulesResponse>('/generate/suggest-modules', request),

  /**
   * Generate full module content including markdown, flashcards, and quiz.
   * Uses the course's instructions and the provided module prompt to generate
   * comprehensive learning content.
   *
   * Token cost: 25
   */
  generateModuleContent: (request: GenerateModuleContentRequest) =>
    api.post<GeneratedModuleContent>('/generate/module-content', request),

  /**
   * Generate flashcards from existing module content.
   * Creates flashcards based on the module's markdown content and the
   * course's instructions.
   *
   * Token cost: 8
   */
  generateFlashcards: (request: GenerateFlashcardsRequest) =>
    api.post<GenerateFlashcardsResponse>('/generate/flashcards', request),

  /**
   * Generate a quiz from existing module content.
   * Creates multiple-choice questions based on the module's content
   * and existing flashcards.
   *
   * Token cost: 10
   */
  generateQuiz: (request: GenerateQuizRequest) =>
    api.post<GenerateQuizResponse>('/generate/quiz', request),

  /**
   * Generate an educational visual using AI image generation.
   * Uses nano-banana-pro (Gemini) to create diagrams, illustrations,
   * and other educational visuals.
   *
   * Token cost: 5
   */
  generateVisual: (request: GenerateVisualRequest) =>
    api.post<GeneratedVisual>('/generate/visual', request),
};
