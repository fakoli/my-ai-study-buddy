import { useState, useCallback } from 'react';
import { removeItem, updateItem } from '../utils/listHelpers';
import { DEFAULTS } from '../utils/constants';
import type { QuizQuestionData } from '../types';

export function useQuizEditor(initialQuestions: QuizQuestionData[] = []) {
  const [questions, setQuestions] = useState<QuizQuestionData[]>(initialQuestions);

  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestionData = {
      question: '',
      options: Array(DEFAULTS.QUIZ_OPTIONS_COUNT).fill(''),
      correct_index: 0,
      explanation: undefined,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  }, []);

  const updateQuestion = useCallback(
    (
      index: number,
      field: keyof QuizQuestionData,
      value: string | number | string[] | undefined
    ) => {
      setQuestions((prev) => updateItem(prev, index, { [field]: value }));
    },
    []
  );

  const updateQuestionOption = useCallback(
    (questionIndex: number, optionIndex: number, value: string) => {
      setQuestions((prev) => {
        const updated = [...prev];
        const question = updated[questionIndex];
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        updated[questionIndex] = { ...question, options: newOptions };
        return updated;
      });
    },
    []
  );

  const removeQuestion = useCallback((index: number) => {
    setQuestions((prev) => removeItem(prev, index));
  }, []);

  const replaceAll = useCallback((newQuestions: QuizQuestionData[]) => {
    setQuestions(newQuestions);
  }, []);

  const setAll = useCallback((newQuestions: QuizQuestionData[]) => {
    setQuestions(newQuestions);
  }, []);

  const appendQuestions = useCallback((newQuestions: QuizQuestionData[]) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
  }, []);

  const getValidQuestions = useCallback(() => {
    return questions.filter(
      (q) => q.question.trim() && q.options.some((o) => o.trim())
    );
  }, [questions]);

  return {
    questions,
    addQuestion,
    updateQuestion,
    updateQuestionOption,
    removeQuestion,
    replaceAll,
    setAll,
    appendQuestions,
    getValidQuestions,
  };
}
