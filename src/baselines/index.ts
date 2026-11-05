import { AgentConfig } from '../agents/schema.js'
import { BookSnapshot } from '../resampling/engine.js'
import { resampleFutures } from '../resampling/engine.js'
import { pinballLoss } from '../scoring/pinball.js'

export interface BaselineResult {
  name: string
  trainPinball: number
  holdoutPinball: number
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

interface PricePoint {
  timestamp: string
  price: number
  book: BookSnapshot
}

async function scoreBaseline(
  name: string,
  pricePoints: PricePoint[],
  agent: AgentConfig,
  horizonMinutes: number = 15,
  quantile: number = 0.5
): Promise<BaselineResult> {
  const n = pricePoints.length
  if (n < agent.lookbackMinutes + horizonMinutes + 1) {
    throw new Error(`Insufficient data for ${name}`)
  }

  const trainEnd = Math.floor(n * 0.8)
  
  const trainPrices = pricePoints.slice(0, trainEnd).map(p => p.price)
  const trainBooks = pricePoints.slice(0, trainEnd).map(p => p.book)
  
  const holdoutPrices = pricePoints.slice(trainEnd).map(p => p.price)
  const holdoutBooks = pricePoints.slice(trainEnd).map(p => p.book)

  const trainLosses: number[] = []
  for (let t = agent.lookbackMinutes; t < trainEnd - horizonMinutes; t++) {
    const currentPrices = trainPrices.slice(0, t + 1)
    const currentBook = trainBooks[t]
    const actualFuturePrice = trainPrices[t + horizonMinutes]
    
    if (!currentBook || actualFuturePrice === undefined) continue
    
    const { terminalPrices } = resampleFutures(currentPrices, currentBook, agent, horizonMinutes, 400)
    const predicted = median(terminalPrices)
    trainLosses.push(pinballLoss(predicted, actualFuturePrice, quantile))
  }

  const holdoutLosses: number[] = []
  for (let t = 0; t < holdoutPrices.length - horizonMinutes; t++) {
    const fullHistoryPrices = [...trainPrices, ...holdoutPrices.slice(0, t + 1)]
    const currentBook = holdoutBooks[t]
    const actualFuturePrice = holdoutPrices[t + horizonMinutes]
    
    if (!currentBook || actualFuturePrice === undefined) continue
    
    const { terminalPrices } = resampleFutures(fullHistoryPrices, currentBook, agent, horizonMinutes, 400)
    const predicted = median(terminalPrices)
    holdoutLosses.push(pinballLoss(predicted, actualFuturePrice, quantile))
  }

  return {
    name,
    trainPinball: trainLosses.length > 0 ? trainLosses.reduce((a, b) => a + b, 0) / trainLosses.length : Infinity,
    holdoutPinball: holdoutLosses.length > 0 ? holdoutLosses.reduce((a, b) => a + b, 0) / holdoutLosses.length : Infinity,
  }
}

export function createZeroDriftAgent(): AgentConfig {
  return {
    id: 'baseline-zero-drift',
    lookbackMinutes: 1440,
    blockLengthMinutes: 30,
    drift: 0.0,
    volScale: 1.0,
    useBookImbalance: false,
    weight: 1.0,
    roundsAtFloor: 0,
  }
}

export function createRandomChangeAgent(): AgentConfig {
  return {
    id: 'baseline-random-change',
    lookbackMinutes: 1440,
    blockLengthMinutes: 30,
    drift: 0.0,
    volScale: 1.0,
    useBookImbalance: false,
    weight: 1.0,
    roundsAtFloor: 0,
  }
}

export async function scoreAllBaselines(
  pricePoints: PricePoint[],
  horizonMinutes: number = 15
): Promise<BaselineResult[]> {
  const zeroDrift = createZeroDriftAgent()
  const randomChange = createRandomChangeAgent()
  
  const [zeroResult, randomResult] = await Promise.all([
    scoreBaseline('zero-drift', pricePoints, zeroDrift, horizonMinutes),
    scoreBaseline('random-change', pricePoints, randomChange, horizonMinutes),
  ])
  
  return [zeroResult, randomResult]
}
