/**
 * Pure lookups over a `ChampionshipContainer`'s pyramid. Every consumer reads the divisions through
 * these, so none of them depends on how the pyramid is stored.
 */
import ChampionshipContainer from '../../models/ChampionshipContainer';
import { Championship } from '../../models/Championship';

/** The division named `internalName`, or `undefined` when the pyramid has none. */
export function getChampionshipByInternalName(
  container: ChampionshipContainer,
  internalName: string
): Championship | undefined {
  return container.championships?.find(
    (championship) => championship.internalName === internalName
  );
}

/**
 * The division the human's club plays in.
 *
 * Throws a plain `Error` when the pointer names no division — a container that was never
 * initialised. Callers in services and use cases already run inside a try/catch.
 */
export function getPlayableChampionship(container: ChampionshipContainer): Championship {
  const playable = getChampionshipByInternalName(container, container.playableInternalName);
  if (!playable) throw new Error('Playable championship not found.');
  return playable;
}

/** The division `championship` promotes into, or `undefined` at the top of the pyramid. */
export function getDivisionAbove(
  container: ChampionshipContainer,
  championship: Championship
): Championship | undefined {
  if (!championship.isPromotable) return undefined;
  return getChampionshipByInternalName(container, championship.promotionChampionshipInternalName);
}

/** The division `championship` relegates into, or `undefined` at the bottom of the pyramid. */
export function getDivisionBelow(
  container: ChampionshipContainer,
  championship: Championship
): Championship | undefined {
  if (!championship.isRelegatable) return undefined;
  return getChampionshipByInternalName(container, championship.relegationChampionshipInternalName);
}

/**
 * A new container with the division sharing `championship`'s `internalName` swapped for it. Every
 * other division, the pointer and the cups are carried over by reference.
 *
 * Throws a plain `Error` when no division has that name: replacing nothing would silently drop the
 * update.
 */
export function replaceChampionship(
  container: ChampionshipContainer,
  championship: Championship
): ChampionshipContainer {
  const index = container.championships.findIndex(
    (existing) => existing.internalName === championship.internalName
  );
  if (index === -1) throw new Error(`Championship ${championship.internalName} not found.`);

  const championships = container.championships.slice();
  championships[index] = championship;
  return { ...container, championships };
}

/** A new container with `update` applied to the playable division. */
export function updatePlayableChampionship(
  container: ChampionshipContainer,
  update: (playable: Championship) => Championship
): ChampionshipContainer {
  return replaceChampionship(container, update(getPlayableChampionship(container)));
}
