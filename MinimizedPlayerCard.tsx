import React from 'react';
import { type Player } from './types';
import Avatar from './Avatar';

const MinimizedPlayerCard: React.FC<{
  player: Player;
  score: number;
  isActive: boolean;
  isFinished?: boolean;
}> = ({ player, score, isActive, isFinished }) => {
  return (
    <div className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-gray-700' : 'bg-gray-800'} ${isFinished ? 'opacity-50' : ''}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-teal-400 transition-transform duration-300 ${isActive ? 'transform-none' : 'transform -translate-x-full'}`}></div>
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0 ml-2" />
        <div className="ml-3 flex-grow truncate">
            <p className="font-semibold text-white truncate">{player.name}</p>
        </div>
        {isFinished && <span className="text-green-400 font-bold text-2xl mr-2">✓</span>}
        <p className="ml-2 font-mono font-bold text-2xl text-teal-300 pr-2">{score}</p>
    </div>
  );
};

export default MinimizedPlayerCard;

