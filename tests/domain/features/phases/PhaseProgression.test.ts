import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import Round from '../../../../src/domain/models/Round';
import { Team } from '../../../../src/domain/models/Team';
import { createMatches } from '../../../../src/domain/features/fixture-generation/FixtureGenerator';
import { initialisePhaseState } from '../../../../src/domain/features/phases/PhaseProgression';
import championshipsJSON from '../../../../src/infrastructure/data/championships.json';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

/** A deterministic rng: a fixed cycle, so a shootout always resolves the same way. */
function stubRng(sequence: number[] = [0, 1]): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      const value = sequence[index % sequence.length];
      index += 1;
      return min + (value % (max - min + 1));
    },
  };
}

function buildTeam(index: number): Team {
  return {
    id: `team-${String(index).padStart(3, '0')}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${String(index).padStart(3, '0')}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function phasesOf(internalName: string): ChampionshipPhase[] {
  const record = (
    championshipsJSON as { internalName: string; phases?: ChampionshipPhase[] }[]
  ).find((entry) => entry.internalName === internalName);
  if (!record?.phases) throw new Error(`No phases seeded for ${internalName}`);
  return record.phases;
}

function buildPhasedChampionship(internalName: string, teamCount: number): Championship {
  const teams = Array.from({ length: teamCount }, (_, index) => buildTeam(index + 1));
  const phases = phasesOf(internalName);

  return initialisePhaseState({
    id: internalName,
    name: internalName,
    internalName,
    numberOfTeams: teamCount,
    teams,
    standings: teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
    matchContainer: createMatches(teams, phases),
    type: 'single-round-robin',
    leagueType: 'womens',
    hasTeamControlledByHuman: false,
    phases,
    isPromotable: false,
    isRelegatable: false,
  });
}

function currentRound(championship: Championship): Round | undefined {
  return championship.matchContainer.rounds.find(
    (round) => round.number === championship.matchContainer.currentRound
  );
}

/**
 * Plays the current round. `favouredIndex` decides the winner deterministically: the club whose
 * index in the team list is lower always wins, so results are reproducible and no tie is level.
 */
function playCurrentRound(container: ChampionshipContainer, level = false): ChampionshipContainer {
  const started = ChampionshipService.startRoundForAllChampionships(container);
  if (!started.succeeded) throw new Error(started.error?.message);

  const championship = started.getResult().playableChampionship;
  const round = currentRound(championship);
  if (!round) throw new Error(`No round ${championship.matchContainer.currentRound}`);

  const rounds = championship.matchContainer.rounds.map((existing) =>
    existing.number !== round.number
      ? existing
      : {
          ...existing,
          matches: existing.matches.map((match) => {
            if (level) return { ...match, homeTeamScore: 1, awayTeamScore: 1 };
            const homeWins = match.homeTeam.id < match.awayTeam.id;
            return {
              ...match,
              homeTeamScore: homeWins ? 2 : 0,
              awayTeamScore: homeWins ? 0 : 2,
            };
          }),
        }
  );

  const withScores: ChampionshipContainer = {
    ...started.getResult(),
    playableChampionship: {
      ...championship,
      matchContainer: { ...championship.matchContainer, rounds },
    },
  };

  const ended = ChampionshipService.endRoundForAllChampionships(withScores, { rng: stubRng() });
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult();
}

function playSeason(internalName: string, teamCount: number, level = false) {
  let container: ChampionshipContainer = {
    playableChampionship: buildPhasedChampionship(internalName, teamCount),
  };

  const snapshots: Championship[] = [container.playableChampionship];
  for (let guard = 0; guard < 200; guard++) {
    const matchContainer = container.playableChampionship.matchContainer;
    if (matchContainer.currentRound > matchContainer.totalRounds) break;
    container = playCurrentRound(container, level);
    snapshots.push(container.playableChampionship);
  }

  return { championship: container.playableChampionship, snapshots };
}

describe('phase progression — Brasileirão Feminino A1 (18 clubs, 4 phases)', () => {
  const { championship, snapshots } = playSeason('brasileirao-feminino-serie-a1', 18);

  it('plays 17 first-phase rounds then appends the quarter-finals', () => {
    const afterFirstPhase = snapshots[17];

    expect(afterFirstPhase.currentPhaseIndex).toBe(1);
    expect(afterFirstPhase.matchContainer.totalRounds).toBe(19);
    expect(afterFirstPhase.matchContainer.currentRound).toBe(18);
  });

  it('reaches the final and stops there', () => {
    // 17 league rounds + 2 per knockout phase × 3 phases.
    expect(championship.matchContainer.totalRounds).toBe(17 + 6);
    expect(championship.currentPhaseIndex).toBe(3);
    expect(championship.phases![3].name).toBe('Final');
  });

  it('halves the survivors at every knockout phase', () => {
    const survivorsAt = (phaseIndex: number) =>
      snapshots.find((snapshot) => snapshot.currentPhaseIndex === phaseIndex)!.survivingTeamIds!;

    expect(survivorsAt(1)).toHaveLength(8);
    expect(survivorsAt(2)).toHaveLength(4);
    expect(survivorsAt(3)).toHaveLength(2);
  });

  it('zeroes the standings at every phase boundary', () => {
    for (let phaseIndex = 1; phaseIndex <= 3; phaseIndex++) {
      const atBoundary = snapshots.find((snapshot) => snapshot.currentPhaseIndex === phaseIndex)!;
      expect(atBoundary.standings.every((standing) => standing.points === 0)).toBe(true);
      expect(atBoundary.standings.every((standing) => standing.goalsFor === 0)).toBe(true);
      expect(atBoundary.standings).toHaveLength(atBoundary.survivingTeamIds!.length);
    }
  });

  it('preserves the 1ª Fase table to the end of the season', () => {
    const firstPhase = championship.firstPhaseStandings!;

    expect(firstPhase).toHaveLength(18);
    expect(firstPhase[0].points).toBeGreaterThan(0);
    expect(firstPhase).toEqual(snapshots[17].firstPhaseStandings);
  });

  it('records who played each phase, so promotion can read the semifinalists', () => {
    expect(championship.phaseParticipants!.map((phase) => phase.length)).toEqual([18, 8, 4, 2]);
  });

  it('accumulates points across every phase', () => {
    const accumulated = championship.accumulatedStandings!;

    expect(accumulated).toHaveLength(18);
    // The club that won every league game leads on accumulated points.
    expect(accumulated[0].points).toBeGreaterThan(accumulated[17].points);
  });

  it('gives every knockout phase two rounds with home and away reversed', () => {
    const knockoutRounds = championship.matchContainer.rounds.filter(
      (round) => (round.phaseIndex ?? 0) > 0
    );

    expect(knockoutRounds).toHaveLength(6);
    for (let i = 0; i < knockoutRounds.length; i += 2) {
      const [first, second] = [knockoutRounds[i], knockoutRounds[i + 1]];
      expect(second.matches.map((match) => match.homeTeam.id)).toEqual(
        first.matches.map((match) => match.awayTeam.id)
      );
    }
  });
});

describe('phase progression — Brasileirão Feminino A2 (16 clubs, 4 phases)', () => {
  const { championship, snapshots } = playSeason('brasileirao-feminino-serie-a2', 16);

  it('plays 15 first-phase rounds then the knockouts', () => {
    expect(snapshots[15].currentPhaseIndex).toBe(1);
    expect(championship.matchContainer.totalRounds).toBe(15 + 6);
  });

  it('crowns one champion and keeps a 16-club 1ª Fase table', () => {
    // After the final resolves, the survivor list holds the champion alone.
    expect(championship.survivingTeamIds).toHaveLength(1);
    expect(championship.firstPhaseStandings).toHaveLength(16);
    expect(championship.phaseParticipants!.map((phase) => phase.length)).toEqual([16, 8, 4, 2]);
  });
});

describe('phase progression — Brasileirão Feminino A3 (32 clubs, 8 groups, 5 phases)', () => {
  const { championship, snapshots } = playSeason('brasileirao-feminino-serie-a3', 32);

  it('plays 6 group rounds, not 62', () => {
    const groupRounds = championship.matchContainer.rounds.filter(
      (round) => round.phaseIndex === 0
    );

    expect(groupRounds).toHaveLength(6);
    expect(groupRounds.flatMap((round) => round.matches)).toHaveLength(96);
  });

  it('takes the top two of each of the eight groups into the round of 16', () => {
    const afterGroups = snapshots[6];

    expect(afterGroups.currentPhaseIndex).toBe(1);
    expect(afterGroups.survivingTeamIds).toHaveLength(16);
  });

  it('reaches the final over 6 + 8 rounds', () => {
    expect(championship.matchContainer.totalRounds).toBe(6 + 8);
    expect(championship.currentPhaseIndex).toBe(4);
    expect(championship.phaseParticipants!.map((phase) => phase.length)).toEqual([32, 16, 8, 4, 2]);
  });

  it('never pairs two clubs from the same group in the round of 16', () => {
    const groupOf = new Map<string, number>();
    for (const round of championship.matchContainer.rounds) {
      if (round.phaseIndex !== 0) continue;
      for (const match of round.matches) {
        groupOf.set(match.homeTeam.id, match.group!);
        groupOf.set(match.awayTeam.id, match.group!);
      }
    }

    const roundOf16 = championship.matchContainer.rounds.filter((round) => round.phaseIndex === 1);
    for (const match of roundOf16.flatMap((round) => round.matches)) {
      expect(groupOf.get(match.homeTeam.id)).not.toBe(groupOf.get(match.awayTeam.id));
    }
  });
});

describe('phase progression — level ties', () => {
  it('resolves a knockout phase where every leg is drawn, through the injected rng', () => {
    const { championship } = playSeason('brasileirao-feminino-serie-a1', 18, true);

    expect(championship.currentPhaseIndex).toBe(3);
    expect(championship.survivingTeamIds).toHaveLength(1);

    const shootouts = championship.matchContainer.rounds
      .flatMap((round) => round.matches)
      .filter((match) => match.penaltyShootout);

    // Every tie was level on points and goal difference, so all 7 went to penalties.
    expect(shootouts).toHaveLength(7);
    for (const match of shootouts) {
      expect(match.homeTeamScore).toBe(1);
      expect(match.awayTeamScore).toBe(1);
      expect(match.penaltyShootout!.homeScore).not.toBe(match.penaltyShootout!.awayScore);
    }
  });
});

describe('phase progression — unphased championships', () => {
  it('leaves an unphased championship without any phase state', () => {
    const teams = Array.from({ length: 20 }, (_, index) => buildTeam(index + 1));
    const championship = initialisePhaseState({
      teams,
      matchContainer: createMatches(teams),
    } as unknown as Championship);

    expect(championship.currentPhaseIndex).toBeUndefined();
    expect(championship.survivingTeamIds).toBeUndefined();
    expect(championship.accumulatedStandings).toBeUndefined();
  });
});
