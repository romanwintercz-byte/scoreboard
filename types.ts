// Fix: The Player type was being imported from a non-existent file.
// It is now defined and exported directly from this file to resolve the error.
export type Player = {
  id: string;
  name: string;
  avatar: string;
};

export type View = 'scoreboard' | 'playerManager' | 'stats';

export type GameMode = 'round-robin' | 'team';

export type ModalState = 
  | { view: 'closed' } 
  | { view: 'playerEditor'; player?: Player } 
  | { view: 'playerStats'; player: Player }
  | { view: 'camera'; context: { originalPlayer?: Player, name: string, avatar: string }};
  
export type GameInfo = {
  type: string;
  mode: GameMode;
  playerIds: string[];
  targetScore: number;
  currentPlayerIndex: number;
  endCondition: 'sudden-death' | 'equal-innings';
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
  highestScoreInGame: number;
};

export type GameStats = {
  [playerId: string]: PlayerStats;
};

export type AllStats = {
  [gameType: string]: GameStats;
};

export type GameRecord = {
  playerId: string;
  gameType: string;
  score: number;
  turns: number;
  date: string; // ISO string for timestamp
  isWin: boolean;
};