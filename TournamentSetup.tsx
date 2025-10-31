import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type TournamentSettings } from './types';
import Avatar from './Avatar';

const GAME_TYPE_DEFAULTS: { [key: string]: number } = {
  'gameSetup.fourBall': 200,
  'gameSetup.freeGame': 50,
  'gameSetup.oneCushion': 30,
  'gameSetup.threeCushion': 15,
};

const TournamentSetup: React.FC<{
    players: Player[];
    onSubmit: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onCancel: () => void;
}> = ({ players, onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.threeCushion');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS['gameSetup.threeCushion']);
    const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('equal-innings');

    const availablePlayers = useMemo(() => 
        players.filter(p => !selectedPlayerIds.includes(p.id)), 
    [players, selectedPlayerIds]);
    
    const selectedPlayers = useMemo(() =>
        selectedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p),
    [selectedPlayerIds, players]);

    const handlePlayerToggle = (playerId: string) => {
        setSelectedPlayerIds(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }
            if (prev.length < 8) {
                return [...prev, playerId];
            }
            return prev;
        });
    };
    
    const handleGameTypeChange = (key: string) => {
        setGameTypeKey(key);
        setTargetScore(GAME_TYPE_DEFAULTS[key] || 50);
    }

    const handleSubmit = () => {
        if (name.trim() && selectedPlayerIds.length >= 3 && selectedPlayerIds.length <= 8) {
            onSubmit(name.trim(), selectedPlayerIds, { gameTypeKey, targetScore, endCondition });
        }
    };
    
    const isSubmitDisabled = name.trim().length === 0 || selectedPlayerIds.length < 3 || selectedPlayerIds.length > 8;
    
    let errorText = '';
    if (selectedPlayerIds.length > 0 && selectedPlayerIds.length < 3) {
        errorText = t('tournament.notEnoughPlayers');
    } else if (selectedPlayerIds.length > 8) {
        errorText = t('tournament.tooManyPlayers');
    }

    const buttonClasses = (isActive: boolean) => 
        `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
            isActive 
            ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
            : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
        }`;

    return (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-white">{t('tournament.setupTitle')}</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Settings */}
                <div className="space-y-6">
                    <div>
                        <label className="text-xl font-bold text-teal-300 mb-2 block">{t('tournament.name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('tournament.namePlaceholder') as string}
                            className="w-full bg-gray-700 text-white text-lg rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.selectType')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(GAME_TYPE_DEFAULTS).map(key => (
                                <button key={key} onClick={() => handleGameTypeChange(key)} className={buttonClasses(gameTypeKey === key)}>
                                    {t(key as any)}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.targetScore')}</h3>
                        <input 
                            type="number"
                            value={targetScore}
                            onChange={(e) => setTargetScore(Number(e.target.value))}
                            className="w-full bg-gray-700 text-white text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.endCondition')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setEndCondition('sudden-death')} className={buttonClasses(endCondition === 'sudden-death')}>
                                {t('gameSetup.suddenDeath')}
                            </button>
                            <button onClick={() => setEndCondition('equal-innings')} className={buttonClasses(endCondition === 'equal-innings')}>
                                {t('gameSetup.equalInnings')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Player Selection */}
                <div>
                     <h3 className="text-xl font-bold text-teal-300 mb-4">{t('tournament.selectPlayers')} ({selectedPlayerIds.length})</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.availablePlayers')}</h4>
                             <div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">
                                {availablePlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}
                             </div>
                        </div>
                        <div>
                             <h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.playersInGame')}</h4>
                             <div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">
                                {selectedPlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}
                             </div>
                        </div>
                     </div>
                     {errorText && <p className="text-red-400 text-center mt-2 font-semibold">{errorText}</p>}
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">
                    {t('cancel')}
                </button>
                <button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 enabled:hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    {t('tournament.create')}
                </button>
            </div>
        </div>
    );
};

const PlayerSelectItem: React.FC<{ player: Player, onClick: () => void }> = ({ player, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-gray-700 hover:bg-indigo-600">
    <Avatar avatar={player.avatar} className="w-8 h-8 flex-shrink-0" />
    <span className="font-semibold truncate text-sm">{player.name}</span>
  </button>
);


export default TournamentSetup;
