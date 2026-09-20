import PlayerPosition from '../enums/PlayerPosition';

type Player = {
  id: `${string}-${string}-${string}-${string}-${string}`;
  position: PlayerPosition;
  name: string;
  strength: number;
  age: number;
  xp: number;
  isStarter: boolean;
  isSub: boolean;
};

export default Player;
