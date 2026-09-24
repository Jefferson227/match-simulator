type Coach = {
  name: string;
  age: number;
  // ISO 3166-1 alpha-3, primary first; absent when the source does not give one.
  nationalities?: string[];
};

export default Coach;
