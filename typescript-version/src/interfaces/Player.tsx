interface Player {
  id: number;
  name: string;
  strength: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
}

export default Player;
