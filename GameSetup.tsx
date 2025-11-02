import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameMode } from './types';
import Avatar from './Avatar';
import HandicapModal from './HandicapModal';
import { GAME_TYPE_DEFAULTS_SETUP } from './constants';

// --- HELPER COMPONENTS & FUNCTIONS ---

const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
    if (playerGames.length === 0) return 0;
    // Use last 10 games for a more current average
    const sourceGames = playerGames.length >= 10 ? playerGames.slice(-10) : playerGames;
    const totalScore = sourceGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = sourceGames.reduce((sum, game) => sum + game.turns, 0);
    return totalTurns > 0 ? totalScore / totalTurns : 0;
};

const PlayerListItem: React.FC<{ player: Player & { average: number }; onSelect: () => void; }> = ({ player, onSelect }) => {
    return (
        <button onClick={onSelect} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-black/20 hover:bg-[--color-primary]/80">
            <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-[--color-text-primary] truncate">{player.name}</p>
                <p className="text-sm text-[--color-text-secondary] font-mono">Avg: {player.average.toFixed(2)}</p>
            </div>
        </button>
    );
};


// --- MAIN COMPONENT ---

const GameSetup: React.FC<{
    allPlayers: Player[];
    lastPlayedPlayerIds: string[];
    gameLog: GameRecord[];
    onGameStart: (
        playerIds: string[], 
        gameTypeKey: string, 
        gameMode: GameMode, 
        targetScore: number,
        endCondition: 'sudden-death' | 'equal-innings',
        allowOvershooting: boolean,
        handicap?: { playerId: string, points: number }
    ) => void;
}> = ({ allPlayers, lastPlayedPlayerIds, gameLog, onGameStart }) => {
    const { t } = useTranslation();

    // --- STATE ---
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.fourBall');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
        // Pre-select last played players if they still exist
        return lastPlayedPlayerIds.filter(id => allPlayers.some(p => p.id === id));
    });
    const [gameMode, setGameMode] = useState<GameMode>('round-robin');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP[gameTypeKey]);
    const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('equal-innings');
    const [allowOvershooting, setAllowOvershooting] = useState<boolean>(false);
    const [handicapOffer, setHandicapOffer] = useState<{ player: Player, points: number } | null>(null);

    // --- EFFECTS ---
    useEffect(() => {
        setTargetScore(GAME_TYPE_DEFAULTS_SETUP[gameTypeKey] || 50);
    }, [gameTypeKey]);

    useEffect(() => {
        // Reset handicap offer when selection changes
        setHandicapOffer(null);
    }, [selectedPlayerIds, gameTypeKey]);

    // --- MEMOIZED VALUES ---
    const getPlayersWithAverage = useCallback((playerList: Player[]) => {
        return playerList.map(p => ({
            ...p,
            average: getPlayerAverage(p.id, gameTypeKey, gameLog)
        })).sort((a, b) => b.average - a.average);
    }, [gameTypeKey, gameLog]);

    const availablePlayers = useMemo(() => {
        return getPlayersWithAverage(allPlayers.filter(p => !selectedPlayerIds.includes(p.id)));
    }, [allPlayers, selectedPlayerIds, getPlayersWithAverage]);

    const selectedPlayers = useMemo(() => {
        const players = selectedPlayerIds.map(id => allPlayers.find(p => p.id === id)).filter((p): p is Player => !!p);
        return getPlayersWithAverage(players);
    }, [selectedPlayerIds, allPlayers, getPlayersWithAverage]);

    const team1 = useMemo(() => selectedPlayers.filter((_, i) => i % 2 === 0), [selectedPlayers]);
    const team2 = useMemo(() => selectedPlayers.filter((_, i) => i % 2 !== 0), [selectedPlayers]);
    
    // --- HANDLERS ---
    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }
            if (prev.length < 4) {
                return [...prev, playerId];
            }
            return prev;
        });
    };

    const handleStartGameClick = () => {
        // Handicap logic for 2-player games
        if (selectedPlayers.length === 2) {
            const [p1, p2] = selectedPlayers;
            const avgDiff = Math.abs(p1.average - p2.average);
            const scoreDiff = avgDiff * (p1.average > 0 && p2.average > 0 ? 10 : 0); // rough estimation of 10 turns

            if (scoreDiff > targetScore * 0.2) { // Offer handicap if score diff is > 20% of target
                const weakerPlayer = p1.average < p2.average ? p1 : p2;
                const handicapPoints = Math.round(scoreDiff / 2 / 5) * 5; // Round to nearest 5
                if (handicapPoints > 0) {
                    setHandicapOffer({ player: weakerPlayer, points: handicapPoints });
                    return;
                }
            }
        }
        
        // No handicap or not a 2-player game, start directly
        onGameStart(selectedPlayerIds, gameTypeKey, gameMode, targetScore, endCondition, allowOvershooting);
    };
    
    const handleAcceptHandicap = () => {
        if (!handicapOffer) return;
        onGameStart(selectedPlayerIds, gameTypeKey, gameMode, targetScore, endCondition, allowOvershooting, {
            playerId: handicapOffer.player.id,
            points: handicapOffer.points
        });
        setHandicapOffer(null);
    };

    const handleDeclineHandicap = () => {
        onGameStart(selectedPlayerIds, gameTypeKey, gameMode, targetScore, endCondition, allowOvershooting);
        setHandicapOffer(null);
    };

    // --- RENDER ---
    const isStartDisabled = selectedPlayerIds.length < 2 || (gameMode === 'team' && selectedPlayerIds.length < 2);
    const buttonClasses = (isActive: boolean) => `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${isActive ? 'bg-[--color-primary] border-[--color-accent] text-white shadow-lg' : 'bg-[--color-surface] border-[--color-border] hover:bg-[--color-surface-light] hover:border-[--color-border-hover]'}`;

    return (
        <>
            {handicapOffer && (
                <HandicapModal 
                    player={handicapOffer.player}
                    handicapValue={handicapOffer.points}
                    onAccept={handleAcceptHandicap}
                    onDecline={handleDeclineHandicap}
                    onClose={() => setHandicapOffer(null)}
                />
            )}
            <div className="w-full max-w-4xl bg-[--color-surface] rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300">
                <h1 className="text-4xl font-extrabold mb-8 text-center text-[--color-accent]">{t('gameSetup.title')}</h1>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Game Options */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.selectType')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => (
                                    <button key={key} onClick={() => setGameTypeKey(key)} className={buttonClasses(gameTypeKey === key)}>
                                        {t(key as any)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.gameMode')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setGameMode('round-robin')} className={buttonClasses(gameMode === 'round-robin')}>
                                    {t('gameSetup.roundRobin')}
                                </button>
                                <button onClick={() => setGameMode('team')} className={buttonClasses(gameMode === 'team')}>
                                    {t('gameSetup.teamPlay')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                                <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.targetScore')}</h3>
                                <input 
                                    type="number" 
                                    value={targetScore} 
                                    onChange={(e) => setTargetScore(Number(e.target.value))} 
                                    className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
                                />
                            </div>
                             <div>
                                <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.endCondition')}</h3>
                                <select value={endCondition} onChange={(e) => setEndCondition(e.target.value as any)} className="w-full h-[52px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                                    <option value="equal-innings">{t('gameSetup.equalInnings')}</option>
                                    <option value="sudden-death">{t('gameSetup.suddenDeath')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${allowOvershooting ? 'bg-[--color-primary]' : 'bg-[--color-surface-light]'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${allowOvershooting ? 'translate-x-6' : ''}`} />
                                </div>
                                <input type="checkbox" checked={allowOvershooting} onChange={(e) => setAllowOvershooting(e.target.checked)} className="hidden" />
                                <span className="font-semibold text-[--color-text-primary]">{t('gameSetup.allowOvershooting')}</span>
                            </label>
                        </div>

                    </div>

                    {/* Right Column: Player Selection */}
                    <div className="space-y-4">
                         <div>
                            <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.availablePlayers')}</h3>
                            <div className="bg-[--color-bg] p-2 rounded-lg h-48 overflow-y-auto space-y-2">
                                {availablePlayers.length > 0 ? (
                                    availablePlayers.map(p => <PlayerListItem key={p.id} player={p} onSelect={() => handlePlayerToggle(p.id)} />)
                                ) : (
                                    <p className="text-center text-[--color-text-secondary] pt-4">{t('noAvailablePlayers')}</p>
                                )}
                            </div>
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-[--color-text-primary] mb-3">{t('gameSetup.playersInGame')} ({selectedPlayerIds.length})</h3>
                            <div className="bg-[--color-bg] p-2 rounded-lg h-48 overflow-y-auto space-y-2">
                                {gameMode === 'team' ? (
                                    <>
                                        <h4 className="font-bold text-[--color-accent] px-2">{t('gameSetup.team1')}</h4>
                                        {team1.map(p => <PlayerListItem key={p.id} player={p} onSelect={() => handlePlayerToggle(p.id)} />)}
                                        <h4 className="font-bold text-[--color-accent] px-2 pt-2">{t('gameSetup.team2')}</h4>
                                        {team2.map(p => <PlayerListItem key={p.id} player={p} onSelect={() => handlePlayerToggle(p.id)} />)}
                                    </>
                                ) : (
                                    selectedPlayers.map(p => <PlayerListItem key={p.id} player={p} onSelect={() => handlePlayerToggle(p.id)} />)
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={handleStartGameClick} disabled={isStartDisabled} className="w-full bg-[--color-green] text-white font-bold py-4 rounded-lg text-xl shadow-lg transition-all duration-200 enabled:hover:bg-[--color-green-hover] enabled:hover:scale-105 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                        {t('gameSetup.startGame')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default GameSetup;

