import { z } from 'zod'

export const TradeMessageSchema = z.object({
  price: z.number(),
  volume: z.number(),
  time: z.number(),
  side: z.enum(['buy', 'sell']),
  orderType: z.string(),
  misc: z.string(),
})

export type TradeMessage = z.infer<typeof TradeMessageSchema>

export const BookLevelSchema = z.tuple([z.number(), z.number()])
export type BookLevel = z.infer<typeof BookLevelSchema>

export const BookSnapshotSchema = z.object({
  bids: z.array(BookLevelSchema),
  asks: z.array(BookLevelSchema),
})
export type BookSnapshot = z.infer<typeof BookSnapshotSchema>

export const BookUpdateSchema = z.object({
  bids: z.array(BookLevelSchema).optional(),
  asks: z.array(BookLevelSchema).optional(),
})
export type BookUpdate = z.infer<typeof BookUpdateSchema>

export const CollectorRecordSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('book'),
    t: z.string(),
    bids: z.array(BookLevelSchema),
    asks: z.array(BookLevelSchema),
  }),
  z.object({
    type: z.literal('trade'),
    t: z.string(),
    price: z.number(),
    vol: z.number(),
    side: z.enum(['buy', 'sell']),
    id: z.string(),
  }),
])
export type CollectorRecord = z.infer<typeof CollectorRecordSchema>

export const MAX_LEVELS = 300
