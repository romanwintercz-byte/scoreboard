import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from './types';
import PlayerInfoCard from './PlayerInfoCard';

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
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">{t('managePlayers')}</h1>
                <button onClick={onAddPlayer} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
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
                <p className="text-center text-gray-500 mt-16">{t('noPlayers')}</p>
            )}
        </div>
    );
}

export default PlayerManager;