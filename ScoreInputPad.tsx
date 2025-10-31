import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ScoreInputPad: React.FC<{
    onScore: (points: number) => void;
    onEndTurn: () => void;
    onUndo: () => void;
    isUndoDisabled: boolean;
}> = ({ onScore, onEndTurn, onUndo, isUndoDisabled }) => {
    const { t } = useTranslation();
    const [showNumpad, setShowNumpad] = useState(false);
    const [numpadValue, setNumpadValue] = useState('');

    const handleNumpadInput = (char: string) => {
        if (char === 'del') {
            setNumpadValue(prev => prev.slice(0, -1));
        } else {
            setNumpadValue(prev => prev + char);
        }
    };
    
    const handleAddFromNumpad = () => {
        const points = parseInt(numpadValue, 10);
        if (!isNaN(points) && points > 0) {
            onScore(points);
        }
        setNumpadValue('');
        setShowNumpad(false);
    };

    if (showNumpad) {
        return (
            <div className="mt-4 bg-gray-800 p-4 rounded-2xl shadow-inner">
                <input
                    type="text"
                    readOnly
                    value={numpadValue}
                    className="w-full bg-gray-900 text-white text-right text-3xl font-mono rounded-lg px-4 py-2 mb-4"
                    placeholder="0"
                />
                <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(char => (
                        <button key={char} onClick={() => handleNumpadInput(char)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg text-xl">
                            {char}
                        </button>
                    ))}
                     <button onClick={() => handleNumpadInput('del')} className="bg-red-800 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-xl">
                        ⌫
                    </button>
                     <button onClick={() => handleNumpadInput('0')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg text-xl">
                        0
                    </button>
                    <button onClick={handleAddFromNumpad} className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg text-xl">{t('scorePad.add')}</button>
                </div>
                 <button onClick={() => setShowNumpad(false)} className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg">{t('cancel')}</button>
            </div>
        );
    }
    
    return (
        <div className="mt-4 bg-gray-800 p-4 rounded-2xl shadow-inner flex flex-col gap-3">
            <div className="grid grid-cols-3 grid-rows-2 gap-2">
                <button onClick={() => onScore(1)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-2xl row-span-2 flex items-center justify-center">+1</button>
                <button onClick={() => onScore(10)} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-lg">{t('scorePad.clean10')}</button>
                <button onClick={() => onScore(20)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg">{t('scorePad.clean20')}</button>
                <button onClick={() => onScore(-1)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg">-1</button>
                <button onClick={() => onScore(-10)} className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg text-lg">-10</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={onUndo} 
                    disabled={isUndoDisabled}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ↶ {t('scorePad.undo')}
                </button>
                <button onClick={() => setShowNumpad(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-lg flex items-center justify-center text-3xl">
                    🧮
                </button>
            </div>
            <button onClick={onEndTurn} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg text-xl shadow-lg transition-transform transform hover:scale-105">
                {t('scorePad.endTurn')}
            </button>
        </div>
    );
};

export default ScoreInputPad;