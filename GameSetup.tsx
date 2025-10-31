import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type Player, type GameMode, type GameRecord } from './types';
import Avatar from './Avatar';
import HandicapModal from './HandicapModal';

const PlayerListItem: React.FC<{ player: Player, onClick: () => void }> = ({ player, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-gray-700 hover:bg-indigo-600">
    <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
    <span className="font-semibold truncate">{player.name}</span>
  </button>
);

const EmptySlot: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full flex items-center justify-center p-2 rounded-lg border-2 border-dashed border-gray-600 h-[52px]">
        <span className="text-gray-500 text-sm font-semibold">{text}</span>
    </div>
);


const GAME_TYPE_DEFAULTS: { [key: string]: number } = {
  'gameSetup.fourBall': 200,
  'gameSetup.freeGame': 50,
  'gameSetup.oneCushion': 30,
  'gameSetup.threeCushion': 15,
};

// Helper function to calculate player average for a specific game type
const getPlayerAverage = (playerId: string, gameTypeKey: string, gameLog: GameRecord[]): number => {
    const playerGames = gameLog
        .filter(g => g.playerId === playerId && g.gameType === gameTypeKey)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (playerGames.length === 0) return 0;

    const sourceGames = playerGames.length >= 10 ? playerGames.slice(0, 10) : playerGames;
    
    const totalScore = sourceGames.reduce((sum, game) => sum + game.score, 0);
    const totalTurns = sourceGames.reduce((sum, game) => sum + game.turns, 0);

    return totalTurns > 0 ? totalScore / totalTurns : 0;
};


