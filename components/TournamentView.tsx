import React, { useState, useMemo, useCallback, useEffect, useRef, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tournament, Player, GameRecord, TournamentSettings, Match, TournamentFormat, SingleTournamentExportData } from '../types';
import { AppDataHook } from '../hooks';
import { exportDataToFile, dataURLtoFile } from '../utils';
import Avatar from './Avatar';
import { GAME_TYPE_DEFAULTS_SETUP, FALLBACK_AVATAR_PATH } from '../constants';

// --- HELPER SUB-COMPONENTS ---

const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog.filter(g => g.playerId === playerId && g.gameType === gameTypeKey);
    if (playerGames.length === 0) return 0;
    const totalScore = playerGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = playerGames.reduce((sum, game) => sum + game.turns, 0);
    return totalTurns > 0 ? totalScore / totalTurns : 0;
};

const PlayerListItem: React.FC<{
    player: Player;
    onClick: () => void;
    average?: number;
}> = ({ player, onClick, average }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-[--color-surface-light] hover:bg-[--color-primary]">
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
        <div className="flex-grow min-w-0">
            <span className="font-semibold truncate">{player.name}</span>
            {average !== undefined && (
                 <p className="text-xs text-[--color-text-secondary] font-mono">Avg: {average.toFixed(2)}</p>
            )}
        </div>
    </button>
);


// --- VIEW COMPONENTS ---

