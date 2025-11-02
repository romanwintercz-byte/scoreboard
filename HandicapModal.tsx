import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from './types';
import Avatar from './Avatar';

const HandicapModal: React.FC<{
    player: Player;
    handicapValue: number;
    onAccept: () => void;
    onDecline: () => void;
    onClose: () => void;
}> = ({ player, handicapValue, onAccept, onDecline, onClose }) => {
    const { t } = useTranslation();

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-transform duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-3xl font-extrabold text-teal-400 mb-4">{t('handicap.offerTitle')}</h2>
                
                <Avatar avatar={player.avatar} className="w-24 h-24 mx-auto my-6" />

                <p 
                    className="text-gray-300 mb-4" 
                    dangerouslySetInnerHTML={{ 
                        __html: t('handicap.offerDescription', { playerName: player.name, points: handicapValue }) 
                    }} 
                />
                <p className="text-gray-500 text-sm mb-8">{t('handicap.offerExplanation')}</p>

                <div className="flex flex-col gap-4">
                     <button 
                        onClick={onAccept}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                    >
                        {t('handicap.accept')}
                    </button>
                     <button 
                        onClick={onDecline}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                    >
                        {t('handicap.decline')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HandicapModal;
