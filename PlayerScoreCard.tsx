import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from './types';
import Avatar from './Avatar';

const PlayerScoreCard: React.FC<{
  player: Player;
  score: number;
  turnScore: number;
}> = ({ player, score, turnScore }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full text-center transform transition-transform duration-300">
      <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <Avatar avatar={player.avatar} className="w-16 h-16" />
          <h2 className="text-3xl font-bold text-teal-400 truncate">{player.name}</h2>
      </div>
      <p className="text-7xl font-mono font-extrabold text-white mb-2">{score}</p>
      
      <div className={`transition-opacity duration-300 ${turnScore > 0 ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-2xl font-mono font-bold text-green-400">
          {t('scoreboard.currentTurnScore')}: +{turnScore}
        </p>
      </div>
    </div>
  );
};

export default PlayerScoreCard;
