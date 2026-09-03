import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeaderboard } from '../utils/leaderboard';
import { Trophy, Users, Play, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { BgTheme } from '../App';

interface MainMenuProps {
  onJoinGame: (playerName: string, isAI: boolean, roomId?: string) => void;
  bgTheme: BgTheme;
  onThemeChange: (theme: BgTheme) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onJoinGame, bgTheme, onThemeChange }) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('uno_player_name') || '';
  });
  const [view, setView] = useState<'main' | 'lobby' | 'leaderboard' | 'backgrounds'>('main');
  const { leaderboard } = useLeaderboard();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlayerName(val);
    localStorage.setItem('uno_player_name', val);
  };

  const handleJoin = (isAI: boolean, roomId?: string) => {
    const finalName = playerName.trim() || 'Player 1';
    onJoinGame(finalName, isAI, roomId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="mb-12 relative"
      >
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform -skew-x-12">
          UNO!
        </h1>
        <div className="absolute -bottom-4 right-0 bg-black text-yellow-400 font-bold px-4 py-1 rounded-full text-xl border-2 border-yellow-400 rotate-12 shadow-lg">
          CLASSIC
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-6 w-full max-w-sm"
          >
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              className="w-full px-6 py-4 rounded-xl text-2xl font-bold bg-white/10 border-4 border-white/20 text-white placeholder-white/50 text-center focus:outline-none focus:border-yellow-400 transition-colors uppercase"
              placeholder="NAME"
              maxLength={15}
            />
            
            <button
              onClick={() => handleJoin(true)}
              className="group relative flex items-center justify-center gap-3 w-full py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <Play size={28} />
              PLAY VS AI
            </button>

            <button
              onClick={() => setView('lobby')}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-blue-600/80 text-white font-bold text-xl hover:bg-blue-500 transition-all border-2 border-blue-400 hover:scale-105"
            >
              <Users size={24} />
              MULTIPLAYER LOBBY
            </button>

            <button
              onClick={() => setView('leaderboard')}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-purple-600/80 text-white font-bold text-xl hover:bg-purple-500 transition-all border-2 border-purple-400 hover:scale-105"
            >
              <Trophy size={24} />
              LEADERBOARD
            </button>

            <button
              onClick={() => setView('backgrounds')}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-pink-600/80 text-white font-bold text-xl hover:bg-pink-500 transition-all border-2 border-pink-400 hover:scale-105"
            >
              <ImageIcon size={24} />
              WALLPAPER
            </button>
          </motion.div>
        )}

        {view === 'backgrounds' && (
          <motion.div
            key="backgrounds"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/20 p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-white tracking-wider flex items-center gap-3">
                <ImageIcon className="text-pink-400" size={40} /> WALLPAPER
              </h2>
              <button onClick={() => setView('main')} className="text-white/50 hover:text-white uppercase font-bold text-sm tracking-widest">
                ← Back
              </button>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => onThemeChange('cyber')}
                className={`w-full py-4 rounded-xl font-bold text-xl border-4 transition-all ${bgTheme === 'cyber' ? 'bg-blue-600 border-white text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]' : 'bg-black/50 border-transparent text-white/70 hover:bg-black/70'}`}
              >
                Cyber Arcade (Uploaded Image)
              </button>
              
              <button 
                onClick={() => onThemeChange('black')}
                className={`w-full py-4 rounded-xl font-bold text-xl border-4 transition-all ${bgTheme === 'black' ? 'bg-neutral-800 border-white text-white' : 'bg-black/50 border-transparent text-white/70 hover:bg-black/70'}`}
              >
                Pitch Black
              </button>

              <button 
                onClick={() => onThemeChange('fade')}
                className={`w-full py-4 rounded-xl font-bold text-xl border-4 transition-all ${bgTheme === 'fade' ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-white text-white' : 'bg-black/50 border-transparent text-white/70 hover:bg-black/70'}`}
              >
                Color Fade
              </button>

              <button 
                onClick={() => onThemeChange('world')}
                className={`w-full py-4 rounded-xl font-bold text-xl border-4 transition-all flex items-center justify-center gap-2 ${bgTheme === 'world' ? 'bg-green-600 border-white text-white shadow-[0_0_20px_rgba(22,163,74,0.5)]' : 'bg-black/50 border-transparent text-white/70 hover:bg-black/70'}`}
              >
                🌍 World Images (Live Random)
              </button>
            </div>
            
            <p className="text-center text-white/40 text-sm mt-6">
              World Images fetches a random landscape photo from loremflickr. Click it again to shuffle!
            </p>
          </motion.div>
        )}

        {view === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl border-2 border-white/20 p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-white tracking-wider">ROOM LOBBY</h2>
              <button onClick={() => setView('main')} className="text-white/50 hover:text-white uppercase font-bold text-sm tracking-widest">
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => handleJoin(false, 'CREATE')}
                className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-4 border-dashed border-yellow-400/50 text-yellow-400 hover:border-yellow-400 hover:bg-yellow-400/10 transition-all group"
              >
                <PlusCircle size={48} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-xl">CREATE NEW ROOM</span>
              </button>
              
              <div className="flex flex-col gap-4">
                <h3 className="text-white/70 font-bold uppercase tracking-wider text-sm">Available Rooms</h3>
                {['Room 772', 'Casual Play', 'Pro Players'].map((room, i) => (
                  <button
                    key={i}
                    onClick={() => handleJoin(false, room)}
                    className="flex justify-between items-center w-full p-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                  >
                    <span className="text-white font-bold">{room}</span>
                    <span className="text-green-400 text-sm font-bold bg-green-400/10 px-3 py-1 rounded-full">1/2 Waiting</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-center text-white/40 text-sm">* multiplayer is simulated for this demo.</p>
          </motion.div>
        )}

        {view === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-3xl bg-gray-900/80 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wider flex items-center gap-3">
                <Trophy className="text-yellow-400" size={40} /> HALL OF FAME
              </h2>
              <button onClick={() => setView('main')} className="text-white/50 hover:text-white uppercase font-bold text-sm tracking-widest">
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-white/10 pb-2">MOST WINS</h3>
                <div className="flex flex-col gap-2">
                  {[...leaderboard].sort((a, b) => b.wins - a.wins).slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white font-bold"><span className="text-white/30 mr-2">#{i+1}</span>{entry.name}</span>
                      <span className="text-yellow-400 font-bold">{entry.wins} W</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <div className="text-white/30 italic">No games played yet.</div>}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-4 border-b border-white/10 pb-2">LOWEST SCORE</h3>
                <div className="flex flex-col gap-2">
                  {[...leaderboard].sort((a, b) => a.score - b.score).slice(0, 5).map((entry, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <span className="text-white font-bold"><span className="text-white/30 mr-2">#{i+1}</span>{entry.name}</span>
                      <span className="text-blue-400 font-bold">{entry.score} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && <div className="text-white/30 italic">No games played yet.</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
