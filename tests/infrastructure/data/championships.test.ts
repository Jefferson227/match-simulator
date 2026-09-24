import { jest } from '@jest/globals';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';
import mensTeamsJSON from '../../../src/infrastructure/data/teams.json';
import womensTeamsJSON from '../../../src/infrastructure/data/teams-womens.json';

type Phase =
  | {
      kind: 'round-robin';
      name: string;
      numberOfGroups: number;
      teamsPerGroup: number;
      legs: number;
      advancingPerGroup: number;
    }
  | {
      kind: 'knockout';
      name: string;
      numberOfTies: number;
      legs: number;
      secondLegHost: string;
      tiebreakers: string[];
      reseed?: string;
      crossings?: { from: string; pairs: unknown[] };
      playoff?: {
        name: string;
        from: string;
        pairs: number[][];
        secondLegHost: string;
        tiebreakers: string[];
      };
    };

type ChampionshipEntry = {
  internalName: string;
  /** The division's place in its pyramid, 1 = top. Absent for a cup. */
  tier?: number;
  leagueType: string;
  type: string;
  numberOfTeams: number;
  /** Absent for a division; `false` for a cup, which has no table. */
  hasLeagueTable?: boolean;
  teamNames: string[];
  numberOfPromotableTeams?: number;
  numberOfRelegatableTeams?: number;
  promotionChampionshipInternalName?: string;
  relegationChampionshipInternalName?: string;
  promotionRule?: string;
  promotionPhaseIndex?: number;
  rolloverSlotting?: string;
  relegationRule?: string;
  phases?: Phase[];
  phaseVariants?: { minNumberOfTeams: number; phases: Phase[] }[];
};

type TeamEntry = { internalName: string };

const VALID_LEAGUE_TYPES = ['mens', 'womens'];

const championships = championshipsJSON as ChampionshipEntry[];

const teamInternalNamesByLeagueType: Record<string, Set<string>> = {
  mens: new Set((mensTeamsJSON as TeamEntry[]).map((team) => team.internalName)),
  womens: new Set((womensTeamsJSON as TeamEntry[]).map((team) => team.internalName)),
};

const findByInternalName = (internalName: string) =>
  championships.find((championship) => championship.internalName === internalName);

