
export type Player = {
  id: string;
  name: string;
  avatar: string; // Base64 Data URL for user images, or SVG path for predefined
};

export type View = 'scoreboard' | 'playerManager' | 'stats';

export type PlayerSlot = 'player1' | 'player2';

export type GameMode = 'round-robin' | 'team';

export type ModalState = 
  | { view: 'closed' } 
  | { view: 'playerEditor'; player?: Player } 
  | { view: 'camera'; context: { originalPlayer?: Player, name: string, avatar: string }};

// --- NEW STATS TYPES ---
export type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  totalTurns: number;
  totalScore: number;
};

export type GameStats = {
  [playerId: string]: PlayerStats;
};

export type AllStats = {
  [gameType: string]: GameStats;
};