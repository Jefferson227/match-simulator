import PlayerPosition from '../enums/PlayerPosition';

type Player = {
  id: `${string}-${string}-${string}-${string}-${string}`;
  position: PlayerPosition;
  name: string;
  strength: number;
  age: number;
  // ISO 3166-1 alpha-3, primary first. UK home nations use FIFA codes (ENG, SCO, WAL, NIR).
  nationalities: string[];
  // Match-scoped: set at kickoff, recomputed each tick, never persisted.
  stamina?: number;
  xp: number;
  isStarter: boolean;
  isSub: boolean;
};

export default Player;
