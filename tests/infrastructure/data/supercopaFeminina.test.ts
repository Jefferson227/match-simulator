import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import Round from '../../../src/domain/models/Round';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';

beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

const INTERNAL_NAME = 'supercopa-feminina';

function record() {
  const found = (championshipsJSON as { internalName: string }[]).find(
    (entry) => entry.internalName === INTERNAL_NAME
  );
  if (!found) throw new Error('Supercopa is not seeded');
  return found as Record<string, unknown>;
}

function stubRng(): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      index += 1;
      return min + (((index * 7919 + 104729) % 10007) % (max - min + 1));
    },
  };
}

function init(): ChampionshipContainer {
  const result = ChampionshipService.initChampionships(INTERNAL_NAME);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

/** Plays the one match to the given score and ends the round. */
function play(container: ChampionshipContainer, home: number, away: number): Championship {
  const started = ChampionshipService.startRoundForAllChampionships(container).getResult();
  const championship = started.playableChampionship;

  const rounds: Round[] = championship.matchContainer.rounds.map((round) =>
    round.number !== championship.matchContainer.currentRound
      ? round
      : {
          ...round,
          matches: round.matches.map((match) => ({
            ...match,
            homeTeamScore: home,
            awayTeamScore: away,
          })),
        }
  );

  const ended = ChampionshipService.endRoundForAllChampionships(
    {
      ...started,
      playableChampionship: {
        ...championship,
        matchContainer: { ...championship.matchContainer, rounds },
      },
    },
    { rng: stubRng() }
  );
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult().playableChampionship;
}

describe('Supercopa Feminina — seed data', () => {
  it('is seeded under its official name', () => {
    // REC Art. 1º/4º: "Supercopa Feminina de 2026", not "Supercopa do Brasil Feminino" — only the
    // URL slug says supercopa-do-brasil.
    expect(record().name).toBe('SUPERCOPA FEMININA DE 2026');
    expect(record().leagueType).toBe('womens');
  });

  it('has no league table and exactly one single-legged phase', () => {
    expect(record().hasLeagueTable).toBe(false);
    expect(record().phases).toEqual([
      {
        kind: 'knockout',
        name: 'Final',
        numberOfTies: 1,
        legs: 1,
        secondLegHost: 'drawn',
        tiebreakers: ['penalties'],
      },
    ]);
  });

  it('uses two clubs the game already seeds, adding no team data', () => {
    expect(record().teamNames).toEqual(['corinthians', 'palmeiras']);
    expect(record().numberOfTeams).toBe(2);
  });

  it('neither promotes nor relegates', () => {
    expect(record()).not.toHaveProperty('numberOfPromotableTeams');
    expect(record()).not.toHaveProperty('numberOfRelegatableTeams');
  });
});

describe('Supercopa Feminina — loading and playing', () => {
  it('loads without standings', () => {
    const championship = init().playableChampionship;

    expect(championship.hasLeagueTable).toBe(false);
    expect(championship.standings).toEqual([]);
    expect(championship.teams).toHaveLength(2);
  });

  it('generates exactly one match', () => {
    const { matchContainer } = init().playableChampionship;

    expect(matchContainer.totalRounds).toBe(1);
    expect(matchContainer.rounds).toHaveLength(1);
    expect(matchContainer.rounds[0].matches).toHaveLength(1);
    expect(matchContainer.rounds[0].phaseName).toBe('Final');
  });

  it('crowns the winner of a decided match without a shootout', () => {
    const championship = play(init(), 2, 1);

    const match = championship.matchContainer.rounds[0].matches[0];
    expect(championship.survivingTeamIds).toEqual([match.homeTeam.id]);
    expect(match.penaltyShootout).toBeUndefined();
  });

  it('resolves a draw on penalties, with no extra time and no goal-difference step', () => {
    const championship = play(init(), 1, 1);
    const match = championship.matchContainer.rounds[0].matches[0];

    expect(match.penaltyShootout).toBeDefined();
    expect(match.penaltyShootout!.kicks.length).toBeGreaterThan(0);
    // The shootout decides the tie without touching the recorded score.
    expect(match.homeTeamScore).toBe(1);
    expect(match.awayTeamScore).toBe(1);
    expect(championship.survivingTeamIds).toHaveLength(1);
  });

  it('is over once its only match is played', () => {
    const championship = play(init(), 2, 1);

    const rolled = ChampionshipService.runEndOfChampionshipActions({
      playableChampionship: championship,
    });

    expect(rolled.succeeded).toBe(true);
    // A cup has nobody to promote or relegate, so the roll-over just starts a new edition.
    expect(rolled.getResult().playableChampionship.teams).toHaveLength(2);
  });

  it('is offered in the women’s championship list', () => {
    const womens = ChampionshipService.getChampionships('womens').getResult();

    expect(womens.map((championship) => championship.internalName)).toContain(INTERNAL_NAME);
    expect(
      ChampionshipService.getChampionships('mens')
        .getResult()
        .map((c) => c.internalName)
    ).not.toContain(INTERNAL_NAME);
  });
});
