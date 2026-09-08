/**
 * Penalty shootouts.
 *
 * PROVISIONAL (MS-103 task 04). This decides a level tie through the injected `RandomProvider` so
 * phase progression works end to end, but it does not yet simulate the kicks. Task 05 replaces the
 * body with a kick-by-kick simulation contested on player strength.
 */
import Match from '../../models/Match';
import PenaltyShootout from '../../models/PenaltyShootout';
import { Team } from '../../models/Team';
import { TieResolutionDependencies } from './TieResolution';

export function simulatePenaltyShootout(
  _legs: Match[],
  contenders: [Team, Team],
  deps: TieResolutionDependencies
): { winner: Team; shootout: PenaltyShootout } {
  const [home, away] = contenders;
  const homeWins = deps.rng.nextInt(0, 1) === 0;

  return {
    winner: homeWins ? home : away,
    shootout: {
      homeScore: homeWins ? 1 : 0,
      awayScore: homeWins ? 0 : 1,
      kicks: [],
    },
  };
}

export default simulatePenaltyShootout;
