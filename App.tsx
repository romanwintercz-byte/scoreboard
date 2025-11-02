import React, { useState, useMemo, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import { Player, View, ModalState, GameSummary, Tournament, Match, TournamentSettings, GameRecord, AllStats, GameInfo } from './types';

import HeaderNav from './HeaderNav';
import PlayerEditorModal from './PlayerEditorModal';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerManager from './PlayerManager';
import GameSetup from './GameSetup';
import StatsView from './StatsView';
import PlayerProfileModal from './PlayerProfileModal';
import FirstTimeUserModal from './FirstTimeUserModal';
import PostGameSummary from './PostGameSummary';
import TournamentView from './TournamentView';
import Scoreboard from './Scoreboard';
import TeamScoreboard from './TeamScoreboard';

// --- HOOK MOVED HERE TO FIX BUILD ISSUE ---
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
      if (storedValue) {
        const item = JSON.parse(storedValue);
        
        if (Array.isArray(defaultValue) && !Array.isArray(item)) {
          console.warn(`LocalStorage for key "${key}" is not an array, resetting to default.`);
          return defaultValue;
        }

        return item ?? defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key “${key}”:`, error);
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


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [view, setView] = useState<View>('scoreboard');
  
  const [players, setPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
  const [scores, setScores] = useLocalStorageState<{ [playerId: string]: number }>('scoreCounter:scores', {});
  const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);
  
  const [gameInfo, setGameInfo] = useLocalStorageState<GameInfo | null>('scoreCounter:gameInfo', null);
  const [postGameSummary, setPostGameSummary] = useState<GameSummary | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  const [gameHistory, setGameHistory] = useLocalStorageState<Array<{ scores: { [playerId: string]: number }, currentPlayerIndex: number }>>('scoreCounter:gameHistory', []);
  const [stats, setStats] = useLocalStorageState<AllStats>('scoreCounter:stats', {});
  const [completedGamesLog, setCompletedGamesLog] = useLocalStorageState<GameRecord[]>('scoreCounter:gameLog', []);
  const [tournaments, setTournaments] = useLocalStorageState<Tournament[]>('scoreCounter:tournaments', []);

  // Transient state
  const [turnScore, setTurnScore] = useState(0);
  const [isTurnTransitioning, setIsTurnTransitioning] = useState(false);
  const isInitialMount = useRef(true);
  
  const activePlayers = useMemo(() => 
    gameInfo?.playerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p) || [],
    [players, gameInfo]
  );
  
  const turnsPerPlayer = useMemo(() => {
      const turns: { [id: string]: number } = {};
      if (gameInfo) {
          gameInfo.playerIds.forEach(id => (turns[id] = 0));
          gameHistory.forEach(state => {
              const pid = gameInfo.playerIds[state.currentPlayerIndex];
              if (pid) turns[pid]++;
          });
      }
      return turns;
  }, [gameHistory, gameInfo]);
  
  const activePlayersWithStats = useMemo(() => {
    if (!gameInfo) return [];

    return activePlayers.map(player => {
        const playerGames = completedGamesLog
            .filter(g => g.playerId === player.id && g.gameType === gameInfo.type)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const sourceGames = playerGames.length >= 10 ? playerGames.slice(0, 10) : playerGames;
        const totalScore = sourceGames.reduce((sum, game) => sum + game.score, 0);
        const totalTurns = sourceGames.reduce((sum, game) => sum + game.turns, 0);
        const movingAverage = totalTurns > 0 ? totalScore / totalTurns : 0;

        const lastSixResults = playerGames.slice(0, 6).map(g => g.result).reverse();

        return { ...player, movingAverage, lastSixResults };
    });
  }, [activePlayers, gameInfo?.type, completedGamesLog]);

  useEffect(() => {
      if (isInitialMount.current) {
          isInitialMount.current = false;
      } else if (gameInfo) {
          setIsTurnTransitioning(true);
          const timer = setTimeout(() => {
              setIsTurnTransitioning(false);
          }, 600);
          return () => clearTimeout(timer);
      }
  }, [gameInfo?.currentPlayerIndex]);


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
    const isPlayerInTournament = tournaments.some(t => 
        t.status === 'ongoing' && t.playerIds.includes(id)
    );

    if (isPlayerInTournament) {
        alert(t('tournament.cannotDeletePlayer'));
        return;
    }
    
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
  
  const handleGameStart = (
      playerIds: string[], 
      gameTypeKey: string, 
      mode: GameInfo['mode'], 
      targetScore: number, 
      endCondition: GameInfo['endCondition'],
      allowOvershooting: boolean,
      handicap?: { playerId: string, points: number },
      tournamentContext?: GameInfo['tournamentContext']
    ) => {
    const turnStats: GameInfo['turnStats'] = {};
    playerIds.forEach(id => {
      turnStats[id] = { clean10s: 0, clean20s: 0, zeroInnings: 0 };
    });

    setGameInfo({ type: gameTypeKey, mode, playerIds, targetScore, currentPlayerIndex: 0, endCondition, allowOvershooting, turnStats, handicap, tournamentContext });
    
    const newScores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      newScores[id] = 0;
    });

    if (handicap) {
      newScores[handicap.playerId] = handicap.points;
    }

    setScores(newScores);
    setTurnScore(0);
    setGameHistory([]);
    setView('scoreboard');

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
  
  const handleAddToTurn = (scoreData: { points: number, type: string }) => {
    const { points, type } = scoreData;
    setTurnScore(prev => prev + points);
    
    if (!gameInfo) return;
    const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];
    if (!currentPlayerId) return;

    if (type === 'clean10' || type === 'clean20') {
      const newTurnStats = { ...gameInfo.turnStats };
      const playerTurnStats = { ...newTurnStats[currentPlayerId] };
      if (type === 'clean10') playerTurnStats.clean10s++;
      if (type === 'clean20') playerTurnStats.clean20s++;
      newTurnStats[currentPlayerId] = playerTurnStats;
      setGameInfo({ ...gameInfo, turnStats: newTurnStats });
    }
  }
  
  const handleSaveGameStats = (summary: GameSummary) => {
      const { gameInfo: finishedGameInfo, finalScores, winnerIds, turnsPerPlayer } = summary;
      const { type: gameTypeKey, playerIds, turnStats = {}, handicap } = finishedGameInfo;
      const gameId = Date.now().toString();

      setStats(prevStats => {
          const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
          if (!newStats[gameTypeKey]) newStats[gameTypeKey] = {};
          const gameStats = newStats[gameTypeKey];

          playerIds.forEach(playerId => {
              if (!gameStats[playerId]) {
                  gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
              }
              const playerStats = gameStats[playerId];
              const handicapPoints = (handicap?.playerId === playerId) ? handicap.points : 0;
              const earnedScore = (finalScores[playerId] || 0) - handicapPoints;
              const isWin = winnerIds.includes(playerId) && winnerIds.length === 1;
              const isDraw = winnerIds.includes(playerId) && winnerIds.length > 1;

              playerStats.gamesPlayed++;
              playerStats.totalTurns += turnsPerPlayer[playerId] || 0;
              playerStats.totalScore += earnedScore;
              playerStats.zeroInnings += turnStats[playerId]?.zeroInnings || 0;
              if (isWin) {
                  playerStats.wins++;
              } else if (!isDraw) {
                  playerStats.losses++;
              }
          });
          return newStats;
      });
      
      const newGameRecords: GameRecord[] = playerIds.map(playerId => {
        const handicapPoints = (handicap?.playerId === playerId) ? handicap.points : 0;
        const earnedScore = (finalScores[playerId] || 0) - handicapPoints;
        const isWin = winnerIds.includes(playerId) && winnerIds.length === 1;
        const isDraw = winnerIds.includes(playerId) && winnerIds.length > 1;
        
        let result: GameRecord['result'] = 'loss';
        if (isWin) result = 'win';
        if (isDraw) result = 'draw';

        return {
          gameId,
          playerId,
          gameType: gameTypeKey,
          score: earnedScore,
          turns: turnsPerPlayer[playerId] || 0,
          date: new Date().toISOString(),
          result: result,
          handicapApplied: handicapPoints > 0 ? handicapPoints : undefined,
          zeroInnings: turnStats[playerId]?.zeroInnings || 0,
          clean10s: turnStats[playerId]?.clean10s || 0,
          clean20s: turnStats[playerId]?.clean20s || 0,
        }
      });

      setCompletedGamesLog(prev => [...prev, ...newGameRecords]);
  };
  
  const handleUpdateTournamentMatchResult = (summary: GameSummary) => {
    const { tournamentContext } = summary.gameInfo;
    if (!tournamentContext) return;

    const { tournamentId, matchId } = tournamentContext;
    const { finalScores, winnerIds } = summary;

    setTournaments(prev => {
        return prev.map(t => {
            if (t.id === tournamentId) {
                const updatedMatches = t.matches.map(m => {
                    if (m.id === matchId) {
                        const player1Score = finalScores[m.player1Id] || 0;
                        const player2Score = finalScores[m.player2Id] || 0;
                        let winnerId: string | null = null;
                        if (winnerIds.length === 1) {
                            winnerId = winnerIds[0];
                        } else if (winnerIds.length > 1) {
                            winnerId = null; // Draw
                        } else { // Should not happen if scores differ
                            if (player1Score > player2Score) winnerId = m.player1Id;
                            if (player2Score > player1Score) winnerId = m.player2Id;
                        }

                        return { 
                            ...m, 
                            status: 'completed' as const, 
                            result: { player1Score, player2Score, winnerId }
                        };
                    }
                    return m;
                });

                const allMatchesCompleted = updatedMatches.every(m => m.status === 'completed');
                
                return {
                    ...t,
                    matches: updatedMatches,
                    status: allMatchesCompleted ? 'completed' as const : 'ongoing' as const
                };
            }
            return t;
        });
    });
};

  const handleEndTurn = () => {
    if (!gameInfo) return;

    let { currentPlayerIndex, targetScore, endCondition, playerIds, turnStats = {} } = gameInfo;
    const currentPlayerId = playerIds[currentPlayerIndex];

    if (turnScore === 0) {
        const newTurnStats = { ...turnStats };
        const playerTurnStats = { ...newTurnStats[currentPlayerId] };
        playerTurnStats.zeroInnings++;
        newTurnStats[currentPlayerId] = playerTurnStats;
        turnStats = newTurnStats;
    }
    
    let newPlayerScore = (scores[currentPlayerId] || 0) + turnScore;
    const newScores = { ...scores };
    
    if (endCondition === 'equal-innings' && newPlayerScore >= targetScore && !gameInfo.allowOvershooting) {
      newPlayerScore = targetScore;
    }
    newScores[currentPlayerId] = newPlayerScore;

    const newHistory = [...gameHistory, { scores, currentPlayerIndex }];
    setScores(newScores);
    setGameHistory(newHistory);
    setTurnScore(0);
    
    const updatedGameInfo = { ...gameInfo, turnStats };

    const endGame = (winners: string[]) => {
      const finalHistory = [...newHistory, { scores: newScores, currentPlayerIndex }];

      const turnsPerPlayer: { [playerId: string]: number } = {};
      playerIds.forEach(id => turnsPerPlayer[id] = 0);
      
      finalHistory.forEach((state, index) => {
          const playerId = playerIds[state.currentPlayerIndex];
          if (playerId && index < finalHistory.length -1) turnsPerPlayer[playerId]++;
      });
      turnsPerPlayer[currentPlayerId]++;

      const summary = { gameInfo: updatedGameInfo, finalScores: newScores, winnerIds: winners, turnsPerPlayer, gameHistory: finalHistory };
      
      handleSaveGameStats(summary);

      if (updatedGameInfo.tournamentContext) {
          handleUpdateTournamentMatchResult(summary);
          setView('tournament');
          setGameInfo(null);
      } else {
          setPostGameSummary(summary);
          setGameInfo(null);
      }
    };

    const hasReachedTarget = newPlayerScore >= targetScore;
    let nextGameInfo = { ...updatedGameInfo };

    if (gameInfo.mode === 'team') {
        const currentPlayerTeamIndex = currentPlayerIndex % 2;
        const teamIds = playerIds.filter((_, i) => i % 2 === currentPlayerTeamIndex);
        const teamScore = teamIds.reduce((sum, id) => sum + (newScores[id] || 0), 0);
        const teamHasReachedTarget = teamScore >= targetScore;

        if (teamHasReachedTarget) {
            if (endCondition === 'sudden-death') {
                endGame(teamIds);
                return;
            }
            if (endCondition === 'equal-innings') {
                const finished = nextGameInfo.finishedPlayerIds || [];
                const newFinished = [...new Set([...finished, ...teamIds])];
                if (!nextGameInfo.playoutInfo) {
                    nextGameInfo.playoutInfo = { startingPlayerIndex: currentPlayerIndex };
                }
                nextGameInfo.finishedPlayerIds = newFinished;
            }
        }
    } else { // Round-robin
        if (hasReachedTarget) {
            if (endCondition === 'sudden-death') {
                endGame([currentPlayerId]);
                return;
            }
            if (endCondition === 'equal-innings') {
                const finished = nextGameInfo.finishedPlayerIds || [];
                if (!finished.includes(currentPlayerId)) {
                    nextGameInfo.finishedPlayerIds = [...finished, currentPlayerId];
                }
                if (!nextGameInfo.playoutInfo) {
                    nextGameInfo.playoutInfo = { startingPlayerIndex: currentPlayerIndex };
                }
            }
        }
    }
    
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
      const allFinished = (nextGameInfo.finishedPlayerIds?.length || 0) === playerIds.length;

      if (playoutRoundComplete || allFinished) {
          let winners: string[];
          if (gameInfo.mode === 'team') {
              const team1Ids = playerIds.filter((_, i) => i % 2 === 0);
              const team2Ids = playerIds.filter((_, i) => i % 2 !== 0);
              const team1Score = team1Ids.reduce((sum, id) => sum + (newScores[id] || 0), 0);
              const team2Score = team2Ids.reduce((sum, id) => sum + (newScores[id] || 0), 0);
              if (team1Score > team2Score) winners = team1Ids;
              else if (team2Score > team1Score) winners = team2Ids;
              else winners = [...team1Ids, ...team2Ids]; // Draw
          } else {
              const highestScore = Math.max(...Object.values(newScores));
              winners = playerIds.filter(id => newScores[id] >= highestScore);
          }
          endGame(winners);
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

  const handleRematch = () => {
    if (!postGameSummary) return;
    const { gameInfo } = postGameSummary;
    const reversedPlayerIds = [...gameInfo.playerIds].reverse();
    handleGameStart(reversedPlayerIds, gameInfo.type, gameInfo.mode, gameInfo.targetScore, gameInfo.endCondition, gameInfo.allowOvershooting || false, gameInfo.handicap);
    setPostGameSummary(null);
  };
  
  const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
    const matches: Match[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        matches.push({
          id: `${Date.now()}-${i}-${j}`,
          player1Id: playerIds[i],
          player2Id: playerIds[j],
          status: 'pending',
        });
      }
    }
    
    const newTournament: Tournament = {
      id: Date.now().toString(),
      name,
      playerIds,
      settings,
      matches,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
    };

    setTournaments(prev => [...prev, newTournament]);
  };
  
  const handleStartTournamentMatch = (tournament: Tournament, match: Match) => {
    handleGameStart(
      [match.player1Id, match.player2Id],
      tournament.settings.gameTypeKey,
      'round-robin',
      tournament.settings.targetScore,
      tournament.settings.endCondition,
      false, // Overshooting is off by default for tournaments
      undefined,
      { tournamentId: tournament.id, matchId: match.id }
    );
  };

  const handleGenerateSampleData = () => {
    const PREDEFINED_AVATARS = [
      'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z', 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z', 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    ];
    const names = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
    const gameTypeKeys = ['gameSetup.freeGame', 'gameSetup.oneCushion', 'gameSetup.threeCushion', 'gameSetup.fourBall'];

    const newPlayers: Player[] = names.map((name, index) => ({
      id: `sample-${index}-${Date.now()}`,
      name: name,
      avatar: PREDEFINED_AVATARS[index % PREDEFINED_AVATARS.length],
    }));

    const newGameLog: GameRecord[] = [];
    
    for (let i = 0; i < 40; i++) {
        const p1Index = Math.floor(Math.random() * newPlayers.length);
        let p2Index = Math.floor(Math.random() * newPlayers.length);
        while (p1Index === p2Index) {
            p2Index = Math.floor(Math.random() * newPlayers.length);
        }
        const p1 = newPlayers[p1Index];
        const p2 = newPlayers[p2Index];
        const gameType = gameTypeKeys[Math.floor(Math.random() * gameTypeKeys.length)];
        const date = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (Math.random()*5));
        
        const gameId = `game-${i}-${date.getTime()}`;

        const turns = Math.floor(Math.random() * 20) + 5;
        const score1 = Math.floor(Math.random() * (turns * 2.5));
        const score2 = Math.floor(Math.random() * (turns * 2.5));

        newGameLog.push({
            gameId,
            playerId: p1.id, gameType, score: score1, turns, date: date.toISOString(),
            result: score1 > score2 ? 'win' : 'loss',
            zeroInnings: Math.floor(Math.random() * (turns / 3)),
            clean10s: Math.floor(Math.random() * 3), clean20s: Math.floor(Math.random() * 2),
        });
        newGameLog.push({
            gameId,
            playerId: p2.id, gameType, score: score2, turns, date: date.toISOString(),
            result: score2 > score1 ? 'win' : 'loss',
            zeroInnings: Math.floor(Math.random() * (turns / 3)),
            clean10s: Math.floor(Math.random() * 3), clean20s: Math.floor(Math.random() * 2),
        });
    }

    const newStats: AllStats = {};
    newGameLog.forEach(record => {
      const { playerId, gameType, score, turns, result, zeroInnings } = record;
      if (!newStats[gameType]) newStats[gameType] = {};
      const gameStats = newStats[gameType];
      if (!gameStats[playerId]) {
        gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
      }
      const playerStats = gameStats[playerId];

      playerStats.gamesPlayed++;
      playerStats.totalTurns += turns;
      playerStats.totalScore += score;
      playerStats.zeroInnings += zeroInnings;
      if (result === 'win') {
        playerStats.wins++;
      } else if (result === 'loss') {
        playerStats.losses++;
      }
    });
    
    setPlayers(newPlayers);
    setCompletedGamesLog(newGameLog);
    setStats(newStats);

    setModalState({ view: 'closed' });
    setView('playerManager');
  };

  return (
    <div className="min-h-screen flex flex-col items-center text-white p-4 pt-24 font-sans antialiased">
      {/* Modals */}
      {modalState.view === 'playerEditor' && (
        <PlayerEditorModal 
            playerToEdit={modalState.player}
            onSave={handleSavePlayer}
            onClose={() => setModalState({ view: 'closed' })}
            onOpenCamera={openCameraHandler}
        />
      )}
      {modalState.view === 'camera' && (
        <CameraCaptureModal 
            onCapture={handleCapturedImage} 
            onClose={closeCameraHandler} 
        />
      )}
      {modalState.view === 'playerStats' && (
        <PlayerProfileModal
            player={modalState.player}
            stats={stats}
            gameLog={completedGamesLog}
            players={players}
            onClose={() => setModalState({ view: 'closed' })}
        />
      )}
      {modalState.view === 'firstTimeUser' && (
        <FirstTimeUserModal
            onGenerate={handleGenerateSampleData}
            onAdd={() => {
                setModalState({ view: 'playerEditor' });
                setView('playerManager');
            }}
            onImport={() => alert(t('firstTime.importAlert'))}
            onClose={() => setModalState({ view: 'closed' })}
        />
      )}

      {/* Header */}
      {!(gameInfo || postGameSummary) ? (
        <HeaderNav currentView={view} onNavigate={handleNavigate} />
      ) : (
         <header className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-50 p-4 flex justify-end items-center z-10">
             <button onClick={handleChangeGame} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                {t('changeGame')}
            </button>
         </header>
      )}
      
      <main className="w-full max-w-5xl flex flex-col items-center">
        {gameInfo ? (
            <div className="w-full">
              <div className="w-full flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-white truncate">
                      {t(gameInfo.type as any)}
                  </h1>
                  <p className="text-xl font-mono text-gray-400">
                      {t('scoreboard.inning', { count: Math.floor(gameHistory.length / activePlayers.length) + 1 })}
                  </p>
              </div>

              <div className={`w-full grid gap-4 transition-all duration-300 ${isTurnTransitioning ? 'animate-turn-transition' : ''}`}>
                  {gameInfo.mode === 'team' ? (
                     <TeamScoreboard 
                        gameInfo={gameInfo}
                        scores={scores}
                        turnScore={turnScore}
                        activePlayersWithStats={activePlayersWithStats}
                        gameHistory={gameHistory}
                        players={players}
                        handleAddToTurn={handleAddToTurn}
                        handleEndTurn={handleEndTurn}
                        handleUndoLastTurn={handleUndoLastTurn}
                     />
                  ) : (
                     <Scoreboard 
                        gameInfo={gameInfo}
                        scores={scores}
                        turnScore={turnScore}
                        activePlayersWithStats={activePlayersWithStats}
                        turnsPerPlayer={turnsPerPlayer}
                        gameHistory={gameHistory}
                        handleAddToTurn={handleAddToTurn}
                        handleEndTurn={handleEndTurn}
                        handleUndoLastTurn={handleUndoLastTurn}
                     />
                  )}
              </div>
            </div>
        ) : postGameSummary ? (
            <PostGameSummary
                summary={postGameSummary}
                players={players}
                onNewGame={() => { setPostGameSummary(null); setView('scoreboard'); }}
                onRematch={handleRematch}
            />
        ) : view === 'scoreboard' ? (
            <GameSetup
                allPlayers={players}
                lastPlayedPlayerIds={lastPlayedPlayerIds}
                gameLog={completedGamesLog}
                onGameStart={handleGameStart}
            />
        ) : view === 'playerManager' ? (
            <PlayerManager
                players={players}
                onAddPlayer={() => setModalState({ view: 'playerEditor' })}
                onEditPlayer={(p) => setModalState({ view: 'playerEditor', player: p })}
                onDeletePlayer={deletePlayer}
                onViewPlayerStats={handleViewPlayerStats}
            />
        ) : view === 'stats' ? (
            <StatsView stats={stats} players={players} />
        ) : view === 'tournament' ? (
             <TournamentView
                tournaments={tournaments}
                players={players}
                gameLog={completedGamesLog}
                onCreateTournament={handleCreateTournament}
                onStartMatch={handleStartTournamentMatch}
            />
        ) : null}
      </main>

    </div>
  );
};

export default App;