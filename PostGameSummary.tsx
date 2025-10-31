import React from 'react';
import { useTranslation } from 'react-i18next';
import { type GameSummary, type Player } from './types';
import Avatar from './Avatar';

const StatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono font-bold text-white">{value}</span>
    </div>
);

const PostGameSummary: React.FC<{
    summary: GameSummary;
    players: Player[];
    onClose: () => void;
}> = ({ summary, players, onClose }) => {
    const { t } = useTranslation();
    const { gameInfo, finalScores, winnerIds } = summary;

    const getPlayerById = (id: string) => players.find(p => p.id === id);

    return (
        <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
            <h1 className="text-4xl font-extrabold mb-6 text-center text-teal-400">{t('postGame.title')}</h1>
            <h2 className="text-xl font-semibold mb-8 text-center text-gray-300">{t(gameInfo.type as any)}</h2>
            
            <div className="space-y-4">
                {gameInfo.playerIds.map(playerId => {
                    const player = getPlayerById(playerId);
                    if (!player) return null;
                    
                    const isWinner = winnerIds.includes(playerId);
                    const turnStats = gameInfo.turnStats?.[playerId] || { zeroInnings: 0, clean10s: 0, clean20s: 0 };
                    const handicap = gameInfo.handicap?.playerId === playerId ? gameInfo.handicap.points : 0;
                    
                    return (
                        <div 
                            key={playerId}
                            className={`p-4 rounded-lg transition-all duration-300 flex items-center gap-4 relative ${isWinner ? 'bg-green-500/20 border-2 border-green-400' : 'bg-gray-900/50'}`}
                        >
                            {isWinner && (
                                <div className="absolute -top-3 -right-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full uppercase">
                                    {t('postGame.winner')}
                                </div>
                            )}
                            <Avatar avatar={player.avatar} className="w-16 h-16 flex-shrink-0" />
                            <div className="flex-grow">
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-bold text-white">{player.name}</p>
                                    {handicap > 0 && (
                                        <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                                            {t('postGame.handicapApplied', { points: handicap })}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 mt-2">
                                    <StatItem label={t('stats.zeroInnings')} value={turnStats.zeroInnings} />
                                    <StatItem label={t('stats.clean10s')} value={turnStats.clean10s} />
                                    <StatItem label={t('stats.clean20s')} value={turnStats.clean20s} />
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <p className="text-5xl font-mono font-extrabold text-teal-300">{finalScores[playerId]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onClose}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-lg shadow-md transition-all duration-200 hover:scale-105"
            >
                {t('postGame.backToSetup')}
            </button>
        </div>
    );
};

export default PostGameSummary;