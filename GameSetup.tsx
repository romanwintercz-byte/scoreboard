import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, GameRecord, GameMode } from './types';
import { GAME_TYPE_DEFAULTS_SETUP } from './constants';
import Avatar from './Avatar';
import HandicapModal from './HandicapModal';
import { triggerHapticFeedback } from './utils';

// --- ICONS ---
const FourBallIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="currentColor" d="M12 5.5A1.5 1.5 0 0 1 13.5 7A1.5 1.5 0 0 1 12 8.5A1.5 1.5 0 0 1 10.5 7A1.5 1.5 0 0 1 12 5.5m5.5 5.5A1.5 1.5 0 0 1 19 12A1.5 1.5 0 0 1 17.5 13.5A1.5 1.5 0 0 1 16 12A1.5 1.5 0 0 1 17.5 11m-11 0A1.5 1.5 0 0 1 8 12A1.5 1.5 0 0 1 6.5 13.5A1.5 1.5 0 0 1 5 12A1.5 1.5 0 0 1 6.5 11m5.5 5.5A1.5 1.5 0 0 1 13.5 18A1.5 1.5 0 0 1 12 19.5A1.5 1.5 0 0 1 10.5 18A1.5 1.5 0 0 1 12 16.5Z" /></svg>;
const FreeGameIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="currentColor" d="M9 14a2 2 0 1 1-4 0a2 2 0 0 1 4 0m5 3a2 2 0 1 1-4 0a2 2 0 0 1 4 0m5-6a2 2 0 1 1-4 0a2 2 0 0 1 4 0" /></svg>;
const OneCushionIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 12h16"/><path d="M6 10l-2 2l2 2"/><path d="M18 10l-2-2l-2 2"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="18" cy="14" r="1.5" fill="currentColor"/></svg>;
const ThreeCushionIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/><path d="M6 10l-2 2l2 2"/><path d="M18 4l2 2l-2 2"/><path d="M6 16l-2 2l2 2"/><path d="M16 12l2 2-2 2"/><circle cx="10" cy="9" r="1.5" fill="currentColor"/><circle cx="14" cy="15" r="1.5" fill="currentColor"/></svg>;

// --- HELPER COMPONENTS ---
const GameTypeCard: React.FC<{ icon: React.ReactNode; label: string; isSelected: boolean; onClick: () => void; }> = ({ icon, label, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`group w-full h-32 flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all duration-200 transform
                    ${isSelected 
                        ? 'bg-[--color-primary] text-white shadow-lg ring-2 ring-[--color-accent] scale-105'
                        : 'bg-[--color-surface-light] text-[--color-text-secondary] hover:bg-[--color-bg] hover:scale-105 hover:shadow-md'
                    }`}
    >
        <div className={`w-12 h-12 transition-colors ${isSelected ? 'text-white' : 'text-[--color-accent]'}`}>
            {icon}
        </div>
        <span className="font-bold text-center">{label}</span>
    </button>
);

