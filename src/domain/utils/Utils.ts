export function getRandomNumber(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

export function getRandomPlayerStrength(teamInitialOverallStrength: number) {
  const min = teamInitialOverallStrength - 5;
  const max = teamInitialOverallStrength + 5;
  return getRandomNumber(min, max);
}
