import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CollectorRecord } from '../collector/types.js'
import { BookSnapshot } from '../resampling/engine.js'

export interface PricePoint {
  timestamp: string
  price: number
  book: BookSnapshot
}

export async function loadCollectorData(dataDir: string = 'data'): Promise<PricePoint[]> {
  const fs = await import('node:fs/promises')
  let files: string[]
  try {
    files = await fs.readdir(dataDir)
  } catch {
    return []
  }
  
  const jsonlFiles = files.filter(f => f.endsWith('.jsonl')).sort()
  const records: CollectorRecord[] = []
  
  for (const file of jsonlFiles) {
    const content = await readFile(join(dataDir, file), 'utf-8')
    const lines = content.trim().split('\n')
    for (const line of lines) {
      if (line.trim()) {
        records.push(JSON.parse(line))
      }
    }
  }
  
  return processRecords(records)
}

function processRecords(records: CollectorRecord[]): PricePoint[] {
  const bookRecords = records.filter(r => r.type === 'book')
  const pricePoints: PricePoint[] = []
  
  for (const bookRec of bookRecords) {
    const bestBid = bookRec.bids[0]
    const bestAsk = bookRec.asks[0]
    if (!bestBid || !bestAsk) continue
    const midPrice = (bestBid[0] + bestAsk[0]) / 2
    if (midPrice > 0) {
      const book: BookSnapshot = { bids: bookRec.bids, asks: bookRec.asks }
      pricePoints.push({
        timestamp: bookRec.t,
        price: midPrice,
        book,
      })
    }
  }
  
  return pricePoints
}

export function resampleTo1Minute(pricePoints: PricePoint[]): PricePoint[] {
  if (pricePoints.length === 0) return []
  
  const minuteMap = new Map<string, PricePoint[]>()
  
  for (const p of pricePoints) {
    const minute = p.timestamp.slice(0, 16) + ':00.000Z'
    const existing = minuteMap.get(minute) ?? []
    existing.push(p)
    minuteMap.set(minute, existing)
  }
  
  const result: PricePoint[] = []
  for (const [minute, points] of minuteMap) {
    const last = points[points.length - 1]
    if (last) {
      result.push({ ...last, timestamp: minute })
    }
  }
  
  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}
