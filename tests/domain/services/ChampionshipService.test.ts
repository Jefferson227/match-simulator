import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import { containerOf } from '../../support/containerOf';
import { aboveOf, belowOf, playableOf } from '../../support/pyramidSlots';
import {
  buildChampionship as buildPhasedChampionship,
  buildTeam as buildSquadTeam,
  lowerNumberWins,
  playRound,
} from '../../support/phasedSeasonHarness';
import ChampionshipPhase from '../../../src/domain/models/ChampionshipPhase';
import { initialisePhaseState } from '../../../src/domain/features/phases/PhaseProgression';
import { createMatches } from '../../../src/domain/features/fixture-generation/FixtureGenerator';
import Match from '../../../src/domain/models/Match';
import Player from '../../../src/domain/models/Player';
import Round from '../../../src/domain/models/Round';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';

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
    leagueType: 'mens',
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

    // The human's club stays put here: this test is about the exchange, and since MS-107 a human
    // club that moves also re-centres the container. Re-centring is covered by
    // `tests/domain/services/ContainerRecentring.test.ts`.
    const playableA = buildTeam('e', 'PLA');
    const playableB = buildTeam('f', 'PLB', true);
    const playableC = buildTeam('g', 'PLC');
    const playableD = buildTeam('h', 'PLD');

    const lowerA = buildTeam('i', 'LWA');
    const lowerB = buildTeam('j', 'LWB');
    const lowerC = buildTeam('k', 'LWC');
    const lowerD = buildTeam('l', 'LWD');

    // Each division declares its own exchange counts: since MS-103 the upper division's own
    // relegation count decides how many clubs come down, not the playable division's.
    const upperDivision = buildChampionship({
      id: 'promotion',
      name: 'Upper Division',
      internalName: 'upper',
      teams: [upperA, upperB, upperC, upperD],
      standingsOrder: [upperA, upperB, upperC, upperD],
      currentRound: 6,
      totalRounds: 6,
      isRelegatable: true,
      numberOfRelegatableTeams: 1,
      relegationChampionshipInternalName: 'playable',
    });

    const playableDivision = buildChampionship({
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

    const lowerDivision = buildChampionship({
      id: 'relegation',
      name: 'Lower Division',
      internalName: 'lower',
      teams: [lowerA, lowerB, lowerC, lowerD],
      standingsOrder: [lowerA, lowerB, lowerC, lowerD],
      currentRound: 6,
      totalRounds: 6,
      isPromotable: true,
      numberOfPromotableTeams: 1,
      promotionChampionshipInternalName: 'playable',
    });

    const championshipContainer: ChampionshipContainer = {
      championships: [upperDivision, playableDivision, lowerDivision],
      playableInternalName: 'playable',
    };

    const result = ChampionshipService.runEndOfChampionshipActions(championshipContainer);

    expect(result.succeeded).toBe(true);

    const updatedContainer = result.getResult();

    expect(playableOf(updatedContainer).teams.map((team) => team.abbreviation)).toEqual([
      'PLB',
      'PLC',
      'UPD',
      'LWA',
    ]);
    expect(aboveOf(updatedContainer)?.teams.map((team) => team.abbreviation)).toEqual([
      'UPA',
      'UPB',
      'UPC',
      'PLA',
    ]);
    expect(belowOf(updatedContainer)?.teams.map((team) => team.abbreviation)).toEqual([
      'LWB',
      'LWC',
      'LWD',
      'PLD',
    ]);

    expect(playableOf(updatedContainer).matchContainer.currentRound).toBe(1);
    expect(playableOf(updatedContainer).matchContainer.timer).toBe(0);
    expect(playableOf(updatedContainer).matchContainer.currentSeason).toBe(2027);
    expect(playableOf(updatedContainer).standings.every((standing) => standing.points === 0)).toBe(
      true
    );
  });

  it('returns the same championship container when the championship is not over yet', () => {
    const championshipContainer = containerOf(
      buildChampionship({
        id: 'playable',
        name: 'Playable Division',
        internalName: 'playable',
        teams: [buildTeam('m', 'AAA'), buildTeam('n', 'BBB')],
        currentRound: 3,
        totalRounds: 6,
      })
    );

    const result = ChampionshipService.runEndOfChampionshipActions(championshipContainer);

    expect(result.succeeded).toBe(true);
    expect(result.getResult()).toEqual(championshipContainer);
  });
});

