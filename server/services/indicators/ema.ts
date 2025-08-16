export function ema(values: number[], length: number): number[] {
  const k = 2 / (length + 1);
  const result: number[] = [];
  let prev: number | undefined;
  for (const v of values) {
    prev = prev === undefined ? v : v * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}