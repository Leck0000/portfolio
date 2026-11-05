import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { AgentConfig, AgentConfigSchema } from './schema.js'

const AGENTS_DIR = 'agents'

export async function loadAgents(): Promise<AgentConfig[]> {
  const fs = await import('node:fs/promises')
  let files: string[]
  try {
    files = await fs.readdir(AGENTS_DIR)
  } catch {
    return []
  }
  
  const agents: AgentConfig[] = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const path = join(AGENTS_DIR, file)
    const content = await readFile(path, 'utf-8')
    const parsed = JSON.parse(content)
    const result = AgentConfigSchema.safeParse(parsed)
    if (result.success) {
      agents.push(result.data)
    } else {
      console.error(`[Agent] Invalid config in ${file}:`, result.error.flatten())
    }
  }
  return agents
}

export async function saveAgent(agent: AgentConfig): Promise<void> {
  await mkdir(AGENTS_DIR, { recursive: true })
  const path = join(AGENTS_DIR, `${agent.id}.json`)
  await writeFile(path, JSON.stringify(agent, null, 2), 'utf-8')
}

export async function saveAllAgents(agents: AgentConfig[]): Promise<void> {
  await mkdir(AGENTS_DIR, { recursive: true })
  for (const agent of agents) {
    await saveAgent(agent)
  }
}

export function createInitialAgents(count: number = 8): AgentConfig[] {
  const baseParams = [
    { lookbackMinutes: 1440, blockLengthMinutes: 30, drift: 0.0, volScale: 1.0, useBookImbalance: false },
    { lookbackMinutes: 720, blockLengthMinutes: 60, drift: 0.0001, volScale: 1.1, useBookImbalance: false },
    { lookbackMinutes: 2880, blockLengthMinutes: 15, drift: -0.0001, volScale: 0.9, useBookImbalance: true },
    { lookbackMinutes: 1440, blockLengthMinutes: 60, drift: 0.0002, volScale: 1.2, useBookImbalance: true },
    { lookbackMinutes: 480, blockLengthMinutes: 30, drift: 0.0, volScale: 0.8, useBookImbalance: false },
    { lookbackMinutes: 10080, blockLengthMinutes: 120, drift: 0.00005, volScale: 1.0, useBookImbalance: false },
    { lookbackMinutes: 1440, blockLengthMinutes: 45, drift: -0.0002, volScale: 1.15, useBookImbalance: true },
    { lookbackMinutes: 2880, blockLengthMinutes: 30, drift: 0.00015, volScale: 0.85, useBookImbalance: false },
  ]
  
  return baseParams.slice(0, count).map((p, i) => ({
    id: `agent-${i}`,
    ...p,
    weight: 1.0,
    roundsAtFloor: 0,
  }))
}
