import TeamRepository from '../../../src/infrastructure/repositories/TeamRepository';
import TeamJSONDTO from '../../../src/infrastructure/data-transfer-objects/TeamJSONDTO';

describe('TeamRepository', () => {
  describe('getTeam', () => {
    test("reads the women's seed file when the league type is 'womens'", () => {
      const team = TeamRepository.getTeam('corinthians', 'womens');

      expect(team.fullName).toBe('Sport Club Corinthians Paulista');
      expect(team.players.length).toBeGreaterThanOrEqual(11);
    });

    test("reads the men's seed file when the league type is 'mens'", () => {
      const team = TeamRepository.getTeam('corinthians', 'mens');

      expect(team.players.map((player) => player.name)).not.toEqual(
        TeamRepository.getTeam('corinthians', 'womens').players.map((player) => player.name)
      );
    });

    test("defaults to the men's seed file when no league type is given", () => {
      const withoutLeagueType = TeamRepository.getTeam('corinthians');
      const mens = TeamRepository.getTeam('corinthians', 'mens');

      expect(withoutLeagueType.players.map((player) => player.name)).toEqual(
        mens.players.map((player) => player.name)
      );
    });

    test('keeps the two seed files apart', () => {
      // 'mixto-mt' only exists in the women's file; 'mirassol' only in the men's.
      expect(() => TeamRepository.getTeam('mixto-mt', 'womens')).not.toThrow();
      expect(() => TeamRepository.getTeam('mixto-mt', 'mens')).toThrow('Team not found: mixto-mt.');
      expect(() => TeamRepository.getTeam('mirassol', 'mens')).not.toThrow();
      expect(() => TeamRepository.getTeam('mirassol', 'womens')).toThrow(
        'Team not found: mirassol.'
      );
    });

    test('throws for an unknown team', () => {
      expect(() => TeamRepository.getTeam('does-not-exist')).toThrow(
        'Team not found: does-not-exist.'
      );
      expect(() => TeamRepository.getTeam('does-not-exist', 'womens')).toThrow(
        'Team not found: does-not-exist.'
      );
    });

    test('rolls player strengths off the club overall strength', () => {
      const team = TeamRepository.getTeam('palmeiras', 'womens');

      team.players.forEach((player) => {
        expect(player.strength).toBeGreaterThan(0);
        expect(player.xp).toBe(0);
        expect(player.isStarter).toBe(false);
      });
    });
  });

  describe('coach and nationalities (MS-112)', () => {
    const seedTeam = (overrides: Partial<TeamJSONDTO>): TeamJSONDTO => ({
      name: 'Seed Club',
      internalName: 'seed-club',
      shortName: 'Seed',
      abbreviation: 'SEE',
      colors: { outline: '#000000', background: '#ffffff', name: '#000000' },
      initialOverallStrength: 50,
      players: [{ position: 'GK', name: 'Keeper', age: 30, nationalities: ['PRY', 'BRA'] }],
      ...overrides,
    });

    function getTeamFromSeed(seed: TeamJSONDTO[], internalName: string) {
      let team: ReturnType<typeof TeamRepository.getTeam> | undefined;
      jest.isolateModules(() => {
        jest.doMock('../../../src/infrastructure/data/teams.json', () => seed);
        const isolated = require('../../../src/infrastructure/repositories/TeamRepository');
        team = isolated.default.getTeam(internalName, 'mens');
      });
      return team!;
    }

    afterEach(() => {
      jest.dontMock('../../../src/infrastructure/data/teams.json');
    });

    test('maps player nationalities in source order', () => {
      const team = getTeamFromSeed([seedTeam({})], 'seed-club');

      expect(team.players[0].nationalities).toEqual(['PRY', 'BRA']);
    });

    test('maps the coach, keeping nationalities only when the source has them', () => {
      const team = getTeamFromSeed(
        [seedTeam({ coach: { name: 'With', age: 45, nationalities: ['ARG'] } })],
        'seed-club'
      );
      const withoutNationality = getTeamFromSeed(
        [seedTeam({ internalName: 'no-nationality', coach: { name: 'Without', age: 60 } })],
        'no-nationality'
      );

      expect(team.coach).toEqual({ name: 'With', age: 45, nationalities: ['ARG'] });
      expect(withoutNationality.coach).toEqual({ name: 'Without', age: 60 });
      expect(withoutNationality.coach).not.toHaveProperty('nationalities');
    });

    test('omits the coach field when the seed has none', () => {
      const team = getTeamFromSeed([seedTeam({})], 'seed-club');

      expect(team).not.toHaveProperty('coach');
    });
  });
});
