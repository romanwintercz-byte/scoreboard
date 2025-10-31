import React, { useState, useCallback } from 'react';

const PlayerCard: React.FC<{
  name: string;
  score: number;
  onIncrement: () => void;
}> = ({ name, score, onIncrement }) => (
  <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg w-full md:w-1/2">
    <h2 className="text-2xl font-semibold text-gray-400 mb-4">{name}</h2>
    <p className="text-7xl font-bold text-white mb-6">{score}</p>
    <button
      onClick={onIncrement}
      className="w-full py-3 text-xl font-bold bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      aria-label={`Přidat bod pro ${name}`}
    >
      +1 Bod
    </button>
  </div>
);

const App: React.FC = () => {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [inning, setInning] = useState(1);

  const handleReset = useCallback(() => {
    setScore1(0);
    setScore2(0);
    setInning(1);
  }, []);

  const handleNextInning = useCallback(() => {
    setInning(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold text-green-400">Počítadlo Karambol</h1>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <PlayerCard name="Hráč 1" score={score1} onIncrement={() => setScore1(s => s + 1)} />
            <PlayerCard name="Hráč 2" score={score2} onIncrement={() => setScore2(s => s + 1)} />
          </div>
          
          <div className="text-center bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Směna (náběh)</h3>
            <p className="text-6xl font-bold text-green-400 mb-4">{inning}</p>
            <button
              onClick={handleNextInning}
              className="w-full py-3 text-lg bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Další směna
            </button>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleReset}
              className="w-full max-w-sm mx-auto py-3 text-lg font-semibold bg-red-800 hover:bg-red-900 text-white rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              Resetovat hru
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
