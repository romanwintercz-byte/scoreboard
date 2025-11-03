import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, AllStats, GameRecord, GameStats, SinglePlayerExportData } from '../types';
import Avatar from './Avatar';
import { exportDataToFile } from '../utils';

// --- SUB-COMPONENTS ---

const AverageTrendChart: React.FC<{ records: GameRecord[]; title: string }> = ({ records, title }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        const sortedRecords = [...records]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-20);

        if (sortedRecords.length < 2) return [];

        let cumulativeScore = 0;
        let cumulativeTurns = 0;

        return sortedRecords.map((record, index) => {
            cumulativeScore += record.score;
            cumulativeTurns += record.turns;
            return {
                game: index + 1,
                average: cumulativeTurns > 0 ? cumulativeScore / cumulativeTurns : 0,
            };
        });
    }, [records]);

    if (chartData.length < 2) {
        return (
            <div className="bg-black/20 rounded-lg p-4 w-full h-48 flex items-center justify-center">
                 <p className="text-[--color-text-secondary]">{t('playerStats.noStats')}</p>
            </div>
        );
    }
    
    const width = 300;
    const height = 100;
    const padding = 15;

    const maxAvg = Math.max(...chartData.map(d => d.average), 0);
    const minAvg = Math.min(...chartData.map(d => d.average));

    const getX = (index: number) => padding + (index / (chartData.length - 1)) * (width - padding * 2);
    const getY = (avg: number) => height - padding - (maxAvg > 0 ? (avg / maxAvg) * (height - padding * 2) : 0);

    const pathData = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.average)}`).join(' ');

    return (
        <div className="bg-black/20 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-[--color-accent] mb-2 text-center">{title}</h3>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label={title}>
                <text x={padding - 5} y={padding} dy="0.3em" textAnchor="end" className="text-xs fill-[--color-text-secondary] font-mono">{maxAvg.toFixed(2)}</text>
                <text x={padding - 5} y={height - padding} dy="0.3em" textAnchor="end" className="text-xs fill-[--color-text-secondary] font-mono">{minAvg > 0 ? minAvg.toFixed(2) : '0.00'}</text>
                
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-[--color-border]" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-[--color-border]" strokeWidth="0.5" />
                
                <path d={pathData} fill="none" className="stroke-[--color-accent]" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                {chartData.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(d.average)} r="2.5" className="fill-[--color-accent] stroke-[--color-surface]" strokeWidth="1">
                        <title>{`Game ${d.game}: Avg ${d.average.toFixed(2)}`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};

const H2HStats: React.FC<{
    currentPlayerId: string;
    activeGameType: string;
    gameLog: GameRecord[];
    players: Player[];
}> = ({ currentPlayerId, activeGameType, gameLog, players }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

    const h2hData = useMemo(() => {
        const gamesByGameId = new Map<string, GameRecord[]>();
        gameLog.forEach(record => {
            if (!gamesByGameId.has(record.gameId)) {
                gamesByGameId.set(record.gameId, []);
            }
            gamesByGameId.get(record.gameId)!.push(record);
        });

        const opponentData: Record<string, { wins: number; losses: number; draws: number; }> = {};

        for (const gameRecords of gamesByGameId.values()) {
            if (
                gameRecords.length === 2 &&
                gameRecords[0].gameType === activeGameType &&
                gameRecords.some(r => r.playerId === currentPlayerId)
            ) {
                const currentPlayerRecord = gameRecords.find(r => r.playerId === currentPlayerId)!;
                const opponentRecord = gameRecords.find(r => r.playerId !== currentPlayerId)!;
                const opponentId = opponentRecord.playerId;

                if (!opponentData[opponentId]) {
                    opponentData[opponentId] = { wins: 0, losses: 0, draws: 0 };
                }

                if (currentPlayerRecord.result === 'win') {
                    opponentData[opponentId].wins++;
                } else if (currentPlayerRecord.result === 'loss') {
                    opponentData[opponentId].losses++;
                } else if (currentPlayerRecord.result === 'draw') {
                    opponentData[opponentId].draws++;
                }
            }
        }
        
        return Object.entries(opponentData)
            .map(([opponentId, stats]) => ({
                opponent: playersMap.get(opponentId),
                ...stats,
            }))
            .filter(item => item.opponent)
            .sort((a, b) => (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws)); 

    }, [currentPlayerId, activeGameType, gameLog, playersMap]);

    return (
        <div className="bg-black/20 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-[--color-accent] mb-2 text-center">{t('playerStats.h2hTitle')}</h3>
            {h2hData.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {h2hData.map(({ opponent, wins, losses, draws }) => {
                        if (!opponent) return null;
                        const totalGames = wins + losses + draws;
                        const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
                        
                        return (
                            <div key={opponent.id} className="text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar avatar={opponent.avatar} className="w-6 h-6" />
                                        <span className="font-semibold text-sm text-[--color-text-primary] truncate">{opponent.name}</span>
                                    </div>
                                    <div className="font-mono text-sm">
                                        <span className="text-[--color-green]">{wins}</span>
                                        <span className="text-[--color-text-secondary]">-</span>
                                        <span className="text-[--color-yellow]">{draws}</span>
                                        <span className="text-[--color-text-secondary]">-</span>
                                        <span className="text-[--color-red]">{losses}</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-[--color-red]/30 rounded-full">
                                    <div 
                                        className="h-2 bg-[--color-green] rounded-full"
                                        style={{ width: `${winPercentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40">
                     <p className="text-[--color-text-secondary] text-sm">{t('playerStats.noH2hData')}</p>
                </div>
            )}
        </div>
    );
};


