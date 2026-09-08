/**
 * Fixture generation for both the flat round-robin the engine has always played and the phased
 * formats declared in `Championship.phases`.
 *
 * The entry point is `createMatches`. With no `phases` it reproduces the legacy mirrored double
 * round-robin exactly — that path is what every men's division uses and must not change.
 *
 * See `wiki/concepts/phases-and-knockouts.md` for the regulations behind the phase shapes.
 */
import Match from '../../models/Match';
import MatchContainer from '../../models/MatchContainer';
import Round from '../../models/Round';
import { Team } from '../../models/Team';
import ChampionshipPhase, { RoundRobinPhase } from '../../models/ChampionshipPhase';
import { BracketEntrant, buildKnockoutPhaseRounds } from './KnockoutBracket';

function createMatch(homeTeam: Team, awayTeam: Team, fields: Partial<Match> = {}): Match {
  return {
    id: crypto.randomUUID(),
    homeTeam,
    homeTeamScore: 0,
    awayTeamScore: 0,
    awayTeam,
    scorers: [],
    ...fields,
  };
}

/**
 * The circle method: club 0 stays put, the rest rotate one place each round. Preserved verbatim
 * from the original `ChampionshipService.createMatches` so the legacy path is unchanged.
 */
/** Placeholder opponent for an odd field: whoever draws it sits the round out. */
const BYE = null;

export function buildRoundRobinRounds(startingTeams: Team[], legs: 1 | 2): Match[][] {
  if (startingTeams.length < 2) return [];

  // An odd field gets a bye: a placeholder is added to make the rotation work, and the fixture it
  // would have played is dropped. A division whose club count drifts across a season roll-over
  // (task 08) can land on an odd group, and the season must still be playable.
  const teams: (Team | typeof BYE)[] = [...startingTeams];
  if (teams.length % 2 !== 0) teams.push(BYE);

  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const rounds: Match[][] = [];

  for (let round = 0; round < roundsPerLeg; round++) {
    const matches: Match[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      const homeTeam = teams[i];
      const awayTeam = teams[teams.length - 1 - i];
      if (homeTeam === BYE || awayTeam === BYE) continue;
      matches.push(createMatch(homeTeam, awayTeam));
    }
    rounds.push(matches);

    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  if (legs === 1) return rounds;

  const firstLeg = rounds.slice();
  for (const round of firstLeg) {
    rounds.push(round.map((match) => createMatch(match.awayTeam, match.homeTeam)));
  }

  return rounds;
}

/**
 * Deals the field into `numberOfGroups` groups of `teamsPerGroup`, in seed order.
 *
 * REC A3 Art. 12 draws the groups by geographic proximity. The seed data carries no geography, so
 * the split is the declared order — deterministic, and recorded as a simplification in
 * `wiki/concepts/invented-data.md`.
 */
export function splitIntoGroups(
  teams: Team[],
  numberOfGroups: number,
  teamsPerGroup: number
): Team[][] {
  if (numberOfGroups < 1) throw new Error(`A group stage needs at least one group.`);
  if (teams.length < numberOfGroups * 2) {
    throw new Error(
      `Group stage needs at least 2 clubs per group (${numberOfGroups * 2}); received ${teams.length}.`
    );
  }

  // The declared shape when the field fills it — which is every seeded competition's first season.
  const fillsDeclaredShape = teams.length === numberOfGroups * teamsPerGroup;
  const sizes: number[] = [];

  if (fillsDeclaredShape) {
    sizes.push(...Array.from({ length: numberOfGroups }, () => teamsPerGroup));
  } else {
    // A field that has drifted across a roll-over is spread as evenly as the group count allows,
    // so the qualifier count — and therefore the bracket — is unchanged.
    const base = Math.floor(teams.length / numberOfGroups);
    let remainder = teams.length % numberOfGroups;
    for (let group = 0; group < numberOfGroups; group++) {
      sizes.push(base + (remainder > 0 ? 1 : 0));
      if (remainder > 0) remainder -= 1;
    }
  }

  const groups: Team[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    groups.push(teams.slice(cursor, cursor + size));
    cursor += size;
  }

  return groups;
}

/**
 * Builds a round-robin phase. Every group plays its own rotation, and each group's round *n* is
 * merged into a single round *n* — the UI plays one round at a time, so all groups must advance
 * together.
 */
export function buildRoundRobinPhaseRounds(
  teams: Team[],
  phase: RoundRobinPhase,
  phaseIndex: number,
  firstRoundNumber: number
): Round[] {
  const groups =
    phase.numberOfGroups > 1
      ? splitIntoGroups(teams, phase.numberOfGroups, phase.teamsPerGroup)
      : [teams];

  const roundsPerGroup = groups.map((groupTeams) => buildRoundRobinRounds(groupTeams, phase.legs));
  const roundCount = roundsPerGroup.reduce((most, rounds) => Math.max(most, rounds.length), 0);
  const rounds: Round[] = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex++) {
    const matches: Match[] = [];

    for (let group = 0; group < roundsPerGroup.length; group++) {
      const groupRound = roundsPerGroup[group][roundIndex];
      if (!groupRound) continue;

      for (const match of groupRound) {
        matches.push({
          ...match,
          phaseIndex,
          ...(phase.numberOfGroups > 1 ? { group } : {}),
        });
      }
    }

    rounds.push({
      id: crypto.randomUUID(),
      number: firstRoundNumber + roundIndex,
      matches,
      status: 'not-started',
      phaseIndex,
      phaseName: phase.name,
    });
  }

  return rounds;
}

