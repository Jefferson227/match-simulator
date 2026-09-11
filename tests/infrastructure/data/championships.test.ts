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
    };

type ChampionshipEntry = {
  internalName: string;
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

    test('Série C seeds 20 clubs and Série D 64, every one a seeded men’s club', () => {
      const serieC = findByInternalName('brasileirao-serie-c')!;
      const serieD = findByInternalName('brasileirao-serie-d')!;

      expect(serieC.teamNames).toHaveLength(20);
      expect(serieC.numberOfTeams).toBe(20);
      expect(serieD.teamNames).toHaveLength(64);
      expect(serieD.numberOfTeams).toBe(64);
      [...serieC.teamNames, ...serieD.teamNames].forEach((teamName) =>
        expect(mensTeams.has(teamName)).toBe(true)
      );
    });

    test('no club plays in two men’s divisions', () => {
      const everyName = PYRAMID.flatMap(
        (internalName) => findByInternalName(internalName)!.teamNames
      );

      expect(everyName).toHaveLength(20 + 20 + 20 + 64);
      expect(new Set(everyName).size).toBe(everyName.length);
    });

    test('Série D’s teamNames, dealt in eights, are the 8 groups of REC D 2025 Anexo B', () => {
      const teamNames = findByInternalName('brasileirao-serie-d')!.teamNames;
      const groups = Array.from({ length: 8 }, (_, group) =>
        teamNames.slice(group * 8, group * 8 + 8)
      );

      expect(groups).toEqual([
        [
          'independencia',
          'humaita',
          'manaus',
          'manauara',
          'tuna-luso',
          'aguia-de-maraba',
          'gremio-sampaio',
          'trem',
        ],
        [
          'maracana',
          'iguatu',
          'sampaio-correa',
          'maranhao',
          'altos',
          'parnahyba',
          'tocantinopolis',
          'imperatriz',
        ],
        [
          'ferroviario-ce',
          'horizonte',
          'sousa',
          'treze',
          'santa-cruz',
          'central',
          'america-rn',
          'santa-cruz-rn',
        ],
        [
          'asa',
          'penedense',
          'sergipe',
          'lagarto',
          'barcelona-de-ilheus',
          'jequie',
          'juazeirense',
          'uniao-araguainense',
        ],
        [
          'ceilandia',
          'capital-df',
          'aparecidense',
          'goiania',
          'mixto',
          'luverdense',
          'porto-velho',
          'goianesia',
        ],
        [
          'rio-branco-es',
          'porto-vitoria',
          'nova-iguacu',
          'boavista',
          'pouso-alegre',
          'marica',
          'portuguesa',
          'agua-santa',
        ],
        [
          'goiatuba',
          'itabirito',
          'inter-de-limeira',
          'monte-azul',
          'operario-ms',
          'uberlandia',
          'cascavel',
          'cianorte',
        ],
        [
          'azuriz',
          'joinville',
          'barra',
          'marcilio-dias',
          'sao-jose-rs',
          'sao-luiz',
          'guarany-de-bage',
          'brasil-de-pelotas',
        ],
      ]);
    });

    test('every promotion and relegation link between neighbours is mirrored, with matching counts', () => {
      for (let tier = 0; tier < PYRAMID.length - 1; tier++) {
        const upper = findByInternalName(PYRAMID[tier])!;
        const lower = findByInternalName(PYRAMID[tier + 1])!;

        expect(upper.relegationChampionshipInternalName).toBe(lower.internalName);
        expect(lower.promotionChampionshipInternalName).toBe(upper.internalName);
        // 4 down, 4 up at every step: the divisions hold their size.
        expect(upper.numberOfRelegatableTeams).toBe(4);
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

    test('Série D promotes its semifinalists and keeps its groups across roll-overs', () => {
      const serieD = findByInternalName('brasileirao-serie-d')!;

      expect(serieD.promotionRule).toBe('semifinalists');
      expect(serieD.rolloverSlotting).toBe('replace-in-place');
    });
  });
});
