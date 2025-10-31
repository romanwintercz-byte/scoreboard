import React, { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type ModalState, type GameMode, type AllStats, type GameInfo } from './types';
import HeaderNav from './HeaderNav';
import PlayerEditorModal from './PlayerEditorModal';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerManager from './PlayerManager';
import GameSetup from './GameSetup';
import PlayerScoreCard from './PlayerScoreCard';
import ScoreInputPad from './ScoreInputPad';
import MinimizedPlayerCard from './MinimizedPlayerCard';
import StatsView from './StatsView';
import PlayerOverallStatsModal from './PlayerOverallStatsModal';

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
  
  const [gameInfo, setGameInfo] = useLocalStorageState<GameInfo | null>('scoreCounter:gameInfo', null);

  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  const [gameHistory, setGameHistory] = useLocalStorageState<Array<{ scores: { [playerId: string]: number }, currentPlayerIndex: number }>>('scoreCounter:gameHistory', []);
  const [stats, setStats] = useLocalStorageState<AllStats>('scoreCounter:stats', {});


  // Transient state for the current turn
  const [turnScore, setTurnScore] = useState(0);
  const [turnHistory, setTurnHistory] = useState<number[]>([]);
  
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
    setTurnHistory([]);
    setGameHistory([]);
  }
  
  const handleGameStart = (playerIds: string[], type: string, mode: GameMode, targetScore: number, endCondition: 'sudden-death' | 'equal-innings') => {
    setGameInfo({ type, mode, playerIds, targetScore, currentPlayerIndex: 0, endCondition });
    
    const newScores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      newScores[id] = 0;
    });
    setScores(newScores);
    setTurnScore(0);
    setTurnHistory([]);
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
    setTurnHistory(prev => [...prev, points]);
  }

  const handleUndoTurnAction = () => {
    if (turnHistory.length > 0) {
      const lastAction = turnHistory[turnHistory.length - 1];
      const newHistory = turnHistory.slice(0, -1);
      setTurnScore(prev => prev - lastAction);
      setTurnHistory(newHistory);
    }
  };

  const updateStatsAfterGame = (
    finishedGameInfo: GameInfo,
    finalScores: { [playerId: string]: number },
    winnerIds: string[],
    finalTurnHistory: typeof gameHistory,
    finalWinnerTurn: boolean
  ) => {
      const { type: gameType, playerIds } = finishedGameInfo;

      setStats(prevStats => {
          const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
          
          if (!newStats[gameType]) {
              newStats[gameType] = {};
          }
          const gameStats = newStats[gameType];

          const turnsPerPlayer: { [playerId: string]: number } = {};
          playerIds.forEach(id => turnsPerPlayer[id] = 0);
          
          finalTurnHistory.forEach(state => {
              const playerId = playerIds[state.currentPlayerIndex];
              if (playerId) turnsPerPlayer[playerId]++;
          });
          
          if(finalWinnerTurn && winnerIds.length > 0) {
            // For sudden death, the winner completes one final turn
            const winnerId = winnerIds[0];
            if(turnsPerPlayer[winnerId] !== undefined) {
               turnsPerPlayer[winnerId]++;
            }
          }


          playerIds.forEach(playerId => {
              if (!gameStats[playerId]) {
                  gameStats[playerId] = { gamesPlayed: 0, wins: 0, totalTurns: 0, totalScore: 0, highestScoreInGame: 0 };
              }

              const playerStats = gameStats[playerId];
              const finalScore = finalScores[playerId] || 0;

              playerStats.gamesPlayed += 1;
              playerStats.totalTurns += turnsPerPlayer[playerId] || 0;
              playerStats.totalScore += finalScore;
              playerStats.highestScoreInGame = Math.max(playerStats.highestScoreInGame || 0, finalScore);


              if (winnerIds.includes(playerId)) {
                  playerStats.wins += 1;
              }
          });

          return newStats;
      });
  };

  const handleEndTurn = () => {
    if (!gameInfo) return;

    const { currentPlayerIndex, targetScore, endCondition, playerIds } = gameInfo;
    const currentPlayerId = playerIds[currentPlayerIndex];
    
    let newPlayerScore = (scores[currentPlayerId] || 0) + turnScore;
    const newScores = { ...scores };

    const hasReachedTarget = newPlayerScore >= targetScore;

    if (endCondition === 'equal-innings' && hasReachedTarget) {
      newPlayerScore = targetScore; // Cap the score
    }
    newScores[currentPlayerId] = newPlayerScore;

    const newHistory = [...gameHistory, { scores, currentPlayerIndex }];
    setScores(newScores);
    setGameHistory(newHistory);
    setTurnScore(0);
    setTurnHistory([]);

    // --- Game End Logic ---
    if (hasReachedTarget && endCondition === 'sudden-death') {
      updateStatsAfterGame(gameInfo, newScores, [currentPlayerId], newHistory, true);
      setGameInfo(null);
      return;
    }

    let nextGameInfo: GameInfo = { ...gameInfo };
    if (hasReachedTarget && endCondition === 'equal-innings') {
      const finished = nextGameInfo.finishedPlayerIds || [];
      if (!finished.includes(currentPlayerId)) {
        nextGameInfo.finishedPlayerIds = [...finished, currentPlayerId];
      }
      if (!nextGameInfo.playoutInfo) {
        nextGameInfo.playoutInfo = { startingPlayerIndex: currentPlayerIndex };
      }
    }
    
    // Find next active player
    let nextIndex = currentPlayerIndex;
    for (let i = 1; i <= playerIds.length; i++) {
      const potentialIndex = (currentPlayerIndex + i) % playerIds.length;
      if (!nextGameInfo.finishedPlayerIds?.includes(playerIds[potentialIndex])) {
        nextIndex = potentialIndex;
        break;
      }
    }
    nextGameInfo.currentPlayerIndex = nextIndex;

    const isPlayoutActive = !!nextGameInfo.playoutInfo;
    if (isPlayoutActive) {
      const playoutRoundComplete = nextIndex === nextGameInfo.playoutInfo!.startingPlayerIndex;
      const allButOneFinished = (nextGameInfo.finishedPlayerIds?.length || 0) >= playerIds.length - 1;
      const allFinished = (nextGameInfo.finishedPlayerIds?.length || 0) === playerIds.length;


      if (playoutRoundComplete || allButOneFinished || allFinished) {
        const winners = playerIds.filter(id => newScores[id] >= targetScore);
        updateStatsAfterGame(nextGameInfo, newScores, winners, newHistory, false);
        setGameInfo(null);
        return;
      }
    }

    setGameInfo(nextGameInfo);
  };

  const handleUndoLastTurn = () => {
    if (gameHistory.length > 0) {
      const lastState = gameHistory[gameHistory.length - 1];
      const newHistory = gameHistory.slice(0, -1);

      setScores(lastState.scores);
      setGameInfo(prev => prev ? { ...prev, 
        currentPlayerIndex: lastState.currentPlayerIndex,
        finishedPlayerIds: prev.finishedPlayerIds?.filter(id => (lastState.scores[id] || 0) < prev.targetScore),
        playoutInfo: (lastState.scores[prev.playerIds[prev.playoutInfo?.startingPlayerIndex || 0]] || 0) < prev.targetScore ? undefined : prev.playoutInfo
      } : null);
      setGameHistory(newHistory);
      setTurnScore(0);
      setTurnHistory([]);
    }
  };

  const handleViewPlayerStats = (player: Player) => {
    setModalState({ view: 'playerStats', player });
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
                        isFinished={gameInfo.finishedPlayerIds?.includes(player.id)}
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
                      onUndo={handleUndoTurnAction}
                      isUndoDisabled={turnHistory.length === 0}
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

  const renderMainView = () => {
    switch (view) {
      case 'scoreboard':
        return renderScoreboard();
      case 'playerManager':
        return (
          <PlayerManager 
            players={players}
            onAddPlayer={() => setModalState({ view: 'playerEditor' })}
            onEditPlayer={(p) => setModalState({ view: 'playerEditor', player: p })}
            onDeletePlayer={deletePlayer}
            onViewPlayerStats={handleViewPlayerStats}
          />
        );
      case 'stats':
        return <StatsView stats={stats} players={players} />;
      default:
        return renderScoreboard();
    }
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

      {modalState.view === 'playerStats' &&
        <PlayerOverallStatsModal 
          player={modalState.player}
          stats={stats}
          onClose={() => setModalState({ view: 'closed' })}
        />
      }

      <main className="w-full max-w-5xl flex flex-col items-center">
        {renderMainView()}
      </main>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
