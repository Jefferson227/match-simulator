import Match from './Match';
import RoundStatus from '../enums/RoundStatus';

type Round = {
  id: string;
  number: number;
  matches: Match[];
  status: RoundStatus;
  /** Index into `Championship.phases`. Absent for an unphased championship. */
  phaseIndex?: number;
  /** Display name of the phase, as the regulation spells it, e.g. '1ª Fase'. */
  phaseName?: string;
  /**
   * Group this round belongs to, zero-based. Only set when a round belongs to a single group;
   * a group stage merges every group's round *n* into one round, so there the group lives on
   * each `Match` instead.
   */
  group?: number;
};

export default Round;
