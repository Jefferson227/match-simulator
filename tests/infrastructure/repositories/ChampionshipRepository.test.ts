import {
  getChampionship,
  getChampionships,
} from '../../../src/infrastructure/repositories/ChampionshipRepository';

describe('ChampionshipRepository', () => {
  describe('getChampionships', () => {
    test('returns every championship when no league type is given', () => {
      const championships = getChampionships();

      expect(championships).toHaveLength(5);
      expect(championships.map((c) => c.internalName)).toEqual([
        'brasileirao-serie-a',
        'brasileirao-serie-b',
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
      ]);
    });

    test("returns only men's championships when filtering by 'mens'", () => {
      const championships = getChampionships('mens');

      expect(championships).toHaveLength(2);
      championships.forEach((championship) => {
        expect(championship.leagueType).toBe('mens');
      });
    });

    test("returns the three women's divisions when filtering by 'womens'", () => {
      const championships = getChampionships('womens');

      expect(championships.map((c) => c.internalName)).toEqual([
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
      ]);
      championships.forEach((championship) => {
        expect(championship.leagueType).toBe('womens');
      });
    });

    test('projects only internalName, name and leagueType', () => {
      const [serieA] = getChampionships('mens');

      expect(serieA).toEqual({
        internalName: 'brasileirao-serie-a',
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
  });
});
