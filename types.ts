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
  allowOvershooting?: boolean;
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
export type TournamentFormat = 'round-robin' | 'knockout' | 'combined';

export type Match = {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  status: 'pending' | 'completed' | 'bye';
  result?: {
    player1Score: number;
    player2Score: number;
    winnerId: string | null;
  };
  round?: number;
  nextMatchId?: string | null;
  groupId?: string; // For combined format group stage
};

export type TournamentSettings = {
  format: TournamentFormat;
  gameTypeKey: string;
  targetScore: number;
  endCondition: 'sudden-death' | 'equal-innings';
  seeding?: 'random' | 'average';
  numGroups?: number; // For combined format
  playersAdvancing?: number; // For combined format
};

export type Tournament = {
  id: string;
  name: string;
  playerIds: string[];
  format: TournamentFormat;
  settings: TournamentSettings;
  matches: Match[];
  status: 'ongoing' | 'completed';
  createdAt: string;
  stage?: 'group' | 'knockout'; // For combined format
};

// --- IMPORT/EXPORT TYPES ---
export type FullExportData = {
  type: 'ScoreCounterFullBackup';
  version: number;
  exportedAt: string;
  data: {
    players: Player[];
    stats: AllStats;
    completedGamesLog: GameRecord[];
    tournaments: Tournament[];
  };
};

export type SinglePlayerExportData = {
  type: 'ScoreCounterPlayerExport';
  version: number;
  exportedAt: string;
  playerProfile: Player;
  playerStats: AllStats;
  gameLog: GameRecord[];
};

export type SingleTournamentExportData = {
  type: 'ScoreCounterTournamentExport';
  version: number;
  exportedAt: string;
  tournament: Tournament;
  players: Player[];
};

