import { describe, expect, it } from '@jest/globals';
import SeasonAgeingService, {
  SeasonAgeingInput,
} from '../../../src/domain/services/SeasonAgeingService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import Coach from '../../../src/domain/models/Coach';
import Player from '../../../src/domain/models/Player';
import { Team } from '../../../src/domain/models/Team';
import LeagueType from '../../../src/domain/enums/LeagueType';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import { FEMALE_NICKNAMES } from '../../../src/domain/constants/GeneratedNames';
import { neverRng } from '../../support/retirementRng';

const SEASON = 2026;
const RETIRE = 0;
const STAY = 1000;

type Id = Team['id'];

let idCounter = 0;
const nextId = (): Id => `id-${(idCounter += 1)}-x-y-z` as Id;

function player(name: string, age: number, overrides: Partial<Player> = {}): Player {
  return {
    id: nextId(),
    position: 'MF',
    name,
    strength: 50,
    age,
    nationalities: ['URU'],
    xp: 7,
    isStarter: true,
    isSub: false,
    stamina: 80,
    ...overrides,
  };
}

function team(shortName: string, players: Player[], extra: Partial<Team> = {}): Team {
  return {
    id: nextId(),
    fullName: shortName,
    shortName,
    abbreviation: shortName.slice(0, 3).toUpperCase(),
    colors: { outline: '#000', background: '#fff', text: '#000' },
    players,
    morale: 50,
    isControlledByHuman: false,
    ...extra,
  };
}

function division(internalName: string, teams: Team[], leagueType: LeagueType = 'mens') {
  return {
    internalName,
    leagueType,
    teams,
    standings: [],
    matchContainer: { currentSeason: SEASON },
  } as unknown as Championship;
}

function input(
  championships: Championship[],
  coachPool: Coach[] = [],
  cups?: Championship[]
): SeasonAgeingInput {
  const championshipContainer: ChampionshipContainer = {
    championships,
    playableInternalName: championships[0].internalName,
    ...(cups && { cups }),
  };
  return { championshipContainer, coachPool, retiredPlayers: [], retiredCoaches: [] };
}

/**
 * Percentage rolls (`nextInt(0, 1000)`) come from `rolls` in order, then `fallbackRoll`. Every
 * other draw — ages, strengths, name picks — walks a counter so successive names differ.
 */
function percentRng(rolls: number[], fallbackRoll = STAY): RandomProvider {
  const queue = [...rolls];
  let counter = 0;
  return {
    nextInt: (min, max) => {
      if (min === 0 && max === 1000) return queue.length ? (queue.shift() as number) : fallbackRoll;
      return min + (counter++ % (max - min + 1));
    },
  };
}

const alwaysRng = (): RandomProvider => percentRng([], RETIRE);

function run(ageingInput: SeasonAgeingInput, rng: RandomProvider) {
  const result = SeasonAgeingService.runSeasonAgeing(ageingInput, { rng });
  expect(result.succeeded).toBe(true);
  return result.getResult();
}

function teamsOf(container: ChampionshipContainer): Team[] {
  return container.championships.flatMap((championship) => championship.teams);
}

