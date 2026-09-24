import { describe, expect, it } from '@jest/globals';
import MatchService from '../../../src/domain/services/MatchService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';

function buildTeam(params: {
  id: `${string}-${string}-${string}-${string}-${string}`;
  name: string;
  morale?: number;
  midfieldStrength?: number;
  defenseStrength?: number;
  age?: number;
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
        age: params.age ?? 26,
        nationalities: ['BRA'],
        xp: 0,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}2` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'DF',
        name: `${params.name} DF`,
        strength: params.defenseStrength ?? 30,
        age: params.age ?? 26,
        nationalities: ['BRA'],
        xp: 0,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}3` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'MF',
        name: `${params.name} MF`,
        strength: params.midfieldStrength ?? 30,
        age: params.age ?? 26,
        nationalities: ['BRA'],
        xp: 0,
        isStarter: true,
        isSub: false,
      },
      {
        id: `${params.id.slice(0, 35)}4` as `${string}-${string}-${string}-${string}-${string}`,
        position: 'FW',
        name: `${params.name} FW`,
        strength: 30,
        age: params.age ?? 26,
        nationalities: ['BRA'],
        xp: 0,
        isStarter: true,
        isSub: false,
      },
    ],
    morale: params.morale ?? 50,
    isControlledByHuman: false,
  };
}

function buildContainer(
  roundStatus: 'in-progress' | 'not-started' = 'in-progress',
  ages: { home?: number; away?: number } = {}
) {
  const homeTeam = buildTeam({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Home',
    midfieldStrength: 90,
    defenseStrength: 40,
    age: ages.home,
  });
  const awayTeam = buildTeam({
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Away',
    midfieldStrength: 20,
    defenseStrength: 10,
    age: ages.away,
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
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
  };

  // An AI division alongside, with the same round in progress, to prove it is not ticked.
  const aiDivision: Championship = { ...championship, internalName: 'ai-championship' };

  const container: ChampionshipContainer = {
    championships: [aiDivision, championship],
    playableInternalName: championship.internalName,
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
    const rng = queuedRng([0, 100, 0, 90, 1]);

    const result = MatchService.runMatchActions(container, { rng });

    expect(result.succeeded).toBe(true);
    const updatedContainer = result.getResult();
    const updatedMatch =
      getPlayableChampionship(updatedContainer).matchContainer.rounds[0].matches[0];

    expect(getPlayableChampionship(updatedContainer).matchContainer.timer).toBe(1);
    expect(updatedMatch.homeTeamScore).toBe(1);
    expect(updatedMatch.awayTeamScore).toBe(0);
    expect(updatedMatch.scorers).toHaveLength(1);
    expect(updatedMatch.scorers[0].scorerTeam).toBe('home');
    expect(updatedMatch.scorers[0].time).toBe(0);
    expect(updatedMatch.simulation?.fieldArea).toBe('midfield');
    expect(updatedMatch.simulation?.possessionTeam).toBe('away');
  });

  it('ticks only the playable division, leaving the AI divisions to be played a round at a time', () => {
    const container = buildContainer('in-progress');
    const aiBefore = getChampionshipByInternalName(container, 'ai-championship');

    const updatedContainer = MatchService.runMatchActions(container, {
      rng: queuedRng([0, 100, 0, 90, 1]),
    }).getResult();

    expect(getChampionshipByInternalName(updatedContainer, 'ai-championship')).toBe(aiBefore);
    expect(updatedContainer.playableInternalName).toBe('mock-championship');
  });

  it('does not simulate when round is not in progress', () => {
    const container = buildContainer('not-started');

    const result = MatchService.runMatchActions(container);

    expect(result.succeeded).toBe(true);
    const updatedContainer = result.getResult();
    const updatedMatch =
      getPlayableChampionship(updatedContainer).matchContainer.rounds[0].matches[0];

    expect(getPlayableChampionship(updatedContainer).matchContainer.timer).toBe(0);
    expect(updatedMatch.homeTeamScore).toBe(0);
    expect(updatedMatch.awayTeamScore).toBe(0);
    expect(updatedMatch.scorers).toHaveLength(0);
  });

  describe('stamina over a full match', () => {
    // Ages picked for their bands: 39 is the ">38" band at 1 point per 2 ticks
    // (45 lost), 25 is the "21-25" band at 1 per 13 (6 lost).
    const OLD_AGE = 39;
    const YOUNG_AGE = 25;

    function playFullMatch(container: ChampionshipContainer): ChampionshipContainer {
      let current = container;
      // A tick per minute, 0 through 89, the same count MatchSimulator dispatches.
      for (let minute = 0; minute < 90; minute++) {
        current = MatchService.runMatchActions(current, { rng: queuedRng([0]) }).getResult();
      }
      return current;
    }

    function matchOf(container: ChampionshipContainer) {
      return getPlayableChampionship(container).matchContainer.rounds[0].matches[0];
    }

    it('drains an old squad far harder than a young one over 90 ticks', () => {
      const played = playFullMatch(
        buildContainer('in-progress', { home: OLD_AGE, away: YOUNG_AGE })
      );
      const match = matchOf(played);

      expect(match.homeTeam.players.map((player) => player.stamina)).toEqual([55, 55, 55, 55]);
      expect(match.awayTeam.players.map((player) => player.stamina)).toEqual([94, 94, 94, 94]);
    });

    it('starts every player at full stamina on the kickoff tick', () => {
      const container = buildContainer('in-progress', { home: OLD_AGE, away: YOUNG_AGE });
      const afterOneTick = MatchService.runMatchActions(container, {
        rng: queuedRng([0]),
      }).getResult();
      const match = matchOf(afterOneTick);

      expect(match.homeTeam.players.every((player) => player.stamina === 100)).toBe(true);
      expect(match.awayTeam.players.every((player) => player.stamina === 100)).toBe(true);
    });

    it('resets to full stamina when the next match kicks off', () => {
      const drained = matchOf(
        playFullMatch(buildContainer('in-progress', { home: OLD_AGE, away: YOUNG_AGE }))
      );
      expect(drained.homeTeam.players[0].stamina).toBe(55);

      // A fresh fixture for the same clubs: the timer is back at 0, so minute 0
      // recomputes to 100 with nothing carried over from the match above.
      const nextMatch = matchOf(
        MatchService.runMatchActions(
          buildContainer('in-progress', { home: OLD_AGE, away: YOUNG_AGE }),
          { rng: queuedRng([0]) }
        ).getResult()
      );

      expect(nextMatch.homeTeam.players[0].stamina).toBe(100);
    });
  });

  it('returns error when container is invalid', () => {
    const result = MatchService.runMatchActions({} as ChampionshipContainer);

    expect(result.succeeded).toBe(false);
    expect(result.error.message.length > 0).toBe(true);
  });
});
