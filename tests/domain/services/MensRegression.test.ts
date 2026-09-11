import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';

// Unique club ids: `src/setupTests.ts` stubs crypto.randomUUID to a constant, and the roll-over
// removes and re-adds clubs by id.
beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

const MENS = ['brasileirao-serie-a', 'brasileirao-serie-b'] as const;

/**
 * The championships of a container that are Série A or B. Since MS-106 Série B's relegation
 * neighbour is the phased Série C, which these pre-MS-103 pins do not describe.
 */
function unphasedMens(container: ChampionshipContainer): Championship[] {
  return [
    container.playableChampionship,
    container.promotionChampionship,
    container.relegationChampionship,
  ].filter(
    (championship): championship is Championship =>
      Boolean(championship) && (MENS as readonly string[]).includes(championship!.internalName)
  );
}

type Entry = Record<string, unknown> & { internalName: string };

function record(internalName: string): Entry {
  const found = (championshipsJSON as unknown as Entry[]).find(
    (entry) => entry.internalName === internalName
  );
  if (!found) throw new Error(`${internalName} is not seeded`);
  return found;
}

function init(internalName: string): ChampionshipContainer {
  const result = ChampionshipService.initChampionships(internalName);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

/**
 * The pre-MS-103 fixture generator, copied verbatim from `ChampionshipService.createMatches` as it
 * stood before this ticket. Anything the men's divisions generate must still match it exactly.
 */
function legacyFixtures(startingTeams: Team[]) {
  const teams = [...startingTeams];
  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const rounds: { number: number; matches: { home: string; away: string }[] }[] = [];
  let roundNumber = 1;

  for (let round = 0; round < roundsPerLeg; round++) {
    const matches: { home: string; away: string }[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      matches.push({ home: teams[i].id, away: teams[teams.length - 1 - i].id });
    }
    rounds.push({ number: roundNumber, matches });
    roundNumber += 1;

    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  const firstLegRoundsCount = rounds.length;
  for (let i = 0; i < firstLegRoundsCount; i++) {
    rounds.push({
      number: roundNumber,
      matches: rounds[i].matches.map((match) => ({ home: match.away, away: match.home })),
    });
    roundNumber += 1;
  }

  return { totalRounds: roundsPerLeg * 2, rounds };
}

function actualFixtures(championship: Championship) {
  return championship.matchContainer.rounds.map((round) => ({
    number: round.number,
    matches: round.matches.map((match) => ({
      home: match.homeTeam.id,
      away: match.awayTeam.id,
    })),
  }));
}

function finishSeason(championship: Championship): Championship {
  return {
    ...championship,
    matchContainer: {
      ...championship.matchContainer,
      currentRound: championship.matchContainer.totalRounds + 1,
      rounds: championship.matchContainer.rounds.map((round) => ({
        ...round,
        status: 'ended' as const,
      })),
    },
  };
}

describe("the men's seed data is untouched by MS-103", () => {
  it.each(MENS)('%s declares no phases and stays a double round-robin', (internalName) => {
    const entry = record(internalName);

    expect(entry.phases).toBeUndefined();
    expect(entry.type).toBe('double-round-robin');
    expect(entry.numberOfTeams).toBe(20);
    expect(entry.teamNames as string[]).toHaveLength(20);
    expect(entry.leagueType).toBe('mens');
  });

  it.each(MENS)('%s declares none of the new fields', (internalName) => {
    const entry = record(internalName);

    // Every MS-103 field is opt-in; the men's divisions opt into none of them.
    expect(entry).not.toHaveProperty('promotionRule');
    expect(entry).not.toHaveProperty('relegationRule');
    expect(entry).not.toHaveProperty('targetNumberOfTeams');
    expect(entry).not.toHaveProperty('numberOfRelegatableTeamsAtTarget');
    expect(entry).not.toHaveProperty('hasLeagueTable');
  });

  it('keeps Série A relegating 4 to Série B and Série B promoting 4 back', () => {
    expect(record('brasileirao-serie-a').numberOfRelegatableTeams).toBe(4);
    expect(record('brasileirao-serie-a').relegationChampionshipInternalName).toBe(
      'brasileirao-serie-b'
    );
    expect(record('brasileirao-serie-b').numberOfPromotableTeams).toBe(4);
    expect(record('brasileirao-serie-b').promotionChampionshipInternalName).toBe(
      'brasileirao-serie-a'
    );
  });
});

describe("the men's championships load unphased", () => {
  it.each(MENS)('%s has a table and no phase state', (internalName) => {
    const championship = init(internalName).playableChampionship;

    expect(championship.phases).toBeUndefined();
    expect(championship.currentPhaseIndex).toBeUndefined();
    expect(championship.survivingTeamIds).toBeUndefined();
    expect(championship.firstPhaseStandings).toBeUndefined();
    expect(championship.accumulatedStandings).toBeUndefined();
    expect(championship.phaseEntrants).toBeUndefined();
    expect(championship.hasLeagueTable).toBe(true);
    expect(championship.standings).toHaveLength(20);
  });

  it.each(MENS)('%s defaults both exchange rules to table-position', (internalName) => {
    const container = init(internalName);

    for (const championship of unphasedMens(container)) {
      if (championship.isPromotable) expect(championship.promotionRule).toBe('table-position');
      if (championship.isRelegatable) expect(championship.relegationRule).toBe('table-position');
    }
  });
});

describe("the men's fixtures are byte-identical to the pre-MS-103 generator", () => {
  it.each(MENS)('%s generates the same 38 rounds and 380 matches', (internalName) => {
    const container = init(internalName);

    for (const championship of unphasedMens(container)) {
      const expected = legacyFixtures(championship.teams);

      expect(championship.matchContainer.totalRounds).toBe(38);
      expect(championship.matchContainer.totalRounds).toBe(expected.totalRounds);
      expect(championship.matchContainer.rounds).toHaveLength(38);
      expect(championship.matchContainer.rounds.flatMap((round) => round.matches)).toHaveLength(
        380
      );
      // Same pairings, same home and away, round for round.
      expect(actualFixtures(championship)).toEqual(expected.rounds);
    }
  });

  it('tags no men’s round or match with a phase', () => {
    const championship = init('brasileirao-serie-a').playableChampionship;

    for (const round of championship.matchContainer.rounds) {
      expect(round.phaseIndex).toBeUndefined();
      expect(round.phaseName).toBeUndefined();
      for (const match of round.matches) {
        expect(match.phaseIndex).toBeUndefined();
        expect(match.tieId).toBeUndefined();
        expect(match.group).toBeUndefined();
        expect(match.penaltyShootout).toBeUndefined();
      }
    }
  });
});

describe("the men's promotion, relegation and roll-over are unchanged", () => {
  it('takes the top 4 up and the bottom 4 down, straight off the table', () => {
    const container = init('brasileirao-serie-a');
    const before = {
      serieA: container.playableChampionship.standings.map((standing) => standing.team.id),
      serieB: container.relegationChampionship!.standings.map((standing) => standing.team.id),
    };

    const rolled = ChampionshipService.runEndOfChampionshipActions({
      playableChampionship: finishSeason(container.playableChampionship),
      relegationChampionship: finishSeason(container.relegationChampionship!),
    }).getResult();

    const serieA = rolled.playableChampionship.teams.map((team) => team.id);
    const serieB = rolled.relegationChampionship!.teams.map((team) => team.id);

    // The bottom 4 of Série A go down; the top 4 of Série B come up.
    expect(before.serieA.slice(-4).every((id) => serieB.includes(id))).toBe(true);
    expect(before.serieB.slice(0, 4).every((id) => serieA.includes(id))).toBe(true);
    expect(before.serieA.slice(-4).some((id) => serieA.includes(id))).toBe(false);
  });

  it.each(MENS)('%s holds 20 clubs on both sides across three roll-overs', (internalName) => {
    let container = init(internalName);
    const initialIds = new Set(
      [
        container.playableChampionship,
        container.promotionChampionship,
        container.relegationChampionship,
      ]
        .filter((championship): championship is Championship => Boolean(championship))
        .flatMap((championship) => championship.teams.map((team) => team.id))
    );

    for (let season = 0; season < 3; season++) {
      const rolled = ChampionshipService.runEndOfChampionshipActions({
        playableChampionship: finishSeason(container.playableChampionship),
        promotionChampionship:
          container.promotionChampionship && finishSeason(container.promotionChampionship),
        relegationChampionship:
          container.relegationChampionship && finishSeason(container.relegationChampionship),
      });
      expect(rolled.succeeded).toBe(true);
      container = rolled.getResult();

      const all = [
        container.playableChampionship,
        container.promotionChampionship,
        container.relegationChampionship,
      ].filter((championship): championship is Championship => Boolean(championship));

      for (const championship of all) {
        expect(championship.teams).toHaveLength(20);
        expect(championship.numberOfTeams).toBe(20);
      }
      for (const championship of unphasedMens(container)) {
        expect(championship.matchContainer.totalRounds).toBe(38);
        expect(championship.phases).toBeUndefined();
      }

      const ids = all.flatMap((championship) => championship.teams.map((team) => team.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(ids).size).toBe(initialIds.size);
      for (const id of ids) expect(initialIds.has(id)).toBe(true);
    }
  });
});

describe('the men’s pyramid runs A ↔ B ↔ C ↔ D (MS-106)', () => {
  it('links every division to its neighbours through the loaded containers', () => {
    const links = [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ].map((internalName) => {
      const playable = init(internalName).playableChampionship;
      return [
        internalName,
        playable.isPromotable ? playable.promotionChampionshipInternalName : null,
        playable.isRelegatable ? playable.relegationChampionshipInternalName : null,
      ];
    });

    expect(links).toEqual([
      ['brasileirao-serie-a', null, 'brasileirao-serie-b'],
      ['brasileirao-serie-b', 'brasileirao-serie-a', 'brasileirao-serie-c'],
      ['brasileirao-serie-c', 'brasileirao-serie-b', 'brasileirao-serie-d'],
      ['brasileirao-serie-d', 'brasileirao-serie-c', null],
    ]);
  });

  it('sends Série B’s bottom 4 to Série C and takes 4 back when Série B is played', () => {
    const container = init('brasileirao-serie-b');
    const bottomOfB = container.playableChampionship.standings
      .slice(-4)
      .map((standing) => standing.team.id);

    const rolled = ChampionshipService.runEndOfChampionshipActions({
      playableChampionship: finishSeason(container.playableChampionship),
      promotionChampionship: finishSeason(container.promotionChampionship!),
      relegationChampionship: container.relegationChampionship,
    }).getResult();

    const serieB = rolled.playableChampionship.teams.map((team) => team.id);
    const serieC = rolled.relegationChampionship!.teams.map((team) => team.id);
    const cameUp = serieB.filter((id) =>
      container.relegationChampionship!.teams.some((team) => team.id === id)
    );

    expect(bottomOfB.every((id) => serieC.includes(id))).toBe(true);
    expect(bottomOfB.some((id) => serieB.includes(id))).toBe(false);
    expect(cameUp).toHaveLength(4);
    expect(serieB).toHaveLength(20);
    expect(serieC).toHaveLength(20);
    // Série C's next season is its real format again, not Série B's round-robin.
    expect(rolled.relegationChampionship!.phases).toHaveLength(3);
  });
});
