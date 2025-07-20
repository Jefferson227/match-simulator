export interface Player {
  id: string;
  position: string;
  name: string;
  strength: number;
  mood: number;
  fieldPosition?: {
    row: number;
    column: number;
  };
  order?: number;
}
