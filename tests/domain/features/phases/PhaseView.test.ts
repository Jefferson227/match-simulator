import { describe, expect, it } from '@jest/globals';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import { buildPhaseView, PhaseTieView } from '../../../../src/domain/features/phases/PhaseView';
import {
  buildChampionship,
  inPhase,
  lowerNumberWins,
  number,
  playRound,
  playUntil,
  Script,
} from '../../../support/phasedSeasonHarness';

const final: ChampionshipPhase = {
  kind: 'knockout',
  name: 'Final',
  numberOfTies: 1,
  legs: 2,
  secondLegHost: 'accumulated-points',
  tiebreakers: ['goal-difference', 'penalties'],
};

const semiFinalThenFinal: ChampionshipPhase[] = [
  {
    kind: 'knockout',
    name: 'Semifinal',
    numberOfTies: 2,
    legs: 2,
    secondLegHost: 'drawn',
    tiebreakers: ['goal-difference', 'penalties'],
  },
  final,
];

const groupsThenFinal: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 2,
    teamsPerGroup: 2,
    legs: 1,
    advancingPerGroup: 1,
  },
  {
    ...final,
    crossings: {
      from: 'group-position',
      pairs: [
        [
          { group: 0, position: 1 },
          { group: 1, position: 1 },
        ],
      ],
    },
  },
];

/** Every first leg of the semi-finals ends goalless; everything else follows club number. */
const goallessFirstLegs: Script = (match, phaseIndex) =>
  phaseIndex === 0 && match.leg === 1 ? [0, 0] : lowerNumberWins(match, phaseIndex);

describe('buildPhaseView — a knockout leg', () => {
  const afterFirstLeg = playRound(buildChampionship(4, semiFinalThenFinal), goallessFirstLegs);

  it('counts a goalless leg as played once its round has been played', () => {
    const ties = buildPhaseView(afterFirstLeg).ties ?? [];

    expect(ties).toHaveLength(2);
    for (const tie of ties) {
      expect(tie.legs[0]).toMatchObject({ played: true, homeTeamScore: 0, awayTeamScore: 0 });
    }
  });

  it('does not count a leg as played before its round has started', () => {
    const ties = buildPhaseView(afterFirstLeg).ties ?? [];

    for (const tie of ties) expect(tie.legs[1].played).toBe(false);
  });
});

describe('buildPhaseView — focusing the last ended round', () => {
  const fresh = buildChampionship(4, semiFinalThenFinal);
  const atFinal = playUntil(fresh, goallessFirstLegs, inPhase(1));

  it('by default shows the phase of the current round — the final just generated', () => {
    expect(buildPhaseView(atFinal)).toMatchObject({ phaseIndex: 1, phaseName: 'Final' });
  });

  it('shows the semi-final just finished, not the final its resolution generated', () => {
    const view = buildPhaseView(atFinal, { focus: 'last-ended-round' });

    expect(view).toMatchObject({
      isPhased: true,
      phaseIndex: 0,
      phaseName: 'Semifinal',
      kind: 'knockout',
      roundInPhase: 2,
      roundsInPhase: 2,
    });
    expect(view.ties).toHaveLength(2);
  });

  it('shows every leg of the finished phase as played, with its winner', () => {
    const ties = buildPhaseView(atFinal, { focus: 'last-ended-round' }).ties ?? [];

    for (const tie of ties) {
      expect(tie.legs.map((leg) => leg.played)).toEqual([true, true]);
      const lowerNumbered =
        number(tie.homeTeam) < number(tie.awayTeam) ? tie.homeTeam : tie.awayTeam;
      expect(tie.winnerTeamId).toBe(lowerNumbered.id);
    }
  });

  it('falls back to the current round before any round has ended', () => {
    expect(buildPhaseView(fresh, { focus: 'last-ended-round' })).toMatchObject({
      phaseIndex: 0,
      phaseName: 'Semifinal',
      roundInPhase: 1,
    });
  });

  it('shows the final once the season is over', () => {
    const over = playUntil(atFinal, lowerNumberWins);

    expect(buildPhaseView(over, { focus: 'last-ended-round' })).toMatchObject({
      phaseIndex: 1,
      phaseName: 'Final',
    });
  });
});

