/**
 * Loads one seeded competition on its own, initialised as a new game would initialise it.
 *
 * `ChampionshipService.initChampionships` loads a league pyramid and refuses a cup (MS-109), so the
 * cup suites build their one-competition container through this instead.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';
import { createMatches } from '../../src/domain/features/fixture-generation/FixtureGenerator';
import { initialisePhaseState } from '../../src/domain/features/phases/PhaseProgression';
import { getChampionship } from '../../src/infrastructure/repositories/ChampionshipRepository';
import { containerOf } from './containerOf';

export function loadSeededChampionship(internalName: string): Championship {
  const championship = getChampionship(internalName, false);

  return initialisePhaseState({
    ...championship,
    matchContainer: createMatches(
      championship.teams,
      championship.phases,
      championship.phaseEntrants
    ),
  });
}

/** A container holding the seeded competition alone, as the playable one. */
export const seededContainerOf = (internalName: string): ChampionshipContainer =>
  containerOf(loadSeededChampionship(internalName));
