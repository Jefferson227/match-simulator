import mensTeamsJSON from '../../../src/infrastructure/data/teams.json';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';

type Player = { position: string; name: string; age: number; nationalities: string[] };

type TeamEntry = {
  name: string;
  internalName: string;
  shortName: string;
  abbreviation: string;
  colors: { outline: string; background: string; name: string };
  initialOverallStrength: number;
  coach?: { name: string; age: number; nationalities?: string[] };
  players: Player[];
};

const teams = mensTeamsJSON as TeamEntry[];

const HEX = /^#[0-9a-fA-F]{6}$/;
const ISO_ALPHA_3 = /^[A-Z]{3}$/;

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
    expect(teams).toHaveLength(20 + 20 + 20 + 96);
  });

  test('every internal name is unique', () => {
    const internalNames = teams.map((team) => team.internalName);

    expect(new Set(internalNames).size).toBe(internalNames.length);
  });

  test('every club sits in exactly one men’s division', () => {
    const inDivisions = [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ].flatMap(divisionTeamNames);

    expect([...inDivisions].sort()).toEqual(teams.map((team) => team.internalName).sort());
  });

  test('every short name is unique', () => {
    // Full names are not: two América Futebol Clube and two Botafogo Futebol Clube are real.
    const shortNames = teams.map((team) => team.shortName);

    expect(new Set(shortNames).size).toBe(shortNames.length);
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

  test('every squad is the sourced roster: at least 11 players and a goalkeeper', () => {
    // Squads are the 2026 input as-is (MS-112), 17 to 53 players; the thinnest, women's
    // varzea-grande, has 17 and a single goalkeeper.
    teams.forEach((team) => {
      expect({ club: team.internalName, enough: team.players.length >= 11 }).toEqual({
        club: team.internalName,
        enough: true,
      });
      expect(team.players.some((player) => player.position === 'GK')).toBe(true);
    });
  });

  test('every player has an integer age and ISO alpha-3 nationalities, primary first', () => {
    teams.forEach((team) => {
      team.players.forEach((player) => {
        expect(Number.isInteger(player.age)).toBe(true);
        expect(player.nationalities.length).toBeGreaterThanOrEqual(1);
        player.nationalities.forEach((code) => expect(code).toMatch(ISO_ALPHA_3));
      });
    });
  });

  test('a coach, when present, has a name, an age and ISO nationalities', () => {
    teams.forEach((team) => {
      if (!team.coach) return;
      expect(team.coach.name.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(team.coach.age)).toBe(true);
      team.coach.nationalities?.forEach((code) => expect(code).toMatch(ISO_ALPHA_3));
    });
  });

  test('every player has a position the game knows and a clean, non-empty name', () => {
    teams.forEach((team) => {
      team.players.forEach((player) => {
        expect(['GK', 'DF', 'MF', 'FW']).toContain(player.position);
        expect(player.name.trim().length).toBeGreaterThan(0);
        expect(player.name).not.toMatch(/\d/);
      });
    });
  });

  test('each division is stronger than the one below on average', () => {
    // Clubs keep their strength when they change division (MS-112), so the 2026 membership makes
    // neighbouring divisions overlap: a club relegated from B is stronger than one promoted from C.
    // Only the averages are ordered, as MS-106 already did for A and B.
    const averages = [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ].map((division) => average(strengthsOf(division)));

    expect(averages).toEqual([...averages].sort((a, b) => b - a));
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
});
