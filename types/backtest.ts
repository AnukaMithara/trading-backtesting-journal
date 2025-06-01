export interface Backtest {
  _id?: string

  // 1. Trade Identification
  tradeId: string
  entryDateTime: Date
  exitDateTime?: Date
  asset: string
  tradeType: "long" | "short" | "call" | "put"
  broker: string
  accountType: "cash" | "margin" | "demo" | "live"

  // 2. Trade Setup and Strategy
  strategyName: string
  timeframe: string
  setupDescription?: string
  entryTrigger?: string
  indicatorsUsed?: string[]
  fundamentalAnalysis?: string
  chartScreenshot?: string
  marketCondition: "trending" | "ranging" | "volatile" | "low-liquidity"

  // 3. Trade Execution
  entryPrice: number
  exitPrice?: number
  positionSize: number
  orderType: "market" | "limit" | "stop-limit"
  stopLossPrice?: number
  takeProfitPrice?: number
  slippage?: number
  commissionFees?: number
  spread?: number

  // 4. Risk Management
  riskAmount: number
  positionSizingMethod: string
  mae?: number // Maximum Adverse Excursion
  mfe?: number // Maximum Favorable Excursion
  riskNotes?: string

  // 5. Trade Outcome (some calculated)
  profitLoss?: number // Calculated
  profitLossPercentage?: number // Calculated
  winLossStatus?: "win" | "loss" | "breakeven" // Calculated
  holdingPeriod?: number // Calculated (in hours)
  exitReason?: string
  performanceNotes?: string

  // 6. Psychological and Emotional Factors
  preTradeEmotion: "confident" | "anxious" | "hesitant" | "excited" | "calm"
  duringTradeEmotion: "stressed" | "calm" | "overconfident" | "nervous" | "focused"
  postTradeEmotion: "satisfied" | "frustrated" | "regretful" | "proud" | "neutral"
  disciplineLevel: number // 1-10 scale
  mistakesMade?: string
  lessonsLearned?: string

  // 7. Market Context
  economicEvents?: string
  marketSentiment: "bullish" | "bearish" | "neutral"
  volatilityIndex?: number
  sessionTimeOfDay: string
  correlatedAssets?: string

  // 8. Performance Metrics (calculated)
  riskRewardRatio?: number // Calculated
  tradeRating?: number // 1-5 stars

  // 9. Tags and Categorization
  tags: string[]
  assetClass: "stock" | "forex" | "crypto" | "commodity" | "options" | "futures"
  marketSector?: string

  // 10. Notes and Attachments
  tradeNotes?: string
  screenshots?: string[]

  // 11. Portfolio and Account Tracking
  accountBalanceBefore: number
  accountBalanceAfter?: number
  portfolioAllocation?: number

  // System fields
  createdAt?: Date
  updatedAt?: Date
}

export interface BacktestMetrics {
  totalTrades: number
  winRate: number
  totalProfitLoss: number
  averageProfitLoss: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  expectancy: number
  maxDrawdown: number
  winningTrades: number
  losingTrades: number
  largestWin: number
  largestLoss: number
  averageHoldingPeriod: number
  averageRiskReward: number
  totalCommissions: number
  netProfitAfterCommissions: number
}

export interface StrategyPerformance {
  strategy: string
  trades: number
  profitLoss: number
  winRate: number
  averageRiskReward: number
  profitFactor: number
}

export interface EmotionalAnalysis {
  emotion: string
  trades: number
  winRate: number
  averagePL: number
}

export interface AssetClassPerformance {
  assetClass: string
  trades: number
  profitLoss: number
  winRate: number
}

export interface TimeAnalysis {
  timeframe: string
  trades: number
  profitLoss: number
  winRate: number
}

export interface MonthlyPerformance {
  month: string
  profitLoss: number
  trades: number
}
