import { api } from './client';
import type {
  Card,
  CardCreate,
  CardUpdate,
  Deck,
  DeckCreate,
  DeckResponse,
  DeckUpdate,
  DeckWithCards,
} from '../types';

export const decksApi = {
  list: () => api.get<DeckResponse[]>('/decks'),

  create: (data: DeckCreate) => api.post<Deck>('/decks', data),

  get: (deckId: string) => api.get<DeckWithCards>(`/decks/${deckId}`),

  update: (deckId: string, data: DeckUpdate) => api.put<Deck>(`/decks/${deckId}`, data),

  delete: (deckId: string) => api.delete<{ message: string }>(`/decks/${deckId}`),

  addCard: (deckId: string, data: CardCreate) =>
    api.post<Card>(`/decks/${deckId}/cards`, data),

  updateCard: (deckId: string, cardId: string, data: CardUpdate) =>
    api.put<Card>(`/decks/${deckId}/cards/${cardId}`, data),

  deleteCard: (deckId: string, cardId: string) =>
    api.delete<{ message: string }>(`/decks/${deckId}/cards/${cardId}`),
};
