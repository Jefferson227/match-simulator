import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';

// Unique club ids; see the note in SeasonRollover.test.ts.
beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

/** Deterministic, but varied enough that shootouts separate. */
function stubRng(): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      index += 1;
      return min + (((index * 7919 + 104729) % 10007) % (max - min + 1));
    },
  };
}

function init(internalName: string): ChampionshipContainer {
  const result = ChampionshipService.initChampionships(internalName);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

/** Plays the playable championship to the end of its season, one round per call. */
function playSeason(internalName: string) {
  let container = init(internalName);
  const rng = stubRng();
  const errors: string[] = [];
  let roundsPlayed = 0;

  for (let guard = 0; guard < 200; guard++) {
    const matchContainer = container.playableChampionship.matchContainer;
    const hasRound = matchContainer.rounds.some(
      (round) => round.number === matchContainer.currentRound
    );
    if (!hasRound) break;

    const started = ChampionshipService.startRoundForAllChampionships(container);
    if (!started.succeeded) {
      errors.push(`startRound round ${roundsPlayed + 1}: ${started.error?.message}`);
      break;
    }

    const ended = ChampionshipService.endRoundForAllChampionships(started.getResult(), { rng });
    if (!ended.succeeded) {
      errors.push(`endRound round ${roundsPlayed + 1}: ${ended.error?.message}`);
      break;
    }

    container = ended.getResult();
    roundsPlayed += 1;
  }

  return { container, errors, roundsPlayed };
}

function aiChampionships(container: ChampionshipContainer): Championship[] {
  return [container.promotionChampionship, container.relegationChampionship].filter(
    (championship): championship is Championship => Boolean(championship)
  );
}

describe('the pre-existing lockstep overflow', () => {
  it('no longer throws when the AI championship runs out of rounds before the playable one', () => {
    // Before MS-103 this threw "Championship couldn't be found." at playable round 22: A1 plays 23
    // rounds and A2 only 21, and endRound was called on both once per round.
    const { errors, container } = playSeason('brasileirao-feminino-serie-a1');

    expect(errors).toEqual([]);
    expect(container.playableChampionship.matchContainer.totalRounds).toBe(23);
    expect(container.relegationChampionship!.matchContainer.totalRounds).toBe(21);
  });
});

describe('the playable championship is the clock', () => {
  it('advances only the playable championship for a round in the middle of a phase', () => {
    const container = init('brasileirao-feminino-serie-a1');
    const started = ChampionshipService.startRoundForAllChampionships(container).getResult();
    const ended = ChampionshipService.endRoundForAllChampionships(started, {
      rng: stubRng(),
    }).getResult();

    expect(ended.playableChampionship.matchContainer.currentRound).toBe(2);
    // The AI division has not been touched: still on round 1, nothing played.
    expect(ended.relegationChampionship!.matchContainer.currentRound).toBe(1);
    expect(ended.relegationChampionship!.standings.every((standing) => standing.points === 0)).toBe(
      true
    );
  });

  it('does not start a round on the AI championships', () => {
    const container = init('brasileirao-feminino-serie-a1');
    const started = ChampionshipService.startRoundForAllChampionships(container).getResult();

    expect(started.playableChampionship.matchContainer.rounds[0].status).toBe('in-progress');
    expect(started.relegationChampionship!.matchContainer.rounds[0].status).toBe('not-started');
  });

  it('catches the AI championships up in one execution at the first phase boundary', () => {
    let container = init('brasileirao-feminino-serie-a1');
    const rng = stubRng();

    // A1's 1ª Fase is 17 rounds; the boundary is crossed when the 17th ends.
    for (let round = 1; round <= 17; round++) {
      const started = ChampionshipService.startRoundForAllChampionships(container).getResult();
      container = ChampionshipService.endRoundForAllChampionships(started, { rng }).getResult();

      const a2 = container.relegationChampionship!;
      if (round < 17) {
        expect(a2.matchContainer.currentRound).toBe(1);
      } else {
        // A2 played its whole 15-round first phase and its knockouts in a single pass.
        expect(a2.currentPhaseIndex).toBeGreaterThan(0);
        expect(a2.firstPhaseStandings).toHaveLength(16);
      }
    }
  });
});

describe.each([
  ['brasileirao-feminino-serie-a1', 23],
  ['brasileirao-feminino-serie-a2', 21],
  ['brasileirao-feminino-serie-a3', 14],
])('a full women’s season with %s playable', (internalName, expectedRounds) => {
  // Played in a hook, not in the describe body: describe bodies run at collection time, before the
  // outer beforeAll restores unique club ids, and a division whose clubs all share one id collapses
  // to a single standing.
  let container: ChampionshipContainer;
  let errors: string[];
  let roundsPlayed: number;

  beforeAll(() => {
    ({ container, errors, roundsPlayed } = playSeason(internalName as string));
  });

  it('completes without error', () => {
    expect(errors).toEqual([]);
    expect(roundsPlayed).toBe(expectedRounds);
  });

  it('plays the playable championship to its final', () => {
    const playable = container.playableChampionship;

    expect(playable.matchContainer.totalRounds).toBe(expectedRounds);
    expect(playable.currentPhaseIndex).toBe(playable.phases!.length - 1);
    expect(playable.survivingTeamIds).toHaveLength(1);
  });

  it('plays every AI division to its own final before the season ends', () => {
    for (const championship of aiChampionships(container)) {
      expect(championship.currentPhaseIndex).toBe(championship.phases!.length - 1);
      expect(championship.survivingTeamIds).toHaveLength(1);
      expect(championship.firstPhaseStandings).toHaveLength(championship.teams.length);
      // The semifinalists promotion and 1ª Fase relegation both need this to exist.
      expect(championship.phaseParticipants!.length).toBe(championship.phases!.length);
    }
  });

  it('rolls the season over without error once every division is played out', () => {
    const rolled = ChampionshipService.runEndOfChampionshipActions(container);

    expect(rolled.succeeded).toBe(true);
    expect(rolled.getResult().playableChampionship.matchContainer.currentSeason).toBe(
      container.playableChampionship.matchContainer.currentSeason + 1
    );
  });

  it('leaves a finished AI championship alone rather than erroring', () => {
    // Every division is already played out; catching up again must be a no-op.
    const again = ChampionshipService.endRoundForAllChampionships(container, { rng: stubRng() });

    expect(again.succeeded).toBe(true);
  });
});

describe('Série A3 plays its real format', () => {
  it('is 6 group rounds plus four knockout phases, not 62 rounds', () => {
    const container = init('brasileirao-feminino-serie-a3');
    const a3 = container.playableChampionship;

    expect(a3.type).toBe('group-stage-knockout');
    expect(a3.matchContainer.rounds).toHaveLength(6);
    expect(a3.matchContainer.rounds.flatMap((round) => round.matches)).toHaveLength(96);
    expect(a3.phases).toHaveLength(5);
  });
});

describe('the men’s divisions still run round for round', () => {
  it('plays 38 rounds and ends with both divisions fully played', () => {
    const { container, errors, roundsPlayed } = playSeason('brasileirao-serie-a');

    expect(errors).toEqual([]);
    expect(roundsPlayed).toBe(38);
    expect(container.playableChampionship.matchContainer.totalRounds).toBe(38);
    expect(container.playableChampionship.phases).toBeUndefined();

    const serieB = container.relegationChampionship!;
    expect(serieB.matchContainer.currentRound).toBeGreaterThan(serieB.matchContainer.totalRounds);
    expect(serieB.standings.some((standing) => standing.points > 0)).toBe(true);
  });

  it('rolls over into a new season with 20 clubs each', () => {
    const { container } = playSeason('brasileirao-serie-a');
    const rolled = ChampionshipService.runEndOfChampionshipActions(container).getResult();

    expect(rolled.playableChampionship.teams).toHaveLength(20);
    expect(rolled.relegationChampionship!.teams).toHaveLength(20);
  });
});
