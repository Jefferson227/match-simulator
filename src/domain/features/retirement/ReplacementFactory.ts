import { RandomProvider } from '../match-simulation/types';
import { Gender, generateName } from './NameGenerator';
import { rollChance } from './RetirementPolicy';
import Player from '../../models/Player';
import Coach from '../../models/Coach';
import { Team } from '../../models/Team';
import LeagueType from '../../enums/LeagueType';
import { getRandomPlayerStrength } from '../../utils/Utils';
import {
  REPLACEMENT_COACH_AGE_RANGE,
  REPLACEMENT_NATIONALITY,
  WOMENS_COACH_FEMALE_CHANCE,
  YOUTH_AGE_RANGE,
  YOUTH_STRENGTH_PENALTY,
} from '../../constants/RetirementConstants';

const MINIMUM_STRENGTH = 1;

/** The gender of a league's players: a men's league fields men, a women's league women. */
export function getPlayerGender(leagueType: LeagueType): Gender {
  return leagueType === 'womens' ? 'female' : 'male';
}

/** The rounded mean strength of `team`'s squad without `retiree`; the retiree's own when alone. */
function getRemainingSquadStrength(team: Team, retiree: Player): number {
  const remaining = team.players.filter((player) => player.id !== retiree.id);
  if (!remaining.length) return retiree.strength;

  const total = remaining.reduce((sum, player) => sum + player.strength, 0);
  return Math.round(total / remaining.length);
}

/**
 * The generated player who takes `retiree`'s place in `team`: same position, 17–20 years old, and
 * `YOUTH_STRENGTH_PENALTY` weaker than a player the seed loader would give the rest of the squad.
 *
 * Draws, in order: the age, the strength, then the name.
 */
export function createYouthPlayer(
  retiree: Player,
  team: Team,
  gender: Gender,
  takenNames: ReadonlySet<string>,
  rng: RandomProvider
): Player {
  const age = rng.nextInt(YOUTH_AGE_RANGE[0], YOUTH_AGE_RANGE[1]);
  const strength = Math.max(
    MINIMUM_STRENGTH,
    getRandomPlayerStrength(getRemainingSquadStrength(team, retiree), rng) - YOUTH_STRENGTH_PENALTY
  );
  const name = generateName({ gender, kind: 'player', takenNames, avoidName: retiree.name, rng });

  return {
    id: crypto.randomUUID(),
    position: retiree.position,
    name,
    strength,
    age,
    nationalities: [REPLACEMENT_NATIONALITY],
    xp: 0,
    isStarter: false,
    isSub: false,
  };
}

/**
 * The generated coach who takes a retired club coach's place: 45–50 years old. A men's club gets a
 * man; a women's club a woman or a man with even odds.
 *
 * Draws, in order: the gender (women's league only), the age, then the name.
 */
export function createReplacementCoach(
  leagueType: LeagueType,
  takenNames: ReadonlySet<string>,
  rng: RandomProvider,
  avoidName?: string
): Coach {
  const gender: Gender =
    leagueType === 'womens' && rollChance(WOMENS_COACH_FEMALE_CHANCE, rng) ? 'female' : 'male';
  const age = rng.nextInt(REPLACEMENT_COACH_AGE_RANGE[0], REPLACEMENT_COACH_AGE_RANGE[1]);
  const name = generateName({ gender, kind: 'coach', takenNames, avoidName, rng });

  return { name, age, nationalities: [REPLACEMENT_NATIONALITY] };
}
