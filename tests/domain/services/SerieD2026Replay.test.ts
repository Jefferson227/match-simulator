import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Team } from '../../../src/domain/models/Team';
import { isPhasedChampionshipOver } from '../../../src/domain/features/phases/PhaseProgression';
import mensTeamsJSON from '../../../src/infrastructure/data/teams.json';
import results from '../../support/data/serie-d-2026-results.json';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';
import { aboveOf, playableOf } from '../../support/pyramidSlots';

/**
 * Série D 2026 replayed with its real results (CBF jogos API, all 610 matches), through the seed's
 * descriptor. Nothing but the scores is scripted: the engine builds the groups, crossings, hosts,
 * both Blocos, the playoff and the promotion itself. A result is looked up by `(home, away)`, so a
 * wrongly chosen host fails the lookup rather than passing silently.
 *
 * Shootouts are the one thing the engine draws at random. The 15 real ones are pinned to their real
 * winners; any other club's shootout is simulated as usual.
 */
type Result = [number, number, string, string, number, number];

const mockShortNameOf = new Map(
  (mensTeamsJSON as { internalName: string; shortName: string }[]).map((team) => [
    team.internalName,
    team.shortName,
  ])
);
const mockSerieD = new Set(
  (results.matches as Result[]).flatMap(([, , home, away]) => [home, away])
);
/** The winner of each real shootout, keyed by the two clubs in alphabetical order. */
const mockShootoutWinners = new Map(
  results.shootouts.map(([, winner, loser]) => [
    [winner, loser].sort().join(' × '),
    winner as string,
  ])
);

jest.mock('../../../src/domain/features/phases/PenaltyShootoutSimulator', () => {
  const actual = jest.requireActual<
    typeof import('../../../src/domain/features/phases/PenaltyShootoutSimulator')
  >('../../../src/domain/features/phases/PenaltyShootoutSimulator');
  const internalNameOf = (team: Team) =>
    [...mockShortNameOf].find(([, shortName]) => shortName === team.shortName)?.[0];

  return {
    ...actual,
    simulatePenaltyShootout: (...args: Parameters<typeof actual.simulatePenaltyShootout>) => {
      const [, contenders] = args;
      const names = contenders.map(internalNameOf);
      if (!names.some((name) => name && mockSerieD.has(name))) {
        return actual.simulatePenaltyShootout(...args);
      }
      const realWinner = mockShootoutWinners.get([...names].sort().join(' × '));
      const winner = contenders.find((_, index) => names[index] === realWinner);
      if (!winner) throw new Error(`No real shootout between ${names.join(' and ')}.`);
      return { winner, shootout: { homeScore: 5, awayScore: 4, kicks: [] } };
    },
  };
});

const byFixture = new Map(
  (results.matches as Result[]).map(([, phase, home, away, homeGoals, awayGoals]) => [
    `${phase}:${home}:${away}`,
    [homeGoals, awayGoals] as [number, number],
  ])
);

function realResult(home: string, away: string, phaseIndex: number): [number, number] {
  const score = byFixture.get(`${phaseIndex}:${home}:${away}`);
  if (!score) throw new Error(`Série D 2026 has no ${home} × ${away} in phase ${phaseIndex}.`);
  return score;
}

beforeAll(useUniqueTeamIds);

describe('Série D 2026 replayed with its real results (REC D 2026)', () => {
  let season: ScriptedSeason;
  let next: ChampionshipContainer;
  const idOf = (name: string) => season.championship.teams[season.names.indexOf(name)].id;

  beforeAll(() => {
    season = new ScriptedSeason('brasileirao-serie-d').withResults(realResult);
    season.playToEnd();
    next = season.rollOver();
  });

  it('plays every real match: 10 group rounds and six two-legged knockout phases', () => {
    expect(isPhasedChampionshipOver(season.championship)).toBe(true);
    expect(season.championship.matchContainer.rounds.map((round) => round.phaseIndex)).toEqual([
      ...Array(10).fill(0),
      1,
      1,
      2,
      2,
      3,
      3,
      4,
      4,
      5,
      5,
      6,
      6,
    ]);
    const played = season.championship.matchContainer.rounds.flatMap((round) => round.matches);
    expect(played).toHaveLength(results.matches.length);
  });

  it('opens the 2ª Fase as Anexo B and the real tables do: 1º A01 Manauara hosts 4º A02', () => {
    expect(season.ties(1)[0]).toEqual(['manauara', 'independencia']);
    expect(season.ties(1)).toHaveLength(32);
  });

  it('re-seeds Bloco I as 2026 was played: Gama, ASA, ABC and CSA host the Quartas', () => {
    expect(season.ties(4)).toEqual([
      ['gama', 'sao-jose-rs'],
      ['asa', 'goiatuba'],
      ['abc', 'nacional-am'],
      ['csa', 'uberlandia'],
    ]);
  });

  it('pairs Bloco II 1º×4º and 2º×3º, with Goiatuba and CSA hosting (Art. 21 §§2–3)', () => {
    expect(season.playoffTies(5)).toEqual([
      ['goiatuba', 'sao-jose-rs'],
      ['csa', 'nacional-am'],
    ]);
  });

  it('keeps the semifinal in bracket order, Gama and ABC hosting on accumulated points', () => {
    expect(season.ties(5)).toEqual([
      ['gama', 'asa'],
      ['abc', 'uberlandia'],
    ]);
    expect(season.ties(6)).toEqual([['uberlandia', 'asa']]);
  });

  it('crowns Uberlândia', () => {
    expect(season.championship.survivingTeamIds).toEqual([idOf('uberlandia')]);
  });

  it('sends Goiatuba up on the better Bloco II rank after 0×0 and 1×1, with no shootout', () => {
    expect(season.championship.playoffWinnerIds).toEqual([idOf('goiatuba'), idOf('nacional-am')]);
    const playoffs = season.championship.matchContainer.rounds
      .flatMap((round) => round.matches)
      .filter((match) => match.bracket === 'playoff');
    expect(playoffs.some((match) => match.penaltyShootout)).toBe(false);
  });

  it('promotes exactly ASA, Gama, Uberlândia, ABC, Goiatuba and Nacional', () => {
    const promoted = ['asa', 'gama', 'uberlandia', 'abc', 'goiatuba', 'nacional-am'];
    const serieC = new Set(aboveOf(next)!.teams.map((team) => team.id));
    const serieD = new Set(playableOf(next).teams.map((team) => team.id));

    for (const name of promoted) expect(serieC.has(idOf(name))).toBe(true);
    for (const name of promoted) expect(serieD.has(idOf(name))).toBe(false);
    const stayedDown = season.names.filter((name) => !promoted.includes(name));
    for (const name of stayedDown) expect(serieD.has(idOf(name))).toBe(true);
  });

  it('takes 6 back from Série C, holding C at 20 and D at 96', () => {
    expect(aboveOf(next)!.teams).toHaveLength(20);
    expect(playableOf(next).teams).toHaveLength(96);
  });
});
