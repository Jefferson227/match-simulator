import {
  getChampionship,
  getChampionships,
} from '../../../src/infrastructure/repositories/ChampionshipRepository';
import TeamRepository from '../../../src/infrastructure/repositories/TeamRepository';
import championshipsData from '../../../src/infrastructure/data/championships.json';
import ChampionshipJSONDTO from '../../../src/infrastructure/data-transfer-objects/ChampionshipJSONDTO';
import LeagueType from '../../../src/domain/enums/LeagueType';

describe('ChampionshipRepository', () => {
  describe('getChampionships', () => {
    test('returns every championship when no league type is given', () => {
      const championships = getChampionships();

      expect(championships).toHaveLength(9);
      expect(championships.map((c) => c.internalName)).toEqual([
        'brasileirao-serie-a',
        'brasileirao-serie-b',
        'brasileirao-serie-c',
        'brasileirao-serie-d',
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
        'supercopa-feminina',
        'copa-do-brasil-feminina',
      ]);
    });

    test("returns only men's championships when filtering by 'mens'", () => {
      const championships = getChampionships('mens');

      expect(championships).toHaveLength(4);
      championships.forEach((championship) => {
        expect(championship.leagueType).toBe('mens');
      });
    });

    test("returns the women's competitions when filtering by 'womens'", () => {
      const championships = getChampionships('womens');

      expect(championships.map((c) => c.internalName)).toEqual([
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
        'supercopa-feminina',
        'copa-do-brasil-feminina',
      ]);
      championships.forEach((championship) => {
        expect(championship.leagueType).toBe('womens');
      });
    });

    test('projects only internalName, tier, name and leagueType', () => {
      const [serieA] = getChampionships('mens');

      expect(serieA).toEqual({
        internalName: 'brasileirao-serie-a',
        tier: 1,
        name: 'BRASILEIRÃO SÉRIE A',
        leagueType: 'mens',
      });
    });
  });

  describe('getChampionship', () => {
    test('carries the league type through from the JSON entry', () => {
      const championship = getChampionship('brasileirao-serie-a', true);

      expect(championship.leagueType).toBe('mens');
    });

    test.each([
      ['brasileirao-feminino-serie-a1', 18],
      ['brasileirao-feminino-serie-a2', 16],
      ['brasileirao-feminino-serie-a3', 32],
    ])("builds %s from the women's seed file", (internalName, numberOfTeams) => {
      const championship = getChampionship(internalName, false);

      expect(championship.leagueType).toBe('womens');
      expect(championship.teams).toHaveLength(numberOfTeams);
      expect(championship.standings).toHaveLength(numberOfTeams);
      championship.teams.forEach((team) => {
        expect(team.players.length).toBeGreaterThanOrEqual(11);
        expect(team.players[0].strength).toBeGreaterThan(0);
      });
    });

    test('carries the declared phases through', () => {
      const championship = getChampionship('brasileirao-feminino-serie-a3', false);

      expect(championship.phases?.map((phase) => phase.name)).toEqual([
        '1ª Fase',
        'Oitavas de Final',
        'Quartas de Final',
        'Semifinal',
        'Final',
      ]);
    });

    test('carries the promotion and relegation rules through', () => {
      const a2 = getChampionship('brasileirao-feminino-serie-a2', false);

      expect(a2.isPromotable && a2.promotionRule).toBe('semifinalists');
      expect(a2.isRelegatable && a2.relegationRule).toBe('first-phase-table-position');
    });

    test("leaves men's entries without phases and on table-position rules", () => {
      const serieA = getChampionship('brasileirao-serie-a', false);

      expect(serieA.phases).toBeUndefined();
      expect(serieA.isRelegatable && serieA.relegationRule).toBe('table-position');
    });
  });
});

describe('ChampionshipRepository starting strengths (MS-115)', () => {
  const championshipsJSON = championshipsData as ChampionshipJSONDTO[];

  const pyramids: [LeagueType, Record<string, [number, number]>][] = [
    [
      'mens',
      {
        'brasileirao-serie-a': [75, 99],
        'brasileirao-serie-b': [50, 74],
        'brasileirao-serie-c': [25, 49],
        'brasileirao-serie-d': [1, 24],
      },
    ],
    [
      'womens',
      {
        'brasileirao-feminino-serie-a1': [67, 99],
        'brasileirao-feminino-serie-a2': [34, 66],
        'brasileirao-feminino-serie-a3': [1, 33],
      },
    ],
  ];

  describe.each(pyramids)('%s pyramid', (leagueType, ranges) => {
    it.each(Object.entries(ranges))(
      'starts every player of %s inside %p',
      (internalName, range) => {
        const [min, max] = range;
        const championship = getChampionship(internalName, false);
        const strengths = championship.teams.flatMap((team) =>
          team.players.map((player) => player.strength)
        );

        expect(strengths.length).toBeGreaterThan(0);
        expect(Math.min(...strengths)).toBeGreaterThanOrEqual(min);
        expect(Math.max(...strengths)).toBeLessThanOrEqual(max);
      }
    );

    it.each(Object.keys(ranges))(
      'keeps the seed order of %s: the strongest club near the top, the weakest near the bottom',
      (internalName) => {
        const [min, max] = ranges[internalName];
        const json = championshipsJSON.find((entry) => entry.internalName === internalName)!;
        const seeds = json.teamNames.map((teamName) =>
          TeamRepository.getInitialOverallStrength(teamName, leagueType)
        );
        const championship = getChampionship(internalName, false);
        const strongest = championship.teams[seeds.indexOf(Math.max(...seeds))];
        const weakest = championship.teams[seeds.indexOf(Math.min(...seeds))];

        strongest.players.forEach((player) =>
          expect(player.strength).toBeGreaterThanOrEqual(max - 2)
        );
        weakest.players.forEach((player) => expect(player.strength).toBeLessThanOrEqual(min + 2));
      }
    );
  });
});
