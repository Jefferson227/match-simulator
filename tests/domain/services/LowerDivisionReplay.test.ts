import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { isPhasedChampionshipOver } from '../../../src/domain/features/phases/PhaseProgression';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';
import { aboveOf, belowOf, playableOf } from '../../support/pyramidSlots';

beforeAll(useUniqueTeamIds);

const teamIds = (championship: Championship | undefined) =>
  new Set(championship?.teams.map((team) => team.id));

// Série D is replayed with its real 2026 results in `SerieD2026Replay.test.ts`.
describe('Série C replayed from the seed (REC C Arts. 12–22)', () => {
  // Built in `beforeAll`, after `useUniqueTeamIds` — at collection time every club id would be the
  // stubbed 'mocked-uuid'.
  let season: ScriptedSeason;
  let secondPhaseGroups: string[][];
  let next: ChampionshipContainer;
  const byName = (name: string) => season.championship.teams[season.names.indexOf(name)];

  beforeAll(() => {
    season = new ScriptedSeason('brasileirao-serie-c');
    season.playUntilPhase(1);
    secondPhaseGroups = season.groups(1);
    season.playToEnd();
    next = season.rollOver();
  });

  it('plays 19 + 6 + 2 rounds to a champion', () => {
    expect(isPhasedChampionshipOver(season.championship)).toBe(true);
    expect(season.championship.matchContainer.rounds.map((round) => round.phaseIndex)).toEqual([
      ...Array(19).fill(0),
      ...Array(6).fill(1),
      2,
      2,
    ]);
    expect(season.championship.survivingTeamIds).toEqual([byName(season.names[0]).id]);
  });

  it('deals the 1ª Fase top 8 into 2ª Fase groups 1-4-5-8 / 2-3-6-7', () => {
    // The 1ª Fase table follows seed order, so 1º…8º are the first eight names.
    const [first, second, third, fourth, fifth, sixth, seventh, eighth] = season.names;
    expect(secondPhaseGroups).toEqual([
      [first, fourth, fifth, eighth],
      [second, third, sixth, seventh],
    ]);
  });

  it('pairs the two 2ª Fase group winners in the final', () => {
    expect(season.ties(2).flat().sort()).toEqual([season.names[0], season.names[1]].sort());
  });

  it('promotes the top 2 of each 2ª Fase group into Série B', () => {
    const serieB = teamIds(aboveOf(next));
    const [first, second, third, fourth] = season.names;

    for (const name of [first, fourth, second, third])
      expect(serieB.has(byName(name).id)).toBe(true);
    expect(serieB.has(byName(season.names[4]).id)).toBe(false);
  });

  it('relegates the bottom 6 of the 1ª Fase into Série D, balancing its 6 promoted (MS-112)', () => {
    const serieD = teamIds(belowOf(next));

    for (const name of season.names.slice(14)) expect(serieD.has(byName(name).id)).toBe(true);
    expect(serieD.has(byName(season.names[13]).id)).toBe(false);
    for (const name of season.names.slice(14)) {
      expect(teamIds(playableOf(next)).has(byName(name).id)).toBe(false);
    }
  });

  it('stays at 20, with Série B at 20 and Série D at 96', () => {
    expect(playableOf(next).teams).toHaveLength(20);
    expect(aboveOf(next)!.teams).toHaveLength(20);
    expect(belowOf(next)!.teams).toHaveLength(96);
  });
});
