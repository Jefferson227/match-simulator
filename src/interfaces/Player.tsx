interface Player {
  firstName: string;
  lastName: string;
  strength: number;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
}

export default Player;