/**
 * Builds the rounds of a single phase from a plain club list.
 *
 * A knockout phase reached this way is seeded straight off the declared order — the case of a
 * competition whose *first* phase is a knockout. Every later knockout phase is built by
 * `KnockoutBracket.buildKnockoutPhaseRounds` from entrants carrying real seeds, groups and
 * accumulated points.
 */
export function buildPhaseRounds(
  teams: Team[],
  phase: ChampionshipPhase,
  phaseIndex: number,
  firstRoundNumber: number
): Round[] {
  if (phase.kind === 'round-robin') {
    return buildRoundRobinPhaseRounds(teams, phase, phaseIndex, firstRoundNumber);
  }

  const entrants: BracketEntrant[] = teams.map((team, index) => ({ team, seed: index + 1 }));
  const seeding = phase.secondLegHost === 'drawn' ? 'draw' : 'table';
  return buildKnockoutPhaseRounds(entrants, phase, seeding, phaseIndex, firstRoundNumber).rounds;
}

function buildLegacyRounds(startingTeams: Team[]): Round[] {
  return buildRoundRobinRounds(startingTeams, 2).map((matches, index) => ({
    id: crypto.randomUUID(),
    number: index + 1,
    matches,
    status: 'not-started',
  }));
}

/**
 * The one entry point. Without `phases` it generates the flat mirrored double round-robin the
 * engine has always played. With `phases` it generates the **first** phase only — every later phase
 * depends on results that do not exist yet, and is generated as its predecessor is resolved.
 */
export function createMatches(
  startingTeams: Team[],
  phases?: ChampionshipPhase[],
  phaseEntrants?: Team[][]
): MatchContainer {
  const isPhased = Boolean(phases?.length);
  // With staggered entry, only the clubs entered into the first phase play it.
  const startingField = phaseEntrants?.[0]?.length ? phaseEntrants[0] : startingTeams;
  const rounds = isPhased
    ? buildPhaseRounds(startingField, phases![0], 0, 1)
    : buildLegacyRounds(startingTeams);

  return {
    timer: 0,
    currentSeason: new Date().getFullYear(),
    currentRound: 1,
    // The legacy path keeps its original arithmetic rather than `rounds.length`, so a degenerate
    // club list produces exactly the value it always did.
    totalRounds: isPhased ? rounds.length : (startingTeams.length - 1) * 2,
    rounds,
  };
}

export default createMatches;
