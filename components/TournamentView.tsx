

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
    const { players, setPlayers, setTournaments } = appData;
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
    
    // Combined format specific state
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

    const buttonClasses = (isActive: boolean) => `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${isActive ? 'bg-[--color-primary] border-[--color-accent] text-white shadow-lg' : 'bg-[--color-surface-light] border-[--color-border] hover:bg-[--color-bg] hover:border-[--color-border-hover]'}`;

    // Dynamic options for combined format
    const groupOptions = useMemo(() => {
        const numPlayers = selectedPlayerIds.length;
        if (numPlayers < 4) return [];
        const options = [2, 4, 8];
        return options.filter(opt => numPlayers >= opt * 2);
    }, [selectedPlayerIds.length]);

    const advancingOptions = useMemo(() => {
        const playersPerGroup = selectedPlayerIds.length / numGroups;
        const options = [1, 2, 4];
        return options.filter(opt => opt < playersPerGroup);
    }, [selectedPlayerIds.length, numGroups]);

    // Effect to reset options if they become invalid
    useEffect(() => { if (groupOptions.length > 0 && !groupOptions.includes(numGroups)) setNumGroups(groupOptions[0]); }, [groupOptions, numGroups]);
    useEffect(() => { if (advancingOptions.length > 0 && !advancingOptions.includes(playersAdvancing)) setPlayersAdvancing(advancingOptions[0]); }, [advancingOptions, playersAdvancing]);


    return (
        <div className="w-full max-w-4xl bg-[--color-surface] rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-[--color-text-primary]">{t('tournament.setupTitle')}</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div><label className="text-xl font-bold text-[--color-accent] mb-2 block">{t('tournament.name')}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('tournament.namePlaceholder') as string} className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-lg rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('tournament.format')}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setFormat('round-robin')} className={buttonClasses(format === 'round-robin')}>{t('tournament.format.roundRobin')}</button>
                            <button onClick={() => setFormat('knockout')} className={buttonClasses(format === 'knockout')}>{t('tournament.format.knockout')}</button>
                            <button onClick={() => setFormat('combined')} className={buttonClasses(format === 'combined')}>{t('tournament.format.combined')}</button>
                        </div>
                    </div>
                    {(format === 'knockout' || format === 'combined') && (
                        <div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('tournament.seeding')}</h3><div className="grid grid-cols-2 gap-4"><button onClick={() => setSeeding('random')} className={buttonClasses(seeding === 'random')}>{t('tournament.seeding.random')}</button><button onClick={() => setSeeding('average')} className={buttonClasses(seeding === 'average')}>{t('tournament.seeding.average')}</button></div></div>
                    )}
                    {format === 'combined' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><h3 className="text-lg font-bold text-[--color-accent] mb-2">{t('tournament.numGroups')}</h3><select value={numGroups} onChange={e => setNumGroups(Number(e.target.value))} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">{groupOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                            <div><h3 className="text-lg font-bold text-[--color-accent] mb-2">{t('tournament.playersAdvancing')}</h3><select value={playersAdvancing} onChange={e => setPlayersAdvancing(Number(e.target.value))} className="w-full h-[44px] bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">{advancingOptions.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
                        </div>
                    )}
                    <div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('gameSetup.selectType')}</h3><div className="grid grid-cols-2 gap-3">{Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => (<button key={key} onClick={() => handleGameTypeChange(key)} className={buttonClasses(gameTypeKey === key)}>{t(key as any)}</button>))}</div></div>
                    <div><h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('gameSetup.targetScore')}</h3><input type="number" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"/></div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-[--color-accent] mb-4">{t('tournament.selectPlayers')} ({selectedPlayerIds.length} / {maxPlayers})</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><h4 className="font-semibold text-[--color-text-secondary] mb-2">{t('gameSetup.availablePlayers')}</h4><div className="bg-black/20 p-2 rounded-lg h-96 overflow-y-auto space-y-2">{availablePlayers.map(p => <PlayerListItem key={p.id} player={p} average={p.average} onClick={() => handlePlayerToggle(p.id)} />)}</div></div>
                        <div><h4 className="font-semibold text-[--color-text-secondary] mb-2">{t('gameSetup.playersInGame')}</h4><div className="bg-black/20 p-2 rounded-lg h-96 overflow-y-auto space-y-2">{selectedPlayers.map(p => <PlayerListItem key={p.id} player={p} average={p.average} onClick={() => handlePlayerToggle(p.id)} />)}</div></div>
                    </div>
                    {errorText && <p className="text-[--color-red] text-center mt-2 font-semibold">{errorText}</p>}
                </div>
            </div>
            <div className="mt-8 flex gap-4"><button onClick={onCancel} className="w-full bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button><button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-[--color-green] text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 enabled:hover:bg-[--color-green-hover] disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('tournament.create')}</button></div>
        </div>
    );
};

