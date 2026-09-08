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

export type PhaseView = {
  isPhased: boolean;
  phaseIndex: number;
  phaseName?: string;
  kind?: 'round-robin' | 'knockout';
  /** Position of the current round within its phase, 1-based. */
  roundInPhase?: number;
  roundsInPhase?: number;
  /** Set for a group stage — one entry per group. */
  groups?: PhaseGroupView[];
  /** Set for a knockout phase — one entry per tie, in bracket order. */
  ties?: PhaseTieView[];
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

function buildTies(matches: Match[], survivors: Set<string>, resolved: boolean): PhaseTieView[] {
  return [...groupMatchesIntoTies(matches).entries()].map(([tieId, legs]) => {
    const first = legs[0];
    const homeTeam = first.homeTeam;
    const awayTeam = first.awayTeam;

    let home = 0;
    let away = 0;
    const legViews: PhaseLegView[] = legs.map((leg) => {
      const played = leg.homeTeamScore > 0 || leg.awayTeamScore > 0 || leg.scorers.length > 0;
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

export function buildPhaseView(championship: Championship): PhaseView {
  const phases = championship.phases;
  if (!phases?.length) return { isPhased: false, phaseIndex: 0 };

  const rounds = championship.matchContainer?.rounds ?? [];
  const currentRoundNumber = championship.matchContainer?.currentRound ?? 1;
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
    if (phase.numberOfGroups > 1) view.groups = buildGroups(matches, championship.standings);
    return view;
  }

  const resolved =
    (championship.currentPhaseIndex ?? 0) > phaseIndex ||
    phaseRounds.every((round) => round.status === 'ended');
  view.ties = buildTies(matches, new Set(championship.survivingTeamIds ?? []), resolved);
  return view;
}

export default buildPhaseView;
