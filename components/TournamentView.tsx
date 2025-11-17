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
                    <div><label className="text-xl font-bold text-[--color-accent] mb-2 block">{t('tournament.name')}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('tournament.namePlaceholder') as string} className="w-full bg-[--color-surface-light] text-[--color-text-primary] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--color-accent]" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm font-bold text-[--color-text-secondary] mb-2 block">{t('gameSetup.selectType')}</label><select value={gameTypeKey} onChange={(e) => handleGameTypeChange(e.target.value)} className="w-full h-12 bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">{Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => <option key={key} value={key}>{t(key as any)}</option>)}</select></div>
                        <div><label className="text-sm font-bold text-[--color-text-secondary] mb-2 block">{t('gameSetup.targetScore')}</label><input type="number" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full h-12 bg-[--color-surface-light] text-[--color-text-primary] text-center text-lg font-bold rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]" /></div>
                    </div>
                    <div>
                        <label className="text-xl font-bold text-[--color-accent] mb-2 block">{t('tournament.format')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setFormat('round-robin')} className={buttonClasses(format === 'round-robin')}>{t('tournament.format.roundRobin')}</button>
                            <button onClick={() => setFormat('knockout')} className={buttonClasses(format === 'knockout')}>{t('tournament.format.knockout')}</button>
                            <button onClick={() => setFormat('combined')} className={buttonClasses(format === 'combined')}>{t('tournament.format.combined')}</button>
                        </div>
                    </div>
                     {(format === 'knockout' || format === 'combined') && <div><label className="text-sm font-bold text-[--color-text-secondary] mb-2 block">{t('tournament.seeding')}</label><div className="bg-[--color-surface-light] rounded-lg p-1 flex"><button onClick={() => setSeeding('random')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${seeding === 'random' ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>{t('tournament.seeding.random')}</button><button onClick={() => setSeeding('average')} className={`w-full px-3 py-2 text-sm font-semibold rounded-md transition-colors ${seeding === 'average' ? 'bg-[--color-primary] text-white' : 'text-[--color-text-primary] hover:bg-[--color-bg]'}`}>{t('tournament.seeding.average')}</button></div></div>}
                     {format === 'combined' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-[--color-text-secondary] mb-2 block">{t('tournament.numGroups')}</label>
                                <select value={numGroups} onChange={(e) => setNumGroups(Number(e.target.value))} className="w-full h-12 bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                                    {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-bold text-[--color-text-secondary] mb-2 block">{t('tournament.playersAdvancing')}</label>
                                <select value={playersAdvancing} onChange={(e) => setPlayersAdvancing(Number(e.target.value))} className="w-full h-12 bg-[--color-surface-light] text-[--color-text-primary] text-center font-semibold rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]">
                                     {advancingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-xl font-bold text-[--color-accent] mb-2 block">{t('tournament.selectPlayers')} ({selectedPlayerIds.length} / {maxPlayers})</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[--color-bg] p-2 rounded-lg h-64 overflow-y-auto"><h3 className="text-sm font-bold text-center text-[--color-text-secondary] mb-2">{t('gameSetup.playersInGame')}</h3><div className="space-y-2">{selectedPlayers.map(p => <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} average={p.average} />)}</div></div>
                        <div className="bg-[--color-bg] p-2 rounded-lg h-64 overflow-y-auto"><h3 className="text-sm font-bold text-center text-[--color-text-secondary] mb-2">{t('gameSetup.availablePlayers')}</h3><div className="space-y-2">{availablePlayers.map(p => <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} average={p.average} />)}</div></div>
                    </div>
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center">
                {errorText && <p className="text-red-500 font-semibold mb-4">{errorText}</p>}
                <div className="flex gap-4 w-full max-w-sm">
                    <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button>
                    <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-[--color-green] text-white font-bold py-3 rounded-lg text-lg shadow-lg transition-all duration-200 enabled:hover:bg-[--color-green-hover] enabled:hover:scale-105 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('tournament.create')}</button>
                </div>
            </div>
        </div>
    );
};

