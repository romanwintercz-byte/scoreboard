import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from './types';
import Avatar from './Avatar';

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
}> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer, onViewPlayerStats }) => {
    const { t } = useTranslation();

    const handleDelete = (player: Player) => {
        if (window.confirm(t('confirmDelete', { name: player.name }) as string)) {
            onDeletePlayer(player.id);
        }
    }

    return (
        <div className="w-full max-w-5xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-[--color-text-primary]">{t('managePlayers')}</h1>
                <button onClick={onAddPlayer} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                    {t('addPlayer')}
                </button>
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