describe('buildPhaseView — a finished group stage', () => {
  const atFinal = playUntil(buildChampionship(4, groupsThenFinal), lowerNumberWins, inPhase(1));

  it('builds the groups from the kept phase table, not the standings reset for the final', () => {
    const view = buildPhaseView(atFinal, { focus: 'last-ended-round' });

    expect(view).toMatchObject({ phaseIndex: 0, phaseName: '1ª Fase', kind: 'round-robin' });
    expect(view.groups?.map((group) => group.standings.map((row) => number(row.team)))).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(view.groups?.map((group) => group.standings[0].points)).toEqual([3, 3]);
  });

  it('exposes the kept phase table as the standings of the finished phase', () => {
    const view = buildPhaseView(atFinal, { focus: 'last-ended-round' });

    expect(view.standings).toHaveLength(4);
    expect(view.standings).toEqual(atFinal.phaseStandings?.[0]);
  });

  it('exposes the live standings for the round-robin phase being played', () => {
    const inGroups = buildChampionship(4, groupsThenFinal);

    expect(buildPhaseView(inGroups).standings).toBe(inGroups.standings);
  });

  it('exposes no standings for a knockout phase', () => {
    expect(buildPhaseView(atFinal).standings).toBeUndefined();
  });
});

describe('buildPhaseView — a semifinal hosting a playoff (REC D 2026 Art. 21)', () => {
  // Quartas among 8 → a semifinal whose playoff takes the 4 losers → final. Under
  // `lowerNumberWins` the Quartas send 1, 4, 2, 3 on, and 5, 6, 7, 8 into the playoff.
  const withPlayoff: ChampionshipPhase[] = [
    {
      kind: 'knockout',
      name: 'Quartas',
      numberOfTies: 4,
      legs: 2,
      secondLegHost: 'higher-seed',
      tiebreakers: ['goal-difference', 'penalties'],
    },
    {
      kind: 'knockout',
      name: 'Semifinal',
      numberOfTies: 2,
      legs: 2,
      secondLegHost: 'higher-seed',
      tiebreakers: ['goal-difference', 'penalties'],
      playoff: {
        name: 'Playoffs',
        from: 'previous-phase-losers',
        pairs: [
          [1, 4],
          [2, 3],
        ],
        secondLegHost: 'higher-seed',
        tiebreakers: ['goal-difference', 'seed'],
      },
    },
    final,
  ];
  const inSemifinal = playUntil(buildChampionship(8, withPlayoff), lowerNumberWins, inPhase(1));
  const clubsOf = (ties: PhaseTieView[]) =>
    ties.map((tie) => [number(tie.homeTeam), number(tie.awayTeam)].sort());

  it('keeps the playoff out of the semifinal’s ties', () => {
    const view = buildPhaseView(inSemifinal);

    expect(view.phaseName).toBe('Semifinal');
    expect(clubsOf(view.ties!)).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });

  it('shows the playoff as its own named block', () => {
    const view = buildPhaseView(inSemifinal);

    expect(view.playoff?.name).toBe('Playoffs');
    expect(clubsOf(view.playoff!.ties)).toEqual([
      [5, 8],
      [6, 7],
    ]);
  });

  it('marks the playoff winners once the semifinal is resolved', () => {
    const resolved = playUntil(inSemifinal, lowerNumberWins, inPhase(2));
    const view = buildPhaseView(resolved, { focus: 'last-ended-round' });

    expect(view.playoff!.ties.map((tie) => tie.winnerTeamId)).toEqual(['team-005', 'team-006']);
    expect(view.ties!.map((tie) => tie.winnerTeamId)).toEqual(['team-001', 'team-002']);
  });

  it('shows no playoff block for a phase that hosts none', () => {
    expect(buildPhaseView(playUntil(inSemifinal, lowerNumberWins, inPhase(2))).playoff).toBe(
      undefined
    );
  });
});
