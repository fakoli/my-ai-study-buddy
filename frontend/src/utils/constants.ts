// AI Generation token costs
export const GENERATION_COSTS = {
  SUGGEST_MODULES: 10,
  MODULE_CONTENT: 25,
  FLASHCARDS: 8,
  QUIZ: 10,
  VISUAL: 5,
} as const;

// Default values for editors
export const DEFAULTS = {
  FLASHCARD_COUNT: 15,
  QUIZ_QUESTION_COUNT: 10,
  PAGE_SIZE: 20,
  DEBOUNCE_MS: 300,
  QUIZ_OPTIONS_COUNT: 4,
} as const;

// Input limits for validation
export const LIMITS = {
  FLASHCARD_MIN: 1,
  FLASHCARD_MAX: 50,
  QUIZ_MIN: 1,
  QUIZ_MAX: 30,
  TOKEN_ADJUST_MIN: -1000000,
  TOKEN_ADJUST_MAX: 1000000,
  DESCRIPTION_MAX_LENGTH: 500,
  MODULE_PROMPT_MIN_LENGTH: 10,
} as const;
