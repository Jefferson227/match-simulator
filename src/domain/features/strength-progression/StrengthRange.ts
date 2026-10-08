import { MAX_STRENGTH, MIN_STRENGTH } from '../../constants/StrengthConstants';
import { Championship } from '../../models/Championship';
import ChampionshipContainer from '../../models/ChampionshipContainer';
import { getTierCount } from '../pyramid/Pyramid';

/** An inclusive slice of the strength scale. */
export type StrengthRange = { min: number; max: number };

function getUpperBound(tierFromBottom: number, tierCount: number): number {
  return Math.floor((MAX_STRENGTH * tierFromBottom) / tierCount);
}

/**
 * The slice of 1–99 a division owns (MS-115). `tier` counts from the top (1 = Série A), so it is
 * turned around first: the k-th tier from the bottom of N ends at `floor(99 × k / N)` and starts
 * right after the tier below it.
 *
 * Men's four tiers come out at 1–24, 25–49, 50–74 and 75–99; women's three at 1–33, 34–66 and
 * 67–99.
 */
export function getStrengthRange(tier: number, tierCount: number): StrengthRange {
  const tierFromBottom = tierCount - tier + 1;
  const min =
    tierFromBottom === 1 ? MIN_STRENGTH : getUpperBound(tierFromBottom - 1, tierCount) + 1;
  return { min, max: getUpperBound(tierFromBottom, tierCount) };
}

/** `championship`'s range within `container`'s pyramid, or `undefined` for a tierless cup. */
export function getDivisionStrengthRange(
  container: ChampionshipContainer,
  championship: Championship
): StrengthRange | undefined {
  if (championship.tier === undefined) return undefined;
  return getStrengthRange(championship.tier, getTierCount(container));
}
