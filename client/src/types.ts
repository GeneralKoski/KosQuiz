export type Lang = 'en' | 'it' | 'fr' | 'es';

export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
}

export interface LobbyInfo {
  code: string;
  isPublic: boolean;
  hostId: string;
  players: PlayerInfo[];
  state: 'waiting' | 'playing' | 'finished';
}

export interface PublicLobby {
  code: string;
  playerCount: number;
  hostName: string;
}

export interface GameState {
  round: number;
  totalRounds: number;
  category: string;
  questionText: string;
  questionPoints: number;
  questionIndex: number;
  activePlayerId: string;
  activePlayerName: string;
  phase: 'question' | 'hint' | 'reveal' | 'roundEnd' | 'gameEnd';
  hintText: string | null;
  players: PlayerInfo[];
}

export interface GameEndResult {
  players: PlayerInfo[];
}

export interface CorrectFeedback {
  playerId: string;
  playerName: string;
  points: number;
  answer: string;
}

export interface RevealData {
  correctAnswer: string;
}

export interface TimerStartData {
  seconds: number;
}
