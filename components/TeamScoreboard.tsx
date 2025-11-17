import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameInfo, GameSummary } from '../types';
import Avatar from './Avatar';
import ScoreInputPad from './ScoreInputPad';

// --- HELPER COMPONENTS ---

const CompactTeamPlayerCard: React.FC<{
  player: Player;
  score: number;
  isActive: boolean;
}> = ({ player, score, isActive }) => {
  return (
    <div className={`relative flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-[--color-primary]/20' : 'bg-[--color-bg]'}`}>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[--color-primary] rounded-l-lg animate-pulse"></div>}
      <Avatar avatar={player.avatar} className="w-8 h-8 flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-white truncate text-sm">{player.name}</p>
      </div>
      <p className="font-mono font-bold text-lg text-white">{score}</p>
    </div>
  );
};

const CompactTeamScoreCard: React.FC<{
  teamName: string;
  teamPlayers: (Player & { movingAverage: number; lastSixResults: GameRecord['result'][] })[];
  teamScores: { [playerId: string]: number };
  isActive: boolean;
  activePlayerId: string | null;
  turnScore: number;
  targetScore: number;
  inning: number;
}> = ({ teamName, teamPlayers, teamScores, isActive, activePlayerId, turnScore, targetScore, inning }) => {
    const { t } = useTranslation();
    const totalScore = teamPlayers.reduce((sum, p) => sum + (teamScores[p.id] || 0), 0);
    const currentTotalScore = totalScore + turnScore;
    const scorePercentage = targetScore > 0 ? (currentTotalScore / targetScore) * 100 : 0;
    const pointsToTarget = Math.max(0, targetScore - currentTotalScore);
    
    return (
        <div className={`p-4 rounded-xl space-y-3 shadow-md relative overflow-hidden ${isActive ? 'bg-[--color-surface] ring-2 ring-[--color-accent]' : 'bg-[--color-surface-light] opacity-90'}`}>
            <div className="flex justify-between items-baseline">
                <h2 className="text-2xl font-bold text-[--color-accent]">{teamName}</h2>
                 <p className="text-lg font-semibold text-[--color-text-secondary]">{t('scoreboard.inning', { count: inning })}</p>
            </div>
            
            <div className="flex justify-between items-baseline -mt-2 mb-2">
                 {pointsToTarget > 0 ? (
                    <p className="text-sm font-mono text-yellow-400">{t('scoreboard.pointsToTarget', { points: pointsToTarget })}</p>
                ) : <div />}
                <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-mono font-extrabold text-[--color-text-primary]">{totalScore}</p>
                     {isActive && turnScore > 0 && (
                        <p key={turnScore} className="text-2xl font-mono font-bold text-[--color-green] animate-score-pop">
                            +{turnScore}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamPlayers.map(player => (
                    <CompactTeamPlayerCard 
                        key={player.id}
                        player={player}
                        score={teamScores[player.id] || 0}
                        isActive={player.id === activePlayerId}
                    />
                ))}
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
const TeamScoreboard: React.FC<{
    gameInfo: GameInfo;
    scores: { [playerId: string]: number };
    turnScore: number;
    activePlayersWithStats: (Player & { movingAverage: number, lastSixResults: GameRecord['result'][] })[];
    gameHistory: GameSummary['gameHistory'];
    players: Player[];
    handleAddToTurn: (scoreData: { points: number, type: string }) => void;
    handleEndTurn: () => void;
    handleUndoLastTurn: () => void;
}> = (props) => {
    const { gameInfo, scores, turnScore, activePlayersWithStats, handleAddToTurn, handleEndTurn, handleUndoLastTurn } = props;
    const { t } = useTranslation();

    const currentPlayer = activePlayersWithStats[gameInfo.currentPlayerIndex];
    const team1Players = activePlayersWithStats.filter((_, i) => i % 2 === 0);
    const team2Players = activePlayersWithStats.filter((_, i) => i % 2 !== 0);
    const isTeam1Active = gameInfo.currentPlayerIndex % 2 === 0;

    const activeTeamIds = gameInfo.playerIds.filter((_, i) => i % 2 === (isTeam1Active ? 0 : 1));
    const activeTeamScore = activeTeamIds.reduce((sum, id) => sum + (scores[id] || 0), 0);
    const pointsToTargetForTeam = gameInfo.targetScore - (activeTeamScore + turnScore);

    return (
        <div className="w-full h-[calc(100vh-5rem)] flex flex-col max-w-md mx-auto">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <CompactTeamScoreCard
                    teamName={t('gameSetup.team1')}
                    teamPlayers={team1Players}
                    teamScores={scores}
                    isActive={isTeam1Active}
                    activePlayerId={currentPlayer?.id}
                    turnScore={isTeam1Active ? turnScore : 0}
                    targetScore={gameInfo.targetScore}
                    inning={gameInfo.inning}
                />
                <CompactTeamScoreCard
                    teamName={t('gameSetup.team2')}
                    teamPlayers={team2Players}
                    teamScores={scores}
                    isActive={!isTeam1Active}
                    activePlayerId={currentPlayer?.id}
                    turnScore={!isTeam1Active ? turnScore : 0}
                    targetScore={gameInfo.targetScore}
                    inning={gameInfo.inning}
                />
            </div>
             <div className="flex-shrink-0 bg-[--color-bg] shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
                <ScoreInputPad
                    onScore={handleAddToTurn}
                    onEndTurn={handleEndTurn}
                    onUndoTurn={handleUndoLastTurn}
                    isUndoTurnDisabled={props.gameHistory.length <= 1}
                    pointsToTarget={pointsToTargetForTeam}
                    allowOvershooting={gameInfo.allowOvershooting ?? false}
                    gameType={gameInfo.type}
                />
            </div>
        </div>
    );
};

export default TeamScoreboard;
