

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// Fix: Changed immer import to a direct CDN URL to resolve build error.
import { produce } from 'https://aistudiocdn.com/immer@^10.2.0';

// Components
import HeaderNav from './components/HeaderNav';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';
import TeamScoreboard from './components/TeamScoreboard';
import PostGameSummary from './components/PostGameSummary';
import PlayerManager from './components/PlayerManager';
import StatsView from './components/StatsView';
import TournamentView from './components/TournamentView';
import PlayerEditorModal from './components/PlayerEditorModal';
import PlayerProfileModal from './components/PlayerProfileModal';
import CameraCaptureModal from './components/CameraCaptureModal';
import FirstTimeUserModal from './components/FirstTimeUserModal';
import SettingsModal from './components/SettingsModal';

// Hooks & Utils
import { useAppData, useTheme } from './hooks';
import { triggerHapticFeedback, generateRoundRobinMatches, generateKnockoutBracket, generateCombinedTournament } from './utils';

// Types
import {
    Player,
    View,
    GameInfo,
    ModalState,
    GameSummary,
    GameRecord,
    AllStats,
    GameMode,
    Tournament,
    TournamentSettings,
    Match,
} from './types';

// Helper function to calculate player average
const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
    if (playerGames.length === 0) return 0;
    const totalScore = playerGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = playerGames.reduce((sum, game) => sum + game.turns, 0);
    return totalTurns > 0 ? totalScore / totalTurns : 0;
};


