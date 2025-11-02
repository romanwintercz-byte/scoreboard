import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData } from './useAppData';
import { useTheme, Theme } from './useTheme';
import { triggerHapticFeedback } from './utils';

// --- TYPY ---
import { Player, View, ModalState, GameInfo, GameSummary, AllStats, PlayerStats, GameRecord, Tournament, TournamentSettings, Match } from './types';
import { FALLBACK_AVATAR_PATH } from './constants';

// --- KOMPONENTY ---
import HeaderNav from './HeaderNav';
import PlayerManager from './PlayerManager';
import CameraCaptureModal from './CameraCaptureModal';
import PlayerEditorModal from './PlayerEditorModal';
import GameSetup from './GameSetup';
import Scoreboard from './Scoreboard';
import TeamScoreboard from './TeamScoreboard';
import StatsView from './StatsView';
import PlayerProfileModal from './PlayerProfileModal';
import FirstTimeUserModal from './FirstTimeUserModal';
import PostGameSummary from './PostGameSummary';
import TournamentView from './TournamentView';
import SettingsModal from './SettingsModal';


// --- HLAVNÍ KOMPONENTA APLIKACE ---
const App: React.FC = () => {
  const { t } = useTranslation();
  
  // --- STAVY ---
  const [view, setView] = useState<View>('scoreboard');
  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  
  // --- DATA HOOK ---
  const { 
    players, setPlayers, 
    stats, setStats,
    completedGamesLog, setCompletedGamesLog,
    tournaments, setTournaments,
    lastPlayedPlayerIds, setLastPlayedPlayerIds,
    syncStatus
  } = useAppData();

  // --- HERNÍ STAVY ---
  const [gameState, setGameState] = useState<{
    gameInfo: GameInfo;
    scores: { [playerId: string]: number };
    turnScore: number;
    gameHistory: Array<{ scores: { [playerId: string]: number }; currentPlayerIndex: number }>;
    turnsPerPlayer: { [playerId: string]: number };
  } | null>(null);

  const [postGameSummary, setPostGameSummary] = useState<GameSummary | null>(null);
  
  const [theme, setTheme] = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        }
        setShowInstallPrompt(false);
      });
    }
  };

  // --- První spuštění ---
  useEffect(() => {
    const hasVisited = localStorage.getItem('scoreCounter:hasVisited');
    if (!hasVisited && players.length === 0) {
      setModalState({ view: 'firstTimeUser' });
    }
  }, [players.length]);


  // --- ODVOZENÉ STAVY ---
  const activePlayersWithStats = useMemo(() => {
    if (!gameState) return [];
    
    const getPlayerAverage = (playerId: string, gameTypeKey: string): number => {
        const playerGames = completedGamesLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
        if (playerGames.length === 0) return 0;
        const sourceGames = playerGames.length >= 10 ? playerGames.slice(-10) : playerGames;
        const totalScore = sourceGames.reduce((sum, game) => sum + game.score, 0);
        const totalTurns = sourceGames.reduce((sum, game) => sum + game.turns, 0);
        return totalTurns > 0 ? totalScore / totalTurns : 0;
    };

    return gameState.gameInfo.playerIds
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => !!p)
      .map(p => ({
          ...p,
          movingAverage: getPlayerAverage(p.id, gameState.gameInfo.type),
          lastSixResults: completedGamesLog
              .filter(g => g.playerId === p.id && g.gameType === gameState.gameInfo.type)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 6).map(g => g.result).reverse()
      }));
  }, [gameState, players, completedGamesLog]);


  // --- FUNKCE PRO SPRÁVU HRÁČŮ ---
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
  
  const handleDeletePlayer = (id: string) => {
    const isPlayerInTournament = tournaments.some(t => t.status === 'ongoing' && t.playerIds.includes(id));
    if (isPlayerInTournament) {
        alert(t('tournament.cannotDeletePlayer'));
        return;
    }
    setPlayers(prev => prev.filter(p => p.id !== id));
  };
  
  // --- MODAL & CAMERA HANDLERS ---
  const openCameraHandler = (editorState: { name: string, avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        setModalState({
            view: 'camera',
            context: { originalPlayer: modalState.player, ...editorState }
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
  
  // --- HERNÍ LOGIKA ---
  const handleGameStart = (
    playerIds: string[], 
    gameTypeKey: string, 
    gameMode: 'round-robin' | 'team', 
    targetScore: number,
    endCondition: 'sudden-death' | 'equal-innings',
    allowOvershooting: boolean,
    handicap?: { playerId: string, points: number },
    tournamentContext?: { tournamentId: string; matchId: string }
  ) => {
      const initialScores = playerIds.reduce<{ [key: string]: number }>((acc, id) => {
        acc[id] = 0;
        return acc;
      }, {});
      
      if (handicap) {
        initialScores[handicap.playerId] = handicap.points;
      }
      
      const gameInfo: GameInfo = {
        type: gameTypeKey,
        mode: gameMode,
        playerIds,
        targetScore,
        currentPlayerIndex: 0,
        endCondition,
        allowOvershooting,
        handicap,
        tournamentContext,
        turnStats: playerIds.reduce((acc, id) => ({ ...acc, [id]: { clean10s: 0, clean20s: 0, zeroInnings: 0 } }), {}),
        playoutInfo: { startingPlayerIndex: 0 },
        finishedPlayerIds: [],
      };

      setGameState({
          gameInfo,
          scores: initialScores,
          turnScore: 0,
          gameHistory: [{ scores: initialScores, currentPlayerIndex: 0 }],
          turnsPerPlayer: playerIds.reduce((acc, id) => ({...acc, [id]: 0}), {}),
      });
      setLastPlayedPlayerIds(playerIds);
      setPostGameSummary(null);
      setView('scoreboard');
  };

  const handleChangeGame = () => {
    setGameState(null);
    setPostGameSummary(null);
  };
  
  const handleAddToTurn = (scoreData: { points: number, type: string }) => {
    if (!gameState) return;
    setGameState(prev => {
        if (!prev) return null;
        const newTurnScore = Math.max(0, prev.turnScore + scoreData.points);
        return { ...prev, turnScore: newTurnScore };
    });
  };
  
  const handleEndTurn = () => {
    if (!gameState) return;
    triggerHapticFeedback(50);

    const { gameInfo, scores, turnScore, gameHistory, turnsPerPlayer } = gameState;
    const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];

    const newScores = { ...scores, [currentPlayerId]: (scores[currentPlayerId] || 0) + turnScore };
    const newTurnsPerPlayer = { ...turnsPerPlayer, [currentPlayerId]: (turnsPerPlayer[currentPlayerId] || 0) + 1 };
    
    let newTurnStats = { ...gameInfo.turnStats };
    if (newTurnStats && newTurnStats[currentPlayerId]) {
        if (turnScore === 0) newTurnStats[currentPlayerId]!.zeroInnings++;
        if (turnScore === 10) newTurnStats[currentPlayerId]!.clean10s++;
        if (turnScore === 20) newTurnStats[currentPlayerId]!.clean20s++;
    }

    // --- KONTROLA VÍTĚZE ---
    const winnerId = gameInfo.playerIds.find(id => newScores[id] >= gameInfo.targetScore);
    if (winnerId) {
        const winnerIndex = gameInfo.playerIds.indexOf(winnerId);
        if (gameInfo.endCondition === 'sudden-death' || gameInfo.playoutInfo?.startingPlayerIndex === (winnerIndex + 1) % gameInfo.playerIds.length) {
            endGame(newScores, newTurnsPerPlayer, { ...gameInfo, turnStats: newTurnStats }, gameHistory);
            return;
        } else { // Equal Innings logic
            const newFinishedPlayerIds = [...(gameInfo.finishedPlayerIds || []), winnerId];
            const allPlayersFinished = newFinishedPlayerIds.length === gameInfo.playerIds.length;
            if (allPlayersFinished) {
                endGame(newScores, newTurnsPerPlayer, { ...gameInfo, turnStats: newTurnStats, finishedPlayerIds: newFinishedPlayerIds }, gameHistory);
                return;
            }
             setGameState(prev => {
                if (!prev) return null;
                const nextPlayerIndex = (prev.gameInfo.currentPlayerIndex + 1) % prev.gameInfo.playerIds.length;
                return {
                    ...prev,
                    scores: newScores,
                    turnScore: 0,
                    turnsPerPlayer: newTurnsPerPlayer,
                    gameHistory: [...prev.gameHistory, { scores: newScores, currentPlayerIndex: nextPlayerIndex }],
                    gameInfo: { ...prev.gameInfo, turnStats: newTurnStats, currentPlayerIndex: nextPlayerIndex, finishedPlayerIds: newFinishedPlayerIds }
                };
            });
            return;
        }
    }

    const nextPlayerIndex = (gameInfo.currentPlayerIndex + 1) % gameInfo.playerIds.length;
    
    setGameState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            scores: newScores,
            turnScore: 0,
            turnsPerPlayer: newTurnsPerPlayer,
            gameHistory: [...prev.gameHistory, { scores: newScores, currentPlayerIndex: nextPlayerIndex }],
            gameInfo: { ...prev.gameInfo, currentPlayerIndex: nextPlayerIndex, turnStats: newTurnStats }
        };
    });
  };
  
  const handleUndoLastTurn = () => {
    if (!gameState || gameState.gameHistory.length <= 1) return;
    setGameState(prev => {
        if (!prev || prev.gameHistory.length <= 1) return prev;
        const newHistory = prev.gameHistory.slice(0, -1);
        const lastState = newHistory[newHistory.length - 1];
        const prevPlayerId = prev.gameInfo.playerIds[lastState.currentPlayerIndex];

        return {
            ...prev,
            scores: lastState.scores,
            turnScore: 0,
            gameHistory: newHistory,
            gameInfo: { ...prev.gameInfo, currentPlayerIndex: lastState.currentPlayerIndex },
            turnsPerPlayer: {
                ...prev.turnsPerPlayer,
                [prevPlayerId]: (prev.turnsPerPlayer[prevPlayerId] || 1) - 1,
            }
        };
    });
  };

  const endGame = (finalScores: { [key: string]: number }, finalTurns: { [key: string]: number }, finalGameInfo: GameInfo, finalGameHistory: GameSummary['gameHistory']) => {
    const winnerIds = finalGameInfo.playerIds.filter(id => finalScores[id] >= finalGameInfo.targetScore);
    
    // Ukládání statistik
    const newStats: AllStats = JSON.parse(JSON.stringify(stats)); // Deep copy
    const gameTypeKey = finalGameInfo.type;

    if (!newStats[gameTypeKey]) newStats[gameTypeKey] = {};
    const gameStats = newStats[gameTypeKey];

    const newGameRecords: GameRecord[] = [];
    
    finalGameInfo.playerIds.forEach(playerId => {
        if (!gameStats[playerId]) {
            gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
        }
        const playerStats = gameStats[playerId];
        const isWinner = winnerIds.includes(playerId);
        const earnedScore = finalScores[playerId] - (finalGameInfo.handicap?.playerId === playerId ? finalGameInfo.handicap.points : 0);

        playerStats.gamesPlayed++;
        if (isWinner) playerStats.wins++; else playerStats.losses++;
        playerStats.totalScore += earnedScore;
        playerStats.totalTurns += finalTurns[playerId];
        playerStats.zeroInnings += finalGameInfo.turnStats?.[playerId]?.zeroInnings || 0;
        
        const turnStats = finalGameInfo.turnStats?.[playerId] || { zeroInnings: 0, clean10s: 0, clean20s: 0 };

        newGameRecords.push({
            gameId: Date.now().toString(),
            playerId,
            gameType: gameTypeKey,
            score: earnedScore,
            turns: finalTurns[playerId],
            date: new Date().toISOString(),
            result: isWinner ? 'win' : 'loss',
            handicapApplied: finalGameInfo.handicap?.playerId === playerId ? finalGameInfo.handicap.points : undefined,
            ...turnStats
        });
    });
    
    setStats(newStats);
    setCompletedGamesLog(prev => [...prev, ...newGameRecords]);
    
    if (finalGameInfo.tournamentContext) {
        const { tournamentId, matchId } = finalGameInfo.tournamentContext;
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                const newMatches = t.matches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            status: 'completed',
                            result: {
                                player1Score: finalScores[m.player1Id],
                                player2Score: finalScores[m.player2Id],
                                // FIX: The winner determination logic was flawed for cases with multiple or no winners,
                                // which caused a TypeScript type inference issue. It now correctly assigns a single
                                // winner or null for a draw.
                                winnerId: winnerIds.length === 1 ? winnerIds[0] : null
                            }
                        };
                    }
                    return m;
                });
                const isTournamentFinished = newMatches.every(m => m.status === 'completed');
                return { ...t, matches: newMatches, status: isTournamentFinished ? 'completed' : 'ongoing' };
            }
            return t;
        }));
    }

    setPostGameSummary({
      gameInfo: finalGameInfo,
      finalScores,
      winnerIds,
      turnsPerPlayer: finalTurns,
      gameHistory: [...finalGameHistory, { scores: finalScores, currentPlayerIndex: -1 }]
    });
    
    setGameState(null);
  };
  
  const handleRematch = () => {
      if (!postGameSummary) return;
      const { gameInfo } = postGameSummary;
      handleGameStart(gameInfo.playerIds, gameInfo.type, gameInfo.mode, gameInfo.targetScore, gameInfo.endCondition, gameInfo.allowOvershooting ?? false, gameInfo.handicap, gameInfo.tournamentContext);
  };

  // --- TOURNAMENT LOGIC ---
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
        false, // No overshooting in tournaments for now
        undefined, // No handicap in tournaments for now
        { tournamentId: tournament.id, matchId: match.id }
    );
  };

  // --- First Time User handlers ---
  const handleGenerateSamplePlayers = () => {
    const samplePlayers: Player[] = [
      { id: '1', name: 'John Doe', avatar: FALLBACK_AVATAR_PATH },
      { id: '2', name: 'Jane Smith', avatar: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z' },
      { id: '3', name: 'Peter Jones', avatar: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' },
      { id: '4', name: 'Mary Williams', avatar: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z' },
      { id: '5', name: 'David Brown', avatar: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z' },
      { id: '6', name: 'Susan Miller', avatar: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
      { id: '7', name: 'Michael Davis', avatar: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
      { id: '8', name: 'Patricia Garcia', avatar: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z' },
      { id: '9', name: 'Robert Rodriguez', avatar: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' },
      { id: '10', name: 'Linda Martinez', avatar: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z' }
    ];
    setPlayers(samplePlayers);
    localStorage.setItem('scoreCounter:hasVisited', 'true');
    setModalState({ view: 'closed' });
  };
  const handleShowAddPlayerModal = () => {
    localStorage.setItem('scoreCounter:hasVisited', 'true');
    setModalState({ view: 'playerEditor' });
  };
   const handleImportPlayers = () => {
     alert(t('firstTime.importAlert'));
   };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-[--color-text-primary] p-4 pt-24 font-sans antialiased">
      <HeaderNav 
        currentView={view} 
        onNavigate={(newView) => { setView(newView); setPostGameSummary(null); }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        syncStatus={syncStatus}
      />
      
      {/* --- Modální okna --- */}
      {isSettingsOpen && <SettingsModal currentTheme={theme} onThemeChange={setTheme} onClose={() => setIsSettingsOpen(false)} />}
      
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
            players={players}
            onClose={() => setModalState({ view: 'closed' })}
        />}
        
      {modalState.view === 'firstTimeUser' &&
        <FirstTimeUserModal
            onGenerate={handleGenerateSamplePlayers}
            onAdd={handleShowAddPlayerModal}
            onImport={handleImportPlayers}
            onClose={() => {
                localStorage.setItem('scoreCounter:hasVisited', 'true');
                setModalState({ view: 'closed' });
            }}
        />
      }

      <main className="w-full max-w-4xl flex flex-col items-center">
        {postGameSummary ? (
            <PostGameSummary 
                summary={postGameSummary}
                players={players}
                onNewGame={handleChangeGame}
                onRematch={handleRematch}
            />
        ) : gameState ? (
            <div className="w-full flex flex-col gap-4">
              <h1 className="text-xl md:text-2xl font-bold mb-0 text-center text-[--color-text-secondary]">
                  {t(gameState.gameInfo.type as any)}
              </h1>
              {gameState.gameInfo.mode === 'team' ? (
                <TeamScoreboard 
                    gameInfo={gameState.gameInfo}
                    scores={gameState.scores}
                    turnScore={gameState.turnScore}
                    activePlayersWithStats={activePlayersWithStats}
                    gameHistory={gameState.gameHistory}
                    players={players}
                    handleAddToTurn={handleAddToTurn}
                    handleEndTurn={handleEndTurn}
                    handleUndoLastTurn={handleUndoLastTurn}
                />
              ) : (
                <Scoreboard 
                    gameInfo={gameState.gameInfo}
                    scores={gameState.scores}
                    turnScore={gameState.turnScore}
                    activePlayersWithStats={activePlayersWithStats}
                    turnsPerPlayer={gameState.turnsPerPlayer}
                    gameHistory={gameState.gameHistory}
                    handleAddToTurn={handleAddToTurn}
                    handleEndTurn={handleEndTurn}
                    handleUndoLastTurn={handleUndoLastTurn}
                />
              )}
               <button onClick={handleChangeGame} className="w-full md:w-auto self-center bg-[--color-surface] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 px-8 rounded-lg shadow-md transition-colors mt-4">
                {t('changeGame')}
              </button>
            </div>
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
            onDeletePlayer={handleDeletePlayer}
            onViewPlayerStats={(p) => setModalState({ view: 'playerStats', player: p })}
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

      <footer className="absolute bottom-4 text-[--color-text-secondary] text-sm text-center">
        {showInstallPrompt && (
          <button 
            onClick={handleInstallClick}
            className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 px-4 rounded-lg mb-2"
          >
            Install App
          </button>
        )}
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
