import { describe, expect, it, jest } from '@jest/globals';
import { Championship } from '../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../src/domain/models/ChampionshipPhase';
import { getChampionship } from '../../../src/infrastructure/repositories/ChampionshipRepository';
import womensTeamsJSON from '../../../src/infrastructure/data/teams-womens.json';

/**
 * The repository reads `championships.json` at module load, so each case swaps that module for a
 * one-entry fixture inside an isolated registry (the MS-104 pattern).
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

const fixtureField = (womensTeamsJSON as { internalName: string }[])
  .slice(0, 16)
  .map((team) => team.internalName);

/** 4 groups of 4 → 4 fixed group crossings → 2 fixed tie crossings → a re-seeded final. */
function shape(): ChampionshipPhase[] {
  return [
    {
      kind: 'round-robin',
      name: '1ª Fase',
      numberOfGroups: 4,
      teamsPerGroup: 4,
      legs: 1,
      advancingPerGroup: 2,
      groupAllocation: 'serpentine',
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
}

function seedEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'FIXTURE DIVISION',
    internalName: 'fixture-division',
    numberOfTeams: 16,
    type: 'group-stage-knockout',
    leagueType: 'womens',
    teamNames: fixtureField,
    phases: shape(),
    numberOfPromotableTeams: 4,
    promotionChampionshipInternalName: 'fixture-upper-division',
    promotionRule: 'phase-group-position',
    promotionPhaseIndex: 0,
    rolloverSlotting: 'replace-in-place',
    ...overrides,
  };
}

function withPhase(index: number, patch: Record<string, unknown>): ChampionshipPhase[] {
  const phases = shape();
  phases[index] = { ...phases[index], ...patch } as ChampionshipPhase;
  return phases;
}

describe('ChampionshipRepository — MS-106 fields', () => {
  it('carries every new field from the JSON into the championship', () => {
    const championship = loadWithSeed([seedEntry()]);
    const phases = championship.phases!;

    expect(phases[0]).toMatchObject({ kind: 'round-robin', groupAllocation: 'serpentine' });
    expect(phases[1].kind === 'knockout' && phases[1].crossings).toEqual(
      (shape()[1] as { crossings: unknown }).crossings
    );
    expect(phases[2].kind === 'knockout' && phases[2].crossings).toEqual({
      from: 'previous-ties',
      pairs: [
        [0, 3],
        [1, 2],
      ],
    });
    expect(phases[3]).toMatchObject({ reseed: 'accumulated-points' });
    expect(championship.rolloverSlotting).toBe('replace-in-place');
    expect(championship.isPromotable).toBe(true);
    if (!championship.isPromotable) return;
    expect(championship.promotionRule).toBe('phase-group-position');
    expect(championship.promotionPhaseIndex).toBe(0);
  });

  it('leaves the new fields undefined on a championship that does not declare them', () => {
    const serieA = getChampionship('brasileirao-serie-a', true);
    const a1 = getChampionship('brasileirao-feminino-serie-a1', false);

    expect(serieA.rolloverSlotting).toBeUndefined();
    expect(a1.rolloverSlotting).toBeUndefined();
    expect(a1.isPromotable).toBe(false);
    const a2 = getChampionship('brasileirao-feminino-serie-a2', false);
    expect(a2.isPromotable && a2.promotionPhaseIndex).toBeUndefined();
    a1.phases!.forEach((phase) => {
      expect('groupAllocation' in phase).toBe(false);
      expect('crossings' in phase).toBe(false);
      expect('reseed' in phase).toBe(false);
    });
  });
});

describe('ChampionshipRepository — crossings it refuses to load', () => {
  it('rejects a group-position slot naming a group the previous phase does not have', () => {
    const phases = withPhase(1, {
      crossings: {
        from: 'group-position',
        pairs: [
          [
            { group: 0, position: 1 },
            { group: 4, position: 2 },
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
    });

    expect(() => loadWithSeed([seedEntry({ phases })])).toThrow(
      /fixture-division phase '2ª Fase'.*group 4 position 2.*cannot produce/
    );
  });

  it('rejects a group-position slot naming a placing that does not advance', () => {
    const phases = withPhase(1, {
      crossings: {
        from: 'group-position',
        pairs: [
          [
            { group: 0, position: 1 },
            { group: 1, position: 3 },
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
    });

    expect(() => loadWithSeed([seedEntry({ phases })])).toThrow(
      /group 1 position 3.*2 advancing each.*cannot produce/
    );
  });

  it('rejects a previous-ties index past the previous knockout', () => {
    const phases = withPhase(2, {
      crossings: {
        from: 'previous-ties',
        pairs: [
          [0, 4],
          [1, 2],
        ],
      },
    });

    expect(() => loadWithSeed([seedEntry({ phases })])).toThrow(
      /fixture-division phase 'Semifinal' name tie 4, but '2ª Fase' has 4 ties/
    );
  });

  it('rejects a crossing whose source phase is the wrong kind', () => {
    const phases = withPhase(2, {
      crossings: {
        from: 'group-position',
        pairs: [
          [
            { group: 0, position: 1 },
            { group: 1, position: 1 },
          ],
          [
            { group: 2, position: 1 },
            { group: 3, position: 1 },
          ],
        ],
      },
    });

    expect(() => loadWithSeed([seedEntry({ phases })])).toThrow(
      /previous phase is not a round-robin/
    );
  });

  it('rejects a crossing list whose length is not the tie count', () => {
    const phases = withPhase(2, { crossings: { from: 'previous-ties', pairs: [[0, 3]] } });

    expect(() => loadWithSeed([seedEntry({ phases })])).toThrow(/declare 1 pairs for 2 ties/);
  });
});

describe('ChampionshipRepository — group-position promotion it refuses to load', () => {
  it('rejects the rule without a promotionPhaseIndex', () => {
    expect(() => loadWithSeed([seedEntry({ promotionPhaseIndex: undefined })])).toThrow(
      /Promotion of fixture-division.*promotionPhaseIndex undefined is not a grouped round-robin/
    );
  });

  it('rejects a promotionPhaseIndex pointing at a knockout phase', () => {
    expect(() => loadWithSeed([seedEntry({ promotionPhaseIndex: 1 })])).toThrow(
      /promotionPhaseIndex 1 is not a grouped round-robin/
    );
  });

  it('rejects a promotable count the groups cannot share evenly', () => {
    expect(() => loadWithSeed([seedEntry({ numberOfPromotableTeams: 6 })])).toThrow(
      /sends 6 clubs up from the 4 groups of '1ª Fase'; the count must divide evenly/
    );
  });
});
