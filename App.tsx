import React, { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type View, type ModalState, type GameMode, type AllStats, type GameInfo, type GameRecord } from './types';
import HeaderNav from './HeaderNav';
import PlayerEditorModal from './PlayerEditorModal';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerManager from './PlayerManager';
import GameSetup from './GameSetup';
import PlayerScoreCard from './PlayerScoreCard';
import ScoreInputPad from './ScoreInputPad';
import MinimizedPlayerCard from './MinimizedPlayerCard';
import StatsView from './StatsView';
import PlayerProfileModal from './PlayerProfileModal';
import FirstTimeUserModal from './FirstTimeUserModal';

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
  const [completedGamesLog, setCompletedGamesLog] = useLocalStorageState<GameRecord[]>('scoreCounter:gameLog', []);


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

      const turnsPerPlayer: { [playerId: string]: number } = {};
      playerIds.forEach(id => turnsPerPlayer[id] = 0);
      
      finalTurnHistory.forEach(state => {
          const playerId = playerIds[state.currentPlayerIndex];
          if (playerId) turnsPerPlayer[playerId]++;
      });
      
      if(finalWinnerTurn && winnerIds.length > 0) {
        const winnerId = winnerIds[0];
        if(turnsPerPlayer[winnerId] !== undefined) {
           turnsPerPlayer[winnerId]++;
        }
      }

      setStats(prevStats => {
          const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
          if (!newStats[gameType]) newStats[gameType] = {};
          const gameStats = newStats[gameType];

          playerIds.forEach(playerId => {
              if (!gameStats[playerId]) {
                  gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, highestScoreInGame: 0 };
              }
              const playerStats = gameStats[playerId];
              const finalScore = finalScores[playerId] || 0;
              const isWin = winnerIds.includes(playerId);

              playerStats.gamesPlayed += 1;
              playerStats.totalTurns += turnsPerPlayer[playerId] || 0;
              playerStats.totalScore += finalScore;
              playerStats.highestScoreInGame = Math.max(playerStats.highestScoreInGame || 0, finalScore);
              if (isWin) {
                  playerStats.wins += 1;
              } else {
                  playerStats.losses += 1;
              }
          });

          return newStats;
      });

      const newGameRecords: GameRecord[] = playerIds.map(playerId => ({
        playerId,
        gameType,
        score: finalScores[playerId] || 0,
        turns: turnsPerPlayer[playerId] || 0,
        date: new Date().toISOString(),
        isWin: winnerIds.includes(playerId),
      }));

      setCompletedGamesLog(prev => [...prev, ...newGameRecords]);
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
    
  const handleNavigate = (targetView: View) => {
    if (targetView === 'playerManager' && players.length === 0) {
      setModalState({ view: 'firstTimeUser' });
    } else {
      setView(targetView);
    }
  };
  
  const handleGenerateSampleData = () => {
    const PREDEFINED_AVATARS = [
      'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z', 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z', 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    ];
    const names = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
    const gameTypes = [t('gameSetup.freeGame'), t('gameSetup.oneCushion'), t('gameSetup.threeCushion'), t('gameSetup.fourBall')];

    const newPlayers: Player[] = names.map((name, index) => ({
      id: `sample-${index}-${Date.now()}`,
      name: name,
      avatar: PREDEFINED_AVATARS[index % PREDEFINED_AVATARS.length],
    }));

    const newGameLog: GameRecord[] = [];
    newPlayers.forEach(player => {
      const numGames = Math.floor(Math.random() * 15) + 10; // 10 to 25 games per player
      for (let i = 0; i < numGames; i++) {
        const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        const turns = Math.floor(Math.random() * 20) + 5;
        const score = Math.floor(Math.random() * (turns * 2.5));
        const isWin = Math.random() > 0.5;
        
        newGameLog.push({
          playerId: player.id,
          gameType,
          score,
          turns,
          date: new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (Math.random()*5)).toISOString(),
          isWin,
        });
      }
    });

    const newStats: AllStats = {};
    newGameLog.forEach(record => {
      const { playerId, gameType, score, turns, isWin } = record;
      if (!newStats[gameType]) newStats[gameType] = {};
      const gameStats = newStats[gameType];
      if (!gameStats[playerId]) {
        gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, highestScoreInGame: 0 };
      }
      const playerStats = gameStats[playerId];

      playerStats.gamesPlayed++;
      playerStats.totalTurns += turns;
      playerStats.totalScore += score;
      playerStats.highestScoreInGame = Math.max(playerStats.highestScoreInGame, score);
      if (isWin) {
        playerStats.wins++;
      } else {
        playerStats.losses++;
      }
    });
    
    setPlayers(newPlayers);
    setCompletedGamesLog(newGameLog);
    setStats(newStats);

    setModalState({ view: 'closed' });
    setView('playerManager');
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
    const inning = Math.floor(gameHistory.length / activePlayers.length) + 1;
    
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
              {t('title')}
            </h1>
            <div className="text-right">
                <p className="text-teal-300 font-semibold">
                  {t('gameMode', { context: gameInfo.mode, type: gameInfo.type })}
                </p>
                <p className="text-sm text-gray-400">
                  {t('gameSetup.targetScore')}: {gameInfo.targetScore}
                  <span className="ml-4 font-semibold">{t('scoreboard.inning', { count: inning })}</span>
                </p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
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
    <div className={`min-h-screen flex flex-col items-center text-white p-4 font-sans antialiased ${gameInfo ? 'justify-start pt-8' : 'justify-center pt-24'}`}>
      {!gameInfo && <HeaderNav currentView={view} onNavigate={handleNavigate} />}
      
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
        <PlayerProfileModal 
          player={modalState.player}
          stats={stats}
          gameLog={completedGamesLog}
          onClose={() => setModalState({ view: 'closed' })}
        />
      }

      {modalState.view === 'firstTimeUser' &&
        <FirstTimeUserModal
          onGenerate={handleGenerateSampleData}
          onAdd={() => setModalState({ view: 'playerEditor' })}
          onImport={() => alert(t('firstTime.importAlert'))}
          onClose={() => {
            setModalState({ view: 'closed' });
            setView('playerManager');
          }}
        />
      }

      <main className="w-full max-w-5xl flex flex-col items-center">
        {renderMainView()}
      </main>

    </div>
  );
};

export default App;