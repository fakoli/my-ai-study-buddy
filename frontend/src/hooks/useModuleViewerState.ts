import { useReducer, useCallback } from 'react';
import type { FlashcardFilter, QuizQuestionData } from '../types';

/**
 * View tab in module viewer
 */
export type ViewTab = 'content' | 'flashcards' | 'quiz' | 'practice';

/**
 * State for the module viewer component
 */
export interface ModuleViewerState {
  /** Current active tab */
  activeTab: ViewTab;
  /** Index of the currently displayed flashcard */
  currentFlashcardIndex: number;
  /** Whether the current flashcard is showing the back */
  isFlipped: boolean;
  /** Map of question index to selected answer index */
  quizAnswers: Record<number, number>;
  /** Whether the quiz has been submitted */
  quizSubmitted: boolean;
  /** Current flashcard filter setting */
  flashcardFilter: FlashcardFilter;
  /** Extra quiz questions generated via AI */
  extraQuizQuestions: QuizQuestionData[];
}

/**
 * Actions for the module viewer reducer
 */
export type ModuleViewerAction =
  | { type: 'SET_TAB'; payload: ViewTab }
  | { type: 'SET_FLASHCARD_INDEX'; payload: number }
  | { type: 'TOGGLE_FLIP' }
  | { type: 'SET_FLIPPED'; payload: boolean }
  | { type: 'SET_QUIZ_ANSWER'; payload: { questionIndex: number; answerIndex: number } }
  | { type: 'SUBMIT_QUIZ' }
  | { type: 'RETRY_QUIZ' }
  | { type: 'SET_FLASHCARD_FILTER'; payload: FlashcardFilter }
  | { type: 'ADD_EXTRA_QUIZ_QUESTIONS'; payload: QuizQuestionData[] }
  | { type: 'RESET_FOR_NEW_MODULE' }
  | { type: 'NEXT_FLASHCARD'; payload: { maxIndex: number } }
  | { type: 'PREV_FLASHCARD' };

/**
 * Initial state for the module viewer
 */
const initialState: ModuleViewerState = {
  activeTab: 'content',
  currentFlashcardIndex: 0,
  isFlipped: false,
  quizAnswers: {},
  quizSubmitted: false,
  flashcardFilter: 'all',
  extraQuizQuestions: [],
};

/**
 * Reducer function for module viewer state
 */
function moduleViewerReducer(
  state: ModuleViewerState,
  action: ModuleViewerAction
): ModuleViewerState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_FLASHCARD_INDEX':
      return {
        ...state,
        currentFlashcardIndex: action.payload,
        isFlipped: false, // Reset flip when changing cards
      };

    case 'TOGGLE_FLIP':
      return { ...state, isFlipped: !state.isFlipped };

    case 'SET_FLIPPED':
      return { ...state, isFlipped: action.payload };

    case 'SET_QUIZ_ANSWER':
      if (state.quizSubmitted) return state; // Don't allow changes after submission
      return {
        ...state,
        quizAnswers: {
          ...state.quizAnswers,
          [action.payload.questionIndex]: action.payload.answerIndex,
        },
      };

    case 'SUBMIT_QUIZ':
      return { ...state, quizSubmitted: true };

    case 'RETRY_QUIZ':
      return {
        ...state,
        quizAnswers: {},
        quizSubmitted: false,
      };

    case 'SET_FLASHCARD_FILTER':
      return {
        ...state,
        flashcardFilter: action.payload,
        currentFlashcardIndex: 0, // Reset to first card when filter changes
        isFlipped: false,
      };

    case 'ADD_EXTRA_QUIZ_QUESTIONS':
      return {
        ...state,
        extraQuizQuestions: [...state.extraQuizQuestions, ...action.payload],
        quizSubmitted: false, // Allow re-answering with new questions
      };

    case 'RESET_FOR_NEW_MODULE':
      return initialState;

    case 'NEXT_FLASHCARD':
      if (state.currentFlashcardIndex >= action.payload.maxIndex) return state;
      return {
        ...state,
        currentFlashcardIndex: state.currentFlashcardIndex + 1,
        isFlipped: false,
      };

    case 'PREV_FLASHCARD':
      if (state.currentFlashcardIndex <= 0) return state;
      return {
        ...state,
        currentFlashcardIndex: state.currentFlashcardIndex - 1,
        isFlipped: false,
      };

    default:
      return state;
  }
}

/**
 * Hook for managing module viewer state with useReducer.
 *
 * Consolidates 7+ useState calls into a single reducer for:
 * - Better performance (fewer re-renders)
 * - Easier state transitions
 * - Clearer action semantics
 * - Easier testing
 *
 * @example
 * ```tsx
 * const { state, actions } = useModuleViewerState();
 *
 * // Access state
 * const { activeTab, isFlipped, quizAnswers } = state;
 *
 * // Dispatch actions
 * actions.setTab('flashcards');
 * actions.toggleFlip();
 * actions.setQuizAnswer(0, 2);
 * actions.submitQuiz();
 * ```
 */
export function useModuleViewerState() {
  const [state, dispatch] = useReducer(moduleViewerReducer, initialState);

  // Memoized action creators
  const actions = {
    setTab: useCallback((tab: ViewTab) => {
      dispatch({ type: 'SET_TAB', payload: tab });
    }, []),

    setFlashcardIndex: useCallback((index: number) => {
      dispatch({ type: 'SET_FLASHCARD_INDEX', payload: index });
    }, []),

    toggleFlip: useCallback(() => {
      dispatch({ type: 'TOGGLE_FLIP' });
    }, []),

    setFlipped: useCallback((flipped: boolean) => {
      dispatch({ type: 'SET_FLIPPED', payload: flipped });
    }, []),

    setQuizAnswer: useCallback((questionIndex: number, answerIndex: number) => {
      dispatch({
        type: 'SET_QUIZ_ANSWER',
        payload: { questionIndex, answerIndex },
      });
    }, []),

    submitQuiz: useCallback(() => {
      dispatch({ type: 'SUBMIT_QUIZ' });
    }, []),

    retryQuiz: useCallback(() => {
      dispatch({ type: 'RETRY_QUIZ' });
    }, []),

    setFlashcardFilter: useCallback((filter: FlashcardFilter) => {
      dispatch({ type: 'SET_FLASHCARD_FILTER', payload: filter });
    }, []),

    addExtraQuizQuestions: useCallback((questions: QuizQuestionData[]) => {
      dispatch({ type: 'ADD_EXTRA_QUIZ_QUESTIONS', payload: questions });
    }, []),

    resetForNewModule: useCallback(() => {
      dispatch({ type: 'RESET_FOR_NEW_MODULE' });
    }, []),

    nextFlashcard: useCallback((maxIndex: number) => {
      dispatch({ type: 'NEXT_FLASHCARD', payload: { maxIndex } });
    }, []),

    prevFlashcard: useCallback(() => {
      dispatch({ type: 'PREV_FLASHCARD' });
    }, []),
  };

  return { state, actions, dispatch };
}
