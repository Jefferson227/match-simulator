/**
 * MS-116: `buildSeasonRanking` ranks a division's season by how far each club went — champion,
 * runner-up, then furthest phase reached, then points across every phase — for the club level change.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import { Championship } from '../../../../src/domain/models/Championship';
import Standing from '../../../../src/domain/models/Standing';
import { Team } from '../../../../src/domain/models/Team';
import {
  buildFinalClassification,
  buildSeasonRanking,
} from '../../../../src/domain/features/phases/PhaseProgression';
import { useUniqueTeamIds } from '../../../support/seasonHarness';
import { ScriptedSeason } from '../../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

/** The last phase index each club played, from `phaseParticipants`. */
function furthestPhaseOf(championship: Championship): Map<string, number> {
  const furthest = new Map<string, number>();
  (championship.phaseParticipants ?? []).forEach((participants, phaseIndex) =>
    participants.forEach((teamId) => furthest.set(teamId, phaseIndex))
  );
  return furthest;
}

function accumulatedPointsOf(championship: Championship): Map<string, number> {
  return new Map(
    (championship.accumulatedStandings ?? []).map((standing) => [standing.team.id, standing.points])
  );
}

describe('a Série D-shaped season', () => {
  let championship: Championship;
  let ranking: Team[];

  beforeAll(() => {
    championship = new ScriptedSeason('brasileirao-serie-d').playToEnd().championship;
    ranking = buildSeasonRanking(championship);
  });

  it('ranks every club exactly once', () => {
    expect(ranking).toHaveLength(championship.teams.length);
    expect(new Set(ranking.map((team) => team.id)).size).toBe(championship.teams.length);
  });

  it('puts the champion and runner-up first, as the final classification does', () => {
    const classification = buildFinalClassification(championship);
    expect(ranking.slice(0, 2).map((team) => team.id)).toEqual(
      classification.slice(0, 2).map((standing) => standing.team.id)
    );
  });

  it('ranks group losers below every club that reached the knockouts', () => {
    const furthest = furthestPhaseOf(championship);
    const phases = ranking.map((team) => furthest.get(team.id)!);
    const firstGroupLoser = phases.indexOf(0);

    expect(firstGroupLoser).toBeGreaterThan(0);
    expect(phases.slice(firstGroupLoser).every((phase) => phase === 0)).toBe(true);
  });

  it('never ranks a club above one that went further, after the podium', () => {
    const furthest = furthestPhaseOf(championship);
    const phases = ranking.slice(2).map((team) => furthest.get(team.id)!);
    phases.slice(1).forEach((phase, index) => expect(phase).toBeLessThanOrEqual(phases[index]));
  });

  it('orders clubs out in the same phase by points across every phase', () => {
    const furthest = furthestPhaseOf(championship);
    const points = accumulatedPointsOf(championship);
    const groupLosers = ranking.filter((team) => furthest.get(team.id) === 0);
    const groupLoserPoints = groupLosers.map((team) => points.get(team.id)!);

    groupLoserPoints
      .slice(1)
      .forEach((value, index) => expect(value).toBeLessThanOrEqual(groupLoserPoints[index]));
  });

  it('hands back the clubs as `teams` holds them', () => {
    ranking.forEach((team) =>
      expect(championship.teams.find((candidate) => candidate.id === team.id)).toBe(team)
    );
  });
});

describe('an A2-shaped season', () => {
  // Seed order decides the league phase, so seed 0 tops it and seed 7 is 8th. In the
  // quarter-finals seed 7 wins and seed 0 loses whoever they meet; after that seed order again.
  let season: ScriptedSeason;
  let ranking: Team[];

  beforeAll(() => {
    season = new ScriptedSeason('brasileirao-feminino-serie-a2');
    const seedOf = (name: string) => season.names.indexOf(name);
    season.withResults((home, away, phaseIndex) => {
      const [homeSeed, awaySeed] = [seedOf(home), seedOf(away)];
      if (phaseIndex === 1) {
        if (homeSeed === 7 || awaySeed === 0) return [2, 0];
        if (awaySeed === 7 || homeSeed === 0) return [0, 2];
      }
      return homeSeed < awaySeed ? [2, 0] : [0, 2];
    });
    season.playToEnd();
    ranking = buildSeasonRanking(season.championship);
  });

  it('ranks the 8th-placed league club that reached the semis above the league leader out in the quarters', () => {
    const championship = season.championship;
    const leagueTable = championship.firstPhaseStandings!;
    const leagueLeader = leagueTable[0].team.id;
    const eighth = leagueTable[7].team.id;
    const furthest = furthestPhaseOf(championship);
    const points = accumulatedPointsOf(championship);

    expect(furthest.get(eighth)).toBeGreaterThanOrEqual(2);
    expect(furthest.get(leagueLeader)).toBe(1);
    // The leader has more points across every phase, and still ranks lower.
    expect(points.get(leagueLeader)!).toBeGreaterThan(points.get(eighth)!);

    const rankOf = (teamId: string) => ranking.findIndex((team) => team.id === teamId);
    expect(rankOf(eighth)).toBeLessThan(rankOf(leagueLeader));
  });

  it('ranks the clubs out in the league phase last', () => {
    const furthest = furthestPhaseOf(season.championship);
    expect(ranking.slice(8).every((team) => furthest.get(team.id) === 0)).toBe(true);
    expect(ranking.slice(0, 8).every((team) => furthest.get(team.id)! >= 1)).toBe(true);
  });
});

describe('a single-table division', () => {
  const team = (abbreviation: string, index: number): Team =>
    ({
      id: `${index}0000000-0000-0000-0000-000000000000`,
      abbreviation,
      players: [],
    }) as unknown as Team;

  const row = (club: Team, points: number, wins: number): Standing => ({
    team: club,
    position: 0,
    points,
    wins,
    draws: 0,
    losses: 0,
    goalsFor: wins,
    goalsAgainst: 0,
  });

  it('ranks by the table, with the league tiebreakers', () => {
    const [first, second, third] = [team('AAA', 1), team('BBB', 2), team('CCC', 3)];
    const championship = {
      teams: [first, second, third],
      // Out of order, and BBB and CCC level on points: CCC has more wins.
      standings: [row(second, 10, 2), row(first, 20, 6), row(third, 10, 3)],
    } as unknown as Championship;

    expect(buildSeasonRanking(championship)).toEqual([first, third, second]);
  });
});
