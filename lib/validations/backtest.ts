import { z } from "zod"

export const backtestSchema = z.object({
  // Trade Identification
  tradeId: z.string().min(1, "Trade ID is required"),
  entryDateTime: z.string().min(1, "Entry date/time is required"),
  exitDateTime: z.string().optional(),
  asset: z.string().min(1, "Asset is required"),
  tradeType: z.enum(["long", "short", "call", "put"]),
  broker: z.string().min(1, "Broker is required"),
  accountType: z.enum(["cash", "margin", "demo", "live"]),

  // Trade Setup and Strategy
  strategyName: z.string().min(1, "Strategy name is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  setupDescription: z.string().optional(),
  entryTrigger: z.string().optional(),
  indicatorsUsed: z.array(z.string()).optional(),
  fundamentalAnalysis: z.string().optional(),
  chartScreenshot: z.string().optional(),
  marketCondition: z.enum(["trending", "ranging", "volatile", "low-liquidity"]),

  // Trade Execution
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive").optional(),
  positionSize: z.number().positive("Position size must be positive"),
  orderType: z.enum(["market", "limit", "stop-limit"]),
  stopLossPrice: z.number().optional(),
  takeProfitPrice: z.number().optional(),
  slippage: z.number().optional(),
  commissionFees: z.number().min(0).optional(),
  spread: z.number().min(0).optional(),

  // Risk Management
  riskAmount: z.number().positive("Risk amount must be positive"),
  positionSizingMethod: z.string().min(1, "Position sizing method is required"),
  mae: z.number().optional(),
  mfe: z.number().optional(),
  riskNotes: z.string().optional(),

  // Trade Outcome
  exitReason: z.string().optional(),
  performanceNotes: z.string().optional(),

  // Psychological Factors
  preTradeEmotion: z.enum(["confident", "anxious", "hesitant", "excited", "calm"]),
  duringTradeEmotion: z.enum(["stressed", "calm", "overconfident", "nervous", "focused"]),
  postTradeEmotion: z.enum(["satisfied", "frustrated", "regretful", "proud", "neutral"]),
  disciplineLevel: z.number().min(1).max(10),
  mistakesMade: z.string().optional(),
  lessonsLearned: z.string().optional(),

  // Market Context
  economicEvents: z.string().optional(),
  marketSentiment: z.enum(["bullish", "bearish", "neutral"]),
  volatilityIndex: z.number().optional(),
  sessionTimeOfDay: z.string().min(1, "Session/time is required"),
  correlatedAssets: z.string().optional(),

  // Performance Metrics
  tradeRating: z.number().min(1).max(5).optional(),

  // Tags and Categorization
  assetClass: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures"]),
  marketSector: z.string().optional(),

  // Notes
  tradeNotes: z.string().optional(),
  screenshots: z.array(z.string()).optional(),

  // Portfolio Tracking
  accountBalanceBefore: z.number().positive("Account balance before must be positive"),
  accountBalanceAfter: z.number().positive().optional(),
  portfolioAllocation: z.number().min(0).max(100).optional(),
})

export const backtestWithTagsSchema = backtestSchema.extend({
  tags: z.array(z.string()).min(1, "At least one tag is required"),
})

export type BacktestFormData = z.infer<typeof backtestSchema>
export type BacktestWithTags = z.infer<typeof backtestWithTagsSchema>