const ResultDots: React.FC<{ results: GameRecord['result'][]; dotClassName?: string }> = ({ results, dotClassName = "w-3 h-3" }) => {
    const { t } = useTranslation();
    const resultMapping: { [key in GameRecord['result'] | 'pending']: { title: string, color: string } } = {
        win: { title: t('stats.wins') as string, color: 'bg-[--color-green]' },
        loss: { title: t('stats.losses') as string, color: 'bg-[--color-red]' },
        draw: { title: t('tournament.draws') as string, color: 'bg-[--color-yellow]' },
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

const PlayerListItemWithStats: React.FC<{
    player: Player;
    average: number;
    lastSixResults: GameRecord['result'][];
    onClick: () => void;
}> = ({ player, average, lastSixResults, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-[--color-surface-light] hover:bg-[--color-primary]">
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0" />
        <div className="flex-grow min-w-0">
            <span className="font-semibold truncate">{player.name}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 ml-2">
            <span className="text-sm font-mono text-[--color-text-secondary] w-12 text-right">{average.toFixed(2)}</span>
            <ResultDots results={lastSixResults} />
        </div>
    </button>
);

const EmptySlot: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full flex items-center justify-center p-2 rounded-lg border-2 border-dashed border-[--color-border]">
        <span className="text-[--color-text-secondary] text-sm font-semibold">{text}</span>
    </div>
);

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

// --- MAIN COMPONENT ---
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
    allowOvershooting: boolean,
    handicap?: { playerId: string, points: number }
  ) => void;
}> = ({ allPlayers, lastPlayedPlayerIds, gameLog, onGameStart }) => {
  const { t } = useTranslation();
  
  const [selectedGameTypeKey, setSelectedGameTypeKey] = useState<string>('gameSetup.fourBall');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('round-robin');
  const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP['gameSetup.fourBall']);
  const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('sudden-death');
  const [allowOvershooting, setAllowOvershooting] = useState<boolean>(false);
  const [handicapOffer, setHandicapOffer] = useState<{ player: Player, value: number } | null>(null);

  const selectedBallType = selectedGameTypeKey === 'gameSetup.fourBall' ? 'fourBall' : 'threeBall';

  useEffect(() => {
    if (typeof GAME_TYPE_DEFAULTS_SETUP[selectedGameTypeKey] !== 'undefined') {
      setTargetScore(GAME_TYPE_DEFAULTS_SETUP[selectedGameTypeKey]);
    }
  }, [selectedGameTypeKey]);

  const handleBallTypeChange = (type: 'threeBall' | 'fourBall') => {
      if (type === 'fourBall' && selectedGameTypeKey !== 'gameSetup.fourBall') {
          setSelectedGameTypeKey('gameSetup.fourBall');
      } else if (type === 'threeBall' && selectedGameTypeKey === 'gameSetup.fourBall') {
          setSelectedGameTypeKey('gameSetup.freeGame');
      }
  };

  const availablePlayers = useMemo(() => {
    const recent = new Set(lastPlayedPlayerIds);
    const selected = new Set(selectedPlayerIds);
    const available = allPlayers.filter(p => !selected.has(p.id));

    const sorted = available.sort((a, b) => {
      const aIsRecent = recent.has(a.id);
      const bIsRecent = recent.has(b.id);
      if (aIsRecent && !bIsRecent) return -1;
      if (!aIsRecent && bIsRecent) return 1;
      if (aIsRecent && bIsRecent) {
        return lastPlayedPlayerIds.indexOf(a.id) - lastPlayedPlayerIds.indexOf(b.id);
      }
      return a.name.localeCompare(b.name);
    });
    
    return sorted.map(p => {
        const average = getPlayerAverage(p.id, selectedGameTypeKey, gameLog);
        const lastSixResults = gameLog
            .filter(g => g.playerId === p.id && g.gameType === selectedGameTypeKey)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6)
            .map(g => g.result)
            .reverse();
        return { ...p, average, lastSixResults };
    });

  }, [allPlayers, selectedPlayerIds, lastPlayedPlayerIds, selectedGameTypeKey, gameLog]);

  const getPlayersWithStats = useCallback((ids: string[]) => {
      return ids.map(id => allPlayers.find(p => p.id === id))
          .filter((p): p is Player => !!p)
          .map(p => {
              const average = getPlayerAverage(p.id, selectedGameTypeKey, gameLog);
              const lastSixResults = gameLog
                  .filter(g => g.playerId === p.id && g.gameType === selectedGameTypeKey)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 6).map(g => g.result).reverse();
              return { ...p, average, lastSixResults };
          });
  }, [allPlayers, selectedGameTypeKey, gameLog]);

  const selectedPlayersWithStats = useMemo(() => getPlayersWithStats(selectedPlayerIds), [selectedPlayerIds, getPlayersWithStats]);
  
  const { team1Players, team2Players } = useMemo(() => {
    const team1Ids = selectedPlayerIds.filter((_, index) => index % 2 === 0);
    const team2Ids = selectedPlayerIds.filter((_, index) => index % 2 !== 0);

    return {
        team1Players: getPlayersWithStats(team1Ids),
        team2Players: getPlayersWithStats(team2Ids)
    };
  }, [selectedPlayerIds, getPlayersWithStats]);

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
    triggerHapticFeedback(100);
    if (selectedPlayerIds.length === 2 && gameMode === 'round-robin') {
        const [player1, player2] = selectedPlayersWithStats;
        const avg1 = player1.average;
        const avg2 = player2.average;

        if (avg1 > 0 && avg2 > 0 && avg1 !== avg2) {
            const strongerPlayerAvg = Math.max(avg1, avg2);
            const weakerPlayerAvg = Math.min(avg1, avg2);
            const weakerPlayer = avg1 < avg2 ? player1 : player2;

            const turnsForStronger = targetScore / strongerPlayerAvg;
            const weakerPlayerProjectedScore = turnsForStronger * weakerPlayerAvg;
            const handicapValue = Math.round(targetScore - weakerPlayerProjectedScore);

            if (handicapValue > 0) {
                setHandicapOffer({ player: weakerPlayer, value: handicapValue });
                return;
            }
        }
    }
    onGameStart(selectedPlayerIds, selectedGameTypeKey, gameMode, targetScore, endCondition, allowOvershooting);
  };

  const handleHandicapResponse = (accept: boolean) => {
    const handicap = accept && handicapOffer ? { playerId: handicapOffer.player.id, points: handicapOffer.value } : undefined;
    onGameStart(selectedPlayerIds, selectedGameTypeKey, gameMode, targetScore, endCondition, allowOvershooting, handicap);
    setHandicapOffer(null);
  }

  const isStartDisabled = (gameMode === 'team' ? selectedPlayerIds.length !== 4 : selectedPlayerIds.length === 0);
  
  const buttonClasses = (isActive: boolean) => 
    `w-full text-center p-3 rounded-lg text-md font-semibold transition-all duration-200 border-2 ${
        isActive 
        ? 'bg-[--color-primary] border-[--color-accent] text-white shadow-lg' 
        : 'bg-[--color-surface-light] border-[--color-border] hover:bg-[--color-bg] hover:border-[--color-border-hover]'
    }`;
    
  const segmentedControlClasses = (isActive: boolean) => 
    `w-full rounded-md py-2 font-semibold transition-colors duration-300 ${
        isActive ? 'bg-[--color-primary] text-white' : 'text-[--color-text-secondary]'
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
      <div className="w-full max-w-4xl bg-[--color-surface] rounded-2xl shadow-2xl p-8 transform transition-all duration-300">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-[--color-text-primary]">{t('gameSetup.title')}</h1>
        
        <div className="mb-8">
            <h2 className="text-xl font-bold text-[--color-accent] mb-4 text-center">{t('gameSetup.selectType')}</h2>
            
            <div className="flex w-full max-w-sm mx-auto bg-[--color-surface-light] rounded-lg p-1 mb-6">
                <button onClick={() => handleBallTypeChange('threeBall')} className={segmentedControlClasses(selectedBallType === 'threeBall')}>
                    {t('gameSetup.threeBall')}
                </button>
                <button onClick={() => handleBallTypeChange('fourBall')} className={segmentedControlClasses(selectedBallType === 'fourBall')}>
                    {t('gameSetup.fourBall')}
                </button>
            </div>
            
            <div className="animate-fade-in">
                {selectedBallType === 'fourBall' ? (
                    <div className="flex justify-center max-w-xs mx-auto">
                        <GameTypeCard 
                            icon={<FourBallIcon />}
                            label={t('gameSetup.fourBall')}
                            isSelected={selectedGameTypeKey === 'gameSetup.fourBall'}
                            onClick={() => setSelectedGameTypeKey('gameSetup.fourBall')}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <GameTypeCard 
                            icon={<FreeGameIcon />}
                            label={t('gameSetup.freeGame')}
                            isSelected={selectedGameTypeKey === 'gameSetup.freeGame'}
                            onClick={() => setSelectedGameTypeKey('gameSetup.freeGame')}
                        />
                        <GameTypeCard 
                            icon={<OneCushionIcon />}
                            label={t('gameSetup.oneCushion')}
                            isSelected={selectedGameTypeKey === 'gameSetup.oneCushion'}
                            onClick={() => setSelectedGameTypeKey('gameSetup.oneCushion')}
                        />
                        <GameTypeCard 
                            icon={<ThreeCushionIcon />}
                            label={t('gameSetup.threeCushion')}
                            isSelected={selectedGameTypeKey === 'gameSetup.threeCushion'}
                            onClick={() => setSelectedGameTypeKey('gameSetup.threeCushion')}
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
              <h3 className="font-bold text-lg mb-3 text-[--color-text-secondary]">{t('gameSetup.availablePlayers')}</h3>
              <div className="bg-black/20 p-3 rounded-lg h-64 overflow-y-auto flex flex-col gap-2">
                  {availablePlayers.length > 0 ? availablePlayers.map(p => 
                      <PlayerListItemWithStats 
                        key={p.id}
                        player={p}
                        average={p.average}
                        lastSixResults={p.lastSixResults}
                        onClick={() => handlePlayerToggle(p.id)} 
                      />
                  ) : <p className="text-center text-[--color-text-secondary] mt-4">{t('noAvailablePlayers')}</p>}
              </div>
          </div>
          <div>
              <h3 className="font-bold text-lg mb-3 text-[--color-text-secondary]">{t('gameSetup.playersInGame')} <span className="text-[--color-text-secondary] font-normal">({selectedPlayersWithStats.length}/4)</span></h3>
              {gameMode === 'team' ? (
                  <div className="grid grid-cols-2 gap-4 h-64">
                      <div>
                          <h4 className="font-semibold text-sm text-center text-[--color-text-secondary] mb-2">{t('gameSetup.team1')}</h4>
                          <div className="bg-black/20 p-2 rounded-lg h-[calc(100%-1.75rem)] flex flex-col gap-2">
                              {team1Players[0] ? <PlayerListItemWithStats player={team1Players[0]} average={team1Players[0].average} lastSixResults={team1Players[0].lastSixResults} onClick={() => handlePlayerToggle(team1Players[0].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                              {team1Players[1] ? <PlayerListItemWithStats player={team1Players[1]} average={team1Players[1].average} lastSixResults={team1Players[1].lastSixResults} onClick={() => handlePlayerToggle(team1Players[1].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                          </div>
                      </div>
                      <div>
                          <h4 className="font-semibold text-sm text-center text-[--color-text-secondary] mb-2">{t('gameSetup.team2')}</h4>
                          <div className="bg-black/20 p-2 rounded-lg h-[calc(100%-1.75rem)] flex flex-col gap-2">
                              {team2Players[0] ? <PlayerListItemWithStats player={team2Players[0]} average={team2Players[0].average} lastSixResults={team2Players[0].lastSixResults} onClick={() => handlePlayerToggle(team2Players[0].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                              {team2Players[1] ? <PlayerListItemWithStats player={team2Players[1]} average={team2Players[1].average} lastSixResults={team2Players[1].lastSixResults} onClick={() => handlePlayerToggle(team2Players[1].id)} /> : <EmptySlot text={t('gameSetup.addPlayerToTeam')} />}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-black/20 p-3 rounded-lg h-64 flex flex-col gap-2 overflow-y-auto">
                      {selectedPlayersWithStats.length > 0 ? selectedPlayersWithStats.map(p => 
                          <PlayerListItemWithStats key={p.id} player={p} average={p.average} lastSixResults={p.lastSixResults} onClick={() => handlePlayerToggle(p.id)} />
                      ) : <p className="text-center text-[--color-text-secondary] mt-4">{t('gameSetup.selectUpTo4')}</p>}
                  </div>
              )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 mb-8 items-start">
          <div>
              <h3 className="text-xl font-bold text-[--color-accent] mb-4 text-center">{t('gameSetup.gameMode')}</h3>
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
              <h3 className="text-xl font-bold text-[--color-accent] mb-4 text-center">{t('gameSetup.targetScore')}</h3>
              <input 
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full bg-[--color-surface-light] text-[--color-text-primary] text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--color-accent]"
              />
          </div>
          <div>
              <h3 className="text-xl font-bold text-[--color-accent] mb-4 text-center">{t('gameSetup.endCondition')}</h3>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setEndCondition('sudden-death')} className={buttonClasses(endCondition === 'sudden-death')}>
                      {t('gameSetup.suddenDeath')}
                  </button>
                  <button onClick={() => setEndCondition('equal-innings')} className={buttonClasses(endCondition === 'equal-innings')}>
                      {t('gameSetup.equalInnings')}
                  </button>
              </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[--color-accent] mb-4 text-center">{t('gameSetup.allowOvershooting')}</h3>
             <button onClick={() => setAllowOvershooting(s => !s)} className={buttonClasses(allowOvershooting)}>
                {allowOvershooting ? t('common.yes') : t('common.no')}
             </button>
          </div>
        </div>

        <button 
          onClick={handleStart} 
          disabled={isStartDisabled}
          className="w-full bg-[--color-green] text-white font-bold py-4 rounded-lg text-xl shadow-md transition-all duration-200 enabled:hover:bg-[--color-green-hover] enabled:hover:scale-105 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {t('gameSetup.startGame')}
        </button>
        
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
      </div>
    </>
  );
};

export default GameSetup;
