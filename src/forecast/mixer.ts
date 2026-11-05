import { AgentConfig } from '../agents/schema.js'
import { BookSnapshot } from '../resampling/engine.js'
import { resampleFutures } from '../resampling/engine.js'
import { PricePoint } from '../data/loader.js'

export interface ForecastResult {
  mixedTerminalPrices: number[]
  shareAboveNow: number
  currentPrice: number
  survivorFutures: Map<string, number[][]>
}

export function mixFutures(
  agents: AgentConfig[],
  pricePoints: PricePoint[],
  horizonMinutes: number = 15,
  numMixedFutures: number = 1000
): ForecastResult {
  const survivors = agents.filter(a => a.weight > 0)
  if (survivors.length === 0) {
    throw new Error('No survivors to mix')
  }
  
  const currentPricePoints = pricePoints[pricePoints.length - 1]
  if (!currentPricePoints) {
    throw new Error('No current price data')
  }
  
  const currentPrice = currentPricePoints.price
  const currentBook = currentPricePoints.book
  
  const allFutures: number[] = []
  const survivorFutures = new Map<string, number[][]>()
  const totalWeight = survivors.reduce((sum, a) => sum + a.weight, 0)
  
  for (const agent of survivors) {
    const { terminalPrices, futures } = resampleFutures(
      pricePoints.map(p => p.price),
      currentBook,
      agent,
      horizonMinutes,
      400
    )
    survivorFutures.set(agent.id, futures)
    
    const weight = agent.weight / totalWeight
    const numFromAgent = Math.round(numMixedFutures * weight)
    
    for (let i = 0; i < numFromAgent; i++) {
      const idx = Math.floor(Math.random() * terminalPrices.length)
      const price = terminalPrices[idx]
      if (price !== undefined) {
        allFutures.push(price)
      }
    }
  }
  
  while (allFutures.length < numMixedFutures) {
    const idx = Math.floor(Math.random() * allFutures.length)
    const price = allFutures[idx]
    if (price !== undefined) {
      allFutures.push(price)
    }
  }
  
  const shareAboveNow = allFutures.filter(p => p > currentPrice).length / allFutures.length
  
  return {
    mixedTerminalPrices: allFutures.slice(0, numMixedFutures),
    shareAboveNow,
    currentPrice,
    survivorFutures,
  }
}
