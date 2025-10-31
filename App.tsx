import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type AllStats, type PlayerStats, type GameRecord } from './types';
import Avatar from './Avatar';
import StatsChart from './StatsChart';

const StatRow: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
        <p className="text-gray-400">{label}</p>
        <p className={`font-bold font-mono text-lg ${className}`}>{value}</p>
    </div>
);

const GameStatsCard: React.FC<{ gameType: string; stats: PlayerStats }> = ({ gameType, stats }) => {
    const { t } = useTranslation();
    const winRate = stats.gamesPlayed > 0 ? `${(stats.wins / stats.gamesPlayed * 100).toFixed(0)}%` : 'N/A';
    const avgScore = stats.totalTurns > 0 ? (stats.totalScore / stats.totalTurns).toFixed(2) : '0.00';

    return (
        <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-xl font-bold text-teal-300 mb-2">{gameType}</h3>
            <StatRow label={t('stats.games')} value={stats.gamesPlayed} className="text-white" />
            <StatRow label={t('stats.wins')} value={stats.wins} className="text-green-400" />
            <StatRow label={t('stats.losses')} value={stats.losses} className="text-red-400" />
            <StatRow label={t('stats.winRate')} value={winRate} className="text-yellow-400" />
            <StatRow label={t('stats.avgScore')} value={avgScore} className="text-teal-300" />
            <StatRow label={t('stats.highestScoreInGame')} value={stats.highestScoreInGame} className="text-indigo-400" />
            <StatRow label={t('stats.zeroInnings')} value={stats.zeroInnings} className="text-gray-300" />
        </div>
    );
};


const PlayerProfileModal: React.FC<{
    player: Player;
    stats: AllStats;
    gameLog: GameRecord[];
    onClose: () => void;
}> = ({ player, stats, gameLog, onClose }) => {
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const playerGameTypes = useMemo(() => 
        Object.keys(stats).filter(gameType => stats[gameType][player.id]),
    [stats, player.id]);

    const displayedStats = useMemo(() => {
        if (activeFilter === 'all') {
            const aggregated: PlayerStats = {
                gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, highestScoreInGame: 0, zeroInnings: 0
            };
            playerGameTypes.forEach(gameType => {
                const s = stats[gameType][player.id];
                if (s) {
                    aggregated.gamesPlayed += s.gamesPlayed;
                    aggregated.wins += s.wins;
                    aggregated.losses += s.losses;
                    aggregated.totalTurns += s.totalTurns;
                    aggregated.totalScore += s.totalScore;
                    aggregated.zeroInnings += s.zeroInnings;
                    aggregated.highestScoreInGame = Math.max(aggregated.highestScoreInGame, s.highestScoreInGame);
                }
            });
            return aggregated;
        }
        return stats[activeFilter]?.[player.id];
    }, [activeFilter, stats, player.id, playerGameTypes]);

    const { generalAverage, movingAverage } = useMemo(() => {
        const relevantGames = gameLog.filter(record => 
            record.playerId === player.id && (activeFilter === 'all' || record.gameType === activeFilter)
        );

        let totalScore = 0;
        let totalTurns = 0;
        relevantGames.forEach(game => {
            totalScore += game.score;
            totalTurns += game.turns;
        });
        const gp = totalTurns > 0 ? (totalScore / totalTurns) : 0;

        const sortedGames = relevantGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        let last10Score = 0;
        let last10Turns = 0;
        sortedGames.forEach(game => {
            last10Score += game.score;
            last10Turns += game.turns;
        });
        const ma = last10Turns > 0 ? (last10Score / last10Turns) : 0;
        
        return { generalAverage: gp, movingAverage: ma };
    }, [player.id, gameLog, activeFilter]);

    const filterButtonClasses = (isActive: boolean) => 
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive 
            ? 'bg-teal-500 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-center transform transition-transform duration-300 flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ height: '90vh' }}
            >
                <div className="flex-shrink-0">
                    <div className="flex flex-col items-center mb-4">
                        <Avatar avatar={player.avatar} className="w-24 h-24 mb-4" />
                        <h2 className="text-3xl font-bold text-teal-400">{player.name}</h2>
                    </div>
                    <div className="w-full overflow-x-auto pb-2 mb-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveFilter('all')} className={filterButtonClasses(activeFilter === 'all')}>{t('playerStats.allGames')}</button>
                            {playerGameTypes.map(type => (
                                <button key={type} onClick={() => setActiveFilter(type)} className={filterButtonClasses(activeFilter === type)}>{type}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {displayedStats ? (
                    <>
                        <div className="mb-4 flex-shrink-0">
                            <StatsChart 
                                generalAverage={generalAverage}
                                movingAverage={movingAverage}
                            />
                        </div>
                        <div className="text-left overflow-y-auto pr-2 space-y-4 flex-grow mb-4">
                            <GameStatsCard gameType={activeFilter === 'all' ? t('playerStats.allGames') as string : activeFilter} stats={displayedStats} />
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-center text-gray-500 py-8">{t('playerStats.noStats')}</p>
                    </div>
                )}
                
                <button 
                    onClick={onClose} 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors flex-shrink-0"
                >
                    {t('playerStats.close')}
                </button>
            </div>
        </div>
    );
};

export default PlayerProfileModal;