import { z } from "zod"

export const backtestSchema = z.object({
  // Trade Identification
  tradeId: z.string().min(1, "Trade ID is required").trim(),
  entryDateTime: z.string().min(1, "Entry date/time is required"),
  exitDateTime: z.string().optional().nullable(),
  asset: z.string().min(1, "Asset is required").trim(),
  tradeType: z.enum(["long", "short", "call", "put"]),
  broker: z.string().min(1, "Broker is required").trim(),
  accountType: z.enum(["cash", "margin", "demo", "live"]),

  // Trade Setup and Strategy
  strategyName: z.string().min(1, "Strategy name is required").trim(),
  timeframe: z.string().min(1, "Timeframe is required").trim(),
  setupDescription: z.string().optional().nullable(),
  entryTrigger: z.string().optional().nullable(),
  indicatorsUsed: z.array(z.string()).optional().default([]),
  fundamentalAnalysis: z.string().optional().nullable(),
  chartScreenshot: z.string().optional().nullable(),
  marketCondition: z.enum(["trending", "ranging", "volatile", "low-liquidity"]),

  // Trade Execution
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive").optional().nullable(),
  positionSize: z.number().positive("Position size must be positive"),
  orderType: z.enum(["market", "limit", "stop-limit"]),
  stopLossPrice: z.number().optional().nullable(),
  takeProfitPrice: z.number().optional().nullable(),
  slippage: z.number().optional().nullable(),
  commissionFees: z.number().min(0).optional().nullable(),
  spread: z.number().min(0).optional().nullable(),

  // Risk Management
  riskAmount: z.number().positive("Risk amount must be positive"),
  positionSizingMethod: z.string().min(1, "Position sizing method is required").trim(),
  mae: z.number().optional().nullable(),
  mfe: z.number().optional().nullable(),
  riskNotes: z.string().optional().nullable(),

  // Trade Outcome
  exitReason: z.string().optional().nullable(),
  performanceNotes: z.string().optional().nullable(),

  // Psychological Factors
  preTradeEmotion: z.enum(["confident", "anxious", "hesitant", "excited", "calm"]),
  duringTradeEmotion: z.enum(["stressed", "calm", "overconfident", "nervous", "focused"]),
  postTradeEmotion: z.enum(["satisfied", "frustrated", "regretful", "proud", "neutral"]),
  disciplineLevel: z.number().min(1).max(10),
  mistakesMade: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),

  // Market Context
  economicEvents: z.string().optional().nullable(),
  marketSentiment: z.enum(["bullish", "bearish", "neutral"]),
  volatilityIndex: z.number().optional().nullable(),
  sessionTimeOfDay: z.string().min(1, "Session/time is required").trim(),
  correlatedAssets: z.string().optional().nullable(),

  // Performance Metrics
  tradeRating: z.number().min(1).max(5).optional().nullable(),

  // Tags and Categorization
  assetClass: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures"]),
  marketSector: z.string().optional().nullable(),

  // Notes
  tradeNotes: z.string().optional().nullable(),
  screenshots: z.array(z.string()).optional().default([]),

  // Portfolio Tracking
  accountBalanceBefore: z.number().positive("Account balance before must be positive"),
  accountBalanceAfter: z.number().positive().optional().nullable(),
  portfolioAllocation: z.number().min(0).max(100).optional().nullable(),
})

export const backtestWithTagsSchema = backtestSchema.extend({
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
})

export type BacktestFormData = z.infer<typeof backtestSchema>
export type BacktestWithTags = z.infer<typeof backtestWithTagsSchema>
