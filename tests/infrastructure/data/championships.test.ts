import championshipsJSON from '../../../src/infrastructure/data/championships.json';

type ChampionshipEntry = {
  internalName: string;
  leagueType: string;
  promotionChampionshipInternalName?: string;
  relegationChampionshipInternalName?: string;
};

const VALID_LEAGUE_TYPES = ['mens', 'womens'];

const championships = championshipsJSON as ChampionshipEntry[];

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
});