// Main App Component
const App: React.FC = () => {
    const { t } = useTranslation();
    const [theme, setTheme] = useTheme();
    const appData = useAppData();
    const { players, setPlayers, stats, setStats, completedGamesLog, setCompletedGamesLog, tournaments, setTournaments, lastPlayedPlayerIds, setLastPlayedPlayerIds } = appData;

    // --- App State ---
    const [currentView, setCurrentView] = useState<View>('scoreboard');
    const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
    const [showSettings, setShowSettings] = useState(false);

    // --- Game State ---
    const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
    const [scores, setScores] = useState<{ [playerId: string]: number }>({});
    const [turnScore, setTurnScore] = useState<number>(0);
    const [turnsPerPlayer, setTurnsPerPlayer] = useState<{ [playerId: string]: number }>({});
    const [gameHistory, setGameHistory] = useState<Array<{ scores: { [playerId: string]: number }; currentPlayerIndex: number }>>([]);
    const [postGameSummary, setPostGameSummary] = useState<GameSummary | null>(null);

    // --- PWA Install State ---
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    
    // --- Effects ---
    
    useEffect(() => {
        const hasVisited = localStorage.getItem('scoreCounter:hasVisited');
        if (!hasVisited && players.length === 0) {
            setModalState({ view: 'firstTimeUser' });
            localStorage.setItem('scoreCounter:hasVisited', 'true');
        }
    }, [players.length]);
    
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // --- Navigation ---
    const handleNavigate = (view: View) => {
        if (view !== currentView) {
            triggerHapticFeedback(30);
            setCurrentView(view);
        }
    };

    // --- Game Logic ---
    const resetGameState = useCallback(() => {
        setGameInfo(null);
        setScores({});
        setTurnScore(0);
        setTurnsPerPlayer({});
        setGameHistory([]);
        setPostGameSummary(null);
    }, []);

    const handleGameStart = (
        playerIds: string[],
        gameTypeKey: string,
        gameMode: GameMode,
        targetScore: number,
        endCondition: 'sudden-death' | 'equal-innings',
        allowOvershooting: boolean,
        handicap?: { playerId: string, points: number },
        tournamentContext?: { tournamentId: string, matchId: string }
    ) => {
        resetGameState();
        
        const initialScores: { [playerId: string]: number } = {};
        playerIds.forEach(id => { initialScores[id] = 0; });
        if (handicap) {
            initialScores[handicap.playerId] = handicap.points;
        }

        const newGameInfo: GameInfo = {
            type: gameTypeKey,
            mode: gameMode,
            playerIds: playerIds,
            targetScore,
            currentPlayerIndex: 0,
            endCondition,
            allowOvershooting,
            handicap,
            tournamentContext,
            turnStats: playerIds.reduce((acc, id) => ({ ...acc, [id]: { clean10s: 0, clean20s: 0, zeroInnings: 0 } }), {})
        };

        setGameInfo(newGameInfo);
        setScores(initialScores);
        setTurnsPerPlayer(playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}));
        setGameHistory([{ scores: initialScores, currentPlayerIndex: 0 }]);
        setLastPlayedPlayerIds(playerIds);
    };

    const handleRematch = () => {
        if (!postGameSummary) return;
        const { gameInfo: prevGameInfo } = postGameSummary;
        handleGameStart(
            prevGameInfo.playerIds,
            prevGameInfo.type,
            prevGameInfo.mode,
            prevGameInfo.targetScore,
            prevGameInfo.endCondition,
            prevGameInfo.allowOvershooting || false,
            prevGameInfo.handicap,
            prevGameInfo.tournamentContext
        );
    };
    
    const handleAddToTurn = (scoreData: { points: number; type: string }) => {
        if (!gameInfo) return;
        setTurnScore(prev => prev + scoreData.points);

        if (scoreData.type === 'clean10' || scoreData.type === 'clean20') {
            const currentTurnStats = { ...gameInfo.turnStats! };
            const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];
            if (scoreData.type === 'clean10') currentTurnStats[currentPlayerId].clean10s++;
            if (scoreData.type === 'clean20') currentTurnStats[currentPlayerId].clean20s++;
            setGameInfo({ ...gameInfo, turnStats: currentTurnStats });
        }
    };

    const endGame = useCallback((finalScores: typeof scores, finalTurns: typeof turnsPerPlayer, winnerIds: string[]) => {
        if (!gameInfo) return;

        const summary: GameSummary = {
            gameInfo,
            finalScores,
            winnerIds,
            turnsPerPlayer: finalTurns,
            gameHistory: [...gameHistory, { scores: finalScores, currentPlayerIndex: -1 }],
        };
        setPostGameSummary(summary);
        
        const newGameRecords: GameRecord[] = [];
        const gameId = `game-${Date.now()}`;
        
        gameInfo.playerIds.forEach(playerId => {
            const isWinner = winnerIds.includes(playerId);
            const isDraw = winnerIds.length > 1;

            newGameRecords.push({
                gameId,
                playerId,
                gameType: gameInfo.type,
                score: finalScores[playerId] - (gameInfo.handicap?.playerId === playerId ? gameInfo.handicap.points : 0),
                turns: finalTurns[playerId],
                date: new Date().toISOString(),
                result: isDraw ? 'draw' : isWinner ? 'win' : 'loss',
                handicapApplied: gameInfo.handicap?.playerId === playerId ? gameInfo.handicap.points : 0,
                zeroInnings: gameInfo.turnStats?.[playerId]?.zeroInnings || 0,
                clean10s: gameInfo.turnStats?.[playerId]?.clean10s || 0,
                clean20s: gameInfo.turnStats?.[playerId]?.clean20s || 0,
            });
        });
        
        setStats(prevStats => {
            const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
            if (!newStats[gameInfo.type]) newStats[gameInfo.type] = {};
            
            newGameRecords.forEach(record => {
                if (!newStats[gameInfo.type][record.playerId]) {
                    newStats[gameInfo.type][record.playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
                }
                const playerStats = newStats[gameInfo.type][record.playerId];
                playerStats.gamesPlayed++;
                if (record.result === 'win') playerStats.wins++;
                if (record.result === 'loss') playerStats.losses++;
                playerStats.totalScore += record.score;
                playerStats.totalTurns += record.turns;
                playerStats.zeroInnings += record.zeroInnings;
            });
            return newStats;
        });

        setCompletedGamesLog(prevLog => [...prevLog, ...newGameRecords]);
        
        if (gameInfo.tournamentContext) {
            updateTournamentMatch(gameInfo.tournamentContext.tournamentId, gameInfo.tournamentContext.matchId, winnerIds, finalScores);
        }

        setGameInfo(null);
    }, [gameInfo, gameHistory, setStats, setCompletedGamesLog, setTournaments]);

    const handleEndTurn = useCallback(() => {
        if (!gameInfo) return;

        const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];
        const newScore = (scores[currentPlayerId] || 0) + turnScore;
        const newScores = { ...scores, [currentPlayerId]: newScore };
        const newTurns = { ...turnsPerPlayer, [currentPlayerId]: (turnsPerPlayer[currentPlayerId] || 0) + 1 };
        
        let updatedGameInfo = { ...gameInfo };
        if (turnScore === 0 && updatedGameInfo.turnStats) {
            updatedGameInfo.turnStats[currentPlayerId].zeroInnings++;
        }

        setScores(newScores);
        setTurnsPerPlayer(newTurns);
        setTurnScore(0);
        
        let winnerIds: string[] = [];
        let isGameOver = false;
        const playersWhoReachedTarget = gameInfo.playerIds.filter(id => newScores[id] >= gameInfo.targetScore);

        if (playersWhoReachedTarget.length > 0) {
            if (gameInfo.endCondition === 'sudden-death') {
                isGameOver = true;
                winnerIds = [gameInfo.playerIds[gameInfo.currentPlayerIndex]];
            } else {
                const startingPlayerIndex = gameInfo.playoutInfo?.startingPlayerIndex ?? gameInfo.currentPlayerIndex;
                const nextPlayerIndex = (gameInfo.currentPlayerIndex + 1) % gameInfo.playerIds.length;
                
                if (nextPlayerIndex === startingPlayerIndex) {
                    isGameOver = true;
                    const maxScore = Math.max(...Object.values(newScores));
                    winnerIds = gameInfo.playerIds.filter(id => newScores[id] === maxScore);
                } else {
                    updatedGameInfo = {
                        ...updatedGameInfo,
                        playoutInfo: { startingPlayerIndex },
                        finishedPlayerIds: [...(gameInfo.finishedPlayerIds || []), currentPlayerId]
                    };
                }
            }
        }
        
        if (isGameOver) {
            endGame(newScores, newTurns, winnerIds);
            return;
        }

        const nextPlayerIndex = (gameInfo.currentPlayerIndex + 1) % gameInfo.playerIds.length;
        updatedGameInfo = { ...updatedGameInfo, currentPlayerIndex: nextPlayerIndex };
        setGameInfo(updatedGameInfo);
        setGameHistory([...gameHistory, { scores: newScores, currentPlayerIndex: nextPlayerIndex }]);
    }, [gameInfo, scores, turnScore, turnsPerPlayer, endGame, gameHistory]);
    
    const handleUndoLastTurn = () => {
        if (gameHistory.length <= 1 || !gameInfo) return;
        
        const previousHistoryState = gameHistory[gameHistory.length - 2];
        const lastTurnPlayerIndex = previousHistoryState.currentPlayerIndex;
        const lastTurnPlayerId = gameInfo.playerIds[lastTurnPlayerIndex];
        
        setScores(previousHistoryState.scores);
        setGameInfo({ ...gameInfo, currentPlayerIndex: lastTurnPlayerIndex });
        setTurnsPerPlayer(t => ({ ...t, [lastTurnPlayerId]: (t[lastTurnPlayerId] || 1) - 1 }));
        setGameHistory(h => h.slice(0, -1));
        setTurnScore(0);
    };

    const advanceToKnockoutStage = (tournament: Tournament) => {
        return produce(tournament, draft => {
            const { settings } = draft;
            const groupMatches = draft.matches.filter(m => m.groupId);
            const knockoutMatches = draft.matches.filter(m => !m.groupId);
            
            const groupStandings: Record<string, { playerId: string, points: number, scoreDiff: number }[]> = {};
            
            for (let i = 0; i < (settings.numGroups || 0); i++) {
                const groupId = `group-${i}`;
                const groupPlayerIds = [...new Set(groupMatches.filter(m => m.groupId === groupId).flatMap(m => [m.player1Id, m.player2Id]))];
                
                const stats: Record<string, { points: number, scoreDiff: number }> = {};
                // Fix: Filter out null player IDs before using them as index keys to prevent runtime errors.
                groupPlayerIds.filter((pId): pId is string => !!pId).forEach(pId => { stats[pId] = { points: 0, scoreDiff: 0 }; });

                groupMatches.filter(m => m.groupId === groupId).forEach(m => {
                    if (m.status === 'completed' && m.result && m.player1Id && m.player2Id) {
                        stats[m.player1Id].scoreDiff += m.result.player1Score - m.result.player2Score;
                        stats[m.player2Id].scoreDiff += m.result.player2Score - m.result.player1Score;
                        if (m.result.winnerId === null) {
                            stats[m.player1Id].points += 1;
                            stats[m.player2Id].points += 1;
                        } else if (m.result.winnerId === m.player1Id) {
                            stats[m.player1Id].points += 3;
                        } else {
                            stats[m.player2Id].points += 3;
                        }
                    }
                });
                
                groupStandings[groupId] = Object.entries(stats)
                    .map(([playerId, data]) => ({ playerId, ...data }))
                    .sort((a, b) => b.points - a.points || b.scoreDiff - a.scoreDiff);
            }
            
            const advancingPlayers: { [key: string]: string[] } = {};
            Object.keys(groupStandings).forEach(groupId => {
                advancingPlayers[groupId] = groupStandings[groupId].slice(0, settings.playersAdvancing).map(p => p.playerId);
            });
            
            // Seed knockout bracket (e.g., A1 vs B2, B1 vs A2)
            const firstRoundKnockout = knockoutMatches.filter(m => m.round === 1);
            let playerIndex = 0;
            for (let i = 0; i < (settings.numGroups || 0) / 2; i++) {
                const groupAId = `group-${i * 2}`;
                const groupBId = `group-${i * 2 + 1}`;
                
                const groupAWinners = advancingPlayers[groupAId];
                const groupBWinners = advancingPlayers[groupBId];

                for (let j = 0; j < (settings.playersAdvancing || 0); j++) {
                    const match1 = firstRoundKnockout[playerIndex++];
                    match1.player1Id = groupAWinners[j];
                    match1.player2Id = groupBWinners[groupBWinners.length - 1 - j];

                    const match2 = firstRoundKnockout[playerIndex++];
                    match2.player1Id = groupBWinners[j];
                    match2.player2Id = groupAWinners[groupAWinners.length - 1 - j];
                }
            }

            draft.stage = 'knockout';
        });
    };

    const updateTournamentMatch = (tournamentId: string, matchId: string, winnerIds: string[], finalScores: { [playerId: string]: number }) => {
        setTournaments(prev => produce(prev, draft => {
            const tournament = draft.find(t => t.id === tournamentId);
            if (!tournament) return;

            const match = tournament.matches.find(m => m.id === matchId);
            if (!match) return;

            match.status = 'completed';
            match.result = {
                player1Score: finalScores[match.player1Id!],
                player2Score: finalScores[match.player2Id!],
                winnerId: winnerIds.length === 1 ? winnerIds[0] : null,
            };

            // Knockout advancement logic
            if (match.nextMatchId && match.result.winnerId) {
                const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
                if (nextMatch) {
                    if (nextMatch.player1Id === null) nextMatch.player1Id = match.result.winnerId;
                    else if (nextMatch.player2Id === null) nextMatch.player2Id = match.result.winnerId;
                }
            }

            // Check if tournament or stage is complete
            if (tournament.format === 'combined' && tournament.stage === 'group') {
                const groupMatches = tournament.matches.filter(m => m.groupId);
                if (groupMatches.every(m => m.status === 'completed')) {
                    const updatedTournament = advanceToKnockoutStage(tournament);
                    Object.assign(tournament, updatedTournament);
                }
            } else {
                if (tournament.matches.filter(m => !m.groupId).every(m => m.status === 'completed')) {
                    tournament.status = 'completed';
                }
            }
        }));
    };
    
    const handleSavePlayer = (playerData: { name: string; avatar: string }) => {
        if (modalState.view === 'playerEditor') {
            if (modalState.player) {
                setPlayers(ps => ps.map(p => p.id === modalState.player!.id ? { ...p, ...playerData } : p));
            } else {
                const newPlayer: Player = { id: `player-${Date.now()}`, ...playerData };
                setPlayers(ps => [...ps, newPlayer]);
            }
        }
        setModalState({ view: 'closed' });
    };

    const handleDeletePlayer = (id: string) => {
        const inTournament = tournaments.some(t => t.status === 'ongoing' && t.playerIds.includes(id));
        if (inTournament) {
            alert(t('tournament.cannotDeletePlayer'));
            return;
        }
        setPlayers(ps => ps.filter(p => p.id !== id));
    };

    const handleGenerateSampleData = () => {
        const samplePlayers: Player[] = [ { id: 'sample-1', name: 'Alice', avatar: '' }, { id: 'sample-2', name: 'Bob', avatar: '' }, { id: 'sample-3', name: 'Charlie', avatar: '' }, { id: 'sample-4', name: 'Diana', avatar: '' }, { id: 'sample-5', name: 'Eve', avatar: '' }, { id: 'sample-6', name: 'Frank', avatar: '' } ];
        setPlayers(samplePlayers);
        setModalState({ view: 'closed' });
    };
    
    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        const playersWithStats = playerIds.map(id => ({ ...players.find(p => p.id === id)!, average: getPlayerAverage(id, settings.gameTypeKey, completedGamesLog) }));
        let matches: Match[] = [];
        let stage: 'group' | 'knockout' | undefined = undefined;

        if (settings.format === 'round-robin') {
            matches = generateRoundRobinMatches(playerIds);
        } else if (settings.format === 'knockout') {
            matches = generateKnockoutBracket(playersWithStats, settings);
        } else if (settings.format === 'combined') {
            matches = generateCombinedTournament(playersWithStats, settings);
            stage = 'group';
        }
        
        const newTournament: Tournament = { id: `tourn-${Date.now()}`, name, playerIds, format: settings.format, settings, matches, status: 'ongoing', createdAt: new Date().toISOString(), stage };
        setTournaments(prev => [...prev, newTournament]);
    };

    const handleStartMatch = (tournament: Tournament, match: Match) => {
        if (!match.player1Id || !match.player2Id) return;
        handleGameStart( [match.player1Id, match.player2Id], tournament.settings.gameTypeKey, 'round-robin', tournament.settings.targetScore, tournament.settings.endCondition, true, undefined, { tournamentId: tournament.id, matchId: match.id });
        setCurrentView('scoreboard');
    };

    const handleDeleteTournament = (id: string) => {
        setTournaments(prev => prev.filter(t => t.id !== id));
    };

    const openPlayerEditor = (player?: Player) => setModalState({ view: 'playerEditor', player });
    const openPlayerStats = (player: Player) => setModalState({ view: 'playerStats', player });
    const openCamera = (context: { originalPlayer?: Player, name: string, avatar: string }) => setModalState({ view: 'camera', context });
    const closeModal = () => setModalState({ view: 'closed' });

    const handlePhotoCapture = (dataUrl: string) => {
        if (modalState.view === 'camera') {
            const { originalPlayer, name } = modalState.context;
            setModalState({ view: 'playerEditor', player: { ...(originalPlayer || { id: '' }), name, avatar: dataUrl } as Player });
        }
    };
    
    const activePlayersWithStats = gameInfo ? gameInfo.playerIds.map(id => {
        const player = players.find(p => p.id === id)!;
        const playerGames = completedGamesLog.filter(g => g.playerId === id && g.gameType === gameInfo.type);
        const lastSixResults = playerGames.slice(-6).map(g => g.result).reverse();
        const sourceGames = playerGames.length >= 10 ? playerGames.slice(-10) : playerGames;
        const totalScore = sourceGames.reduce((sum, game) => sum + game.score, 0);
        const totalTurns = sourceGames.reduce((sum, game) => sum + game.turns, 0);
        const movingAverage = totalTurns > 0 ? totalScore / totalTurns : 0;
        return { ...player, movingAverage, lastSixResults };
    }) : [];

    const renderContent = () => {
        switch (currentView) {
            case 'scoreboard':
                if (postGameSummary) return <PostGameSummary summary={postGameSummary} players={players} onNewGame={resetGameState} onRematch={handleRematch} />;
                if (gameInfo) {
                    if (gameInfo.mode === 'team') return <TeamScoreboard gameInfo={gameInfo} scores={scores} turnScore={turnScore} activePlayersWithStats={activePlayersWithStats} gameHistory={gameHistory} players={players} handleAddToTurn={handleAddToTurn} handleEndTurn={handleEndTurn} handleUndoLastTurn={handleUndoLastTurn} />;
                    return <Scoreboard gameInfo={gameInfo} scores={scores} turnScore={turnScore} activePlayersWithStats={activePlayersWithStats} turnsPerPlayer={turnsPerPlayer} gameHistory={gameHistory} handleAddToTurn={handleAddToTurn} handleEndTurn={handleEndTurn} handleUndoLastTurn={handleUndoLastTurn} />;
                }
                return <GameSetup allPlayers={players} lastPlayedPlayerIds={lastPlayedPlayerIds} gameLog={completedGamesLog} onGameStart={handleGameStart} />;
            case 'playerManager': return <PlayerManager players={players} onAddPlayer={() => openPlayerEditor()} onEditPlayer={openPlayerEditor} onDeletePlayer={handleDeletePlayer} onViewPlayerStats={openPlayerStats} appData={appData} />;
            case 'stats': return <StatsView stats={stats} players={players} completedGamesLog={completedGamesLog} />;
            case 'tournament': return <TournamentView tournaments={tournaments} players={players} gameLog={completedGamesLog} onCreateTournament={handleCreateTournament} onStartMatch={handleStartMatch} onDeleteTournament={handleDeleteTournament} appData={appData} />;
            default: return null;
        }
    };

    const renderModals = () => {
        switch (modalState.view) {
            case 'playerEditor': return <PlayerEditorModal playerToEdit={modalState.player} onSave={handleSavePlayer} onClose={closeModal} onOpenCamera={(ctx) => openCamera({ originalPlayer: modalState.player, ...ctx })} />;
            case 'playerStats': return <PlayerProfileModal player={modalState.player} stats={stats} gameLog={completedGamesLog} players={players} onClose={closeModal} />;
            case 'camera': return <CameraCaptureModal onCapture={handlePhotoCapture} onClose={() => setModalState({ view: 'playerEditor', player: modalState.context.originalPlayer })} />;
            case 'firstTimeUser': return <FirstTimeUserModal onGenerate={handleGenerateSampleData} onAdd={() => { closeModal(); setTimeout(() => openPlayerEditor(), 100); }} onImport={() => alert(t('firstTime.importAlert'))} onClose={closeModal} />;
            default: return null;
        }
    };

    return (
        <div className="bg-[--color-bg] text-[--color-text-primary] min-h-screen font-sans">
            <HeaderNav currentView={currentView} onNavigate={handleNavigate} onOpenSettings={() => setShowSettings(true)} />
            <main className="pt-24 pb-12 flex flex-col items-center justify-start min-h-screen px-4">
                {renderContent()}
            </main>
            {renderModals()}
            {showSettings && <SettingsModal currentTheme={theme} onThemeChange={setTheme} onClose={() => setShowSettings(false)} appData={appData} />}
            <footer className="fixed bottom-0 left-0 right-0 p-2 text-center text-xs text-[--color-text-secondary]/50 flex justify-between items-center">
                <span>{t('footer')}</span>
                {installPrompt && (
                    <button onClick={() => installPrompt.prompt()} className="bg-[--color-primary] text-white font-bold py-1 px-3 rounded-md text-xs shadow-md">
                        {t('installApp')}
                    </button>
                )}
            </footer>
        </div>
    );
};

export default App;