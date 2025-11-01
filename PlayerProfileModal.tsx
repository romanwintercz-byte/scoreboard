import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type AllStats, type GameRecord } from './types';
import Avatar from './Avatar';
import AverageTrendChart from './AverageTrendChart';
import H2HStats from './H2HStats';

type Trend = 'improving' | 'stagnating' | 'worsening';

const TrendIndicator: React.FC<{ trend: Trend }> = ({ trend }) => {
    switch (trend) {
        case 'improving':
            return <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
        case 'worsening':
            return <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
        default:
            return <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
    }
};

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
        
        let trend: Trend = 'stagnating';
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl text-center transform transition-transform duration-300 flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ height: 'auto', maxHeight: '90vh' }}
            >
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    {/* Left Column */}
                    <div className="flex-shrink-0 text-center sm:w-1/3">
                        <Avatar avatar={player.avatar} className="w-32 h-32 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-teal-400 break-words">{player.name}</h2>
                    </div>

                    {/* Right Column */}
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