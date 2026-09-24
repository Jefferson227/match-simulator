/**
 * Deciding a knockout tie.
 *
 * The cascade is the same in all three divisions (A1 Art. 17, A2 Art. 16, A3 Art. 17) and, for
 * two-legged ties, the Copa (Art. 13 §1):
 *
 * 1. points across the tie — every phase restarts at zero;
 * 2. goal difference over the two legs — **two-legged ties only**; a single-legged phase goes
 *    straight from a draw to penalties (Copa Art. 13 §1, Supercopa Art. 10);
 * 3. a penalty shootout.
 *
 * Steps 2 and 3 are the phase's declared `tiebreakers`. Série D 2026's playoff declares goal
 * difference then `seed` instead, and never shoots out (REC D 2026 Art. 21 §§4–5).
 *
 * **No away goals and no extra time** — neither appears in any REC.
 */
import Match from '../../models/Match';
import PenaltyShootout from '../../models/PenaltyShootout';
import { Team } from '../../models/Team';
import { KnockoutTiebreaker } from '../../models/ChampionshipPhase';
import { RandomProvider } from '../match-simulation/types';

export type TieOutcome = {
  tieId: string;
  winner: Team;
  loser: Team;
  /** Set only when the tie went to penalties. */
  shootout?: PenaltyShootout;
};

export type TieResolutionDependencies = {
  rng: RandomProvider;
};

type TieTally = {
  team: Team;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
};

/** Groups a phase's matches into ties, keeping the order the first legs were generated in. */
export function groupMatchesIntoTies(matches: Match[]): Map<string, Match[]> {
  const ties = new Map<string, Match[]>();

  for (const match of matches) {
    if (!match.tieId) continue;
    const legs = ties.get(match.tieId) ?? [];
    legs.push(match);
    ties.set(match.tieId, legs);
  }

  for (const legs of ties.values()) {
    legs.sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));
  }

  return ties;
}

function tally(legs: Match[]): TieTally[] {
  const tallies = new Map<string, TieTally>();

  const record = (team: Team, points: number, goalsFor: number, goalsAgainst: number) => {
    const existing = tallies.get(team.id) ?? {
      team,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };
    existing.points += points;
    existing.goalsFor += goalsFor;
    existing.goalsAgainst += goalsAgainst;
    tallies.set(team.id, existing);
  };

  for (const leg of legs) {
    const homeWon = leg.homeTeamScore > leg.awayTeamScore;
    const awayWon = leg.awayTeamScore > leg.homeTeamScore;
    record(leg.homeTeam, homeWon ? 3 : awayWon ? 0 : 1, leg.homeTeamScore, leg.awayTeamScore);
    record(leg.awayTeam, awayWon ? 3 : homeWon ? 0 : 1, leg.awayTeamScore, leg.homeTeamScore);
  }

  return [...tallies.values()];
}

/**
 * Decides a tie from its legs. `deps.rng` is only reached when the tie is level on both points and
 * goal difference; every draw goes through it, never `Math.random`.
 */
export function resolveTie(
  legs: Match[],
  deps: TieResolutionDependencies,
  shootout?: (
    legs: Match[],
    contenders: [Team, Team],
    deps: TieResolutionDependencies
  ) => {
    winner: Team;
    shootout: PenaltyShootout;
  },
  tiebreakers: KnockoutTiebreaker[] = ['goal-difference', 'penalties']
): TieOutcome {
  if (!legs.length) throw new Error('A tie needs at least one leg to be resolved.');

  const tieId = legs[0].tieId;
  if (!tieId) throw new Error('A tie leg must carry its tieId.');

  const tallies = tally(legs);
  if (tallies.length !== 2) {
    throw new Error(`Tie ${tieId} has ${tallies.length} clubs; a tie is between exactly two.`);
  }

  const [a, b] = tallies;
  const aWins = { tieId, winner: a.team, loser: b.team };
  const bWins = { tieId, winner: b.team, loser: a.team };

  const byPoints = b.points - a.points;
  if (byPoints !== 0) return byPoints < 0 ? aWins : bWins;

  // The phase declares which steps it uses, in order. A single-legged tie has no goal-difference
  // step — a drawn match goes straight to penalties (Copa Art. 13 §1, Supercopa Art. 10).
  for (const tiebreaker of tiebreakers) {
    if (tiebreaker === 'goal-difference') {
      const differenceA = a.goalsFor - a.goalsAgainst;
      const differenceB = b.goalsFor - b.goalsAgainst;
      if (differenceA !== differenceB) return differenceA > differenceB ? aWins : bWins;
      continue;
    }

    if (tiebreaker === 'seed') {
      // `higher-seed` hosting gives the last leg to the better seed (the repository rejects `seed`
      // under any other hosting rule), so the last leg's home club is the better seed.
      return legs[legs.length - 1].homeTeam.id === a.team.id ? aWins : bWins;
    }

    if (!shootout) {
      throw new Error(
        `Tie ${tieId} is level on points and goal difference and no shootout was supplied.`
      );
    }

    const result = shootout(legs, [a.team, b.team], deps);
    const loser = result.winner.id === a.team.id ? b.team : a.team;
    return { tieId, winner: result.winner, loser, shootout: result.shootout };
  }

  throw new Error(`Tie ${tieId} is still level after every tiebreaker its phase declares.`);
}
