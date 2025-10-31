import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type PlayerSlot, type ModalState } from './types';
import HeaderNav from './components/HeaderNav';
import PlayerSelectionModal from './components/PlayerSelectionModal';
import PlayerEditorModal from './components/PlayerEditorModal';
import CameraCaptureModal from './components/CameraCaptureModal';
import PlayerScoreCard from './components/PlayerScoreCard';
import PlayerManager from './components/PlayerManager';

const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [view, setView] = useState<View>('scoreboard');
  
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem('scoreCounter:players');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load players from localStorage', e);
      return [];
    }
  });

  const [playerOneScore, setPlayerOneScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scoreCounter:playerOneScore');
      return saved ? JSON.parse(saved) : 0;
    } catch (e) {
      console.error('Failed to load score from localStorage', e);
      return 0;
    }
  });

  const [playerTwoScore, setPlayerTwoScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scoreCounter:playerTwoScore');
      return saved ? JSON.parse(saved) : 0;
    } catch (e) {
      console.error('Failed to load score from localStorage', e);
      return 0;
    }
  });

  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('scoreCounter:selectedPlayer1Id');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load selected player from localStorage', e);
      return null;
    }
  });
  
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('scoreCounter:selectedPlayer2Id');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load selected player from localStorage', e);
      return null;
    }
  });

  const [isSelectingFor, setIsSelectingFor] = useState<PlayerSlot | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  
  useEffect(() => {
    try {
      localStorage.setItem('scoreCounter:players', JSON.stringify(players));
      localStorage.setItem('scoreCounter:playerOneScore', JSON.stringify(playerOneScore));
      localStorage.setItem('scoreCounter:playerTwoScore', JSON.stringify(playerTwoScore));
      localStorage.setItem('scoreCounter:selectedPlayer1Id', JSON.stringify(selectedPlayer1Id));
      localStorage.setItem('scoreCounter:selectedPlayer2Id', JSON.stringify(selectedPlayer2Id));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [players, playerOneScore, playerTwoScore, selectedPlayer1Id, selectedPlayer2Id]);

  const player1 = useMemo(() => players.find(p => p.id === selectedPlayer1Id) || null, [players, selectedPlayer1Id]);
  const player2 = useMemo(() => players.find(p => p.id === selectedPlayer2Id) || null, [players, selectedPlayer2Id]);
  
  const availablePlayers = useMemo(() => {
    if (!isSelectingFor) return [];
    const otherPlayerId = isSelectingFor === 'player1' ? selectedPlayer2Id : selectedPlayer1Id;
    return players.filter(p => p.id !== otherPlayerId);
  }, [players, isSelectingFor, selectedPlayer1Id, selectedPlayer2Id]);

  const handleSavePlayer = useCallback((playerData: { name: string; avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        const playerToEdit = modalState.player;
        if (playerToEdit && playerToEdit.id) {
            setPlayers(prev => prev.map(p => p.id === playerToEdit.id ? { ...p, ...playerData } : p));
        } else {
            const newPlayer: Player = { id: Date.now().toString(), ...playerData };
            setPlayers(prev => [...prev, newPlayer]);
        }
    }
    setModalState({ view: 'closed' });
  }, [modalState]);
  
  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (selectedPlayer1Id === id) setSelectedPlayer1Id(null);
    if (selectedPlayer2Id === id) setSelectedPlayer2Id(null);
  };

  const openCameraHandler = (editorState: { name: string, avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        setModalState({
            view: 'camera',
            context: {
                originalPlayer: modalState.player,
                ...editorState
            }
        });
    }
  };

  const handleCapturedImage = useCallback((dataUrl: string) => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                ...(context.originalPlayer || { id: '', name: '' }),
                name: context.name,
                avatar: dataUrl
            }
        });
    }
  }, [modalState]);

  const closeCameraHandler = () => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                 ...(context.originalPlayer || { id: '', name: '' }),
                 name: context.name,
                 avatar: context.avatar,
            }
        });
    }
  };

  const handleReset = () => {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
  }
  
  const handleSelectPlayer = (player: Player) => {
    if (isSelectingFor === 'player1') setSelectedPlayer1Id(player.id);
    else if (isSelectingFor === 'player2') setSelectedPlayer2Id(player.id);
    setIsSelectingFor(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 pt-24 font-sans antialiased">
      <HeaderNav currentView={view} onNavigate={setView} />
      
      {isSelectingFor && <PlayerSelectionModal players={availablePlayers} onSelect={handleSelectPlayer} onClose={() => setIsSelectingFor(null)}/>}
      
      {modalState.view === 'playerEditor' && 
        <PlayerEditorModal 
            playerToEdit={modalState.player}
            onSave={handleSavePlayer}
            onClose={() => setModalState({ view: 'closed' })}
            onOpenCamera={openCameraHandler}
        />}
        
      {modalState.view === 'camera' && 
        <CameraCaptureModal 
            onCapture={handleCapturedImage} 
            onClose={closeCameraHandler} 
        />}

      <main className="w-full max-w-4xl flex flex-col items-center">
        {view === 'scoreboard' ? (
          <>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <div className="flex flex-col md:flex-row gap-8 mb-8 w-full">
              <PlayerScoreCard player={player1} titleKey="selectPlayer1" score={playerOneScore}
                onIncrement={() => setPlayerOneScore(s => s + 1)}
                onDecrement={() => setPlayerOneScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player1')}
              />
              <PlayerScoreCard player={player2} titleKey="selectPlayer2" score={playerTwoScore}
                onIncrement={() => setPlayerTwoScore(s => s + 1)}
                onDecrement={() => setPlayerTwoScore(s => Math.max(0, s - 1))}
                onSelectPlayer={() => setIsSelectingFor('player2')}
              />
            </div>
            <div className="text-center">
              <button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('reset')}
              </button>
            </div>
          </>
        ) : (
          <PlayerManager 
            players={players}
            onAddPlayer={() => setModalState({ view: 'playerEditor' })}
            onEditPlayer={(p) => setModalState({ view: 'playerEditor', player: p })}
            onDeletePlayer={deletePlayer}
          />
        )}
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
