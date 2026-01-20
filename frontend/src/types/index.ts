// User types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  token_balance: number;
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Deck types
export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeckResponse extends Deck {
  card_count: number;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}

export interface DeckCreate {
  title: string;
  description?: string;
}

export interface DeckUpdate {
  title?: string;
  description?: string;
}

// Card types
export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  visual_url: string | null;
  created_at: string;
}

export interface CardCreate {
  front: string;
  back: string;
  visual_url?: string;
}

export interface CardUpdate {
  front?: string;
  back?: string;
  visual_url?: string;
}

// Review types
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Review {
  id: string;
  user_id: string;
  card_id: string;
  difficulty: Difficulty;
  reviewed_at: string;
  next_review_at: string;
}

export interface ReviewCreate {
  card_id: string;
  difficulty: Difficulty;
}

export interface CardWithDeck {
  id: string;
  deck_id: string;
  deck_title: string;
  front: string;
  back: string;
  visual_url: string | null;
  next_review_at: string | null;
}

export interface DueCardsResponse {
  cards: CardWithDeck[];
  total_due: number;
}

export interface ReviewHistoryItem {
  id: string;
  card_id: string;
  card_front: string;
  difficulty: Difficulty;
  reviewed_at: string;
}

export interface ReviewHistoryResponse {
  reviews: ReviewHistoryItem[];
  total: number;
}

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export interface Quiz {
  id: string;
  user_id: string;
  deck_id: string | null;
  topic: string | null;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizGenerateRequest {
  deck_id?: string;
  topic?: string;
  num_questions?: number;
}

export interface QuestionResult {
  question_id: string;
  selected: number;
  correct: number;
  is_correct: boolean;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: number[];
  submitted_at: string;
  score: number;
  results: QuestionResult[];
}

export interface QuizSubmitRequest {
  quiz_id: string;
  answers: number[];
}

export interface QuizWithSubmission extends Quiz {
  submission: QuizSubmission | null;
}

// Progress types
export interface ProgressStats {
  user_id: string;
  total_cards_reviewed: number;
  total_quizzes_completed: number;
  accuracy_rate: number;
  current_streak: number;
  longest_streak: number;
  time_spent_minutes: number;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  activity_type: 'review' | 'quiz' | 'reference';
  items_completed: number;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

export interface TopicMastery {
  topic: string;
  deck_id: string | null;
  total_cards: number;
  mastered_cards: number;
  mastery_percentage: number;
  last_reviewed: string | null;
}

export interface TopicMasteryResponse {
  topics: TopicMastery[];
}

// Notification types
export type NotificationChannel = 'email' | 'sms';
export type NotificationType = 'reminder' | 'daily_quiz' | 'hint' | 'encouragement' | 'progress_summary';
export type ReminderFrequency = 'daily' | 'every_other_day' | 'weekly' | 'none';
export type SummaryDay = 'monday' | 'friday' | 'sunday';

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  email_address: string;
  sms_enabled: boolean;
  phone_number: string | null;
  daily_quiz_enabled: boolean;
  daily_quiz_time: string;
  daily_quiz_channel: NotificationChannel;
  reminder_frequency: ReminderFrequency;
  reminder_channel: NotificationChannel;
  progress_summary_enabled: boolean;
  progress_summary_day: SummaryDay;
  progress_summary_channel: NotificationChannel;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  send_encouragement: boolean;
  send_hints: boolean;
}

export interface NotificationPreferencesUpdate {
  email_enabled?: boolean;
  email_address?: string;
  sms_enabled?: boolean;
  phone_number?: string;
  daily_quiz_enabled?: boolean;
  daily_quiz_time?: string;
  daily_quiz_channel?: NotificationChannel;
  reminder_frequency?: ReminderFrequency;
  reminder_channel?: NotificationChannel;
  progress_summary_enabled?: boolean;
  progress_summary_day?: SummaryDay;
  progress_summary_channel?: NotificationChannel;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  send_encouragement?: boolean;
  send_hints?: boolean;
}

// Reference types
export interface Reference {
  id: string;
  title: string;
  description: string | null;
  modules: string[];
  difficulty: string;
}

export interface ReferenceContent {
  id: string;
  title: string;
  content: string;
  flashcards: Array<{ front: string; back: string; visual?: string }>;
  quiz: object | null;
}

export interface ReferencesResponse {
  references: Reference[];
}

// AI types
export interface AIResponse {
  content: string;
  tokens_used: number;
}

export interface ExplainRequest {
  concept: string;
  context?: string;
}

export interface HintRequest {
  question: string;
  current_answer?: string;
  hint_level?: number;
}

export interface ExamplesRequest {
  concept: string;
  num_examples?: number;
}

export interface SimplifyRequest {
  content: string;
}
