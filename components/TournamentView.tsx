import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tournament, Player, GameRecord, TournamentSettings, Match } from '../types';
import Avatar from './Avatar';
import { GAME_TYPE_DEFAULTS_SETUP } from '../constants';

// --- HELPER SUB-COMPONENTS ---

const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
    if (playerGames.length === 0) return 0;
    const totalScore = playerGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = playerGames.reduce((sum, game) => sum + game.turns, 0);
    return totalTurns > 0 ? totalScore / totalTurns : 0;
};

const ResultDots: React.FC<{ results: GameRecord['result'][]; dotClassName?: string }> = ({ results, dotClassName = "w-3 h-3" }) => {
    const { t } = useTranslation();
    const resultMapping: { [key in GameRecord['result'] | 'pending']: { title: string, color: string } } = {
        win: { title: t('stats.wins') as string, color: 'bg-[--color-green]' },
        loss: { title: t('stats.losses') as string, color: 'bg-[--color-red]' },
        draw: { title: t('tournament.draws') as string, color: 'bg-[--color-yellow]' },
        pending: { title: 'Pending', color: 'bg-gray-600' }
    };
    const resultsToDisplay = [...results, ...Array(Math.max(0, 6 - results.length)).fill('pending')];
    return (
        <div className="flex gap-1 items-center">
            {resultsToDisplay.map((result, index) => {
                const { title, color } = resultMapping[result as keyof typeof resultMapping];
                return <div key={index} title={title} className={`${color} ${dotClassName} rounded-full shadow-sm`}></div>;
            })}
        </div>
    );
};

