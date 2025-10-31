
export type Player = {
  id: string;
  name: string;
  avatar: string; // Base64 Data URL for user images, or SVG path for predefined
};

export type View = 'scoreboard' | 'playerManager';

export type PlayerSlot = 'player1' | 'player2';

export type GameMode = 'round-robin' | 'team';

export type ModalState = 
  | { view: 'closed' } 
  | { view: 'playerEditor'; player?: Player } 
  | { view: 'camera'; context: { originalPlayer?: Player, name: string, avatar: string }};