import PlayerPosition from '../enums/PlayerPosition';

type Player = {
  id: number;
  position: PlayerPosition;
  name: string;
  strength: number;
  //isStarter: boolean; // Can be implemented in the future instead of having a list of starters in the Team
  //isSub: boolean; // Can be implemented in the future instead of having a list of subs in the Team
};

export default Player;
