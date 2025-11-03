import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameInfo, GameSummary } from '../types';
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

const TeamPlayerCard: React.FC<{
  player: Player & { movingAverage: number; lastSixResults: GameRecord['result'][] };
  score: number;
  isActive: boolean;
}> = ({ player, score, isActive }) => {
  const { t } = useTranslation();
  return (
    <div className={`relative flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-teal-500/20' : 'bg-gray-900/50'}`}>
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-400 rounded-l-lg animate-pulse"></div>}
      <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-white truncate">{player.name}</p>
        <div className="flex items-center gap-2">
           <span className="text-xs text-gray-400 font-mono" title={t('playerStats.movingAverage') as string}>{player.movingAverage.toFixed(2)}</span>
           <ResultDots results={player.lastSixResults} dotClassName="w-2 h-2" />
        </div>
      </div>
      <p className="font-mono font-bold text-xl text-white">{score}</p>
    </div>
  );
};

const TeamTurnHistoryTooltip: React.FC<{
    teamPlayerIds: string[];
    gameHistory: GameSummary['gameHistory'];
    gameInfo: GameInfo;
    players: Player[];
    onClose: () => void;
}> = ({ teamPlayerIds, gameHistory, gameInfo, players, onClose }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

    const turnScores = useMemo(() => {
        const teamPlayerIndices = new Set(teamPlayerIds.map(id => gameInfo.playerIds.indexOf(id)));
        const scores: { player: Player | undefined, score: number }[] = [];
        
        for (let i = 0; i < gameHistory.length; i++) {
            const state = gameHistory[i];
            const playerIndex = state.currentPlayerIndex;

            if (teamPlayerIndices.has(playerIndex)) {
                const playerId = gameInfo.playerIds[playerIndex];
                const scoreBefore = state.scores[playerId] || 0;
                if (gameHistory[i + 1]) {
                    const scoreAfter = gameHistory[i + 1].scores[playerId] || 0;
                    scores.push({
                        player: playersMap.get(playerId),
                        score: scoreAfter - scoreBefore,
                    });
                }
            }
        }
        return scores.reverse().slice(0, 5);
    }, [gameHistory, teamPlayerIds, gameInfo.playerIds, playersMap]);

    return (
        <div className="absolute top-16 left-0 z-20 bg-gray-900 border border-teal-500/30 rounded-lg shadow-2xl p-4 w-56 animate-fade-in-fast">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-teal-400">{t('turnHistory.title')}</h4>
                <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            {turnScores.length > 0 ? (
                <ul className="space-y-2 text-sm font-mono">
                    {turnScores.map(({ player, score }, index) => (
                        <li key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2 truncate">
                                <Avatar avatar={player?.avatar || ''} className="w-5 h-5" />
                                <span className="truncate">{player?.name || '...'}</span>
                            </div>
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


const TeamScoreCard: React.FC<{
  teamName: string;
  teamPlayers: (Player & { movingAverage: number; lastSixResults: GameRecord['result'][] })[];
  teamScores: { [playerId: string]: number };
  targetScore: number;
  isActive: boolean;
  activePlayerId: string | null;
  turnScore: number;
  pointsToTarget: number;
  gameHistory: GameSummary['gameHistory'];
  gameInfo: GameInfo;
  players: Player[];
}> = ({ teamName, teamPlayers, teamScores, targetScore, isActive, activePlayerId, turnScore, pointsToTarget, gameHistory, gameInfo, players }) => {
    const { t } = useTranslation();
    const [showHistory, setShowHistory] = useState(false);
    
    const totalScore = teamPlayers.reduce((sum, p) => sum + (teamScores[p.id] || 0), 0);
    const currentTurnScore = isActive ? turnScore : 0;
    const scorePercentage = targetScore > 0 ? (totalScore / targetScore) * 100 : 0;
    const turnScorePercentage = targetScore > 0 ? (currentTurnScore / targetScore) * 100 : 0;
    
    return (
        <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 w-full transform transition-all duration-300 relative ${isActive ? 'ring-2 ring-teal-400' : ''}`}>
            {showHistory && (
              <TeamTurnHistoryTooltip 
                  teamPlayerIds={teamPlayers.map(p => p.id)}
                  gameHistory={gameHistory}
                  gameInfo={gameInfo}
                  players={players}
                  onClose={() => setShowHistory(false)}
              />
            )}
            <div className="flex justify-between items-baseline mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold text-teal-400">{teamName}</h2>
                    <button onClick={() => setShowHistory(s => !s)} className="text-sm text-gray-400 hover:text-teal-300 transition-colors">{t('turnHistory.show')}</button>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-3">
                    <p className="text-7xl font-mono font-extrabold text-white">{totalScore}</p>
                     {isActive && turnScore > 0 && (
                        <p key={turnScore} className="text-3xl sm:text-4xl font-mono font-bold text-green-400 animate-score-pop">
                            +{turnScore}
                        </p>
                    )}
                </div>
            </div>
            <div className="w-full h-4 bg-gray-900/50 rounded-full overflow-hidden relative mb-2">
                 <div 
                    className="absolute h-full bg-teal-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, scorePercentage)}%` }}
                />
                <div 
                    className="absolute h-full bg-teal-400/50 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                        left: `${Math.min(100, scorePercentage)}%`,
                        width: `${Math.min(100 - scorePercentage, turnScorePercentage)}%`
                    }}
                />
            </div>

            {isActive && pointsToTarget > 0 && (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamPlayers.map(player => (
                    <TeamPlayerCard 
                        key={player.id}
                        player={player}
                        score={teamScores[player.id] || 0}
                        isActive={player.id === activePlayerId}
                    />
                ))}
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
    const { gameInfo, scores, turnScore, activePlayersWithStats, gameHistory, players, handleAddToTurn, handleEndTurn, handleUndoLastTurn } = props;
    const { t } = useTranslation();

    const currentPlayer = activePlayersWithStats[gameInfo.currentPlayerIndex];
    const team1Players = activePlayersWithStats.filter((_, i) => i % 2 === 0);
    const team2Players = activePlayersWithStats.filter((_, i) => i % 2 !== 0);
    const isTeam1Active = gameInfo.currentPlayerIndex % 2 === 0;

    const activeTeamIds = gameInfo.playerIds.filter((_, i) => i % 2 === (isTeam1Active ? 0 : 1));
    const activeTeamScore = activeTeamIds.reduce((sum, id) => sum + (scores[id] || 0), 0);
    const pointsToTargetForTeam = gameInfo.targetScore - (activeTeamScore + turnScore);

    return (
        <>
            <TeamScoreCard
                teamName={t('gameSetup.team1')}
                teamPlayers={team1Players}
                teamScores={scores}
                targetScore={gameInfo.targetScore}
                isActive={isTeam1Active}
                activePlayerId={currentPlayer?.id}
                turnScore={isTeam1Active ? turnScore : 0}
                pointsToTarget={isTeam1Active ? pointsToTargetForTeam : 0}
                gameHistory={gameHistory}
                gameInfo={gameInfo}
                players={players}
            />
            <TeamScoreCard
                teamName={t('gameSetup.team2')}
                teamPlayers={team2Players}
                teamScores={scores}
                targetScore={gameInfo.targetScore}
                isActive={!isTeam1Active}
                activePlayerId={currentPlayer?.id}
                turnScore={!isTeam1Active ? turnScore : 0}
                pointsToTarget={!isTeam1Active ? pointsToTargetForTeam : 0}
                gameHistory={gameHistory}
                gameInfo={gameInfo}
                players={players}
            />
            <ScoreInputPad
                onScore={handleAddToTurn}
                onEndTurn={handleEndTurn}
                onUndoTurn={handleUndoLastTurn}
                isUndoTurnDisabled={gameHistory.length <= 1}
                pointsToTarget={pointsToTargetForTeam}
                allowOvershooting={gameInfo.allowOvershooting ?? false}
                gameType={gameInfo.type}
            />
        </>
    );
};

export default TeamScoreboard;