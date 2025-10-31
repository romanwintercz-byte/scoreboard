
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type AllStats, type Player } from './types';
import Avatar from './Avatar';

const StatsView: React.FC<{
    stats: AllStats;
    players: Player[];
}> = ({ stats, players }) => {
    const { t } = useTranslation();
    const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

    const gameTypes = useMemo(() => Object.keys(stats), [stats]);

    const statData = useMemo(() => {
        if (!selectedGameType || !stats[selectedGameType]) return [];

        const gameStats = stats[selectedGameType];
        
        return Object.keys(gameStats)
            .map(playerId => {
                const playerInfo = players.find(p => p.id === playerId);
                if (!playerInfo) return null;
                return {
                    player: playerInfo,
                    stats: gameStats[playerId],
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .sort((a, b) => b.stats.wins - a.stats.wins || b.stats.gamesPlayed - a.stats.gamesPlayed);

    }, [selectedGameType, stats, players]);
    
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
                                onClick={() => setSelectedGameType(type)}
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
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-gray-700 text-gray-400">
                                    <th className="p-3">#</th>
                                    <th className="p-3">{t('stats.player')}</th>
                                    <th className="p-3 text-center">{t('stats.games')}</th>
                                    <th className="p-3 text-center">{t('stats.wins')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statData.map(({ player, stats }, index) => (
                                    <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                                        <td className="p-3 font-bold text-lg">{index + 1}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar avatar={player.avatar} className="w-10 h-10" />
                                                <span className="font-semibold">{player.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center font-mono">{stats.gamesPlayed}</td>
                                        <td className="p-3 text-center font-mono text-green-400 font-bold">{stats.wins}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 py-8">{t('stats.noStatsForGame')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default StatsView;