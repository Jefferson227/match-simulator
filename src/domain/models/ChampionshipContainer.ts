import { Championship } from './Championship';

/**
 * Every championship a game plays: the whole league pyramid of the human's league type, plus the
 * cups.
 *
 * Read the divisions through `src/domain/features/pyramid/Pyramid.ts` rather than indexing
 * `championships` by hand. See `wiki/decisions/ms-109-full-pyramid-container.md`.
 */
type ChampionshipContainer = {
  /**
   * Every league division of the human's league type, sorted by `tier`, top first — Série A to D,
   * or A1 to A3. A division never leaves the list, so its state survives any sequence of promotions
   * and relegations.
   */
  championships: Championship[];
  /**
   * `internalName` of the division holding the human's club — the one the clock, the match screen
   * and the standings play. A promotion or relegation moves only this pointer.
   */
  playableInternalName: string;
  /** The cups. Declared so it survives save and load; not loaded, simulated or shown in MS-109. */
  cups?: Championship[];
};

export default ChampionshipContainer;
