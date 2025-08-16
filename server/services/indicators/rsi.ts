export function rsi(values: number[], length: number): number[] {
  const result: number[] = [];
  if (values.length === 0) return result;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= length && i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff; else loss -= diff;
  }
  let avgGain = gain / length;
  let avgLoss = loss / length;
  result[length] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = length + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (length - 1) + diff) / length;
      avgLoss = (avgLoss * (length - 1)) / length;
    } else {
      avgGain = (avgGain * (length - 1)) / length;
      avgLoss = (avgLoss * (length - 1) - diff) / length;
    }
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  for (let i = 0; i < length && i < result.length; i++) result[i] = NaN;
  return result;
}