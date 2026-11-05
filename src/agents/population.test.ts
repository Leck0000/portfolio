import { gitResetHard, gitCommit } from '../agents/evolution.js'
import { loadAgents, saveAgent } from '../agents/config.js'

describe('mutation revert', () => {
  it('reverts a bad mutation via git reset --hard', async () => {
    // Save the original agent config from disk
    const originalAgent = await loadAgents()
    const originalDrift = originalAgent[0].drift
    const originalWeight = originalAgent[0].weight
    
    // Apply a bad mutation (extreme drift)
    const badAgent = { ...originalAgent[0], drift: 999 }
    await saveAgent(badAgent)
    
    // Commit the bad mutation
    gitCommit('evolve: bad drift mutation')
    
    // The agent config on disk should now have drift: 999
    const afterCommit = await loadAgents()
    expect(afterCommit[0].drift).toBe(999)
    expect(afterCommit[0].weight).toBe(originalWeight)
    
    // Reset hard to revert
    gitResetHard()
    
    // Load agents again and verify they're back to original
    const revertedAgents = await loadAgents()
    expect(revertedAgents[0].drift).toBe(originalDrift)
    expect(revertedAgents[0].weight).toBe(originalWeight)
  })
})
