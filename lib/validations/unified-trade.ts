import { z } from "zod"

export const unifiedTradeSchema = z.object({
  // Basic Trade Information
  tradeId: z.string().min(1, "Trade ID is required").trim(),
  entryTime: z.string().min(1, "Entry time is required"),
  exitTime: z.string().optional().nullable(),

  // Trade Execution
  entryType: z.enum(["market", "limit", "stop", "stop-limit"]),
  type: z.enum(["long", "short"]),
  entry: z.number().positive("Entry price must be positive"),
  close: z.number().positive("Close price must be positive").optional().nullable(),
  timeFrame: z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"]),

  // Risk Management
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  leverage: z.number().min(1).max(1000).default(1),
  exitLogic: z.enum(["loss-exit", "profit-exit", "tsl-hit", "tp-hit", "sl-hit", "manual", "other"]).optional(),

  // Financial Metrics
  netPL: z.number().optional().nullable(),
  roi: z.number().optional().nullable(),

  // Strategy & Management
  moneyManagement: z.string().optional().nullable(),
  risk: z.enum(["very-low", "low", "medium", "high", "very-high"]),
  setup: z.string().min(1, "Setup description is required").trim(),

  // Psychology
  preMarketMentality: z.enum(["confident", "anxious", "excited", "calm", "uncertain", "focused"]),
  postMarketMentality: z.enum(["satisfied", "disappointed", "relieved", "frustrated", "proud", "regretful", "neutral"]),

  // Additional Information
  asset: z.string().min(1, "Asset is required").trim(),
  broker: z.string().min(1, "Broker is required").trim(),
  reportLinks: z.array(z.string().url()).optional().default([]),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
})

export type UnifiedTradeFormData = z.infer<typeof unifiedTradeSchema>
