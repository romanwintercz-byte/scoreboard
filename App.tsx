import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// --- TYPY ---
type Player = {
  id: string;
  name: string;
};

type View = 'scoreboard' | 'playerManager';
type PlayerSlot = 'player1' | 'player2';


// --- KOMPONENTA: VÝBĚR HRÁČE (MODÁLNÍ OKNO) ---
const PlayerSelectionModal: React.FC<{
  players: Player[];
  onSelect: (player: Player) => void;
  onClose: () => void;
}> = ({ players, onSelect, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-transform duration-300" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-teal-400 mb-6">{t('selectPlayerTitle')}</h2>
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
          {players.length > 0 ? (
            players.map(p => (
              <button key={p.id} onClick={() => onSelect(p)} className="text-white bg-indigo-600 hover:bg-indigo-700 font-semibold py-3 px-4 rounded-lg w-full transition-colors duration-200">
                {p.name}
              </button>
            ))
          ) : (
            <p className="text-gray-400">{t('noAvailablePlayers')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- KOMPONENTA: SPRÁVA HRÁČŮ ---
const PlayerManager: React.FC<{
    players: Player[];
    onAddPlayer: (name: string) => void;
    onUpdatePlayer: (id: string, newName: string) => void;
    onDeletePlayer: (id: string) => void;
}> = ({ players, onAddPlayer, onUpdatePlayer, onDeletePlayer }) => {
    const { t } = useTranslation();
    const [newPlayerName, setNewPlayerName] = useState('');
    const [editingPlayer, setEditingPlayer] = useState<{id: string; name: string} | null>(null);

    const handleAdd = () => {
        if (newPlayerName.trim()) {
            onAddPlayer(newPlayerName.trim());
            setNewPlayerName('');
        }
    };

    const handleUpdate = () => {
        if (editingPlayer && editingPlayer.name.trim()) {
            onUpdatePlayer(editingPlayer.id, editingPlayer.name.trim());
            setEditingPlayer(null);
        }
    };
    
    const handleDelete = (player: Player) => {
        if (window.confirm(t('confirmDelete', { name: player.name }))) {
            onDeletePlayer(player.id);
        }
    }

    return (
        <div className="w-full max-w-md p-4">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-white">{t('managePlayers')}</h1>
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder={t('playerNamePlaceholder')}
                    className="flex-grow bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button onClick={handleAdd} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    {t('addPlayer')}
                </button>
            </div>

            <div className="space-y-3">
                {players.length === 0 && <p className="text-center text-gray-500">{t('noPlayers')}</p>}
                {players.map(player => (
                    <div key={player.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                        {editingPlayer?.id === player.id ? (
                            <input
                                type="text"
                                value={editingPlayer.name}
                                onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                                className="bg-gray-600 text-white rounded px-2 py-1 flex-grow"
                                autoFocus
                            />
                        ) : (
                            <span className="text-white text-lg">{player.name}</span>
                        )}
                        <div className="flex gap-2">
                            {editingPlayer?.id === player.id ? (
                                <>
                                    <button onClick={handleUpdate} className="text-green-400 hover:text-green-300 font-semibold">{t('save')}</button>
                                    <button onClick={() => setEditingPlayer(null)} className="text-gray-400 hover:text-gray-300">{t('cancel')}</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditingPlayer({id: player.id, name: player.name})} className="text-teal-400 hover:text-teal-300 font-semibold">{t('edit')}</button>
                                    <button onClick={() => handleDelete(player)} className="text-red-500 hover:text-red-400 font-semibold">{t('delete')}</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- KOMPONENTA: KARTA HRÁČE NA POČÍTADLE ---
const PlayerScoreCard: React.FC<{
  player: Player | null;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSelectPlayer: () => void;
  titleKey: string;
}> = ({ player, score, onIncrement, onDecrement, onSelectPlayer, titleKey }) => {
  const { t } = useTranslation();
  const playerName = player ? player.name : t(titleKey);

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full text-center transform transition-transform duration-300">
      <h2 className="text-3xl font-bold text-teal-400 mb-4 h-9">{playerName}</h2>
      {player ? (
        <>
            <p className="text-8xl font-mono font-extrabold text-white mb-6">{score}</p>
            <div className="flex justify-center gap-4">
            <button
                onClick={onDecrement}
                aria-label={t('aria.decrement', { player: playerName })}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out"
            >
                -
            </button>
            <button
                onClick={onIncrement}
                aria-label={t('aria.increment', { player: playerName })}
                className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out"
            >
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


// --- HLAVNÍ KOMPONENTA APLIKACE ---
const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // --- STAVY ---
  const [view, setView] = useState<View>('scoreboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerOneScore, setPlayerOneScore] = useState(0);
  const [playerTwoScore, setPlayerTwoScore] = useState(0);
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(null);
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(null);
  const [isSelectingFor, setIsSelectingFor] = useState<PlayerSlot | null>(null);

  // --- ODVOZENÉ STAVY ---
  const player1 = useMemo(() => players.find(p => p.id === selectedPlayer1Id) || null, [players, selectedPlayer1Id]);
  const player2 = useMemo(() => players.find(p => p.id === selectedPlayer2Id) || null, [players, selectedPlayer2Id]);
  
  const availablePlayers = useMemo(() => {
    if (!isSelectingFor) return [];
    const otherPlayerId = isSelectingFor === 'player1' ? selectedPlayer2Id : selectedPlayer1Id;
    return players.filter(p => p.id !== otherPlayerId);
  }, [players, isSelectingFor, selectedPlayer1Id, selectedPlayer2Id]);


  // --- FUNKCE PRO SPRÁVU HRÁČŮ ---
  const addPlayer = (name: string) => {
    const newPlayer: Player = { id: Date.now().toString(), name };
    setPlayers(prev => [...prev, newPlayer]);
  };
  const updatePlayer = (id: string, newName: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };
  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (selectedPlayer1Id === id) setSelectedPlayer1Id(null);
    if (selectedPlayer2Id === id) setSelectedPlayer2Id(null);
  };

  // --- OVLÁDACÍ FUNKCE ---
  const handleReset = () => {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
  }
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
  
  const handleSelectPlayer = (player: Player) => {
    if (isSelectingFor === 'player1') {
        setSelectedPlayer1Id(player.id);
    } else if (isSelectingFor === 'player2') {
        setSelectedPlayer2Id(player.id);
    }
    setIsSelectingFor(null);
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans antialiased">
      {isSelectingFor && (
        <PlayerSelectionModal 
            players={availablePlayers} 
            onSelect={handleSelectPlayer}
            onClose={() => setIsSelectingFor(null)}
        />
      )}
      
      <header className="absolute top-4 right-4 flex items-center gap-4">
        <div>
          <button 
            onClick={() => changeLanguage('cs')} 
            className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('cs') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}
          > CS </button>
          <span className="text-gray-500">|</span>
          <button 
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('en') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}
          > EN </button>
        </div>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        {view === 'scoreboard' ? (
          <>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <div className="flex flex-col md:flex-row gap-8 mb-8 w-full">
              <PlayerScoreCard 
                player={player1}
                titleKey="selectPlayer1"
                score={playerOneScore}
                onIncrement={() => setPlayerOneScore(s => s + 1)}
                onDecrement={() => setPlayerOneScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player1')}
              />
              <PlayerScoreCard 
                player={player2}
                titleKey="selectPlayer2"
                score={playerTwoScore}
                onIncrement={() => setPlayerTwoScore(s => s + 1)}
                onDecrement={() => setPlayerTwoScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player2')}
              />
            </div>
            <div className="text-center flex flex-col sm:flex-row gap-4 items-center">
              <button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('reset')}
              </button>
               <button onClick={() => setView('playerManager')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('managePlayers')}
              </button>
            </div>
          </>
        ) : (
          <>
            <PlayerManager players={players} onAddPlayer={addPlayer} onUpdatePlayer={updatePlayer} onDeletePlayer={deletePlayer} />
            <button onClick={() => setView('scoreboard')} className="mt-6 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
              {t('backToGame')}
            </button>
          </>
        )}
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;


