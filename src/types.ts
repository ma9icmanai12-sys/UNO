export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'draw4';

export interface CardType {
  id: string;
  color: Color;
  value: Value;
}

export interface Player {
  id: string;
  name: string;
  hand: CardType[];
  isAI: boolean;
  hasCalledUno: boolean;
}

export interface GameState {
  deck: CardType[];
  discardPile: CardType[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: Color;
  status: 'menu' | 'lobby' | 'playing' | 'gameOver';
  winner: string | null;
  logs: string[];
  lastAction: string | null;
  mustDrawCards: number;
}

export interface LeaderboardEntry {
  name: string;
  wins: number;
  score: number;
}
