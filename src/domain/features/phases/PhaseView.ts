/**
 * A read model of the phase a championship is currently playing, for the UI.
 *
 * The screens need to know three things the raw `Championship` does not say directly: which phase is
 * being played, how the field is split into groups during a group stage, and how the ties of a
 * knockout phase stand. All of it is derived from the stored fixtures, so nothing extra is kept on
 * the championship.
 */
import { Championship } from '../../models/Championship';
import Match from '../../models/Match';
import PenaltyShootout from '../../models/PenaltyShootout';
import Round from '../../models/Round';
import Standing from '../../models/Standing';
import { Team } from '../../models/Team';
import { rankStandings } from '../standings/StandingsComparator';
import { groupMatchesIntoTies } from './TieResolution';

export type PhaseGroupView = {
  /** Zero-based, as stored on the match. Screens usually show `group + 1`. */
  group: number;
  standings: Standing[];
};

export type PhaseLegView = {
  leg: number;
  homeTeam: Team;
  awayTeam: Team;
  homeTeamScore: number;
  awayTeamScore: number;
  played: boolean;
};

export type PhaseTieView = {
  tieId: string;
  /** The clubs of the tie, in first-leg home/away order. */
  homeTeam: Team;
  awayTeam: Team;
  legs: PhaseLegView[];
  /** Goals across every played leg, from the first leg's home and away sides. */
  aggregate: { home: number; away: number };
  shootout?: PenaltyShootout;
  /** Set only once the phase has been resolved. */
  winnerTeamId?: Team['id'];
};

/**
 * Which round decides the phase shown.
 * - `current-round` — the round about to be, or being, played.
 * - `last-ended-round` — the round most recently played. A results screen wants this: the last round
 *   of a phase resolves it and generates the next one, so the current round already belongs to a
 *   phase nobody has played yet.
 */
export type PhaseViewFocus = 'current-round' | 'last-ended-round';

export type PhaseViewOptions = {
  /** Absent means `current-round`. */
  focus?: PhaseViewFocus;
};

export type PhaseView = {
  isPhased: boolean;
  phaseIndex: number;
  phaseName?: string;
  kind?: 'round-robin' | 'knockout';
  /** Position of the current round within its phase, 1-based. */
  roundInPhase?: number;
  roundsInPhase?: number;
  /**
   * The table of a round-robin phase: the live standings while it is played, the kept table once a
   * later phase has reset them. Absent for a knockout phase.
   */
  standings?: Standing[];
  /** Set for a group stage — one entry per group. */
  groups?: PhaseGroupView[];
  /** Set for a knockout phase — one entry per tie of its own bracket, in bracket order. */
  ties?: PhaseTieView[];
  /**
   * The playoff played in this phase's rounds, kept apart from its bracket: Série D's promotion
   * playoff is not a semifinal (REC D 2026 Art. 21). Absent when the phase hosts none.
   */
  playoff?: { name: string; ties: PhaseTieView[] };
};

function roundsOfPhase(rounds: Round[], phaseIndex: number): Round[] {
  return rounds.filter((round) => round.phaseIndex === phaseIndex);
}

function buildGroups(matches: Match[], standings: Standing[]): PhaseGroupView[] {
  const groupOfTeam = new Map<string, number>();
  for (const match of matches) {
    if (match.group === undefined) continue;
    groupOfTeam.set(match.homeTeam.id, match.group);
    groupOfTeam.set(match.awayTeam.id, match.group);
  }

  if (!groupOfTeam.size) return [];

  const byGroup = new Map<number, Standing[]>();
  for (const standing of standings) {
    const group = groupOfTeam.get(standing.team.id);
    if (group === undefined) continue;
    byGroup.set(group, [...(byGroup.get(group) ?? []), standing]);
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a - b)
    .map(([group, groupStandings]) => ({ group, standings: rankStandings(groupStandings) }));
}