// --- SHARE MODAL COMPONENTS (DEFINED LOCALLY) ---
const ShareImageSVGTournament = forwardRef<SVGSVGElement, { tournament: Tournament, players: Player[], themeColors: any }>(({ tournament, players, themeColors }, ref) => {
    const { t } = useTranslation();
    const playersMap = new Map(players.map(p => [p.id, p]));
    const width = 1200;
    const height = 630;

    const leaderboardData = useMemo(() => {
        const stats: Record<string, { playerId: string; played: number; wins: number; draws: number; losses: number; points: number; }> = {};
        tournament.playerIds.forEach(id => { stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }; });
        tournament.matches.filter(m => m.groupId).forEach(match => {
            if (match.status === 'completed' && match.result && match.player1Id && match.player2Id) {
                const { player1Id, player2Id, result } = match;
                stats[player1Id].played++; stats[player2Id].played++;
                if (result.winnerId === null) { stats[player1Id].draws++; stats[player2Id].draws++; stats[player1Id].points++; stats[player2Id].points++; } 
                else if (result.winnerId === player1Id) { stats[player1Id].wins++; stats[player2Id].losses++; stats[player1Id].points += 3; } 
                else { stats[player2Id].wins++; stats[player1Id].losses++; stats[player2Id].points += 3; }
            }
        });
        return Object.values(stats).sort((a, b) => b.points - a.points || (b.wins - a.wins)).slice(0, 7);
    }, [tournament]);

    return (
        <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs><clipPath id="avatarClip"><circle cx="20" cy="20" r="20" /></clipPath></defs>
            <rect width="100%" height="100%" fill={themeColors.bg} />
            <text x={width / 2} y="70" textAnchor="middle" fill={themeColors.accent} fontSize="52" fontWeight="bold" fontFamily="sans-serif">{tournament.name}</text>
            <text x={width / 2} y="120" textAnchor="middle" fill={themeColors.textSecondary} fontSize="28" fontFamily="sans-serif">{t('tournament.leaderboard')}</text>
            
            <g transform="translate(60, 160)">
                <rect width={width - 120} height={50} y="0" fill={themeColors.surfaceLight} rx="10" />
                <text x="120" y="32" fill={themeColors.accent} fontSize="20" fontWeight="bold" fontFamily="sans-serif">{t('stats.player')}</text>
                <text x="700" y="32" fill={themeColors.accent} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{t('tournament.played')}</text>
                <text x="850" y="32" fill={themeColors.accent} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{t('tournament.wins')}</text>
                <text x="1000" y="32" fill={themeColors.accent} fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{t('tournament.points')}</text>
                
                {leaderboardData.map((row, index) => {
                    const player = playersMap.get(row.playerId);
                    if (!player) return null;
                    const y = 65 + index * 55;
                    const avatar = player.avatar || FALLBACK_AVATAR_PATH;
                    const isDataUrl = avatar.startsWith('data:image');
                    return (
                        <g key={row.playerId}>
                            <text x="25" y={y+28} fill={themeColors.textSecondary} fontSize="24" fontWeight="bold" textAnchor="middle">{index+1}</text>
                             {isDataUrl ? ( <image href={avatar} x="60" y={y+5} height="40" width="40" clipPath="url(#avatarClip)" />) : (
                                <g transform={`translate(60, ${y+5})`}><circle cx="20" cy="20" r="20" fill={themeColors.primary} /><path d={avatar} fill="#fff" transform="translate(4, 4) scale(1.6)" /></g>
                             )}
                            <text x="120" y={y+28} fill={themeColors.textPrimary} fontSize="24" fontWeight="bold">{player.name}</text>
                            <text x="700" y={y+28} fill={themeColors.textPrimary} fontSize="24" fontWeight="bold" textAnchor="middle">{row.played}</text>
                            <text x="850" y={y+28} fill={themeColors.green} fontSize="24" fontWeight="bold" textAnchor="middle">{row.wins}</text>
                            <text x="1000" y={y+28} fill={themeColors.accent} fontSize="24" fontWeight="bold" textAnchor="middle">{row.points}</text>
                        </g>
                    );
                })}
            </g>

            <text x={width - 40} y={height - 30} textAnchor="end" fill={themeColors.textSecondary} opacity="0.7" fontSize="20" fontFamily="sans-serif">{t('share.generatedBy')}</text>
        </svg>
    );
});

