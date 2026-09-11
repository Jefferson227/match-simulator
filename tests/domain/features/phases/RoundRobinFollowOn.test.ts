import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import Match from '../../../../src/domain/models/Match';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';
import { createMatches } from '../../../../src/domain/features/fixture-generation/FixtureGenerator';
import {
  groupsOfPhase,
  initialisePhaseState,
  isPhaseComplete,
  isPhasedChampionshipOver,
  seedingForNextPhase,
} from '../../../../src/domain/features/phases/PhaseProgression';
import { buildPhaseView } from '../../../../src/domain/features/phases/PhaseView';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

const rng: RandomProvider = { nextInt: (min) => min };

const POSITIONS = ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW'] as const;

function buildTeam(index: number): Team {
  return {
    id: `team-${String(index).padStart(3, '0')}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${String(index).padStart(3, '0')}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: POSITIONS.map((position, playerIndex) => ({
      id: `player-${index}-${playerIndex}` as Player['id'],
      position,
      name: `Player ${index}-${playerIndex}`,
      strength: 50,
      xp: 0,
      isStarter: true,
      isSub: false,
    })),
    morale: 50,
    isControlledByHuman: false,
  };
}

const number = (team: Team) => Number(team.id.replace('team-', ''));

function buildChampionship(teamCount: number, phases: ChampionshipPhase[]): Championship {
  const teams = Array.from({ length: teamCount }, (_, index) => buildTeam(index + 1));

  return initialisePhaseState({
    id: 'fixture',
    name: 'fixture',
    internalName: 'fixture',
    numberOfTeams: teamCount,
    teams,
    standings: teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
    matchContainer: createMatches(teams, phases),
    type: 'group-stage-knockout',
    leagueType: 'mens',
    hasTeamControlledByHuman: true,
    phases,
    isPromotable: false,
    isRelegatable: false,
  });
}

/** Decides a match: `[homeGoals, awayGoals]`. */
type Script = (match: Match, phaseIndex: number) => [number, number];

/** The lower-numbered club always wins 2-0, so every table follows club number. */
const lowerNumberWins: Script = (match) =>
  number(match.homeTeam) < number(match.awayTeam) ? [2, 0] : [0, 2];

function playRound(championship: Championship, script: Script): Championship {
  const container: ChampionshipContainer = { playableChampionship: championship };
  const started = ChampionshipService.startRoundForAllChampionships(container);
  if (!started.succeeded) throw new Error(started.error?.message);

  const current = started.getResult().playableChampionship;
  const { currentRound } = current.matchContainer;
  const rounds = current.matchContainer.rounds.map((round) =>
    round.number !== currentRound
      ? round
      : {
          ...round,
          matches: round.matches.map((match) => {
            const [homeTeamScore, awayTeamScore] = script(match, round.phaseIndex ?? 0);
            return { ...match, homeTeamScore, awayTeamScore };
          }),
        }
  );

  const ended = ChampionshipService.endRoundForAllChampionships(
    { playableChampionship: { ...current, matchContainer: { ...current.matchContainer, rounds } } },
    { rng }
  );
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult().playableChampionship;
}

/** Plays until `until` holds, or the season ends. */
function playUntil(
  championship: Championship,
  script: Script,
  until: (championship: Championship) => boolean = () => false
): Championship {
  let current = championship;
  for (let guard = 0; guard < 200; guard++) {
    if (until(current)) return current;
    const { currentRound, rounds } = current.matchContainer;
    if (!rounds.some((round) => round.number === currentRound)) return current;
    current = playRound(current, script);
  }
  throw new Error('Season did not finish');
}

const inPhase = (index: number) => (championship: Championship) =>
  (championship.currentPhaseIndex ?? 0) >= index;

function matchesOf(championship: Championship, phaseIndex: number): Match[] {
  return championship.matchContainer.rounds
    .filter((round) => round.phaseIndex === phaseIndex)
    .flatMap((round) => round.matches);
}

/** Clubs of each group of a phase, by club number, in ascending order. */
function groupMembers(championship: Championship, phaseIndex: number): number[][] {
  const groups = groupsOfPhase(championship.matchContainer.rounds, phaseIndex);
  const members: number[][] = [];
  for (const [teamId, group] of groups) {
    (members[group] ??= []).push(Number(teamId.replace('team-', '')));
  }
  return members.map((group) => group.sort((a, b) => a - b));
}

/** Pairs of a knockout phase as sorted club-number pairs, in tie order. */
function tiePairs(championship: Championship, phaseIndex: number): number[][] {
  const firstLegs = matchesOf(championship, phaseIndex).filter((match) => match.leg === 1);
  return firstLegs.map((match) =>
    [number(match.homeTeam), number(match.awayTeam)].sort((a, b) => a - b)
  );
}

/** Série C 2025's shape (REC C Arts. 12–22). */
const serieCShape: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 1,
    teamsPerGroup: 20,
    legs: 1,
    advancingPerGroup: 8,
  },
  {
    kind: 'round-robin',
    name: '2ª Fase',
    numberOfGroups: 2,
    teamsPerGroup: 4,
    legs: 2,
    advancingPerGroup: 1,
    groupAllocation: 'serpentine',
  },
  {
    kind: 'knockout',
    name: 'Final',
    numberOfTies: 1,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
    crossings: {
      from: 'group-position',
      pairs: [
        [
          { group: 0, position: 1 },
          { group: 1, position: 1 },
        ],
      ],
    },
  },
];

describe('phase progression — a round-robin following a round-robin (Série C shape)', () => {
  const fresh = buildChampionship(20, serieCShape);
  const atSecondPhase = playUntil(fresh, lowerNumberWins, inPhase(1));

  it('plays 19 single-leg rounds, then appends a 6-round 2ª Fase instead of throwing', () => {
    expect(atSecondPhase.currentPhaseIndex).toBe(1);
    const secondPhaseRounds = atSecondPhase.matchContainer.rounds.filter(
      (round) => round.phaseIndex === 1
    );
    expect(secondPhaseRounds).toHaveLength(6);
    expect(secondPhaseRounds[0].number).toBe(20);
    expect(secondPhaseRounds.every((round) => round.phaseName === '2ª Fase')).toBe(true);
    expect(atSecondPhase.matchContainer.totalRounds).toBe(25);
  });

  it('deals the 1ª Fase top 8 serpentine: 1-4-5-8 / 2-3-6-7 (REC C Anexo B)', () => {
    expect(groupMembers(atSecondPhase, 1)).toEqual([
      [1, 4, 5, 8],
      [2, 3, 6, 7],
    ]);
  });

  it('resets the standings to the 8 survivors at zero', () => {
    expect(atSecondPhase.standings).toHaveLength(8);
    expect(atSecondPhase.standings.every((row) => row.points === 0 && row.wins === 0)).toBe(true);
    expect(atSecondPhase.survivingTeamIds).toHaveLength(8);
  });

  it('holds the ranked 1ª Fase table in phaseStandings[0]', () => {
    const table = atSecondPhase.phaseStandings?.[0] ?? [];
    expect(table.map((row) => number(row.team))).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1)
    );
    expect(table[0].points).toBe(57);
    expect(atSecondPhase.firstPhaseStandings).toEqual(table);
  });

  // 2ª Fase script: the higher-numbered club wins, so each group's table inverts the 1ª Fase order.
  const higherNumberWins: Script = (match, phaseIndex) =>
    phaseIndex === 0
      ? lowerNumberWins(match, phaseIndex)
      : number(match.homeTeam) > number(match.awayTeam)
        ? [2, 0]
        : [0, 2];
  const atFinal = playUntil(atSecondPhase, higherNumberWins, inPhase(2));

  it('holds the ranked 2ª Fase table in phaseStandings[1], separate from the 1ª Fase', () => {
    const table = atFinal.phaseStandings?.[1] ?? [];
    expect(table).toHaveLength(8);
    // Within each group the higher number won every match: 8 and 7 top their groups on 18 points,
    // level on everything, so the abbreviation puts T007 first.
    expect(table.slice(0, 2).map((row) => [number(row.team), row.points])).toEqual([
      [7, 18],
      [8, 18],
    ]);
    expect(atFinal.phaseStandings?.[0]?.[0].team.id).toBe('team-001');
  });

  it('sends the two group winners into a group-position final', () => {
    expect(atFinal.currentPhaseIndex).toBe(2);
    expect(tiePairs(atFinal, 2)).toEqual([[7, 8]]);
    expect(atFinal.survivingTeamIds?.slice().sort()).toEqual(['team-007', 'team-008']);
  });

  it('plays the final to a champion and keeps every phase table', () => {
    const over = playUntil(atFinal, higherNumberWins);

    expect(over.survivingTeamIds).toHaveLength(1);
    expect(over.phaseStandings).toHaveLength(3);
    expect(over.phaseParticipants?.[2]?.slice().sort()).toEqual(['team-007', 'team-008']);
  });
});

/** A shrunken Série D: group crossings, then fixed tie crossings, then a re-seeded final. */
const crossedShape: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 4,
    teamsPerGroup: 4,
    legs: 1,
    advancingPerGroup: 2,
  },
  {
    kind: 'knockout',
    name: '2ª Fase',
    numberOfTies: 4,
    legs: 2,
    secondLegHost: 'group-winner',
    tiebreakers: ['goal-difference', 'penalties'],
    crossings: {
      from: 'group-position',
      pairs: [
        [
          { group: 0, position: 1 },
          { group: 1, position: 2 },
        ],
        [
          { group: 1, position: 1 },
          { group: 0, position: 2 },
        ],
        [
          { group: 2, position: 1 },
          { group: 3, position: 2 },
        ],
        [
          { group: 3, position: 1 },
          { group: 2, position: 2 },
        ],
      ],
    },
  },
  {
    kind: 'knockout',
    name: 'Semifinal',
    numberOfTies: 2,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
    crossings: {
      from: 'previous-ties',
      pairs: [
        [0, 3],
        [1, 2],
      ],
    },
  },
  {
    kind: 'knockout',
    name: 'Final',
    numberOfTies: 1,
    legs: 2,
    secondLegHost: 'higher-seed',
    tiebreakers: ['goal-difference', 'penalties'],
    reseed: 'accumulated-points',
  },
];

describe('phase progression — declared crossings and a re-seeded phase', () => {
  const season = playUntil(buildChampionship(16, crossedShape), lowerNumberWins);

  it('hands each phase the seeding its declaration asks for', () => {
    expect(seedingForNextPhase(crossedShape[0], crossedShape[1])).toBe('crossings');
    expect(seedingForNextPhase(crossedShape[1], crossedShape[2])).toBe('crossings');
    expect(seedingForNextPhase(crossedShape[2], crossedShape[3])).toBe('reseed');
  });

  it('pairs the round-robin qualifiers by group position', () => {
    // Groups in declared order: [1-4], [5-8], [9-12], [13-16]; the lower two numbers advance.
    expect(tiePairs(season, 1)).toEqual([
      [1, 6],
      [2, 5],
      [9, 14],
      [10, 13],
    ]);
  });

  it('pairs the winners of the declared previous ties, not adjacent ones', () => {
    // Winners by tie: 1, 2, 9, 10 → tie 0 × tie 3 and tie 1 × tie 2.
    expect(tiePairs(season, 2)).toEqual([
      [1, 10],
      [2, 9],
    ]);
  });

  it('plays the re-seeded final to a champion', () => {
    expect(tiePairs(season, 3)).toEqual([[1, 2]]);
    expect(season.survivingTeamIds).toEqual(['team-001']);
  });
});

describe('MS-106 audit — the code around a round-robin at phase index > 0', () => {
  const atSecondPhase = playUntil(buildChampionship(20, serieCShape), lowerNumberWins, inPhase(1));
  const finished = playUntil(atSecondPhase, lowerNumberWins);

  it('initialisePhaseState clears the per-phase tables of the previous season', () => {
    expect(finished.phaseStandings?.length).toBe(3);

    const reset = initialisePhaseState(finished);
    expect(reset.phaseStandings).toEqual([]);
    expect(reset.firstPhaseStandings).toBeUndefined();
  });

  it('PhaseView shows the 2ª Fase as two group tables, not a bracket', () => {
    const view = buildPhaseView(atSecondPhase);

    expect(view).toMatchObject({
      isPhased: true,
      phaseIndex: 1,
      phaseName: '2ª Fase',
      kind: 'round-robin',
      roundInPhase: 1,
      roundsInPhase: 6,
    });
    expect(view.ties).toBeUndefined();
    expect(
      view.groups?.map((group) =>
        group.standings.map((row) => number(row.team)).sort((a, b) => a - b)
      )
    ).toEqual([
      [1, 4, 5, 8],
      [2, 3, 6, 7],
    ]);
  });

  it('isPhasedChampionshipOver stays false through a round-robin that is not the last phase', () => {
    const endOfSecondPhase = playUntil(atSecondPhase, lowerNumberWins, inPhase(2));

    expect(isPhasedChampionshipOver(atSecondPhase)).toBe(false);
    expect(isPhaseComplete(endOfSecondPhase.matchContainer.rounds, 1)).toBe(true);
    expect(isPhasedChampionshipOver(endOfSecondPhase)).toBe(false);
    expect(isPhasedChampionshipOver(finished)).toBe(true);
  });

  it('the AI catch-up plays a Série C-shaped division through its later round-robin to a champion', () => {
    // A 4-club, 2-phase playable division: its phase boundary after round 3 is a sync point.
    const playable = buildChampionship(4, [
      {
        kind: 'round-robin',
        name: '1ª Fase',
        numberOfGroups: 1,
        teamsPerGroup: 4,
        legs: 1,
        advancingPerGroup: 2,
      },
      {
        kind: 'knockout',
        name: 'Final',
        numberOfTies: 1,
        legs: 2,
        secondLegHost: 'higher-seed',
        tiebreakers: ['goal-difference', 'penalties'],
      },
    ]);
    let container: ChampionshipContainer = {
      playableChampionship: playable,
      relegationChampionship: buildChampionship(20, serieCShape),
    };

    let seed = 0;
    const varied: RandomProvider = {
      nextInt: (min, max) => min + ((((seed += 1) * 7919 + 104729) % 10007) % (max - min + 1)),
    };
    for (let round = 0; round < 3; round++) {
      const started = ChampionshipService.startRoundForAllChampionships(container);
      const ended = ChampionshipService.endRoundForAllChampionships(started.getResult(), {
        rng: varied,
      });
      if (!ended.succeeded) throw new Error(ended.error?.message);
      container = ended.getResult();
    }

    const ai = container.relegationChampionship!;
    expect(container.playableChampionship.currentPhaseIndex).toBe(1);
    expect(isPhasedChampionshipOver(ai)).toBe(true);
    expect(ai.matchContainer.rounds.map((round) => round.phaseIndex)).toEqual([
      ...Array(19).fill(0),
      ...Array(6).fill(1),
      2,
      2,
    ]);
    expect(ai.survivingTeamIds).toHaveLength(1);
    expect(ai.phaseStandings?.[1]).toHaveLength(8);
  });
});
