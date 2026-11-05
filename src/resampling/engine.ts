import { AgentConfig } from '../agents/schema.js'

export interface BookSnapshot {
  bids: [number, number][]
  asks: [number, number][]
}

export interface ResampleResult {
  futures: number[][]
  terminalPrices: number[]
}

function blockBootstrap(
  returns: number[],
  blockLength: number,
  numBlocks: number,
  rng: () => number
): number[] {
  const n = returns.length
  if (n < blockLength) return returns.slice()
  
  const maxStart = n - blockLength
  const result: number[] = []
  
  for (let i = 0; i < numBlocks; i++) {
    const start = Math.floor(rng() * (maxStart + 1))
    result.push(...returns.slice(start, start + blockLength))
  }
  
  return result
}

function computeBookImbalance(book: BookSnapshot): number {
  const bestBid = book.bids[0]
  const bestAsk = book.asks[0]
  if (!bestBid || !bestAsk) return 0
  const bidVol = bestBid[1]
  const askVol = bestAsk[1]
  const total = bidVol + askVol
  if (total === 0) return 0
  return (bidVol - askVol) / total
}

export function resampleFutures(
  prices1min: number[],
  book: BookSnapshot,
  config: AgentConfig,
  horizonMinutes: number = 15,
  numFutures: number = 400
): ResampleResult {
  if (prices1min.length < config.lookbackMinutes) {
    throw new Error(`Insufficient price history: need ${config.lookbackMinutes}, have ${prices1min.length}`)
  }

  const lookbackStart = prices1min.length - config.lookbackMinutes
  const lookbackPrices = prices1min.slice(lookbackStart)
  
  const returns: number[] = []
  for (let i = 1; i < lookbackPrices.length; i++) {
    const prev = lookbackPrices[i - 1]
    const curr = lookbackPrices[i]
    if (prev !== undefined && curr !== undefined) {
      returns.push(Math.log(curr / prev))
    }
  }

  const numBlocks = Math.ceil(horizonMinutes / config.blockLengthMinutes)
  const currentPrice = lookbackPrices[lookbackPrices.length - 1]
  if (currentPrice === undefined) {
    throw new Error('No current price available')
  }
  const imbalance = config.useBookImbalance ? computeBookImbalance(book) : 0
  const imbalanceTilt = imbalance * 0.0001

  const futures: number[][] = []
  const terminalPrices: number[] = []

  for (let f = 0; f < numFutures; f++) {
    const seed = f * 1000 + Date.now()
    let rngState = seed
    const rng = () => {
      rngState = (rngState * 1664525 + 1013904223) % 4294967296
      return rngState / 4294967296
    }

    const bootstrappedReturns = blockBootstrap(returns, config.blockLengthMinutes, numBlocks, rng)
    const horizonReturns = bootstrappedReturns.slice(0, horizonMinutes)

    let price = currentPrice
    const path: number[] = []
    
    for (let h = 0; h < horizonMinutes; h++) {
      const ret = horizonReturns[h] ?? 0
      const scaledRet = ret * config.volScale + config.drift + imbalanceTilt
      price = price * Math.exp(scaledRet)
      path.push(price)
    }

    futures.push(path)
    terminalPrices.push(price)
  }

  return { futures, terminalPrices }
}
