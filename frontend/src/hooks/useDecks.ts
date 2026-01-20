import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { decksApi } from '../api/decks';
import type { CardCreate, CardUpdate, DeckCreate, DeckUpdate } from '../types';

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: decksApi.list,
  });
}

export function useDeck(deckId: string) {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => decksApi.get(deckId),
    enabled: !!deckId,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeckCreate) => decksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useUpdateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, data }: { deckId: string; data: DeckUpdate }) =>
      decksApi.update(deckId, data),
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: string) => decksApi.delete(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useAddCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, data }: { deckId: string; data: CardCreate }) =>
      decksApi.addCard(deckId, data),
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deckId,
      cardId,
      data,
    }: {
      deckId: string;
      cardId: string;
      data: CardUpdate;
    }) => decksApi.updateCard(deckId, cardId, data),
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deckId, cardId }: { deckId: string; cardId: string }) =>
      decksApi.deleteCard(deckId, cardId),
    onSuccess: (_, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
}
