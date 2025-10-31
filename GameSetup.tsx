import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const GameSetup: React.FC<{
  onGameStart: (gameType: string) => void;
}> = ({ onGameStart }) => {
  const { t } = useTranslation();
  const [topLevel, setTopLevel] = useState<string | null>(null);
  const [threeBallType, setThreeBallType] = useState<string | null>(null);

  const finalGameType = useMemo(() => {
    if (topLevel === 'fourBall') {
      return t('gameSetup.fourBall');
    }
    if (topLevel === 'threeBall' && threeBallType) {
      return `${t('gameSetup.threeBall')}: ${t(threeBallType as any)}`;
    }
    return null;
  }, [topLevel, threeBallType, t]);

  const handleStart = () => {
    if (finalGameType) {
      onGameStart(finalGameType);
    }
  };
  
  const buttonClasses = (isActive: boolean) => 
    `w-full text-left p-4 rounded-lg text-lg font-semibold transition-all duration-200 border-2 ${
        isActive 
        ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
    }`;

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
      <h1 className="text-4xl font-extrabold mb-2 text-center text-white">{t('gameSetup.title')}</h1>
      <p className="text-center text-gray-400 mb-8">{t('gameSetup.selectType')}</p>

      <div className="flex flex-col gap-4 mb-6">
        <button onClick={() => { setTopLevel('fourBall'); setThreeBallType(null); }} className={buttonClasses(topLevel === 'fourBall')}>
            {t('gameSetup.fourBall')}
        </button>
        <button onClick={() => setTopLevel('threeBall')} className={buttonClasses(topLevel === 'threeBall')}>
            {t('gameSetup.threeBall')}
        </button>
      </div>
      
      {topLevel === 'threeBall' && (
         <div className="pl-4 border-l-2 border-teal-500 ml-4 flex flex-col gap-3 mb-8 animate-fade-in">
             <button onClick={() => setThreeBallType('gameSetup.freeGame')} className={buttonClasses(threeBallType === 'gameSetup.freeGame')}>
                {t('gameSetup.freeGame')}
             </button>
             <button onClick={() => setThreeBallType('gameSetup.oneCushion')} className={buttonClasses(threeBallType === 'gameSetup.oneCushion')}>
                {t('gameSetup.oneCushion')}
             </button>
             <button onClick={() => setThreeBallType('gameSetup.threeCushion')} className={buttonClasses(threeBallType === 'gameSetup.threeCushion')}>
                {t('gameSetup.threeCushion')}
             </button>
         </div>
      )}

      <button 
        onClick={handleStart} 
        disabled={!finalGameType}
        className="w-full bg-green-500 text-white font-bold py-4 rounded-lg text-xl shadow-md transition-all duration-200 enabled:hover:bg-green-600 enabled:hover:scale-105 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
        {t('gameSetup.startGame')}
      </button>
      
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GameSetup;
