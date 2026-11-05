import { ForecastResult } from './mixer.js'
import { AgentConfig } from '../agents/schema.js'
import { PricePoint } from '../data/loader.js'

export function generateForecastSVG(
  forecast: ForecastResult,
  pricePoints: PricePoint[],
  agents: AgentConfig[],
  horizonMinutes: number = 15,
  width: number = 1200,
  height: number = 800
): string {
  const margin = { top: 50, right: 50, bottom: 50, left: 80 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  
  const allPrices = [
    ...pricePoints.slice(-100).map(p => p.price),
    ...forecast.mixedTerminalPrices,
    ...Array.from(forecast.survivorFutures.values()).flatMap(f => f.map(p => p[p.length - 1])),
  ]
  const validPrices = allPrices.filter((p): p is number => p !== undefined)
  if (validPrices.length === 0) throw new Error('No valid prices for plot')
  
  const minPrice = Math.min(...validPrices) * 0.999
  const maxPrice = Math.max(...validPrices) * 1.001
  const priceRange = maxPrice - minPrice
  
  const xScale = (i: number) => margin.left + (i / Math.max(1, horizonMinutes - 1)) * plotWidth
  const yScale = (price: number) => margin.top + plotHeight - ((price - minPrice) / priceRange) * plotHeight
  
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${width}" height="${height}" fill="#1a1a2e"/>`
  
  svg += `<text x="${width / 2}" y="30" text-anchor="middle" fill="#e0e0e0" font-family="monospace" font-size="16">`
  svg += `BTC/USD Forecast - ${now} UTC - Horizon: ${horizonMinutes}min - Share > NOW: ${(forecast.shareAboveNow * 100).toFixed(1)}%`
  svg += `</text>`
  
  svg += `<text x="${width / 2}" y="50" text-anchor="middle" fill="#a0a0a0" font-family="monospace" font-size="12">`
  svg += `Current Mid: $${forecast.currentPrice.toFixed(2)} | Survivors: ${forecast.survivorFutures.size}`
  svg += `</text>`
  
  const gridColor = '#333'
  const axisColor = '#666'
  const textColor = '#888'
  
  for (let i = 0; i <= 5; i++) {
    const y = margin.top + (i / 5) * plotHeight
    const price = maxPrice - (i / 5) * priceRange
    svg += `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${gridColor}" stroke-width="0.5"/>`
    svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="${textColor}" font-family="monospace" font-size="10">$${price.toFixed(0)}</text>`
  }
  
  for (let i = 0; i <= horizonMinutes; i += 5) {
    const x = xScale(i)
    svg += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" stroke="${gridColor}" stroke-width="0.5"/>`
    svg += `<text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" fill="${textColor}" font-family="monospace" font-size="10">+${i}min</text>`
  }
  
  svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="${axisColor}" stroke-width="1"/>`
  svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="${axisColor}" stroke-width="1"/>`
  
  const historicalPrices = pricePoints.slice(-60).map(p => p.price)
  const historicalPath = historicalPrices.map((p, i) => {
    const x = margin.left - 60 + (i / Math.max(1, historicalPrices.length - 1)) * 60
    return `${x},${yScale(p)}`
  }).join(' ')
  svg += `<polyline fill="none" stroke="#4a90d9" stroke-width="2" points="${historicalPath}" opacity="0.8"/>`
  const lastHistPrice = historicalPrices[historicalPrices.length - 1]
  if (lastHistPrice !== undefined) {
    svg += `<text x="${margin.left - 70}" y="${yScale(lastHistPrice) + 4}" text-anchor="end" fill="#4a90d9" font-family="monospace" font-size="10">Recent</text>`
  }
  
  const currentY = yScale(forecast.currentPrice)
  svg += `<line x1="${margin.left}" y1="${currentY}" x2="${width - margin.right}" y2="${currentY}" stroke="#ffd700" stroke-width="2" stroke-dasharray="5,5"/>`
  svg += `<text x="${margin.left - 10}" y="${currentY - 5}" text-anchor="end" fill="#ffd700" font-family="monospace" font-size="10">NOW</text>`
  
  const colors = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db', '#e91e63']
  
  let colorIdx = 0
  for (const [agentId, futures] of forecast.survivorFutures) {
    const agent = agents.find(a => a.id === agentId)
    const weight = agent?.weight ?? 1.0
    const color = colors[colorIdx % colors.length]
    colorIdx++
    
    for (const future of futures.slice(0, 50)) {
      const path = future.map((p, i) => `${xScale(i)},${yScale(p)}`).join(' ')
      svg += `<polyline fill="none" stroke="${color}" stroke-width="0.5" points="${path}" opacity="0.15"/>`
    }
    
    const medianPath = futures.map(p => {
      const sorted = [...p].sort((a, b) => a - b)
      return sorted[Math.floor(sorted.length / 2)] ?? 0
    }).map((p, i) => `${xScale(i)},${yScale(p)}`).join(' ')
    svg += `<polyline fill="none" stroke="${color}" stroke-width="2" points="${medianPath}" opacity="0.7"/>`
    
    const firstFuture = futures[0]
    if (firstFuture) {
      const sorted = [...firstFuture].sort((a, b) => a - b)
      const lastMedian = sorted[Math.floor(sorted.length / 2)] ?? 0
      svg += `<text x="${width - margin.right + 10}" y="${yScale(lastMedian)}" text-anchor="start" fill="${color}" font-family="monospace" font-size="10">${agentId} (w=${weight.toFixed(2)})</text>`
    }
  }
  
  const mixedSorted = [...forecast.mixedTerminalPrices].sort((a, b) => a - b)
  const mixedPath = mixedSorted.map((p, i) => {
    const x = margin.left + plotWidth + 20 + (i / Math.max(1, mixedSorted.length)) * 80
    return `${x},${yScale(p)}`
  }).join(' ')
  svg += `<polyline fill="none" stroke="#ffffff" stroke-width="3" points="${mixedPath}" opacity="0.9"/>`
  svg += `<text x="${width - margin.right + 110}" y="${margin.top + 20}" text-anchor="start" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold">MIXED</text>`
  
  svg += `</svg>`
  return svg
}
