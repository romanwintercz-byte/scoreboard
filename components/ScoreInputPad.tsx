import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { triggerHapticFeedback } from '../utils';

const ScoreInputPad: React.FC<{
    onScore: (scoreData: { points: number, type: 'standard' | 'clean10' | 'clean20' | 'numpad' }) => void;
    onEndTurn: () => void;
    onUndoTurn: () => void;
    isUndoTurnDisabled: boolean;
    pointsToTarget: number;
    allowOvershooting: boolean;
    gameType: string;
}> = ({ onScore, onEndTurn, onUndoTurn, isUndoTurnDisabled, pointsToTarget, allowOvershooting, gameType }) => {
    const { t } = useTranslation();
    const [showNumpad, setShowNumpad] = useState(false);
    const [numpadValue, setNumpadValue] = useState('');

    const isThreeBallGame = 
        gameType === 'gameSetup.threeCushion' ||
        gameType === 'gameSetup.oneCushion' ||
        gameType === 'gameSetup.freeGame';

    const handleNumpadInput = (char: string) => {
        triggerHapticFeedback(30);
        if (char === 'del') {
            setNumpadValue(prev => prev.slice(0, -1));
        } else {
            setNumpadValue(prev => prev + char);
        }
    };
    
    const handleAddFromNumpad = () => {
        const points = parseInt(numpadValue, 10);
        if (!isNaN(points) && points > 0) {
            triggerHapticFeedback(50);
            onScore({ points, type: 'numpad' });
        }
        setNumpadValue('');
        setShowNumpad(false);
    };

    const handleScoreClick = (points: number, type: 'standard' | 'clean10' | 'clean20') => {
        triggerHapticFeedback(30);
        onScore({ points, type });
    };

    const handleEndTurnClick = () => {
        triggerHapticFeedback(80);
        onEndTurn();
    };

    const handleUndoTurnClick = () => {
        triggerHapticFeedback([20, 40, 20]);
        onUndoTurn();
    };


    const isClean20Disabled = !allowOvershooting && pointsToTarget < 20;
    const isClean10Disabled = !allowOvershooting && pointsToTarget < 10;

    if (showNumpad) {
        return (
            <div className="mt-4 bg-[--color-bg] p-4 rounded-2xl shadow-inner">
                <input
                    type="text"
                    readOnly
                    value={numpadValue}
                    className="w-full bg-[--color-surface] text-[--color-text-primary] text-right text-3xl font-mono rounded-lg px-4 py-2 mb-4"
                    placeholder="0"
                />
                <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(char => (
                        <button key={char} onClick={() => handleNumpadInput(char)} className="bg-[--color-surface-light] hover:bg-[--color-surface] text-[--color-text-primary] font-bold py-4 rounded-lg text-xl">
                            {char}
                        </button>
                    ))}
                     <button onClick={() => handleNumpadInput('del')} className="bg-[--color-red]/50 hover:bg-[--color-red]/70 text-white font-bold py-4 rounded-lg text-xl">
                        ⌫
                    </button>
                     <button onClick={() => handleNumpadInput('0')} className="bg-[--color-surface-light] hover:bg-[--color-surface] text-[--color-text-primary] font-bold py-4 rounded-lg text-xl">
                        0
                    </button>
                    <button onClick={handleAddFromNumpad} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-4 rounded-lg text-xl">{t('scorePad.add')}</button>
                </div>
                 <button onClick={() => setShowNumpad(false)} className="w-full mt-2 bg-[--color-surface-light] hover:bg-[--color-border] text-[--color-text-primary] font-bold py-2 rounded-lg">{t('cancel')}</button>
            </div>
        );
    }
    
    return (
        <div className="mt-4 bg-[--color-bg] p-4 rounded-2xl shadow-inner flex flex-col gap-3">
            {isThreeBallGame ? (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleScoreClick(1, 'standard')} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-6 rounded-lg text-2xl flex items-center justify-center">+1</button>
                    <button onClick={() => handleScoreClick(-1, 'standard')} className="bg-[--color-red] hover:bg-[--color-red-hover] text-white font-bold py-6 rounded-lg text-2xl flex items-center justify-center">-1</button>
                </div>
            ) : (
                <div className="grid grid-cols-3 grid-rows-2 gap-2">
                    <button onClick={() => handleScoreClick(1, 'standard')} className="bg-[--color-green] hover:bg-[--color-green-hover] text-white font-bold py-3 rounded-lg text-2xl row-span-2 flex items-center justify-center">+1</button>
                    <button onClick={() => handleScoreClick(10, 'clean10')} disabled={isClean10Disabled} className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 rounded-lg disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('scorePad.clean10')}</button>
                    <button onClick={() => handleScoreClick(20, 'clean20')} disabled={isClean20Disabled} className="bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-2 rounded-lg disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('scorePad.clean20')}</button>
                    <button onClick={() => handleScoreClick(-1, 'standard')} className="bg-[--color-red] hover:bg-[--color-red-hover] text-white font-bold py-2 rounded-lg text-lg">-1</button>
                    <button onClick={() => handleScoreClick(-10, 'standard')} className="bg-[--color-red] hover:bg-[--color-red-hover] text-white font-bold py-2 rounded-lg text-lg">-10</button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={handleUndoTurnClick} 
                    disabled={isUndoTurnDisabled}
                    className="bg-[--color-yellow] hover:bg-[--color-yellow-hover] text-black font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ↶ {t('undoTurn')}
                </button>
                <button onClick={() => { triggerHapticFeedback(40); setShowNumpad(true); }} className="bg-[--color-surface-light] hover:bg-[--color-surface] text-[--color-text-primary] font-bold p-3 rounded-lg flex items-center justify-center text-3xl">
                    🧮
                </button>
            </div>
            <button onClick={handleEndTurnClick} className="w-full bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold py-3 rounded-lg text-xl shadow-lg transition-transform transform hover:scale-105">
                {t('scorePad.endTurn')}
            </button>
        </div>
    );
};

export default ScoreInputPad;