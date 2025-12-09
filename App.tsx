
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

// Components
import HeaderNav from './components/HeaderNav';
import BottomNav from './components/BottomNav';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';
import TeamScoreboard from './components/TeamScoreboard';
import PostGameSummary from './components/PostGameSummary';
import PlayerManager from './components/PlayerManager';
import StatsView from './components/StatsView';
import { TournamentView } from './components/TournamentView';
import PlayerEditorModal from './components/PlayerEditorModal';
import PlayerProfileModal from './components/PlayerProfileModal';
import CameraCaptureModal from './components/CameraCaptureModal';
import FirstTimeUserModal from './components/FirstTimeUserModal';
import SettingsModal from './components/SettingsModal';
import Auth from './components/Auth';
import { SpectatorView } from './components/SpectatorView';

// Hooks & Utils
import { useAppData, useTheme, useRealtimeGame, useSpectatorGame } from './hooks';
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
    ActiveGameState,
} from './types';

// Helper function to calculate player average
const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
    if (playerGames.length === 0) return 0;
    const totalScore = playerGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = playerGames.reduce((sum, game) => sum + game.turns, 0);
    return totalTurns > 0 ? totalScore / totalTurns : 0;
};

// Helper to mutate tournament clone in place for knockout stage advancement
const advanceToKnockoutStageMutable = (tournament: Tournament) => {
    const { settings } = tournament;
    const groupMatches = tournament.matches.filter(m => m.groupId);
    const knockoutMatches = tournament.matches.filter(m => !m.groupId);
    
    const groupStandings: Record<string, { playerId: string, points: number, scoreDiff: number }[]> = {};
    
    for (let i = 0; i < (settings.numGroups || 0); i++) {
        const groupId = `group-${i}`;
        const groupPlayerIds = [...new Set(groupMatches.filter(m => m.groupId === groupId).flatMap(m => [m.player1Id, m.player2Id]))];
        
        const stats: Record<string, { points: number, scoreDiff: number }> = {};
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
    
    const firstRoundKnockout = knockoutMatches.filter(m => m.round === 1);
    let playerIndex = 0;
    for (let i = 0; i < (settings.numGroups || 0) / 2; i++) {
        const groupAId = `group-${i * 2}`;
        const groupBId = `group-${i * 2 + 1}`;
        
        const groupAWinners = advancingPlayers[groupAId];
        const groupBWinners = advancingPlayers[groupBId];

        for (let j = 0; j < (settings.playersAdvancing || 0); j++) {
            const match1 = firstRoundKnockout[playerIndex++];
            if (match1) {
                match1.player1Id = groupAWinners[j];
                match1.player2Id = groupBWinners[groupBWinners.length - 1 - j];
            }

            const match2 = firstRoundKnockout[playerIndex++];
            if (match2) {
                match2.player1Id = groupBWinners[j];
                match2.player2Id = groupAWinners[groupAWinners.length - 1 - j];
            }
        }
    }

    tournament.stage = 'knockout';
};

const App: React.FC = () => {
    const { t } = useTranslation();
    const [theme, setTheme] = useTheme();
    
    // Auth State
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

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
    const lastLocalUpdate = useRef(0);

    // --- Spectator Logic ---
    const [watchUserId, setWatchUserId] = useState<string | null>(null);
    useEffect(() => {
        // Check for ?watch=USER_ID in URL
        const params = new URLSearchParams(window.location.search);
        const watchId = params.get('watch');
        if (watchId) {
            setWatchUserId(watchId);
            setAuthLoading(false); // Stop waiting for auth if just watching
        }
    }, []);

    const { spectatorState, loading: spectatorLoading, error: spectatorError } = useSpectatorGame(watchUserId);

    const exitSpectatorMode = () => {
        setWatchUserId(null);
        // Clear URL param without reload
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({path:newUrl},'',newUrl);
        // If not logged in, this might show Auth screen, which is correct
    };

    // --- Wake Lock Logic (Keep Screen On) ---
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    // @ts-ignore
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('Screen Wake Lock acquired');
                }
            } catch (err) {
                console.log('Wake Lock request failed:', err);
            }
        };

        // Request on mount
        requestWakeLock();

        // Re-request when returning to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) wakeLock.release();
        };
    }, []);

    // --- Realtime Sync (Host) ---
    const handleRemoteUpdate = useCallback((remoteState: ActiveGameState) => {
        if (remoteState.timestamp <= lastLocalUpdate.current) return;
        
        if (remoteState.gameInfo) {
            setGameInfo(remoteState.gameInfo);
            setScores(remoteState.scores);
            setTurnScore(remoteState.turnScore);
            setTurnsPerPlayer(remoteState.turnsPerPlayer);
            setGameHistory(remoteState.gameHistory);
            
            if (currentView !== 'scoreboard') setCurrentView('scoreboard');
            triggerHapticFeedback([10, 50, 10]);
        }
    }, [currentView]);

    const { saveActiveGame, clearActiveGame } = useRealtimeGame(handleRemoteUpdate);

    const syncState = useCallback((
        info: GameInfo, 
        currentScores: {[id:string]: number}, 
        currentTurnScore: number,
        currentTurns: {[id:string]: number},
        history: any[]
    ) => {
        const now = Date.now();
        lastLocalUpdate.current = now;
        saveActiveGame({
            gameInfo: info,
            scores: currentScores,
            turnScore: currentTurnScore,
            turnsPerPlayer: currentTurns,
            gameHistory: history,
            timestamp: now
        });
    }, [saveActiveGame]);


    // --- PWA Install State ---
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    
    // --- Auth Effect ---
    useEffect(() => {
        if (watchUserId) return; // Skip auth check if watching

        if (window.location.hash && window.location.hash.includes('access_token')) {
            setAuthLoading(true);
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!window.location.hash.includes('access_token')) {
                setAuthLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [watchUserId]);

    // --- Effects ---
    useEffect(() => {
        const hasVisited = localStorage.getItem('scoreCounter:hasVisited');
        if (session && !hasVisited && players.length === 0) {
            setModalState({ view: 'firstTimeUser' });
            localStorage.setItem('scoreCounter:hasVisited', 'true');
        }
    }, [players.length, session]);
    
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
        clearActiveGame();
    }, [clearActiveGame]);

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
            inning: 1,
            endCondition,
            allowOvershooting,
            handicap,
            tournamentContext,
            turnStats: playerIds.reduce((acc, id) => ({ ...acc, [id]: { clean10s: 0, clean20s: 0, zeroInnings: 0 } }), {}),
            highestRuns: playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {})
        };

        const initialTurns = playerIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
        const initialHistory = [{ scores: initialScores, currentPlayerIndex: 0 }];

        setGameInfo(newGameInfo);
        setScores(initialScores);
        setTurnsPerPlayer(initialTurns);
        setGameHistory(initialHistory);
        setLastPlayedPlayerIds(playerIds);

        syncState(newGameInfo, initialScores, 0, initialTurns, initialHistory);
    };

    const handleRematch = () => {
        if (!postGameSummary) return;
        const { gameInfo: prevGameInfo } = postGameSummary;

        let playerIds = prevGameInfo.playerIds;
        if (playerIds.length === 2) {
            playerIds = [playerIds[1], playerIds[0]];
        }

        handleGameStart(
            playerIds,
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
        
        const newTurnScore = turnScore + scoreData.points;
        setTurnScore(newTurnScore);

        const currentTurnStats = { ...gameInfo.turnStats! };
        const currentHighestRuns = { ...gameInfo.highestRuns! };
        const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];

        if (scoreData.type === 'clean10') currentTurnStats[currentPlayerId].clean10s++;
        if (scoreData.type === 'clean20') currentTurnStats[currentPlayerId].clean20s++;
        
        if (newTurnScore > (currentHighestRuns[currentPlayerId] || 0)) {
            currentHighestRuns[currentPlayerId] = newTurnScore;
        }

        const updatedGameInfo = { ...gameInfo, turnStats: currentTurnStats, highestRuns: currentHighestRuns };
        setGameInfo(updatedGameInfo);

        syncState(updatedGameInfo, scores, newTurnScore, turnsPerPlayer, gameHistory);
    };

    const updateTournamentMatch = useCallback((tournamentId: string, matchId: string, winnerIds: string[], finalScores: { [playerId: string]: number }) => {
        setTournaments(prev => {
            const tournamentIndex = prev.findIndex(t => t.id === tournamentId);
            if (tournamentIndex === -1) return prev;

            const newTournaments = [...prev];
            const tournament = JSON.parse(JSON.stringify(newTournaments[tournamentIndex])) as Tournament;
            newTournaments[tournamentIndex] = tournament;

            const match = tournament.matches.find(m => m.id === matchId);
            if (!match) return prev;

            match.status = 'completed';
            match.result = {
                player1Score: finalScores[match.player1Id!],
                player2Score: finalScores[match.player2Id!],
                winnerId: winnerIds.length === 1 ? winnerIds[0] : null,
            };

            if (match.nextMatchId && match.result.winnerId) {
                const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
                if (nextMatch) {
                    if (nextMatch.player1Id === null) nextMatch.player1Id = match.result.winnerId;
                    else if (nextMatch.player2Id === null) nextMatch.player2Id = match.result.winnerId;
                }
            }

            if (tournament.format === 'combined' && tournament.stage === 'group') {
                const groupMatches = tournament.matches.filter(m => m.groupId);
                if (groupMatches.every(m => m.status === 'completed')) {
                    advanceToKnockoutStageMutable(tournament);
                }
            } else {
                if (tournament.matches.filter(m => !m.groupId).every(m => m.status === 'completed')) {
                    tournament.status = 'completed';
                }
            }
            
            return newTournaments;
        });
    }, [setTournaments]);

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
                highestRun: gameInfo.highestRuns?.[playerId] || 0,
            });
        });
        
        setStats(prevStats => {
            const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
            if (!newStats[gameInfo.type]) newStats[gameInfo.type] = {};
            
            newGameRecords.forEach(record => {
                if (!newStats[gameInfo.type][record.playerId]) {
                    newStats[gameInfo.type][record.playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0, highestRun: 0 };
                }
                const playerStats = newStats[gameInfo.type][record.playerId];
                playerStats.gamesPlayed++;
                if (record.result === 'win') playerStats.wins++;
                if (record.result === 'loss') playerStats.losses++;
                playerStats.totalScore += record.score;
                playerStats.totalTurns += record.turns;
                playerStats.zeroInnings += record.zeroInnings;
                if (record.highestRun > (playerStats.highestRun || 0)) {
                    playerStats.highestRun = record.highestRun;
                }
            });
            return newStats;
        });

        setCompletedGamesLog(prevLog => [...prevLog, ...newGameRecords]);
        
        if (gameInfo.tournamentContext) {
            updateTournamentMatch(gameInfo.tournamentContext.tournamentId, gameInfo.tournamentContext.matchId, winnerIds, finalScores);
        }

        setGameInfo(null);
        clearActiveGame();
    }, [gameInfo, gameHistory, setStats, setCompletedGamesLog, setTournaments, updateTournamentMatch, clearActiveGame]);

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
        const isLastPlayerOfRound = gameInfo.currentPlayerIndex === gameInfo.playerIds.length - 1;
        const playersWhoReachedTarget = gameInfo.playerIds.filter(id => newScores[id] >= gameInfo.targetScore);

        if (playersWhoReachedTarget.length > 0) {
            if (gameInfo.endCondition === 'sudden-death') {
                isGameOver = true;
                winnerIds = [gameInfo.playerIds[gameInfo.currentPlayerIndex]];
            } else { // equal-innings
                const startingPlayerIndex = gameInfo.playoutInfo?.startingPlayerIndex ?? gameInfo.currentPlayerIndex;
                const isRoundComplete = (gameInfo.currentPlayerIndex + 1) % gameInfo.playerIds.length === startingPlayerIndex;

                if (isRoundComplete) {
                    isGameOver = true;
                    const maxScore = Math.max(...Object.values(newScores).map(Number));
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
        const nextInning = isLastPlayerOfRound ? gameInfo.inning + 1 : gameInfo.inning;

        updatedGameInfo = { ...updatedGameInfo, currentPlayerIndex: nextPlayerIndex, inning: nextInning };
        setGameInfo(updatedGameInfo);
        setGameHistory([...gameHistory, { scores: newScores, currentPlayerIndex: nextPlayerIndex }]);
        
        syncState(updatedGameInfo, newScores, 0, newTurns, [...gameHistory, { scores: newScores, currentPlayerIndex: nextPlayerIndex }]);

    }, [gameInfo, scores, turnScore, turnsPerPlayer, endGame, gameHistory, syncState]);
    
    const handleUndoLastTurn = () => {
        if (gameHistory.length <= 1 || !gameInfo) return;
        
        const previousHistoryState = gameHistory[gameHistory.length - 2];
        const lastTurnPlayerIndex = previousHistoryState.currentPlayerIndex;
        const lastTurnPlayerId = gameInfo.playerIds[lastTurnPlayerIndex];

        const wasLastPlayerOfRound = lastTurnPlayerIndex === gameInfo.playerIds.length - 1;
        const previousInning = wasLastPlayerOfRound ? gameInfo.inning - 1 : gameInfo.inning;
        
        const restoredScores = previousHistoryState.scores;
        const restoredGameInfo = { ...gameInfo, currentPlayerIndex: lastTurnPlayerIndex, inning: previousInning };
        const restoredTurns = { ...turnsPerPlayer, [lastTurnPlayerId]: (turnsPerPlayer[lastTurnPlayerId] || 1) - 1 };
        
        setScores(restoredScores);
        setGameInfo(restoredGameInfo);
        setTurnsPerPlayer(restoredTurns);
        setGameHistory(h => h.slice(0, -1));
        setTurnScore(0);

        syncState(restoredGameInfo, restoredScores, 0, restoredTurns, gameHistory.slice(0, -1));
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

    // --- SPECTATOR VIEW RENDER ---
    if (watchUserId) {
        return (
            <div className="bg-[--color-bg] text-[--color-text-primary] h-[100dvh] flex flex-col font-sans overflow-hidden">
                <HeaderNav currentView="scoreboard" onNavigate={() => {}} onOpenSettings={() => {}} />
                
                {spectatorLoading && <div className="flex-1 flex items-center justify-center">{t('spectator.loading')}</div>}
                {spectatorError && <div className="flex-1 flex flex-col items-center justify-center text-[--color-red] p-4 text-center">{spectatorError}<button onClick={exitSpectatorMode} className="mt-4 bg-[--color-surface-light] px-4 py-2 rounded text-[--color-text-primary]">Zpět</button></div>}
                {spectatorState && <SpectatorView gameState={spectatorState} />}
                
                <button onClick={exitSpectatorMode} className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[--color-surface] border border-[--color-border] px-6 py-2 rounded-full shadow-lg text-sm font-bold z-50">
                    {t('spectator.exit')}
                </button>
            </div>
        );
    }

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
    
    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[--color-bg] text-[--color-text-primary]">Načítání...</div>;
    }

    if (!session) {
        return <Auth />;
    }

    const isGameActive = !!gameInfo;

    return (
        <div className="bg-[--color-bg] text-[--color-text-primary] h-[100dvh] flex flex-col font-sans overflow-hidden">
            <HeaderNav currentView={currentView} onNavigate={handleNavigate} onOpenSettings={() => setShowSettings(true)} />
            
            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto pt-14 pb-20 w-full max-w-3xl mx-auto">
                {renderContent()}
            </main>

            {/* Bottom Navigation */}
            <BottomNav currentView={currentView} onNavigate={handleNavigate} />

            {/* Modals */}
            {renderModals()}
            {showSettings && <SettingsModal currentTheme={theme} onThemeChange={setTheme} onClose={() => setShowSettings(false)} appData={appData} />}
        </div>
    );
};

export default App;
