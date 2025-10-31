import React, { useState, useMemo, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type PlayerSlot, type ModalState } from './types';
import HeaderNav from './HeaderNav';
import PlayerSelectionModal from './PlayerSelectionModal';
import PlayerEditorModal from './PlayerEditorModal';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerScoreCard from './PlayerScoreCard';
import PlayerManager from './PlayerManager';
import GameSetup from './GameSetup';

/**
 * A custom React hook to manage state that persists in localStorage.
 * Inlined into App.tsx to bypass a persistent Vercel build error.
 */
function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(defaultValue);
  const isHydrated = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        setState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    
    isHydrated.current = true;
    
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated.current) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}


const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [view, setView] = useState<View>('scoreboard');
  
  const [players, setPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
  const [playerOneScore, setPlayerOneScore] = useLocalStorageState<number>('scoreCounter:playerOneScore', 0);
  const [playerTwoScore, setPlayerTwoScore] = useLocalStorageState<number>('scoreCounter:playerTwoScore', 0);
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useLocalStorageState<string | null>('scoreCounter:selectedPlayer1Id', null);
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useLocalStorageState<string | null>('scoreCounter:selectedPlayer2Id', null);
  const [gameType, setGameType] = useLocalStorageState<string | null>('scoreCounter:gameType', null);

  const [isSelectingFor, setIsSelectingFor] = useState<PlayerSlot | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });

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
  }, [modalState, setPlayers]);
  
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

  const handleResetScores = () => {
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
  }

  const handleChangeGame = () => {
    setGameType(null);
  }
  
  const handleSelectPlayer = (player: Player) => {
    if (isSelectingFor === 'player1') setSelectedPlayer1Id(player.id);
    else if (isSelectingFor === 'player2') setSelectedPlayer2Id(player.id);
    setIsSelectingFor(null);
  }

  const handleGameStart = (type: string) => {
    setGameType(type);
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
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
          !gameType ? (
            <GameSetup onGameStart={handleGameStart} />
          ) : (
          <>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <p className="text-center text-teal-300 mb-6 font-semibold">{t('gameMode', { type: gameType })}</p>

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
            <div className="flex items-center justify-center gap-4">
              <button onClick={handleChangeGame} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('changeGame')}
              </button>
              <button onClick={handleResetScores} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                {t('resetScores')}
              </button>
            </div>
          </>
          )
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