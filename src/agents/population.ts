import { AgentConfig } from './schema.js'

export const WEIGHT_FLOOR = 0.3
export const WEIGHT_CAP = 2.5
export const TOP_QUARTILE_MULT = 1.05
export const BOTTOM_QUARTILE_MULT = 0.95
export const EXTINCTION_ROUNDS = 8
export const SPAWN_WEIGHT_STDDEV_THRESHOLD = 0.2

export function updateWeights(agents: AgentConfig[], pinballScores: Map<string, number>): AgentConfig[] {
  const scoredAgents = agents.map(a => ({
    agent: a,
    score: pinballScores.get(a.id) ?? Infinity,
  })).sort((a, b) => a.score - b.score)

  const n = scoredAgents.length
  const q1Idx = Math.floor(n * 0.25)
  const q3Idx = Math.ceil(n * 0.75)

  const updated = agents.map(a => {
    const scored = scoredAgents.find(s => s.agent.id === a.id)
    if (!scored || scored.score === Infinity) return a
    
    const rank = scoredAgents.findIndex(s => s.agent.id === a.id)
    let newWeight = a.weight
    let roundsAtFloor = a.roundsAtFloor

    if (rank < q1Idx) {
      newWeight = Math.min(a.weight * TOP_QUARTILE_MULT, WEIGHT_CAP)
      roundsAtFloor = 0
    } else if (rank >= q3Idx) {
      newWeight = Math.max(a.weight * BOTTOM_QUARTILE_MULT, WEIGHT_FLOOR)
      if (newWeight <= WEIGHT_FLOOR + 1e-9) {
        roundsAtFloor = a.roundsAtFloor + 1
      } else {
        roundsAtFloor = 0
      }
    } else {
      roundsAtFloor = 0
    }

    newWeight = Math.max(WEIGHT_FLOOR, Math.min(WEIGHT_CAP, newWeight))
    return { ...a, weight: newWeight, roundsAtFloor }
  })

  return handleExtinctionAndSpawn(updated)
}

function handleExtinctionAndSpawn(agents: AgentConfig[]): AgentConfig[] {
  const alive = agents.filter(a => a.roundsAtFloor < EXTINCTION_ROUNDS)
  const extinctCount = agents.length - alive.length
  
  if (extinctCount === 0) return alive

  const weights = alive.map(a => a.weight)
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length
  const stddev = Math.sqrt(weights.reduce((a, b) => a + (b - mean) ** 2, 0) / weights.length)
  
  const needsSpawn = stddev < SPAWN_WEIGHT_STDDEV_THRESHOLD || extinctCount > 0
  
  if (!needsSpawn) return alive

  const newAgents: AgentConfig[] = [...alive]
  for (let i = 0; i < extinctCount; i++) {
    const newId = `agent-${Date.now()}-${i}`
    newAgents.push({
      id: newId,
      lookbackMinutes: 1440,
      blockLengthMinutes: 30,
      drift: 0.0,
      volScale: 1.0,
      useBookImbalance: false,
      weight: 1.0,
      roundsAtFloor: 0,
    })
  }
  return newAgents
}

export function computeWeightStats(agents: AgentConfig[]): { mean: number; stddev: number; min: number; max: number } {
  const weights = agents.map(a => a.weight)
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length
  const stddev = Math.sqrt(weights.reduce((a, b) => a + (b - mean) ** 2, 0) / weights.length)
  return { mean, stddev, min: Math.min(...weights), max: Math.max(...weights) }
}
