/**
 * Moves every player's strength as their club plays (MS-115). The rules live in
 * `features/strength-progression/`; the spec is `wiki/specs/player-strength-progression.md`.
 */
import { advancePlayer } from '../features/strength-progression/ProgressionPolicy';
import { StrengthRange } from '../features/strength-progression/StrengthRange';
import { RandomProvider } from '../features/match-simulation/types';
import { Team } from '../models/Team';
import { getRandomNumber } from '../utils/Utils';

const defaultRng: RandomProvider = { nextInt: getRandomNumber };

/**
 * `team` after it played `gamesPlayed` more games in a division owning `range`. Every player of the
 * squad advances once per game, in order, whether they took part or not, against the club's morale
 * as it stands now. A club that played no games comes back as it was.
 */
function progressTeamPlayers(
  team: Team,
  gamesPlayed: number,
  range: StrengthRange,
  rng: RandomProvider = defaultRng
): Team {
  if (gamesPlayed <= 0) return team;

  return {
    ...team,
    players: team.players.map((player) => {
      let progressed = player;
      for (let game = 0; game < gamesPlayed; game++) {
        progressed = advancePlayer(progressed, team.morale, range, rng);
      }
      return progressed;
    }),
  };
}

export default { progressTeamPlayers };
