import { describe, expect, it } from '@jest/globals';
import MatchService from '../../../core/services/MatchService';
import ChampionshipContainer from '../../../core/models/ChampionshipContainer';
import { Championship } from '../../../core/models/Championship';
import { Team } from '../../../core/models/Team';
import { RandomProvider } from '../../../core/features/match-simulation/types';

function buildTeam(params: {
  id: `${string}-${string}-${string}-${string}-${string}`;
  name: string;
  morale?: number;
  midfieldStrength?: number;
  defenseStrength?: number;
}): Team {
  return {
    id: params.id,
    fullName: params.name,
    shortName: params.name,
    abbreviation: params.name.slice(0, 3).toUpperCase(),
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [
      {
        id: `${params.id.slice(0, 35)}1` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'GK',
        name: `${params.name} GK`,
        strength: params.defenseStrength ?? 30,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}2` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'DF',
        name: `${params.name} DF`,
        strength: params.defenseStrength ?? 30,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}3` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'MF',
        name: `${params.name} MF`,
        strength: params.midfieldStrength ?? 30,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}4` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'FW',
        name: `${params.name} FW`,
        strength: 30,
        isStarter: true,
        isSub: false,
      },
    ],
    morale: params.morale ?? 50,
    isControlledByHuman: false,
  };
}

function buildContainer(roundStatus: 'in-progress' | 'not-started' = 'in-progress') {
  const homeTeam = buildTeam({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Home',
    midfieldStrength: 90,
    defenseStrength: 40,
  });
  const awayTeam = buildTeam({
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Away',
    midfieldStrength: 20,
    defenseStrength: 10,
  });

  const championship: Championship = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Mock Championship',
    internalName: 'mock-championship',
    numberOfTeams: 2,
    teams: [homeTeam, awayTeam],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 2,
      rounds: [
        {
          id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          number: 1,
          status: roundStatus,
          matches: [
            {
              id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
              homeTeam,
              homeTeamScore: 0,
              awayTeamScore: 0,
              awayTeam,
              scorers: [],
            },
          ],
        },
      ],
    },
    type: 'double-round-robin',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
  };

  const container: ChampionshipContainer = {
    playableChampionship: championship,
  };

  return container;
}

function queuedRng(values: number[]): RandomProvider {
  let index = 0;
  return {
    nextInt(min: number, max: number): number {
      const value = values[index] ?? min;
      index += 1;
      if (value < min) return min;
      if (value > max) return max;
      return value;
    },
  };
}

describe('MatchService.runMatchActions', () => {
  it('runs one tick and can score a goal using deterministic RNG', () => {
    const container = buildContainer('in-progress');
    const rng = queuedRng([
      0,
      100,
      0,
      90,
      1,
    ]);

    const result = MatchService.runMatchActions(container, { rng });

    expect(result.succeeded).toBe(true);
    const updatedContainer = result.getResult();
    const updatedMatch =
      updatedContainer.playableChampionship.matchContainer.rounds[0].matches[0];

    expect(updatedContainer.playableChampionship.matchContainer.timer).toBe(1);
    expect(updatedMatch.homeTeamScore).toBe(1);
    expect(updatedMatch.awayTeamScore).toBe(0);
    expect(updatedMatch.scorers).toHaveLength(1);
    expect(updatedMatch.scorers[0].scorerTeam).toBe('home');
    expect(updatedMatch.scorers[0].time).toBe(0);
    expect(updatedMatch.simulation?.fieldArea).toBe('midfield');
    expect(updatedMatch.simulation?.possessionTeam).toBe('away');
  });

  it('does not simulate when round is not in progress', () => {
    const container = buildContainer('not-started');

    const result = MatchService.runMatchActions(container);

    expect(result.succeeded).toBe(true);
    const updatedContainer = result.getResult();
    const updatedMatch =
      updatedContainer.playableChampionship.matchContainer.rounds[0].matches[0];

    expect(updatedContainer.playableChampionship.matchContainer.timer).toBe(0);
    expect(updatedMatch.homeTeamScore).toBe(0);
    expect(updatedMatch.awayTeamScore).toBe(0);
    expect(updatedMatch.scorers).toHaveLength(0);
  });

  it('returns error when container is invalid', () => {
    const result = MatchService.runMatchActions({} as ChampionshipContainer);

    expect(result.succeeded).toBe(false);
    expect(result.error.message.length > 0).toBe(true);
  });
});
