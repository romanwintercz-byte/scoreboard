import React, { useState, useMemo, useCallback, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// --- TYPES (from types.ts) ---
export type Player = {
  id: string;
  name: string;
  avatar: string;
};

export type View = 'scoreboard' | 'playerManager' | 'stats' | 'tournament';

export type GameMode = 'round-robin' | 'team';

export type ModalState = 
  | { view: 'closed' } 
  | { view: 'playerEditor'; player?: Player } 
  | { view: 'playerStats'; player: Player }
  | { view: 'camera'; context: { originalPlayer?: Player, name: string, avatar: string }}
  | { view: 'firstTimeUser' };
  
export type GameInfo = {
  type: string; // This should be an i18next key, e.g., 'gameSetup.freeGame'
  mode: GameMode;
  playerIds: string[];
  targetScore: number;
  currentPlayerIndex: number;
  endCondition: 'sudden-death' | 'equal-innings';
  handicap?: { playerId: string, points: number };
  tournamentContext?: { tournamentId: string; matchId: string };
  turnStats?: {
    [playerId: string]: {
      clean10s: number;
      clean20s: number;
      zeroInnings: number;
    }
  };
  playoutInfo?: {
    startingPlayerIndex: number;
  };
  finishedPlayerIds?: string[];
};


// --- STATS TYPES ---
export type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalTurns: number;
  totalScore: number;
  zeroInnings: number;
};

export type GameStats = {
  [playerId: string]: PlayerStats;
};

export type AllStats = {
  [gameType: string]: GameStats;
};

export type GameRecord = {
  gameId: string;
  playerId: string;
  gameType: string; // This should be an i18next key, e.g., 'gameSetup.freeGame'
  score: number;
  turns: number;
  date: string; // ISO string for timestamp
  result: 'win' | 'loss' | 'draw';
  handicapApplied?: number;
  zeroInnings: number;
  clean10s: number;
  clean20s: number;
};

export type GameSummary = {
  gameInfo: GameInfo;
  finalScores: { [playerId: string]: number };
  winnerIds: string[];
  turnsPerPlayer: { [playerId: string]: number };
  gameHistory: Array<{ scores: { [playerId: string]: number }; currentPlayerIndex: number }>;
};

// --- TOURNAMENT TYPES ---
export type Match = {
  id: string;
  player1Id: string;
  player2Id: string;
  status: 'pending' | 'completed';
  result?: {
    player1Score: number;
    player2Score: number;
    winnerId: string | null; // null for a draw
  };
};

export type TournamentSettings = {
  gameTypeKey: string;
  targetScore: number;
  endCondition: 'sudden-death' | 'equal-innings';
};

export type Tournament = {
  id: string;
  name: string;
  playerIds: string[];
  settings: TournamentSettings;
  matches: Match[];
  status: 'ongoing' | 'completed';
  createdAt: string; // ISO string
};


// --- AVATAR COMPONENT (from Avatar.tsx) ---
const FALLBACK_AVATAR_PATH = 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';

const Avatar: React.FC<{ avatar: string; className?: string }> = ({ avatar, className = "w-16 h-16" }) => {
    const finalAvatarPath = avatar || FALLBACK_AVATAR_PATH;
    
    if (typeof finalAvatarPath === 'string' && finalAvatarPath.startsWith('data:image')) {
        return <img src={finalAvatarPath} alt="Avatar" className={`rounded-full object-cover ${className}`} />;
    }
    
    return (
        <div className={`rounded-full bg-indigo-500 flex items-center justify-center ${className}`}>
            <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d={finalAvatarPath}></path>
            </svg>
        </div>
    );
};


// --- HEADERNAV COMPONENT (from HeaderNav.tsx) ---
const HeaderNav: React.FC<{
    currentView: View;
    onNavigate: (view: View) => void;
}> = ({ currentView, onNavigate }) => {
    const { t, i18n } = useTranslation();
    const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
    
    const navLinkClasses = (view: View) => 
      `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        currentView === view 
        ? 'bg-teal-500 text-white' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`;

    return (
        <header className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-50 p-4 flex justify-between items-center z-10">
            <nav className="flex items-center gap-4 bg-gray-900 rounded-lg p-1">
                <button onClick={() => onNavigate('scoreboard')} className={navLinkClasses('scoreboard')}>
                    {t('nav.game')}
                </button>
                 <button onClick={() => onNavigate('tournament')} className={navLinkClasses('tournament')}>
                    {t('nav.tournaments')}
                </button>
                <button onClick={() => onNavigate('playerManager')} className={navLinkClasses('playerManager')}>
                    {t('nav.players')}
                </button>
                <button onClick={() => onNavigate('stats')} className={navLinkClasses('stats')}>
                    {t('nav.stats')}
                </button>
            </nav>
            <div className="bg-gray-900 rounded-lg p-1">
              <button onClick={() => changeLanguage('cs')} className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('cs') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}>CS</button>
              <span className="text-gray-600">|</span>
              <button onClick={() => changeLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-md ${i18n.language.startsWith('en') ? 'text-teal-300' : 'text-gray-400 hover:text-white'}`}>EN</button>
            </div>
        </header>
    );
}

// --- PLAYER EDITOR MODAL (from PlayerEditorModal.tsx) ---
const PREDEFINED_AVATARS_EDITOR = [
  'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', // Person
  'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z', // Pet
  'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', // Cloud
  'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', // House
  'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z', // Mail
  'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', // Search
];

const PlayerEditorModal: React.FC<{
    playerToEdit?: Player;
    onSave: (playerData: { name: string; avatar: string }) => void;
    onClose: () => void;
    onOpenCamera: (currentState: { name: string; avatar: string }) => void;
}> = ({ playerToEdit, onSave, onClose, onOpenCamera }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(playerToEdit?.name || '');
    const [avatar, setAvatar] = useState(playerToEdit?.avatar || PREDEFINED_AVATARS_EDITOR[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (name.trim()) {
            onSave({ name: name.trim(), avatar });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md text-center transform transition-transform duration-300" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-teal-400 mb-6">{playerToEdit && playerToEdit.id ? t('editPlayer') : t('addPlayerTitle')}</h2>
                <Avatar avatar={avatar} className="w-24 h-24 mx-auto mb-4" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('playerNamePlaceholder') as string}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-teal-400" />

                <div className="text-left mb-6">
                    <p className="text-gray-400 font-semibold mb-3">{t('chooseAvatar')}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="h-20 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📤</span>{t('uploadFile')}</button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => onOpenCamera({ name, avatar })} className="h-20 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center justify-center text-xs transition-colors"><span className="text-2xl mb-1">📸</span>{t('takePhoto')}</button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {PREDEFINED_AVATARS_EDITOR.map((svgPath, index) => (
                           <button key={index} onClick={() => setAvatar(svgPath)} className={`p-1 rounded-full transition-all ${avatar === svgPath ? 'ring-2 ring-teal-400' : ''}`}>
                               <Avatar avatar={svgPath} className="w-full h-full" />
                           </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

// --- CAMERA CAPTURE MODAL (from CameraCaptureModal.tsx) ---
const CameraCaptureModal: React.FC<{
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}> = ({ onCapture, onClose }) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const enableCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert(t('cameraError'));
                onClose();
            }
        };
        enableCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [t, onClose]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const { videoWidth, videoHeight } = videoRef.current;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-center" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <button onClick={handleCapture} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                    {t('capturePhoto')}
                </button>
            </div>
        </div>
    );
}

// --- PLAYER MANAGER and related components ---
const PlayerInfoCard: React.FC<{
    player: Player;
    onEdit: () => void;
    onDelete: () => void;
    onViewStats: () => void;
}> = ({ player, onEdit, onDelete, onViewStats }) => {
    const { t } = useTranslation();
    
    return (
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <button onClick={onViewStats} className="w-full flex flex-col items-center focus:outline-none">
                <Avatar avatar={player.avatar} className="w-20 h-20 mb-3" />
                <p className="text-white text-lg font-semibold truncate w-full">{player.name}</p>
            </button>
            <div className="flex gap-2 mt-3">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-teal-400 hover:text-teal-300 text-sm font-semibold z-10">{t('edit')}</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-400 text-sm font-semibold z-10">{t('delete')}</button>
            </div>
        </div>
    )
}

const PlayerManager: React.FC<{
    players: Player[];
    onAddPlayer: () => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (id: string) => void;
    onViewPlayerStats: (player: Player) => void;
}> = ({ players, onAddPlayer, onEditPlayer, onDeletePlayer, onViewPlayerStats }) => {
    const { t } = useTranslation();

    const handleDelete = (player: Player) => {
        if (window.confirm(t('confirmDelete', { name: player.name }) as string)) {
            onDeletePlayer(player.id);
        }
    }

    return (
        <div className="w-full max-w-5xl p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-white">{t('managePlayers')}</h1>
                <button onClick={onAddPlayer} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                    {t('addPlayer')}
                </button>
            </div>

            {players.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {players.map(player => (
                        <PlayerInfoCard 
                            key={player.id}
                            player={player}
                            onEdit={() => onEditPlayer(player)}
                            onDelete={() => handleDelete(player)}
                            onViewStats={() => onViewPlayerStats(player)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-16">{t('noPlayers')}</p>
            )}
        </div>
    );
}

// --- GAME SETUP and related components ---
const HandicapModal: React.FC<{
    player: Player;
    handicapValue: number;
    onAccept: () => void;
    onDecline: () => void;
    onClose: () => void;
}> = ({ player, handicapValue, onAccept, onDecline, onClose }) => {
    const { t } = useTranslation();

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-transform duration-300" 
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-3xl font-extrabold text-teal-400 mb-4">{t('handicap.offerTitle')}</h2>
                
                <Avatar avatar={player.avatar} className="w-24 h-24 mx-auto my-6" />

                <p 
                    className="text-gray-300 mb-4" 
                    dangerouslySetInnerHTML={{ 
                        __html: t('handicap.offerDescription', { playerName: player.name, points: handicapValue }) 
                    }} 
                />
                <p className="text-gray-500 text-sm mb-8">{t('handicap.offerExplanation')}</p>

                <div className="flex flex-col gap-4">
                     <button 
                        onClick={onAccept}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                    >
                        {t('handicap.accept')}
                    </button>
                     <button 
                        onClick={onDecline}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg text-lg transition-colors"
                    >
                        {t('handicap.decline')}
                    </button>
                </div>
            </div>
        </div>
    );
};

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

const GAME_TYPE_DEFAULTS_SETUP: { [key: string]: number } = {
  'gameSetup.fourBall': 200,
  'gameSetup.freeGame': 50,
  'gameSetup.oneCushion': 30,
  'gameSetup.threeCushion': 15,
};

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
  const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP['gameSetup.fourBall']);
  const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('sudden-death');
  const [handicapOffer, setHandicapOffer] = useState<{ player: Player, value: number } | null>(null);

  const finalGameTypeKey = useMemo(() => {
    if (selectedBallType === 'fourBall') return 'gameSetup.fourBall';
    if (selectedBallType === 'threeBall' && threeBallSubType) return threeBallSubType;
    return null;
  }, [selectedBallType, threeBallSubType]);
  
  useEffect(() => {
    if (finalGameTypeKey && typeof GAME_TYPE_DEFAULTS_SETUP[finalGameTypeKey] !== 'undefined') {
      setTargetScore(GAME_TYPE_DEFAULTS_SETUP[finalGameTypeKey]);
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
                return;
            }
        }
    }
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

// --- SCOREBOARD COMPONENTS ---
const PlayerScoreCard: React.FC<{
  player: Player;
  score: number;
  turns: number;
  turnScore: number;
  targetScore: number;
}> = ({ player, score, turns, turnScore, targetScore }) => {
  const { t } = useTranslation();

  const totalPotentialScore = score + turnScore;
  const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
  const turnScorePercentage = targetScore > 0 ? (turnScore / targetScore) * 100 : 0;
  const remainingScore = Math.max(0, targetScore - totalPotentialScore);
  const average = turns > 0 ? (score / turns).toFixed(2) : (0).toFixed(2);
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full transform transition-transform duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
          <Avatar avatar={player.avatar} className="w-16 h-16" />
          <div className="truncate">
            <h2 className="text-3xl font-bold text-teal-400 truncate">{player.name}</h2>
            <p className="text-sm text-gray-400 font-mono">{t('scoreboard.average')}: {average}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-3 text-right flex-shrink">
          <p className="text-7xl font-mono font-extrabold text-white">{score}</p>
          {turnScore > 0 && (
            <p key={turnScore} className="text-4xl font-mono font-bold text-green-400 animate-score-pop">
              +{turnScore}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-4 w-full">
        <div className="flex-grow h-4 bg-gray-600 rounded-full overflow-hidden relative">
          <div 
            className="absolute h-full bg-teal-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, scorePercentage)}%` }}
          />
          <div 
            className="absolute h-full bg-teal-600 opacity-75 rounded-full transition-all duration-300 ease-out"
            style={{ 
              left: `${Math.min(100, scorePercentage)}%`,
              width: `${Math.min(100 - scorePercentage, turnScorePercentage)}%`
            }}
          />
        </div>
        <div className="font-mono font-bold text-xl text-gray-400 text-right w-20">
          -{remainingScore}
        </div>
      </div>
    </div>
  );
};