describe('ChampionshipService.drawTeamForHumanPlayer', () => {
  const teams = [buildTeam('a', 'AAA'), buildTeam('b', 'BBB'), buildTeam('c', 'CCC')];
  const championship = buildChampionship({
    id: 'entry',
    name: 'Entry Division',
    internalName: 'entry',
    teams,
    currentRound: 1,
    totalRounds: 4,
  });

  /** Always returns `pick`, recording the bounds it was asked for. */
  const stubbedRng = (pick: (min: number, max: number) => number) => {
    const calls: [number, number][] = [];
    return {
      calls,
      rng: {
        nextInt: (min: number, max: number) => {
          calls.push([min, max]);
          return pick(min, max);
        },
      },
    };
  };

  it('draws the club at the index the rng returns', () => {
    const { rng } = stubbedRng(() => 1);

    const result = ChampionshipService.drawTeamForHumanPlayer(championship, { rng });

    expect(result.succeeded).toBe(true);
    expect(result.getResult()).toBe(teams[1]);
  });

  it('asks the rng for an index over the whole field, inclusive at both ends', () => {
    const { rng, calls } = stubbedRng(() => 0);

    ChampionshipService.drawTeamForHumanPlayer(championship, { rng });

    expect(calls).toEqual([[0, teams.length - 1]]);
  });

  it('can draw both the first and the last club', () => {
    const first = ChampionshipService.drawTeamForHumanPlayer(championship, {
      rng: stubbedRng((min) => min).rng,
    });
    const last = ChampionshipService.drawTeamForHumanPlayer(championship, {
      rng: stubbedRng((_min, max) => max).rng,
    });

    expect(first.getResult()).toBe(teams[0]);
    expect(last.getResult()).toBe(teams[teams.length - 1]);
  });

  it('draws a club of the field without an injected rng', () => {
    const result = ChampionshipService.drawTeamForHumanPlayer(championship);

    expect(result.succeeded).toBe(true);
    expect(teams).toContain(result.getResult());
  });

  it('fails when the championship has no clubs to draw from', () => {
    const empty = buildChampionship({
      id: 'empty',
      name: 'Empty Division',
      internalName: 'empty',
      teams: [],
      currentRound: 1,
      totalRounds: 0,
    });

    const result = ChampionshipService.drawTeamForHumanPlayer(empty, {
      rng: stubbedRng(() => 0).rng,
    });

    expect(result.succeeded).toBe(false);
    expect(result.error.errorCode).toBe('exception');
  });
});

