import womensTeamsJSON from '../../../src/infrastructure/data/teams-womens.json';
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

const teams = womensTeamsJSON as TeamEntry[];

const HEX = /^#[0-9a-fA-F]{6}$/;
const ISO_ALPHA_3 = /^[A-Z]{3}$/;

const strengthsOf = (internalNames: string[]) =>
  internalNames.map(
    (internalName) =>
      teams.find((team) => team.internalName === internalName)?.initialOverallStrength as number
  );

const divisionTeamNames = (internalName: string) =>
  (championshipsJSON as { internalName: string; teamNames: string[] }[]).find(
    (championship) => championship.internalName === internalName
  )?.teamNames as string[];

describe('teams-womens.json data integrity', () => {
  test('holds the 66 clubs of the three divisions', () => {
    expect(teams).toHaveLength(66);
  });

  test('every internal name is unique', () => {
    const internalNames = teams.map((team) => team.internalName);

    expect(new Set(internalNames).size).toBe(internalNames.length);
  });

  test('the colliding club names are disambiguated by state', () => {
    const internalNames = teams.map((team) => team.internalName);

    expect(internalNames).toEqual(
      expect.arrayContaining(['mixto-mt', 'mixto-pb', 'juventude-rs', 'juventude-se'])
    );
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

  test('every player has a position the game knows and a non-empty name', () => {
    teams.forEach((team) => {
      team.players.forEach((player) => {
        expect(['GK', 'DF', 'MF', 'FW']).toContain(player.position);
        expect(player.name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test('strengths run A1 above A2 above A3', () => {
    const a1 = strengthsOf(divisionTeamNames('brasileirao-feminino-serie-a1'));
    const a2 = strengthsOf(divisionTeamNames('brasileirao-feminino-serie-a2'));
    const a3 = strengthsOf(divisionTeamNames('brasileirao-feminino-serie-a3'));

    expect(Math.min(...a1)).toBeGreaterThan(Math.max(...a2));
    expect(Math.min(...a2)).toBeGreaterThan(Math.max(...a3));
  });

  test('each division has an internal strength gradient', () => {
    [
      'brasileirao-feminino-serie-a1',
      'brasileirao-feminino-serie-a2',
      'brasileirao-feminino-serie-a3',
    ].forEach((division) => {
      const strengths = strengthsOf(divisionTeamNames(division));

      expect(Math.max(...strengths)).toBeGreaterThan(Math.min(...strengths));
    });
  });
});