const GameSetup: React.FC<{
  allPlayers: Player[];
  lastPlayedPlayerIds: string[];
  gameLog: GameRecord[];
  onGameStart: (
    playerIds: string[], 
    gameTypeKey: string, 
    gameMode: GameMode, 
    targetScore: number, 
    endCondition: 'sudden-death' | 'equal-innings',
    handicap?: { playerId: string, points: number }
  ) => void;
}> = ({ allPlayers, lastPlayedPlayerIds, gameLog, onGameStart }) => {
  const { t } = useTranslation();
  
  const [selectedBallType, setSelectedBallType] = useState<'threeBall' | 'fourBall' | null>('fourBall');
  const [threeBallSubType, setThreeBallSubType] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('round-robin');
  const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS['gameSetup.fourBall']);
  const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('sudden-death');
  const [handicapOffer, setHandicapOffer] = useState<{ player: Player, value: number } | null>(null);

  const finalGameTypeKey = useMemo(() => {
    if (selectedBallType === 'fourBall') return 'gameSetup.fourBall';
    if (selectedBallType === 'threeBall' && threeBallSubType) return threeBallSubType;
    return null;
  }, [selectedBallType, threeBallSubType]);
  
  useEffect(() => {
    if (finalGameTypeKey && typeof GAME_TYPE_DEFAULTS[finalGameTypeKey] !== 'undefined') {
      setTargetScore(GAME_TYPE_DEFAULTS[finalGameTypeKey]);
    }
  }, [finalGameTypeKey]);

  const availablePlayers = useMemo(() => {
    const recent = new Set(lastPlayedPlayerIds);
    const selected = new Set(selectedPlayerIds);
    const available = allPlayers.filter(p => !selected.has(p.id));

    return available.sort((a, b) => {
      const aIsRecent = recent.has(a.id);
      const bIsRecent = recent.has(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (aIsRecent && bIsRecent) {
        return lastPlayedPlayerIds.indexOf(a.id) - lastPlayedPlayerIds.indexOf(b.id);
      }
      return a.name.localeCompare(b.name);
    });
  }, [allPlayers, selectedPlayerIds, lastPlayedPlayerIds]);

  const selectedPlayers = useMemo(() => 
    selectedPlayerIds.map(id => allPlayers.find(p => p.id === id)).filter((p): p is Player => !!p),
    [selectedPlayerIds, allPlayers]
  );
  
  const team1Players = useMemo(() =>
      selectedPlayerIds
          .filter((_, index) => index % 2 === 0)
          .map(id => allPlayers.find(p => p.id === id))
          .filter((p): p is Player => !!p),
      [selectedPlayerIds, allPlayers]
  );

  const team2Players = useMemo(() =>
      selectedPlayerIds
          .filter((_, index) => index % 2 !== 0)
          .map(id => allPlayers.find(p => p.id === id))
          .filter((p): p is Player => !!p),
      [selectedPlayerIds, allPlayers]
  );

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      if (prev.length < 4) {
        return [...prev, playerId];
      }
      return prev;
    });
  };
  
  const handleStart = () => {
    if (!finalGameTypeKey) return;
    
    // Handicap logic applies only for 2-player, non-team games
    if (selectedPlayerIds.length === 2 && gameMode === 'round-robin') {
        const [player1, player2] = selectedPlayers;
        const avg1 = getPlayerAverage(player1.id, finalGameTypeKey, gameLog);
        const avg2 = getPlayerAverage(player2.id, finalGameTypeKey, gameLog);

        if (avg1 > 0 && avg2 > 0 && avg1 !== avg2) {
            const strongerPlayerAvg = Math.max(avg1, avg2);
            const weakerPlayerAvg = Math.min(avg1, avg2);
            const weakerPlayer = avg1 < avg2 ? player1 : player2;

            const turnsForStronger = targetScore / strongerPlayerAvg;
            const weakerPlayerProjectedScore = turnsForStronger * weakerPlayerAvg;
            const handicapValue = Math.round(targetScore - weakerPlayerProjectedScore);

            if (handicapValue > 0) {
                setHandicapOffer({ player: weakerPlayer, value: handicapValue });
                return; // Show modal instead of starting game
            }
        }
    }
    // If no handicap, start game immediately
    onGameStart(selectedPlayerIds, finalGameTypeKey, gameMode, targetScore, endCondition);
  };

  const handleHandicapResponse = (accept: boolean) => {
    if (!finalGameTypeKey) return;
    const handicap = accept && handicapOffer ? { playerId: handicapOffer.player.id, points: handicapOffer.value } : undefined;
    onGameStart(selectedPlayerIds, finalGameTypeKey, gameMode, targetScore, endCondition, handicap);
    setHandicapOffer(null);
  }

  const isStartDisabled = !finalGameTypeKey || (gameMode === 'team' ? selectedPlayerIds.length !== 4 : selectedPlayerIds.length === 0);
  
  const buttonClasses = (isActive: boolean) => 
    `w-full text-center p-3 rounded-lg text-md font-semibold transition-all duration-200 border-2 ${
        isActive 
        ? 'bg-teal-500 border-teal-400 text-white shadow-lg' 
        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
    }`;

  return (
    <>
      {handicapOffer && (
        <HandicapModal
          player={handicapOffer.player}
          handicapValue={handicapOffer.value}
          onAccept={() => handleHandicapResponse(true)}
          onDecline={() => handleHandicapResponse(false)}
          onClose={() => setHandicapOffer(null)}
        />
      )}
      <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-white">{t('gameSetup.title')}</h1>
        
        {/* Game Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-teal-300 mb-4 text-center">{t('gameSetup.selectType')}</h2>
          <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setSelectedBallType('threeBall'); setThreeBallSubType(null); }} className={buttonClasses(selectedBallType === 'threeBall')}>{t('gameSetup.threeBall')}</button>
              <button onClick={() => { setSelectedBallType('fourBall'); setThreeBallSubType(null); }} className={buttonClasses(selectedBallType === 'fourBall')}>{t('gameSetup.fourBall')}</button>
          </div>
          {selectedBallType === 'threeBall' && (
              <div className="grid grid-cols-3 gap-3 mt-4 animate-fade-in">
                  <button onClick={() => setThreeBallSubType('gameSetup.freeGame')} className={buttonClasses(threeBallSubType === 'gameSetup.freeGame')}>{t('gameSetup.freeGame')}</button>
                  <button onClick={() => setThreeBallSubType('gameSetup.oneCushion')} className={buttonClasses(threeBallSubType === 'gameSetup.oneCushion')}>{t('gameSetup.oneCushion')}</button>
                  <button onClick={() => setThreeBallSubType('gameSetup.threeCushion')} className={buttonClasses(threeBallSubType === 'gameSetup.threeCushion')}>{t('gameSetup.threeCushion')}</button>
              </div>
          )}
        </div>

        {/* Player Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
              <h3 className="font-bold text-lg mb-3 text-gray-300">{t('gameSetup.availablePlayers')}</h3>
              <div className="bg-gray-900/50 p-3 rounded-lg h-64 overflow-y-auto flex flex-col gap-2">
                  {availablePlayers.length > 0 ? availablePlayers.map(p => 
                      <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />
                  ) : <p className="text-center text-gray-500 mt-4">{t('noAvailablePlayers')}</p>}
              </div>
          </div>
          <div>
              <h3 className="font-bold text-lg mb-3 text-gray-300">{t('gameSetup.playersInGame')} <span className="text-gray-500 font-normal">({selectedPlayers.length}/4)</span></h3>
              {gameMode === 'team' ? (
                  <div className="grid grid-cols-2 gap-4 h-64">
                      <div>
                          <h4 className="font-semibold text-sm text-center text-gray-400 mb-2">{t('gameSetup.team1')}</h4>
                          <div className="bg-gray-900/50 p-2 rounded-lg h-[calc(100%-1.75rem)] flex flex-col gap-2">
                              {team1Players[0] ? <PlayerListItem player={team1Players[0]} onClick={() => handlePlayerToggle(team1Players[0].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                              {team1Players[1] ? <PlayerListItem player={team1Players[1]} onClick={() => handlePlayerToggle(team1Players[1].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                          </div>
                      </div>
                      <div>
                          <h4 className="font-semibold text-sm text-center text-gray-400 mb-2">{t('gameSetup.team2')}</h4>
                          <div className="bg-gray-900/50 p-2 rounded-lg h-[calc(100%-1.75rem)] flex flex-col gap-2">
                              {team2Players[0] ? <PlayerListItem player={team2Players[0]} onClick={() => handlePlayerToggle(team2Players[0].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                              {team2Players[1] ? <PlayerListItem player={team2Players[1]} onClick={() => handlePlayerToggle(team2Players[1].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-gray-900/50 p-3 rounded-lg h-64 flex flex-col gap-2 overflow-y-auto">
                      {selectedPlayers.length > 0 ? selectedPlayers.map(p => 
                          <PlayerListItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />
                      ) : <p className="text-center text-gray-500 mt-4">{t('gameSetup.selectUpTo4')}</p>}
                  </div>
              )}
          </div>
        </div>
        
        {/* Game Settings */}
        <div className="grid md:grid-cols-3 gap-8 mb-8 items-start">
          <div>
              <h3 className="text-xl font-bold text-teal-300 mb-4 text-center">{t('gameSetup.gameMode')}</h3>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setGameMode('round-robin')} className={buttonClasses(gameMode === 'round-robin')}>
                      {t('gameSetup.roundRobin')}
                  </button>
                  <button onClick={() => setGameMode('team')} className={buttonClasses(gameMode === 'team')}>
                      {t('gameSetup.teamPlay')}
                  </button>
              </div>
          </div>
          <div>
              <h3 className="text-xl font-bold text-teal-300 mb-4 text-center">{t('gameSetup.targetScore')}</h3>
              <input 
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
          </div>
          <div>
              <h3 className="text-xl font-bold text-teal-300 mb-4 text-center">{t('gameSetup.endCondition')}</h3>
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

        <button 
          onClick={handleStart} 
          disabled={isStartDisabled}
          className="w-full bg-green-500 text-white font-bold py-4 rounded-lg text-xl shadow-md transition-all duration-200 enabled:hover:bg-green-600 enabled:hover:scale-105 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {t('gameSetup.startGame')}
        </button>
        
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </>
  );
};

export default GameSetup;