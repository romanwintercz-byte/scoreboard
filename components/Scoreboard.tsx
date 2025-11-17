import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameSummary, GameInfo } from '../types';
import Avatar from './Avatar';
import ScoreInputPad from './ScoreInputPad';

// --- NEW COMPACT PLAYER CARD ---

const CompactPlayerCard: React.FC<{
  player: Player;
  score: number;
  turnScore: number;
  turns: number;
  inning: number;
  isActive: boolean;
  targetScore: number;
}> = ({ player, score, turnScore, turns, inning, isActive, targetScore }) => {
    const { t } = useTranslation();
    const earnedScore = score - (0); // Placeholder for handicap if needed later
    const average = turns > 0 ? (earnedScore / turns) : 0;
    const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
    const pointsToTarget = Math.max(0, targetScore - score);

    return (
        <div className={`
            p-3 rounded-xl flex items-center gap-4 transition-all duration-300 relative shadow-md overflow-hidden
            ${isActive ? 'bg-[--color-surface] ring-2 ring-[--color-accent]' : 'bg-[--color-surface-light] opacity-80'}
        `}>
            {isActive && <div className="absolute left-1 top-1/2 -translate-y-1/2 h-3/4 w-1.5 bg-[--color-accent] rounded-full"></div>}
            <div className="pl-2">
                <Avatar avatar={player.avatar} className="w-12 h-12 flex-shrink-0" />
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-xl font-bold truncate text-[--color-text-primary]">{player.name}</p>
                <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold text-[--color-text-secondary]">{t('scoreboard.inning', { count: inning })}</p>
                    {pointsToTarget > 0 && (
                        <p className="text-sm font-mono text-yellow-400">{t('scoreboard.pointsToTarget', { points: pointsToTarget })}</p>
                    )}
                </div>
            </div>
            <div className="flex items-baseline gap-2 text-right flex-shrink-0 pr-2">
                <p className="text-5xl font-mono font-extrabold text-[--color-text-primary]">{score}</p>
                {turnScore > 0 && (
                    <p key={turnScore} className="text-2xl font-mono font-bold text-[--color-green] animate-score-pop">
                        +{turnScore}
                    </p>
                )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/50">
                <div
                    className="h-full bg-[--color-accent] transition-all duration-300 ease-out"
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
    const { gameInfo, scores, turnScore, activePlayersWithStats, turnsPerPlayer, handleAddToTurn, handleEndTurn, handleUndoLastTurn } = props;
    const { t } = useTranslation();

    const currentPlayer = activePlayersWithStats[gameInfo.currentPlayerIndex];

    if (!currentPlayer) {
        return <p className="text-center text-gray-500">{t('noPlayersSelected')}</p>;
    }

    const pointsToTarget = gameInfo.targetScore - ((scores[currentPlayer.id] || 0) + turnScore);

    return (
        <div className="w-full h-[calc(100vh-5rem)] flex flex-col max-w-md mx-auto">
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                 {activePlayersWithStats.map((player, index) => (
                    <CompactPlayerCard
                        key={player.id}
                        player={player}
                        score={scores[player.id] || 0}
                        turnScore={gameInfo.currentPlayerIndex === index ? turnScore : 0}
                        turns={turnsPerPlayer[player.id] || 0}
                        inning={gameInfo.inning}
                        isActive={gameInfo.currentPlayerIndex === index}
                        targetScore={gameInfo.targetScore}
                    />
                ))}
            </div>

            <div className="flex-shrink-0 bg-[--color-bg] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
                <ScoreInputPad
                    onScore={handleAddToTurn}
                    onEndTurn={handleEndTurn}
                    onUndoTurn={handleUndoLastTurn}
                    isUndoTurnDisabled={props.gameHistory.length <= 1}
                    pointsToTarget={pointsToTarget}
                    allowOvershooting={gameInfo.allowOvershooting ?? false}
                    gameType={gameInfo.type}
                />
            </div>
        </div>
    );
}

export default Scoreboard;

