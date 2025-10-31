import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type GameRecord } from './types';

const AverageTrendChart: React.FC<{ records: GameRecord[]; title: string }> = ({ records, title }) => {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        const sortedRecords = [...records]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-20);

        if (sortedRecords.length < 2) return [];

        let cumulativeScore = 0;
        let cumulativeTurns = 0;

        return sortedRecords.map((record, index) => {
            cumulativeScore += record.score;
            cumulativeTurns += record.turns;
            return {
                game: index + 1,
                average: cumulativeTurns > 0 ? cumulativeScore / cumulativeTurns : 0,
            };
        });
    }, [records]);

    if (chartData.length < 2) {
        return (
            <div className="bg-gray-900/50 rounded-lg p-4 w-full h-48 flex items-center justify-center">
                 <p className="text-gray-500">{t('playerStats.noStats')}</p>
            </div>
        );
    }
    
    const width = 300;
    const height = 100;
    const padding = 15;

    const maxAvg = Math.max(...chartData.map(d => d.average), 0);
    const minAvg = Math.min(...chartData.map(d => d.average));

    const getX = (index: number) => padding + (index / (chartData.length - 1)) * (width - padding * 2);
    const getY = (avg: number) => height - padding - (maxAvg > 0 ? (avg / maxAvg) * (height - padding * 2) : 0);

    const pathData = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.average)}`).join(' ');

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-teal-300 mb-2 text-center">{title}</h3>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label={title}>
                {/* Y-Axis Labels */}
                <text x={padding - 5} y={padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{maxAvg.toFixed(2)}</text>
                <text x={padding - 5} y={height - padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{minAvg > 0 ? minAvg.toFixed(2) : '0.00'}</text>
                
                {/* Grid Line */}
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-gray-700" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-gray-700" strokeWidth="0.5" />
                
                {/* Main Path */}
                <path d={pathData} fill="none" className="stroke-teal-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                {/* Data Points */}
                {chartData.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(d.average)} r="2.5" className="fill-teal-300 stroke-gray-900" strokeWidth="1">
                        <title>{`Game ${d.game}: Avg ${d.average.toFixed(2)}`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};

export default AverageTrendChart;
