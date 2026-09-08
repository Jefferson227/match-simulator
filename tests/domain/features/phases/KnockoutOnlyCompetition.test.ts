import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../../src/domain/services/ChampionshipService';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipPhase, { KnockoutPhase } from '../../../../src/domain/models/ChampionshipPhase';
import Match from '../../../../src/domain/models/Match';
import Round from '../../../../src/domain/models/Round';
import { Team } from '../../../../src/domain/models/Team';
import { createMatches } from '../../../../src/domain/features/fixture-generation/FixtureGenerator';
import {
  BracketEntrant,
  buildTies,
  resolveSecondLegHost,
} from '../../../../src/domain/features/fixture-generation/KnockoutBracket';
import {
  initialisePhaseState,
  resolveCompletedPhase,
} from '../../../../src/domain/features/phases/PhaseProgression';
import { resolveTie } from '../../../../src/domain/features/phases/TieResolution';
import { simulatePenaltyShootout } from '../../../../src/domain/features/phases/PenaltyShootoutSimulator';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

function buildTeam(index: number): Team {
  const abbreviation = `T${String(index).padStart(2, '0')}`;
  return {
    id: `team-${String(index).padStart(2, '0')}` as Team['id'],
    fullName: abbreviation,
    shortName: abbreviation,
    abbreviation,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [
      {
        id: 'p1' as never,
        position: 'GK',
        name: 'GK',
        strength: 50,
        xp: 0,
        isStarter: true,
        isSub: false,
      },
      {
        id: 'p2' as never,
        position: 'FW',
        name: 'FW',
        strength: 50,
        xp: 0,
        isStarter: true,
        isSub: false,
      },
    ],
    morale: 50,
    isControlledByHuman: false,
  };
}

function fixedRng(value: number): RandomProvider {
  return { nextInt: (min: number, max: number) => Math.min(max, Math.max(min, value)) };
}

function varyingRng(): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      index += 1;
      return min + (((index * 7919 + 104729) % 10007) % (max - min + 1));
    },
  };
}

const drawnPhase = (overrides: Partial<KnockoutPhase> = {}): KnockoutPhase => ({
  kind: 'knockout',
  name: '1ª Fase',
  numberOfTies: 2,
  legs: 1,
  secondLegHost: 'drawn',
  tiebreakers: ['penalties'],
  ...overrides,
});

/** A four-club cup: one single-legged phase, then a two-legged final. No table. */
function buildCup(overrides: Partial<Championship> = {}): Championship {
  const teams = [1, 2, 3, 4].map(buildTeam);
  const phases: ChampionshipPhase[] = [
    drawnPhase(),
    drawnPhase({
      name: 'Final',
      numberOfTies: 1,
      legs: 2,
      tiebreakers: ['goal-difference', 'penalties'],
    }),
  ];

  return initialisePhaseState({
    id: 'cup',
    name: 'Mock Cup',
    internalName: 'mock-cup',
    numberOfTeams: teams.length,
    teams,
    standings: [],
    hasLeagueTable: false,
    matchContainer: createMatches(teams, phases),
    type: 'group-stage-knockout',
    leagueType: 'womens',
    hasTeamControlledByHuman: false,
    phases,
    isPromotable: false,
    isRelegatable: false,
    ...overrides,
  } as Championship);
}

function playRound(
  championship: Championship,
  score: (match: Match) => [number, number]
): Championship {
  const matchContainer = championship.matchContainer;
  const rounds: Round[] = matchContainer.rounds.map((round) =>
    round.number !== matchContainer.currentRound
      ? round
      : {
          ...round,
          status: 'ended' as const,
          matches: round.matches.map((match) => {
            const [home, away] = score(match);
            return { ...match, homeTeamScore: home, awayTeamScore: away };
          }),
        }
  );

  const played: Championship = {
    ...championship,
    matchContainer: { ...matchContainer, rounds },
  };

  const resolved = resolveCompletedPhase(played, { rng: varyingRng() });
  return {
    ...resolved,
    matchContainer: {
      ...resolved.matchContainer,
      currentRound: matchContainer.currentRound + 1,
    },
  };
}

describe('a competition with no league table', () => {
  it('builds with no standings and still generates its first phase', () => {
    const cup = buildCup();

    expect(cup.hasLeagueTable).toBe(false);
    expect(cup.standings).toEqual([]);
    expect(cup.matchContainer.rounds).toHaveLength(1);
    expect(cup.matchContainer.rounds[0].matches).toHaveLength(2);
  });

  it('records who played each phase from the fixtures, since there is no table to read', () => {
    const afterFirstPhase = playRound(buildCup(), () => [2, 0]);

    expect(afterFirstPhase.phaseParticipants![0]).toHaveLength(4);
    expect(afterFirstPhase.survivingTeamIds).toHaveLength(2);
    expect(afterFirstPhase.standings).toEqual([]);
  });

  it('shrinks the bracket to a final and stops there', () => {
    let cup = playRound(buildCup(), () => [2, 0]);
    cup = playRound(cup, () => [1, 0]);
    cup = playRound(cup, () => [1, 0]);

    expect(cup.currentPhaseIndex).toBe(1);
    expect(cup.phaseParticipants![1]).toHaveLength(2);
    expect(cup.survivingTeamIds).toHaveLength(1);
  });
});

