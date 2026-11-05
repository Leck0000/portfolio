import { describe, it, expect } from 'vitest'
import { updateWeights, WEIGHT_FLOOR, WEIGHT_CAP, EXTINCTION_ROUNDS } from './population.js'
import { AgentConfig } from './schema.js'

describe('updateWeights', () => {
  const baseAgents: AgentConfig[] = [
    { id: 'a1', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a2', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a3', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a4', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a5', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a6', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a7', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
    { id: 'a8', lookbackMinutes: 100, blockLengthMinutes: 10, drift: 0, volScale: 1, useBookImbalance: false, weight: 1.0, roundsAtFloor: 0 },
  ]

  it('increases top quartile weight, decreases bottom quartile', () => {
    const scores = new Map([
      ['a1', 1.0],  // best
      ['a2', 2.0],
      ['a3', 3.0],
      ['a4', 4.0],
      ['a5', 5.0],
      ['a6', 6.0],
      ['a7', 7.0],
      ['a8', 8.0],  // worst
    ])
    
    const updated = updateWeights(baseAgents, scores)
    
    // a1, a2 are top quartile (25% of 8 = 2) -> weight * 1.05
    expect(updated.find(a => a.id === 'a1')?.weight).toBeCloseTo(1.05)
    expect(updated.find(a => a.id === 'a2')?.weight).toBeCloseTo(1.05)
    
    // a7, a8 are bottom quartile -> weight * 0.95
    expect(updated.find(a => a.id === 'a7')?.weight).toBeCloseTo(0.95)
    expect(updated.find(a => a.id === 'a8')?.weight).toBeCloseTo(0.95)
    
    // middle unchanged
    expect(updated.find(a => a.id === 'a4')?.weight).toBe(1.0)
  })

  it('clamps weight at floor and cap', () => {
    const agentsAtFloor: AgentConfig[] = baseAgents.map(a => ({ ...a, weight: WEIGHT_FLOOR }))
    const scores = new Map(agentsAtFloor.map((a, i) => [a.id, i + 1]))
    
    const updated = updateWeights(agentsAtFloor, scores)
    
    // Bottom quartile should not go below floor
    for (const a of updated) {
      expect(a.weight).toBeGreaterThanOrEqual(WEIGHT_FLOOR)
      expect(a.weight).toBeLessThanOrEqual(WEIGHT_CAP)
    }
  })

  it('increments roundsAtFloor for agents at floor', () => {
    const agentsAtFloor: AgentConfig[] = baseAgents.map(a => ({ ...a, weight: WEIGHT_FLOOR, roundsAtFloor: 0 }))
    const scores = new Map(agentsAtFloor.map((a, i) => [a.id, i + 1]))
    
    const updated = updateWeights(agentsAtFloor, scores)
    
    // Bottom 2 should have roundsAtFloor = 1
    const bottom = updated.filter(a => scores.get(a.id)! >= 7)
    for (const a of bottom) {
      expect(a.roundsAtFloor).toBe(1)
    }
    
    // Top should have roundsAtFloor = 0
    const top = updated.filter(a => scores.get(a.id)! <= 2)
    for (const a of top) {
      expect(a.roundsAtFloor).toBe(0)
    }
  })

  it('extinguishes agents at floor for 8 rounds and spawns replacements', () => {
    const agentsAtFloor: AgentConfig[] = baseAgents.map(a => ({ ...a, weight: WEIGHT_FLOOR, roundsAtFloor: EXTINCTION_ROUNDS }))
    const scores = new Map(agentsAtFloor.map((a, i) => [a.id, i + 1]))
    
    const updated = updateWeights(agentsAtFloor, scores)
    
    // Population size should remain 8 (extinct replaced by spawns)
    expect(updated.length).toBe(8)
    
    // Original bottom quartile agents (a7, a8 with scores 7,8) should be extinct
    // New agents should have different IDs
    const originalIds = new Set(['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'])
    const survivingOriginal = updated.filter(a => originalIds.has(a.id))
    // At least a7 and a8 should be gone
    expect(survivingOriginal.length).toBeLessThan(8)
    
    // New agents should have weight 1.0 and roundsAtFloor 0
    const newAgents = updated.filter(a => !originalIds.has(a.id))
    for (const a of newAgents) {
      expect(a.weight).toBe(1.0)
      expect(a.roundsAtFloor).toBe(0)
    }
  })
})
