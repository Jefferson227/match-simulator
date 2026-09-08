import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { KnockoutPhase } from '../../../src/domain/models/ChampionshipPhase';
import Round from '../../../src/domain/models/Round';
import { Team } from '../../../src/domain/models/Team';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';

beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

const INTERNAL_NAME = 'copa-do-brasil-feminina';

type Entry = {
  internalName: string;
  name: string;
  numberOfTeams: number;
  hasLeagueTable?: boolean;
  teamNames: string[];
  phases: KnockoutPhase[];
};

function record(): Entry {
  const found = (championshipsJSON as unknown as Entry[]).find(
    (entry) => entry.internalName === INTERNAL_NAME
  );
  if (!found) throw new Error('Copa is not seeded');
  return found;
}

function divisionNames(internalName: string): string[] {
  const found = (championshipsJSON as unknown as Entry[]).find(
    (entry) => entry.internalName === internalName
  );
  if (!found) throw new Error(`${internalName} is not seeded`);
  return found.teamNames;
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

/** Plays the whole competition, home side always winning, and returns every snapshot. */
function playCup(): { championship: Championship; snapshots: Championship[] } {
  let container = init();
  const rng = stubRng();
  const snapshots: Championship[] = [container.playableChampionship];

  for (let guard = 0; guard < 40; guard++) {
    const matchContainer = container.playableChampionship.matchContainer;
    const hasRound = matchContainer.rounds.some(
      (round) => round.number === matchContainer.currentRound
    );
    if (!hasRound) break;

    const started = ChampionshipService.startRoundForAllChampionships(container).getResult();
    const championship = started.playableChampionship;
    const rounds: Round[] = championship.matchContainer.rounds.map((round) =>
      round.number !== championship.matchContainer.currentRound
        ? round
        : {
            ...round,
            matches: round.matches.map((match) => ({
              ...match,
              homeTeamScore: 2,
              awayTeamScore: 0,
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
      { rng }
    );
    if (!ended.succeeded) throw new Error(ended.error?.message);

    container = ended.getResult();
    snapshots.push(container.playableChampionship);
  }

  return { championship: container.playableChampionship, snapshots };
}

describe('Copa do Brasil Feminina — seed data', () => {
  it('is seeded under its official name, with 66 clubs and no table', () => {
    // REC Art. 1º/2º: "Feminina", feminine agreement — only the URL slug says "Feminino".
    expect(record().name).toBe('COPA DO BRASIL FEMININA');
    expect(record().numberOfTeams).toBe(66);
    expect(record().teamNames).toHaveLength(66);
    expect(new Set(record().teamNames).size).toBe(66);
    expect(record().hasLeagueTable).toBe(false);
  });

  it('adds no team data — its field is exactly A1 + A2 + A3', () => {
    const divisions = [
      ...divisionNames('brasileirao-feminino-serie-a1'),
      ...divisionNames('brasileirao-feminino-serie-a2'),
      ...divisionNames('brasileirao-feminino-serie-a3'),
    ];

    expect(new Set(record().teamNames)).toEqual(new Set(divisions));
  });

  it('declares the 8 phases of REC Art. 11 with the right tie counts', () => {
    expect(
      record().phases.map((phase) => ({
        name: phase.name,
        ties: phase.numberOfTies,
        legs: phase.legs,
      }))
    ).toEqual([
      { name: 'Fase Preliminar', ties: 2, legs: 1 },
      { name: '1ª Fase', ties: 16, legs: 1 },
      { name: '2ª Fase', ties: 16, legs: 1 },
      { name: '3ª Fase', ties: 16, legs: 1 },
      { name: '4ª Fase', ties: 8, legs: 1 },
      { name: '5ª Fase', ties: 4, legs: 2 },
      { name: '6ª Fase', ties: 2, legs: 2 },
      { name: '7ª Fase', ties: 1, legs: 2 },
    ]);
  });

  it('is single-legged through the 4ª Fase and two-legged from the 5ª on', () => {
    const legs = record().phases.map((phase) => phase.legs);
    expect(legs).toEqual([1, 1, 1, 1, 1, 2, 2, 2]);

    record().phases.forEach((phase) => {
      // A single-legged tie has no goal-difference step (REC Art. 13 §1).
      expect(phase.tiebreakers).toEqual(
        phase.legs === 1 ? ['penalties'] : ['goal-difference', 'penalties']
      );
    });
  });

  it('draws hosting at every phase, never inheriting the divisions’ seeded rule', () => {
    record().phases.forEach((phase) => expect(phase.secondLegHost).toBe('drawn'));
  });

  it('staggers entry across four phases and totals 66 clubs, with no byes', () => {
    const entrants = record().phases.map((phase) => phase.entrants?.length ?? 0);

    expect(entrants).toEqual([4, 30, 16, 16, 0, 0, 0, 0]);
    expect(entrants.reduce((total, count) => total + count, 0)).toBe(66);
  });

  it('enters each division’s clubs at the phase the Ranking Adaptado gives them', () => {
    const a1 = divisionNames('brasileirao-feminino-serie-a1');
    const a2 = divisionNames('brasileirao-feminino-serie-a2');
    const a3 = divisionNames('brasileirao-feminino-serie-a3');
    const at = (phase: number) => new Set(record().phases[phase].entrants ?? []);

    // Preliminar is A3 only; the 3ª Fase is A1 only.
    for (const name of at(0)) expect(a3).toContain(name);
    for (const name of at(3)) expect(a1).toContain(name);

    // The 1ª Fase mixes A3 with A2's bottom two; the 2ª mixes A2 with A1's bottom two.
    expect([...at(1)].filter((name) => a2.includes(name))).toHaveLength(2);
    expect([...at(1)].filter((name) => a3.includes(name))).toHaveLength(28);
    expect([...at(2)].filter((name) => a1.includes(name))).toHaveLength(2);
    expect([...at(2)].filter((name) => a2.includes(name))).toHaveLength(14);
  });
});

describe('Copa do Brasil Feminina — generated bracket', () => {
  it('loads with no standings and only the Preliminar generated', () => {
    const cup = init().playableChampionship;

    expect(cup.standings).toEqual([]);
    expect(cup.teams).toHaveLength(66);
    expect(cup.survivingTeamIds).toHaveLength(4);
    expect(cup.matchContainer.rounds).toHaveLength(1);
    expect(cup.matchContainer.rounds[0].matches).toHaveLength(2);
  });

  it('produces 72 matches over 11 rounds when played to the final', () => {
    const { championship } = playCup();
    const matches = championship.matchContainer.rounds.flatMap((round) => round.matches);

    expect(championship.matchContainer.rounds).toHaveLength(11);
    expect(matches).toHaveLength(72);
  });

  it('halves the field at every phase, with the entrants joining on schedule', () => {
    const { championship } = playCup();
    const perPhase = championship.phases!.map((_, phaseIndex) =>
      championship.matchContainer.rounds
        .filter((round) => round.phaseIndex === phaseIndex)
        .flatMap((round) => round.matches)
    );

    expect(perPhase.map((matches) => matches.length)).toEqual([2, 16, 16, 16, 8, 8, 4, 2]);
    expect(championship.phaseParticipants!.map((participants) => participants.length)).toEqual([
      4, 32, 32, 32, 16, 8, 4, 2,
    ]);
  });

  it('gives every club exactly one entry into the bracket', () => {
    const { championship } = playCup();
    const firstAppearance = new Map<Team['id'], number>();

    for (const round of championship.matchContainer.rounds) {
      for (const match of round.matches) {
        for (const team of [match.homeTeam, match.awayTeam]) {
          if (!firstAppearance.has(team.id)) firstAppearance.set(team.id, round.phaseIndex ?? 0);
        }
      }
    }

    expect(firstAppearance.size).toBe(66);
    const byPhase = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const phaseIndex of firstAppearance.values()) byPhase[phaseIndex] += 1;
    expect(byPhase).toEqual([4, 30, 16, 16, 0, 0, 0, 0]);
  });

  it('crowns a single champion', () => {
    const { championship } = playCup();

    expect(championship.currentPhaseIndex).toBe(7);
    expect(championship.survivingTeamIds).toHaveLength(1);
  });

  it('reverses home and away between the legs of the two-legged phases only', () => {
    const { championship } = playCup();

    for (let phaseIndex = 5; phaseIndex <= 7; phaseIndex++) {
      const rounds = championship.matchContainer.rounds.filter(
        (round) => round.phaseIndex === phaseIndex
      );
      expect(rounds).toHaveLength(2);
      expect(rounds[1].matches.map((match) => match.homeTeam.id)).toEqual(
        rounds[0].matches.map((match) => match.awayTeam.id)
      );
    }

    for (let phaseIndex = 0; phaseIndex <= 4; phaseIndex++) {
      expect(
        championship.matchContainer.rounds.filter((round) => round.phaseIndex === phaseIndex)
      ).toHaveLength(1);
    }
  });
});
