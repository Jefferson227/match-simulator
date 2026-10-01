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
  // Match-scoped: the minute a substitute came on. Absent means on the pitch since kickoff.
  enteredAtMinute?: number;
  // Match-scoped: the minute a player was substituted off. Absent means not substituted off.
  leftAtMinute?: number;
  xp: number;
  // Season-scoped: matches played this season, counted when each round ends. Reset on NEW SEASON.
  seasonGames: number;
  // Season-scoped: goals scored this season, shootout kicks excluded. Reset on NEW SEASON.
  seasonGoals: number;
  isStarter: boolean;
  isSub: boolean;
};

export default Player;
