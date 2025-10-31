import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from './types';
import Avatar from './Avatar';

const PlayerInfoCard: React.FC<{
    player: Player;
    onEdit: () => void;
    onDelete: () => void;
    onViewStats: () => void;
}> = ({ player, onEdit, onDelete, onViewStats }) => {
    const { t } = useTranslation();
    return (
        <button 
            onClick={onViewStats} 
            className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform hover:-translate-y-1 transition-transform w-full text-left"
        >
            <Avatar avatar={player.avatar} className="w-20 h-20 mb-3" />
            <p className="text-white text-lg font-semibold truncate w-full text-center">{player.name}</p>
            <div className="flex gap-2 mt-3">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-teal-400 hover:text-teal-300 text-sm font-semibold z-10">{t('edit')}</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-400 text-sm font-semibold z-10">{t('delete')}</button>
            </div>
        </button>
    )
}

export default PlayerInfoCard;