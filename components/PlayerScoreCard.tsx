import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from '../types.ts';
import Avatar from './Avatar.tsx';

const PlayerScoreCard: React.FC<{
  player: Player | null;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSelectPlayer: () => void;
  titleKey: string;
}> = ({ player, score, onIncrement, onDecrement, onSelectPlayer, titleKey }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full text-center transform transition-transform duration-300">
      <div className="flex items-center justify-center gap-4 mb-4 h-16">
          {player && <Avatar avatar={player.avatar} className="w-12 h-12" />}
          <h2 className="text-3xl font-bold text-teal-400 truncate">{player ? player.name : t(titleKey)}</h2>
      </div>

      {player ? (
        <>
            <p className="text-8xl font-mono font-extrabold text-white mb-6">{score}</p>
            <div className="flex justify-center gap-4">
            <button onClick={onDecrement} aria-label={t('aria.decrement', { player: player.name }) as string}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out">
                -
            </button>
            <button onClick={onIncrement} aria-label={t('aria.increment', { player: player.name }) as string}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out">
                +
            </button>
            </div>
        </>
      ) : (
        <div className="h-[148px] flex items-center justify-center">
            <button onClick={onSelectPlayer} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t(titleKey)}
            </button>
        </div>
      )}
    </div>
  );
};

export default PlayerScoreCard;