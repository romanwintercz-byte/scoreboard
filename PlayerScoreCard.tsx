import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from './types';
import Avatar from './Avatar';

const PlayerScoreCard: React.FC<{
  player: Player;
  score: number;
  turnScore: number;
  targetScore: number;
}> = ({ player, score, turnScore, targetScore }) => {
  const { t } = useTranslation();

  const totalPotentialScore = score + turnScore;
  const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
  const turnScorePercentage = targetScore > 0 ? (turnScore / targetScore) * 100 : 0;
  const remainingScore = Math.max(0, targetScore - totalPotentialScore);
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full transform transition-transform duration-300">
      {/* Top Part: Player Info and Scores */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Avatar and Name */}
        <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
          <Avatar avatar={player.avatar} className="w-16 h-16" />
          <h2 className="text-3xl font-bold text-teal-400 truncate">{player.name}</h2>
        </div>
        {/* Right: Scores */}
        <div className="flex items-baseline gap-3 text-right flex-shrink">
          <p className="text-7xl font-mono font-extrabold text-white">{score}</p>
          {turnScore > 0 && (
            <p key={turnScore} className="text-4xl font-mono font-bold text-green-400 animate-score-pop">
              +{turnScore}
            </p>
          )}
        </div>
      </div>
      
      {/* Bottom Part: Progress Bar */}
      <div className="mt-6 flex items-center gap-4 w-full">
        <div className="flex-grow h-4 bg-gray-600 rounded-full overflow-hidden relative">
          {/* Base score fill */}
          <div 
            className="absolute h-full bg-teal-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, scorePercentage)}%` }}
          />
          {/* Turn score fill */}
          <div 
            className="absolute h-full bg-teal-600 opacity-75 rounded-full transition-all duration-300 ease-out"
            style={{ 
              left: `${Math.min(100, scorePercentage)}%`,
              width: `${Math.min(100 - scorePercentage, turnScorePercentage)}%`
            }}
          />
        </div>
        <div className="font-mono font-bold text-xl text-gray-400 text-right w-20">
          -{remainingScore}
        </div>
      </div>
    </div>
  );
};

export default PlayerScoreCard;