describe('ChampionshipService season stats (MS-114)', () => {
  const fixture = (
    id: string,
    homeTeam: Team,
    awayTeam: Team,
    extra: Partial<Match> = {}
  ): Match => ({
    id,
    homeTeam,
    homeTeamScore: 0,
    awayTeamScore: 0,
    awayTeam,
    scorers: [],
    ...extra,
  });

  const roundOf = (number: number, status: Round['status'], matches: Match[]): Round => ({
    id: `round-${number}`,
    number,
    status,
    matches,
  });

  const leagueOf = (internalName: string, teams: Team[], rounds: Round[]): Championship =>
    ({
      id: internalName,
      name: internalName,
      internalName,
      numberOfTeams: teams.length,
      teams,
      standings: teams.map((team, index) => ({
        team,
        position: index + 1,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      })),
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 1,
        totalRounds: rounds.length,
        rounds,
      },
      type: 'double-round-robin',
      leagueType: 'mens',
      hasTeamControlledByHuman: false,
      isPromotable: false,
      isRelegatable: false,
    }) as Championship;

  const playerOf = (team: Team, index: number): Player => team.players[index];
  const findPlayer = (teams: Team[], player: Player): Player =>
    teams.flatMap((team) => team.players).find((candidate) => candidate.id === player.id)!;

  /**
   * The playable division has just played round 1 (2–1): starter 7 of the home side scored twice,
   * player 0 of the away side was substituted off for player 10. Its round 2 is still to play.
   */
  function playableAfterRoundOne(status: Round['status'] = 'in-progress') {
    const home = buildSquadTeam(1);
    const away = buildSquadTeam(2);
    const awayLineup: Team = {
      ...away,
      players: away.players.map((player, index) => {
        if (index === 0) return { ...player, isStarter: false, leftAtMinute: 60 };
        if (index === 10) return { ...player, enteredAtMinute: 60 };
        return player;
      }),
    };
    const awayInRoundOne: Team = {
      ...awayLineup,
      // An unused substitute on the bench: they did not play.
      players: [
        ...awayLineup.players,
        { ...away.players[1], id: 'player-2-bench' as Player['id'], isStarter: false, isSub: true },
      ],
    };
    const awayCanonical: Team = {
      ...away,
      players: [
        ...away.players,
        { ...away.players[1], id: 'player-2-bench' as Player['id'], isStarter: false, isSub: true },
      ],
    };

    const championship = leagueOf(
      'playable',
      [home, awayCanonical],
      [
        roundOf(1, status, [
          fixture('m1', home, awayInRoundOne, {
            homeTeamScore: 2,
            awayTeamScore: 1,
            scorers: [
              { player: playerOf(home, 7), scorerTeam: 'home', time: 10 },
              { player: playerOf(home, 7), scorerTeam: 'home', time: 50 },
              { player: playerOf(awayInRoundOne, 8), scorerTeam: 'away', time: 70 },
            ],
          }),
        ]),
        roundOf(2, 'not-started', [fixture('m2', awayCanonical, home)]),
      ]
    );

    return { championship, home, away: awayCanonical };
  }

  const endAll = (container: ChampionshipContainer, rng?: RandomProvider) => {
    const result = ChampionshipService.endRoundForAllChampionships(container, rng ? { rng } : {});
    expect(result.succeeded).toBe(true);
    return result.getResult();
  };

  it('counts a round once: appearances for everyone who played, goals for the scorers', () => {
    const { championship, home, away } = playableAfterRoundOne();

    const ended = getPlayableChampionship(endAll(containerOf(championship)));

    expect(findPlayer(ended.teams, playerOf(home, 7))).toMatchObject({
      seasonGames: 1,
      seasonGoals: 2,
    });
    expect(findPlayer(ended.teams, playerOf(home, 0))).toMatchObject({
      seasonGames: 1,
      seasonGoals: 0,
    });
    expect(findPlayer(ended.teams, playerOf(away, 8)).seasonGoals).toBe(1);
    // Substituted off and the substitute who came on both played.
    expect(findPlayer(ended.teams, playerOf(away, 0)).seasonGames).toBe(1);
    expect(findPlayer(ended.teams, playerOf(away, 10)).seasonGames).toBe(1);
    // The unused substitute did not.
    expect(findPlayer(ended.teams, playerOf(away, 11)).seasonGames).toBe(0);
  });

  it('carries the counters to the table rows and the fixtures still to play', () => {
    const { championship, home } = playableAfterRoundOne();

    const ended = getPlayableChampionship(endAll(containerOf(championship)));
    const scorer = playerOf(home, 7);

    expect(
      findPlayer(
        ended.standings.map((standing) => standing.team),
        scorer
      ).seasonGoals
    ).toBe(2);
    const nextFixture = ended.matchContainer.rounds[1].matches[0];
    expect(findPlayer([nextFixture.homeTeam, nextFixture.awayTeam], scorer).seasonGoals).toBe(2);
    // The played round keeps its own snapshot.
    const played = ended.matchContainer.rounds[0].matches[0];
    expect(findPlayer([played.homeTeam], scorer).seasonGoals).toBe(0);
  });

  it('carries no match-scoped field into the clubs', () => {
    const { championship } = playableAfterRoundOne();

    const ended = getPlayableChampionship(endAll(containerOf(championship)));
    const players = ended.teams.flatMap((team) => team.players);

    expect(players.some((player) => player.leftAtMinute !== undefined)).toBe(false);
    expect(players.some((player) => player.enteredAtMinute !== undefined)).toBe(false);
  });

  it('does not count a round that has already ended a second time', () => {
    const { championship, home } = playableAfterRoundOne('ended');

    const ended = getPlayableChampionship(endAll(containerOf(championship)));

    expect(findPlayer(ended.teams, playerOf(home, 7)).seasonGames).toBe(0);
  });

  it('counts every round an AI division catches up in one call, each exactly once', () => {
    const { championship } = playableAfterRoundOne();
    const aiHome = buildSquadTeam(3);
    const aiAway = buildSquadTeam(4);
    // Four rounds to the playable division's two, so one playable round owes several AI rounds.
    const ai = leagueOf(
      'ai',
      [aiHome, aiAway],
      [
        roundOf(1, 'not-started', [fixture('a1', aiHome, aiAway)]),
        roundOf(2, 'not-started', [fixture('a2', aiAway, aiHome)]),
        roundOf(3, 'not-started', [fixture('a3', aiHome, aiAway)]),
        roundOf(4, 'not-started', [fixture('a4', aiAway, aiHome)]),
      ]
    );
    let seed = 0;
    const rng: RandomProvider = {
      nextInt: (min, max) =>
        min + ((seed = (seed * 1103515245 + 12345) % 2147483648) % (max - min + 1)),
    };

    const container = endAll(containerOf(championship, [ai]), rng);
    const caughtUp = getChampionshipByInternalName(container, 'ai')!;

    const roundsPlayed = caughtUp.matchContainer.rounds.filter(
      (round) => round.status === 'ended'
    ).length;
    expect(roundsPlayed).toBeGreaterThan(1);
    caughtUp.teams.forEach((team) => {
      const standing = caughtUp.standings.find((row) => row.team.id === team.id)!;
      const appeared = team.players.filter((player) => player.seasonGames > 0);

      expect(appeared.length).toBeGreaterThan(0);
      appeared.forEach((player) => expect(player.seasonGames).toBe(roundsPlayed));
      expect(team.players.reduce((goals, player) => goals + player.seasonGoals, 0)).toBe(
        standing.goalsFor
      );
    });
  });

  describe('AI catch-up lineups', () => {
    const EXTRA_POSITIONS = ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'] as const;

    /** A 20-player squad with every player flagged as a starter: a fixture with no real lineup. */
    const wholeSquadTeam = (index: number): Team => {
      const team = buildSquadTeam(index);
      const extras = EXTRA_POSITIONS.map((position, extra) => ({
        ...team.players[0],
        id: `player-${index}-x${extra}` as Player['id'],
        name: `Extra ${index}-${extra}`,
        position,
      }));
      return { ...team, players: [...team.players, ...extras] };
    };

    const seededRng = (): RandomProvider => {
      let seed = 42;
      return {
        nextInt: (min, max) =>
          min + ((seed = (seed * 1103515245 + 12345) % 2147483648) % (max - min + 1)),
      };
    };

    const aiDivisionOf = (home: Team, away: Team) =>
      leagueOf(
        'ai',
        [home, away],
        [
          roundOf(1, 'not-started', [fixture('a1', home, away)]),
          roundOf(2, 'not-started', [fixture('a2', away, home)]),
          roundOf(3, 'not-started', [fixture('a3', home, away)]),
          roundOf(4, 'not-started', [fixture('a4', away, home)]),
        ]
      );

    const catchUp = (ai: Championship) => {
      const { championship } = playableAfterRoundOne();
      return getChampionshipByInternalName(
        endAll(containerOf(championship, [ai]), seededRng()),
        'ai'
      )!;
    };

    it('plays every catch-up round with 11 starters per club, not the whole squad', () => {
      const caughtUp = catchUp(aiDivisionOf(wholeSquadTeam(3), wholeSquadTeam(4)));
      const played = caughtUp.matchContainer.rounds.filter((round) => round.status === 'ended');

      expect(played.length).toBeGreaterThan(1);
      played
        .flatMap((round) => round.matches)
        .forEach((match) => {
          [match.homeTeam, match.awayTeam].forEach((team) => {
            expect(team.players.filter((player) => player.isStarter)).toHaveLength(11);
            expect(team.players.filter((player) => player.isSub)).toHaveLength(6);
          });
        });
      caughtUp.teams.forEach((team) => {
        const games = team.players.reduce((total, player) => total + player.seasonGames, 0);
        expect(games).toBe(11 * played.length);
      });
    });

    it('is deterministic under an injected rng', () => {
      const first = catchUp(aiDivisionOf(wholeSquadTeam(3), wholeSquadTeam(4)));
      const second = catchUp(aiDivisionOf(wholeSquadTeam(3), wholeSquadTeam(4)));

      expect(second).toEqual(first);
    });

    it("never touches a human club's lineup", () => {
      const human: Team = { ...wholeSquadTeam(3), isControlledByHuman: true };
      const caughtUp = catchUp(aiDivisionOf(human, wholeSquadTeam(4)));
      const played = caughtUp.matchContainer.rounds.filter((round) => round.status === 'ended');

      expect(played.length).toBeGreaterThan(1);
      played
        .flatMap((round) => round.matches)
        .forEach((match) => {
          const humanCopy = match.homeTeam.id === human.id ? match.homeTeam : match.awayTeam;
          expect(humanCopy.players.every((player) => player.isStarter)).toBe(true);
        });
    });
  });
});

