import { useState, useEffect } from 'react';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    const data = localStorage.getItem('uno_leaderboard');
    if (data) {
      setLeaderboard(JSON.parse(data));
    }
  };

  const addScore = (name: string, wins: number, score: number) => {
    const data = localStorage.getItem('uno_leaderboard');
    let current = data ? JSON.parse(data) : [];
    
    const existing = current.find((entry: any) => entry.name === name);
    if (existing) {
      existing.wins += wins;
      // For score, we might just track lowest score won with, or accumulate.
      // Let's track lowest score if win, otherwise if loss, their remaining points
      // Actually rule: "Lowest Score leaderboard (sorted lowest to highest, following classic UNO point rules)."
      // Normally winner gets points of losers' hands. Let's say we accumulate points for winner.
      existing.score += score; 
    } else {
      current.push({ name, wins, score });
    }
    
    localStorage.setItem('uno_leaderboard', JSON.stringify(current));
    loadLeaderboard();
  };

  return { leaderboard, addScore };
}
