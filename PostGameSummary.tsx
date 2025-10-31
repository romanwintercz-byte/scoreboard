import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type GameSummary, type Player } from './types';
import Avatar from './Avatar';

// --- Inlined ScoreProgressionChart Component ---

const PLAYER_COLORS = ['#2dd4bf', '#facc15', '#fb923c', '#a78bfa']; // teal, yellow, orange, purple

interface ScoreProgressionChartProps {
    gameHistory: GameSummary['gameHistory'];
    playerIds: string[];
    players: Player[];
    targetScore: number;
}

const ScoreProgressionChart: React.FC<ScoreProgressionChartProps> = ({ gameHistory, playerIds, players, targetScore }) => {

    const chartData = useMemo(() => {
        if (!gameHistory || gameHistory.length < 1) return [];

        return playerIds.map((playerId, index) => {
            const playerInfo = players.find(p => p.id === playerId);
            return {
                playerId,
                name: playerInfo?.name || 'Unknown',
                avatar: playerInfo?.avatar || '',
                color: PLAYER_COLORS[index % PLAYER_COLORS.length],
                data: gameHistory.map((state, turnIndex) => ({
                    turn: turnIndex,
                    score: state.scores[playerId] || 0,
                })),
            };
        });
    }, [gameHistory, playerIds, players]);
    
    if (chartData.length === 0 || gameHistory.length < 2) return null;

    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };

    const maxTurn = gameHistory.length - 1;
    const maxScore = Math.max(targetScore, ...gameHistory.flatMap(s => Object.values(s.scores)));

    const getX = (turn: number) => padding.left + (turn / maxTurn) * (width - padding.left - padding.right);
    const getY = (score: number) => height - padding.bottom - (maxScore > 0 ? (score / maxScore) * (height - padding.top - padding.bottom) : 0);

    const pathData = (seriesData: { turn: number, score: number }[]) =>
        seriesData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.turn)} ${getY(d.score)}`).join(' ');

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 w-full mt-6">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label="Score Progression Chart">
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                    <g key={tick}>
                        <line
                            x1={padding.left} y1={getY(maxScore * tick)}
                            x2={width - padding.right} y2={getY(maxScore * tick)}
                            className="stroke-gray-700" strokeWidth="0.5" strokeDasharray="2"
                        />
                        <text
                            x={padding.left - 8} y={getY(maxScore * tick)}
                            dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono"
                        >
                            {Math.round(maxScore * tick)}
                        </text>
                    </g>
                ))}
                
                {/* Target Score Line */}
                <line
                    x1={padding.left} y1={getY(targetScore)}
                    x2={width - padding.right} y2={getY(targetScore)}
                    className="stroke-red-500/50" strokeWidth="1" strokeDasharray="4"
                />

                {/* X-Axis Labels */}
                <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-xs fill-gray-400 font-mono">Turn 0</text>
                <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-xs fill-gray-400 font-mono">Turn {maxTurn}</text>


                {/* Data Paths */}
                {chartData.map(series => (
                    <path
                        key={series.playerId}
                        d={pathData(series.data)}
                        fill="none"
                        stroke={series.color}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                ))}
                
                {/* Legend */}
                <g>
                    {chartData.map((series, index) => {
                        const legendItemWidth = (width - padding.left - padding.right) / chartData.length;
                        const xPos = padding.left + index * legendItemWidth;
                        const yPos = height - padding.bottom + 35;
                        return (
                            <g key={series.playerId} transform={`translate(${xPos}, ${yPos})`}>
                                <rect y="-5" width="12" height="12" fill={series.color} rx="3" />
                                <text x="18" className="text-xs fill-gray-300 truncate" width={legendItemWidth - 20}>{series.name}</text>
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    );
};

// --- Original PostGameSummary Component ---

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono font-bold text-white">{value}</span>
    </div>
);

const PostGameSummary: React.FC<{
    summary: GameSummary;
    players: Player[];
    onNewGame: () => void;
    onRematch: () => void;
}> = ({ summary, players, onNewGame, onRematch }) => {
    const { t } = useTranslation();
    const { gameInfo, finalScores, winnerIds, turnsPerPlayer, gameHistory } = summary;
    const [showChart, setShowChart] = useState(false);

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
                    const turns = turnsPerPlayer[playerId] || 0;
                    const average = turns > 0 ? ((finalScores[playerId] - handicap) / turns).toFixed(2) : '0.00';
                    
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 mt-2">
                                    <StatItem label={t('postGame.average')} value={average} />
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

            <div className="mt-6 text-center">
                <button
                    onClick={() => setShowChart(!showChart)}
                    className="text-teal-400 hover:text-teal-300 font-semibold py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                    {showChart ? t('postGame.hideChart') : t('postGame.showChart')}
                </button>
            </div>
            
            {showChart && (
                <ScoreProgressionChart 
                    gameHistory={gameHistory}
                    playerIds={gameInfo.playerIds}
                    players={players}
                    targetScore={gameInfo.targetScore}
                />
            )}

            <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button
                    onClick={onRematch}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition-all duration-200 hover:scale-105"
                >
                    {t('postGame.rematch')}
                </button>
                <button
                    onClick={onNewGame}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-lg shadow-md transition-all duration-200 hover:scale-105"
                >
                    {t('postGame.newGame')}
                </button>
            </div>
        </div>
    );
};

export default PostGameSummary;