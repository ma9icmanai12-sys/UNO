import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameBoard } from './components/GameBoard';

export type BgTheme = 'cyber' | 'black' | 'fade' | 'world';

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
  
  const [bgTheme, setBgTheme] = useState<BgTheme>('cyber');
  const [worldSeed, setWorldSeed] = useState(Date.now());

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

  const getBackgroundStyle = () => {
    if (bgTheme === 'cyber') {
      return { backgroundImage: 'url(/image_9f2b2d5a.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
    }
    if (bgTheme === 'world') {
      return { 
        backgroundImage: `url(https://loremflickr.com/2560/1440/landscape,world?random=${worldSeed})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050505'
      };
    }
    if (bgTheme === 'black') {
      return { backgroundColor: '#050505' };
    }
    return {}; // fade uses class
  };

  return (
    <div 
      className={`min-h-screen font-sans text-gray-100 selection:bg-yellow-400 selection:text-black relative ${bgTheme === 'fade' ? 'bg-animated' : 'bg-gray-950'}`}
      style={getBackgroundStyle()}
    >
      <div className={`absolute inset-0 z-0 ${bgTheme !== 'black' ? 'bg-black/50 backdrop-blur-sm' : ''}`}></div>
      
      <div className="relative z-10 w-full h-full min-h-screen">
        {gameState.inGame ? (
          <GameBoard 
            playerName={gameState.playerName} 
            isAI={gameState.isAI} 
            roomId={gameState.roomId}
            onExit={handleExitGame}
          />
        ) : (
          <div className="min-h-screen flex items-center justify-center p-4">
            <MainMenu 
              onJoinGame={handleJoinGame} 
              bgTheme={bgTheme}
              onThemeChange={(theme: BgTheme) => {
                setBgTheme(theme);
                if (theme === 'world') setWorldSeed(Date.now());
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
