import { describe, expect, it, jest } from '@jest/globals';
import { selectPhases } from '../../../src/domain/services/ChampionshipService';
import { Championship } from '../../../src/domain/models/Championship';
import ChampionshipPhase, { PhaseVariant } from '../../../src/domain/models/ChampionshipPhase';
import { Team } from '../../../src/domain/models/Team';
import womensTeamsJSON from '../../../src/infrastructure/data/teams-womens.json';

/**
 * Everything here is a fixture. The rule under test is generic — nothing in the code knows which
 * competition changes shape or at what size — so pinning it against Série A3's seed data would pin
 * the seed rather than the rule. A3's own numbers are asserted in `tests/infrastructure/data`.
 */

const groupStage = (
  numberOfGroups: number,
  teamsPerGroup: number,
  legs: 1 | 2
): ChampionshipPhase => ({
  kind: 'round-robin',
  name: '1ª Fase',
  numberOfGroups,
  teamsPerGroup,
  legs,
  advancingPerGroup: 2,
});

const knockout = (name: string, numberOfTies: number): ChampionshipPhase => ({
  kind: 'knockout',
  name,
  numberOfTies,
  legs: 2,
  secondLegHost: 'group-winner',
  tiebreakers: ['goal-difference', 'penalties'],
});

const demandingShape: ChampionshipPhase[] = [
  groupStage(8, 4, 2),
  knockout('Oitavas de Final', 8),
  knockout('Final', 1),
];

const reducedShape: ChampionshipPhase[] = [
  groupStage(4, 8, 1),
  knockout('Quartas de Final', 4),
  knockout('Final', 1),
];

const twoVariants: PhaseVariant[] = [
  { minNumberOfTeams: 32, phases: demandingShape },
  { minNumberOfTeams: 0, phases: reducedShape },
];

function championshipWith(
  phases: ChampionshipPhase[] | undefined,
  phaseVariants?: PhaseVariant[]
): Championship {
  return {
    internalName: 'fixture-division',
    phases,
    phaseVariants,
    isPromotable: false,
    isRelegatable: false,
  } as Championship;
}

function fieldOf(size: number): Team[] {
  return Array.from({ length: size }, (_, index) => ({ id: `team-${index}` }) as Team);
}

describe('selectPhases — the shape follows the club count', () => {
  it.each([
    [32, 'demanding'],
    [31, 'reduced'],
    [30, 'reduced'],
    [26, 'reduced'],
    [8, 'reduced'],
  ])('plays a field of %i clubs in the %s shape', (fieldSize, expected) => {
    const chosen = selectPhases(championshipWith(demandingShape, twoVariants), fieldOf(fieldSize));

    expect(chosen).toBe(expected === 'demanding' ? demandingShape : reducedShape);
  });

  it('matches in declared order, so the first satisfiable variant wins', () => {
    // 32 satisfies both guards. The list is seeded most demanding first, and the repository rejects
    // one that is not, so the demanding shape is the one that must be picked.
    const chosen = selectPhases(championshipWith(demandingShape, twoVariants), fieldOf(32));

    expect(chosen).toBe(twoVariants[0].phases);
  });

  it('leaves a championship with no variants on its own phases', () => {
    const championship = championshipWith(demandingShape);

    expect(selectPhases(championship, fieldOf(12))).toBe(demandingShape);
    expect(selectPhases(championship, fieldOf(32))).toBe(demandingShape);
  });

  it('leaves an unphased championship unphased', () => {
    expect(selectPhases(championshipWith(undefined), fieldOf(20))).toBeUndefined();
  });
});

/**
 * The repository reads `championships.json` at module load, so each rejection is driven by swapping
 * that module for a one-entry fixture inside an isolated registry.
 */
function loadWithSeed(seed: unknown[]): Championship {
  let loaded = {} as Championship;

  jest.isolateModules(() => {
    jest.doMock('../../../src/infrastructure/data/championships.json', () => seed, {
      virtual: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const repository = require('../../../src/infrastructure/repositories/ChampionshipRepository');
    loaded = repository.getChampionship('fixture-division', true);
  });

  return loaded;
}

/** Real seeded clubs, so a fixture that passes every variant rule also gets past the team lookup. */
const fixtureField = (womensTeamsJSON as { internalName: string }[])
  .slice(0, 32)
  .map((team) => team.internalName);

function seedEntry(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'FIXTURE DIVISION',
    internalName: 'fixture-division',
    numberOfTeams: 32,
    type: 'group-stage-knockout',
    leagueType: 'womens',
    teamNames: fixtureField,
    phases: demandingShape,
    ...overrides,
  };
}

describe('ChampionshipRepository — variant lists it refuses to load', () => {
  it('rejects a list that is not sorted descending by minNumberOfTeams', () => {
    expect(() =>
      loadWithSeed([
        seedEntry({
          phaseVariants: [
            { minNumberOfTeams: 0, phases: reducedShape },
            { minNumberOfTeams: 32, phases: demandingShape },
          ],
        }),
      ])
    ).toThrow(/sorted descending/);
  });

  it('rejects a list no seeded field can satisfy', () => {
    expect(() =>
      loadWithSeed([
        seedEntry({
          phaseVariants: [{ minNumberOfTeams: 64, phases: demandingShape }],
        }),
      ])
    ).toThrow(/No phase variant .* can be played with its seeded field of 32 clubs/);
  });

  it('rejects a variant whose phases declare entrants', () => {
    // `phaseEntrants` is resolved once from `phases` and would go stale on a shape change, so
    // staggered entry and variants are never combined.
    expect(() =>
      loadWithSeed([
        seedEntry({
          phaseVariants: [
            {
              minNumberOfTeams: 0,
              phases: [
                groupStage(4, 8, 1),
                { ...knockout('Quartas de Final', 4), entrants: [fixtureField[0]] },
              ],
            },
          ],
        }),
      ])
    ).toThrow(/must not declare entrants/);
  });

  it('rejects seed phases that disagree with the variant its numberOfTeams selects', () => {
    // A fresh load and a roll-over into the same size have to describe the same competition.
    expect(() =>
      loadWithSeed([seedEntry({ phases: reducedShape, phaseVariants: twoVariants })])
    ).toThrow(/must equal the variant matching its numberOfTeams \(32\)/);
  });

  it('carries a list that breaks none of those rules onto the mapped championship', () => {
    const loaded = loadWithSeed([
      seedEntry({ phases: demandingShape, phaseVariants: twoVariants }),
    ]);

    expect(loaded.phaseVariants?.map((variant) => variant.minNumberOfTeams)).toEqual([32, 0]);
    expect(loaded.phases).toEqual(demandingShape);
  });

  it('loads a championship without variants exactly as before', () => {
    const loaded = loadWithSeed([seedEntry({})]);

    expect(loaded.phaseVariants).toBeUndefined();
    expect(loaded.phases).toEqual(demandingShape);
    expect(loaded.teams).toHaveLength(32);
  });
});