describe('championships.json data integrity', () => {
  test('has at least one entry', () => {
    expect(championships.length).toBeGreaterThan(0);
  });

  test('every entry declares a valid league type', () => {
    championships.forEach((championship) => {
      expect(VALID_LEAGUE_TYPES).toContain(championship.leagueType);
    });
  });

  test('every team name resolves in the seed file matching its league type', () => {
    championships.forEach((championship) => {
      const known = teamInternalNamesByLeagueType[championship.leagueType];
      const unresolved = championship.teamNames.filter((teamName) => !known.has(teamName));

      expect({ championship: championship.internalName, unresolved }).toEqual({
        championship: championship.internalName,
        unresolved: [],
      });
    });
  });

  test('numberOfTeams matches the number of team names listed', () => {
    championships.forEach((championship) => {
      expect(championship.numberOfTeams).toBe(championship.teamNames.length);
    });
  });

  test('no entry lists the same team twice', () => {
    championships.forEach((championship) => {
      expect(new Set(championship.teamNames).size).toBe(championship.teamNames.length);
    });
  });

  test('every promotion chain points at an entry with the same league type', () => {
    championships
      .filter((championship) => championship.promotionChampionshipInternalName)
      .forEach((championship) => {
        const target = findByInternalName(championship.promotionChampionshipInternalName as string);

        expect(target).toBeDefined();
        expect(target?.leagueType).toBe(championship.leagueType);
      });
  });

  test('every relegation chain points at an entry with the same league type', () => {
    championships
      .filter((championship) => championship.relegationChampionshipInternalName)
      .forEach((championship) => {
        const target = findByInternalName(
          championship.relegationChampionshipInternalName as string
        );

        expect(target).toBeDefined();
        expect(target?.leagueType).toBe(championship.leagueType);
      });
  });

  describe('phases', () => {
    // The cups declare phases too, but they are pure brackets with no table and no round-robin
    // first phase, so the division-shaped assertions below are scoped to the divisions.
    const withPhases = championships.filter(
      (championship) => championship.phases?.length && championship.hasLeagueTable !== false
    );

    test('the phased divisions declare their phases', () => {
      expect(withPhases.map((championship) => championship.internalName)).toEqual([
        'brasileirao-serie-c',
        'brasileirao-serie-d',
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
      ]);
    });

    test('the first phase is a round-robin covering every team exactly once', () => {
      withPhases.forEach((championship) => {
        const [first] = championship.phases as Phase[];

        expect(first.kind).toBe('round-robin');
        if (first.kind !== 'round-robin') return;
        expect(first.numberOfGroups * first.teamsPerGroup).toBe(championship.numberOfTeams);
      });
    });

    test('each later phase is filled by the survivors of the phase before it', () => {
      withPhases.forEach((championship) => {
        const phases = championship.phases as Phase[];
        const [first, ...later] = phases;
        if (first.kind !== 'round-robin') throw new Error('expected a round-robin first phase');

        let survivors = first.numberOfGroups * first.advancingPerGroup;
        later.forEach((phase) => {
          // Série C's 2ª Fase: a round-robin holding exactly the 1ª Fase qualifiers.
          if (phase.kind === 'round-robin') {
            expect(phase.numberOfGroups * phase.teamsPerGroup).toBe(survivors);
            survivors = phase.numberOfGroups * phase.advancingPerGroup;
            return;
          }

          expect({ phase: phase.name, ties: phase.numberOfTies }).toEqual({
            phase: phase.name,
            ties: survivors / 2,
          });
          survivors = phase.numberOfTies;
        });

        expect(survivors).toBe(1);
      });
    });

    test('every knockout phase is two-legged and breaks ties the way the RECs do', () => {
      withPhases.forEach((championship) => {
        (championship.phases as Phase[])
          .filter(
            (phase): phase is Extract<Phase, { kind: 'knockout' }> => phase.kind === 'knockout'
          )
          .forEach((phase) => {
            expect(phase.legs).toBe(2);
            expect(phase.tiebreakers).toEqual(['goal-difference', 'penalties']);
            expect(['higher-seed', 'group-winner', 'accumulated-points']).toContain(
              phase.secondLegHost
            );
          });
      });
    });
  });

  describe('the cups', () => {
    const cups = championships.filter((championship) => championship.hasLeagueTable === false);

    test('every cup is a knockout with no table and no promotion or relegation', () => {
      expect(cups.length).toBeGreaterThan(0);

      cups.forEach((cup) => {
        expect(cup.type).toBe('knockout');
        expect(cup.phases?.length).toBeGreaterThan(0);
        expect(cup.promotionChampionshipInternalName).toBeUndefined();
        expect(cup.relegationChampionshipInternalName).toBeUndefined();
      });
    });

    test('every cup phase is a knockout hosted by draw', () => {
      cups.forEach((cup) => {
        (cup.phases as Phase[]).forEach((phase) => {
          expect(phase.kind).toBe('knockout');
          if (phase.kind !== 'knockout') return;
          // The cups draw hosting at every phase; the divisions' seeded rule does not apply.
          expect(phase.secondLegHost).toBe('drawn');
        });
      });
    });

    test('a single-legged cup phase goes straight to penalties', () => {
      cups.forEach((cup) => {
        (cup.phases as Phase[]).forEach((phase) => {
          if (phase.kind !== 'knockout') return;
          expect(phase.tiebreakers).toEqual(
            phase.legs === 1 ? ['penalties'] : ['goal-difference', 'penalties']
          );
        });
      });
    });

    test('every cup entrant is a club the game already seeds', () => {
      cups.forEach((cup) => {
        const known = teamInternalNamesByLeagueType[cup.leagueType];
        cup.teamNames.forEach((teamName) => expect(known.has(teamName)).toBe(true));
        expect(cup.teamNames).toHaveLength(cup.numberOfTeams);
      });
    });
  });

  describe("the women's divisions", () => {
    test('A1 relegates two off the first-phase table and does not promote', () => {
      const a1 = findByInternalName('brasileirao-feminino-serie-a1');

      expect(a1?.numberOfTeams).toBe(18);
      expect(a1?.promotionChampionshipInternalName).toBeUndefined();
      expect(a1?.relegationChampionshipInternalName).toBe('brasileirao-feminino-serie-a2');
      expect(a1?.relegationRule).toBe('first-phase-table-position');
    });

    test('A2 promotes its semifinalists and relegates two', () => {
      const a2 = findByInternalName('brasileirao-feminino-serie-a2');

      expect(a2?.numberOfTeams).toBe(16);
      expect(a2?.promotionChampionshipInternalName).toBe('brasileirao-feminino-serie-a1');
      expect(a2?.promotionRule).toBe('semifinalists');
      expect(a2?.relegationChampionshipInternalName).toBe('brasileirao-feminino-serie-a3');
      expect(a2?.relegationRule).toBe('first-phase-table-position');
    });

    test('A3 promotes its semifinalists and has no relegation', () => {
      const a3 = findByInternalName('brasileirao-feminino-serie-a3');

      expect(a3?.numberOfTeams).toBe(32);
      expect(a3?.promotionChampionshipInternalName).toBe('brasileirao-feminino-serie-a2');
      expect(a3?.promotionRule).toBe('semifinalists');
      expect(a3?.relegationChampionshipInternalName).toBeUndefined();
    });

    /**
     * A3's field shrinks 2 clubs a season, so it declares the two shapes it is played in rather
     * than a single frozen one. The selection rule itself is generic and pinned in
     * `tests/domain/services/PhaseVariantSelection.test.ts`; these pin A3's own numbers.
     */
    describe('A3’s phase variants', () => {
      const a3 = findByInternalName('brasileirao-feminino-serie-a3');

      test('declares exactly two shapes, most demanding first', () => {
        expect(a3?.phaseVariants?.map((variant) => variant.minNumberOfTeams)).toEqual([32, 0]);
      });

      test('the demanding shape is the 32-club regulation one', () => {
        const [regulation] = a3!.phaseVariants!;
        const groupStage = regulation.phases[0];

        expect(groupStage).toMatchObject({
          kind: 'round-robin',
          numberOfGroups: 8,
          teamsPerGroup: 4,
          legs: 2,
          advancingPerGroup: 2,
        });
        expect(regulation.phases.map((phase) => phase.name)).toEqual([
          '1ª Fase',
          'Oitavas de Final',
          'Quartas de Final',
          'Semifinal',
          'Final',
        ]);
      });

      test('the reduced shape is 4 single-leg groups feeding a Quartas', () => {
        const reduced = a3!.phaseVariants![1];
        const groupStage = reduced.phases[0];

        expect(groupStage).toMatchObject({
          kind: 'round-robin',
          numberOfGroups: 4,
          teamsPerGroup: 8,
          legs: 1,
          advancingPerGroup: 2,
        });
        expect(reduced.phases.map((phase) => phase.name)).toEqual([
          '1ª Fase',
          'Quartas de Final',
          'Semifinal',
          'Final',
        ]);

        // 4 groups × 2 advancing fills a bracket of 4 ties exactly, with no byes.
        const quartas = reduced.phases[1];
        expect(quartas).toMatchObject({ kind: 'knockout', numberOfTies: 4 });
        expect(quartas.kind === 'knockout' && quartas.secondLegHost).toBe('group-winner');
      });

      test('the shape in force is the one A3’s seeded club count selects', () => {
        // A fresh load and a roll-over into the same size must describe the same competition; the
        // repository refuses to load seed data where they disagree.
        const inForce = a3!.phaseVariants!.find(
          (variant) => variant.minNumberOfTeams <= a3!.numberOfTeams
        );

        expect(a3?.phases).toEqual(inForce?.phases);
      });

      test('no other competition declares variants — only A3’s field moves', () => {
        const withVariants = championships
          .filter((championship) => championship.phaseVariants)
          .map((championship) => championship.internalName);

        expect(withVariants).toEqual(['brasileirao-feminino-serie-a3']);
      });
    });

    test('no team plays in two divisions at once', () => {
      // Cups draw their field from the divisions by design, so only the divisions are checked.
      const divisions = championships.filter(
        (championship) =>
          championship.leagueType === 'womens' && championship.hasLeagueTable !== false
      );
      const everyName = divisions.flatMap((championship) => championship.teamNames);

      expect(new Set(everyName).size).toBe(everyName.length);
    });
  });

  describe("the men's divisions", () => {
    const PYRAMID = [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ];
    const mensTeams = new Set((mensTeamsJSON as TeamEntry[]).map((team) => team.internalName));

    test('the pyramid runs Série A to Série D', () => {
      expect(
        championships
          .filter((championship) => championship.leagueType === 'mens')
          .map((championship) => championship.internalName)
      ).toEqual(PYRAMID);
    });

    test('Série C seeds 20 clubs and Série D 96, every one a seeded men’s club', () => {
      const serieC = findByInternalName('brasileirao-serie-c')!;
      const serieD = findByInternalName('brasileirao-serie-d')!;

      expect(serieC.teamNames).toHaveLength(20);
      expect(serieC.numberOfTeams).toBe(20);
      expect(serieD.teamNames).toHaveLength(96);
      expect(serieD.numberOfTeams).toBe(96);
      [...serieC.teamNames, ...serieD.teamNames].forEach((teamName) =>
        expect(mensTeams.has(teamName)).toBe(true)
      );
    });

    test('no club plays in two men’s divisions', () => {
      const everyName = PYRAMID.flatMap(
        (internalName) => findByInternalName(internalName)!.teamNames
      );

      expect(everyName).toHaveLength(20 + 20 + 20 + 96);
      expect(new Set(everyName).size).toBe(everyName.length);
    });

    describe('Série D 2026 (REC D 2026)', () => {
      const serieD = findByInternalName('brasileirao-serie-d')!;
      const phases = serieD.phases as Phase[];
      const knockout = (index: number) => phases[index] as Extract<Phase, { kind: 'knockout' }>;

      test('deals its 96 clubs into 16 regional groups of 6, in CBF’s A01–A16 order', () => {
        const groups = Array.from({ length: 16 }, (_, group) =>
          serieD.teamNames.slice(group * 6, group * 6 + 6)
        );

        expect(phases[0]).toMatchObject({
          kind: 'round-robin',
          numberOfGroups: 16,
          teamsPerGroup: 6,
          legs: 2,
          advancingPerGroup: 4,
        });
        expect(new Set(serieD.teamNames).size).toBe(96);
        expect(groups[0]).toEqual([
          'manauara',
          'nacional-am',
          'sao-raimundo-rr',
          'monte-roraima',
          'manaus',
          'gremio-sampaio',
        ]);
        expect(groups[15]).toEqual([
          'blumenau',
          'marcilio-dias',
          'sao-joseense',
          'sao-jose-rs',
          'brasil-de-pelotas',
          'azuriz',
        ]);
      });

      test('crosses group pairs into 32 2ª Fase ties: 1ºx×4ºy, 2ºy×3ºx, 1ºy×4ºx, 2ºx×3ºy', () => {
        const crossings = knockout(1).crossings;
        const expected = Array.from({ length: 8 }, (_, pair) => {
          const [x, y] = [pair * 2, pair * 2 + 1];
          return [
            [
              { group: x, position: 1 },
              { group: y, position: 4 },
            ],
            [
              { group: y, position: 2 },
              { group: x, position: 3 },
            ],
            [
              { group: y, position: 1 },
              { group: x, position: 4 },
            ],
            [
              { group: x, position: 2 },
              { group: y, position: 3 },
            ],
          ];
        }).flat();

        expect(knockout(1)).toMatchObject({ numberOfTies: 32, secondLegHost: 'group-winner' });
        expect(crossings).toEqual({ from: 'group-position', pairs: expected });
      });

      test('crosses the 3ª and 4ª Fase across each block of 8 ties, as Anexo B prints', () => {
        const block = (base: number) => [
          [base, base + 5],
          [base + 1, base + 4],
          [base + 2, base + 7],
          [base + 3, base + 6],
        ];

        expect(knockout(2).crossings).toEqual({
          from: 'previous-ties',
          pairs: [...block(0), ...block(8), ...block(16), ...block(24)],
        });
        expect(knockout(3).crossings).toEqual({
          from: 'previous-ties',
          pairs: [...block(0), ...block(8)],
        });
      });

      test('re-seeds the quarter-finals and plays the playoff alongside the semifinal', () => {
        expect(knockout(4)).toMatchObject({
          reseed: 'accumulated-points',
          secondLegHost: 'higher-seed',
        });
        expect(knockout(5).playoff).toEqual({
          name: 'Playoffs',
          from: 'previous-phase-losers',
          pairs: [
            [1, 4],
            [2, 3],
          ],
          secondLegHost: 'higher-seed',
          tiebreakers: ['goal-difference', 'seed'],
        });
        expect(phases.map((phase) => phase.name)).toEqual([
          '1ª Fase',
          '2ª Fase',
          '3ª Fase',
          '4ª Fase',
          'Quartas de Final',
          'Semifinal',
          'Final',
        ]);
      });
    });

    test('every promotion and relegation link between neighbours is mirrored, with matching counts', () => {
      for (let tier = 0; tier < PYRAMID.length - 1; tier++) {
        const upper = findByInternalName(PYRAMID[tier])!;
        const lower = findByInternalName(PYRAMID[tier + 1])!;

        expect(upper.relegationChampionshipInternalName).toBe(lower.internalName);
        expect(lower.promotionChampionshipInternalName).toBe(upper.internalName);
        // As many down as up at every step, so the divisions hold their size: 4 ↔ 4 above Série C,
        // and the balanced 6 ↔ 6 MS-112 chose between C and D (REC C 2026 Art. 42 relegates 2).
        expect(upper.numberOfRelegatableTeams).toBe(tier === 2 ? 6 : 4);
        expect(lower.numberOfPromotableTeams).toBe(upper.numberOfRelegatableTeams);
      }

      expect(
        findByInternalName('brasileirao-serie-a')!.promotionChampionshipInternalName
      ).toBeUndefined();
      expect(
        findByInternalName('brasileirao-serie-d')!.relegationChampionshipInternalName
      ).toBeUndefined();
      expect(findByInternalName('brasileirao-serie-d')!.numberOfRelegatableTeams).toBeUndefined();
    });

    test('Série C promotes off its 2ª Fase groups and relegates off its 1ª Fase table', () => {
      const serieC = findByInternalName('brasileirao-serie-c')!;

      expect(serieC.promotionRule).toBe('phase-group-position');
      expect(serieC.promotionPhaseIndex).toBe(1);
      expect(serieC.relegationRule).toBe('first-phase-table-position');
    });

    test('Série D promotes its semifinalists and playoff winners and keeps its groups', () => {
      const serieD = findByInternalName('brasileirao-serie-d')!;

      expect(serieD.promotionRule).toBe('semifinalists-and-playoff-winners');
      expect(serieD.numberOfPromotableTeams).toBe(6);
      expect(serieD.rolloverSlotting).toBe('replace-in-place');
    });
  });

  describe('tiers', () => {
    test('every league division declares its place in the pyramid, top first', () => {
      const tiers = Object.fromEntries(
        championships
          .filter((championship) => championship.hasLeagueTable !== false)
          .map((championship) => [championship.internalName, championship.tier])
      );

      expect(tiers).toEqual({
        'brasileirao-serie-a': 1,
        'brasileirao-serie-b': 2,
        'brasileirao-serie-c': 3,
        'brasileirao-serie-d': 4,
        'brasileirao-feminino-serie-a1': 1,
        'brasileirao-feminino-serie-a2': 2,
        'brasileirao-feminino-serie-a3': 3,
      });
    });

    test('the cups carry no tier', () => {
      expect(findByInternalName('supercopa-feminina')!.tier).toBeUndefined();
      expect(findByInternalName('copa-do-brasil-feminina')!.tier).toBeUndefined();
    });

    test('the repository carries the tier onto the championship', () => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const repository = require('../../../src/infrastructure/repositories/ChampionshipRepository');

        expect(repository.getChampionship('brasileirao-serie-c', false).tier).toBe(3);
        expect(repository.getChampionship('copa-do-brasil-feminina', false).tier).toBeUndefined();
        expect(
          repository
            .getChampionships('womens')
            .map((championship: { tier?: number }) => championship.tier)
        ).toEqual([1, 2, 3, undefined, undefined]);
      });
    });

    describe('rejects a pyramid the container cannot be built from', () => {
      const mens = () =>
        championships
          .filter((championship) => championship.leagueType === 'mens')
          .map((championship) => ({ ...championship }));

      /** Loads Série C against a seed file swapped for `seed`, in an isolated registry. */
      function loadSerieCWithSeed(seed: ChampionshipEntry[]): void {
        jest.isolateModules(() => {
          jest.doMock('../../../src/infrastructure/data/championships.json', () => seed);
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const repository = require('../../../src/infrastructure/repositories/ChampionshipRepository');
          repository.getChampionship('brasileirao-serie-c', false);
        });
      }

      test('loads the seeded pyramid unchanged', () => {
        expect(() => loadSerieCWithSeed(mens())).not.toThrow();
      });

      test('a duplicated tier', () => {
        const seed = mens();
        seed[3].tier = 3;

        expect(() => loadSerieCWithSeed(seed)).toThrow(/unique and contiguous from 1/);
      });

      test('a gap in the tiers', () => {
        const seed = mens();
        seed[3].tier = 5;

        expect(() => loadSerieCWithSeed(seed)).toThrow(/declares tier 5 where 4 was expected/);
      });

      test('a tier that does not start at 1', () => {
        const seed = mens().map((championship) => ({
          ...championship,
          tier: (championship.tier as number) + 1,
        }));

        expect(() => loadSerieCWithSeed(seed)).toThrow(/declares tier 2 where 1 was expected/);
      });

      test('a relegation chain that skips a tier', () => {
        const seed = mens();
        seed[1].relegationChampionshipInternalName = 'brasileirao-serie-d';

        expect(() => loadSerieCWithSeed(seed)).toThrow(
          /brasileirao-serie-b \(tier 2\) relegates into brasileirao-serie-d, but tier 3 is brasileirao-serie-c/
        );
      });

      test('a promotion chain that skips a tier', () => {
        const seed = mens();
        seed[2].promotionChampionshipInternalName = 'brasileirao-serie-a';

        expect(() => loadSerieCWithSeed(seed)).toThrow(
          /brasileirao-serie-c \(tier 3\) promotes into brasileirao-serie-a, but tier 2 is brasileirao-serie-b/
        );
      });
    });
  });
});
