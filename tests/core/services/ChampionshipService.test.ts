import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../core/services/ChampionshipService';
import ChampionshipContainer from '../../../core/models/ChampionshipContainer';
import { Championship } from '../../../core/models/Championship';
import { Team } from '../../../core/models/Team';

function buildTeam(id: string, abbreviation: string, isControlledByHuman = false): Team {
  return {
    id: `${id}${id}${id}${id}${id}${id}${id}${id}-${id}${id}${id}${id}-${id}${id}${id}${id}-${id}${id}${id}${id}-${id}${id}${id}${id}${id}${id}${id}${id}${id}${id}${id}${id}` as Team['id'],
    fullName: `${abbreviation} Full`,
    shortName: abbreviation,
    abbreviation,
    colors: {
      outline: '#111111',
      background: '#222222',
      text: '#eeeeee',
    },
    players: [],
    morale: 50,
    isControlledByHuman,
  };
}

function buildChampionship(params: {
  id: string;
  name: string;
  internalName: string;
  teams: Team[];
  standingsOrder?: Team[];
  currentRound: number;
  totalRounds: number;
  currentSeason?: number;
  isPromotable?: boolean;
  numberOfPromotableTeams?: number;
  promotionChampionshipInternalName?: string;
  isRelegatable?: boolean;
  numberOfRelegatableTeams?: number;
  relegationChampionshipInternalName?: string;
}): Championship {
  const standingsOrder = params.standingsOrder ?? params.teams;

  return {
    id: params.id,
    name: params.name,
    internalName: params.internalName,
    numberOfTeams: params.teams.length,
    teams: params.teams,
    standings: standingsOrder.map((team, index) => ({
      team,
      position: index + 1,
      wins: Math.max(0, standingsOrder.length - index - 1),
      draws: 0,
      losses: index,
      goalsFor: 10 - index,
      goalsAgainst: index,
      points: Math.max(0, (standingsOrder.length - index - 1) * 3),
    })),
    matchContainer: {
      timer: 90,
      currentSeason: params.currentSeason ?? 2026,
      currentRound: params.currentRound,
      totalRounds: params.totalRounds,
      rounds: [],
    },
    type: 'double-round-robin',
    hasTeamControlledByHuman: params.teams.some((team) => team.isControlledByHuman),
    isPromotable: params.isPromotable ?? false,
    numberOfPromotableTeams: params.numberOfPromotableTeams ?? 0,
    promotionChampionshipInternalName: params.promotionChampionshipInternalName ?? '',
    isRelegatable: params.isRelegatable ?? false,
    numberOfRelegatableTeams: params.numberOfRelegatableTeams ?? 0,
    relegationChampionshipInternalName: params.relegationChampionshipInternalName ?? '',
  } as Championship;
}

describe('ChampionshipService.runEndOfChampionshipActions', () => {
  it('swaps promoted and relegated teams across related championships when the playable championship is over', () => {
    const upperA = buildTeam('a', 'UPA');
    const upperB = buildTeam('b', 'UPB');
    const upperC = buildTeam('c', 'UPC');
    const upperD = buildTeam('d', 'UPD');

    const playableA = buildTeam('e', 'PLA', true);
    const playableB = buildTeam('f', 'PLB');
    const playableC = buildTeam('g', 'PLC');
    const playableD = buildTeam('h', 'PLD');

    const lowerA = buildTeam('i', 'LWA');
    const lowerB = buildTeam('j', 'LWB');
    const lowerC = buildTeam('k', 'LWC');
    const lowerD = buildTeam('l', 'LWD');

    const promotionChampionship = buildChampionship({
      id: 'promotion',
      name: 'Upper Division',
      internalName: 'upper',
      teams: [upperA, upperB, upperC, upperD],
      standingsOrder: [upperA, upperB, upperC, upperD],
      currentRound: 6,
      totalRounds: 6,
    });

    const playableChampionship = buildChampionship({
      id: 'playable',
      name: 'Playable Division',
      internalName: 'playable',
      teams: [playableA, playableB, playableC, playableD],
      standingsOrder: [playableA, playableB, playableC, playableD],
      currentRound: 6,
      totalRounds: 6,
      isPromotable: true,
      numberOfPromotableTeams: 1,
      promotionChampionshipInternalName: 'upper',
      isRelegatable: true,
      numberOfRelegatableTeams: 1,
      relegationChampionshipInternalName: 'lower',
    });

    const relegationChampionship = buildChampionship({
      id: 'relegation',
      name: 'Lower Division',
      internalName: 'lower',
      teams: [lowerA, lowerB, lowerC, lowerD],
      standingsOrder: [lowerA, lowerB, lowerC, lowerD],
      currentRound: 6,
      totalRounds: 6,
    });

    const championshipContainer: ChampionshipContainer = {
      playableChampionship,
      promotionChampionship,
      relegationChampionship,
    };

    const result = ChampionshipService.runEndOfChampionshipActions(championshipContainer);

    expect(result.succeeded).toBe(true);

    const updatedContainer = result.getResult();

    expect(updatedContainer.playableChampionship.teams.map((team) => team.abbreviation)).toEqual(
      ['PLB', 'PLC', 'UPD', 'LWA']
    );
    expect(updatedContainer.promotionChampionship?.teams.map((team) => team.abbreviation)).toEqual(
      ['UPA', 'UPB', 'UPC', 'PLA']
    );
    expect(updatedContainer.relegationChampionship?.teams.map((team) => team.abbreviation)).toEqual(
      ['LWB', 'LWC', 'LWD', 'PLD']
    );

    expect(updatedContainer.playableChampionship.matchContainer.currentRound).toBe(1);
    expect(updatedContainer.playableChampionship.matchContainer.timer).toBe(0);
    expect(updatedContainer.playableChampionship.matchContainer.currentSeason).toBe(2027);
    expect(updatedContainer.playableChampionship.standings.every((standing) => standing.points === 0)).toBe(true);
  });

  it('returns the same championship container when the championship is not over yet', () => {
    const playableChampionship = buildChampionship({
      id: 'playable',
      name: 'Playable Division',
      internalName: 'playable',
      teams: [buildTeam('m', 'AAA'), buildTeam('n', 'BBB')],
      currentRound: 3,
      totalRounds: 6,
    });

    const championshipContainer: ChampionshipContainer = {
      playableChampionship,
    };

    const result = ChampionshipService.runEndOfChampionshipActions(championshipContainer);

    expect(result.succeeded).toBe(true);
    expect(result.getResult()).toEqual(championshipContainer);
  });
});
