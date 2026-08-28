import {
  getChampionship,
  getChampionships,
} from '../../../src/infrastructure/repositories/ChampionshipRepository';

describe('ChampionshipRepository', () => {
  describe('getChampionships', () => {
    test('returns every championship when no league type is given', () => {
      const championships = getChampionships();

      expect(championships).toHaveLength(2);
      expect(championships.map((c) => c.internalName)).toEqual([
        'brasileirao-serie-a',
        'brasileirao-serie-b',
      ]);
    });

    test("returns only men's championships when filtering by 'mens'", () => {
      const championships = getChampionships('mens');

      expect(championships).toHaveLength(2);
      championships.forEach((championship) => {
        expect(championship.leagueType).toBe('mens');
      });
    });

    test("returns an empty array without throwing when filtering by 'womens'", () => {
      expect(() => getChampionships('womens')).not.toThrow();
      expect(getChampionships('womens')).toEqual([]);
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
