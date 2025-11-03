import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppData, useTheme } from './hooks';

// --- TYPES ---
import { Player, View, ModalState, GameInfo, GameSummary, AllStats, GameRecord, Tournament, TournamentSettings, Match, PlayerStats } from './types';
import { PREDEFINED_AVATARS_EDITOR } from './constants';

// --- COMPONENTS ---
import HeaderNav from './components/HeaderNav';
import PlayerManager from './components/PlayerManager';
import CameraCaptureModal from './components/CameraCaptureModal';
import PlayerEditorModal from './components/PlayerEditorModal';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';
import TeamScoreboard from './components/TeamScoreboard';
import StatsView from './components/StatsView';
import PlayerProfileModal from './components/PlayerProfileModal';
import FirstTimeUserModal from './components/FirstTimeUserModal';
import PostGameSummary from './components/PostGameSummary';
import TournamentView from './components/TournamentView';
import SettingsModal from './components/SettingsModal';


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const { t } = useTranslation();
  
  // --- STATES ---
  const [view, setView] = useState<View>('scoreboard');
  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  
  // --- DATA HOOK (manages localStorage) ---
  const appData = useAppData();
  const { 
    players, setPlayers, 
    stats, setStats,
    completedGamesLog, setCompletedGamesLog,
    tournaments, setTournaments,
    lastPlayedPlayerIds, setLastPlayedPlayerIds,
  } = appData;

  // --- ACTIVE GAME STATE (in-memory only) ---
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
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true);
      }
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

  // --- First Time User ---
  useEffect(() => {
    const hasVisited = localStorage.getItem('scoreCounter:hasVisited');
    if (!hasVisited && players.length === 0) {
      setModalState({ view: 'firstTimeUser' });
    }
  }, [players.length]);


  // --- DERIVED STATES ---
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


  // --- PLAYER MANAGEMENT FUNCTIONS ---
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
  
  // --- GAME LOGIC ---
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
        playoutInfo: undefined,
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

    setGameState(prev => {
        if (!prev) return null;

        const { gameInfo, scores, turnScore, gameHistory, turnsPerPlayer } = prev;
        const { playerIds, currentPlayerIndex, targetScore, endCondition, allowOvershooting } = gameInfo;
        const currentPlayerId = playerIds[currentPlayerIndex];

        // 1. Update scores and stats for the current turn
        let newPlayerScore = (scores[currentPlayerId] || 0) + turnScore;
        if (!allowOvershooting && newPlayerScore > targetScore) {
            newPlayerScore = targetScore;
        }
        const newScores = { ...scores, [currentPlayerId]: newPlayerScore };
        const newTurnsPerPlayer = { ...turnsPerPlayer, [currentPlayerId]: (turnsPerPlayer[currentPlayerId] || 0) + 1 };
        
        const newTurnStats = JSON.parse(JSON.stringify(gameInfo.turnStats || {}));
        if (newTurnStats[currentPlayerId]) {
            if (turnScore === 0) newTurnStats[currentPlayerId].zeroInnings++;
            if (turnScore === 10) newTurnStats[currentPlayerId].clean10s++; // Simple check
            if (turnScore === 20) newTurnStats[currentPlayerId].clean20s++; // Simple check
        }

        const updatedGameInfo: GameInfo = { ...gameInfo, turnStats: newTurnStats };

        // 2. Check if the game should end
        const playersWhoReachedTarget = playerIds.filter(id => newScores[id] >= targetScore);
        const isTargetReached = playersWhoReachedTarget.length > 0;

        if (isTargetReached) {
            if (endCondition === 'sudden-death') {
                endGame(newScores, newTurnsPerPlayer, updatedGameInfo, gameHistory);
                return null; // End game, clear state
            }
            
            if (endCondition === 'equal-innings') {
                const finishedIds = new Set(updatedGameInfo.finishedPlayerIds || []);
                finishedIds.add(currentPlayerId);
                updatedGameInfo.finishedPlayerIds = Array.from(finishedIds);

                if (!updatedGameInfo.playoutInfo) {
                    updatedGameInfo.playoutInfo = { startingPlayerIndex: currentPlayerIndex };
                }
                
                const nextPotentialIndex = (currentPlayerIndex + 1) % playerIds.length;
                if (nextPotentialIndex === updatedGameInfo.playoutInfo.startingPlayerIndex || updatedGameInfo.finishedPlayerIds.length === playerIds.length) {
                    // Playout round is complete
                    const highestScore = Math.max(...Object.values(newScores));
                    const winners = playerIds.filter(id => newScores[id] === highestScore);
                    endGame(newScores, newTurnsPerPlayer, updatedGameInfo, gameHistory, winners);
                    return null; // End game
                }
            }
        }
        
        // 3. If game is not over, advance to the next player
        let nextIndex = (currentPlayerIndex + 1) % playerIds.length;
        // Skip players who have already finished in an equal-innings playout
        if (updatedGameInfo.finishedPlayerIds && updatedGameInfo.finishedPlayerIds.length > 0) {
            while (updatedGameInfo.finishedPlayerIds.includes(playerIds[nextIndex])) {
                nextIndex = (nextIndex + 1) % playerIds.length;
            }
        }

        updatedGameInfo.currentPlayerIndex = nextIndex;

        return {
            gameInfo: updatedGameInfo,
            scores: newScores,
            turnScore: 0,
            gameHistory: [...gameHistory, { scores: newScores, currentPlayerIndex: nextIndex }],
            turnsPerPlayer: newTurnsPerPlayer,
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
        
        const newTurnsPerPlayer = { ...prev.turnsPerPlayer };
        if (newTurnsPerPlayer[prevPlayerId] > 0) {
            newTurnsPerPlayer[prevPlayerId]--;
        }

        return {
            ...prev,
            scores: lastState.scores,
            turnScore: 0,
            gameHistory: newHistory,
            gameInfo: { ...prev.gameInfo, currentPlayerIndex: lastState.currentPlayerIndex },
            turnsPerPlayer: newTurnsPerPlayer,
        };
    });
  };

  const endGame = (finalScores: { [key: string]: number }, finalTurns: { [key: string]: number }, finalGameInfo: GameInfo, finalGameHistory: GameSummary['gameHistory'], explicitWinners?: string[]) => {
    let winnerIds: string[];
    if(explicitWinners){
        winnerIds = explicitWinners;
    } else {
        const highestScore = Math.max(...Object.values(finalScores));
        winnerIds = finalGameInfo.playerIds.filter(id => finalScores[id] === highestScore);
    }
    
    // Save stats
    const newStats: AllStats = JSON.parse(JSON.stringify(stats));
    const gameTypeKey = finalGameInfo.type;

    // Fix: Add guard to ensure game-specific stats is an object to prevent errors with corrupted localStorage data.
    if (typeof newStats[gameTypeKey] !== 'object' || newStats[gameTypeKey] === null) {
        newStats[gameTypeKey] = {};
    }
    const gameStats = newStats[gameTypeKey];

    const newGameRecords: GameRecord[] = [];
    
    finalGameInfo.playerIds.forEach(playerId => {
        // Fix: Add guard to ensure player-specific stats is an object.
        if (typeof gameStats[playerId] !== 'object' || gameStats[playerId] === null) {
            gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
        }
        const playerStats = gameStats[playerId] as PlayerStats;
        const isWinner = winnerIds.includes(playerId);
        const isDraw = isWinner && winnerIds.length > 1;
        const earnedScore = finalScores[playerId] - (finalGameInfo.handicap?.playerId === playerId ? finalGameInfo.handicap.points : 0);

        playerStats.gamesPlayed++;
        if (isWinner && !isDraw) playerStats.wins++; 
        else if (!isWinner) playerStats.losses++;
        playerStats.totalScore += earnedScore;
        playerStats.totalTurns += finalTurns[playerId];
        playerStats.zeroInnings += finalGameInfo.turnStats?.[playerId]?.zeroInnings || 0;
        
        const turnStats = finalGameInfo.turnStats?.[playerId] || { zeroInnings: 0, clean10s: 0, clean20s: 0 };
        let result: GameRecord['result'] = 'loss';
        if (isWinner && !isDraw) result = 'win';
        if (isDraw) result = 'draw';

        newGameRecords.push({
            gameId: Date.now().toString(), playerId, gameType: gameTypeKey, score: earnedScore,
            turns: finalTurns[playerId], date: new Date().toISOString(), result: result,
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
                const newMatches = t.matches.map((m): Match => {
                    if (m.id === matchId) {
                        return {
                            ...m, status: 'completed',
                            result: {
                                player1Score: finalScores[m.player1Id],
                                player2Score: finalScores[m.player2Id],
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
      gameHistory: [...finalGameHistory, { scores: finalScores, currentPlayerIndex: finalGameInfo.currentPlayerIndex }]
    });
    
    setGameState(null);
  };
  
  const handleRematch = () => {
      if (!postGameSummary) return;
      const { gameInfo } = postGameSummary;
      const playerIds = gameInfo.mode === 'round-robin' ? [...gameInfo.playerIds].reverse() : gameInfo.playerIds;
      handleGameStart(playerIds, gameInfo.type, gameInfo.mode, gameInfo.targetScore, gameInfo.endCondition, gameInfo.allowOvershooting ?? false, gameInfo.handicap, gameInfo.tournamentContext);
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
  const handleGenerateSampleData = () => {
    const samplePlayers: Player[] = [
      { id: 'sample-1', name: 'John Doe', avatar: PREDEFINED_AVATARS_EDITOR[0] },
      { id: 'sample-2', name: 'Jane Smith', avatar: PREDEFINED_AVATARS_EDITOR[1] },
      { id: 'sample-3', name: 'Peter Jones', avatar: PREDEFINED_AVATARS_EDITOR[2] },
      { id: 'sample-4', name: 'Mary Williams', avatar: PREDEFINED_AVATARS_EDITOR[3] },
      { id: 'sample-5', name: 'David Brown', avatar: PREDEFINED_AVATARS_EDITOR[4] },
      { id: 'sample-6', name: 'Susan Miller', avatar: PREDEFINED_AVATARS_EDITOR[5] },
    ];
    setPlayers(samplePlayers);
    localStorage.setItem('scoreCounter:hasVisited', 'true');
    setModalState({ view: 'closed' });
  };
  const handleShowAddPlayerModal = () => {
    localStorage.setItem('scoreCounter:hasVisited', 'true');
    setModalState({ view: 'playerEditor' });
    setView('playerManager');
  };
   const handleImportPlayers = () => {
     alert(t('firstTime.importAlert'));
   };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-[--color-text-primary] p-4 pt-24 font-sans antialiased">
      <HeaderNav 
        currentView={view} 
        onNavigate={(newView) => { setView(newView); setPostGameSummary(null); handleChangeGame(); }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      {/* --- Modals --- */}
      {isSettingsOpen && <SettingsModal currentTheme={theme} onThemeChange={setTheme} onClose={() => setIsSettingsOpen(false)} appData={appData} />}
      
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
            onGenerate={handleGenerateSampleData}
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
            appData={appData}
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

      <footer className="fixed bottom-4 text-[--color-text-secondary] text-sm text-center w-full px-4">
        {showInstallPrompt && (
          <button 
            onClick={handleInstallClick}
            className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 px-4 rounded-lg mb-2 shadow-lg"
          >
            {t('installApp')}
          </button>
        )}
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
