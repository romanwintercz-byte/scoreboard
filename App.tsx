import React, { useState, useMemo, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type ModalState, type GameMode } from './types';
import HeaderNav from './HeaderNav';
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
  
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}


const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [view, setView] = useState<View>('scoreboard');
  
  const [players, setPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
  const [scores, setScores] = useLocalStorageState<{ [playerId: string]: number }>('scoreCounter:scores', {});
  const [activePlayerIds, setActivePlayerIds] = useLocalStorageState<string[]>('scoreCounter:activePlayerIds', []);
  const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);
  
  const [gameInfo, setGameInfo] = useLocalStorageState<{ type: string; mode: GameMode } | null>('scoreCounter:gameInfo', null);

  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });

  const activePlayers = useMemo(() => 
    activePlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p),
    [players, activePlayerIds]
  );
  
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
    setActivePlayerIds(prev => prev.filter(pId => pId !== id));
    setScores(prev => {
      const newScores = {...prev};
      delete newScores[id];
      return newScores;
    });
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
    const newScores: { [playerId: string]: number } = {};
    activePlayerIds.forEach(id => {
      newScores[id] = 0;
    });
    setScores(newScores);
  }

  const handleChangeGame = () => {
    setGameInfo(null);
    setActivePlayerIds([]);
    setScores({});
  }
  
  const handleGameStart = (playerIds: string[], type: string, mode: GameMode) => {
    setGameInfo({ type, mode });
    setActivePlayerIds(playerIds);
    
    const newScores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      newScores[id] = 0;
    });
    setScores(newScores);

    setLastPlayedPlayerIds(prev => {
      const newOrder = [...playerIds];
      prev.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      return newOrder;
    });
  }
  
  const handleScoreChange = (playerId: string, delta: number) => {
    setScores(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + delta)
    }));
  };

  const renderScoreboard = () => {
    if (activePlayers.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
          <p className="text-gray-400">{t('noPlayersSelected')}</p>
        </div>
      );
    }
    
    return (
      <div className={`grid gap-6 w-full ${activePlayers.length > 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {activePlayers.map(player => (
          <PlayerScoreCard 
            key={player.id}
            player={player}
            score={scores[player.id] || 0}
            onIncrement={() => handleScoreChange(player.id, 1)}
            onDecrement={() => handleScoreChange(player.id, -1)}
            onSelectPlayer={() => {}} // This is now handled by GameSetup
            titleKey="" // Not needed as player is always present here
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 pt-24 font-sans antialiased">
      <HeaderNav currentView={view} onNavigate={setView} />
      
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

      <main className="w-full max-w-5xl flex flex-col items-center">
        {view === 'scoreboard' ? (
          !gameInfo ? (
            <GameSetup 
              allPlayers={players} 
              lastPlayedPlayerIds={lastPlayedPlayerIds}
              onGameStart={handleGameStart} 
            />
          ) : (
          <>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <p className="text-center text-teal-300 mb-6 font-semibold">
              {t('gameMode', { context: gameInfo.mode, type: gameInfo.type })}
            </p>

            <div className="w-full mb-8">
              {renderScoreboard()}
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