// FIX: Added a placeholder for the missing TournamentDetail component to resolve the "Cannot find name" error.
const TournamentDetail: React.FC<{
  tournament: Tournament;
  players: Player[];
  onBack: () => void;
  onStartMatch: (tournament: Tournament, match: Match) => void;
  onDelete: (id: string) => void;
  appData: AppDataHook;
  // FIX: Destructured players prop to make it available in the component scope.
}> = ({ tournament, players, onBack }) => {
  const { t } = useTranslation();
  // This is a placeholder implementation. The original component was not provided.
  return (
    <div className="w-full max-w-4xl p-4">
      <button onClick={onBack} className="mb-4 bg-[--color-surface-light] p-2 rounded-md">{t('tournament.backToList')}</button>
      <div className="bg-[--color-surface] rounded-lg p-6">
        <h1 className="text-3xl font-bold text-[--color-accent]">{tournament.name}</h1>
        <p className="text-[--color-text-secondary]">Tournament details are not fully implemented in this view.</p>
        <p className="mt-4 text-center text-lg font-semibold">Winner: {
            tournament.status === 'completed' && tournament.matches.find(m => m.round && !m.nextMatchId)?.result?.winnerId 
            ? players.find(p => p.id === tournament.matches.find(m => m.round && !m.nextMatchId)!.result!.winnerId)?.name || 'N/A'
            : 'TBD'
        }</p>
      </div>
    </div>
  );
};


const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    gameLog: GameRecord[];
    onCreateTournament: (name: string, pIds: string[], s: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
    onDeleteTournament: (id: string) => void;
    appData: AppDataHook;
}> = ({
    tournaments,
    players,
    gameLog,
    onCreateTournament,
    onStartMatch,
    onDeleteTournament,
    appData,
}) => {
    const [view, setView] = useState<'list' | 'setup' | 'detail'>('list');
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    const handleSelectTournament = (tournament: Tournament) => {
        setSelectedTournament(tournament);
        setView('detail');
    };

    const handleCreateNew = () => {
        setView('setup');
    };

    const handleCancelSetup = () => {
        setView('list');
    };
    
    const handleCreateAndGoToDetail = (name: string, pIds: string[], s: TournamentSettings) => {
        onCreateTournament(name, pIds, s);
        // This is a bit of a hack: we need to find the tournament that was just created.
        // Since we don't get it back from the handler, we'll wait a tick and find it by name.
        // A better solution would be for onCreateTournament to return the new tournament.
        setTimeout(() => {
            const newTournament = appData.tournaments.find(t => t.name === name); // Assuming names are unique for a moment
            if (newTournament) {
                setSelectedTournament(newTournament);
                setView('detail');
            } else {
                 setView('list'); // Fallback
            }
        }, 100);
    };

    const handleBackToList = () => {
        setSelectedTournament(null);
        setView('list');
    };
    
    // Auto-select tournament if there is only one
    useEffect(() => {
        if (tournaments.length === 1 && view === 'list' && !selectedTournament) {
            handleSelectTournament(tournaments[0]);
        }
    }, [tournaments, view, selectedTournament]);

    return (
        <>
            {view === 'list' && (
                <TournamentList 
                    tournaments={tournaments} 
                    onSelectTournament={handleSelectTournament}
                    onCreateNew={handleCreateNew}
                    appData={appData}
                />
            )}
            {view === 'setup' && (
                <TournamentSetup 
                    players={players} 
                    gameLog={gameLog}
                    onSubmit={handleCreateAndGoToDetail}
                    onCancel={handleCancelSetup}
                />
            )}
            {view === 'detail' && selectedTournament && (
                 <TournamentDetail 
                    key={selectedTournament.id} // Add key to force re-mount on tournament change
                    tournament={selectedTournament}
                    players={players}
                    onBack={handleBackToList}
                    onStartMatch={onStartMatch}
                    onDelete={onDeleteTournament}
                    appData={appData}
                />
            )}
        </>
    );
};


// FIX: Changed to a named export to resolve the import error in App.tsx.
export { TournamentView };