describe('ChampionshipService strength progression (MS-115)', () => {
  const fixture = (id: string, homeTeam: Team, awayTeam: Team): Match => ({
    id,
    homeTeam,
    homeTeamScore: 1,
    awayTeamScore: 0,
    awayTeam,
    scorers: [],
  });

  const roundOf = (number: number, status: Round['status'], matches: Match[]): Round => ({
    id: `round-${number}`,
    number,
    status,
    matches,
  });

  const leagueOf = (
    internalName: string,
    tier: number | undefined,
    teams: Team[],
    rounds: Round[]
  ): Championship =>
    ({
      id: internalName,
      name: internalName,
      internalName,
      ...(tier !== undefined && { tier }),
      numberOfTeams: teams.length,
      teams,
      standings: teams.map((team, index) => ({
        team,
        position: index + 1,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      })),
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 1,
        totalRounds: rounds.length,
        rounds,
      },
      type: 'double-round-robin',
      leagueType: 'mens',
      hasTeamControlledByHuman: false,
      isPromotable: false,
      isRelegatable: false,
    }) as Championship;

  /** A squad of `buildSquadTeam(index)` at one morale, age, strength and counter. */
  const squad = (
    index: number,
    morale: number,
    player: Pick<Player, 'age' | 'strength' | 'strengthProgressGames'>
  ): Team => {
    const team = buildSquadTeam(index);
    return { ...team, morale, players: team.players.map((p) => ({ ...p, ...player })) };
  };

  const endAll = (container: ChampionshipContainer, rng?: RandomProvider) => {
    const result = ChampionshipService.endRoundForAllChampionships(container, rng ? { rng } : {});
    expect(result.succeeded).toBe(true);
    return result.getResult();
  };

  const strengths = (team: Team) => [...new Set(team.players.map((player) => player.strength))];
  const counters = (team: Team) => [
    ...new Set(team.players.map((player) => player.strengthProgressGames)),
  ];

  /**
   * A two-tier pyramid: the playable division is the bottom tier (range 1–49) with three clubs.
   * `home` (high morale, 20-year-olds: every game) beats `away` (low morale, 26-year-olds one game
   * short of their 4) in round 1; `idle` plays nobody. A bench player sits outside the lineup.
   */
  function bottomTierAfterRoundOne(status: Round['status'] = 'in-progress', tier = 2) {
    const homeCanonical = squad(1, 80, { age: 20, strength: 30, strengthProgressGames: 0 });
    const bench: Player = {
      ...homeCanonical.players[1],
      id: 'player-1-bench' as Player['id'],
      isStarter: false,
      isSub: false,
    };
    const home = { ...homeCanonical, players: [...homeCanonical.players, bench] };
    const away = squad(2, 30, { age: 26, strength: 30, strengthProgressGames: 3 });
    const idle = squad(3, 80, { age: 20, strength: 30, strengthProgressGames: 0 });
    const homeInRoundOne = { ...home, players: homeCanonical.players };

    const playable = leagueOf(
      'playable',
      tier === 0 ? undefined : tier,
      [home, away, idle],
      [
        roundOf(1, status, [fixture('m1', homeInRoundOne, away)]),
        roundOf(2, 'not-started', [fixture('m2', away, home)]),
      ]
    );
    const top = leagueOf('top', 1, [], []);

    return { container: containerOf(playable, [top]), home, away, idle };
  }

  it('moves every player of every club that played, bench included', () => {
    const { container, home, away } = bottomTierAfterRoundOne();

    const ended = getPlayableChampionship(endAll(container));
    const endedHome = ended.teams.find((team) => team.id === home.id)!;
    const endedAway = ended.teams.find((team) => team.id === away.id)!;

    expect(endedHome.players).toHaveLength(home.players.length);
    expect(strengths(endedHome)).toEqual([31]);
    expect(counters(endedHome)).toEqual([0]);
    expect(strengths(endedAway)).toEqual([29]);
    expect(counters(endedAway)).toEqual([0]);
  });

  it('leaves a club that did not play untouched', () => {
    const { container, idle } = bottomTierAfterRoundOne();

    const ended = getPlayableChampionship(endAll(container));

    expect(ended.teams.find((team) => team.id === idle.id)).toBe(idle);
  });

  it('carries strength and counter to the table rows and the fixtures still to play', () => {
    const { container, home } = bottomTierAfterRoundOne();

    const ended = getPlayableChampionship(endAll(container));
    const row = ended.standings.find((standing) => standing.team.id === home.id)!;
    const next = ended.matchContainer.rounds[1].matches[0].awayTeam;
    const played = ended.matchContainer.rounds[0].matches[0].homeTeam;

    expect(strengths(row.team)).toEqual([31]);
    expect(strengths(next)).toEqual([31]);
    expect(counters(next)).toEqual([0]);
    // Only the two fields are copied: the fixture keeps its lineup.
    expect(next.players.map((player) => player.isStarter)).toEqual(
      home.players.map((player) => player.isStarter)
    );
    // The played round keeps its own snapshot.
    expect(strengths(played)).toEqual([30]);
  });

  it('does not move anyone for a round that has already ended', () => {
    const { container, home } = bottomTierAfterRoundOne('ended');

    const ended = getPlayableChampionship(endAll(container));

    expect(strengths(ended.teams.find((team) => team.id === home.id)!)).toEqual([30]);
  });

  it('leaves a tierless competition alone', () => {
    const { container, home } = bottomTierAfterRoundOne('in-progress', 0);

    const ended = getPlayableChampionship(endAll(container));
    const endedHome = ended.teams.find((team) => team.id === home.id)!;

    expect(strengths(endedHome)).toEqual([30]);
    expect(counters(endedHome)).toEqual([0]);
  });

  it('counts every round an AI division catches up in one call, each exactly once', () => {
    const { container } = bottomTierAfterRoundOne();
    // Mid morale, 26-year-olds: one step every 4 games, inside the top tier's 50–99.
    const aiHome = squad(4, 50, { age: 26, strength: 60, strengthProgressGames: 0 });
    const aiAway = squad(5, 50, { age: 26, strength: 60, strengthProgressGames: 0 });
    const ai = leagueOf(
      'top',
      1,
      [aiHome, aiAway],
      Array.from({ length: 8 }, (_, i) =>
        roundOf(i + 1, 'not-started', [
          i % 2 === 0 ? fixture(`a${i}`, aiHome, aiAway) : fixture(`a${i}`, aiAway, aiHome),
        ])
      )
    );
    let seed = 0;
    const rng: RandomProvider = {
      nextInt: (min, max) =>
        min + ((seed = (seed * 1103515245 + 12345) % 2147483648) % (max - min + 1)),
    };

    const caughtUp = getChampionshipByInternalName(
      endAll({ ...container, championships: [ai, container.championships[1]] }, rng),
      'top'
    )!;

    const roundsPlayed = caughtUp.matchContainer.rounds.filter(
      (round) => round.status === 'ended'
    ).length;
    expect(roundsPlayed).toBeGreaterThan(4);
    caughtUp.teams.forEach((team) => {
      expect(strengths(team)).toEqual([60 + Math.floor(roundsPlayed / 4)]);
      expect(counters(team)).toEqual([roundsPlayed % 4]);
    });
  });
});

