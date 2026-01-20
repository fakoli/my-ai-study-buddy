import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api/quiz';
import type { QuizGenerateRequest, QuizSubmitRequest } from '../types';

export function useQuizSession(deckId?: string) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const generateMutation = useMutation({
    mutationFn: (request: QuizGenerateRequest) => quizApi.generate(request),
  });

  const submitMutation = useMutation({
    mutationFn: (request: QuizSubmitRequest) => quizApi.submit(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const startQuiz = async (numQuestions = 5) => {
    setCurrentIndex(0);
    setAnswers([]);
    return generateMutation.mutateAsync({ deck_id: deckId, num_questions: numQuestions });
  };

  const submitAnswer = (answerIndex: number) => {
    setAnswers((prev) => [...prev, answerIndex]);
    setCurrentIndex((prev) => prev + 1);
  };

  const submitQuiz = async (quizId: string) => {
    return submitMutation.mutateAsync({ quiz_id: quizId, answers });
  };

  const quiz = generateMutation.data;
  const currentQuestion = quiz?.questions[currentIndex];
  const isComplete = quiz ? currentIndex >= quiz.questions.length : false;

  return {
    quiz,
    currentQuestion,
    currentIndex,
    answers,
    isComplete,
    isGenerating: generateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    submission: submitMutation.data,
    startQuiz,
    submitAnswer,
    submitQuiz,
    reset: () => {
      setCurrentIndex(0);
      setAnswers([]);
      generateMutation.reset();
      submitMutation.reset();
    },
  };
}

export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizApi.get(quizId),
    enabled: !!quizId,
  });
}
