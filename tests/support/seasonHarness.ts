/**
 * Shared harness for the season roll-over suites.
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import ChampionshipService from '../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';
import { rankStandings } from '../../src/domain/features/standings/StandingsComparator';

/**
 * `src/setupTests.ts` stubs `crypto.randomUUID` to the constant 'mocked-uuid'. Every club would
 * then share an id, and the roll-over — which removes and re-adds clubs by id — would be
 * meaningless. Call from `beforeAll` to restore unique ids for a suite.
 */
export function useUniqueTeamIds(): void {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
}

/**
 * Brings a season to its end without playing it.
 *
 * A phased championship is only over once its **last** phase has been played, so this fabricates
 * the state a played season would have left behind: an ended final, a preserved 1ª Fase table, an
 * accumulated table, and a record of who reached each phase. The semifinalists are deliberately the
 * clubs ranked 5th–8th, so a roll-over that promotes the top four instead cannot pass.
 */
export function finishSeason(championship: Championship): Championship {
  const endedRounds = championship.matchContainer.rounds.map((round) => ({
    ...round,
    status: 'ended' as const,
  }));

  if (!championship.phases?.length) {
    return {
      ...championship,
      matchContainer: {
        ...championship.matchContainer,
        currentRound: championship.matchContainer.totalRounds + 1,
        rounds: endedRounds,
      },
    };
  }

  const lastPhaseIndex = championship.phases.length - 1;
  const semifinalIndex = lastPhaseIndex - 1;
  // Rank first, so the semifinalists and the relegated clubs are picked off the same order — the
  // 5th–8th placed clubs are in the top 8 that advance, so they can never also be the bottom two.
  const ranked = rankStandings(championship.standings);
  const ids = ranked.map((standing) => standing.team.id);
  const semifinalists = ids.slice(4, 8);
  const finalists = semifinalists.slice(0, 2);

  const phaseParticipants: Championship['phaseParticipants'] = [];
  for (let phase = 0; phase <= lastPhaseIndex; phase++) phaseParticipants[phase] = ids;
  phaseParticipants[semifinalIndex] = semifinalists;
  phaseParticipants[lastPhaseIndex] = finalists;

  const lastRoundNumber = endedRounds.reduce((last, round) => Math.max(last, round.number), 0);

  return {
    ...championship,
    currentPhaseIndex: lastPhaseIndex,
    firstPhaseStandings: ranked,
    accumulatedStandings: ranked,
    phaseParticipants,
    survivingTeamIds: [finalists[0]],
    matchContainer: {
      ...championship.matchContainer,
      currentRound: lastRoundNumber + 2,
      totalRounds: lastRoundNumber + 1,
      rounds: [
        ...endedRounds,
        {
          id: `final-${championship.internalName}`,
          number: lastRoundNumber + 1,
          matches: [],
          status: 'ended' as const,
          phaseIndex: lastPhaseIndex,
          phaseName: championship.phases[lastPhaseIndex].name,
        },
      ],
    },
  };
}

export function finishAll(container: ChampionshipContainer): ChampionshipContainer {
  return {
    playableChampionship: finishSeason(container.playableChampionship),
    promotionChampionship:
      container.promotionChampionship && finishSeason(container.promotionChampionship),
    relegationChampionship:
      container.relegationChampionship && finishSeason(container.relegationChampionship),
  };
}

export function rollOver(container: ChampionshipContainer): ChampionshipContainer {
  const result = ChampionshipService.runEndOfChampionshipActions(finishAll(container));
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

export function init(internalName: string): ChampionshipContainer {
  const result = ChampionshipService.initChampionships(internalName);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

export function divisions(container: ChampionshipContainer): Championship[] {
  return [
    container.playableChampionship,
    container.promotionChampionship,
    container.relegationChampionship,
  ].filter((championship): championship is Championship => Boolean(championship));
}

export function counts(container: ChampionshipContainer): Record<string, number> {
  const entries: Record<string, number> = {};
  for (const championship of divisions(container)) {
    entries[championship.internalName] = championship.teams.length;
  }
  return entries;
}

export function allTeamIds(container: ChampionshipContainer): string[] {
  return divisions(container).flatMap((championship) => championship.teams.map((team) => team.id));
}