describe('ChampionshipService next-phase squads (MS-115)', () => {
  /**
   * Two single-leg knockouts. A knockout deals the next one its winners as they stood in the tie it
   * played — before that round moved them — which is the copy the sync has to bring up to date.
   */
  const semifinalThenFinal: ChampionshipPhase[] = [
    {
      kind: 'knockout',
      name: 'Semifinal',
      numberOfTies: 2,
      legs: 1,
      secondLegHost: 'drawn',
      tiebreakers: ['penalties'],
    },
    {
      kind: 'knockout',
      name: 'Final',
      numberOfTies: 1,
      legs: 1,
      secondLegHost: 'drawn',
      tiebreakers: ['penalties'],
    },
  ];

  it('deals the new phase its fixtures with the squads as they stand after the round', () => {
    // Young squads at high morale move every game, so a stale copy shows at once.
    const fresh = buildPhasedChampionship(4, semifinalThenFinal);
    let championship: Championship = {
      ...fresh,
      tier: 1,
      hasLeagueTable: false,
      standings: [],
      teams: fresh.teams.map((team) => ({
        ...team,
        morale: 80,
        players: team.players.map((player) => ({ ...player, age: 20 })),
      })),
    };
    championship = initialisePhaseState({
      ...championship,
      matchContainer: createMatches(championship.teams, championship.phases),
    });

    championship = playRound(championship, lowerNumberWins);

    expect(championship.currentPhaseIndex).toBe(1);
    const finalists = championship.matchContainer.rounds
      .filter((round) => round.phaseIndex === 1)
      .flatMap((round) => round.matches.flatMap((match) => [match.homeTeam, match.awayTeam]));
    expect(finalists).toHaveLength(2);

    finalists.forEach((copy) => {
      const club = championship.teams.find((team) => team.id === copy.id)!;
      copy.players.forEach((player) => {
        const canonical = club.players.find((candidate) => candidate.id === player.id)!;
        expect(player.strength).toBe(51);
        expect(player).toMatchObject({
          strength: canonical.strength,
          strengthProgressGames: canonical.strengthProgressGames,
          seasonGames: canonical.seasonGames,
          seasonGoals: canonical.seasonGoals,
        });
      });
    });
  });
});
