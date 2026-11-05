import { AgentConfig } from '../agents/schema.js'
import { BookSnapshot } from '../resampling/engine.js'
import { resampleFutures } from '../resampling/engine.js'
import { pinballLoss } from './pinball.js'

export interface WalkForwardResult {
  trainPinball: number
  holdoutPinball: number
  trainFutures: number[][]
  holdoutFutures: number[][]
  trainTerminalPrices: number[]
  holdoutTerminalPrices: number[]
}

export interface PricePoint {
  timestamp: string
  price: number
  book: BookSnapshot
}

export async function scoreWalkForward(
  agent: AgentConfig,
  pricePoints: PricePoint[],
  horizonMinutes: number = 15,
  quantile: number = 0.5
): Promise<WalkForwardResult> {
  const n = pricePoints.length
  if (n < agent.lookbackMinutes + horizonMinutes + 1) {
    throw new Error(`Insufficient data: need ${agent.lookbackMinutes + horizonMinutes + 1}, have ${n}`)
  }

  const trainEnd = Math.floor(n * 0.8)
  const holdoutStart = trainEnd
  
  const trainPrices = pricePoints.slice(0, trainEnd).map(p => p.price)
  const trainBooks = pricePoints.slice(0, trainEnd).map(p => p.book)
  
  const holdoutPrices = pricePoints.slice(holdoutStart).map(p => p.price)
  const holdoutBooks = pricePoints.slice(holdoutStart).map(p => p.book)

  const trainLosses: number[] = []
  const trainTerminals: number[] = []
  const trainFutures: number[][] = []

  for (let t = agent.lookbackMinutes; t < trainEnd - horizonMinutes; t++) {
    const currentPrices = trainPrices.slice(0, t + 1)
    const currentBook = trainBooks[t]
    const actualFuturePrice = trainPrices[t + horizonMinutes]
    
    if (!currentBook || actualFuturePrice === undefined) continue
    
    const { terminalPrices } = resampleFutures(currentPrices, currentBook, agent, horizonMinutes, 400)
    const medianPredicted = median(terminalPrices)
    
    trainLosses.push(pinballLoss(medianPredicted, actualFuturePrice, quantile))
    trainTerminals.push(medianPredicted)
    trainFutures.push(terminalPrices)
  }

  const trainPinball = trainLosses.length > 0 
    ? trainLosses.reduce((a, b) => a + b, 0) / trainLosses.length 
    : Infinity

  const holdoutLosses: number[] = []
  const holdoutTerminals: number[] = []
  const holdoutFutures: number[][] = []

  for (let t = 0; t < holdoutPrices.length - horizonMinutes; t++) {
    const fullHistoryPrices = [...trainPrices, ...holdoutPrices.slice(0, t + 1)]
    const currentBook = holdoutBooks[t]
    const actualFuturePrice = holdoutPrices[t + horizonMinutes]
    
    if (!currentBook || actualFuturePrice === undefined) continue
    
    const { terminalPrices } = resampleFutures(fullHistoryPrices, currentBook, agent, horizonMinutes, 400)
    const medianPredicted = median(terminalPrices)
    
    holdoutLosses.push(pinballLoss(medianPredicted, actualFuturePrice, quantile))
    holdoutTerminals.push(medianPredicted)
    holdoutFutures.push(terminalPrices)
  }

  const holdoutPinball = holdoutLosses.length > 0
    ? holdoutLosses.reduce((a, b) => a + b, 0) / holdoutLosses.length
    : Infinity

  return {
    trainPinball,
    holdoutPinball,
    trainFutures,
    holdoutFutures,
    trainTerminalPrices: trainTerminals,
    holdoutTerminalPrices: holdoutTerminals,
  }
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const a = sorted[mid - 1]
  const b = sorted[mid]
  return sorted.length % 2 === 0
    ? ((a ?? 0) + (b ?? 0)) / 2
    : (b ?? 0)
}
