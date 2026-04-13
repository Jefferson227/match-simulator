import FieldArea from '../../enums/FieldArea';
import { MatchAction, RandomProvider } from './types';

export function decideAction(fieldArea: FieldArea, rng: RandomProvider): MatchAction {
  const roll = rng.nextInt(0, 100);

  if (fieldArea === 'defense') {
    if (roll < 60) return 'move';
    if (roll < 99) return 'pass-next';
    return 'shoot';
  }

  if (fieldArea === 'midfield') {
    if (roll < 80) return 'move';
    if (roll < 98) return 'pass-next';
    return 'shoot';
  }

  if (roll < 60) return 'move';
  if (roll < 70) return 'pass-previous';
  return 'shoot';
}
