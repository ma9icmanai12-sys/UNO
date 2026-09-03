import React, { useEffect, useState, useRef } from 'react';
import { GameState, CardType, Color } from '../types';
import { canPlayCard, getAIMove, calculateScore, getAIMostFrequentColor } from '../utils/gameLogic';
import { Card } from './Card';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { audioManager } from '../utils/audio';
import { useLeaderboard } from '../utils/leaderboard';
import { Volume2, VolumeX, LogOut } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface GameBoardProps {
  playerName: string;
  isAI: boolean;
  roomId?: string;
  onExit: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ playerName, isAI, roomId, onExit }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null);
  const [unoWarning, setUnoWarning] = useState<string | null>(null);
  const [bigTextEvent, setBigTextEvent] = useState<{text: string, color: string} | null>(null);
  const { addScore } = useLeaderboard();
  const [isMuted, setIsMuted] = useState(audioManager.getMuted());

  const [activeRoomId, setActiveRoomId] = useState<string>('');

  useEffect(() => {
    audioManager.init();
    audioManager.startBGM();
    return () => audioManager.stopBGM();
  }, []);

  useEffect(() => {
    // Connect to local server
    const newSocket = io();
    setSocket(newSocket);

    const newRoomId = roomId || 'local_' + Math.random().toString(36).substr(2, 9);
    setActiveRoomId(newRoomId);

    newSocket.on('connect', () => {
      newSocket.emit('join_room', { roomId: newRoomId, playerName, isAI });
    });

    newSocket.on('state_update', (data: { gameState: GameState, playerId?: string }) => {
      setGameState(data.gameState);
      if (data.playerId) setMyPlayerId(data.playerId);
    });

    newSocket.on('play_sound', (data: { type: string, playerName?: string }) => {
      audioManager.init();
      if (data.type === 'wild') audioManager.playWildCard();
      else if (data.type === 'action') audioManager.playActionCard();
      else if (data.type === 'play') audioManager.playPlayCard();
      else if (data.type === 'draw') audioManager.playDrawCard();
      else if (data.type === 'uno_voice') {
         audioManager.playUnoVoice();
         showBigText(`${data.playerName} SAYS UNO!`, "text-yellow-400");
      }
    });

    newSocket.on('game_over', (data: { winner: string, score: number }) => {
      audioManager.playWin();
      fireConfetti();
      showBigText(`${data.winner} WINS!`, "text-yellow-400");
      
      // If we are the winner, add score
      if (data.winner === playerName) {
         addScore(playerName, 1, data.score);
      }
    });

    newSocket.on('player_disconnected', () => {
      alert("Opponent disconnected!");
      onExit();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [playerName, isAI, roomId]);

  useEffect(() => {
    if (gameState && gameState.status === 'playing' && isAI && socket) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // We'll have the client hosting the AI run the AI logic and send commands
      if (currentPlayer.isAI && currentPlayer.id !== myPlayerId) {
        const timer = setTimeout(() => {
           handleAITurn(currentPlayer);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.currentPlayerIndex, gameState?.status, gameState?.discardPile.length, gameState?.deck.length]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const showBigText = (text: string, color: string = 'text-white') => {
    setBigTextEvent({ text, color });
    setTimeout(() => setBigTextEvent(null), 2000);
  };

  const handleAITurn = (aiPlayer: any) => {
    if (!gameState || !socket || !activeRoomId) return;
    
    if (aiPlayer.hand.length === 2 && Math.random() > 0.1) {
       socket.emit('call_uno', { roomId: activeRoomId, playerId: aiPlayer.id });
    }

    const move = getAIMove(aiPlayer.hand, gameState.discardPile[gameState.discardPile.length - 1], gameState.currentColor, gameState.mustDrawCards);

    if (move) {
      if (move.color === 'wild') {
        const bestColor = getAIMostFrequentColor(aiPlayer.hand);
        socket.emit('play_card', { roomId: activeRoomId, playerId: aiPlayer.id, card: move, chosenColor: bestColor });
      } else {
        socket.emit('play_card', { roomId: activeRoomId, playerId: aiPlayer.id, card: move });
      }
    } else {
      socket.emit('draw_card', { roomId: activeRoomId, playerId: aiPlayer.id });
    }
  };

  const playCard = (card: CardType, chosenColor?: Color) => {
    if (!gameState || !socket || !activeRoomId) return;
    
    if (card.color === 'wild' && !chosenColor) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    // Server will validate
    socket.emit('play_card', { 
       roomId: activeRoomId, 
       playerId: myPlayerId, 
       card, 
       chosenColor 
    });
  };

  const drawCard = () => {
    if (!gameState || !socket || !activeRoomId) return;
    socket.emit('draw_card', { roomId: activeRoomId, playerId: myPlayerId });
  };

  const handleCallUno = () => {
    if (!gameState || !socket || !activeRoomId) return;
    socket.emit('call_uno', { roomId: activeRoomId, playerId: myPlayerId });
  };

  const toggleMute = () => {
    audioManager.init();
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
    if (!muted && gameState?.status === 'playing') {
       audioManager.startBGM();
    }
  };

  if (!gameState || !myPlayerId) {
     return <div className="min-h-screen flex items-center justify-center text-white text-3xl font-black bg-animated">CONNECTING...</div>;
  }

  if (gameState.status === 'lobby') {
     return <div className="min-h-screen flex items-center justify-center text-white text-3xl font-black bg-animated flex-col gap-4">
        <span>WAITING FOR OPPONENT...</span>
        {roomId && <span className="text-xl font-normal opacity-70">Room Code: {roomId}</span>}
        <button onClick={onExit} className="mt-8 px-6 py-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white text-lg transition-all">Cancel</button>
     </div>;
  }

  // Find our player and opponent
  const myPlayerIndex = gameState.players.findIndex(p => p.id === myPlayerId);
  const player = gameState.players[myPlayerIndex];
  const opponent = gameState.players[(myPlayerIndex + 1) % 2];
  
  if (!player || !opponent) return null;

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-animated flex flex-col justify-between">
      {/* Header controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-4">
        <button onClick={toggleMute} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md">
          {isMuted ? <VolumeX /> : <Volume2 />}
        </button>
        <button onClick={onExit} className="p-3 bg-red-500/80 rounded-full hover:bg-red-500 text-white backdrop-blur-md shadow-lg shadow-red-500/50">
          <LogOut />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-50">
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold border border-white/20 shadow-xl">
          ROOM: <span className="text-yellow-400">{roomId || 'LOCAL'}</span>
        </div>
      </div>

      {/* Opponent Area */}
      <div className="pt-8 flex flex-col items-center z-10">
        <div className={`text-xl font-bold mb-4 px-6 py-2 rounded-full backdrop-blur-md transition-all ${!isMyTurn ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-110' : 'bg-black/50 text-white/50'}`}>
          {opponent.name} {opponent.hand.length} Cards
        </div>
        <div className="flex justify-center -space-x-12 scale-75 opacity-80">
          {opponent.hand.map((card, i) => (
            <Card key={card.id} card={card} isFaceDown={true} className="shadow-2xl" />
          ))}
        </div>
      </div>

      {/* Center Table */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Current Color Indicator Glow */}
        <div className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-30 ${
           gameState.currentColor === 'red' ? 'bg-[#ed1c24]' :
           gameState.currentColor === 'blue' ? 'bg-[#0072bc]' :
           gameState.currentColor === 'green' ? 'bg-[#00a651]' :
           'bg-[#fbc02d]'
        }`} />

        <div className="flex items-center gap-12 relative">
           {/* Deck */}
           <div className="relative">
             <Card card={{ id: 'deck', color: 'red', value: '0' }} isFaceDown={true} onClick={isMyTurn ? drawCard : undefined} disabled={!isMyTurn} />
             {gameState.mustDrawCards > 0 && (
                <div className="absolute -top-4 -right-4 bg-[#ed1c24] text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white animate-bounce">
                  +{gameState.mustDrawCards}
                </div>
             )}
           </div>

           {/* Discard */}
           <motion.div 
             key={topCard.id}
             initial={{ scale: 0, rotate: 180 }}
             animate={{ scale: 1, rotate: Math.random() * 20 - 10 }}
             className="relative"
           >
             <Card card={topCard} />
             {gameState.currentColor !== topCard.color && gameState.currentColor !== 'wild' && topCard.color === 'wild' && (
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white font-bold text-sm shadow-xl border-2 border-white
                  ${gameState.currentColor === 'red' ? 'bg-[#ed1c24]' :
                    gameState.currentColor === 'blue' ? 'bg-[#0072bc]' :
                    gameState.currentColor === 'green' ? 'bg-[#00a651]' :
                    'bg-[#fbc02d] text-black'
                  }
                `}>
                  {gameState.currentColor.toUpperCase()}
                </div>
             )}
           </motion.div>
        </div>
      </div>

      {/* Player Area */}
      <div className="pb-8 flex flex-col items-center z-20">
        <div className="flex items-center gap-6 mb-8">
           <div className={`text-2xl font-black px-8 py-3 rounded-full backdrop-blur-md transition-all ${isMyTurn ? 'bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-110' : 'bg-black/50 text-white/50 border border-white/20'}`}>
             YOUR TURN
           </div>
           
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             onClick={handleCallUno}
             disabled={player.hand.length > 2}
             className={`px-6 py-3 rounded-full font-black text-xl shadow-2xl border-4 ${
               player.hand.length <= 2 && !player.hasCalledUno
               ? 'bg-[#ed1c24] text-white border-yellow-400 animate-pulse'
               : 'bg-gray-800 text-gray-500 border-gray-700 opacity-50 cursor-not-allowed'
             }`}
           >
             CALL UNO!
           </motion.button>
        </div>

        <div className="flex justify-center flex-wrap gap-[-40px] px-8 max-w-5xl">
          <AnimatePresence>
            {player.hand.map((card, i) => {
              const isPlayable = isMyTurn && canPlayCard(card, topCard, gameState.currentColor, gameState.mustDrawCards);
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: -100 }}
                  className="mx-[-20px] hover:z-50 hover:mx-2 transition-all duration-300"
                  style={{ zIndex: i }}
                >
                  <Card
                    card={card}
                    onClick={() => isPlayable && playCard(card)}
                    disabled={!isPlayable}
                    className={isPlayable ? 'shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)]' : ''}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
          >
            <h2 className="text-5xl font-black text-white mb-12 drop-shadow-lg">CHOOSE COLOR</h2>
            <div className="grid grid-cols-2 gap-6">
              {[
                { c: 'red', bg: 'bg-[#ed1c24] hover:bg-red-400 shadow-red-500/50' },
                { c: 'blue', bg: 'bg-[#0072bc] hover:bg-blue-400 shadow-blue-500/50' },
                { c: 'green', bg: 'bg-[#00a651] hover:bg-green-400 shadow-green-500/50' },
                { c: 'yellow', bg: 'bg-[#fbc02d] hover:bg-yellow-300 shadow-yellow-400/50' },
              ].map(color => (
                <motion.button
                  key={color.c}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playCard(pendingWildCard!, color.c as Color);
                    setShowColorPicker(false);
                    setPendingWildCard(null);
                  }}
                  className={`w-32 h-32 rounded-3xl ${color.bg} shadow-2xl border-4 border-white/20`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {bigTextEvent && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <h1 className={`text-7xl md:text-9xl font-black ${bigTextEvent.color} text-center filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] stroke-black stroke-2 uppercase transform -skew-x-12`} style={{ WebkitTextStroke: '3px black' }}>
              {bigTextEvent.text}
            </h1>
          </motion.div>
        )}

        {unoWarning && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 50, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#ed1c24] text-white px-8 py-4 rounded-full font-black text-2xl shadow-2xl z-50 border-4 border-white"
          >
            {unoWarning}
          </motion.div>
        )}

        {gameState.status === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-md"
          >
            <motion.h1 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: 'spring', delay: 0.2 }}
               className="text-8xl font-black text-yellow-400 mb-8 drop-shadow-[0_0_40px_rgba(250,204,21,0.5)]"
            >
              {gameState.winner} WINS!
            </motion.h1>
            <div className="flex gap-6 mt-8">
              <button onClick={onExit} className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-black text-2xl shadow-xl transition-all hover:scale-105">
                MAIN MENU
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