const TournamentList: React.FC<{ 
    tournaments: Tournament[]; 
    onSelectTournament: (t: Tournament) => void; 
    onCreateNew: () => void; 
    appData: AppDataHook;
}> = ({ tournaments, onSelectTournament, onCreateNew, appData }) => {
    const { t } = useTranslation();
    const { setPlayers, setTournaments } = appData;
    const importFileRef = useRef<HTMLInputElement>(null);

    const ongoing = tournaments.filter(t => t.status === 'ongoing');
    const completed = tournaments.filter(t => t.status === 'completed');

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not text");
                const parsed = JSON.parse(text);

                if (parsed.type !== 'ScoreCounterTournamentExport' || !parsed.tournament || !parsed.players) {
                    throw new Error(t('import.error.invalid') as string);
                }
                const data = parsed as SingleTournamentExportData;

                const existingTournament = tournaments.find(t => t.id === data.tournament.id);
                if (existingTournament) {
                    if (!window.confirm(t('tournament.importOverwrite.body', { name: data.tournament.name }) as string)) {
                        return;
                    }
                }

                setPlayers(prevPlayers => {
                    const playersToAdd = data.players.filter(pImport => !prevPlayers.some(pLocal => pLocal.id === pImport.id));
                    return [...prevPlayers, ...playersToAdd];
                });
                
                setTournaments(prevTournaments => {
                    const filtered = prevTournaments.filter(t => t.id !== data.tournament.id);
                    return [...filtered, data.tournament].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                });

                alert(t('import.tournamentSuccess', { name: data.tournament.name }));

            } catch (error) {
                console.error("Import failed:", error);
                alert((error as Error).message || t('import.error.invalid'));
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.onerror = () => alert(t('import.error.file'));
        reader.readAsText(file);
    };

    const Item: React.FC<{ tournament: Tournament }> = ({ tournament }) => (
        <button onClick={() => onSelectTournament(tournament)} className="w-full text-left bg-[--color-surface] hover:bg-[--color-surface-light] p-4 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-xl text-[--color-text-primary]">{tournament.name}</p><p className="text-sm text-[--color-text-secondary]">{t(`tournament.format.${tournament.format}`)} · {tournament.playerIds.length} players · {new Date(tournament.createdAt).toLocaleDateString()}</p></div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tournament.status === 'ongoing' ? 'bg-[--color-green]/20 text-[--color-green]' : 'bg-[--color-surface-light]/50 text-[--color-text-secondary]'}`}>{t(`tournament.${tournament.status}`)}</span>
            </div>
        </button>
    );

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-[--color-text-primary]">{t('tournament.title')}</h1>
                <div className="flex gap-2">
                    <button onClick={handleImportClick} className="bg-[--color-primary]/80 hover:bg-[--color-primary] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                        {t('tournament.import')}
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleFileSelected} accept=".json" className="hidden" />
                    <button onClick={onCreateNew} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">{t('tournament.create')}</button>
                </div>
            </div>
            {tournaments.length === 0 ? <p className="text-center text-[--color-text-secondary] mt-16">{t('tournament.noTournaments')}</p> : <div className="space-y-8">{ongoing.length > 0 && <div><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.ongoing')}</h2><div className="space-y-3">{ongoing.map(t => <Item key={t.id} tournament={t} />)}</div></div>}{completed.length > 0 && <div><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.completed')}</h2><div className="space-y-3">{completed.map(t => <Item key={t.id} tournament={t} />)}</div></div>}</div>}
        </div>
    );
};

const TournamentSetup: React.FC<{ players: Player[]; gameLog: GameRecord[]; onSubmit: (name: string, pIds: string[], s: TournamentSettings) => void; onCancel: () => void; }> = ({ players, gameLog, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [format, setFormat] = useState<TournamentFormat>('round-robin');
    const [seeding, setSeeding] = useState<'random' | 'average'>('random');
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.threeCushion');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP['gameSetup.threeCushion']);
    
    const [numGroups, setNumGroups] = useState(2);
    const [playersAdvancing, setPlayersAdvancing] = useState(1);

    const maxPlayers = useMemo(() => {
        if (format === 'round-robin') return 8;
        return 32;
    }, [format]);

    const minPlayers = useMemo(() => {
        if (format === 'combined') return 4;
        return 3;
    }, [format]);

    const getPlayersWithAverage = useCallback((playerList: Player[]) => {
        return playerList.map(p => ({ ...p, average: getPlayerAverage(p.id, gameTypeKey, gameLog) }));
    }, [gameTypeKey, gameLog]);

    const availablePlayers = useMemo(() => {
        const available = players.filter(p => !selectedPlayerIds.includes(p.id));
        return getPlayersWithAverage(available);
    }, [players, selectedPlayerIds, getPlayersWithAverage]);

    const selectedPlayers = useMemo(() => {
        const selected = selectedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p);
        return getPlayersWithAverage(selected);
    }, [selectedPlayerIds, players, getPlayersWithAverage]);

    const handlePlayerToggle = (pId: string) => {
        setSelectedPlayerIds(prev => {
            if (prev.includes(pId)) return prev.filter(id => id !== pId);
            return prev.length < maxPlayers ? [...prev, pId] : prev;
        });
    };
    
    const handleGameTypeChange = (key: string) => { setGameTypeKey(key); setTargetScore(GAME_TYPE_DEFAULTS_SETUP[key] || 50); };
    
    const handleSubmit = () => {
        if (name.trim() && selectedPlayerIds.length >= minPlayers && selectedPlayerIds.length <= maxPlayers) {
            const settings: TournamentSettings = { format, gameTypeKey, targetScore, endCondition: 'equal-innings' };
            if (format === 'knockout') settings.seeding = seeding;
            if (format === 'combined') {
                settings.seeding = seeding;
                settings.numGroups = numGroups;
                settings.playersAdvancing = playersAdvancing;
            }
            onSubmit(name.trim(), selectedPlayerIds, settings);
        }
    };
    
    const isSubmitDisabled = name.trim().length === 0 || selectedPlayerIds.length < minPlayers || selectedPlayerIds.length > maxPlayers;
    let errorText = '';
    if (selectedPlayerIds.length > 0 && selectedPlayerIds.length < minPlayers) errorText = t('tournament.notEnoughPlayers', { count: minPlayers });
    else if (selectedPlayerIds.length > maxPlayers) errorText = t(format === 'round-robin' ? 'tournament.tooManyPlayers' : 'tournament.tooManyPlayersKnockout');

    const buttonClasses = (isActive: boolean) => `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${isActive ? 'bg-[--color-primary] border-[--color-accent] text-white shadow-lg' : 'bg-[--color-surface-light] border-transparent hover:border-[--color-border]'}`;
    
    return (
        <div className="w-full max-w-4xl bg-[--color-surface] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <h1 className="text-3xl font-extrabold text-center text-[--color-accent]">{t('tournament.setupTitle')}</h1>
            {/* Name and Format */}
            <div className="grid md:grid-cols-2 gap-6">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('tournament.namePlaceholder') as string} className="w-full bg-[--color-surface-light] text-[--color-text-primary] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--color-accent] text-lg"/>
                <div className="grid grid-cols-3 gap-2 bg-[--color-bg] p-1 rounded-lg">
                    <button onClick={() => setFormat('round-robin')} className={buttonClasses(format === 'round-robin')}>{t('tournament.format.roundRobin')}</button>
                    <button onClick={() => setFormat('knockout')} className={buttonClasses(format === 'knockout')}>{t('tournament.format.knockout')}</button>
                    <button onClick={() => setFormat('combined')} className={buttonClasses(format === 'combined')}>{t('tournament.format.combined')}</button>
                </div>
            </div>
            
            {/* Player Selection */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2">{t('gameSetup.availablePlayers')} ({availablePlayers.length})</h3>
                    <div className="bg-[--color-bg] rounded-lg p-2 space-y-2 h-64 overflow-y-auto">{availablePlayers.map(p => <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} average={p.average} />)}</div>
                </div>
                <div>
                    <h3 className="font-bold mb-2">{t('tournament.selectPlayers')} ({selectedPlayerIds.length} / {maxPlayers})</h3>
                    <div className="bg-[--color-bg] rounded-lg p-2 space-y-2 h-64 overflow-y-auto">{selectedPlayers.map(p => <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} average={p.average} />)}</div>
                </div>
            </div>

            {/* Settings */}
            <div className="bg-[--color-bg] p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <select value={gameTypeKey} onChange={e => handleGameTypeChange(e.target.value)} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                        {Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => <option key={key} value={key}>{t(key as any)}</option>)}
                     </select>
                     <input type="number" value={targetScore} onChange={e => setTargetScore(Number(e.target.value))} className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-center text-lg font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"/>
                     {(format === 'knockout' || format === 'combined') && (
                         <select value={seeding} onChange={e => setSeeding(e.target.value as any)} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                            <option value="random">{t('tournament.seeding.random')}</option><option value="average">{t('tournament.seeding.average')}</option>
                        </select>
                     )}
                </div>
                {format === 'combined' && (
                    <div className="grid grid-cols-2 gap-4">
                         <select value={numGroups} onChange={e => setNumGroups(Number(e.target.value))} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                            {[2, 4, 8].map(n => <option key={n} value={n} disabled={selectedPlayerIds.length < n*2}>{t('tournament.numGroups')}: {n}</option>)}
                         </select>
                         <select value={playersAdvancing} onChange={e => setPlayersAdvancing(Number(e.target.value))} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                            {[1, 2].map(n => <option key={n} value={n} disabled={selectedPlayerIds.length < numGroups*n*2}>{t('tournament.playersAdvancing')}: {n}</option>)}
                         </select>
                    </div>
                )}
            </div>
            
            {errorText && <p className="text-center text-[--color-red] font-semibold">{errorText}</p>}
            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-[--color-border]">
                <button onClick={onCancel} className="w-full bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button>
                <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('tournament.create')}</button>
            </div>
        </div>
    );
};

// --- Tournament Detail View Components ---

const MatchCard: React.FC<{
    match: Match;
    playersMap: Map<string, Player>;
    onPlayMatch: () => void;
}> = ({ match, playersMap, onPlayMatch }) => {
    const { t } = useTranslation();
    const p1 = match.player1Id ? playersMap.get(match.player1Id) : null;
    const p2 = match.player2Id ? playersMap.get(match.player2Id) : null;

    if (match.status === 'bye') {
        return (
            <div className="bg-black/20 p-3 rounded-lg text-center text-sm text-[--color-text-secondary]">
                BYE
            </div>
        );
    }
    
    return (
        <div className="bg-black/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-2/5">
                    {p1 ? <><Avatar avatar={p1.avatar} className="w-8 h-8"/> <span className="font-semibold truncate">{p1.name}</span></> : <span className="text-sm text-[--color-text-secondary]">TBD</span>}
                </div>
                <div className="text-center">
                    {match.status === 'completed' && match.result ? (
                        <span className="font-mono font-bold text-lg">{match.result.player1Score} - {match.result.player2Score}</span>
                    ) : (
                        <span className="text-sm font-bold text-[--color-accent]">{t('tournament.matchVs')}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 justify-end w-2/5">
                    {p2 ? <><span className="font-semibold truncate text-right">{p2.name}</span> <Avatar avatar={p2.avatar} className="w-8 h-8"/></> : <span className="text-sm text-[--color-text-secondary]">TBD</span>}
                </div>
            </div>
            {match.status === 'pending' && p1 && p2 && (
                <button onClick={onPlayMatch} className="mt-3 w-full bg-[--color-green] hover:bg-[--color-green-hover] text-white text-sm font-bold py-1.5 rounded-md">{t('tournament.playMatch')}</button>
            )}
        </div>
    );
};

const Leaderboard: React.FC<{ playerIds: string[], matches: Match[], playersMap: Map<string, Player> }> = ({ playerIds, matches, playersMap }) => {
    const { t } = useTranslation();
    const standings = useMemo(() => {
        const stats: { [id: string]: { p: number, w: number, d: number, l: number, pts: number, scoreDiff: number } } = {};
        playerIds.forEach(id => { stats[id] = { p: 0, w: 0, d: 0, l: 0, pts: 0, scoreDiff: 0 }; });

        matches.forEach(m => {
            if (m.status === 'completed' && m.result && m.player1Id && m.player2Id) {
                const { player1Id, player2Id, result } = m;
                stats[player1Id].p++;
                stats[player2Id].p++;
                stats[player1Id].scoreDiff += result.player1Score - result.player2Score;
                stats[player2Id].scoreDiff += result.player2Score - result.player1Score;
                if (result.winnerId === null) {
                    stats[player1Id].d++; stats[player2Id].d++;
                    stats[player1Id].pts++; stats[player2Id].pts++;
                } else if (result.winnerId === player1Id) {
                    stats[player1Id].w++; stats[player2Id].l++;
                    stats[player1Id].pts += 3;
                } else {
                    stats[player2Id].w++; stats[player1Id].l++;
                    stats[player2Id].pts += 3;
                }
            }
        });

        return Object.entries(stats)
            .map(([playerId, data]) => ({ playerId, ...data }))
            .sort((a, b) => b.pts - a.pts || b.scoreDiff - a.scoreDiff);
    }, [playerIds, matches]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-xs text-[--color-text-secondary] uppercase">
                    <tr>
                        <th className="p-2">{t('stats.player')}</th>
                        <th className="p-2 text-center">{t('tournament.played')}</th>
                        <th className="p-2 text-center">{t('tournament.wins')}</th>
                        <th className="p-2 text-center">{t('tournament.draws')}</th>
                        <th className="p-2 text-center">{t('tournament.losses')}</th>
                        <th className="p-2 text-center">+/-</th>
                        <th className="p-2 text-center">{t('tournament.points')}</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map(({ playerId, p, w, d, l, pts, scoreDiff }) => {
                        const player = playersMap.get(playerId);
                        return (
                            <tr key={playerId} className="border-t border-[--color-border]">
                                <td className="p-2 flex items-center gap-2"><Avatar avatar={player?.avatar || ''} className="w-8 h-8"/> <span className="font-semibold">{player?.name}</span></td>
                                <td className="p-2 text-center font-mono">{p}</td>
                                <td className="p-2 text-center font-mono">{w}</td>
                                <td className="p-2 text-center font-mono">{d}</td>
                                <td className="p-2 text-center font-mono">{l}</td>
                                <td className="p-2 text-center font-mono">{scoreDiff}</td>
                                <td className="p-2 text-center font-mono font-bold">{pts}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const GroupStageView: React.FC<{ tournament: Tournament, playersMap: Map<string, Player>, onPlayMatch: (match: Match) => void }> = ({ tournament, playersMap, onPlayMatch }) => {
    const { t } = useTranslation();
    const groups = useMemo(() => {
        const groupIds = [...new Set(tournament.matches.map(m => m.groupId).filter(Boolean))];
        return groupIds.map(groupId => {
            const groupMatches = tournament.matches.filter(m => m.groupId === groupId);
            const playerIds = [...new Set(groupMatches.flatMap(m => [m.player1Id, m.player2Id]))].filter((p): p is string => !!p);
            return { groupId, matches: groupMatches, playerIds };
        });
    }, [tournament]);

    return (
        <div className="space-y-8">
            {groups.map(({ groupId, matches, playerIds }, index) => (
                <div key={groupId}>
                    <h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('tournament.group', { letter: String.fromCharCode(65 + index) })}</h3>
                    <div className="bg-[--color-surface] p-4 rounded-lg space-y-4">
                        <Leaderboard playerIds={playerIds} matches={matches} playersMap={playersMap} />
                        <div>
                            <h4 className="font-bold mb-2">{t('tournament.matches')}</h4>
                            <div className="space-y-2">{matches.map(m => <MatchCard key={m.id} match={m} playersMap={playersMap} onPlayMatch={() => onPlayMatch(m)} />)}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const KnockoutBracket: React.FC<{ tournament: Tournament, playersMap: Map<string, Player>, onPlayMatch: (match: Match) => void }> = ({ tournament, playersMap, onPlayMatch }) => {
    const { t } = useTranslation();
    const rounds = useMemo(() => {
        const matchesByRound: { [round: number]: Match[] } = {};
        const knockoutMatches = tournament.matches.filter(m => !m.groupId);
        knockoutMatches.forEach(m => {
            const round = m.round || 0;
            if (!matchesByRound[round]) matchesByRound[round] = [];
            matchesByRound[round].push(m);
        });
        return Object.entries(matchesByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([, matches]) => matches);
    }, [tournament]);

    const getRoundTitle = (roundIndex: number, totalRounds: number) => {
        const numTeams = 2 ** (totalRounds - roundIndex);
        if (numTeams === 2) return t('tournament.final');
        if (numTeams === 4) return t('tournament.semifinals');
        if (numTeams === 8) return t('tournament.quarterfinals');
        return t('tournament.roundOf', { count: numTeams });
    };

    return (
        <div className="flex gap-4 overflow-x-auto p-4 bg-[--color-bg] rounded-lg">
            {rounds.map((matches, i) => (
                <div key={i} className="flex-shrink-0 w-72 space-y-4">
                    <h3 className="font-bold text-center text-[--color-accent]">{getRoundTitle(i, rounds.length)}</h3>
                    <div className="space-y-3">{matches.map(m => <MatchCard key={m.id} match={m} playersMap={playersMap} onPlayMatch={() => onPlayMatch(m)} />)}</div>
                </div>
            ))}
        </div>
    );
};

const TournamentDetail: React.FC<{ tournament: Tournament; players: Player[]; onStartMatch: (t: Tournament, m: Match) => void; onDeleteTournament: (id: string) => void; onBack: () => void; appData: AppDataHook; }> = ({ tournament, players, onStartMatch, onDeleteTournament, onBack, appData }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

    const winnerId = tournament.status === 'completed' ? tournament.matches.find(m => m.round === Math.max(...tournament.matches.map(m => m.round || 0).filter(r => r !== undefined)))?.result?.winnerId : null;
    const winner = winnerId ? playersMap.get(winnerId) : null;
    
    const handleExport = () => {
        const tournamentPlayers = players.filter(p => tournament.playerIds.includes(p.id));
        const exportObject: SingleTournamentExportData = {
            type: 'ScoreCounterTournamentExport',
            version: 1,
            exportedAt: new Date().toISOString(),
            tournament,
            players: tournamentPlayers,
        };
        exportDataToFile(exportObject, `tournament-export-${tournament.name.replace(/\s+/g, '_')}.json`);
    };

    return (
        <div className="w-full max-w-5xl">
            <button onClick={onBack} className="mb-4 font-semibold text-[--color-text-secondary] hover:text-[--color-text-primary]">&larr; {t('tournament.backToList')}</button>
            <div className="bg-[--color-surface] p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[--color-text-primary]">{tournament.name}</h2>
                        <p className="text-[--color-text-secondary]">{t(tournament.settings.gameTypeKey as any)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="text-sm font-semibold bg-[--color-primary]/80 hover:bg-[--color-primary] text-white py-2 px-4 rounded-lg">{t('tournament.export')}</button>
                        <button onClick={() => onDeleteTournament(tournament.id)} className="text-sm font-semibold bg-[--color-red]/80 hover:bg-[--color-red] text-white py-2 px-4 rounded-lg">{t('delete')}</button>
                    </div>
                </div>

                {winner && (
                    <div className="mb-6 text-center bg-[--color-green]/20 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-[--color-green]">{t('tournament.winner')}</h3>
                        <div className="flex items-center justify-center gap-3 mt-2">
                            <Avatar avatar={winner.avatar} className="w-12 h-12" />
                            <p className="text-2xl font-bold">{winner.name}</p>
                        </div>
                    </div>
                )}
                
                {tournament.format === 'round-robin' && <GroupStageView tournament={tournament} playersMap={playersMap} onPlayMatch={(m) => onStartMatch(tournament, m)} />}
                {tournament.format === 'knockout' && <KnockoutBracket tournament={tournament} playersMap={playersMap} onPlayMatch={(m) => onStartMatch(tournament, m)} />}
                {tournament.format === 'combined' && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-lg ${tournament.stage === 'group' ? 'border-2 border-[--color-accent]' : 'opacity-70'}`}>
                            <h3 className="text-2xl font-bold text-center mb-4">{t('tournament.groupStage')}</h3>
                            <GroupStageView tournament={tournament} playersMap={playersMap} onPlayMatch={(m) => onStartMatch(tournament, m)} />
                        </div>
                        <div className={`p-4 rounded-lg ${tournament.stage === 'knockout' ? 'border-2 border-[--color-accent]' : 'opacity-70'}`}>
                            <h3 className="text-2xl font-bold text-center mb-4">{t('tournament.knockoutStage')}</h3>
                            <KnockoutBracket tournament={tournament} playersMap={playersMap} onPlayMatch={(m) => onStartMatch(tournament, m)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN VIEW COMPONENT ---

const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    gameLog: GameRecord[];
    onCreateTournament: (name: string, pIds: string[], s: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
    onDeleteTournament: (id: string) => void;
    appData: AppDataHook;
}> = ({ tournaments, players, gameLog, onCreateTournament, onStartMatch, onDeleteTournament, appData }) => {
    const [view, setView] = useState<'list' | 'setup' | 'detail'>('list');
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    const handleSelectTournament = (tournament: Tournament) => {
        setSelectedTournament(tournament);
        setView('detail');
    };
    
    const handleCreateNew = () => {
        setSelectedTournament(null);
        setView('setup');
    };
    
    const handleBackToList = () => {
        setSelectedTournament(null);
        setView('list');
    };
    
    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };
    
    const handleDeleteAndGoBack = (id: string) => {
        onDeleteTournament(id);
        handleBackToList();
    };

    if (view === 'setup') {
        return <TournamentSetup players={players} gameLog={gameLog} onSubmit={handleCreateTournament} onCancel={handleBackToList} />;
    }
    
    if (view === 'detail' && selectedTournament) {
        return <TournamentDetail tournament={selectedTournament} players={players} onStartMatch={onStartMatch} onDeleteTournament={handleDeleteAndGoBack} onBack={handleBackToList} appData={appData}/>;
    }

    return <TournamentList tournaments={tournaments} onSelectTournament={handleSelectTournament} onCreateNew={handleCreateNew} appData={appData} />;
};

export default TournamentView;