const ScoreInputPad: React.FC<{
    onScore: (scoreData: { points: number, type: 'standard' | 'clean10' | 'clean20' | 'numpad' }) => void;
    onEndTurn: () => void;
    onUndoTurn: () => void;
    isUndoTurnDisabled: boolean;
}> = ({ onScore, onEndTurn, onUndoTurn, isUndoTurnDisabled }) => {
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
            onScore({ points, type: 'numpad' });
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
                <button onClick={() => onScore({ points: 1, type: 'standard' })} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-2xl row-span-2 flex items-center justify-center">+1</button>
                <button onClick={() => onScore({ points: 10, type: 'clean10' })} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 rounded-lg">{t('scorePad.clean10')}</button>
                <button onClick={() => onScore({ points: 20, type: 'clean20' })} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg">{t('scorePad.clean20')}</button>
                <button onClick={() => onScore({ points: -1, type: 'standard' })} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-lg">-1</button>
                <button onClick={() => onScore({ points: -10, type: 'standard' })} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 rounded-lg text-lg">-10</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={onUndoTurn} 
                    disabled={isUndoTurnDisabled}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg shadow-md transition-all duration-200 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ↶ {t('undoTurn')}
                </button>
                <button onClick={() => setShowNumpad(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-3 rounded-lg flex items-center justify-center text-3xl">
                    🧮
                </button>
            </div>
            <button onClick={onEndTurn} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-xl shadow-lg transition-transform transform hover:scale-105">
                {t('scorePad.endTurn')}
            </button>
        </div>
    );
};

const MinimizedPlayerCard: React.FC<{
  player: Player;
  score: number;
  turns: number;
  targetScore: number;
  isActive: boolean;
  isFinished?: boolean;
}> = ({ player, score, turns, targetScore, isActive, isFinished }) => {
  const { t } = useTranslation();
  const scorePercentage = targetScore > 0 ? (score / targetScore) * 100 : 0;
  const average = turns > 0 ? (score / turns).toFixed(2) : (0).toFixed(2);

  return (
    <div className={`w-full flex items-center p-2 rounded-lg transition-all duration-300 relative overflow-hidden ${isActive ? 'bg-gray-700' : 'bg-gray-800'} ${isFinished ? 'opacity-50' : ''}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-teal-400 transition-transform duration-300 ${isActive ? 'transform-none' : 'transform -translate-x-full'}`}></div>
        <Avatar avatar={player.avatar} className="w-10 h-10 flex-shrink-0 ml-2" />
        <div className="ml-3 flex-grow truncate">
            <p className="font-semibold text-white truncate">{player.name}</p>
            <p className="text-xs text-gray-400 font-mono">{t('scoreboard.average')}: {average}</p>
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

// --- STATS VIEW and related components ---
const StatsView: React.FC<{ stats: AllStats; players: Player[] }> = ({ stats, players }) => {
    const { t } = useTranslation();
    
    const gameTypes = useMemo(() => Object.keys(stats), [stats]);
    
    const [selectedGameType, setSelectedGameType] = useState<string | null>(gameTypes[0] || null);
    const [sortBy, setSortBy] = useState<'wins' | 'winRate' | 'avgScore'>('wins');

    const leaderboardData = useMemo(() => {
        if (!selectedGameType || !stats[selectedGameType]) {
            return [];
        }

        const gameStats = stats[selectedGameType];
        const playersMap = new Map(players.map(p => [p.id, p]));

        const processedData = Object.entries(gameStats)
            .map(([playerId, playerStats]) => {
                const playerInfo = playersMap.get(playerId);
                if (!playerInfo) return null;

                const winRate = playerStats.gamesPlayed > 0 ? (playerStats.wins / playerStats.gamesPlayed) * 100 : 0;
                const avgScore = playerStats.totalTurns > 0 ? playerStats.totalScore / playerStats.totalTurns : 0;

                return {
                    ...playerInfo,
                    ...playerStats,
                    winRate,
                    avgScore,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

        return processedData.sort((a, b) => {
            switch (sortBy) {
                case 'winRate':
                    return b.winRate - a.winRate;
                case 'avgScore':
                    return b.avgScore - a.avgScore;
                case 'wins':
                default:
                    return b.wins - a.wins;
            }
        });

    }, [selectedGameType, stats, players, sortBy]);

    const buttonClasses = (isActive: boolean) =>
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive
                ? 'bg-teal-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;
    
    return (
        <div className="w-full max-w-4xl p-4">
            <h1 className="text-4xl font-extrabold text-white mb-8 text-center">{t('stats.title')}</h1>

            <div className="mb-6">
                <div className="w-full overflow-x-auto pb-2 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        {gameTypes.length > 0 ? (
                            gameTypes.map(typeKey => (
                                <button key={typeKey} onClick={() => setSelectedGameType(typeKey)} className={buttonClasses(selectedGameType === typeKey)}>
                                    {t(typeKey as any)}
                                </button>
                            ))
                        ) : (
                             <p className="text-center text-gray-500">{t('stats.noStatsForGame')}</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedGameType && leaderboardData.length > 0 && (
                <div className="flex justify-center items-center gap-4 mb-4">
                    <span className="text-sm font-semibold text-gray-400">{t('stats.sortBy')}</span>
                    <div className="flex gap-2 rounded-lg bg-gray-900 p-1">
                        <button onClick={() => setSortBy('wins')} className={buttonClasses(sortBy === 'wins')}>{t('stats.wins')}</button>
                        <button onClick={() => setSortBy('winRate')} className={buttonClasses(sortBy === 'winRate')}>{t('stats.winRate')}</button>
                        <button onClick={() => setSortBy('avgScore')} className={buttonClasses(sortBy === 'avgScore')}>{t('stats.avgScore')}</button>
                    </div>
                </div>
            )}
            
            {selectedGameType ? (
                leaderboardData.length > 0 ? (
                    <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm">{t('stats.player')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.games')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.wins')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.losses')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.winRate')}</th>
                                    <th className="p-4 font-semibold text-teal-300 uppercase tracking-wider text-sm text-center">{t('stats.avgScore')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((player, index) => (
                                    <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <span className="font-bold text-gray-400 w-6 text-center">{index + 1}.</span>
                                            <Avatar avatar={player.avatar} className="w-10 h-10" />
                                            <span className="font-semibold text-white">{player.name}</span>
                                        </td>
                                        <td className="p-4 text-center font-mono">{player.gamesPlayed}</td>
                                        <td className="p-4 text-center font-mono font-bold text-green-400">{player.wins}</td>
                                        <td className="p-4 text-center font-mono font-bold text-red-400">{player.losses}</td>
                                        <td className="p-4 text-center font-mono">{player.winRate.toFixed(0)}%</td>
                                        <td className="p-4 text-center font-mono">{player.avgScore.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 mt-16">{t('stats.noStatsForGame')}</p>
                )
            ) : (
                <p className="text-center text-gray-500 mt-16">{t('stats.selectGameType')}</p>
            )}
        </div>
    );
};

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
                <text x={padding - 5} y={padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{maxAvg.toFixed(2)}</text>
                <text x={padding - 5} y={height - padding} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{minAvg > 0 ? minAvg.toFixed(2) : '0.00'}</text>
                
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-gray-700" strokeWidth="0.5" strokeDasharray="2" />
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-gray-700" strokeWidth="0.5" />
                
                <path d={pathData} fill="none" className="stroke-teal-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                
                {chartData.map((d, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(d.average)} r="2.5" className="fill-teal-300 stroke-gray-900" strokeWidth="1">
                        <title>{`Game ${d.game}: Avg ${d.average.toFixed(2)}`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
};

const H2HStats: React.FC<{
    currentPlayerId: string;
    activeGameType: string;
    gameLog: GameRecord[];
    players: Player[];
}> = ({ currentPlayerId, activeGameType, gameLog, players }) => {
    const { t } = useTranslation();
    const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

    const h2hData = useMemo(() => {
        const gamesByGameId = new Map<string, GameRecord[]>();
        gameLog.forEach(record => {
            if (!gamesByGameId.has(record.gameId)) {
                gamesByGameId.set(record.gameId, []);
            }
            gamesByGameId.get(record.gameId)!.push(record);
        });

        const opponentData: Record<string, { wins: number; losses: number; draws: number; }> = {};

        for (const gameRecords of gamesByGameId.values()) {
            if (
                gameRecords.length === 2 &&
                gameRecords[0].gameType === activeGameType &&
                gameRecords.some(r => r.playerId === currentPlayerId)
            ) {
                const currentPlayerRecord = gameRecords.find(r => r.playerId === currentPlayerId)!;
                const opponentRecord = gameRecords.find(r => r.playerId !== currentPlayerId)!;
                const opponentId = opponentRecord.playerId;

                if (!opponentData[opponentId]) {
                    opponentData[opponentId] = { wins: 0, losses: 0, draws: 0 };
                }

                if (currentPlayerRecord.result === 'win') {
                    opponentData[opponentId].wins++;
                } else if (currentPlayerRecord.result === 'loss') {
                    opponentData[opponentId].losses++;
                } else if (currentPlayerRecord.result === 'draw') {
                    opponentData[opponentId].draws++;
                }
            }
        }
        
        return Object.entries(opponentData)
            .map(([opponentId, stats]) => ({
                opponent: playersMap.get(opponentId),
                ...stats,
            }))
            .filter(item => item.opponent)
            .sort((a, b) => (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws)); 

    }, [currentPlayerId, activeGameType, gameLog, playersMap]);

    return (
        <div className="bg-gray-900/50 rounded-lg p-4 w-full">
            <h3 className="text-md font-bold text-teal-300 mb-2 text-center">{t('playerStats.h2hTitle')}</h3>
            {h2hData.length > 0 ? (
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {h2hData.map(({ opponent, wins, losses, draws }) => {
                        if (!opponent) return null;
                        const totalGames = wins + losses + draws;
                        const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0;
                        
                        return (
                            <div key={opponent.id} className="text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar avatar={opponent.avatar} className="w-6 h-6" />
                                        <span className="font-semibold text-sm text-white truncate">{opponent.name}</span>
                                    </div>
                                    <div className="font-mono text-sm">
                                        <span className="text-green-400">{wins}</span>
                                        <span className="text-gray-500">-</span>
                                        <span className="text-yellow-400">{draws}</span>
                                        <span className="text-gray-500">-</span>
                                        <span className="text-red-400">{losses}</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-red-500/30 rounded-full">
                                    <div 
                                        className="h-2 bg-green-500 rounded-full"
                                        style={{ width: `${winPercentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40">
                     <p className="text-gray-500 text-sm">{t('playerStats.noH2hData')}</p>
                </div>
            )}
        </div>
    );
};

const PlayerProfileModal: React.FC<{
    player: Player;
    stats: AllStats;
    gameLog: GameRecord[];
    players: Player[];
    onClose: () => void;
}> = ({ player, stats: allPlayersStats, gameLog, players, onClose }) => {
    const { t } = useTranslation();
    
    const playerGameTypes = useMemo(() => 
        Object.keys(allPlayersStats).filter(gameType => allPlayersStats[gameType][player.id]),
    [allPlayersStats, player.id]);

    const [activeGameType, setActiveGameType] = useState<string | null>(() => {
        const fourBallKey = 'gameSetup.fourBall';
        if (playerGameTypes.includes(fourBallKey)) {
            return fourBallKey;
        }
        return playerGameTypes[0] || null;
    });
    
    const { displayedStats, playerGamesForType } = useMemo(() => {
        if (!activeGameType) return { displayedStats: null, playerGamesForType: [] };
        
        const gameTypeStats = allPlayersStats[activeGameType]?.[player.id];
        if (!gameTypeStats) return { displayedStats: null, playerGamesForType: [] };

        const gamesForType = gameLog
            .filter(g => g.playerId === player.id && g.gameType === activeGameType)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const last10Games = gamesForType.slice(-10);
        const movingAvgScore = last10Games.reduce((sum, g) => sum + g.score, 0);
        const movingAvgTurns = last10Games.reduce((sum, g) => sum + g.turns, 0);
        const movingAverage = movingAvgTurns > 0 ? movingAvgScore / movingAvgTurns : 0;
        
        const overallAvgForType = gameTypeStats.totalTurns > 0 ? gameTypeStats.totalScore / gameTypeStats.totalTurns : 0;
        
        let trend: 'improving' | 'stagnating' | 'worsening' = 'stagnating';
        if (overallAvgForType > 0 && movingAverage > 0) {
            if (movingAverage > overallAvgForType * 1.05) trend = 'improving';
            if (movingAverage < overallAvgForType * 0.95) trend = 'worsening';
        }
        
        const draws = gameTypeStats.gamesPlayed - gameTypeStats.wins - gameTypeStats.losses;

        return {
            displayedStats: {
                ...gameTypeStats,
                average: overallAvgForType,
                trend,
                draws
            },
            playerGamesForType: gamesForType
        };
    }, [activeGameType, player.id, allPlayersStats, gameLog]);

    const filterButtonClasses = (isActive: boolean) => 
        `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive 
            ? 'bg-teal-500 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`;
    
    const TrendIndicator: React.FC<{ trend: 'improving' | 'stagnating' | 'worsening' }> = ({ trend }) => {
        switch (trend) {
            case 'improving':
                return <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
            case 'worsening':
                return <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
            default:
                return <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" /></svg>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-4xl text-center transform transition-transform duration-300 flex flex-col" 
                onClick={e => e.stopPropagation()}
                style={{ height: 'auto', maxHeight: '90vh' }}
            >
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0 text-center sm:w-1/3">
                        <Avatar avatar={player.avatar} className="w-32 h-32 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-teal-400 break-words">{player.name}</h2>
                    </div>

                    <div className="flex-grow text-left sm:w-2/3">
                        <div className="w-full overflow-x-auto pb-2 mb-4">
                            <div className="flex items-center gap-2">
                                {playerGameTypes.map(typeKey => (
                                    <button key={typeKey} onClick={() => setActiveGameType(typeKey)} className={filterButtonClasses(activeGameType === typeKey)}>
                                        {t(typeKey as any)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayedStats ? (
                            <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold">{t('playerStats.generalAverage')}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-5xl font-mono font-extrabold text-white">{displayedStats.average.toFixed(2)}</span>
                                        <TrendIndicator trend={displayedStats.trend} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold">{t('stats.games')}: {displayedStats.gamesPlayed}</p>
                                    <div className="flex items-center gap-4 font-mono text-2xl mt-1">
                                        <div title={t('stats.wins') as string}><span className="font-bold text-green-400">V</span>: {displayedStats.wins}</div>
                                        <div title={t('tournament.draws') as string}><span className="font-bold text-yellow-400">R</span>: {displayedStats.draws}</div>
                                        <div title={t('stats.losses') as string}><span className="font-bold text-red-400">P</span>: {displayedStats.losses}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
                                <p className="text-center text-gray-500">{t('playerStats.noStats')}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto border-t border-gray-700 pt-4 pr-2 -mr-2 space-y-4">
                    {activeGameType && (
                        <div className="grid md:grid-cols-2 gap-4">
                            <AverageTrendChart 
                                records={playerGamesForType} 
                                title={t('playerStats.avgTrendTitle')} 
                            />
                            <H2HStats 
                                currentPlayerId={player.id}
                                activeGameType={activeGameType}
                                gameLog={gameLog}
                                players={players}
                            />
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={onClose} 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors flex-shrink-0 mt-6"
                >
                    {t('playerStats.close')}
                </button>
            </div>
        </div>
    );
};


// --- First Time User Modal ---
const FirstTimeUserModal: React.FC<{
    onGenerate: () => void;
    onAdd: () => void;
    onImport: () => void;
    onClose: () => void;
}> = ({ onGenerate, onAdd, onImport, onClose }) => {
    const { t } = useTranslation();
    const ActionButton: React.FC<{ onClick: () => void; title: string; subtext: string; icon: string; disabled?: boolean; }> = ({ onClick, title, subtext, icon, disabled }) => (
        <button onClick={onClick} disabled={disabled} className="w-full text-left p-4 bg-gray-700 rounded-lg flex items-center gap-4 transition-all duration-200 enabled:hover:bg-indigo-600 enabled:hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed">
            <div className="text-4xl">{icon}</div>
            <div>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-gray-400 text-sm">{subtext}</p>
            </div>
        </button>
    );
    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-transform duration-300" onClick={e => e.stopPropagation()}>
                <h2 className="text-4xl font-extrabold text-teal-400 mb-2">{t('firstTime.title')}</h2>
                <p className="text-gray-300 mb-8">{t('firstTime.description')}</p>
                <div className="flex flex-col gap-4">
                    <ActionButton onClick={onGenerate} title={t('firstTime.generate')} subtext={t('firstTime.generateSubtext')} icon="🎲"/>
                    <ActionButton onClick={onAdd} title={t('firstTime.add')} subtext={t('firstTime.addSubtext')} icon="👤"/>
                    <ActionButton onClick={onImport} title={t('firstTime.import')} subtext={t('firstTime.importSubtext')} icon="📤" disabled={true}/>
                </div>
            </div>
        </div>
    );
};

// --- Post Game Summary ---
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

    const PLAYER_COLORS = ['#2dd4bf', '#facc15', '#fb923c', '#a78bfa'];

    const ScoreProgressionChart: React.FC<{ gameHistory: GameSummary['gameHistory']; playerIds: string[]; players: Player[]; targetScore: number; }> = ({ gameHistory, playerIds, players, targetScore }) => {
        const chartData = useMemo(() => {
            if (!gameHistory || gameHistory.length < 1) return [];
            return playerIds.map((playerId, index) => {
                const playerInfo = players.find(p => p.id === playerId);
                return {
                    playerId,
                    name: playerInfo?.name || 'Unknown',
                    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
                    data: gameHistory.map((state, turnIndex) => ({
                        turn: turnIndex,
                        score: state.scores[playerId] || 0,
                    })),
                };
            });
        }, [gameHistory, playerIds, players]);
        if (chartData.length === 0 || gameHistory.length < 2) return null;
        const width = 500, height = 250, padding = { top: 20, right: 20, bottom: 60, left: 40 };
        const maxTurn = gameHistory.length - 1;
        const maxScore = Math.max(targetScore, ...gameHistory.flatMap(s => Object.values(s.scores)));
        const getX = (turn: number) => padding.left + (turn / maxTurn) * (width - padding.left - padding.right);
        const getY = (score: number) => height - padding.bottom - (maxScore > 0 ? (score / maxScore) * (height - padding.top - padding.bottom) : 0);
        const pathData = (seriesData: { turn: number, score: number }[]) => seriesData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.turn)} ${getY(d.score)}`).join(' ');
        return (
            <div className="bg-gray-900/50 rounded-lg p-4 w-full mt-6">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label="Score Progression Chart">
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => (<g key={tick}><line x1={padding.left} y1={getY(maxScore * tick)} x2={width - padding.right} y2={getY(maxScore * tick)} className="stroke-gray-700" strokeWidth="0.5" strokeDasharray="2" /><text x={padding.left - 8} y={getY(maxScore * tick)} dy="0.3em" textAnchor="end" className="text-xs fill-gray-400 font-mono">{Math.round(maxScore * tick)}</text></g>))}
                    <line x1={padding.left} y1={getY(targetScore)} x2={width - padding.right} y2={getY(targetScore)} className="stroke-red-500/50" strokeWidth="1" strokeDasharray="4"/>
                    <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-xs fill-gray-400 font-mono">Turn 0</text><text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-xs fill-gray-400 font-mono">Turn {maxTurn}</text>
                    {chartData.map(series => (<path key={series.playerId} d={pathData(series.data)} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />))}
                    <g>{chartData.map((series, index) => { const legendItemWidth = (width - padding.left - padding.right) / chartData.length; const xPos = padding.left + index * legendItemWidth; const yPos = height - padding.bottom + 35; return (<g key={series.playerId} transform={`translate(${xPos}, ${yPos})`}><rect y="-5" width="12" height="12" fill={series.color} rx="3" /><text x="18" className="text-xs fill-gray-300 truncate" width={legendItemWidth - 20}>{series.name}</text></g>)})}</g>
                </svg>
            </div>
        );
    };

    const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (<div className="flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="font-mono font-bold text-white">{value}</span></div>);

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
                        <div key={playerId} className={`p-4 rounded-lg transition-all duration-300 flex items-center gap-4 relative ${isWinner ? 'bg-green-500/20 border-2 border-green-400' : 'bg-gray-900/50'}`}>
                            {isWinner && (<div className="absolute -top-3 -right-3 bg-green-400 text-black text-xs font-bold px-2 py-1 rounded-full uppercase">{t('postGame.winner')}</div>)}
                            <Avatar avatar={player.avatar} className="w-16 h-16 flex-shrink-0" />
                            <div className="flex-grow">
                                <div className="flex items-center gap-3"><p className="text-2xl font-bold text-white">{player.name}</p>{handicap > 0 && (<span className="text-xs font-semibold bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">{t('postGame.handicapApplied', { points: handicap })}</span>)}</div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 mt-2">
                                    <StatItem label={t('postGame.average')} value={average} />
                                    <StatItem label={t('stats.zeroInnings')} value={turnStats.zeroInnings} />
                                    <StatItem label={t('stats.clean10s')} value={turnStats.clean10s} />
                                    <StatItem label={t('stats.clean20s')} value={turnStats.clean20s} />
                                </div>
                            </div>
                            <div className="flex-shrink-0"><p className="text-5xl font-mono font-extrabold text-teal-300">{finalScores[playerId]}</p></div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 text-center"><button onClick={() => setShowChart(!showChart)} className="text-teal-400 hover:text-teal-300 font-semibold py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">{showChart ? t('postGame.hideChart') : t('postGame.showChart')}</button></div>
            {showChart && <ScoreProgressionChart gameHistory={gameHistory} playerIds={gameInfo.playerIds} players={players} targetScore={gameInfo.targetScore} />}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button onClick={onRematch} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-lg text-lg shadow-md transition-all duration-200 hover:scale-105">{t('postGame.rematch')}</button>
                <button onClick={onNewGame} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-lg shadow-md transition-all duration-200 hover:scale-105">{t('postGame.newGame')}</button>
            </div>
        </div>
    );
};

// --- Tournament View ---
const TournamentView: React.FC<{
    tournaments: Tournament[];
    players: Player[];
    onCreateTournament: (name: string, playerIds: string[], settings: TournamentSettings) => void;
    onStartMatch: (tournament: Tournament, match: Match) => void;
}> = ({ tournaments, players, onCreateTournament, onStartMatch }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'list' | 'setup'>('list');
    const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

    const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
        onCreateTournament(name, playerIds, settings);
        setView('list');
    };
    
    // --- Inlined components ---
    const TournamentDashboard: React.FC<{ tournament: Tournament; onExit: () => void; }> = ({ tournament, onExit }) => { /* Implementation from TournamentView.tsx */
        const playersMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
        const leaderboard = useMemo(() => {
            const stats: Record<string, { playerId: string; played: number; wins: number; draws: number; losses: number; points: number; }> = {};
            tournament.playerIds.forEach(id => { stats[id] = { playerId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0 }; });
            tournament.matches.forEach(match => {
                if (match.status === 'completed' && match.result) {
                    const { player1Id, player2Id, result } = match;
                    stats[player1Id].played++; stats[player2Id].played++;
                    if (result.winnerId === null) { stats[player1Id].draws++; stats[player2Id].draws++; stats[player1Id].points++; stats[player2Id].points++; } 
                    else if (result.winnerId === player1Id) { stats[player1Id].wins++; stats[player2Id].losses++; stats[player1Id].points += 3; } 
                    else { stats[player2Id].wins++; stats[player1Id].losses++; stats[player2Id].points += 3; }
                }
            });
            return Object.values(stats).sort((a, b) => b.points - a.points);
        }, [tournament]);
        const winner = tournament.status === 'completed' ? playersMap.get(leaderboard[0]?.playerId) : null;
        return (
            <div className="w-full max-w-5xl p-4">
                <div className="flex justify-between items-start mb-6">
                    <div><h1 className="text-4xl font-extrabold text-white">{tournament.name}</h1><p className="text-gray-400">{t(tournament.settings.gameTypeKey as any)} · {t('gameSetup.targetScore')}: {tournament.settings.targetScore}</p></div>
                    <button onClick={onExit} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('tournament.backToList')}</button>
                </div>
                {winner && <div className="bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300 p-4 rounded-lg mb-6 text-center"><h3 className="text-2xl font-bold">{t('tournament.winner')}</h3><div className="flex items-center justify-center gap-3 mt-2"><Avatar avatar={winner.avatar} className="w-10 h-10" /><p className="text-xl font-semibold">{winner.name}</p></div></div>}
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-gray-800 rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.leaderboard')}</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-gray-700"><th className="p-2">#</th><th className="p-2">{t('stats.player')}</th><th className="p-2 text-center" title={t('tournament.played') as string}>{t('tournament.played')}</th><th className="p-2 text-center" title={t('tournament.wins') as string}>{t('tournament.wins')}</th><th className="p-2 text-center" title={t('tournament.draws') as string}>{t('tournament.draws')}</th><th className="p-2 text-center" title={t('tournament.losses') as string}>{t('tournament.losses')}</th><th className="p-2 text-center" title={t('tournament.points') as string}>{t('tournament.points')}</th></tr></thead><tbody>{leaderboard.map((row, index) => { const player = playersMap.get(row.playerId); return player ? (<tr key={row.playerId} className="border-b border-gray-700/50"><td className="p-2 font-bold">{index + 1}</td><td className="p-2 flex items-center gap-2"><Avatar avatar={player.avatar} className="w-6 h-6" /><span className="font-semibold truncate">{player.name}</span></td><td className="p-2 text-center font-mono">{row.played}</td><td className="p-2 text-center font-mono text-green-400">{row.wins}</td><td className="p-2 text-center font-mono text-yellow-400">{row.draws}</td><td className="p-2 text-center font-mono text-red-400">{row.losses}</td><td className="p-2 text-center font-mono font-bold text-teal-300">{row.points}</td></tr>) : null;})}</tbody></table></div>
                    <div className="md:col-span-2 bg-gray-800 rounded-lg p-4 shadow-lg"><h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.matches')}</h2><div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">{tournament.matches.map(match => { const p1 = playersMap.get(match.player1Id); const p2 = playersMap.get(match.player2Id); if (!p1 || !p2) return null; return (<div key={match.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between"><div className="flex items-center gap-2 font-semibold text-lg"><div className="flex items-center gap-2 w-32 justify-end"><span className="truncate text-right">{p1.name}</span><Avatar avatar={p1.avatar} className="w-8 h-8"/></div><span className="text-gray-500 mx-2">{t('tournament.matchVs')}</span><div className="flex items-center gap-2 w-32"><Avatar avatar={p2.avatar} className="w-8 h-8"/><span className="truncate">{p2.name}</span></div></div>{match.status === 'pending' ? (<button onClick={() => onStartMatch(tournament, match)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">{t('tournament.playMatch')}</button>) : (<div className="text-center font-mono font-bold text-xl"><span>{match.result?.player1Score}</span><span className="text-gray-500 mx-2">-</span><span>{match.result?.player2Score}</span></div>)}</div>);})}</div></div>
                </div>
            </div>
        );
    };

    if (activeTournament) return <TournamentDashboard tournament={activeTournament} onExit={() => setActiveTournament(null)} />;
    if (view === 'setup') return <TournamentSetup players={players} onSubmit={handleCreateTournament} onCancel={() => setView('list')} />;
    return <TournamentList tournaments={tournaments} onSelectTournament={setActiveTournament} onCreateNew={() => setView('setup')} />;
};

const TournamentList: React.FC<{ tournaments: Tournament[]; onSelectTournament: (t: Tournament) => void; onCreateNew: () => void; }> = ({ tournaments, onSelectTournament, onCreateNew }) => {
    const { t } = useTranslation();
    const ongoing = tournaments.filter(t => t.status === 'ongoing');
    const completed = tournaments.filter(t => t.status === 'completed');

    const Item: React.FC<{ tournament: Tournament }> = ({ tournament }) => (
        <button onClick={() => onSelectTournament(tournament)} className="w-full text-left bg-gray-800 hover:bg-gray-700 p-4 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-xl text-white">{tournament.name}</p><p className="text-sm text-gray-400">{tournament.playerIds.length} players · {new Date(tournament.createdAt).toLocaleDateString()}</p></div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-300' : 'bg-gray-600/50 text-gray-400'}`}>{t(`tournament.${tournament.status}`)}</span>
            </div>
        </button>
    );

    return (
        <div className="w-full max-w-4xl p-4">
            <div className="flex justify-between items-center mb-8"><h1 className="text-4xl font-extrabold text-white">{t('tournament.title')}</h1><button onClick={onCreateNew} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">{t('tournament.create')}</button></div>
            {tournaments.length === 0 ? <p className="text-center text-gray-500 mt-16">{t('tournament.noTournaments')}</p> : <div className="space-y-8">{ongoing.length > 0 && <div><h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.ongoing')}</h2><div className="space-y-3">{ongoing.map(t => <Item key={t.id} tournament={t} />)}</div></div>}{completed.length > 0 && <div><h2 className="text-2xl font-bold text-teal-300 mb-4">{t('tournament.completed')}</h2><div className="space-y-3">{completed.map(t => <Item key={t.id} tournament={t} />)}</div></div>}</div>}
        </div>
    );
};

const TournamentSetup: React.FC<{ players: Player[]; onSubmit: (name: string, pIds: string[], s: TournamentSettings) => void; onCancel: () => void; }> = ({ players, onSubmit, onCancel }) => { /* Implementation from TournamentView.tsx */
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [gameTypeKey, setGameTypeKey] = useState<string>('gameSetup.threeCushion');
    const [targetScore, setTargetScore] = useState<number>(GAME_TYPE_DEFAULTS_SETUP['gameSetup.threeCushion']);
    const [endCondition, setEndCondition] = useState<'sudden-death' | 'equal-innings'>('equal-innings');
    const availablePlayers = useMemo(() => players.filter(p => !selectedPlayerIds.includes(p.id)), [players, selectedPlayerIds]);
    const selectedPlayers = useMemo(() => selectedPlayerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p), [selectedPlayerIds, players]);
    const handlePlayerToggle = (pId: string) => setSelectedPlayerIds(prev => prev.includes(pId) ? prev.filter(id => id !== pId) : (prev.length < 8 ? [...prev, pId] : prev));
    const handleGameTypeChange = (key: string) => { setGameTypeKey(key); setTargetScore(GAME_TYPE_DEFAULTS_SETUP[key] || 50); };
    const handleSubmit = () => { if (name.trim() && selectedPlayerIds.length >= 3 && selectedPlayerIds.length <= 8) { onSubmit(name.trim(), selectedPlayerIds, { gameTypeKey, targetScore, endCondition }); } };
    const isSubmitDisabled = name.trim().length === 0 || selectedPlayerIds.length < 3 || selectedPlayerIds.length > 8;
    let errorText = ''; if (selectedPlayerIds.length > 0 && selectedPlayerIds.length < 3) errorText = t('tournament.notEnoughPlayers'); else if (selectedPlayerIds.length > 8) errorText = t('tournament.tooManyPlayers');
    const buttonClasses = (isActive: boolean) => `w-full text-center p-3 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${isActive ? 'bg-teal-500 border-teal-400 text-white shadow-lg' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'}`;
    const PlayerSelectItem: React.FC<{ player: Player, onClick: () => void }> = ({ player, onClick }) => (<button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors bg-gray-700 hover:bg-indigo-600"><Avatar avatar={player.avatar} className="w-8 h-8 flex-shrink-0" /><span className="font-semibold truncate text-sm">{player.name}</span></button>);
    return (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300"><h1 className="text-4xl font-extrabold mb-8 text-center text-white">{t('tournament.setupTitle')}</h1><div className="grid md:grid-cols-2 gap-8"><div className="space-y-6"><div><label className="text-xl font-bold text-teal-300 mb-2 block">{t('tournament.name')}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('tournament.namePlaceholder') as string} className="w-full bg-gray-700 text-white text-lg rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400"/></div><div><h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.selectType')}</h3><div className="grid grid-cols-2 gap-3">{Object.keys(GAME_TYPE_DEFAULTS_SETUP).map(key => (<button key={key} onClick={() => handleGameTypeChange(key)} className={buttonClasses(gameTypeKey === key)}>{t(key as any)}</button>))}</div></div><div><h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.targetScore')}</h3><input type="number" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full bg-gray-700 text-white text-center text-2xl font-bold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"/></div><div><h3 className="text-xl font-bold text-teal-300 mb-4">{t('gameSetup.endCondition')}</h3><div className="grid grid-cols-2 gap-4"><button onClick={() => setEndCondition('sudden-death')} className={buttonClasses(endCondition === 'sudden-death')}>{t('gameSetup.suddenDeath')}</button><button onClick={() => setEndCondition('equal-innings')} className={buttonClasses(endCondition === 'equal-innings')}>{t('gameSetup.equalInnings')}</button></div></div></div><div><h3 className="text-xl font-bold text-teal-300 mb-4">{t('tournament.selectPlayers')} ({selectedPlayerIds.length})</h3><div className="grid grid-cols-2 gap-4"><div><h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.availablePlayers')}</h4><div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">{availablePlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}</div></div><div><h4 className="font-semibold text-gray-400 mb-2">{t('gameSetup.playersInGame')}</h4><div className="bg-gray-900/50 p-2 rounded-lg h-64 overflow-y-auto space-y-2">{selectedPlayers.map(p => <PlayerSelectItem key={p.id} player={p} onClick={() => handlePlayerToggle(p.id)} />)}</div></div></div>{errorText && <p className="text-red-400 text-center mt-2 font-semibold">{errorText}</p>}</div></div><div className="mt-8 flex gap-4"><button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors">{t('cancel')}</button><button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md transition-all duration-200 enabled:hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">{t('tournament.create')}</button></div></div>
    );
};


// --- MAIN APP COMPONENT ---
function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const item = JSON.parse(storedValue);
        
        if (Array.isArray(defaultValue) && !Array.isArray(item)) {
          console.warn(`LocalStorage for key "${key}" is not an array, resetting to default.`);
          return defaultValue;
        }

        return item ?? defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}

const App: React.FC = () => {
  const { t } = useTranslation();
  
  const [view, setView] = useState<View>('scoreboard');
  
  const [players, setPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
  const [scores, setScores] = useLocalStorageState<{ [playerId: string]: number }>('scoreCounter:scores', {});
  const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);
  
  const [gameInfo, setGameInfo] = useLocalStorageState<GameInfo | null>('scoreCounter:gameInfo', null);
  const [postGameSummary, setPostGameSummary] = useState<GameSummary | null>(null);

  const [modalState, setModalState] = useState<ModalState>({ view: 'closed' });
  const [gameHistory, setGameHistory] = useLocalStorageState<Array<{ scores: { [playerId: string]: number }, currentPlayerIndex: number }>>('scoreCounter:gameHistory', []);
  const [stats, setStats] = useLocalStorageState<AllStats>('scoreCounter:stats', {});
  const [completedGamesLog, setCompletedGamesLog] = useLocalStorageState<GameRecord[]>('scoreCounter:gameLog', []);
  const [tournaments, setTournaments] = useLocalStorageState<Tournament[]>('scoreCounter:tournaments', []);

  // Transient state
  const [turnScore, setTurnScore] = useState(0);
  const [isTurnTransitioning, setIsTurnTransitioning] = useState(false);
  const isInitialMount = useRef(true);
  
  const activePlayers = useMemo(() => 
    gameInfo?.playerIds.map(id => players.find(p => p.id === id)).filter((p): p is Player => !!p) || [],
    [players, gameInfo]
  );
  
  const turnsPerPlayer = useMemo(() => {
      const turns: { [id: string]: number } = {};
      if (gameInfo) {
          gameInfo.playerIds.forEach(id => (turns[id] = 0));
          gameHistory.forEach(state => {
              const pid = gameInfo.playerIds[state.currentPlayerIndex];
              if (pid) turns[pid]++;
          });
      }
      return turns;
  }, [gameHistory, gameInfo]);

  useEffect(() => {
      if (isInitialMount.current) {
          isInitialMount.current = false;
      } else if (gameInfo) {
          setIsTurnTransitioning(true);
          const timer = setTimeout(() => {
              setIsTurnTransitioning(false);
          }, 600);
          return () => clearTimeout(timer);
      }
  }, [gameInfo?.currentPlayerIndex]);


  const handleSavePlayer = useCallback((playerData: { name: string; avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        const playerToEdit = modalState.player;
        if (playerToEdit && playerToEdit.id) {
            setPlayers(prev => prev.map(p => p.id === playerToEdit.id ? { ...p, ...playerData } : p));
        } else {
            const newPlayer: Player = { id: Date.now().toString(), ...playerData };
            setPlayers(prev => [...prev, newPlayer]);
        }
    }
    setModalState({ view: 'closed' });
  }, [modalState, setPlayers]);
  
  const deletePlayer = (id: string) => {
    const isPlayerInTournament = tournaments.some(t => 
        t.status === 'ongoing' && t.playerIds.includes(id)
    );

    if (isPlayerInTournament) {
        alert(t('tournament.cannotDeletePlayer'));
        return;
    }
    
    setPlayers(prev => prev.filter(p => p.id !== id));
    if (gameInfo) {
      const newPlayerIds = gameInfo.playerIds.filter(pId => pId !== id);
      if (newPlayerIds.length < gameInfo.playerIds.length) {
        setGameInfo({
          ...gameInfo,
          playerIds: newPlayerIds,
          currentPlayerIndex: 0 // Reset turn on player deletion
        });
      }
    }
    setScores(prev => {
      const newScores = {...prev};
      delete newScores[id];
      return newScores;
    });
  };

  const openCameraHandler = (editorState: { name: string, avatar: string }) => {
    if (modalState.view === 'playerEditor') {
        setModalState({
            view: 'camera',
            context: {
                originalPlayer: modalState.player,
                ...editorState
            }
        });
    }
  };

  const handleCapturedImage = useCallback((dataUrl: string) => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                ...(context.originalPlayer || { id: '', name: '' }),
                name: context.name,
                avatar: dataUrl
            }
        });
    }
  }, [modalState]);

  const closeCameraHandler = () => {
    if (modalState.view === 'camera') {
        const { context } = modalState;
        setModalState({
            view: 'playerEditor',
            player: {
                 ...(context.originalPlayer || { id: '', name: '' }),
                 name: context.name,
                 avatar: context.avatar,
            }
        });
    }
  };
  
  const handleChangeGame = () => {
    setGameInfo(null);
    setScores({});
    setTurnScore(0);
    setGameHistory([]);
  }
  
  const handleGameStart = (
      playerIds: string[], 
      gameTypeKey: string, 
      mode: GameMode, 
      targetScore: number, 
      endCondition: 'sudden-death' | 'equal-innings',
      handicap?: { playerId: string, points: number },
      tournamentContext?: { tournamentId: string; matchId: string }
    ) => {
    const turnStats: GameInfo['turnStats'] = {};
    playerIds.forEach(id => {
      turnStats[id] = { clean10s: 0, clean20s: 0, zeroInnings: 0 };
    });

    setGameInfo({ type: gameTypeKey, mode, playerIds, targetScore, currentPlayerIndex: 0, endCondition, turnStats, handicap, tournamentContext });
    
    const newScores: { [playerId: string]: number } = {};
    playerIds.forEach(id => {
      newScores[id] = 0;
    });

    if (handicap) {
      newScores[handicap.playerId] = handicap.points;
    }

    setScores(newScores);
    setTurnScore(0);
    setGameHistory([]);
    setView('scoreboard');

    setLastPlayedPlayerIds(prev => {
      const newOrder = [...playerIds];
      prev.forEach(id => {
        if (!newOrder.includes(id)) {
          newOrder.push(id);
        }
      });
      return newOrder.slice(0, 10);
    });
  }
  
  const handleAddToTurn = (scoreData: { points: number, type: string }) => {
    const { points, type } = scoreData;
    setTurnScore(prev => prev + points);
    
    if (!gameInfo) return;
    const currentPlayerId = gameInfo.playerIds[gameInfo.currentPlayerIndex];
    if (!currentPlayerId) return;

    if (type === 'clean10' || type === 'clean20') {
      const newTurnStats = { ...gameInfo.turnStats };
      const playerTurnStats = { ...newTurnStats[currentPlayerId] };
      if (type === 'clean10') playerTurnStats.clean10s++;
      if (type === 'clean20') playerTurnStats.clean20s++;
      newTurnStats[currentPlayerId] = playerTurnStats;
      setGameInfo({ ...gameInfo, turnStats: newTurnStats });
    }
  }
  
  const handleSaveGameStats = (summary: GameSummary) => {
      const { gameInfo: finishedGameInfo, finalScores, winnerIds, turnsPerPlayer } = summary;
      const { type: gameTypeKey, playerIds, turnStats = {}, handicap } = finishedGameInfo;
      const gameId = Date.now().toString();

      setStats(prevStats => {
          const newStats: AllStats = JSON.parse(JSON.stringify(prevStats));
          if (!newStats[gameTypeKey]) newStats[gameTypeKey] = {};
          const gameStats = newStats[gameTypeKey];

          playerIds.forEach(playerId => {
              if (!gameStats[playerId]) {
                  gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
              }
              const playerStats = gameStats[playerId];
              const handicapPoints = (handicap?.playerId === playerId) ? handicap.points : 0;
              const earnedScore = (finalScores[playerId] || 0) - handicapPoints;
              const isWin = winnerIds.includes(playerId) && winnerIds.length === 1;
              const isDraw = winnerIds.includes(playerId) && winnerIds.length > 1;

              playerStats.gamesPlayed++;
              playerStats.totalTurns += turnsPerPlayer[playerId] || 0;
              playerStats.totalScore += earnedScore;
              playerStats.zeroInnings += turnStats[playerId]?.zeroInnings || 0;
              if (isWin) {
                  playerStats.wins++;
              } else if (!isDraw) {
                  playerStats.losses++;
              }
          });
          return newStats;
      });
      
      const newGameRecords: GameRecord[] = playerIds.map(playerId => {
        const handicapPoints = (handicap?.playerId === playerId) ? handicap.points : 0;
        const earnedScore = (finalScores[playerId] || 0) - handicapPoints;
        const isWin = winnerIds.includes(playerId) && winnerIds.length === 1;
        const isDraw = winnerIds.includes(playerId) && winnerIds.length > 1;
        
        let result: GameRecord['result'] = 'loss';
        if (isWin) result = 'win';
        if (isDraw) result = 'draw';

        return {
          gameId,
          playerId,
          gameType: gameTypeKey,
          score: earnedScore,
          turns: turnsPerPlayer[playerId] || 0,
          date: new Date().toISOString(),
          result: result,
          handicapApplied: handicapPoints > 0 ? handicapPoints : undefined,
          zeroInnings: turnStats[playerId]?.zeroInnings || 0,
          clean10s: turnStats[playerId]?.clean10s || 0,
          clean20s: turnStats[playerId]?.clean20s || 0,
        }
      });

      setCompletedGamesLog(prev => [...prev, ...newGameRecords]);
  };
  
  const handleUpdateTournamentMatchResult = (summary: GameSummary) => {
    const { tournamentContext } = summary.gameInfo;
    if (!tournamentContext) return;

    const { tournamentId, matchId } = tournamentContext;
    const { finalScores, winnerIds } = summary;

    setTournaments(prev => {
        return prev.map(t => {
            if (t.id === tournamentId) {
                const updatedMatches = t.matches.map(m => {
                    if (m.id === matchId) {
                        const player1Score = finalScores[m.player1Id] || 0;
                        const player2Score = finalScores[m.player2Id] || 0;
                        let winnerId: string | null = null;
                        if (winnerIds.length === 1) {
                            winnerId = winnerIds[0];
                        } else if (winnerIds.length > 1) {
                            winnerId = null; // Draw
                        } else { // Should not happen if scores differ
                            if (player1Score > player2Score) winnerId = m.player1Id;
                            if (player2Score > player1Score) winnerId = m.player2Id;
                        }

                        return { 
                            ...m, 
                            status: 'completed' as const, 
                            result: { player1Score, player2Score, winnerId }
                        };
                    }
                    return m;
                });

                const allMatchesCompleted = updatedMatches.every(m => m.status === 'completed');
                
                return {
                    ...t,
                    matches: updatedMatches,
                    status: allMatchesCompleted ? 'completed' as const : 'ongoing' as const
                };
            }
            return t;
        });
    });
};

  const handleEndTurn = () => {
    if (!gameInfo) return;

    let { currentPlayerIndex, targetScore, endCondition, playerIds, turnStats = {} } = gameInfo;
    const currentPlayerId = playerIds[currentPlayerIndex];

    if (turnScore === 0) {
        const newTurnStats = { ...turnStats };
        const playerTurnStats = { ...newTurnStats[currentPlayerId] };
        playerTurnStats.zeroInnings++;
        newTurnStats[currentPlayerId] = playerTurnStats;
        turnStats = newTurnStats;
    }
    
    let newPlayerScore = (scores[currentPlayerId] || 0) + turnScore;
    const newScores = { ...scores };
    const hasReachedTarget = newPlayerScore >= targetScore;

    if (endCondition === 'equal-innings' && hasReachedTarget) {
      newPlayerScore = targetScore; // Cap the score
    }
    newScores[currentPlayerId] = newPlayerScore;

    const newHistory = [...gameHistory, { scores, currentPlayerIndex }];
    setScores(newScores);
    setGameHistory(newHistory);
    setTurnScore(0);
    
    const updatedGameInfo = { ...gameInfo, turnStats };

    const endGame = (winners: string[]) => {
      const finalHistory = [...newHistory, { scores: newScores, currentPlayerIndex }];

      const turnsPerPlayer: { [playerId: string]: number } = {};
      playerIds.forEach(id => turnsPerPlayer[id] = 0);
      
      finalHistory.forEach((state, index) => {
          const playerId = playerIds[state.currentPlayerIndex];
          if (playerId && index < finalHistory.length -1) turnsPerPlayer[playerId]++;
      });
      turnsPerPlayer[currentPlayerId]++;

      const summary = { gameInfo: updatedGameInfo, finalScores: newScores, winnerIds: winners, turnsPerPlayer, gameHistory: finalHistory };
      
      handleSaveGameStats(summary);

      if (updatedGameInfo.tournamentContext) {
          handleUpdateTournamentMatchResult(summary);
          setView('tournament');
          setGameInfo(null);
      } else {
          setPostGameSummary(summary);
          setGameInfo(null);
      }
    };

    if (hasReachedTarget && endCondition === 'sudden-death') {
      endGame([currentPlayerId]);
      return;
    }

    let nextGameInfo = { ...updatedGameInfo };
    if (hasReachedTarget && endCondition === 'equal-innings') {
      const finished = nextGameInfo.finishedPlayerIds || [];
      if (!finished.includes(currentPlayerId)) {
        nextGameInfo.finishedPlayerIds = [...finished, currentPlayerId];
      }
      if (!nextGameInfo.playoutInfo) {
        nextGameInfo.playoutInfo = { startingPlayerIndex: currentPlayerIndex };
      }
    }
    
    let nextIndex = currentPlayerIndex;
    for (let i = 1; i <= playerIds.length; i++) {
      const potentialIndex = (currentPlayerIndex + i) % playerIds.length;
      if (!nextGameInfo.finishedPlayerIds?.includes(playerIds[potentialIndex])) {
        nextIndex = potentialIndex;
        break;
      }
    }
    nextGameInfo.currentPlayerIndex = nextIndex;

    const isPlayoutActive = !!nextGameInfo.playoutInfo;
    if (isPlayoutActive) {
      const playoutRoundComplete = nextIndex === nextGameInfo.playoutInfo!.startingPlayerIndex;
      const allFinished = (nextGameInfo.finishedPlayerIds?.length || 0) === playerIds.length;

      if (playoutRoundComplete || allFinished) {
        const highestScore = Math.max(...Object.values(newScores));
        const winners = playerIds.filter(id => newScores[id] >= highestScore);
        endGame(winners);
        return;
      }
    }

    setGameInfo(nextGameInfo);
  };

  const handleUndoLastTurn = () => {
    if (gameHistory.length > 0) {
      const lastState = gameHistory[gameHistory.length - 1];
      const newHistory = gameHistory.slice(0, -1);

      setScores(lastState.scores);
      setGameInfo(prev => prev ? { ...prev, 
        currentPlayerIndex: lastState.currentPlayerIndex,
        finishedPlayerIds: prev.finishedPlayerIds?.filter(id => (lastState.scores[id] || 0) < prev.targetScore),
        playoutInfo: (lastState.scores[prev.playerIds[prev.playoutInfo?.startingPlayerIndex || 0]] || 0) < prev.targetScore ? undefined : prev.playoutInfo
      } : null);
      setGameHistory(newHistory);
      setTurnScore(0);
    }
  };

  const handleViewPlayerStats = (player: Player) => {
    setModalState({ view: 'playerStats', player });
  };
    
  const handleNavigate = (targetView: View) => {
    if (targetView === 'playerManager' && players.length === 0) {
      setModalState({ view: 'firstTimeUser' });
    } else {
      setView(targetView);
    }
  };

  const handleRematch = () => {
    if (!postGameSummary) return;
    const { gameInfo } = postGameSummary;
    const reversedPlayerIds = [...gameInfo.playerIds].reverse();
    handleGameStart(reversedPlayerIds, gameInfo.type, gameInfo.mode, gameInfo.targetScore, gameInfo.endCondition, gameInfo.handicap);
    setPostGameSummary(null);
  };
  
  const handleCreateTournament = (name: string, playerIds: string[], settings: TournamentSettings) => {
    const matches: Match[] = [];
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        matches.push({
          id: `${Date.now()}-${i}-${j}`,
          player1Id: playerIds[i],
          player2Id: playerIds[j],
          status: 'pending',
        });
      }
    }
    
    const newTournament: Tournament = {
      id: Date.now().toString(),
      name,
      playerIds,
      settings,
      matches,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
    };

    setTournaments(prev => [...prev, newTournament]);
  };
  
  const handleStartTournamentMatch = (tournament: Tournament, match: Match) => {
    handleGameStart(
      [match.player1Id, match.player2Id],
      tournament.settings.gameTypeKey,
      'round-robin',
      tournament.settings.targetScore,
      tournament.settings.endCondition,
      undefined,
      { tournamentId: tournament.id, matchId: match.id }
    );
  };

  const handleGenerateSampleData = () => {
    const PREDEFINED_AVATARS = [
      'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4V7h2v6h-2z', 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z', 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-9 12l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z', 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    ];
    const names = ['Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
    const gameTypeKeys = ['gameSetup.freeGame', 'gameSetup.oneCushion', 'gameSetup.threeCushion', 'gameSetup.fourBall'];

    const newPlayers: Player[] = names.map((name, index) => ({
      id: `sample-${index}-${Date.now()}`,
      name: name,
      avatar: PREDEFINED_AVATARS[index % PREDEFINED_AVATARS.length],
    }));

    const newGameLog: GameRecord[] = [];
    
    for (let i = 0; i < 40; i++) {
        const p1Index = Math.floor(Math.random() * newPlayers.length);
        let p2Index = Math.floor(Math.random() * newPlayers.length);
        while (p1Index === p2Index) {
            p2Index = Math.floor(Math.random() * newPlayers.length);
        }
        const p1 = newPlayers[p1Index];
        const p2 = newPlayers[p2Index];
        const gameType = gameTypeKeys[Math.floor(Math.random() * gameTypeKeys.length)];
        const date = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (Math.random()*5));
        
        const gameId = `game-${i}-${date.getTime()}`;

        const turns = Math.floor(Math.random() * 20) + 5;
        const score1 = Math.floor(Math.random() * (turns * 2.5));
        const score2 = Math.floor(Math.random() * (turns * 2.5));

        newGameLog.push({
            gameId,
            playerId: p1.id, gameType, score: score1, turns, date: date.toISOString(),
            result: score1 > score2 ? 'win' : 'loss',
            zeroInnings: Math.floor(Math.random() * (turns / 3)),
            clean10s: Math.floor(Math.random() * 3), clean20s: Math.floor(Math.random() * 2),
        });
        newGameLog.push({
            gameId,
            playerId: p2.id, gameType, score: score2, turns, date: date.toISOString(),
            result: score2 > score1 ? 'win' : 'loss',
            zeroInnings: Math.floor(Math.random() * (turns / 3)),
            clean10s: Math.floor(Math.random() * 3), clean20s: Math.floor(Math.random() * 2),
        });
    }


    const newStats: AllStats = {};
    newGameLog.forEach(record => {
      const { playerId, gameType, score, turns, result, zeroInnings } = record;
      if (!newStats[gameType]) newStats[gameType] = {};
      const gameStats = newStats[gameType];
      if (!gameStats[playerId]) {
        gameStats[playerId] = { gamesPlayed: 0, wins: 0, losses: 0, totalTurns: 0, totalScore: 0, zeroInnings: 0 };
      }
      const playerStats = gameStats[playerId];

      playerStats.gamesPlayed++;
      playerStats.totalTurns += turns;
      playerStats.totalScore += score;
      playerStats.zeroInnings += zeroInnings;
      if (result === 'win') {
        playerStats.wins++;
      } else if (result === 'loss') {
        playerStats.losses++;
      }
    });
    
    setPlayers(newPlayers);
    setCompletedGamesLog(newGameLog);
    setStats(newStats);

    setModalState({ view: 'closed' });
    setView('playerManager');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center text-white p-4 font-sans antialiased ${gameInfo || postGameSummary ? 'justify-start pt-24' : 'justify-center'}`}>
      {/* Modals */}
      {modalState.view === 'playerEditor' && (
        <PlayerEditorModal 
            playerToEdit={modalState.player}
            onSave={handleSavePlayer}
            onClose={() => setModalState({ view: 'closed' })}
            onOpenCamera={openCameraHandler}
        />
      )}
      {modalState.view === 'camera' && (
        <CameraCaptureModal 
            onCapture={handleCapturedImage} 
            onClose={closeCameraHandler} 
        />
      )}
      {modalState.view === 'playerStats' && (
        <PlayerProfileModal
            player={modalState.player}
            stats={stats}
            gameLog={completedGamesLog}
            players={players}
            onClose={() => setModalState({ view: 'closed' })}
        />
      )}
      {modalState.view === 'firstTimeUser' && (
        <FirstTimeUserModal
            onGenerate={handleGenerateSampleData}
            onAdd={() => {
                setModalState({ view: 'playerEditor' });
                setView('playerManager');
            }}
            onImport={() => alert(t('firstTime.importAlert'))}
            onClose={() => setModalState({ view: 'closed' })}
        />
      )}

      {/* Header */}
      {!(gameInfo || postGameSummary) ? (
        <HeaderNav currentView={view} onNavigate={handleNavigate} />
      ) : (
         <header className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-50 p-4 flex justify-end items-center z-10">
             <button onClick={handleChangeGame} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                {t('changeGame')}
            </button>
         </header>
      )}
      
      <main className="w-full max-w-5xl flex flex-col items-center">
        {gameInfo ? (
            <div className="w-full">
              <div className="w-full flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold text-white truncate">
                      {t(gameInfo.type as any)}
                  </h1>
                  <p className="text-xl font-mono text-gray-400">
                      {t('scoreboard.inning', { count: Math.floor(gameHistory.length / activePlayers.length) + 1 })}
                  </p>
              </div>

              <div className={`w-full grid gap-4 transition-all duration-300 ${isTurnTransitioning ? 'animate-turn-transition' : ''}`}>
                  {(() => {
                      if (activePlayers.length === 0) return <p className="text-center text-gray-500">{t('noPlayersSelected')}</p>;
                      const currentPlayer = activePlayers[gameInfo.currentPlayerIndex];
                      const otherPlayers = activePlayers.filter((_, index) => index !== gameInfo.currentPlayerIndex);
                      
                      return (
                          <>
                              <PlayerScoreCard
                                  player={currentPlayer}
                                  score={scores[currentPlayer.id] || 0}
                                  turns={turnsPerPlayer[currentPlayer.id] || 0}
                                  turnScore={turnScore}
                                  targetScore={gameInfo.targetScore}
                              />
                              <ScoreInputPad
                                  onScore={handleAddToTurn}
                                  onEndTurn={handleEndTurn}
                                  onUndoTurn={handleUndoLastTurn}
                                  isUndoTurnDisabled={gameHistory.length === 0}
                              />
                              {otherPlayers.length > 0 && (
                                  <div className={`grid grid-cols-1 ${otherPlayers.length > 1 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-2 mt-4`}>
                                      {otherPlayers.map(p => (
                                          <MinimizedPlayerCard
                                              key={p.id}
                                              player={p}
                                              score={scores[p.id] || 0}
                                              turns={turnsPerPlayer[p.id] || 0}
                                              targetScore={gameInfo.targetScore}
                                              isActive={false}
                                              isFinished={gameInfo.finishedPlayerIds?.includes(p.id)}
                                          />
                                      ))}
                                  </div>
                              )}
                          </>
                      )
                  })()}
              </div>
            </div>
        ) : postGameSummary ? (
            <PostGameSummary
                summary={postGameSummary}
                players={players}
                onNewGame={() => { setPostGameSummary(null); setView('scoreboard'); }}
                onRematch={handleRematch}
            />
        ) : view === 'scoreboard' ? (
            <GameSetup
                allPlayers={players}
                lastPlayedPlayerIds={lastPlayedPlayerIds}
                gameLog={completedGamesLog}
                onGameStart={handleGameStart}
            />
        ) : view === 'playerManager' ? (
            <PlayerManager
                players={players}
                onAddPlayer={() => setModalState({ view: 'playerEditor' })}
                onEditPlayer={(p) => setModalState({ view: 'playerEditor', player: p })}
                onDeletePlayer={deletePlayer}
                onViewPlayerStats={handleViewPlayerStats}
            />
        ) : view === 'stats' ? (
            <StatsView stats={stats} players={players} />
        ) : view === 'tournament' ? (
             <TournamentView
                tournaments={tournaments}
                players={players}
                onCreateTournament={handleCreateTournament}
                onStartMatch={handleStartTournamentMatch}
            />
        ) : null}
      </main>

    </div>
  );
};

export default App;