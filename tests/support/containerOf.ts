/**
 * Builds a `ChampionshipContainer` around hand-made championships, for suites that do not load the
 * seed pyramid.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';

/** `playable` and any `others`, with `playable` as the pointer. Order is `others` then `playable`. */
export function containerOf(
  playable: Championship,
  others: Championship[] = []
): ChampionshipContainer {
  return {
    championships: [...others, playable],
    playableInternalName: playable.internalName,
  };
}
