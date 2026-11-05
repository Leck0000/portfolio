import { describe, it, expect } from 'vitest'
import { pinballLoss, pinballLossArray } from './pinball.js'

describe('pinballLoss', () => {
  it('computes MAE at quantile 0.5', () => {
    expect(pinballLoss(100, 105, 0.5)).toBe(5)
    expect(pinballLoss(105, 100, 0.5)).toBe(5)
    expect(pinballLoss(100, 100, 0.5)).toBe(0)
  })

  it('computes asymmetric loss for other quantiles', () => {
    // quantile 0.1: underprediction penalized less
    expect(pinballLoss(100, 105, 0.1)).toBeCloseTo(0.5)
    expect(pinballLoss(105, 100, 0.1)).toBeCloseTo(4.5)
    
    // quantile 0.9: overprediction penalized less
    expect(pinballLoss(100, 105, 0.9)).toBeCloseTo(4.5)
    expect(pinballLoss(105, 100, 0.9)).toBeCloseTo(0.5)
  })
})

describe('pinballLossArray', () => {
  it('computes average pinball loss', () => {
    const predicted = [100, 100, 100]
    const actual = [105, 95, 100]
    // MAE: (5 + 5 + 0) / 3 = 3.333
    expect(pinballLossArray(predicted, actual, 0.5)).toBeCloseTo(10/3)
  })

  it('throws on length mismatch', () => {
    expect(() => pinballLossArray([1, 2], [1], 0.5)).toThrow()
  })
})
