import React from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type GameRecord, type PlayerCardData } from './types';
import Avatar from './Avatar';

const TrendIndicator: React.FC<{ trend: PlayerCardData['trend'] }> = ({ trend }) => {
    switch (trend) {
        case 'improving':
            return <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
        case 'worsening':
            return <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
        default:
            return <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
    }
};

const FormIndicator: React.FC<{ result: GameRecord['result'] }> = ({ result }) => {
    const baseClasses = "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black";
    const content = {
      win: { letter: 'V', color: 'bg-green-400' },
      draw: { letter: 'R', color: 'bg-yellow-400' },
      loss: { letter: 'P', color: 'bg-red-400' },
    }[result];
    return <div className={`${baseClasses} ${content.color}`}>{content.letter}</div>;
};

const PlayerInfoCard: React.FC<{
    player: Player;
    cardData: PlayerCardData;
    onEdit: () => void;
    onDelete: () => void;
    onViewStats: () => void;
}> = ({ player, cardData, onEdit, onDelete, onViewStats }) => {
    const { t } = useTranslation();
    
    return (
        <button 
            onClick={onViewStats} 
            className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg transform hover:-translate-y-1 transition-transform w-full text-left"
        >
            <Avatar avatar={player.avatar} className="w-16 h-16 flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <p className="text-white text-xl font-bold truncate">{player.name}</p>
                <div className="flex items-center gap-3 text-gray-400 mt-1">
                    <span className="font-mono font-semibold text-lg text-teal-300" title={t('playerStats.movingAverage') as string}>
                        {cardData?.movingAverage.toFixed(2) ?? '0.00'}
                    </span>
                    {cardData && <TrendIndicator trend={cardData.trend} />}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                    {cardData?.recentForm.map((result, index) => <FormIndicator key={index} result={result} />)}
                </div>
            </div>
            <div className="flex flex-col gap-2 self-start">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-teal-400 hover:text-teal-300 text-sm font-semibold z-10">{t('edit')}</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-400 text-sm font-semibold z-10">{t('delete')}</button>
            </div>
        </button>
    )
}

export default PlayerInfoCard;