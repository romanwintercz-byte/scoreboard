import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type AllStats } from './types';
import Avatar from './Avatar';

type SortKey = 'wins' | 'winRate' | 'avgScore';

const StatsView: React.FC<{ stats: AllStats; players: Player[] }> = ({ stats, players }) => {
    const { t } = useTranslation();
    
    const gameTypes = useMemo(() => Object.keys(stats), [stats]);
    
    const [selectedGameType, setSelectedGameType] = useState<string | null>(gameTypes[0] || null);
    const [sortBy, setSortBy] = useState<SortKey>('wins');

    const leaderboardData = useMemo(() => {
        if (!selectedGameType || !stats[selectedGameType]) {
            return [];
        }

        const gameStats = stats[selectedGameType];
        const playersMap = new Map(players.map(p => [p.id, p]));

        const processedData = Object.entries(gameStats)
            .map(([playerId, playerStats]) => {
                const playerInfo = playersMap.get(playerId);
                if (!playerInfo) return null;

                const winRate = playerStats.gamesPlayed > 0 ? (playerStats.wins / playerStats.gamesPlayed) * 100 : 0;
                const avgScore = playerStats.totalTurns > 0 ? playerStats.totalScore / playerStats.totalTurns : 0;

                return {
                    ...playerInfo,
                    ...playerStats,
                    winRate,
                    avgScore,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

        return processedData.sort((a, b) => {
            switch (sortBy) {
                case 'winRate':
                    return b.winRate - a.winRate;
                case 'avgScore':
                    return b.avgScore - a.avgScore;
                case 'wins':
                default:
                    return b.wins - a.wins;
            }
        });

    }, [selectedGameType, stats, players, sortBy]);

    const buttonClasses = (isActive: boolean) =>
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-teal-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;
    
    return (
        <div className="w-full max-w-4xl p-4">
            <h1 className="text-4xl font-extrabold text-white mb-8 text-center">{t('stats.title')}</h1>

            <div className="mb-6">
                <div className="w-full overflow-x-auto pb-2 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        {gameTypes.length > 0 ? (
                            gameTypes.map(typeKey => (
                                <button key={typeKey} onClick={() => setSelectedGameType(typeKey)} className={buttonClasses(selectedGameType === typeKey)}>
                                    {t(typeKey as any)}
                                </button>
                            ))
                        ) : (
                             <p className="text-center text-gray-500">{t('stats.noStatsForGame')}</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedGameType && leaderboardData.length > 0 && (
                <div className="flex justify-center items-center gap-4 mb-4">
                    <span className="text-sm font-semibold text-gray-400">{t('stats.sortBy')}</span>
                    <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
                        <button onClick={() => setSortBy('wins')} className={buttonClasses(sortBy === 'wins')}>{t('stats.wins')}</button>
                        <button onClick={() => setSortBy('winRate')} className={buttonClasses(sortBy === 'winRate')}>{t('stats.winRate')}</button>
                        <button onClick={() => setSortBy('avgScore')} className={buttonClasses(sortBy === 'avgScore')}>{t('stats.avgScore')}</button>
                    </div>
                </div>
            )}
            
            {selectedGameType ? (
                leaderboardData.length > 0 ? (
                    <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm">{t('stats.player')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.games')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.wins')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.losses')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.winRate')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.avgScore')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.highestScoreInGame')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((player, index) => (
                                    <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <span className="font-bold text-gray-400 w-6 text-center">{index + 1}.</span>
                                            <Avatar avatar={player.avatar} className="w-10 h-10" />
                                            <span className="font-semibold text-white">{player.name}</span>
                                        </td>
                                        <td className="p-4 text-center font-mono">{player.gamesPlayed}</td>
                                        <td className="p-4 text-center font-mono font-bold text-green-400">{player.wins}</td>
                                        <td className="p-4 text-center font-mono font-bold text-red-400">{player.losses}</td>
                                        <td className="p-4 text-center font-mono">{player.winRate.toFixed(0)}%</td>
                                        <td className="p-4 text-center font-mono">{player.avgScore.toFixed(2)}</td>
                                        <td className="p-4 text-center font-mono">{player.highestScoreInGame}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-16">{t('stats.noStatsForGame')}</p>
                )
            ) : (
                <p className="text-center text-gray-500 mt-16">{t('stats.selectGameType')}</p>
            )}
        </div>
    );
};

export default StatsView;
