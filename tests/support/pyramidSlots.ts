/**
 * The playable division and its two neighbours, read off a pyramid container.
 *
 * For the regression suites written against MS-107's three-slot container: `aboveOf` / `belowOf`
 * are exactly what `promotionChampionship` / `relegationChampionship` held, since that container was
 * always centred on the playable division.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';
import {
  getDivisionAbove,
  getDivisionBelow,
  getPlayableChampionship,
} from '../../src/domain/features/pyramid/Pyramid';

export const playableOf = (container: ChampionshipContainer): Championship =>
  getPlayableChampionship(container);

/** The division the playable one promotes into, or `undefined` at the top of the pyramid. */
export const aboveOf = (container: ChampionshipContainer): Championship | undefined =>
  getDivisionAbove(container, getPlayableChampionship(container));

/** The division the playable one relegates into, or `undefined` at the bottom of the pyramid. */
export const belowOf = (container: ChampionshipContainer): Championship | undefined =>
  getDivisionBelow(container, getPlayableChampionship(container));
