import Match from '../../models/Match';
import FieldArea from '../../enums/FieldArea';
import MatchSimulationState from '../../models/MatchSimulationState';
import PossessionTeam from '../../enums/PossessionTeam';

export type MatchAction = 'move' | 'pass-next' | 'pass-previous' | 'shoot';

export type RandomProvider = {
  nextInt: (min: number, max: number) => number;
};

export type MatchActionContext = {
  minute: number;
  rng: RandomProvider;
};

export type MatchActionResult = {
  match: Match;
  simulation: MatchSimulationState;
};

export type MatchActionStrategy = (
  match: Match,
  simulation: MatchSimulationState,
  context: MatchActionContext
) => MatchActionResult;

export type MatchTickState = {
  possessionTeam: PossessionTeam;
  fieldArea: FieldArea;
};
