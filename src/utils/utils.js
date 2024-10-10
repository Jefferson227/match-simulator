function addPlayerAttributes(players) {
  return players
    .map((player) => {
      player.id = crypto.randomUUID();
      player.order = getPlayerOrder(player.position);
      return player;
    })
    .sort((a, b) => {
      if (a.order < b.order) {
        return -1; // a comes before b
      }
      if (a.order > b.order) {
        return 1; // a comes after b
      }
      return 0; // a and b are equal
    });
}

function getPlayerOrder(position) {
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
