import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type GameRecord } from './types';
import Avatar from './Avatar';

interface H2HStatsProps {
    currentPlayerId: string;
    activeGameType: string;
    gameLog: GameRecord[];
    players: Player[];
}

type OpponentStats = {
    wins: number;
    losses: number;
    draws: number;
};

const H2HStats: React.FC<H2HStatsProps> = ({ currentPlayerId, activeGameType, gameLog, players }) => {
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

        const opponentData: Record<string, OpponentStats> = {};

        for (const gameRecords of gamesByGameId.values()) {
            // Filter for 1v1 games of the active type including the current player
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
            .sort((a, b) => (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws)); // Sort by most games played

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

export default H2HStats;