const ShareModal = ({ tournament, players, onClose }: { tournament: Tournament, players: Player[], onClose: () => void }) => {
    const { t } = useTranslation();
    const svgRef = useRef<SVGSVGElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [themeColors, setThemeColors] = useState<any>({});

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        setThemeColors({
            bg: rootStyles.getPropertyValue('--color-bg').trim(),
            surface: rootStyles.getPropertyValue('--color-surface').trim(),
            surfaceLight: rootStyles.getPropertyValue('--color-surface-light').trim(),
            primary: rootStyles.getPropertyValue('--color-primary').trim(),
            accent: rootStyles.getPropertyValue('--color-accent').trim(),
            textPrimary: rootStyles.getPropertyValue('--color-text-primary').trim(),
            textSecondary: rootStyles.getPropertyValue('--color-text-secondary').trim(),
            green: rootStyles.getPropertyValue('--color-green').trim(),
        });
    }, []);

    useEffect(() => {
        if (!svgRef.current || !themeColors.bg) return;
        const generate = async () => {
            try {
                const svgNode = svgRef.current!;
                const svgString = new XMLSerializer().serializeToString(svgNode);
                const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
                const img = new Image();
                const canvas = document.createElement('canvas');
                canvas.width = svgNode.width.baseVal.value;
                canvas.height = svgNode.height.baseVal.value;
                const ctx = canvas.getContext('2d');
                img.onload = () => {
                    ctx?.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL('image/png');
                    setImageUrl(pngUrl);
                    setIsLoading(false);
                };
                img.onerror = () => { setError(t('share.error')); setIsLoading(false); };
                img.src = svgDataUrl;
            } catch (e) {
                setError(t('share.error')); setIsLoading(false);
            }
        };
        setTimeout(generate, 100);
    }, [themeColors, t]);

    const handleShare = async () => {
        if (!imageUrl) return;
        const file = dataURLtoFile(imageUrl, `tournament-${tournament.name.replace(/\s+/g, '_')}.png`);
        if (file && navigator.share) {
            try {
                await navigator.share({
                    title: tournament.name,
                    text: `${t('tournament.title')}: ${tournament.name}`,
                    files: [file],
                });
            } catch (error) { console.error('Sharing failed', error); }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[--color-surface] rounded-2xl shadow-2xl p-6 w-full max-w-2xl text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('share.title')}</h2>
                <div className="w-full aspect-[1.9/1] bg-black/20 rounded-lg flex items-center justify-center my-4">
                    {isLoading && <p>{t('share.generating')}</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {imageUrl && <img src={imageUrl} alt="Tournament summary preview" className="max-w-full max-h-full rounded-lg" />}
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="w-full bg-[--color-surface-light] hover:bg-[--color-border] font-bold py-3 rounded-lg">{t('common.close')}</button>
                    <button onClick={handleShare} disabled={!imageUrl} className="w-full bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-3 rounded-lg disabled:opacity-50">{t('share.action')}</button>
                </div>
            </div>
            <div className="absolute -left-full -top-full opacity-0">
                <ShareImageSVGTournament ref={svgRef} tournament={tournament} players={players} themeColors={themeColors} />
            </div>
        </div>
    );
};