// --- MAIN COMPONENT ---

const PlayerProfileModal: React.FC<{
    player: Player;
    stats: AllStats;
    gameLog: GameRecord[];
    players: Player[];
    onClose: () => void;
}> = ({ player, stats: allPlayersStats, gameLog, players, onClose }) => {
    const { t } = useTranslation();
    
    const playerGameTypes = useMemo(() => 
        Object.keys(allPlayersStats).filter(gameType => allPlayersStats[gameType][player.id]),
    [allPlayersStats, player.id]);

    const [activeGameType, setActiveGameType] = useState<string | null>(() => {
        const fourBallKey = 'gameSetup.fourBall';
        if (playerGameTypes.includes(fourBallKey)) {
            return fourBallKey;
        }
        return playerGameTypes[0] || null;
    });
    
    const { displayedStats, playerGamesForType } = useMemo(() => {
        if (!activeGameType) return { displayedStats: null, playerGamesForType: [] };
        
        const gameTypeStats = allPlayersStats[activeGameType]?.[player.id];
        if (!gameTypeStats) return { displayedStats: null, playerGamesForType: [] };

        const gamesForType = gameLog
            .filter(g => g.playerId === player.id && g.gameType === activeGameType)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const last10Games = gamesForType.slice(-10);
        const movingAvgScore = last10Games.reduce((sum, g) => sum + g.score, 0);
        const movingAvgTurns = last10Games.reduce((sum, g) => sum + g.turns, 0);
        const movingAverage = movingAvgTurns > 0 ? movingAvgScore / movingAvgTurns : 0;
        
        const overallAvgForType = gameTypeStats.totalTurns > 0 ? gameTypeStats.totalScore / gameTypeStats.totalTurns : 0;
        
        let trend: 'improving' | 'stagnating' | 'worsening' = 'stagnating';
        if (overallAvgForType > 0 && movingAverage > 0) {
            if (movingAverage > overallAvgForType * 1.05) trend = 'improving';
            if (movingAverage < overallAvgForType * 0.95) trend = 'worsening';
        }
        
        const draws = gameTypeStats.gamesPlayed - gameTypeStats.wins - gameTypeStats.losses;

        return {
            displayedStats: {
                ...gameTypeStats,
                average: overallAvgForType,
                trend,
                draws
            },
            playerGamesForType: gamesForType
        };
    }, [activeGameType, player.id, allPlayersStats, gameLog]);

    const filterButtonClasses = (isActive: boolean) => 
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive 
            ? 'bg-[--color-primary] text-white' 
            : 'bg-[--color-surface-light] text-[--color-text-secondary] hover:bg-[--color-surface]'
        }`;
    
    const TrendIndicator: React.FC<{ trend: 'improving' | 'stagnating' | 'worsening' }> = ({ trend }) => {
        switch (trend) {
            case 'improving':
                return <svg className="w-6 h-6 text-[--color-green]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
            case 'worsening':
                return <svg className="w-6 h-6 text-[--color-red]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
            default:
                return <svg className="w-6 h-6 text-[--color-text-secondary]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
        }
    };
    
    const handleExportPlayer = () => {
        // Fix: Changed type from GameStats to AllStats to correctly handle multiple game types.
        const playerStats: AllStats = {};
        for (const gameType of playerGameTypes) {
            if (allPlayersStats[gameType]?.[player.id]) {
                if (!playerStats[gameType]) playerStats[gameType] = {};
                playerStats[gameType][player.id] = allPlayersStats[gameType][player.id];
            }
        }
        
        const playerGameLog = gameLog.filter(g => g.playerId === player.id);
        
        const exportObject: SinglePlayerExportData = {
            type: 'ScoreCounterPlayerExport',
            version: 1,
            exportedAt: new Date().toISOString(),
            playerProfile: player,
            playerStats,
            gameLog: playerGameLog
        };
        
        exportDataToFile(exportObject, `player-export-${player.name.replace(/\s+/g, '_')}.json`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-4xl text-center transform transition-transform duration-300 flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ height: 'auto', maxHeight: '90vh' }}
            >
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0 text-center sm:w-1/3">
                        <Avatar avatar={player.avatar} className="w-32 h-32 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-[--color-accent] break-words">{player.name}</h2>
                    </div>

                    <div className="flex-grow text-left sm:w-2/3">
                        <div className="w-full overflow-x-auto pb-2 mb-4">
                            <div className="flex items-center gap-2">
                                {playerGameTypes.map(typeKey => (
                                    <button key={typeKey} onClick={() => setActiveGameType(typeKey)} className={filterButtonClasses(activeGameType === typeKey)}>
                                        {t(typeKey as any)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayedStats ? (
                            <div className="bg-black/20 rounded-lg p-4 space-y-4">
                                <div>
                                    <p className="text-[--color-text-secondary] text-sm font-semibold">{t('playerStats.generalAverage')}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-mono font-extrabold text-[--color-text-primary]">{displayedStats.average.toFixed(2)}</span>
                                        <TrendIndicator trend={displayedStats.trend} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[--color-text-secondary] text-sm font-semibold">{t('stats.games')}: {displayedStats.gamesPlayed}</p>
                                    <div className="flex items-center gap-4 font-mono text-2xl mt-1">
                                        <div title={t('stats.wins') as string}><span className="font-bold text-[--color-green]">V</span>: {displayedStats.wins}</div>
                                        <div title={t('tournament.draws') as string}><span className="font-bold text-[--color-yellow]">R</span>: {displayedStats.draws}</div>
                                        <div title={t('stats.losses') as string}><span className="font-bold text-[--color-red]">P</span>: {displayedStats.losses}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-black/20 rounded-lg">
                                <p className="text-center text-[--color-text-secondary]">{t('playerStats.noStats')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto border-t border-[--color-border] pt-4 pr-2 -mr-2 space-y-4">
                    {activeGameType && (
                        <div className="grid md:grid-cols-2 gap-4">
                            <AverageTrendChart 
                                records={playerGamesForType} 
                                title={t('playerStats.avgTrendTitle')} 
                            />
                            <H2HStats 
                                currentPlayerId={player.id}
                                activeGameType={activeGameType}
                                gameLog={gameLog}
                                players={players}
                            />
                        </div>
                    )}
                </div>
                
                <div className="flex gap-4 flex-shrink-0 mt-6">
                     <button 
                        onClick={handleExportPlayer} 
                        className="w-full bg-[--color-primary]/80 hover:bg-[--color-primary] text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        {t('playerProfile.exportPlayer')}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 rounded-lg transition-colors"
                    >
                        {t('playerStats.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfileModal;