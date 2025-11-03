import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameSummary, GameInfo } from '../types';
import Avatar from './Avatar';
import ScoreInputPad from './ScoreInputPad';

// --- HELPER COMPONENTS ---

const ResultDots: React.FC<{ results: GameRecord['result'][]; dotClassName?: string }> = ({ results, dotClassName = "w-2 h-2" }) => {
    const { t } = useTranslation();
    const resultMapping: { [key in GameRecord['result'] | 'pending']: { title: string, color: string } } = {
        win: { title: t('stats.wins') as string, color: 'bg-green-500' },
        loss: { title: t('stats.losses') as string, color: 'bg-red-500' },
        draw: { title: t('tournament.draws') as string, color: 'bg-yellow-500' },
        pending: { title: 'Pending', color: 'bg-gray-600' }
    };
    const resultsToDisplay = [
        ...results,
        ...Array(Math.max(0, 6 - results.length)).fill('pending')
    ];
    return (
        <div className="flex gap-1 items-center">
            {resultsToDisplay.map((result, index) => {
                const { title, color } = resultMapping[result as keyof typeof resultMapping];
                return <div key={index} title={title} className={`${color} ${dotClassName} rounded-full shadow-sm`}></div>;
            })}
        </div>
    );
};

const TrendArrow: React.FC<{ current: number; previous: number; }> = ({ current, previous }) => {
    if (previous <= 0 || current <= 0) return null;
    if (current > previous) {
        return <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"></path></svg>;
    }
    if (current < previous) {
        return <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5 5H7z"></path></svg>;
    }
    return null;
};

