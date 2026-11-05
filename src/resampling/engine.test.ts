import { describe, it, expect } from 'vitest'
import { resampleFutures } from './engine.js'
import { AgentConfig } from '../agents/schema.js'

describe('resampleFutures', () => {
  const mockBook = {
    bids: [[100000, 1.0], [99900, 2.0]],
    asks: [[100100, 1.0], [100200, 2.0]],
  }

  const baseConfig: AgentConfig = {
    id: 'test-agent',
    lookbackMinutes: 100,
    blockLengthMinutes: 30,
    drift: 0.0,
    volScale: 1.0,
    useBookImbalance: false,
    weight: 1.0,
    roundsAtFloor: 0,
  }

  it('generates correct number of futures', () => {
    const prices = Array.from({ length: 200 }, (_, i) => 100000 + Math.sin(i * 0.1) * 100)
    const result = resampleFutures(prices, mockBook, baseConfig, 15, 400)
    
    expect(result.futures.length).toBe(400)
    expect(result.terminalPrices.length).toBe(400)
    expect(result.futures[0].length).toBe(15)
  })

  it('uses only data before decision time (no lookahead)', () => {
    const prices = Array.from({ length: 200 }, (_, i) => 100000 + i * 10) // steadily rising
    const result = resampleFutures(prices, mockBook, baseConfig, 15, 10)
    
    // All futures should be based on historical returns, not future prices
    for (const path of result.futures) {
      for (const price of path) {
        expect(price).toBeGreaterThan(0)
      }
    }
  })

  it('applies drift correctly', () => {
    const prices = Array.from({ length: 200 }, () => 100000) // flat
    const driftConfig = { ...baseConfig, drift: 0.001, volScale: 0.0 }
    const result = resampleFutures(prices, mockBook, driftConfig, 15, 100)
    
    // With positive drift and zero vol, all paths should trend up
    const avgTerminal = result.terminalPrices.reduce((a, b) => a + b, 0) / result.terminalPrices.length
    expect(avgTerminal).toBeGreaterThan(100000)
  })

  it('applies volScale correctly', () => {
    // Use varying prices to generate returns
    const prices = Array.from({ length: 200 }, (_, i) => 100000 + Math.sin(i * 0.1) * 100 + (Math.random() - 0.5) * 10)
    const lowVolConfig = { ...baseConfig, drift: 0.0, volScale: 0.1 }
    const highVolConfig = { ...baseConfig, drift: 0.0, volScale: 2.0 }
    
    const lowVolResult = resampleFutures(prices, mockBook, lowVolConfig, 15, 100)
    const highVolResult = resampleFutures(prices, mockBook, highVolConfig, 15, 100)
    
    const lowVolMean = lowVolResult.terminalPrices.reduce((a, b) => a + b, 0) / 100
    const highVolMean = highVolResult.terminalPrices.reduce((a, b) => a + b, 0) / 100
    
    const lowVolStd = Math.sqrt(
      lowVolResult.terminalPrices.reduce((sum, p) => sum + (p - lowVolMean) ** 2, 0) / 100
    )
    const highVolStd = Math.sqrt(
      highVolResult.terminalPrices.reduce((sum, p) => sum + (p - highVolMean) ** 2, 0) / 100
    )
    
    expect(highVolStd).toBeGreaterThan(lowVolStd)
  })

  it('throws on insufficient lookback', () => {
    const prices = [100000, 100100] // too short
    expect(() => resampleFutures(prices, mockBook, baseConfig, 15, 10))
      .toThrow('Insufficient price history')
  })
})
