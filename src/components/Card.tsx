import React from 'react';
import { CardType } from '../types';
import { motion } from 'motion/react';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isFaceDown?: boolean;
  className?: string;
}

const getHexColor = (color: string) => {
  switch (color) {
    case 'red': return '#ed1c24';
    case 'blue': return '#0072bc';
    case 'green': return '#00a651';
    case 'yellow': return '#fbc02d';
    default: return '#ffffff';
  }
};

const getBackgroundColorClass = (color: string) => {
  switch (color) {
    case 'red': return 'bg-[#ed1c24]';
    case 'blue': return 'bg-[#0072bc]';
    case 'green': return 'bg-[#00a651]';
    case 'yellow': return 'bg-[#fbc02d]';
    case 'wild': return 'bg-[#111111]';
    default: return 'bg-gray-200';
  }
};

const CornerText = ({ value }: { value: string }) => {
  const isNumber = !['skip', 'reverse', 'draw2', 'wild', 'draw4'].includes(value);

  const strokeShadow = '1px 1px 0px black, -1px -1px 0px black, 1px -1px 0px black, -1px 1px 0px black, 2px 2px 0px black';

  if (isNumber) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-[1.35rem] leading-none font-black text-white" style={{ textShadow: strokeShadow }}>{value}</span>
        {(value === '6' || value === '9') && <div className="w-[80%] h-[2px] bg-white mt-[1px]" style={{ boxShadow: '1px 1px 0px black' }} />}
      </div>
    );
  }

  const textMap: Record<string, string> = {
    'skip': 'Skip',
    'reverse': 'Reverse',
    'draw2': 'Draw two',
    'wild': 'Wild',
    'draw4': 'Draw four'
  };

  const word = textMap[value];
  return (
    <span className="font-bold text-[0.65rem] leading-none tracking-tight text-white whitespace-nowrap" style={{ textShadow: strokeShadow }}>
      {word}
    </span>
  );
};

const CenterSymbol = ({ card }: { card: CardType }) => {
  const getSymbol = () => {
    if (card.value === 'skip') return 'S';
    if (card.value === 'reverse') return 'R';
    if (card.value === 'draw2') return 'D';
    return card.value;
  };

  const is6or9 = card.value === '6' || card.value === '9';
  const hexColor = getHexColor(card.color);

  if (card.value === 'draw4') {
    return (
      <div
        className="font-black tracking-tighter text-[2.5rem] text-white z-10"
        style={{
          WebkitTextStroke: '2px black',
          textShadow: '4px 4px 0px black'
        }}
      >
        Wild
      </div>
    );
  }

  if (card.value === 'wild') {
     return (
      <div
        className="font-black tracking-tighter text-[2.5rem] flex z-10"
        style={{
          WebkitTextStroke: '2px black',
          textShadow: '4px 4px 0px black'
        }}
      >
        <span style={{ color: '#fbc02d' }}>W</span>
        <span style={{ color: '#0072bc' }}>i</span>
        <span style={{ color: '#ed1c24' }}>l</span>
        <span style={{ color: '#00a651' }}>d</span>
      </div>
     );
  }

  return (
    <div className="flex flex-col items-center justify-center z-10 -mt-2">
      <span
        className="font-black text-[4.5rem]"
        style={{
          color: hexColor,
          WebkitTextStroke: '3px black',
          textShadow: '5px 5px 0px black',
          lineHeight: 1
        }}
      >
        {getSymbol()}
      </span>
      {is6or9 && <div className="w-[80%] h-[5px] bg-black mt-1" style={{ boxShadow: '2px 2px 0px black' }} />}
    </div>
  );
};

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isFaceDown, className = '' }) => {
  if (isFaceDown) {
    return (
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -10 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={!disabled ? onClick : undefined}
        className={`relative w-28 h-40 rounded-xl border-[5px] border-white shadow-xl flex items-center justify-center bg-[#111] overflow-hidden select-none ${className} ${disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
      >
        <div className="absolute w-[95%] h-[125%] bg-[#ed1c24] rounded-[100%] transform -rotate-[25deg] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
        <span className="z-10 font-black text-4xl text-yellow-400 tracking-tighter transform -rotate-[25deg]"
              style={{ WebkitTextStroke: '2px black', textShadow: '4px 4px 0px black' }}>
          UNO
        </span>
      </motion.div>
    );
  }

  const bgClass = getBackgroundColorClass(card.color);
  
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -10 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={!disabled ? onClick : undefined}
      className={`relative w-28 h-40 rounded-xl border-[5px] border-white shadow-xl flex items-center justify-center overflow-hidden select-none ${bgClass} ${className} ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
    >
      {/* Inner Shape (White Oval or 4-Color Oval) */}
      {card.value === 'draw4' ? (
        <div className="absolute w-[95%] h-[125%] rounded-[100%] transform -rotate-[25deg] overflow-hidden flex flex-wrap shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border-2 border-black/10">
          <div className="w-1/2 h-1/2 bg-[#ed1c24]"></div>
          <div className="w-1/2 h-1/2 bg-[#0072bc]"></div>
          <div className="w-1/2 h-1/2 bg-[#fbc02d]"></div>
          <div className="w-1/2 h-1/2 bg-[#00a651]"></div>
        </div>
      ) : (
        <div className="absolute w-[95%] h-[125%] bg-[#f8f9fa] rounded-[100%] transform -rotate-[25deg] shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]"></div>
      )}

      {/* Top Left */}
      <div className="absolute top-1 left-1.5 z-20">
        <CornerText value={card.value} />
      </div>

      {/* Bottom Right */}
      <div className="absolute bottom-1 right-1.5 z-20 transform rotate-180">
        <CornerText value={card.value} />
      </div>

      {/* Center */}
      <CenterSymbol card={card} />
    </motion.div>
  );
};
