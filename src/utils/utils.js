function addPlayerAttributes(players) {
  return players.map((player) => {
    player.id = crypto.randomUUID();
    return player;
  });
}

const utils = { addPlayerAttributes };

export default utils;
