import { useState, useCallback } from 'react';
import { moveItem, updateItem, removeItem, appendItem } from '../utils/listHelpers';
import type { FlashcardData } from '../types';

export function useFlashcardEditor(initialCards: FlashcardData[] = []) {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>(initialCards);

  const addFlashcard = useCallback(() => {
    const newCard: FlashcardData = { front: '', back: '', visual: undefined };
    setFlashcards((prev) => appendItem(prev, newCard));
  }, []);

  const updateFlashcard = useCallback(
    (index: number, field: keyof FlashcardData, value: string | undefined) => {
      setFlashcards((prev) => updateItem(prev, index, { [field]: value }));
    },
    []
  );

  const removeFlashcard = useCallback((index: number) => {
    setFlashcards((prev) => removeItem(prev, index));
  }, []);

  const moveFlashcard = useCallback((index: number, direction: 'up' | 'down') => {
    setFlashcards((prev) => moveItem(prev, index, direction));
  }, []);

  const replaceAll = useCallback((cards: FlashcardData[]) => {
    setFlashcards(cards);
  }, []);

  const appendAll = useCallback((cards: FlashcardData[]) => {
    setFlashcards((prev) => [...prev, ...cards]);
  }, []);

  const setAll = useCallback((cards: FlashcardData[]) => {
    setFlashcards(cards);
  }, []);

  const getValidFlashcards = useCallback(() => {
    return flashcards.filter((f) => f.front.trim() && f.back.trim());
  }, [flashcards]);

  return {
    flashcards,
    addFlashcard,
    updateFlashcard,
    removeFlashcard,
    moveFlashcard,
    replaceAll,
    appendAll,
    setAll,
    getValidFlashcards,
  };
}
