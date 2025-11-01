// Fix: The Player type was being imported from a non-existent file.
// It is now defined and exported directly from this file to resolve the error.
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

export type H2HStats = {
  [opponentId: string]: {
    wins: number;
    losses: number;
    draws: number;
    opponentName: string;
    opponentAvatar: string;
  };
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

// --- Additional type for enriched player data for UI ---
export type PlayerCardData = {
    movingAverage: number;
    trend: 'improving' | 'stagnating' | 'worsening';
    recentForm: GameRecord['result'][];
}
