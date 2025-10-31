import React, { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type ModalState, type GameMode } from './types';
import HeaderNav from './HeaderNav';
import PlayerEditorModal from './PlayerEditorModal';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerManager from './PlayerManager';
import GameSetup from './GameSetup';
import PlayerScoreCard from './PlayerScoreCard';
import ScoreInputPad from './ScoreInputPad';
import MinimizedPlayerCard from './MinimizedPlayerCard';

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
  const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);
  
  const [gameInfo, setGameInfo] = useLocalStorageState<{
    type: string;
    mode: GameMode;
    playerIds: string[];
    targetScore: number;
    currentPlayerIndex: number;
  } | null>('scoreCounter:gameInfo', null);

  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  const [gameHistory, setGameHistory] = useLocalStorageState<Array<{ scores: { [playerId: string]: number }, currentPlayerIndex: number }>>('scoreCounter:gameHistory', []);

  // Transient state for the current turn
  const [turnScore, setTurnScore] = useState(0);
  
  const activePlayers = useMemo(() => 
    gameInfo?.playerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p) || [],
    [players, gameInfo]
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
    if (gameInfo) {
      const newPlayerIds = gameInfo.playerIds.filter(pId => pId !== id);
      if (newPlayerIds.length < gameInfo.playerIds.length) {
        setGameInfo({
          ...gameInfo,
          playerIds: newPlayerIds,
          currentPlayerIndex: 0 // Reset turn on player deletion
        });
      }
    }
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
  
  const handleChangeGame = () => {
    setGameInfo(null);
    setScores({});
    setTurnScore(0);
    setGameHistory([]);
  }
  
  const handleGameStart = (playerIds: string[], type: string, mode: GameMode, targetScore: number) => {
    setGameInfo({ type, mode, playerIds, targetScore, currentPlayerIndex: 0 });
    
    const newScores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      newScores[id] = 0;
    });
    setScores(newScores);
    setTurnScore(0);
    setGameHistory([]);

    setLastPlayedPlayerIds(prev => {
      const newOrder = [...playerIds];
      prev.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      return newOrder.slice(0, 10);
    });
  }
  
  const handleAddToTurn = (points: number) => {
    setTurnScore(prev => prev + points);
  }

  const handleEndTurn = () => {
    if (!gameInfo) return;

    // Save current state to history before changing it
    setGameHistory(prev => [...prev, { scores, currentPlayerIndex: gameInfo.currentPlayerIndex }]);
    
    const currentPlayer = activePlayers[gameInfo.currentPlayerIndex];
    if (currentPlayer) {
      setScores(prev => ({
        ...prev,
        [currentPlayer.id]: (prev[currentPlayer.id] || 0) + turnScore
      }));
    }
    setTurnScore(0);
    setGameInfo(prev => {
      if (!prev) return null;
      const nextIndex = (prev.currentPlayerIndex + 1) % prev.playerIds.length;
      return { ...prev, currentPlayerIndex: nextIndex };
    });
  };

  const handleUndoLastTurn = () => {
    if (gameHistory.length > 0) {
      const lastState = gameHistory[gameHistory.length - 1];
      const newHistory = gameHistory.slice(0, -1);

      setScores(lastState.scores);
      setGameInfo(prev => prev ? { ...prev, currentPlayerIndex: lastState.currentPlayerIndex } : null);
      setGameHistory(newHistory);
      setTurnScore(0);
    }
  };

  const renderScoreboard = () => {
    if (!gameInfo || activePlayers.length === 0) {
      return (
        <GameSetup 
          allPlayers={players} 
          lastPlayedPlayerIds={lastPlayedPlayerIds}
          onGameStart={handleGameStart} 
        />
      );
    }

    const currentPlayer = activePlayers[gameInfo.currentPlayerIndex];
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <p className="text-right text-teal-300 font-semibold">
              {t('gameMode', { context: gameInfo.mode, type: gameInfo.type })}
              <br/>
              <span className="text-sm text-gray-400">{t('gameSetup.targetScore')}: {gameInfo.targetScore}</span>
            </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
            {/* Minimized Player Cards */}
            <div className="w-full md:w-1/4 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2">
                {activePlayers.map(player => (
                    <MinimizedPlayerCard 
                        key={player.id}
                        player={player}
                        score={scores[player.id] || 0}
                        isActive={player.id === currentPlayer?.id}
                    />
                ))}
            </div>

            {/* Active Player Area */}
            <div className="w-full md:w-3/4">
                {currentPlayer && (
                  <>
                    <PlayerScoreCard
                        player={currentPlayer}
                        score={scores[currentPlayer.id] || 0}
                        turnScore={turnScore}
                    />
                    <ScoreInputPad 
                      onScore={handleAddToTurn}
                      onEndTurn={handleEndTurn}
                    />
                  </>
                )}
            </div>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={handleChangeGame} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
            {t('changeGame')}
          </button>
          <button 
            onClick={handleUndoLastTurn} 
            disabled={gameHistory.length === 0}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {t('undoTurn')}
          </button>
        </div>
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
        {view === 'scoreboard' ? renderScoreboard() : (
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