function buildTies(
  rounds: Round[],
  survivors: Set<string>,
  resolved: boolean,
  bracket?: Match['bracket']
): PhaseTieView[] {
  // A leg is played once its round has started. Its score cannot tell: a goalless leg has the same
  // score as one not played yet. Match ids are not unique under test, so legs are tracked by object.
  const playedLegs = new Set(
    rounds.filter((round) => round.status !== 'not-started').flatMap((round) => round.matches)
  );
  const matches = rounds
    .flatMap((round) => round.matches)
    .filter((match) => match.bracket === bracket);

  return [...groupMatchesIntoTies(matches).entries()].map(([tieId, legs]) => {
    const first = legs[0];
    const homeTeam = first.homeTeam;
    const awayTeam = first.awayTeam;

    let home = 0;
    let away = 0;
    const legViews: PhaseLegView[] = legs.map((leg) => {
      const played = playedLegs.has(leg);
      if (leg.homeTeam.id === homeTeam.id) {
        home += leg.homeTeamScore;
        away += leg.awayTeamScore;
      } else {
        home += leg.awayTeamScore;
        away += leg.homeTeamScore;
      }

      return {
        leg: leg.leg ?? 1,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        homeTeamScore: leg.homeTeamScore,
        awayTeamScore: leg.awayTeamScore,
        played,
      };
    });

    const shootout = legs.find((leg) => leg.penaltyShootout)?.penaltyShootout;
    const winnerTeamId = resolved
      ? survivors.has(homeTeam.id)
        ? homeTeam.id
        : survivors.has(awayTeam.id)
          ? awayTeam.id
          : undefined
      : undefined;

    return {
      tieId,
      homeTeam,
      awayTeam,
      legs: legViews,
      aggregate: { home, away },
      shootout,
      winnerTeamId,
    };
  });
}

/** The last round played, or `undefined` before any has ended. */
function lastEndedRound(rounds: Round[]): Round | undefined {
  return rounds.reduce<Round | undefined>(
    (last, round) =>
      round.status === 'ended' && (!last || round.number > last.number) ? round : last,
    undefined
  );
}

export function buildPhaseView(
  championship: Championship,
  options: PhaseViewOptions = {}
): PhaseView {
  const phases = championship.phases;
  if (!phases?.length) return { isPhased: false, phaseIndex: 0 };

  const rounds = championship.matchContainer?.rounds ?? [];
  const focusedRound = options.focus === 'last-ended-round' ? lastEndedRound(rounds) : undefined;
  const currentRoundNumber = focusedRound?.number ?? championship.matchContainer?.currentRound ?? 1;
  const currentRound = rounds.find((round) => round.number === currentRoundNumber);

  const phaseIndex =
    currentRound?.phaseIndex ?? championship.currentPhaseIndex ?? phases.length - 1;
  const phase = phases[phaseIndex];
  if (!phase) return { isPhased: false, phaseIndex: 0 };

  const phaseRounds = roundsOfPhase(rounds, phaseIndex);
  const matches = phaseRounds.flatMap((round) => round.matches);
  const positionInPhase = phaseRounds.findIndex((round) => round.number === currentRoundNumber);

  const view: PhaseView = {
    isPhased: true,
    phaseIndex,
    phaseName: phase.name,
    kind: phase.kind,
    roundInPhase: positionInPhase >= 0 ? positionInPhase + 1 : phaseRounds.length,
    roundsInPhase: phaseRounds.length,
  };

  if (phase.kind === 'round-robin') {
    // Once a later phase is generated the live standings hold only its field, at zero.
    const standings =
      phaseIndex < (championship.currentPhaseIndex ?? 0)
        ? (championship.phaseStandings?.[phaseIndex] ?? championship.standings)
        : championship.standings;
    view.standings = standings;
    if (phase.numberOfGroups > 1) view.groups = buildGroups(matches, standings);
    return view;
  }

  const resolved =
    (championship.currentPhaseIndex ?? 0) > phaseIndex ||
    phaseRounds.every((round) => round.status === 'ended');
  view.ties = buildTies(phaseRounds, new Set(championship.survivingTeamIds ?? []), resolved);

  if (phase.playoff && matches.some((match) => match.bracket === 'playoff')) {
    // Playoff winners advance nowhere, so they are never survivors; they are kept apart.
    const playoffWinners = new Set(championship.playoffWinnerIds ?? []);
    view.playoff = {
      name: phase.playoff.name,
      ties: buildTies(phaseRounds, playoffWinners, resolved, 'playoff'),
    };
  }
  return view;
}

export default buildPhaseView;
