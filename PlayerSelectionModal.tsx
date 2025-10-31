import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player } from './types';
import Avatar from './Avatar';

const PlayerSelectionModal: React.FC<{
  players: Player[];
  onSelect: (player: Player) => void;
  onClose: () => void;
}> = ({ players, onSelect, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-teal-400 mb-6">{t('selectPlayerTitle')}</h2>
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {players.length > 0 ? (
            players.map(p => (
              <button key={p.id} onClick={() => onSelect(p)} className="flex items-center gap-4 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold py-3 px-4 rounded-lg w-full transition-colors duration-200">
                <Avatar avatar={p.avatar} className="w-8 h-8"/>
                <span>{p.name}</span>
              </button>
            ))
          ) : (
            <p className="text-gray-400">{t('noAvailablePlayers')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSelectionModal;