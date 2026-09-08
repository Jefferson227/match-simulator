/**
 * Progress through a championship's declared `phases`.
 *
 * Finishing the last round of a phase does not end the competition — it resolves that phase: rank
 * the table, take the qualifiers, zero the standings, and generate the next phase's fixtures.
 * Every phase restarts at zero points (REC A1 Art. 12 par. único, A2 Art. 11, A3 Art. 11).
 */
import { Championship } from '../../models/Championship';
import ChampionshipPhase, {
  KnockoutTiebreaker,
  RoundRobinPhase,
} from '../../models/ChampionshipPhase';
import Match from '../../models/Match';
import Round from '../../models/Round';
import PenaltyShootout from '../../models/PenaltyShootout';
import Standing from '../../models/Standing';
import { Team } from '../../models/Team';
import { RandomProvider } from '../match-simulation/types';
import { rankStandings } from '../standings/StandingsComparator';
import {
  BracketEntrant,
  BracketSeeding,
  buildKnockoutPhaseRounds,
} from '../fixture-generation/KnockoutBracket';
import { groupMatchesIntoTies, resolveTie, TieOutcome } from './TieResolution';
import { simulatePenaltyShootout } from './PenaltyShootoutSimulator';

export type PhaseProgressionDependencies = {
  rng: RandomProvider;
};

/** Zeroed standings for a set of clubs, in the order given. */
export function buildEmptyStandings(teams: Team[]): Standing[] {
  return teams.map((team, index) => ({
    team,
    position: index + 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

/** Adds a phase's table into the running total, keeping clubs that have already been knocked out. */
export function mergeAccumulatedStandings(
  accumulated: Standing[],
  phaseStandings: Standing[]
): Standing[] {
  const totals = new Map<string, Standing>();

  for (const standing of accumulated) {
    totals.set(standing.team.id, { ...standing });
  }

  for (const standing of phaseStandings) {
    const existing = totals.get(standing.team.id);
    if (!existing) {
      totals.set(standing.team.id, { ...standing });
      continue;
    }

    totals.set(standing.team.id, {
      ...existing,
      wins: existing.wins + standing.wins,
      draws: existing.draws + standing.draws,
      losses: existing.losses + standing.losses,
      goalsFor: existing.goalsFor + standing.goalsFor,
      goalsAgainst: existing.goalsAgainst + standing.goalsAgainst,
      points: existing.points + standing.points,
    });
  }

  return rankStandings([...totals.values()]);
}

/** Which group each club played in during a group stage, read back off the generated fixtures. */
export function groupsOfPhase(rounds: Round[], phaseIndex: number): Map<string, number> {
  const groups = new Map<string, number>();

  for (const round of rounds) {
    if (round.phaseIndex !== phaseIndex) continue;
    for (const match of round.matches) {
      if (match.group === undefined) continue;
      groups.set(match.homeTeam.id, match.group);
      groups.set(match.awayTeam.id, match.group);
    }
  }

  return groups;
}

function roundsOfPhase(rounds: Round[], phaseIndex: number): Round[] {
  return rounds.filter((round) => round.phaseIndex === phaseIndex);
}

function matchesOfPhase(rounds: Round[], phaseIndex: number): Match[] {
  return roundsOfPhase(rounds, phaseIndex).flatMap((round) => round.matches);
}

function accumulatedFor(accumulated: Standing[], teamId: string): Standing | undefined {
  return accumulated.find((standing) => standing.team.id === teamId);
}

/** Who played a phase, read off its fixtures — the only source a competition with no table has. */
function participantsOfPhase(matches: Match[]): Team['id'][] {
  const ids: Team['id'][] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (seen.has(team.id)) continue;
      seen.add(team.id);
      ids.push(team.id);
    }
  }

  return ids;
}

/** The clubs going through from a completed round-robin phase, ordered best first. */
export function qualifiersFromRoundRobin(
  phase: RoundRobinPhase,
  standings: Standing[],
  groups: Map<string, number>,
  accumulated: Standing[]
): BracketEntrant[] {
  const ranked = rankStandings(standings);

  if (phase.numberOfGroups <= 1) {
    return ranked.slice(0, phase.advancingPerGroup).map((standing, index) => ({
      team: standing.team,
      seed: index + 1,
      accumulated: accumulatedFor(accumulated, standing.team.id),
    }));
  }

  const qualified: { standing: Standing; group: number; groupPosition: number; overall: number }[] =
    [];
  const seen = new Map<number, number>();

  ranked.forEach((standing, overall) => {
    const group = groups.get(standing.team.id);
    if (group === undefined) return;

    const taken = seen.get(group) ?? 0;
    if (taken >= phase.advancingPerGroup) return;

    seen.set(group, taken + 1);
    qualified.push({ standing, group, groupPosition: taken + 1, overall });
  });

  // Group winners first, then runners-up, each block in table order — a deterministic seeding for
  // a bracket the REC describes only as "the two qualifiers of each group".
  qualified.sort((a, b) => a.groupPosition - b.groupPosition || a.overall - b.overall);

  return qualified.map((entry, index) => ({
    team: entry.standing.team,
    seed: index + 1,
    group: entry.group,
    groupPosition: entry.groupPosition,
    accumulated: accumulatedFor(accumulated, entry.standing.team.id),
  }));
}

export type KnockoutPhaseResolution = {
  /** One per tie, in the order the ties were generated — which is the bracket order. */
  outcomes: TieOutcome[];
  /** Shootout to record, keyed by tie. */
  shootoutByTie: Map<string, PenaltyShootout>;
  /** Which leg decided each tie, so the shootout lands on the right match. */
  decidingLegByTie: Map<string, number>;
};

/** Resolves every tie of a completed knockout phase, in the order the ties were generated. */
export function resolveKnockoutPhase(
  matches: Match[],
  deps: PhaseProgressionDependencies,
  tiebreakers?: KnockoutTiebreaker[]
): KnockoutPhaseResolution {
  const ties = groupMatchesIntoTies(matches);
  const outcomes: TieOutcome[] = [];
  const shootoutByTie = new Map<string, PenaltyShootout>();
  const decidingLegByTie = new Map<string, number>();

  for (const [tieId, legs] of ties) {
    const outcome = resolveTie(legs, deps, simulatePenaltyShootout, tiebreakers);
    outcomes.push(outcome);
    if (outcome.shootout) {
      shootoutByTie.set(tieId, outcome.shootout);
      decidingLegByTie.set(tieId, legs[legs.length - 1].leg ?? legs.length);
    }
  }

  return { outcomes, shootoutByTie, decidingLegByTie };
}

/**
 * Records each shootout on the leg that decided its tie, leaving the match score alone — a shootout
 * never changes the recorded result, only who advances.
 *
 * Matches are addressed by `(tieId, leg)`, never by `Match.id`: `crypto.randomUUID` is stubbed to a
 * constant under Jest (`src/setupTests.ts`), so an id-keyed lookup silently collapses every match
 * into one.
 */
function withShootoutsRecorded(
  rounds: Round[],
  phaseIndex: number,
  resolution: KnockoutPhaseResolution
): Round[] {
  if (!resolution.shootoutByTie.size) return rounds;

  return rounds.map((round) => {
    if (round.phaseIndex !== phaseIndex) return round;

    return {
      ...round,
      matches: round.matches.map((match) => {
        if (!match.tieId) return match;
        const shootout = resolution.shootoutByTie.get(match.tieId);
        if (!shootout) return match;
        if (match.leg !== resolution.decidingLegByTie.get(match.tieId)) return match;
        return { ...match, penaltyShootout: shootout };
      }),
    };
  });
}

function entrantsFromOutcomes(outcomes: TieOutcome[], accumulated: Standing[]): BracketEntrant[] {
  return outcomes.map((outcome, index) => ({
    team: outcome.winner,
    seed: index + 1,
    accumulated: accumulatedFor(accumulated, outcome.winner.id),
  }));
}

/** How the next phase pairs its entrants, given the phase they came out of and the one they enter. */
export function seedingForNextPhase(
  completed: ChampionshipPhase,
  next?: ChampionshipPhase
): BracketSeeding {
  // The cups draw their pairings afresh at every phase, so there is no bracket to carry through.
  if (next?.kind === 'knockout' && next.secondLegHost === 'drawn') return 'draw';
  if (completed.kind === 'knockout') return 'bracket';
  return completed.numberOfGroups > 1 ? 'groups' : 'table';
}

/** True once every round of `phaseIndex` has been played. */
export function isPhaseComplete(rounds: Round[], phaseIndex: number): boolean {
  const phaseRounds = roundsOfPhase(rounds, phaseIndex);
  return phaseRounds.length > 0 && phaseRounds.every((round) => round.status === 'ended');
}

/**
 * Called when the round that just ended was the last of its phase. Resolves the phase and, if
 * another follows, generates it.
 *
 * Returns the championship untouched when it is not phased, or when the phase is not finished.
 */
export function resolveCompletedPhase(
  championship: Championship,
  deps: PhaseProgressionDependencies
): Championship {
  const phases = championship.phases;
  if (!phases?.length) return championship;

  const phaseIndex = championship.currentPhaseIndex ?? 0;
  const phase = phases[phaseIndex];
  if (!phase) return championship;

  const rounds = championship.matchContainer.rounds;
  if (!isPhaseComplete(rounds, phaseIndex)) return championship;

  const phaseStandings = rankStandings(championship.standings);
  const accumulated = mergeAccumulatedStandings(
    championship.accumulatedStandings ?? [],
    phaseStandings
  );

  const phaseMatches = matchesOfPhase(rounds, phaseIndex);
  const participants = [...(championship.phaseParticipants ?? [])];
  participants[phaseIndex] = phaseStandings.length
    ? phaseStandings.map((standing) => standing.team.id)
    : participantsOfPhase(phaseMatches);

  let updatedRounds = rounds;
  let entrants: BracketEntrant[];

  if (phase.kind === 'round-robin') {
    entrants = qualifiersFromRoundRobin(
      phase,
      phaseStandings,
      groupsOfPhase(rounds, phaseIndex),
      accumulated
    );
  } else {
    const resolution = resolveKnockoutPhase(phaseMatches, deps, phase.tiebreakers);
    updatedRounds = withShootoutsRecorded(rounds, phaseIndex, resolution);
    entrants = entrantsFromOutcomes(resolution.outcomes, accumulated);
  }

  const base: Championship = {
    ...championship,
    accumulatedStandings: accumulated,
    phaseParticipants: participants,
    survivingTeamIds: entrants.map((entrant) => entrant.team.id),
    firstPhaseStandings:
      phaseIndex === 0 ? phaseStandings : (championship.firstPhaseStandings ?? phaseStandings),
    matchContainer: { ...championship.matchContainer, rounds: updatedRounds },
  };

  const nextPhase = phases[phaseIndex + 1];
  if (!nextPhase) {
    // The final is decided; the competition is over. `isChampionshipOver` reads this.
    return base;
  }

  if (nextPhase.kind !== 'knockout') {
    throw new Error(
      `Phase '${nextPhase.name}' is a ${nextPhase.kind} phase following phase ${phaseIndex}; only knockout phases can follow another phase.`
    );
  }

  // Staggered entry: a cup's clubs join at different phases, so the next phase's field is the
  // survivors plus whoever enters now. There are no byes (Copa Arts. 14–17).
  const joining = championship.phaseEntrants?.[phaseIndex + 1] ?? [];
  const field: BracketEntrant[] = [
    ...entrants,
    ...joining.map((team, index) => ({
      team,
      seed: entrants.length + index + 1,
      accumulated: accumulatedFor(accumulated, team.id),
    })),
  ];

  const lastRoundNumber = updatedRounds.reduce((last, round) => Math.max(last, round.number), 0);
  const { rounds: nextRounds } = buildKnockoutPhaseRounds(
    field,
    nextPhase,
    seedingForNextPhase(phase, nextPhase),
    phaseIndex + 1,
    lastRoundNumber + 1,
    deps.rng
  );

  const allRounds = [...updatedRounds, ...nextRounds];

  return {
    ...base,
    currentPhaseIndex: phaseIndex + 1,
    survivingTeamIds: field.map((entrant) => entrant.team.id),
    // Every phase restarts at zero, and only the survivors have a table. A competition with no
    // league table keeps none at all.
    standings:
      championship.hasLeagueTable === false
        ? []
        : buildEmptyStandings(field.map((entrant) => entrant.team)),
    matchContainer: {
      ...championship.matchContainer,
      rounds: allRounds,
      totalRounds: allRounds.length,
    },
  };
}

/** True once the last phase's final has been decided. */
export function isPhasedChampionshipOver(championship: Championship): boolean {
  const phases = championship.phases;
  if (!phases?.length) return false;

  return isPhaseComplete(championship.matchContainer.rounds, phases.length - 1);
}

/**
 * The final classification of a phased championship: points accumulated across every phase, with
 * the champion and runner-up forced to 1st and 2nd (REC A1 Art. 27, REC A3 Art. 21) — a club can
 * win the title from outside the top two on accumulated points.
 *
 * An unphased championship has no phases to accumulate, so its live table is its classification.
 */
export function buildFinalClassification(championship: Championship): Standing[] {
  if (!championship.phases?.length) return championship.standings;

  // `initialisePhaseState` seeds `accumulatedStandings` as an empty array, so an *empty* table means
  // "nothing accumulated yet", not "everyone on zero" — fall back to the live table.
  const accumulated = rankStandings(
    championship.accumulatedStandings?.length
      ? championship.accumulatedStandings
      : championship.standings
  );
  if (!isPhasedChampionshipOver(championship)) return accumulated;

  const championId = championship.survivingTeamIds?.[0];
  const finalists = championship.phaseParticipants?.[championship.phases.length - 1] ?? [];
  const runnerUpId = finalists.find((teamId) => teamId !== championId);

  const podium = [championId, runnerUpId].filter(
    (teamId): teamId is Team['id'] => teamId !== undefined
  );
  if (!podium.length) return accumulated;

  const ordered = [
    ...podium
      .map((teamId) => accumulated.find((standing) => standing.team.id === teamId))
      .filter((standing): standing is Standing => Boolean(standing)),
    ...accumulated.filter((standing) => !podium.includes(standing.team.id)),
  ];

  return ordered.map((standing, index) => ({ ...standing, position: index + 1 }));
}

/** Initial phase state for a freshly generated phased championship. */
export function initialisePhaseState(championship: Championship): Championship {
  if (!championship.phases?.length) return championship;

  // With staggered entry only the first phase's entrants are in the competition on day one.
  const startingField = championship.phaseEntrants?.[0]?.length
    ? championship.phaseEntrants[0]
    : championship.teams;

  return {
    ...championship,
    currentPhaseIndex: 0,
    survivingTeamIds: startingField.map((team) => team.id),
    phaseParticipants: [],
    accumulatedStandings: [],
    firstPhaseStandings: undefined,
  };
}
