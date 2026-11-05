import { z } from 'zod'

export const AgentConfigSchema = z.object({
  id: z.string(),
  lookbackMinutes: z.number().int().positive(),
  blockLengthMinutes: z.number().int().positive(),
  drift: z.number(),
  volScale: z.number().positive(),
  useBookImbalance: z.boolean(),
  weight: z.number().positive().default(1.0),
  roundsAtFloor: z.number().int().nonnegative().default(0),
})

export type AgentConfig = z.infer<typeof AgentConfigSchema>

export const EvolutionLogEntrySchema = z.object({
  round: z.number().int().nonnegative(),
  timestamp: z.string(),
  worstAgentId: z.string(),
  mutation: z.string(),
  param: z.string(),
  oldValue: z.union([z.number(), z.boolean()]),
  newValue: z.union([z.number(), z.boolean()]),
  pinballBefore: z.number(),
  pinballAfter: z.number(),
  action: z.enum(['commit', 'reset']),
  commitHash: z.string().nullable(),
})

export type EvolutionLogEntry = z.infer<typeof EvolutionLogEntrySchema>

export const AGENT_PARAMS = ['lookbackMinutes', 'blockLengthMinutes', 'drift', 'volScale', 'useBookImbalance'] as const
export type AgentParam = typeof AGENT_PARAMS[number]
