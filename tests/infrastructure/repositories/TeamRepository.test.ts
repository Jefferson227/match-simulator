import TeamRepository from '../../../src/infrastructure/repositories/TeamRepository';

describe('TeamRepository', () => {
  describe('getTeam', () => {
    test("reads the women's seed file when the league type is 'womens'", () => {
      const team = TeamRepository.getTeam('corinthians', 'womens');

      expect(team.fullName).toBe('Sport Club Corinthians Paulista');
      expect(team.players).toHaveLength(23);
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
});