describe('per-phase entrants — staggered entry', () => {
  const entering = [5, 6].map(buildTeam);

  it('adds the declared clubs at the declared phase, with no byes', () => {
    const teams = [1, 2, 3, 4].map(buildTeam);
    const phases: ChampionshipPhase[] = [
      drawnPhase({ name: 'Preliminar', numberOfTies: 2 }),
      drawnPhase({ name: '1ª Fase', numberOfTies: 2 }),
      drawnPhase({ name: 'Final', numberOfTies: 1 }),
    ];

    const cup = initialisePhaseState({
      ...buildCup({ teams: [...teams, ...entering], phases }),
      teams: [...teams, ...entering],
      phases,
      phaseEntrants: [teams, entering, []],
      matchContainer: createMatches([...teams, ...entering], phases, [teams, entering, []]),
    } as Championship);

    // Only the four Preliminar entrants start.
    expect(cup.survivingTeamIds).toHaveLength(4);
    expect(cup.matchContainer.rounds[0].matches).toHaveLength(2);

    const afterPreliminar = playRound(cup, () => [2, 0]);

    // Two survivors plus the two clubs entering at the 1ª Fase = four clubs, two ties.
    expect(afterPreliminar.survivingTeamIds).toHaveLength(4);
    expect(afterPreliminar.survivingTeamIds).toEqual(
      expect.arrayContaining(entering.map((team) => team.id))
    );

    const secondPhaseRounds = afterPreliminar.matchContainer.rounds.filter(
      (round) => round.phaseIndex === 1
    );
    expect(secondPhaseRounds.flatMap((round) => round.matches)).toHaveLength(2);
  });

  it('leaves a competition whose whole field starts together untouched', () => {
    const cup = buildCup();
    expect(cup.phaseEntrants).toBeUndefined();
    expect(cup.survivingTeamIds).toHaveLength(4);
  });
});

describe('drawn hosting', () => {
  const a: BracketEntrant = { team: buildTeam(1), seed: 1 };
  const b: BracketEntrant = { team: buildTeam(2), seed: 2 };

  it('picks the host through the injected rng, not the seed', () => {
    expect(resolveSecondLegHost(a, b, 'drawn', fixedRng(0)).team.id).toBe(a.team.id);
    expect(resolveSecondLegHost(a, b, 'drawn', fixedRng(1)).team.id).toBe(b.team.id);
  });

  it('is stable without an rng, so a screen can call it', () => {
    expect(resolveSecondLegHost(b, a, 'drawn').team.id).toBe(a.team.id);
  });

  it('is a per-competition choice — the divisions keep their seeded rules', () => {
    expect(resolveSecondLegHost(b, a, 'higher-seed', fixedRng(1)).team.id).toBe(a.team.id);
  });

  it('pairs the n-th club with the (N+1-n)-th, per Copa Anexo B', () => {
    const entrants: BracketEntrant[] = [1, 2, 3, 4].map((seed) => ({
      team: buildTeam(seed),
      seed,
    }));
    const ties = buildTies(entrants, drawnPhase(), 'draw', 0, fixedRng(0));

    expect(
      ties.map((tie) => [tie.firstLegHost.seed, tie.secondLegHost.seed].sort((x, y) => x - y))
    ).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });
});

describe('single-legged ties go straight to penalties', () => {
  function leg(homeScore: number, awayScore: number, legNumber = 1): Match {
    return {
      id: `match-${legNumber}`,
      homeTeam: buildTeam(1),
      awayTeam: buildTeam(2),
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      scorers: [],
      tieId: 'p0-t0',
      leg: legNumber,
    };
  }

  it('skips the goal-difference step when the phase does not declare it', () => {
    const outcome = resolveTie([leg(1, 1)], { rng: varyingRng() }, simulatePenaltyShootout, [
      'penalties',
    ]);

    expect(outcome.shootout).toBeDefined();
  });

  it('still decides a single leg that was not drawn on points alone', () => {
    const outcome = resolveTie([leg(2, 1)], { rng: varyingRng() }, simulatePenaltyShootout, [
      'penalties',
    ]);

    expect(outcome.winner.id).toBe('team-01');
    expect(outcome.shootout).toBeUndefined();
  });

  it('keeps the full cascade for a two-legged tie that declares goal difference', () => {
    const outcome = resolveTie(
      [leg(3, 0, 1), { ...leg(1, 0, 2), homeTeam: buildTeam(2), awayTeam: buildTeam(1) }],
      { rng: varyingRng() },
      simulatePenaltyShootout,
      ['goal-difference', 'penalties']
    );

    // One win each; T01 is +2 on aggregate, so no shootout is needed.
    expect(outcome.winner.id).toBe('team-01');
    expect(outcome.shootout).toBeUndefined();
  });
});

describe('the league championships are unaffected', () => {
  it.each(['brasileirao-serie-a', 'brasileirao-feminino-serie-a1'])(
    '%s still has a table and no per-phase entrants',
    (internalName) => {
      const container = ChampionshipService.initChampionships(internalName).getResult();
      const championship = container.playableChampionship;

      expect(championship.hasLeagueTable).toBe(true);
      expect(championship.phaseEntrants).toBeUndefined();
      expect(championship.standings).toHaveLength(championship.teams.length);
    }
  );
});
