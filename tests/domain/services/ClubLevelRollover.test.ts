/**
 * MS-116: at roll-over every league club's level moves — by its season rank if it stays, to near
 * the bottom of its new range if promoted, near the top if relegated.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import { getChampionshipByInternalName } from '../../../src/domain/features/pyramid/Pyramid';
import { buildSeasonRanking } from '../../../src/domain/features/phases/PhaseProgression';
import { getDivisionStrengthRange } from '../../../src/domain/features/strength-progression/StrengthRange';
import { getNextSeasonLevel } from '../../../src/domain/features/strength-progression/ClubLevel';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const MENS = [
  'brasileirao-serie-a',
  'brasileirao-serie-b',
  'brasileirao-serie-c',
  'brasileirao-serie-d',
];

const division = (container: ChampionshipContainer, internalName: string): Championship =>
  getChampionshipByInternalName(container, internalName)!;

/** Which division each club played in, by id. */
function divisionOfEachClub(container: ChampionshipContainer): Map<string, number> {
  const tierById = new Map<string, number>();
  MENS.forEach((internalName, index) =>
    division(container, internalName).teams.forEach((team) => tierById.set(team.id, index))
  );
  return tierById;
}

/** Every club of `container` with its squad aged a year, in `teams` only — as season ageing does. */
function agedInTeamsOnly(container: ChampionshipContainer): ChampionshipContainer {
  return {
    ...container,
    championships: container.championships.map((championship) => ({
      ...championship,
      teams: championship.teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({ ...player, age: player.age + 1 })),
      })),
    })),
  };
}

describe("men's pyramid roll-over, human in Série C", () => {
  let before: ChampionshipContainer;
  let after: ChampionshipContainer;
  let humanId: Team['id'];
  let levellessId: Team['id'];

  beforeAll(() => {
    const season = new ScriptedSeason('brasileirao-serie-c').assignHuman(5);
    season.playToEnd();
    humanId = season.championship.teams[5].id;

    // A club with no level — as a club that only plays cups has none — and every squad aged in
    // `teams` alone, so a club read off a stale table copy would show.
    const serieC = season.championship;
    levellessId = serieC.teams[10].id;
    const withoutLevel = (team: Team): Team => {
      if (team.id !== levellessId) return team;
      const { level: _level, ...rest } = team;
      return rest;
    };
    season.container = agedInTeamsOnly({
      ...season.container,
      championships: season.container.championships.map((championship) =>
        championship.internalName === serieC.internalName
          ? { ...championship, teams: championship.teams.map(withoutLevel) }
          : championship
      ),
    });

    before = season.container;
    after = season.rollOver();
  });

  it.each(MENS.map((internalName, tier) => [internalName, tier] as const))(
    'sets every level in %s by where the club came from',
    (internalName, tier) => {
      const previousTier = divisionOfEachClub(before);
      const beforeById = new Map(
        MENS.flatMap((name) => division(before, name).teams).map((team) => [team.id, team])
      );
      const next = division(after, internalName);
      const range = getDivisionStrengthRange(after, next)!;
      const previous = division(before, internalName);
      const ranking = buildSeasonRanking(previous);

      next.teams.forEach((team) => {
        const from = previousTier.get(team.id)!;
        if (from > tier) {
          expect(team.level).toBe(range.min + 3);
        } else if (from < tier) {
          expect(team.level).toBe(range.max - 3);
        } else if (team.id === levellessId) {
          expect(team.level).toBeUndefined();
        } else {
          const rank = ranking.findIndex((ranked) => ranked.id === team.id) + 1;
          expect(team.level).toBe(
            getNextSeasonLevel(beforeById.get(team.id)!.level!, rank, ranking.length, range)
          );
        }
        expect(
          team.level === undefined || (team.level >= range.min && team.level <= range.max)
        ).toBe(true);
      });
    }
  );

  it('moves at least one club each way across every boundary', () => {
    const previousTier = divisionOfEachClub(before);
    MENS.forEach((internalName, tier) => {
      const arrivals = division(after, internalName).teams.map((team) => previousTier.get(team.id));
      if (tier > 0) expect(arrivals).toContain(tier - 1);
      if (tier < MENS.length - 1) expect(arrivals).toContain(tier + 1);
    });
  });

  it("moves Série A's champion's level up by 2", () => {
    const previous = division(before, 'brasileirao-serie-a');
    const ranking = buildSeasonRanking(previous);
    const next = division(after, 'brasileirao-serie-a');
    const levelAfter = (team: Team) => next.teams.find((club) => club.id === team.id)?.level;

    expect(levelAfter(ranking[0])).toBe(Math.min(99, ranking[0].level! + 2));
  });

  it('keeps the squads as ageing left them', () => {
    const beforeById = new Map(
      MENS.flatMap((name) => division(before, name).teams).map((team) => [team.id, team])
    );
    MENS.forEach((name) =>
      division(after, name).teams.forEach((team) =>
        expect(team.players.map((player) => player.age)).toEqual(
          beforeById.get(team.id)!.players.map((player) => player.age)
        )
      )
    );
  });

  it("treats the human's club like any other", () => {
    const previousTier = divisionOfEachClub(before);
    const nextDivision = MENS.find((name) =>
      division(after, name).teams.some((team) => team.id === humanId)
    )!;
    const human = division(after, nextDivision).teams.find((team) => team.id === humanId)!;
    const range = getDivisionStrengthRange(after, division(after, nextDivision))!;
    const from = previousTier.get(humanId)!;
    const to = MENS.indexOf(nextDivision);

    expect(human.isControlledByHuman).toBe(true);
    if (to < from) expect(human.level).toBe(range.min + 3);
    else if (to > from) expect(human.level).toBe(range.max - 3);
    else {
      const ranking = buildSeasonRanking(division(before, nextDivision));
      const rank = ranking.findIndex((team) => team.id === humanId) + 1;
      const beforeLevel = division(before, nextDivision).teams.find(
        (team) => team.id === humanId
      )!.level!;
      expect(human.level).toBe(getNextSeasonLevel(beforeLevel, rank, ranking.length, range));
    }
  });
});