describe('SeasonAgeingService.runSeasonAgeing', () => {
  it('ages every player, every AI coach and every pool coach by one year', () => {
    const club = team('Club', [player('A', 20), player('B', 33)], {
      coach: { name: 'Coach', age: 50 },
    });
    const output = run(input([division('d', [club])], [{ name: 'Pool', age: 40 }]), neverRng);

    const [aged] = teamsOf(output.championshipContainer);
    expect(aged.players.map((p) => p.age)).toEqual([21, 34]);
    expect(aged.coach?.age).toBe(51);
    expect(output.coachPool).toEqual([{ name: 'Pool', age: 41 }]);
    expect(output.retiredPlayers).toEqual([]);
    expect(output.retiredCoaches).toEqual([]);
  });

  it('rolls against the age just reached', () => {
    // 30 → 31 moves a player from the 0.5% band to the 10% band; a roll of 10.0 now retires them.
    const turning31 = team('A', [player('Turning31', 30)]);
    const turning30 = team('B', [player('Turning30', 29)]);
    const output = run(
      input([division('d', [turning31, turning30])]),
      percentRng([100, STAY, STAY, 100])
    );

    expect(output.retiredPlayers.map((p) => p.name)).toEqual(['Turning31']);
    expect(output.retiredPlayers[0].age).toBe(31);
  });

  it('replaces a retiree in place and records them as retired, without match-scoped fields', () => {
    const retiree = player('Veteran', 40, { position: 'GK' });
    const club = team('Club', [player('Before', 20), retiree, player('After', 20)]);
    const output = run(input([division('d', [club])]), percentRng([STAY, RETIRE]));

    const [aged] = teamsOf(output.championshipContainer);
    expect(aged.players).toHaveLength(3);
    expect(aged.players[0].name).toBe('Before');
    expect(aged.players[2].name).toBe('After');

    const replacement = aged.players[1];
    expect(replacement.id).not.toBe(retiree.id);
    expect(replacement.position).toBe('GK');
    expect(replacement.age).toBeGreaterThanOrEqual(17);
    expect(replacement.age).toBeLessThanOrEqual(20);

    expect(output.retiredPlayers).toEqual([
      {
        id: retiree.id,
        position: 'GK',
        name: 'Veteran',
        strength: 50,
        age: 41,
        nationalities: ['URU'],
        xp: 7,
        isRetired: true,
        retiredInSeason: SEASON,
        lastTeamId: club.id,
        lastTeamShortName: 'Club',
      },
    ]);
  });

  it('sends a retiree to the coach pool on the 3% roll, and records them as retired too', () => {
    const club = team('Club', [player('Joins', 40), player('Does not', 40)]);
    // Joins: retire, 3.0 → coach. Does not: retire, 3.1 → no coach.
    const output = run(input([division('d', [club])]), percentRng([RETIRE, 30, STAY, RETIRE, 31]));

    expect(output.retiredPlayers.map((p) => p.name)).toEqual(['Joins', 'Does not']);
    expect(output.coachPool).toEqual([{ name: 'Joins', age: 41, nationalities: ['URU'] }]);
  });

  it('never ages or retires the human club’s coach, but does its players', () => {
    const human = team('Human', [player('H1', 40), player('H2', 40)], {
      isControlledByHuman: true,
      coach: { name: 'Seed Coach', age: 80 },
    });
    const output = run(input([division('d', [human])]), alwaysRng());

    const [aged] = teamsOf(output.championshipContainer);
    expect(aged.coach).toEqual({ name: 'Seed Coach', age: 80 });
    expect(output.retiredCoaches).toEqual([]);
    expect(output.retiredPlayers.map((p) => p.name)).toEqual(['H1', 'H2']);
  });

  it('leaves a club with no coach without one', () => {
    const coachless = team('None', [player('P', 20)]);
    const output = run(input([division('d', [coachless])]), alwaysRng());

    const [aged] = teamsOf(output.championshipContainer);
    expect(aged.coach).toBeUndefined();
    expect(output.retiredCoaches).toEqual([]);
  });

  it('replaces a retiring AI coach with a Brazilian aged 45–50 and records the retiree', () => {
    const club = team('Club', [], {
      coach: { name: 'Old Coach', age: 70, nationalities: ['POR'] },
    });
    const output = run(input([division('d', [club])]), alwaysRng());

    const [aged] = teamsOf(output.championshipContainer);
    expect(aged.coach?.name).not.toBe('Old Coach');
    expect(aged.coach?.age).toBeGreaterThanOrEqual(45);
    expect(aged.coach?.age).toBeLessThanOrEqual(50);
    expect(aged.coach?.nationalities).toEqual(['BRA']);
    expect(output.retiredCoaches).toEqual([
      {
        name: 'Old Coach',
        age: 71,
        nationalities: ['POR'],
        isRetired: true,
        retiredInSeason: SEASON,
        lastTeamId: club.id,
        lastTeamShortName: 'Club',
      },
    ]);
    expect(output.coachPool).toEqual([]);
  });

  it('retires a pool coach out of the pool without replacing them', () => {
    const pool: Coach[] = [
      { name: 'Retires', age: 70 },
      { name: 'Stays', age: 70 },
    ];
    // 71 is the 80% band: 80.0 retires, 80.1 does not.
    const output = run(input([division('d', [])], pool), percentRng([800, 801]));

    expect(output.coachPool).toEqual([{ name: 'Stays', age: 71 }]);
    expect(output.retiredCoaches).toEqual([
      { name: 'Retires', age: 71, isRetired: true, retiredInSeason: SEASON },
    ]);
  });

  it('does not roll a coach who joined the pool this season', () => {
    const club = team('Club', [player('New Coach', 80)]);
    const output = run(input([division('d', [club])]), alwaysRng());

    expect(output.coachPool).toEqual([{ name: 'New Coach', age: 81, nationalities: ['URU'] }]);
    expect(output.retiredCoaches).toEqual([]);
  });

  it('reports only the human club’s retirements', () => {
    const human = team('Human', [player('H1', 40)], { isControlledByHuman: true });
    const other = team('Other', [player('O1', 40)]);
    const output = run(input([division('a', [other]), division('b', [human])]), alwaysRng());

    expect(output.retiredPlayers.map((p) => p.name)).toEqual(['O1', 'H1']);
    expect(output.report?.season).toBe(SEASON);
    expect(output.report?.teamId).toBe(human.id);
    expect(output.report?.entries).toHaveLength(1);

    const [entry] = output.report!.entries;
    const humanAfter = teamsOf(output.championshipContainer).find((t) => t.id === human.id)!;
    expect(entry.retired.name).toBe('H1');
    expect(entry.replacement).toEqual(humanAfter.players[0]);
    expect(entry.becameCoach).toBe(true);
  });

  it('reports the human club with no entries when nobody there retired', () => {
    const human = team('Human', [player('H1', 20)], { isControlledByHuman: true });
    const output = run(input([division('d', [human])]), neverRng);
    expect(output.report).toEqual({ season: SEASON, teamId: human.id, entries: [] });
  });

  it('has no report when no club is the human’s', () => {
    const output = run(input([division('d', [team('AI', [player('P', 20)])])]), neverRng);
    expect(output.report).toBeUndefined();
  });

  it('keeps every squad’s size and gives every generated person an unused name', () => {
    const clubs = [
      team('One', [player('P1', 40), player('P2', 40), player('P3', 40)], {
        coach: { name: 'C1', age: 80 },
      }),
      team('Two', [player('P4', 40), player('P5', 40)], { coach: { name: 'C2', age: 80 } }),
    ];
    const output = run(input([division('d', clubs)]), alwaysRng());

    const after = teamsOf(output.championshipContainer);
    expect(after.map((t) => t.players.length)).toEqual([3, 2]);

    const names = [
      ...after.flatMap((t) => t.players.map((p) => p.name)),
      ...after.map((t) => t.coach!.name),
    ];
    expect(new Set(names).size).toBe(names.length);
    for (const retiree of ['P1', 'P2', 'P3', 'P4', 'P5', 'C1', 'C2']) {
      expect(names).not.toContain(retiree);
    }
  });

  it('draws women’s league replacements from the female lists', () => {
    const club = team('Club', [player('Veterana', 40)]);
    const output = run(input([division('d', [club], 'womens')]), alwaysRng());
    const [aged] = teamsOf(output.championshipContainer);
    // alwaysRng makes the 20% nickname roll succeed, so the name is a nickname alone.
    expect(FEMALE_NICKNAMES).toContain(aged.players[0].name);
  });

  it('ages a club listed in two championships only once', () => {
    const shared = team('Shared', [player('P', 20)], { coach: { name: 'C', age: 50 } });
    const output = run(input([division('d', [shared])], [], [division('cup', [shared])]), neverRng);

    const inDivision = output.championshipContainer.championships[0].teams[0];
    const inCup = output.championshipContainer.cups![0].teams[0];
    expect(inDivision.players[0].age).toBe(21);
    expect(inDivision.coach?.age).toBe(51);
    expect(inCup).toBe(inDivision);
  });

  it('does not mutate its input', () => {
    const club = team('Club', [player('P', 40)], { coach: { name: 'C', age: 80 } });
    const ageingInput = input([division('d', [club])], [{ name: 'Pool', age: 80 }]);
    const before = JSON.stringify(ageingInput);

    run(ageingInput, alwaysRng());

    expect(JSON.stringify(ageingInput)).toBe(before);
  });

  it('fails as an OperationResult when the container has no playable division', () => {
    const broken = input([division('d', [])]);
    broken.championshipContainer.playableInternalName = 'missing';

    const result = SeasonAgeingService.runSeasonAgeing(broken, { rng: neverRng });

    expect(result.succeeded).toBe(false);
    expect(result.error.message).toBe('Playable championship not found.');
  });
});