const PlayerListItemWithStats: React.FC<{
    player: Player;
    average: number;
    lastSixResults: GameRecord['result'][];
    onClick: () => void;
}> = ({ player, average, lastSixResults, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-[--color-surface-light] hover:bg-[--color-primary]">
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
        <div className="flex-grow min-w-0">
            <span className="font-semibold truncate">{player.name}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 ml-2">
            <span className="text-sm font-mono text-[--color-text-secondary] w-12 text-right">{average.toFixed(2)}</span>
            <ResultDots results={lastSixResults} />
        </div>
    </button>
);


// --- VIEW COMPONENTS ---

const TournamentList: React.FC<{ tournaments: Tournament[]; onSelectTournament: (t: Tournament) => void; onCreateNew: () => void; }> = ({ tournaments, onSelectTournament, onCreateNew }) => {
    const { t } = useTranslation();
    const ongoing = tournaments.filter(t => t.status === 'ongoing');
    const completed = tournaments.filter(t => t.status === 'completed');

    const Item: React.FC<{ tournament: Tournament }> = ({ tournament }) => (
        <button onClick={() => onSelectTournament(tournament)} className="w-full text-left bg-[--color-surface] hover:bg-[--color-surface-light] p-4 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-xl text-[--color-text-primary]">{tournament.name}</p><p className="text-sm text-[--color-text-secondary]">{tournament.playerIds.length} players · {new Date(tournament.createdAt).toLocaleDateString()}</p></div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tournament.status === 'ongoing' ? 'bg-[--color-green]/20 text-[--color-green]' : 'bg-[--color-surface-light]/50 text-[--color-text-secondary]'}`}>{t(`tournament.${tournament.status}`)}</span>
            </div>
        </button>
    );

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8"><h1 className="text-4xl font-extrabold text-[--color-text-primary]">{t('tournament.title')}</h1><button onClick={onCreateNew} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">{t('tournament.create')}</button></div>
            {tournaments.length === 0 ? <p className="text-center text-[--color-text-secondary] mt-16">{t('tournament.noTournaments')}</p> : <div className="space-y-8">{ongoing.length > 0 && <div><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.ongoing')}</h2><div className="space-y-3">{ongoing.map(t => <Item key={t.id} tournament={t} />)}</div></div>}{completed.length > 0 && <div><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.completed')}</h2><div className="space-y-3">{completed.map(t => <Item key={t.id} tournament={t} />)}</div></div>}</div>}
        </div>
    );
};

const TournamentSetup: React.FC<{ players: Player[]; gameLog: GameRecord[]; onSubmit: (name: string, pIds: string[], s: TournamentSettings) => void; onCancel: () => void; }> = ({ players, gameLog, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.threeCushion');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP['gameSetup.threeCushion']);
    const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('equal-innings');

    const getPlayersWithStats = useCallback((playerList: Player[]) => {
        return playerList.map(p => {
            const average = getPlayerAverage(p.id, gameTypeKey, gameLog);
            const lastSixResults = gameLog
                .filter(g => g.playerId === p.id && g.gameType === gameTypeKey)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 6).map(g => g.result).reverse();
            return { ...p, average, lastSixResults };
        });
    }, [gameTypeKey, gameLog]);

    const availablePlayersWithStats = useMemo(() => {
        const available = players.filter(p => !selectedPlayerIds.includes(p.id));
        return getPlayersWithStats(available);
    }, [players, selectedPlayerIds, getPlayersWithStats]);

    const selectedPlayersWithStats = useMemo(() => {
        const selected = selectedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p);
        return getPlayersWithStats(selected);
    }, [selectedPlayerIds, players, getPlayersWithStats]);

    const handlePlayerToggle = (pId: string) => setSelectedPlayerIds(prev => prev.includes(pId) ? prev.filter(id => id !== pId) : (prev.length < 8 ? [...prev, pId] : prev));
    const handleGameTypeChange = (key: string) => { setGameTypeKey(key); setTargetScore(GAME_TYPE_DEFAULTS_SETUP[key] || 50); };
    const handleSubmit = () => { if (name.trim() && selectedPlayerIds.length >= 3 && selectedPlayerIds.length <= 8) { onSubmit(name.trim(), selectedPlayerIds, { gameTypeKey, targetScore, endCondition }); } };
    const isSubmitDisabled = name.trim().length === 0 || selectedPlayerIds.length < 3 || selectedPlayerIds.length > 8;
    let errorText = ''; if (selectedPlayerIds.length > 0 && selectedPlayerIds.length < 3) errorText = t('tournament.notEnoughPlayers'); else if (selectedPlayerIds.length > 8) errorText = t('tournament.tooManyPlayers');
    const buttonClasses = (isActive: boolean) => `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${isActive ? 'bg-[--color-primary] border-[--color-accent] text-white shadow-lg' : 'bg-[--color-surface-light] border-[--color-border] hover:bg-[--color-bg] hover:border-[--color-border-hover]'}`;
    
    return (
        <div className="w-full max-w-4xl bg-[--color-surface] rounded-2xl shadow-2xl p-8 transform transition-all duration-300"><h1 className="text-4xl font-extrabold mb-8 text-center text-[--color-text-primary]">{t('tournament.setupTitle')}</h1><div className="grid md:grid-cols-2 gap-8"><div className="space-y-6"><div><label className="text-xl font-bold text-[--color-accent] mb-2 block">{t('tournament.name')}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('tournament.namePlaceholder') as string} className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-lg rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"/></div><div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('gameSetup.selectType')}</h3><div className="grid grid-cols-2 gap-3">{Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => (<button key={key} onClick={() => handleGameTypeChange(key)} className={buttonClasses(gameTypeKey === key)}>{t(key as any)}</button>))}</div></div><div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('gameSetup.targetScore')}</h3><input type="number" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"/></div><div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('gameSetup.endCondition')}</h3><div className="grid grid-cols-2 gap-4"><button onClick={() => setEndCondition('sudden-death')} className={buttonClasses(endCondition === 'sudden-death')}>{t('gameSetup.suddenDeath')}</button><button onClick={() => setEndCondition('equal-innings')} className={buttonClasses(endCondition === 'equal-innings')}>{t('gameSetup.equalInnings')}</button></div></div></div><div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('tournament.selectPlayers')} ({selectedPlayerIds.length})</h3><div className="grid grid-cols-2 gap-4"><div><h4 className="font-semibold text-[--color-text-secondary] mb-2">{t('gameSetup.availablePlayers')}</h4><div className="bg-black/20 p-2 rounded-lg h-64 overflow-y-auto space-y-2">{availablePlayersWithStats.map(p => <PlayerListItemWithStats key={p.id} player={p} average={p.average} lastSixResults={p.lastSixResults} onClick={() => handlePlayerToggle(p.id)} />)}</div></div><div><h4 className="font-semibold text-[--color-text-secondary] mb-2">{t('gameSetup.playersInGame')}</h4><div className="bg-black/20 p-2 rounded-lg h-64 overflow-y-auto space-y-2">{selectedPlayersWithStats.map(p => <PlayerListItemWithStats key={p.id} player={p} average={p.average} lastSixResults={p.lastSixResults} onClick={() => handlePlayerToggle(p.id)} />)}</div></div></div>{errorText && <p className="text-[--color-red] text-center mt-2 font-semibold">{errorText}</p>}</div></div><div className="mt-8 flex gap-4"><button onClick={onCancel} className="w-full bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button><button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-[--color-green] text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 enabled:hover:bg-[--color-green-hover] disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('tournament.create')}</button></div></div>
    );
};

const TournamentDashboard: React.FC<{ tournament: Tournament; players: Player[]; onExit: () => void; onStartMatch: (tournament: Tournament, match: Match) => void; }> = ({ tournament, players, onExit, onStartMatch }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const leaderboard = useMemo(() => {
        const stats: Record<string, { playerId: string; played: number; wins: number; draws: number; losses: number; points: number; }> = {};
        tournament.playerIds.forEach(id => { stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }; });
        tournament.matches.forEach(match => {
            if (match.status === 'completed' && match.result) {
                const { player1Id, player2Id, result } = match;
                stats[player1Id].played++; stats[player2Id].played++;
                if (result.winnerId === null) { stats[player1Id].draws++; stats[player2Id].draws++; stats[player1Id].points++; stats[player2Id].points++; } 
                else if (result.winnerId === player1Id) { stats[player1Id].wins++; stats[player2Id].losses++; stats[player1Id].points += 3; } 
                else { stats[player2Id].wins++; stats[player1Id].losses++; stats[player2Id].points += 3; }
            }
        });
        return Object.values(stats).sort((a, b) => b.points - a.points);
    }, [tournament]);
    const winner = tournament.status === 'completed' ? playersMap.get(leaderboard[0]?.playerId) : null;
    return (
        <div className="w-full max-w-5xl p-4">
            <div className="flex justify-between items-start mb-6">
                <div><h1 className="text-4xl font-extrabold text-[--color-text-primary]">{tournament.name}</h1><p className="text-[--color-text-secondary]">{t(tournament.settings.gameTypeKey as any)} · {t('gameSetup.targetScore')}: {tournament.settings.targetScore}</p></div>
                <button onClick={onExit} className="bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-2 px-4 rounded-lg transition-colors">{t('tournament.backToList')}</button>
            </div>
            {winner && <div className="bg-[--color-yellow]/20 border-2 border-[--color-yellow] text-[--color-yellow] p-4 rounded-lg mb-6 text-center"><h3 className="text-2xl font-bold">{t('tournament.winner')}</h3><div className="flex items-center justify-center gap-3 mt-2"><Avatar avatar={winner.avatar} className="w-10 h-10" /><p className="text-xl font-semibold">{winner.name}</p></div></div>}
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-[--color-surface] rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.leaderboard')}</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-[--color-border]"><th className="p-2">#</th><th className="p-2">{t('stats.player')}</th><th className="p-2 text-center" title={t('tournament.played') as string}>{t('tournament.played')}</th><th className="p-2 text-center" title={t('tournament.wins') as string}>{t('tournament.wins')}</th><th className="p-2 text-center" title={t('tournament.draws') as string}>{t('tournament.draws')}</th><th className="p-2 text-center" title={t('tournament.losses') as string}>{t('tournament.losses')}</th><th className="p-2 text-center" title={t('tournament.points') as string}>{t('tournament.points')}</th></tr></thead><tbody>{leaderboard.map((row, index) => { const player = playersMap.get(row.playerId); return player ? (<tr key={row.playerId} className="border-b border-[--color-border]/50"><td className="p-2 font-bold">{index + 1}</td><td className="p-2 flex items-center gap-2"><Avatar avatar={player.avatar} className="w-6 h-6" /><span className="font-semibold truncate">{player.name}</span></td><td className="p-2 text-center font-mono">{row.played}</td><td className="p-2 text-center font-mono text-[--color-green]">{row.wins}</td><td className="p-2 text-center font-mono text-[--color-yellow]">{row.draws}</td><td className="p-2 text-center font-mono text-[--color-red]">{row.losses}</td><td className="p-2 text-center font-mono font-bold text-[--color-accent]">{row.points}</td></tr>) : null;})}</tbody></table></div>
                <div className="md:col-span-2 bg-[--color-surface] rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.matches')}</h2><div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">{tournament.matches.map(match => { const p1 = playersMap.get(match.player1Id); const p2 = playersMap.get(match.player2Id); if (!p1 || !p2) return null; return (<div key={match.id} className="bg-black/20 p-3 rounded-lg flex items-center justify-between"><div className="flex items-center gap-2 font-semibold text-lg"><div className="flex items-center gap-2 w-32 justify-end"><span className="truncate text-right">{p1.name}</span><Avatar avatar={p1.avatar} className="w-8 h-8"/></div><span className="text-[--color-text-secondary] mx-2">{t('tournament.matchVs')}</span><div className="flex items-center gap-2 w-32"><Avatar avatar={p2.avatar} className="w-8 h-8"/><span className="truncate">{p2.name}</span></div></div>{match.status === 'pending' ? (<button onClick={() => onStartMatch(tournament, match)} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-4 rounded-lg text-sm">{t('tournament.playMatch')}</button>) : (<div className="text-center font-mono font-bold text-xl"><span>{match.result?.player1Score}</span><span className="text-[--color-text-secondary] mx-2">-</span><span>{match.result?.player2Score}</span></div>)}</div>);})}</div></div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    gameLog: GameRecord[];
    onCreateTournament: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
}> = ({ tournaments, players, gameLog, onCreateTournament, onStartMatch }) => {
    const [view, setView] = useState<'list' | 'setup'>('list');
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };
    
    if (activeTournament) return <TournamentDashboard tournament={activeTournament} players={players} onExit={() => setActiveTournament(null)} onStartMatch={onStartMatch} />;
    if (view === 'setup') return <TournamentSetup players={players} gameLog={gameLog} onSubmit={handleCreateTournament} onCancel={() => setView('list')} />;
    return <TournamentList tournaments={tournaments} onSelectTournament={setActiveTournament} onCreateNew={() => setView('setup')} />;
};

export default TournamentView;