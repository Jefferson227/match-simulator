/**
 * Penalty shootouts, simulated kick by kick.
 *
 * The RECs send a level tie straight to penalties — no away goals, no extra time (A1 Art. 17,
 * A2 Art. 16, A3 Art. 17; Supercopa Art. 10). Format: five kicks a side, alternating, then sudden
 * death in alternating pairs.
 *
 * Each kick is a contested roll between the taker's strength and the opposing goalkeeper's, using
 * the same `StrengthResolver` the match engine uses for shots
 * (`src/domain/features/match-simulation/ActionStrategies.ts`), so a shootout obeys the same
 * strength and morale model as the match that produced it.
 *
 * A shootout never changes the recorded match score. It only decides who advances.
 */
import Match from '../../models/Match';
import PenaltyShootout, { PenaltyKick } from '../../models/PenaltyShootout';
import Player from '../../models/Player';
import { Team } from '../../models/Team';
import {
  getShooterStrengthForDispute,
  getStarters,
  getTeamStrengthForDispute,
} from '../match-simulation/StrengthResolver';
import { TieResolutionDependencies } from './TieResolution';

/** Kicks each side takes before sudden death. */
const REGULATION_KICKS = 5;

/**
 * Sudden-death pairs attempted before the tie is drawn instead. Only reachable when both sides
 * convert every kick — which happens with degenerate fixtures where every strength is 1 — and it
 * keeps a pathological input from looping forever.
 */
const MAX_SUDDEN_DEATH_PAIRS = 50;

/** Cycles the starters in order, so nobody kicks twice until everyone eligible has kicked. */
function takerAt(team: Team, kickIndex: number): Player | undefined {
  const eligible = getStarters(team);
  if (!eligible.length) return undefined;
  return eligible[kickIndex % eligible.length];
}

function kickIsScored(
  taker: Player | undefined,
  takerTeam: Team,
  goalkeeperTeam: Team,
  deps: TieResolutionDependencies
): boolean {
  const takerStrength = taker ? getShooterStrengthForDispute(taker, takerTeam) : 1;
  const goalkeeperStrength = getTeamStrengthForDispute(goalkeeperTeam, 'GK');

  const takerRoll = deps.rng.nextInt(1, Math.max(1, takerStrength));
  const goalkeeperRoll = deps.rng.nextInt(1, Math.max(1, goalkeeperStrength));

  return takerRoll >= goalkeeperRoll;
}

/** True once the remaining regulation kicks cannot change the result. */
function isDecidedEarly(
  homeScore: number,
  awayScore: number,
  homeTaken: number,
  awayTaken: number
): boolean {
  const homeRemaining = Math.max(0, REGULATION_KICKS - homeTaken);
  const awayRemaining = Math.max(0, REGULATION_KICKS - awayTaken);

  return homeScore > awayScore + awayRemaining || awayScore > homeScore + homeRemaining;
}

export function simulatePenaltyShootout(
  legs: Match[],
  contenders: [Team, Team],
  deps: TieResolutionDependencies
): { winner: Team; shootout: PenaltyShootout } {
  // The shootout is taken at the tie's decisive leg, so its host is the shootout's home side.
  const decidingLeg = legs[legs.length - 1];
  const home = decidingLeg?.homeTeam ?? contenders[0];
  const away = decidingLeg?.awayTeam ?? contenders[1];

  const kicks: PenaltyKick[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let homeTaken = 0;
  let awayTaken = 0;

  const take = (side: 'home' | 'away') => {
    const takerTeam = side === 'home' ? home : away;
    const goalkeeperTeam = side === 'home' ? away : home;
    const index = side === 'home' ? homeTaken : awayTaken;
    const taker = takerAt(takerTeam, index);
    const scored = kickIsScored(taker, takerTeam, goalkeeperTeam, deps);

    kicks.push({ team: side, playerId: taker?.id ?? '', scored });

    if (side === 'home') {
      homeTaken += 1;
      if (scored) homeScore += 1;
    } else {
      awayTaken += 1;
      if (scored) awayScore += 1;
    }
  };

  for (let round = 0; round < REGULATION_KICKS; round++) {
    take('home');
    if (isDecidedEarly(homeScore, awayScore, homeTaken, awayTaken)) break;

    take('away');
    if (isDecidedEarly(homeScore, awayScore, homeTaken, awayTaken)) break;
  }

  if (homeScore === awayScore) {
    for (let pair = 0; pair < MAX_SUDDEN_DEATH_PAIRS; pair++) {
      take('home');
      take('away');
      if (homeScore !== awayScore) break;
    }
  }

  // Only reachable when every kick on both sides was converted for 50 straight pairs.
  const winner =
    homeScore === awayScore
      ? deps.rng.nextInt(0, 1) === 0
        ? home
        : away
      : homeScore > awayScore
        ? home
        : away;

  return { winner, shootout: { homeScore, awayScore, kicks } };
}

export default simulatePenaltyShootout;
