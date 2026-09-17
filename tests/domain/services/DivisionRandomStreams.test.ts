/**
 * MS-109: each AI division draws from its own random stream, so its results cannot depend on how
 * many draws any other division made first — the property that lets the AI rounds be spread across
 * the season without changing what they produce.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import { getChampionshipByInternalName } from '../../../src/domain/features/pyramid/Pyramid';
import { init, useUniqueTeamIds } from '../../support/seasonHarness';
import { buildChampionship } from '../../support/phasedSeasonHarness';
import { pinnedRng, pinnedRngByDivision } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const A = 'brasileirao-serie-a';
const B = 'brasileirao-serie-b';
const C = 'brasileirao-serie-c';

/** A one-round playable division, so ending its round ends its season and plays every AI division. */
const oneRoundPlayable = (): Championship =>
  buildChampionship(2, [
    {
      kind: 'round-robin',
      name: 'Final',
      numberOfGroups: 1,
      teamsPerGroup: 2,
      legs: 1,
      advancingPerGroup: 1,
    },
  ]);

/** Ends the playable season with `divisions` alongside it, and returns every division's results. */
function playAlongside(
  divisions: Championship[],
  dependencies: { rng: RandomProvider; rngForDivision?: (name: string) => RandomProvider }
): ChampionshipContainer {
  const playable = oneRoundPlayable();
  const container: ChampionshipContainer = {
    championships: [...divisions, playable],
    playableInternalName: playable.internalName,
  };

  const started = ChampionshipService.startRoundForAllChampionships(container);
  const ended = ChampionshipService.endRoundForAllChampionships(started.getResult(), dependencies);
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult();
}

const tableOf = (container: ChampionshipContainer, internalName: string) =>
  getChampionshipByInternalName(container, internalName)!.standings.map((standing) => [
    standing.team.id,
    standing.points,
    standing.goalsFor,
    standing.goalsAgainst,
  ]);

describe('per-division random streams', () => {
  let pyramid: Championship[];

  beforeAll(() => {
    pyramid = init(A).championships;
  });

  const byName = (internalName: string) =>
    pyramid.find((championship) => championship.internalName === internalName)!;

  it('plays Série C identically whether or not Série A and B drew first', () => {
    const alone = playAlongside([byName(C)], {
      rng: pinnedRng(),
      rngForDivision: pinnedRngByDivision(),
    });
    const afterOthers = playAlongside([byName(A), byName(B), byName(C)], {
      rng: pinnedRng(),
      rngForDivision: pinnedRngByDivision(),
    });

    expect(tableOf(afterOthers, C)).toEqual(tableOf(alone, C));
    expect(tableOf(afterOthers, C).some(([, points]) => points !== 0)).toBe(true);
  });

  it('does not hold with one shared stream — which is why the streams are split', () => {
    const alone = playAlongside([byName(C)], { rng: pinnedRng() });
    const afterOthers = playAlongside([byName(A), byName(B), byName(C)], { rng: pinnedRng() });

    expect(tableOf(afterOthers, C)).not.toEqual(tableOf(alone, C));
  });

  it('gives every division its own stream, memoised per factory', () => {
    const streams = pinnedRngByDivision();
    const draws = (rng: RandomProvider) => Array.from({ length: 5 }, () => rng.nextInt(0, 1000));

    expect(streams(A)).toBe(streams(A));
    expect(draws(pinnedRngByDivision()(A))).toEqual(draws(pinnedRngByDivision()(A)));
    expect(draws(pinnedRngByDivision()(A))).not.toEqual(draws(pinnedRngByDivision()(B)));
  });
});
