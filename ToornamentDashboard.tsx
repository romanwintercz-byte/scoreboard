import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type Tournament, type Match } from './types';
import Avatar from './Avatar';

type LeaderboardRow = {
    playerId: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
};

const TournamentDashboard: React.FC<{
    tournament: Tournament;
    players: Player[];
    onStartMatch: (tournament: Tournament, match: Match) => void;
    onExit: () => void;
}> = ({ tournament, players, onStartMatch, onExit }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

    const leaderboard = useMemo(() => {
        const stats: Record<string, LeaderboardRow> = {};
        tournament.playerIds.forEach(id => {
            stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 };
        });

        tournament.matches.forEach(match => {
            if (match.status === 'completed' && match.result) {
                const { player1Id, player2Id, result } = match;
                stats[player1Id].played++;
                stats[player2Id].played++;

                if (result.winnerId === null) { // Draw
                    stats[player1Id].draws++;
                    stats[player2Id].draws++;
                    stats[player1Id].points += 1;
                    stats[player2Id].points += 1;
                } else if (result.winnerId === player1Id) {
                    stats[player1Id].wins++;
                    stats[player2Id].losses++;
                    stats[player1Id].points += 3;
                } else {
                    stats[player2Id].wins++;
                    stats[player1Id].losses++;
                    stats[player2Id].points += 3;
                }
            }
        });

        return Object.values(stats).sort((a, b) => b.points - a.points);
    }, [tournament]);

    const winner = tournament.status === 'completed' ? playersMap.get(leaderboard[0]?.playerId) : null;

    return (
        <div className="w-full max-w-5xl p-4">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white">{tournament.name}</h1>
                    <p className="text-gray-400">{t(tournament.settings.gameTypeKey as any)} · {t('gameSetup.targetScore')}: {tournament.settings.targetScore}</p>
                </div>
                 <button onClick={onExit} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('tournament.backToList')}
                </button>
            </div>
            
            {winner && (
                <div className="bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300 p-4 rounded-lg mb-6 text-center">
                    <h3 className="text-2xl font-bold">{t('tournament.winner')}</h3>
                    <div className="flex items-center justify-center gap-3 mt-2">
                        <Avatar avatar={winner.avatar} className="w-10 h-10" />
                        <p className="text-xl font-semibold">{winner.name}</p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* Leaderboard */}
                <div className="md:col-span-1 bg-gray-800 rounded-lg p-4 shadow-lg">
                    <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.leaderboard')}</h2>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-2">#</th>
                                <th className="p-2">{t('stats.player')}</th>
                                <th className="p-2 text-center" title={t('tournament.played') as string}>{t('tournament.played')}</th>
                                <th className="p-2 text-center" title={t('tournament.wins') as string}>{t('tournament.wins')}</th>
                                <th className="p-2 text-center" title={t('tournament.draws') as string}>{t('tournament.draws')}</th>
                                <th className="p-2 text-center" title={t('tournament.losses') as string}>{t('tournament.losses')}</th>
                                <th className="p-2 text-center" title={t('tournament.points') as string}>{t('tournament.points')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((row, index) => {
                                const player = playersMap.get(row.playerId);
                                return player ? (
                                    <tr key={row.playerId} className="border-b border-gray-700/50">
                                        <td className="p-2 font-bold">{index + 1}</td>
                                        <td className="p-2 flex items-center gap-2">
                                            <Avatar avatar={player.avatar} className="w-6 h-6" />
                                            <span className="font-semibold truncate">{player.name}</span>
                                        </td>
                                        <td className="p-2 text-center font-mono">{row.played}</td>
                                        <td className="p-2 text-center font-mono text-green-400">{row.wins}</td>
                                        <td className="p-2 text-center font-mono text-yellow-400">{row.draws}</td>
                                        <td className="p-2 text-center font-mono text-red-400">{row.losses}</td>
                                        <td className="p-2 text-center font-mono font-bold text-teal-300">{row.points}</td>
                                    </tr>
                                ) : null;
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Matches */}
                <div className="md:col-span-2 bg-gray-800 rounded-lg p-4 shadow-lg">
                    <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.matches')}</h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {tournament.matches.map(match => {
                            const player1 = playersMap.get(match.player1Id);
                            const player2 = playersMap.get(match.player2Id);
                            if (!player1 || !player2) return null;

                            return (
                                <div key={match.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-lg">
                                        <div className="flex items-center gap-2 w-32 justify-end">
                                            <span className="truncate text-right">{player1.name}</span>
                                            <Avatar avatar={player1.avatar} className="w-8 h-8"/>
                                        </div>
                                        <span className="text-gray-500 mx-2">{t('tournament.matchVs')}</span>
                                         <div className="flex items-center gap-2 w-32">
                                            <Avatar avatar={player2.avatar} className="w-8 h-8"/>
                                            <span className="truncate">{player2.name}</span>
                                        </div>
                                    </div>
                                    {match.status === 'pending' ? (
                                        <button onClick={() => onStartMatch(tournament, match)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                            {t('tournament.playMatch')}
                                        </button>
                                    ) : (
                                        <div className="text-center font-mono font-bold text-xl">
                                            <span>{match.result?.player1Score}</span>
                                            <span className="text-gray-500 mx-2">-</span>
                                            <span>{match.result?.player2Score}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentDashboard;