const TurnHistoryTooltip: React.FC<{
    playerId: string;
    gameHistory: GameSummary['gameHistory'];
    gameInfo: GameInfo;
    onClose: () => void;
}> = ({ playerId, gameHistory, gameInfo, onClose }) => {
    const { t } = useTranslation();
    const playerIndex = gameInfo.playerIds.indexOf(playerId);

    const turnScores = useMemo(() => {
        const scores: number[] = [];
        for (let i = 0; i < gameHistory.length; i++) {
            if (gameHistory[i].currentPlayerIndex === playerIndex) {
                const scoreBefore = gameHistory[i].scores[playerId] || 0;
                if (gameHistory[i + 1]) {
                    const scoreAfter = gameHistory[i + 1].scores[playerId] || 0;
                    scores.push(scoreAfter - scoreBefore);
                }
            }
        }
        return scores.reverse().slice(0, 5);
    }, [gameHistory, playerId, playerIndex]);

    return (
        <div className="absolute top-16 left-0 z-20 bg-gray-900 border border-teal-500/30 rounded-lg shadow-2xl p-4 w-48 animate-fade-in-fast">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-teal-400">{t('turnHistory.title')}</h4>
                <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            {turnScores.length > 0 ? (
                <ul className="space-y-1 text-sm font-mono">
                    {turnScores.map((score, index) => (
                        <li key={index} className="flex justify-between">
                            <span>{t('turnHistory.turn', { count: gameHistory.filter(h => h.currentPlayerIndex === playerIndex).length - index })}:</span>
                            <span className={score > 0 ? 'text-green-400' : 'text-gray-400'}>
                                {score > 0 ? `+${score}` : score}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-sm">{t('turnHistory.noHistory')}</p>
            )}
            <style>{`.animate-fade-in-fast { animation: fade-in 0.2s ease-out; }`}</style>
        </div>
    );
};

const PlayerScoreCard: React.FC<{
  player: Player & { movingAverage: number, lastSixResults: GameRecord['result'][] };
  score: number;
  turns: number;
  turnScore: number;
  targetScore: number;
  handicap: number;
  gameHistory: GameSummary['gameHistory'];
  gameInfo: GameInfo;
  pointsToTarget: number;
}> = ({ player, score, turns, turnScore, targetScore, handicap, gameHistory, gameInfo, pointsToTarget }) => {
    const { t } = useTranslation();
    const [showHistory, setShowHistory] = useState(false);

    const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
    const turnScorePercentage = targetScore > 0 ? (turnScore / targetScore) * 100 : 0;
    
    const earnedScore = score - handicap;
    const average = turns > 0 ? (earnedScore / turns) : 0;

    const resultMapping: { [key in GameRecord['result'] | 'pending']: { title: string, color: string } } = {
        win: { title: t('stats.wins') as string, color: 'bg-green-500' },
        loss: { title: t('stats.losses') as string, color: 'bg-red-500' },
        draw: { title: t('tournament.draws') as string, color: 'bg-yellow-500' },
        pending: { title: 'Pending', color: 'bg-gray-600' }
    };

    const resultsToDisplay = [
        ...player.lastSixResults,
        ...Array(Math.max(0, 6 - player.lastSixResults.length)).fill('pending')
    ];

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 w-full transform transition-transform duration-300 relative">
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 relative">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <Avatar avatar={player.avatar} className="w-14 h-14 sm:w-16 sm:h-16" />
                    <div className="truncate">
                        <h2 className="text-2xl sm:text-3xl font-bold text-teal-400 truncate">{player.name}</h2>
                         <button onClick={() => setShowHistory(s => !s)} className="text-sm text-gray-400 hover:text-teal-300 transition-colors">{t('turnHistory.show')}</button>
                    </div>
                </div>
                 {showHistory && <TurnHistoryTooltip playerId={player.id} gameHistory={gameHistory} gameInfo={gameInfo} onClose={() => setShowHistory(false)} />}
                
                <div className="flex items-baseline gap-1 sm:gap-3 text-right flex-shrink-0">
                    <p className="text-7xl sm:text-8xl font-mono font-extrabold text-white">{score}</p>
                    {turnScore > 0 && (
                        <p key={turnScore} className="text-3xl sm:text-4xl font-mono font-bold text-green-400 animate-score-pop">
                            +{turnScore}
                        </p>
                    )}
                </div>
            </div>

            <div className="w-full h-5 bg-gray-900/50 rounded-full overflow-hidden relative mb-2">
                <div className="absolute h-full bg-teal-600/50 rounded-full" style={{ width: '100%' }} />
                <div 
                    className="absolute h-full bg-teal-400 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                    style={{ width: `${Math.min(100, scorePercentage)}%` }}
                >
                    <span className="text-black text-xs font-bold">{scorePercentage.toFixed(0)}%</span>
                </div>
                <div 
                    className="absolute h-full bg-teal-400/50 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                        left: `${Math.min(100, scorePercentage)}%`,
                        width: `${Math.min(100 - scorePercentage, turnScorePercentage)}%`
                    }}
                />
            </div>

            {pointsToTarget > 0 && (
                <div className="text-center mb-4">
                    <p className={`text-xl font-bold ${
                        pointsToTarget <= 10 ? 'text-red-400' :
                        pointsToTarget <= 20 ? 'text-yellow-400' :
                        'text-gray-400'
                    }`}>
                        {t('scoreboard.pointsToTarget', { points: pointsToTarget })}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-gray-700/50 pt-4">
                <div>
                    <p className="text-sm text-gray-400 font-semibold">{t('scoreboard.average')}</p>
                    <p className="font-mono font-bold text-xl text-white flex items-center justify-center gap-1">
                        {average.toFixed(2)}
                        <TrendArrow current={average} previous={player.movingAverage} />
                    </p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400 font-semibold">{t('scoreboard.inning', { count: turns + 1 })}</p>
                    <p className="font-mono font-bold text-xl text-white">{turns + 1}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-semibold">{t('playerStats.movingAverage')}</p>
                    <p className="font-mono font-bold text-xl text-white">{player.movingAverage.toFixed(2)}</p>
                </div>
                <div>
                     <p className="text-sm text-gray-400 font-semibold mb-1">{t('scoreboard.last6')}</p>
                     <div className="flex gap-1.5 justify-center">
                        {resultsToDisplay.map((result, index) => {
                            const { title, color } = resultMapping[result as keyof typeof resultMapping];
                            return (
                                <div key={index} title={title} className={`${color} w-5 h-5 rounded-full shadow-md`}></div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MinimizedPlayerCard: React.FC<{
  player: Player & { movingAverage: number, lastSixResults: GameRecord['result'][] };
  score: number;
  targetScore: number;
  turns: number;
  handicap: number;
  isActive: boolean;
  isFinished?: boolean;
}> = ({ player, score, targetScore, turns, handicap, isActive, isFinished }) => {
  const { t } = useTranslation();
  const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
  
  const earnedScore = score - handicap;
  const gameAverage = turns > 0 ? (earnedScore / turns) : 0;

  return (
    <div className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-gray-700' : 'bg-gray-800'} ${isFinished ? 'opacity-50' : ''}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-teal-400 transition-transform duration-300 ${isActive ? 'transform-none' : 'transform -translate-x-full'}`}></div>
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0 ml-2" />
        <div className="ml-3 flex-grow truncate">
            <p className="font-semibold text-white truncate">{player.name}</p>
             <div className="text-xs text-gray-400 font-mono">
                {t('scoreboard.average')}: <span className="font-bold text-teal-300">{gameAverage.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                <span title={t('playerStats.movingAverage') as string}>{player.movingAverage.toFixed(2)}</span>
                <ResultDots results={player.lastSixResults} dotClassName="w-2 h-2" />
            </div>
        </div>
        {isFinished && <span className="text-green-400 font-bold text-2xl mr-2">✓</span>}
        <p className="ml-2 font-mono font-bold text-2xl text-teal-300 pr-2">{score}</p>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
            <div 
                className="h-full bg-teal-400 rounded-r-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, scorePercentage)}%` }}
            />
        </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const Scoreboard: React.FC<{
    gameInfo: GameInfo;
    scores: { [playerId: string]: number };
    turnScore: number;
    activePlayersWithStats: (Player & { movingAverage: number, lastSixResults: GameRecord['result'][] })[];
    turnsPerPlayer: { [playerId: string]: number };
    gameHistory: GameSummary['gameHistory'];
    handleAddToTurn: (scoreData: { points: number, type: string }) => void;
    handleEndTurn: () => void;
    handleUndoLastTurn: () => void;
}> = (props) => {
    const { gameInfo, scores, turnScore, activePlayersWithStats, turnsPerPlayer, gameHistory, handleAddToTurn, handleEndTurn, handleUndoLastTurn } = props;
    const { t } = useTranslation();

    const currentPlayer = activePlayersWithStats[gameInfo.currentPlayerIndex];

    if (!currentPlayer) {
        return <p className="text-center text-gray-500">{t('noPlayersSelected')}</p>;
    }
    
    const otherPlayersWithStats = activePlayersWithStats.filter((p) => p.id !== currentPlayer.id);
    const pointsToTarget = gameInfo.targetScore - ((scores[currentPlayer.id] || 0) + turnScore);
    const currentPlayerHandicap = (gameInfo.handicap?.playerId === currentPlayer.id) ? gameInfo.handicap.points : 0;

    return (
        <>
            <PlayerScoreCard
                player={currentPlayer}
                score={scores[currentPlayer.id] || 0}
                turns={turnsPerPlayer[currentPlayer.id] || 0}
                turnScore={turnScore}
                targetScore={gameInfo.targetScore}
                handicap={currentPlayerHandicap}
                gameHistory={gameHistory}
                gameInfo={gameInfo}
                pointsToTarget={pointsToTarget}
            />
            <ScoreInputPad
                onScore={handleAddToTurn}
                onEndTurn={handleEndTurn}
                onUndoTurn={handleUndoLastTurn}
                isUndoTurnDisabled={gameHistory.length <= 1}
                pointsToTarget={pointsToTarget}
                allowOvershooting={gameInfo.allowOvershooting ?? false}
                gameType={gameInfo.type}
            />
            {otherPlayersWithStats.length > 0 && (
                <div className={`grid grid-cols-1 ${otherPlayersWithStats.length > 2 ? 'md:grid-cols-3' : otherPlayersWithStats.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-2 mt-4`}>
                    {otherPlayersWithStats.map(p => {
                        const handicapPoints = (gameInfo.handicap?.playerId === p.id) ? gameInfo.handicap.points : 0;
                        return (
                          <MinimizedPlayerCard
                              key={p.id}
                              player={p}
                              score={scores[p.id] || 0}
                              targetScore={gameInfo.targetScore}
                              turns={turnsPerPlayer[p.id] || 0}
                              handicap={handicapPoints}
                              isActive={false}
                              isFinished={gameInfo.finishedPlayerIds?.includes(p.id)}
                          />
                        );
                    })}
                </div>
            )}
        </>
    );
}

export default Scoreboard;