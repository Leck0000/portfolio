import { execSync } from 'node:child_process'
import { appendFile } from 'node:fs/promises'
import { AgentConfig, AgentParam, EvolutionLogEntry } from './schema.js'

const EVOLUTION_LOG = 'evolution.csv'
const MUTATION_SIGMA = 0.1
const PARAMS: readonly string[] = ['lookbackMinutes', 'blockLengthMinutes', 'drift', 'volScale', 'useBookImbalance']

export function mutateAgent(agent: AgentConfig, param: AgentParam): { agent: AgentConfig; mutation: string; oldValue: number | boolean; newValue: number | boolean } {
  const newAgent = { ...agent }
  let oldValue: number | boolean
  let newValue: number | boolean
  let mutation: string

  switch (param) {
    case 'lookbackMinutes': {
      oldValue = agent.lookbackMinutes
      const delta = Math.round(Math.random() * 60 - 30)
      newValue = Math.max(60, Math.min(10080, agent.lookbackMinutes + delta))
      newAgent.lookbackMinutes = newValue
      mutation = `lookbackMinutes: ${oldValue} -> ${newValue}`
      break
    }
    case 'blockLengthMinutes': {
      oldValue = agent.blockLengthMinutes
      const delta = Math.round(Math.random() * 30 - 15)
      newValue = Math.max(5, Math.min(240, agent.blockLengthMinutes + delta))
      newAgent.blockLengthMinutes = newValue
      mutation = `blockLengthMinutes: ${oldValue} -> ${newValue}`
      break
    }
    case 'drift': {
      oldValue = agent.drift
      newValue = agent.drift + (Math.random() - 0.5) * 2 * MUTATION_SIGMA
      newValue = Math.max(-0.01, Math.min(0.01, newValue))
      newAgent.drift = newValue
      mutation = `drift: ${oldValue.toFixed(6)} -> ${newValue.toFixed(6)}`
      break
    }
    case 'volScale': {
      oldValue = agent.volScale
      newValue = agent.volScale + (Math.random() - 0.5) * 2 * MUTATION_SIGMA
      newValue = Math.max(0.1, Math.min(3.0, newValue))
      newAgent.volScale = newValue
      mutation = `volScale: ${oldValue.toFixed(4)} -> ${newValue.toFixed(4)}`
      break
    }
    case 'useBookImbalance': {
      oldValue = agent.useBookImbalance
      newValue = !agent.useBookImbalance
      newAgent.useBookImbalance = newValue
      mutation = `useBookImbalance: ${oldValue} -> ${newValue}`
      break
    }
  }

  return { agent: newAgent, mutation, oldValue, newValue }
}

export function pickRandomParam(): AgentParam {
  const idx = Math.floor(Math.random() * PARAMS.length)
  return PARAMS[idx] as AgentParam
}

export function getGitCommitHash(): string | null {
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return hash || null
  } catch {
    return null
  }
}

export function gitCommit(message: string): string | null {
  try {
    execSync('git add -A', { stdio: 'ignore' })
    execSync(`git commit -m "${message}"`, { stdio: 'ignore' })
    return getGitCommitHash()
  } catch {
    return null
  }
}

export function gitResetHard(): void {
  try {
    execSync('git reset --hard HEAD', { stdio: 'ignore' })
    execSync('git clean -fd', { stdio: 'ignore' })
  } catch (e) {
    console.error('[Evolution] Git reset failed:', e)
  }
}

export async function logEvolution(entry: EvolutionLogEntry): Promise<void> {
  const fs = await import('node:fs/promises')
  let header = ''
  try {
    await fs.access(EVOLUTION_LOG)
  } catch {
    header = 'round,timestamp,worstAgentId,mutation,param,oldValue,newValue,pinballBefore,pinballAfter,action,commitHash\n'
  }
  const row = `${entry.round},${entry.timestamp},${entry.worstAgentId},"${entry.mutation}",${entry.param},${entry.oldValue},${entry.newValue},${entry.pinballBefore.toFixed(6)},${entry.pinballAfter.toFixed(6)},${entry.action},${entry.commitHash ?? ''}\n`
  await appendFile(EVOLUTION_LOG, header + row, 'utf-8')
}

export async function runEvolutionRound(
  agents: AgentConfig[],
  pinballScores: Map<string, number>,
  scoreAgent: (agent: AgentConfig) => Promise<number>
): Promise<{ agents: AgentConfig[]; logEntry: EvolutionLogEntry }> {
  const scored = Array.from(pinballScores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
  
  const worst = scored[0]
  if (!worst) throw new Error('No agents to evolve')
  
  const worstAgent = agents.find(a => a.id === worst.id)
  if (!worstAgent) throw new Error(`Worst agent ${worst.id} not found`)
  
  const param = pickRandomParam()
  const { agent: mutatedAgent, mutation, oldValue, newValue } = mutateAgent(worstAgent, param)
  
  const newPinball = await scoreAgent(mutatedAgent)
  const improved = newPinball < worst.score
  
  let action: 'commit' | 'reset'
  let commitHash: string | null = null
  let finalAgents: AgentConfig[]
  
  if (improved) {
    action = 'commit'
    commitHash = gitCommit(`evolve: ${mutation} (pinball ${worst.score.toFixed(6)} -> ${newPinball.toFixed(6)})`)
    finalAgents = agents.map(a => a.id === worst.id ? mutatedAgent : a)
  } else {
    action = 'reset'
    gitResetHard()
    finalAgents = agents
  }
  
  const logEntry: EvolutionLogEntry = {
    round: 0,
    timestamp: new Date().toISOString(),
    worstAgentId: worst.id,
    mutation,
    param,
    oldValue,
    newValue,
    pinballBefore: worst.score,
    pinballAfter: newPinball,
    action,
    commitHash,
  }
  
  await logEvolution(logEntry)
  
  return { agents: finalAgents, logEntry }
}
