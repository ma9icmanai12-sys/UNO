import { CardType, Color, Player, Value } from '../types';

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
export const VALUES: Value[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
export const WILD_VALUES: Value[] = ['wild', 'draw4'];

export function generateDeck(): CardType[] {
  const deck: CardType[] = [];
  
  // Normal colors
  for (const color of COLORS) {
    // One 0
    deck.push({ id: Math.random().toString(36).substr(2, 9), color, value: '0' });
    
    // Two of 1-9, skip, reverse, draw2
    for (let i = 1; i < VALUES.length; i++) {
      deck.push({ id: Math.random().toString(36).substr(2, 9), color, value: VALUES[i] });
      deck.push({ id: Math.random().toString(36).substr(2, 9), color, value: VALUES[i] });
    }
  }
  
  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: Math.random().toString(36).substr(2, 9), color: 'wild', value: 'wild' });
    deck.push({ id: Math.random().toString(36).substr(2, 9), color: 'wild', value: 'draw4' });
  }
  
  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function canPlayCard(card: CardType, topCard: CardType, currentColor: Color, mustDraw: number): boolean {
  if (mustDraw > 0) return false; // Must draw cards, cannot play (unless stacking, but let's keep it simple: no stacking)
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

export function calculateScore(hand: CardType[]): number {
  return hand.reduce((total, card) => {
    if (card.color === 'wild') return total + 50;
    if (['skip', 'reverse', 'draw2'].includes(card.value)) return total + 20;
    return total + parseInt(card.value) || 0;
  }, 0);
}

export function getAIMove(hand: CardType[], topCard: CardType, currentColor: Color, mustDraw: number): CardType | null {
  const playableCards = hand.filter(c => canPlayCard(c, topCard, currentColor, mustDraw));
  if (playableCards.length === 0) return null;
  
  // Simple AI: Play action cards first, then matching colors, save wilds for last
  playableCards.sort((a, b) => {
    if (a.color === 'wild' && b.color !== 'wild') return 1;
    if (a.color !== 'wild' && b.color === 'wild') return -1;
    if (['skip', 'reverse', 'draw2'].includes(a.value)) return -1;
    if (['skip', 'reverse', 'draw2'].includes(b.value)) return 1;
    return 0;
  });
  
  return playableCards[0];
}

export function getAIMostFrequentColor(hand: CardType[]): Color {
  const counts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  hand.forEach(c => {
    if (c.color !== 'wild') counts[c.color]++;
  });
  
  let max = 0;
  let bestColor: Color = 'red';
  
  for (const c of COLORS) {
    if (counts[c] > max) {
      max = counts[c];
      bestColor = c;
    }
  }
  
  return bestColor;
}
