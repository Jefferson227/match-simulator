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
  numberOfTeams: number;
  teamNames: string[];
  promotionChampionshipInternalName?: string;
  relegationChampionshipInternalName?: string;
  promotionRule?: string;
  relegationRule?: string;
  phases?: Phase[];
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
    const withPhases = championships.filter((championship) => championship.phases?.length);

    test('the three women divisions declare their phases', () => {
      expect(withPhases.map((championship) => championship.internalName)).toEqual([
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

    test('each knockout phase halves the survivors of the phase before it', () => {
      withPhases.forEach((championship) => {
        const phases = championship.phases as Phase[];
        const [first, ...knockouts] = phases;
        if (first.kind !== 'round-robin') throw new Error('expected a round-robin first phase');

        let survivors = first.numberOfGroups * first.advancingPerGroup;
        knockouts.forEach((phase) => {
          if (phase.kind !== 'knockout') throw new Error('expected a knockout phase');

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

    test('no team plays in two divisions at once', () => {
      const womens = championships.filter((championship) => championship.leagueType === 'womens');
      const everyName = womens.flatMap((championship) => championship.teamNames);

      expect(new Set(everyName).size).toBe(everyName.length);
    });
  });
});