const TournamentDashboard: React.FC<{ tournament: Tournament; players: Player[]; onExit: () => void; onStartMatch: (tournament: Tournament, match: Match) => void; onDelete: (id: string) => void; }> = ({ tournament, players, onExit, onStartMatch, onDelete }) => {
    const { t, i18n } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleCancelTournament = () => {
        const confirmText = i18n.language === 'cs' ? 'SMAZAT' : 'DELETE';
        const userInput = prompt(t('tournament.cancelConfirmBody') as string);
        if (userInput === confirmText) {
            onDelete(tournament.id);
        }
    };
    
    const handleExportTournament = () => {
        const participatingPlayers = players.filter(p => tournament.playerIds.includes(p.id));
        
        const exportObject: SingleTournamentExportData = {
            type: 'ScoreCounterTournamentExport',
            version: 1,
            exportedAt: new Date().toISOString(),
            tournament: tournament,
            players: participatingPlayers,
        };
        
        const date = new Date().toISOString().split('T')[0];
        exportDataToFile(exportObject, `tournament-export-${tournament.name.replace(/\s+/g, '_')}-${date}.json`);
    };

    // --- Common Match Component ---
    const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
        const p1 = playersMap.get(match.player1Id!);
        const p2 = playersMap.get(match.player2Id!);
        if (!p1 || !p2) return null;
        return (
            <div key={match.id} className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <div className="flex items-center gap-2 w-32 justify-end"><span className="truncate text-right">{p1.name}</span><Avatar avatar={p1.avatar} className="w-8 h-8"/></div>
                    <span className="text-[--color-text-secondary] mx-2">{t('tournament.matchVs')}</span>
                    <div className="flex items-center gap-2 w-32"><Avatar avatar={p2.avatar} className="w-8 h-8"/><span className="truncate">{p2.name}</span></div>
                </div>
                {match.status === 'pending' ? (<button onClick={() => onStartMatch(tournament, match)} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-4 rounded-lg text-sm">{t('tournament.playMatch')}</button>) : (<div className="text-center font-mono font-bold text-xl"><span>{match.result?.player1Score}</span><span className="text-[--color-text-secondary] mx-2">-</span><span>{match.result?.player2Score}</span></div>)}
            </div>
        );
    };

    // --- Round Robin View ---
    const RoundRobinView = () => {
        const leaderboardData = useMemo(() => {
            const stats: Record<string, { playerId: string; played: number; wins: number; draws: number; losses: number; points: number; }> = {};
            tournament.playerIds.forEach(id => { stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }; });
            tournament.matches.forEach(match => {
                if (match.status === 'completed' && match.result && match.player1Id && match.player2Id) {
                    const { player1Id, player2Id, result } = match;
                    stats[player1Id].played++; stats[player2Id].played++;
                    if (result.winnerId === null) { stats[player1Id].draws++; stats[player2Id].draws++; stats[player1Id].points++; stats[player2Id].points++; } 
                    else if (result.winnerId === player1Id) { stats[player1Id].wins++; stats[player2Id].losses++; stats[player1Id].points += 3; } 
                    else { stats[player2Id].wins++; stats[player1Id].losses++; stats[player2Id].points += 3; }
                }
            });
            return Object.values(stats).sort((a, b) => b.points - a.points || (b.wins - a.wins));
        }, [tournament]);
        
        return (
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-[--color-surface] rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.leaderboard')}</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-[--color-border]"><th className="p-2">#</th><th className="p-2">{t('stats.player')}</th><th className="p-2 text-center" title={t('tournament.played') as string}>{t('tournament.played')}</th><th className="p-2 text-center" title={t('tournament.wins') as string}>{t('tournament.wins')}</th><th className="p-2 text-center" title={t('tournament.draws') as string}>{t('tournament.draws')}</th><th className="p-2 text-center" title={t('tournament.losses') as string}>{t('tournament.losses')}</th><th className="p-2 text-center" title={t('tournament.points') as string}>{t('tournament.points')}</th></tr></thead><tbody>{leaderboardData.map((row, index) => { const player = playersMap.get(row.playerId); return player ? (<tr key={row.playerId} className="border-b border-[--color-border]/50"><td className="p-2 font-bold">{index + 1}</td><td className="p-2 flex items-center gap-2"><Avatar avatar={player.avatar} className="w-6 h-6" /><span className="font-semibold truncate">{player.name}</span></td><td className="p-2 text-center font-mono">{row.played}</td><td className="p-2 text-center font-mono text-[--color-green]">{row.wins}</td><td className="p-2 text-center font-mono text-[--color-yellow]">{row.draws}</td><td className="p-2 text-center font-mono text-[--color-red]">{row.losses}</td><td className="p-2 text-center font-mono font-bold text-[--color-accent]">{row.points}</td></tr>) : null;})}</tbody></table></div>
                <div className="md:col-span-2 bg-[--color-surface] rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.matches')}</h2><div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">{tournament.matches.map(match => <MatchCard key={match.id} match={match} />)}</div></div>
            </div>
        );
    };

    // --- Knockout View ---
    const KnockoutBracket = ({ matches }: { matches: Match[] }) => {
        const rounds = useMemo(() => {
            const grouped: Match[][] = [];
            matches.forEach(match => {
                const roundIndex = (match.round || 1) - 1;
                if (!grouped[roundIndex]) grouped[roundIndex] = [];
                grouped[roundIndex].push(match);
            });
            return grouped;
        }, [matches]);

        const getRoundName = (roundIndex: number) => {
            if (rounds.length - roundIndex === 1) return t('tournament.final');
            if (rounds.length - roundIndex === 2) return t('tournament.semifinals');
            if (rounds.length - roundIndex === 3) return t('tournament.quarterfinals');
            const numTeamsInRound = rounds[roundIndex].length * 2;
            return t('tournament.roundOf', { count: numTeamsInRound });
        }
        
        return (
            <div className="bg-[--color-surface] rounded-lg p-4 shadow-lg w-full overflow-x-auto">
                <div className="flex gap-4">
                    {rounds.map((round, roundIndex) => (
                        <div key={roundIndex} className="flex flex-col gap-4 flex-shrink-0" style={{width: '280px'}}>
                            <h3 className="text-xl font-bold text-center text-[--color-accent]">{getRoundName(roundIndex)}</h3>
                            <div className="space-y-3">
                            {round.map(match => {
                                const p1 = match.player1Id ? playersMap.get(match.player1Id) : null;
                                const p2 = match.player2Id ? playersMap.get(match.player2Id) : null;
                                const canStart = p1 && p2 && match.status === 'pending';
                                return (
                                    <div key={match.id} className="bg-black/20 p-3 rounded-lg">
                                        <div className={`flex items-center justify-between pb-2 mb-2 border-b border-white/10 ${match.result?.winnerId === p1?.id ? 'font-bold' : 'opacity-60'}`}>
                                            <div className="flex items-center gap-2 truncate"><Avatar avatar={p1?.avatar || ''} className="w-6 h-6"/> <span className="truncate">{p1?.name || '...'}</span></div>
                                            <span className="font-mono">{match.status === 'completed' ? match.result?.player1Score : '-'}</span>
                                        </div>
                                        <div className={`flex items-center justify-between ${match.result?.winnerId === p2?.id ? 'font-bold' : 'opacity-60'}`}>
                                            <div className="flex items-center gap-2 truncate"><Avatar avatar={p2?.avatar || ''} className="w-6 h-6"/> <span className="truncate">{p2?.name || '...'}</span></div>
                                            <span className="font-mono">{match.status === 'completed' ? match.result?.player2Score : '-'}</span>
                                        </div>
                                        {canStart && (
                                            <button onClick={() => onStartMatch(tournament, match)} className="w-full mt-2 bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-1 px-2 rounded-md text-xs">{t('tournament.playMatch')}</button>
                                        )}
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- Combined View ---
    const CombinedView = () => {
        if (tournament.stage === 'group') {
            const groups = useMemo(() => {
                const grouped: { [key: string]: Match[] } = {};
                tournament.matches.filter(m => m.groupId).forEach(m => {
                    if (!grouped[m.groupId!]) grouped[m.groupId!] = [];
                    grouped[m.groupId!].push(m);
                });
                return Object.entries(grouped);
            }, [tournament.matches]);

            return (
                <div className="grid lg:grid-cols-2 gap-6">
                    {groups.map(([groupId, matches]) => {
                        const playerIdsInGroup = [...new Set(matches.flatMap(m => [m.player1Id, m.player2Id]))];
                         const groupLeaderboard = useMemo(() => {
                            const stats: Record<string, { playerId: string; played: number; wins: number; draws: number; losses: number; points: number; }> = {};
                            playerIdsInGroup.forEach(id => { if (id) stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }; });
                            matches.forEach(match => { if (match.status === 'completed' && match.result && match.player1Id && match.player2Id) { const { player1Id, player2Id, result } = match; stats[player1Id].played++; stats[player2Id].played++; if (result.winnerId === null) { stats[player1Id].draws++; stats[player2Id].draws++; stats[player1Id].points++; stats[player2Id].points++; } else if (result.winnerId === player1Id) { stats[player1Id].wins++; stats[player2Id].losses++; stats[player1Id].points += 3; } else { stats[player2Id].wins++; stats[player1Id].losses++; stats[player2Id].points += 3; } }});
                            return Object.values(stats).sort((a, b) => b.points - a.points || (b.wins - a.wins));
                        }, [matches]);
                        const groupLetter = String.fromCharCode(65 + parseInt(groupId.split('-')[1]));
                        return (
                            <div key={groupId} className="bg-[--color-surface] p-4 rounded-lg">
                                <h3 className="text-2xl font-bold text-[--color-accent] mb-4">{t('tournament.group', { letter: groupLetter })}</h3>
                                <table className="w-full text-left text-sm mb-4"><thead><tr className="border-b border-[--color-border]"><th className="p-1">#</th><th className="p-1">{t('stats.player')}</th><th className="p-1 text-center">{t('tournament.played')}</th><th className="p-1 text-center">{t('tournament.points')}</th></tr></thead><tbody>{groupLeaderboard.map((row, index) => { const player = playersMap.get(row.playerId); return player ? (<tr key={row.playerId} className="border-b border-[--color-border]/50"><td className="p-1 font-bold">{index + 1}</td><td className="p-1 flex items-center gap-2"><Avatar avatar={player.avatar} className="w-6 h-6" /><span className="font-semibold truncate">{player.name}</span></td><td className="p-1 text-center font-mono">{row.played}</td><td className="p-1 text-center font-mono font-bold text-[--color-accent]">{row.points}</td></tr>) : null;})}</tbody></table>
                                <div className="space-y-2">{matches.map(m => <MatchCard key={m.id} match={m} />)}</div>
                            </div>
                        )
                    })}
                </div>
            );
        } else { // Knockout stage
             return <KnockoutBracket matches={tournament.matches.filter(m => !m.groupId)} />;
        }
    }

    const winnerId = tournament.status === 'completed' ? tournament.matches.find(m => m.round === (tournament.matches.map(m=>m.round||0).reduce((a, b) => Math.max(a, b), -Infinity)))?.result?.winnerId : null;
    const winner = winnerId ? playersMap.get(winnerId) : null;
    
    return (
        <div className="w-full max-w-5xl p-4">
            {isShareModalOpen && <ShareModal tournament={tournament} players={players} onClose={() => setIsShareModalOpen(false)} />}
            <div className="flex justify-between items-start mb-6">
                <div><h1 className="text-4xl font-extrabold text-[--color-text-primary]">{tournament.name}</h1><p className="text-[--color-text-secondary]">{t(tournament.settings.gameTypeKey as any)} · {t('gameSetup.targetScore')}: {tournament.settings.targetScore}</p></div>
                <div className="flex gap-2 flex-wrap justify-end" style={{maxWidth: '500px'}}>
                    <button onClick={() => setIsShareModalOpen(true)} className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('share.buttonTextTournament')}</button>
                    <button onClick={handleExportTournament} className="bg-[--color-primary]/80 hover:bg-[--color-primary] text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('tournament.export')}</button>
                    {tournament.status === 'ongoing' && <button onClick={handleCancelTournament} className="bg-[--color-red] hover:bg-[--color-red-hover] text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('tournament.cancelTournament')}</button>}
                    <button onClick={onExit} className="bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-2 px-4 rounded-lg transition-colors">{t('tournament.backToList')}</button>
                </div>
            </div>
            {winner && <div className="bg-[--color-yellow]/20 border-2 border-[--color-yellow] text-[--color-yellow] p-4 rounded-lg mb-6 text-center"><h3 className="text-2xl font-bold">{t('tournament.winner')}</h3><div className="flex items-center justify-center gap-3 mt-2"><Avatar avatar={winner.avatar} className="w-10 h-10" /><p className="text-xl font-semibold">{winner.name}</p></div></div>}
            
            {tournament.format === 'combined' && tournament.status === 'ongoing' && (
                <div className="mb-4 text-center"><span className="text-xl font-bold px-4 py-2 rounded-lg bg-[--color-surface] text-[--color-accent]">{tournament.stage === 'group' ? t('tournament.groupStage') : t('tournament.knockoutStage')}</span></div>
            )}
            
            {tournament.format === 'round-robin' && <RoundRobinView />}
            {tournament.format === 'knockout' && <KnockoutBracket matches={tournament.matches} />}
            {tournament.format === 'combined' && <CombinedView />}
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
    onDeleteTournament: (id: string) => void;
    appData: AppDataHook;
}> = ({ tournaments, players, gameLog, onCreateTournament, onStartMatch, onDeleteTournament, appData }) => {
    const [view, setView] = useState<'list' | 'setup'>('list');
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };
    
    if (activeTournament) return <TournamentDashboard tournament={activeTournament} players={players} onExit={() => setActiveTournament(null)} onStartMatch={onStartMatch} onDelete={onDeleteTournament}/>;
    if (view === 'setup') return <TournamentSetup players={players} gameLog={gameLog} onSubmit={handleCreateTournament} onCancel={() => setView('list')} />;
    return <TournamentList tournaments={tournaments} onSelectTournament={setActiveTournament} onCreateNew={() => setView('setup')} appData={appData} />;
};

export default TournamentView;