import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, AllStats, GameStats, PlayerStats, GameRecord, SinglePlayerExportData } from '../types';
import Avatar from './Avatar';
import { AppDataHook } from '../hooks';

const PlayerInfoCard: React.FC<{
    player: Player;
    onEdit: () => void;
    onDelete: () => void;
    onViewStats: () => void;
}> = ({ player, onEdit, onDelete, onViewStats }) => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-[--color-surface] rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <button onClick={onViewStats} className="w-full flex flex-col items-center focus:outline-none">
                <Avatar avatar={player.avatar} className="w-20 h-20 mb-3" />
                <p className="text-[--color-text-primary] text-lg font-semibold truncate w-full">{player.name}</p>
            </button>
            <div className="flex gap-2 mt-3">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[--color-accent] hover:opacity-80 text-sm font-semibold z-10">{t('edit')}</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-[--color-red] hover:opacity-80 text-sm font-semibold z-10">{t('delete')}</button>
            </div>
        </div>
    )
}

const PlayerManager: React.FC<{
    players: Player[];
    onAddPlayer: () => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (id: string) => void;
    onViewPlayerStats: (player: Player) => void;
    appData: AppDataHook;
}> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer, onViewPlayerStats, appData }) => {
    const { t } = useTranslation();
    const importFileRef = useRef<HTMLInputElement>(null);
    const { setPlayers, setStats, setCompletedGamesLog, stats, completedGamesLog } = appData;

    const handleDelete = (player: Player) => {
        if (window.confirm(t('confirmDelete', { name: player.name }) as string)) {
            onDeletePlayer(player.id);
        }
    }
    
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
                const parsed = JSON.parse(text) as SinglePlayerExportData;
                
                if (parsed.type !== 'ScoreCounterPlayerExport' || !parsed.playerProfile) {
                    throw new Error("Invalid file format");
                }
                
                const existingPlayer = players.find(p => p.id === parsed.playerProfile.id);

                if (existingPlayer) {
                    // Player exists, ask to merge
                    if (window.confirm(t('import.merge.body', { name: existingPlayer.name }) as string)) {
                        handleMergePlayer(parsed);
                    }
                } else {
                    // New player, just add
                    handleAddNewPlayer(parsed);
                }

            } catch (error) {
                console.error("Import failed:", error);
                alert(t('import.error.invalid'));
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.onerror = () => alert(t('import.error.file'));
        reader.readAsText(file);
    };

    const handleAddNewPlayer = (data: SinglePlayerExportData) => {
        setPlayers(prev => [...prev, data.playerProfile]);
        
        setStats(prevStats => {
            const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
            for (const gameType in data.playerStats) {
                if (!newStats[gameType]) newStats[gameType] = {};
                newStats[gameType][data.playerProfile.id] = data.playerStats[gameType][data.playerProfile.id];
            }
            return newStats;
        });
        
        setCompletedGamesLog(prevLog => [...prevLog, ...data.gameLog]);

        alert(t('import.playerSuccess', { name: data.playerProfile.name }));
    };

    const handleMergePlayer = (data: SinglePlayerExportData) => {
        // Update profile
        setPlayers(prev => prev.map(p => p.id === data.playerProfile.id ? data.playerProfile : p));

        // Merge stats
        setStats(prevStats => {
            const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
            const playerId = data.playerProfile.id;
            
            for (const gameType in data.playerStats) {
                if (!newStats[gameType]) newStats[gameType] = {};
                if (!newStats[gameType][playerId]) {
                     newStats[gameType][playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
                }
                
                const existingPlayerStats = newStats[gameType][playerId];
                const importedPlayerStats = data.playerStats[gameType]?.[playerId];

                if (importedPlayerStats) {
                    existingPlayerStats.gamesPlayed += importedPlayerStats.gamesPlayed;
                    existingPlayerStats.wins += importedPlayerStats.wins;
                    existingPlayerStats.losses += importedPlayerStats.losses;
                    existingPlayerStats.totalScore += importedPlayerStats.totalScore;
                    existingPlayerStats.totalTurns += importedPlayerStats.totalTurns;
                    existingPlayerStats.zeroInnings += importedPlayerStats.zeroInnings;
                }
            }
            return newStats;
        });

        // Merge game log, avoiding duplicates
        setCompletedGamesLog(prevLog => {
            const existingGameIds = new Set(prevLog.map(g => g.gameId));
            const newGames = data.gameLog.filter(g => !existingGameIds.has(g.gameId));
            return [...prevLog, ...newGames];
        });

        alert(t('import.playerSuccess', { name: data.playerProfile.name }));
    };

    return (
        <div className="w-full max-w-5xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-[--color-text-primary]">{t('managePlayers')}</h1>
                <div className="flex gap-2">
                    <button onClick={handleImportClick} className="bg-[--color-primary]/80 hover:bg-[--color-primary] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                        {t('playerManager.importPlayer')}
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleFileSelected} accept=".json" className="hidden" />

                    <button onClick={onAddPlayer} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                        {t('addPlayer')}
                    </button>
                </div>
            </div>

            {players.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {players.map(player => (
                        <PlayerInfoCard 
                            key={player.id}
                            player={player}
                            onEdit={() => onEditPlayer(player)}
                            onDelete={() => handleDelete(player)}
                            onViewStats={() => onViewPlayerStats(player)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-[--color-text-secondary] mt-16">{t('noPlayers')}</p>
            )}
        </div>
    );
}

export default PlayerManager;