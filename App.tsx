import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PlayerCard: React.FC<{
  name: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  playerNameKey: string;
}> = ({ name, score, onIncrement, onDecrement, playerNameKey }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full text-center transform transition-transform duration-300">
      <h2 className="text-3xl font-bold text-teal-400 mb-4">{name}</h2>
      <p className="text-8xl font-mono font-extrabold text-white mb-6">{score}</p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onDecrement}
          aria-label={t('aria.decrement', { player: name })}
          className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out"
        >
          -
        </button>
        <button
          onClick={onIncrement}
          aria-label={t('aria.increment', { player: name })}
          className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out"
        >
          +
        </button>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const { t, i18n } = useTranslation();

  const handleReset = () => {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans antialiased">
      <header className="absolute top-4 right-4">
        <button 
          onClick={() => changeLanguage('cs')} 
          className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language === 'cs' ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}
        >
          CS
        </button>
        <span className="text-gray-500">|</span>
        <button 
          onClick={() => changeLanguage('en')}
          className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language === 'en' ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}
        >
          EN
        </button>
      </header>

      <main className="w-full max-w-4xl">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
          {t('title')}
        </h1>
        
        <div className="flex flex-col md:flex-row gap-8 mb-8">
            <PlayerCard 
              name={t('player1')}
              playerNameKey="player1"
              score={playerOneScore}
              onIncrement={() => setPlayerOneScore(s => s + 1)}
              onDecrement={() => setPlayerOneScore(s => Math.max(0, s - 1))}
            />
            <PlayerCard 
              name={t('player2')}
              playerNameKey="player2"
              score={playerTwoScore}
              onIncrement={() => setPlayerTwoScore(s => s + 1)}
              onDecrement={() => setPlayerTwoScore(s => Math.max(0, s - 1))}
            />
        </div>

        <div className="text-center">
          <button
            onClick={handleReset}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-400"
          >
            {t('reset')}
          </button>
        </div>
      </main>
      <footer className="mt-8 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;


