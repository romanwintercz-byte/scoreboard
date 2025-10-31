import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type AllStats, type PlayerStats, type GameRecord, type H2HStats } from './types';
import Avatar from './Avatar';
import AverageTrendChart from './AverageTrendChart';

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
}> = ({ player, stats: allPlayersStats, gameLog, onClose }) => {
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState<string>('all');
    
    // This needs all players to look up opponent names/avatars
    // Fix: Memoize the players array to stabilize it for the dependency array of h2hStats.
    const players = useMemo(() => Object.values(allPlayersStats).flatMap(gameTypeStats => Object.keys(gameTypeStats).map(playerId => ({ id: playerId, name: '', avatar: ''}))), [allPlayersStats]);


    const playerGameTypes = useMemo(() => 
        Object.keys(allPlayersStats).filter(gameType => allPlayersStats[gameType][player.id]),
    [allPlayersStats, player.id]);

    const filteredGameLog = useMemo(() => 
        gameLog.filter(record => 
            record.playerId === player.id && (activeFilter === 'all' || record.gameType === activeFilter)
        ), 
    [gameLog, player.id, activeFilter]);

    const displayedStats = useMemo(() => {
        if (activeFilter === 'all') {
            const aggregated: PlayerStats = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, highestScoreInGame: 0, zeroInnings: 0 };
            playerGameTypes.forEach(gameType => {
                const s = allPlayersStats[gameType][player.id];
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
        return allPlayersStats[activeFilter]?.[player.id];
    }, [activeFilter, allPlayersStats, player.id, playerGameTypes]);

    const h2hStats = useMemo(() => {
        const stats: H2HStats = {};

        const gamesByDate = gameLog.reduce<Record<string, GameRecord[]>>((acc, record) => {
            (acc[record.date] = acc[record.date] || []).push(record);
            return acc;
        }, {});

        const playerGames = Object.values(gamesByDate).filter(gameRecords =>
            gameRecords.some(r => r.playerId === player.id) && gameRecords.length > 1 // Only consider multiplayer games
        );

        playerGames.forEach(gameRecords => {
            const playerRecord = gameRecords.find(r => r.playerId === player.id)!;
            const opponents = gameRecords.filter(r => r.playerId !== player.id);

            opponents.forEach(opponentRecord => {
                const opponentId = opponentRecord.playerId;
                if (!stats[opponentId]) {
                    const opponentInfo = players.find(p => p.id === opponentId);
                    stats[opponentId] = {
                        wins: 0, losses: 0,
                        opponentName: opponentInfo?.name || `Player ${opponentId.substring(0,4)}`,
                        opponentAvatar: opponentInfo?.avatar || '',
                    };
                }

                if (playerRecord.isWin) {
                    stats[opponentId].wins++;
                } else {
                    stats[opponentId].losses++;
                }
            });
        });

        // Fix: Use Object.fromEntries instead of reduce to ensure correct type inference for h2hStats.
        // This resolves the 'unknown' type error when accessing properties on the stats object later.
        return Object.fromEntries(
            Object.entries(stats)
                .sort(([, a], [, b]) => (b.wins + b.losses) - (a.wins + a.losses))
        );

    }, [player.id, gameLog, players]);


    const filterButtonClasses = (isActive: boolean) => 
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive 
            ? 'bg-teal-500 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-center transform transition-transform duration-300 flex flex-col" 
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

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {displayedStats ? (
                        <>
                            <AverageTrendChart records={filteredGameLog} title={t('playerStats.avgTrendTitle') as string} />
                            <GameStatsCard gameType={activeFilter === 'all' ? t('playerStats.allGames') as string : activeFilter} stats={displayedStats} />
                            
                            <div>
                                <h3 className="text-xl font-bold text-teal-300 mt-6 mb-2">{t('playerStats.h2hTitle')}</h3>
                                <div className="bg-gray-900/50 rounded-lg p-2 space-y-2">
                                    {Object.keys(h2hStats).length > 0 ? Object.entries(h2hStats).map(([opponentId, data]) => (
                                        <div key={opponentId} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <Avatar avatar={data.opponentAvatar} className="w-10 h-10" />
                                                <span className="font-semibold text-white">{data.opponentName}</span>
                                            </div>
                                            <div className="font-mono text-lg">
                                                <span className="font-bold text-green-400">{data.wins}</span>
                                                <span className="text-gray-500 mx-1">-</span>
                                                <span className="font-bold text-red-400">{data.losses}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-gray-500 py-4">{t('playerStats.noH2hData')}</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-center text-gray-500 py-8">{t('playerStats.noStats')}</p>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={onClose} 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors flex-shrink-0 mt-4"
                >
                    {t('playerStats.close')}
                </button>
            </div>
        </div>
    );
};

export default PlayerProfileModal;