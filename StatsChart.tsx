import React from 'react';
import { useTranslation } from 'react-i18next';

const StatsChart: React.FC<{ generalAverage: number; movingAverage: number }> = ({ generalAverage, movingAverage }) => {
    const { t } = useTranslation();

    const maxValue = Math.max(generalAverage, movingAverage, 1); // Ensure maxValue is at least 1 to prevent division by zero
    const gpPercentage = (generalAverage / maxValue) * 100;
    const maPercentage = (movingAverage / maxValue) * 100;

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 w-full">
            <div className="flex justify-around items-end h-40 gap-4">
                {/* General Average Bar */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="w-full flex-grow flex items-end">
                        <div 
                            className="w-full bg-teal-500 rounded-t-md" 
                            style={{ height: `${gpPercentage}%` }}
                            title={`${t('playerStats.generalAverage')}: ${generalAverage.toFixed(2)}`}
                        ></div>
                    </div>
                    <p className="text-sm font-bold text-teal-300 mt-2 truncate" title={t('playerStats.generalAverage') as string}>GP</p>
                    <p className="font-mono font-extrabold text-xl text-white">{generalAverage.toFixed(2)}</p>
                </div>

                {/* Moving Average Bar */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="w-full flex-grow flex items-end">
                        <div 
                            className="w-full bg-yellow-400 rounded-t-md"
                            style={{ height: `${maPercentage}%` }}
                            title={`${t('playerStats.movingAverage')}: ${movingAverage.toFixed(2)}`}
                        ></div>
                    </div>
                    <p className="text-sm font-bold text-yellow-300 mt-2 truncate" title={t('playerStats.movingAverage') as string}>KP (10)</p>
                     <p className="font-mono font-extrabold text-xl text-white">{movingAverage.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

export default StatsChart;
