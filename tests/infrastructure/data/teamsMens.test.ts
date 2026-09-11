import mensTeamsJSON from '../../../src/infrastructure/data/teams.json';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';

type Player = { position: string; name: string };

type TeamEntry = {
  name: string;
  internalName: string;
  shortName: string;
  abbreviation: string;
  colors: { outline: string; background: string; name: string };
  initialOverallStrength: number;
  players: Player[];
};

const teams = mensTeamsJSON as TeamEntry[];

const HEX = /^#[0-9a-fA-F]{6}$/;

const divisionTeamNames = (internalName: string) =>
  (championshipsJSON as { internalName: string; teamNames: string[] }[]).find(
    (championship) => championship.internalName === internalName
  )?.teamNames as string[];

const teamsOf = (division: string) =>
  divisionTeamNames(division).map(
    (internalName) => teams.find((team) => team.internalName === internalName) as TeamEntry
  );

const strengthsOf = (division: string) =>
  teamsOf(division).map((team) => team.initialOverallStrength);

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

describe('teams.json data integrity', () => {
  test('holds every club of the four men’s divisions', () => {
    expect(teams).toHaveLength(20 + 20 + 20 + 64);
  });

  test('every internal name is unique', () => {
    const internalNames = teams.map((team) => team.internalName);

    expect(new Set(internalNames).size).toBe(internalNames.length);
  });

  test('every abbreviation is three characters and unique', () => {
    const abbreviations = teams.map((team) => team.abbreviation);

    abbreviations.forEach((abbreviation) => expect(abbreviation).toHaveLength(3));
    expect(new Set(abbreviations).size).toBe(abbreviations.length);
  });

  test('every colour is a six-digit hex value', () => {
    teams.forEach((team) => {
      expect(team.colors.outline).toMatch(HEX);
      expect(team.colors.background).toMatch(HEX);
      expect(team.colors.name).toMatch(HEX);
    });
  });

  test('every Série C and Série D squad is 23 players with exactly 2 goalkeepers', () => {
    [...teamsOf('brasileirao-serie-c'), ...teamsOf('brasileirao-serie-d')].forEach((team) => {
      const count = (position: string) =>
        team.players.filter((player) => player.position === position).length;

      expect({ club: team.internalName, size: team.players.length }).toEqual({
        club: team.internalName,
        size: 23,
      });
      expect({
        club: team.internalName,
        GK: count('GK'),
        DF: count('DF'),
        MF: count('MF'),
        FW: count('FW'),
      }).toEqual({
        club: team.internalName,
        GK: 2,
        DF: 6,
        MF: 7,
        FW: 8,
      });
    });
  });

  test('no Série C or Série D squad names the same player twice', () => {
    [...teamsOf('brasileirao-serie-c'), ...teamsOf('brasileirao-serie-d')].forEach((team) => {
      const names = team.players.map((player) => player.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  test('every player has a position the game knows and a clean, non-empty name', () => {
    teams.forEach((team) => {
      team.players.forEach((player) => {
        expect(['GK', 'DF', 'MF', 'FW']).toContain(player.position);
        expect(player.name.trim().length).toBeGreaterThan(0);
        // CBF prefixes match-sheet names with the shirt number ("37 - Serginho").
        expect(player.name).not.toMatch(/\d/);
      });
    });
  });

  test('strengths run B above C above D, with no overlap', () => {
    expect(Math.min(...strengthsOf('brasileirao-serie-b'))).toBeGreaterThan(
      Math.max(...strengthsOf('brasileirao-serie-c'))
    );
    expect(Math.min(...strengthsOf('brasileirao-serie-c'))).toBeGreaterThan(
      Math.max(...strengthsOf('brasileirao-serie-d'))
    );
  });

  test('Série A is stronger than Série B on average', () => {
    // The pre-MS-106 A and B seeds overlap (A's floor is below B's ceiling), so only the averages
    // are ordered for that pair. See the MS-106 task notes.
    expect(average(strengthsOf('brasileirao-serie-a'))).toBeGreaterThan(
      average(strengthsOf('brasileirao-serie-b'))
    );
  });

  test('each division has an internal strength gradient', () => {
    [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ].forEach((division) => {
      const strengths = strengthsOf(division);
      expect(Math.max(...strengths)).toBeGreaterThan(Math.min(...strengths));
    });
  });

  test('Caxias carries the name CBF registers it under', () => {
    expect(teams.find((team) => team.internalName === 'caxias')?.name).toBe(
      'Sociedade Esportiva e Recreativa Caxias do Sul'
    );
  });
});
