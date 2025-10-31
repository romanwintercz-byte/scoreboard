import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type AllStats, type Player } from './types';
import Avatar from './Avatar';

type SortKey = 'wins' | 'gamesPlayed' | 'winRate' | 'avgScore' | 'highestScoreInGame';

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    onSort: (key: SortKey) => void;
}> = ({ label, sortKey, currentSort, onSort }) => {
    const isActive = currentSort === sortKey;
    return (
        <th className="p-3 text-center cursor-pointer" onClick={() => onSort(sortKey)}>
            <span className={`transition-colors ${isActive ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}>
                {label} {isActive && '▼'}
            </span>
        </th>
    );
};

const StatsView: React.FC<{
    stats: AllStats;
    players: Player[];
}> = ({ stats, players }) => {
    const { t } = useTranslation();
    const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortKey>('wins');

    const gameTypes = useMemo(() => Object.keys(stats), [stats]);

    const statData = useMemo(() => {
        if (!selectedGameType || !stats[selectedGameType]) return [];

        const gameStats = stats[selectedGameType];
        
        const data = Object.keys(gameStats)
            .map(playerId => {
                const playerInfo = players.find(p => p.id === playerId);
                if (!playerInfo) return null;

                const playerStats = gameStats[playerId];
                const winRate = playerStats.gamesPlayed > 0 ? (playerStats.wins / playerStats.gamesPlayed) : 0;
                const avgScore = playerStats.totalTurns > 0 ? (playerStats.totalScore / playerStats.totalTurns) : 0;

                return {
                    player: playerInfo,
                    stats: playerStats,
                    calculated: { winRate, avgScore }
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

        // Sorting logic
        return data.sort((a, b) => {
            switch (sortBy) {
                case 'winRate':
                    return b.calculated.winRate - a.calculated.winRate;
                case 'avgScore':
                    return b.calculated.avgScore - a.calculated.avgScore;
                case 'highestScoreInGame':
                    return b.stats.highestScoreInGame - a.stats.highestScoreInGame;
                case 'gamesPlayed':
                    return b.stats.gamesPlayed - a.stats.gamesPlayed;
                case 'wins':
                default:
                    return b.stats.wins - a.stats.wins;
            }
        });

    }, [selectedGameType, stats, players, sortBy]);
    
    const buttonClasses = (isActive: boolean) => 
    `w-full text-center p-3 rounded-lg text-md font-semibold transition-all duration-200 border-2 ${
        isActive 
        ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
    }`;


    return (
        <div className="w-full max-w-4xl p-4">
            <h1 className="text-4xl font-extrabold text-white mb-8 text-center">{t('stats.title')}</h1>
            
            <div className="mb-8">
                <h2 className="text-xl font-bold text-teal-300 mb-4 text-center">{t('stats.selectGameType')}</h2>
                {gameTypes.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {gameTypes.map(type => (
                            <button 
                                key={type} 
                                onClick={() => {
                                    setSelectedGameType(type);
                                    setSortBy('wins'); // Reset sort on game change
                                }}
                                className={buttonClasses(selectedGameType === type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-4">{t('stats.noStatsForGame')}</p>
                )}
            </div>

            {selectedGameType && (
                <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
                    {statData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="border-b-2 border-gray-700">
                                        <th className="p-3 text-gray-400">#</th>
                                        <th className="p-3 text-gray-400">{t('stats.player')}</th>
                                        <SortableHeader label={t('stats.games')} sortKey="gamesPlayed" currentSort={sortBy} onSort={setSortBy} />
                                        <SortableHeader label={t('stats.wins')} sortKey="wins" currentSort={sortBy} onSort={setSortBy} />
                                        <SortableHeader label={t('stats.winRate')} sortKey="winRate" currentSort={sortBy} onSort={setSortBy} />
                                        <SortableHeader label={t('stats.avgScore')} sortKey="avgScore" currentSort={sortBy} onSort={setSortBy} />
                                        <SortableHeader label={t('stats.highestScoreInGame')} sortKey="highestScoreInGame" currentSort={sortBy} onSort={setSortBy} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {statData.map(({ player, stats, calculated }, index) => {
                                        return (
                                            <tr key={player.id} className="border-b border-gray-700/50">
                                                <td className="p-3 font-bold text-lg">{index + 1}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar avatar={player.avatar} className="w-10 h-10" />
                                                        <span className="font-semibold">{player.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-mono">{stats.gamesPlayed}</td>
                                                <td className="p-3 text-center font-mono text-green-400 font-bold">{stats.wins}</td>
                                                <td className="p-3 text-center font-mono">{(calculated.winRate * 100).toFixed(0)}%</td>
                                                <td className="p-3 text-center font-mono text-yellow-400">{calculated.avgScore.toFixed(2)}</td>
                                                <td className="p-3 text-center font-mono text-teal-400">{stats.highestScoreInGame}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">{t('stats.noStatsForGame')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatsView;