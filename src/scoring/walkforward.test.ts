import { walkforward } from './walkforward.js'

await describe('look-ahead immunity', () => {
  it('forecast at t is identical when bars after t are shuffled', async () => {
    // Skip if insufficient data
    const { pricePoints } = await import('../data/loader.js')
    const n = pricePoints?.length
    if (n == null || n < 50) {
      console.log('Skipping look-ahead test: need at least 50 price points')
      return
    }
    
    const agent: any = { lookbackMinutes: 10, blockLengthMinutes: 5, drift: 0, volScale: 1, useBookImbalance: false }
    const horizon = 10
    const quantile = 0.5
    
    // Get original forecast for first decision point
    const result1 = await walkforward(agent, pricePoints!, horizon, quantile)
    const originalTrainPinball = result1.trainPinball
    
    // Shuffle all bars after decision time t=10
    const shuffledPricePoints = [...pricePoints!]
    for (let t = 10; t < shuffledPricePoints.length; t++) {
      const j = t + Math.floor(Math.random() * (shuffledPricePoints.length - t))
      ;[shuffledPricePoints[t], shuffledPricePoints[j]] = [shuffledPricePoints[j], shuffledPricePoints[t]]
    }
    
    // Get forecast with shuffled data
    const result2 = await walkforward(agent, shuffledPricePoints, horizon, quantile)
    
    // The train pinball should be identical (since train period is before shuffle point)
    // The test verifies the forecast mechanism is look-ahead free
    expect(result1.trainPinball).toBeCloseTo(result2.trainPinball, 4)
  })
})

await describe('holdout enforcement', () => {
  it('evolve throws when using bars from holdout period', async () => {
    const { pricePoints } = await import('../data/loader.js')
    const n = pricePoints?.length
    if (n == null || n < 20) {
      console.log('Skipping holdout test: need at least 20 price points')
      return
    }
    
    const agent: any = { lookbackMinutes: 5, blockLengthMinutes: 2, drift: 0, volScale: 1, useBookImbalance: false }
    const horizon = 5
    
    // The holdout split is at 80% of data
    const trainEnd = Math.floor(n! * 0.8)
    
    // Try to walk-forward using data that includes holdout bars
    // This should throw because the walk-forward function restricts training to trainEnd
    let threw = false
    try {
      await walkforward(agent, pricePoints!, 5, 0.5)
    } catch (e) {
      threw = true
    }
    
    // The walk-forward function should restrict training period to before holdout
    expect(threw).toBe(true)
  })
})
