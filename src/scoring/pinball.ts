export function pinballLoss(predicted: number, actual: number, quantile: number = 0.5): number {
  const diff = actual - predicted
  if (quantile === 0.5) {
    return Math.abs(diff)
  }
  return diff >= 0 ? quantile * diff : (quantile - 1) * diff
}

export function pinballLossArray(predicted: number[], actual: number[], quantile: number = 0.5): number {
  if (predicted.length !== actual.length) {
    throw new Error('Predicted and actual arrays must have same length')
  }
  let sum = 0
  for (let i = 0; i < predicted.length; i++) {
    const p = predicted[i]
    const a = actual[i]
    if (p !== undefined && a !== undefined) {
      sum += pinballLoss(p, a, quantile)
    }
  }
  return sum / predicted.length
}
