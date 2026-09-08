/**
 * How a competition is played. Data only — nothing branches on it; the engine plays `phases`.
 * `knockout` is a cup: a bracket with no league table.
 */
type ChampionshipType =
  | 'double-round-robin'
  | 'single-round-robin'
  | 'group-stage-knockout'
  | 'knockout';

export default ChampionshipType;
