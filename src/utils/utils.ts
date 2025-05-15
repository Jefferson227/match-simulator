import { Player } from '../types';

function addPlayerAttributes(players: Player[]): Player[] {
  return players
    .map((player) => {
      const updatedPlayer = { ...player };
      updatedPlayer.id = Math.floor(Math.random() * 10000);
      updatedPlayer.order = getPlayerOrder(player.position);
      return updatedPlayer;
    })
    .sort((a, b) => {
      if ((a.order ?? 0) < (b.order ?? 0)) {
        return -1; // a comes before b
      }
      if ((a.order ?? 0) > (b.order ?? 0)) {
        return 1; // a comes after b
      }
      return 0; // a and b are equal
    });
}

function getPlayerOrder(position: string): number {
  switch (position) {
    case 'GK': {
      return 0;
    }
    case 'DF': {
      return 1;
    }
    case 'MF': {
      return 2;
    }
    case 'FW': {
      return 3;
    }
    default: {
      return 0;
    }
  }
}

const utils = { addPlayerAttributes };

export default utils;
