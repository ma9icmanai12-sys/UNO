import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameBoard } from './components/GameBoard';

export default function App() {
  const [gameState, setGameState] = useState<{
    inGame: boolean;
    playerName: string;
    isAI: boolean;
    roomId?: string;
  }>({
    inGame: false,
    playerName: '',
    isAI: true
  });

  const handleJoinGame = (playerName: string, isAI: boolean, roomId?: string) => {
    setGameState({
      inGame: true,
      playerName,
      isAI,
      roomId
    });
  };

  const handleExitGame = () => {
    setGameState({ ...gameState, inGame: false });
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-yellow-400 selection:text-black">
      {gameState.inGame ? (
        <GameBoard 
          playerName={gameState.playerName} 
          isAI={gameState.isAI} 
          roomId={gameState.roomId}
          onExit={handleExitGame}
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-animated p-4">
          <MainMenu onJoinGame={handleJoinGame} />
        </div>
      )}
    </div>
  );
}
