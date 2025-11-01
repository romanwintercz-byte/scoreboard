import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type Tournament, type Match, type TournamentSettings } from './types';
import Avatar from './Avatar';

// --- Inlined component from TournamentDashboard.tsx ---
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


// --- Inlined component from TournamentSetup.tsx ---
const GAME_TYPE_DEFAULTS: { [key: string]: number } = {
  'gameSetup.fourBall': 200,
  'gameSetup.freeGame': 50,
  'gameSetup.oneCushion': 30,
  'gameSetup.threeCushion': 15,
};

const TournamentSetup: React.FC<{
    players: Player[];
    onSubmit: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onCancel: () => void;
}> = ({ players, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.threeCushion');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS['gameSetup.threeCushion']);
    const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('equal-innings');

    const availablePlayers = useMemo(() => 
        players.filter(p => !selectedPlayerIds.includes(p.id)), 
    [players, selectedPlayerIds]);
    
    const selectedPlayers = useMemo(() =>
        selectedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p),
    [selectedPlayerIds, players]);

    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }
            if (prev.length < 8) {
                return [...prev, playerId];
            }
            return prev;
        });
    };
    
    const handleGameTypeChange = (key: string) => {
        setGameTypeKey(key);
        setTargetScore(GAME_TYPE_DEFAULTS[key] || 50);
    }

    const handleSubmit = () => {
        if (name.trim() && selectedPlayerIds.length >= 3 && selectedPlayerIds.length <= 8) {
            onSubmit(name.trim(), selectedPlayerIds, { gameTypeKey, targetScore, endCondition });
        }
    };
    
    const isSubmitDisabled = name.trim().length === 0 || selectedPlayerIds.length < 3 || selectedPlayerIds.length > 8;
    
    let errorText = '';
    if (selectedPlayerIds.length > 0 && selectedPlayerIds.length < 3) {
        errorText = t('tournament.notEnoughPlayers');
    } else if (selectedPlayerIds.length > 8) {
        errorText = t('tournament.tooManyPlayers');
    }

    const buttonClasses = (isActive: boolean) => 
        `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
            isActive 
            ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
            : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
        }`;

    return (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-white">{t('tournament.setupTitle')}</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Settings */}
                <div className="space-y-6">
                    <div>
                        <label className="text-xl font-bold text-teal-300 mb-2 block">{t('tournament.name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('tournament.namePlaceholder') as string}
                            className="w-full bg-gray-700 text-white text-lg rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.selectType')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(GAME_TYPE_DEFAULTS).map(key => (
                                <button key={key} onClick={() => handleGameTypeChange(key)} className={buttonClasses(gameTypeKey === key)}>
                                    {t(key as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.targetScore')}</h3>
                        <input 
                            type="number"
                            value={targetScore}
                            onChange={(e) => setTargetScore(Number(e.target.value))}
                            className="w-full bg-gray-700 text-white text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.endCondition')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setEndCondition('sudden-death')} className={buttonClasses(endCondition === 'sudden-death')}>
                                {t('gameSetup.suddenDeath')}
                            </button>
                            <button onClick={() => setEndCondition('equal-innings')} className={buttonClasses(endCondition === 'equal-innings')}>
                                {t('gameSetup.equalInnings')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Player Selection */}
                <div>
                     <h3 className="text-xl font-bold text-teal-300 mb-4">{t('tournament.selectPlayers')} ({selectedPlayerIds.length})</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.availablePlayers')}</h4>
                             <div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">
                                {availablePlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}
                             </div>
                        </div>
                        <div>
                             <h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.playersInGame')}</h4>
                             <div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">
                                {selectedPlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}
                             </div>
                        </div>
                     </div>
                     {errorText && <p className="text-red-400 text-center mt-2 font-semibold">{errorText}</p>}
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">
                    {t('cancel')}
                </button>
                <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 enabled:hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    {t('tournament.create')}
                </button>
            </div>
        </div>
    );
};

const PlayerSelectItem: React.FC<{ player: Player, onClick: () => void }> = ({ player, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-gray-700 hover:bg-indigo-600">
    <Avatar avatar={player.avatar} className="w-8 h-8 flex-shrink-0" />
    <span className="font-semibold truncate text-sm">{player.name}</span>
  </button>
);


// --- Sub Components for TournamentView ---
const TournamentList: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    onSelectTournament: (tournament: Tournament) => void;
    onCreateNew: () => void;
}> = ({ tournaments, players, onSelectTournament, onCreateNew }) => {
    const { t } = useTranslation();
    
    const ongoingTournaments = tournaments.filter(t => t.status === 'ongoing');
    const completedTournaments = tournaments.filter(t => t.status === 'completed');

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">{t('tournament.title')}</h1>
                <button onClick={onCreateNew} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                    {t('tournament.create')}
                </button>
            </div>

            {tournaments.length === 0 ? (
                <p className="text-center text-gray-500 mt-16">{t('tournament.noTournaments')}</p>
            ) : (
                <div className="space-y-8">
                    {ongoingTournaments.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.ongoing')}</h2>
                            <div className="space-y-3">
                                {ongoingTournaments.map(t => <TournamentListItem key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />)}
                            </div>
                        </div>
                    )}
                    {completedTournaments.length > 0 && (
                         <div>
                            <h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.completed')}</h2>
                            <div className="space-y-3">
                                {completedTournaments.map(t => <TournamentListItem key={t.id} tournament={t} onSelect={() => onSelectTournament(t)} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const TournamentListItem: React.FC<{ tournament: Tournament, onSelect: () => void }> = ({ tournament, onSelect }) => {
    const { t } = useTranslation();
    return (
        <button onClick={onSelect} className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold text-xl text-white">{tournament.name}</p>
                    <p className="text-sm text-gray-400">
                        {tournament.playerIds.length} players · {new Date(tournament.createdAt).toLocaleDateString()}
                    </p>
                </div>
                 <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-300' : 'bg-gray-600/50 text-gray-400'}`}>
                    {t(`tournament.${tournament.status}`)}
                </span>
            </div>
        </button>
    );
}

// --- Main TournamentView Component ---
const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    onCreateTournament: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
}> = ({ tournaments, players, onCreateTournament, onStartMatch }) => {
    const [view, setView] = useState<'list' | 'setup'>('list');
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };

    if (activeTournament) {
        return (
            <TournamentDashboard 
                tournament={activeTournament}
                players={players}
                onStartMatch={onStartMatch}
                onExit={() => setActiveTournament(null)}
            />
        );
    }

    if (view === 'setup') {
        return (
            <TournamentSetup
                players={players}
                onSubmit={handleCreateTournament}
                onCancel={() => setView('list')}
            />
        );
    }
    
    return (
        <TournamentList
            tournaments={tournaments}
            players={players}
            onSelectTournament={setActiveTournament}
            onCreateNew={() => setView('setup')}
        />
    );
};

export default TournamentView;
