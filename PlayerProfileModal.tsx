import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, AllStats, GameRecord } from './types';
import Avatar from './Avatar';

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
            <div className="bg-gray-900/50 rounded-lg p-4 w-full h-48 flex items-center justify-center">
                 <p className="text-gray-500">{t('playerStats.noStats')}</p>
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
        <div className="bg-gray-900/50 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-teal-300 mb-2 text-center">{title}</h3>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label={title}>
                <text x={padding - 5} y={padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{maxAvg.toFixed(2)}</text>
                <text x={padding - 5} y={height - padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{minAvg > 0 ? minAvg.toFixed(2) : '0.00'}</text>
                
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-gray-700" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-gray-700" strokeWidth="0.5" />
                
                <path d={pathData} fill="none" className="stroke-teal-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                {chartData.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(d.average)} r="2.5" className="fill-teal-300 stroke-gray-900" strokeWidth="1">
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
        <div className="bg-gray-900/50 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-teal-300 mb-2 text-center">{t('playerStats.h2hTitle')}</h3>
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
                                        <span className="font-semibold text-sm text-white truncate">{opponent.name}</span>
                                    </div>
                                    <div className="font-mono text-sm">
                                        <span className="text-green-400">{wins}</span>
                                        <span className="text-gray-500">-</span>
                                        <span className="text-yellow-400">{draws}</span>
                                        <span className="text-gray-500">-</span>
                                        <span className="text-red-400">{losses}</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-red-500/30 rounded-full">
                                    <div 
                                        className="h-2 bg-green-500 rounded-full"
                                        style={{ width: `${winPercentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40">
                     <p className="text-gray-500 text-sm">{t('playerStats.noH2hData')}</p>
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
            ? 'bg-teal-500 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;
    
    const TrendIndicator: React.FC<{ trend: 'improving' | 'stagnating' | 'worsening' }> = ({ trend }) => {
        switch (trend) {
            case 'improving':
                return <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
            case 'worsening':
                return <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
            default:
                return <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl text-center transform transition-transform duration-300 flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ height: 'auto', maxHeight: '90vh' }}
            >
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0 text-center sm:w-1/3">
                        <Avatar avatar={player.avatar} className="w-32 h-32 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-teal-400 break-words">{player.name}</h2>
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
                            <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold">{t('playerStats.generalAverage')}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-mono font-extrabold text-white">{displayedStats.average.toFixed(2)}</span>
                                        <TrendIndicator trend={displayedStats.trend} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold">{t('stats.games')}: {displayedStats.gamesPlayed}</p>
                                    <div className="flex items-center gap-4 font-mono text-2xl mt-1">
                                        <div title={t('stats.wins') as string}><span className="font-bold text-green-400">V</span>: {displayedStats.wins}</div>
                                        <div title={t('tournament.draws') as string}><span className="font-bold text-yellow-400">R</span>: {displayedStats.draws}</div>
                                        <div title={t('stats.losses') as string}><span className="font-bold text-red-400">P</span>: {displayedStats.losses}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
                                <p className="text-center text-gray-500">{t('playerStats.noStats')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto border-t border-gray-700 pt-4 pr-2 -mr-2 space-y-4">
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
                
                <button 
                    onClick={onClose} 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors flex-shrink-0 mt-6"
                >
                    {t('playerStats.close')}
                </button>
            </div>
        </div>
    );
};

export default PlayerProfileModal;
