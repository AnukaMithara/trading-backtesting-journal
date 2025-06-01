// Simple profit/loss calculation (for backward compatibility)
export function calculateProfitLoss(entry: number, exit: number, positionSize: number): number {
  return (exit - entry) * positionSize
}

// Monthly performance calculation (for backward compatibility)
export interface MonthlyPerformance {
  month: string
  profitLoss: number
  trades: number
}

export function calculateMonthlyPerformance(backtests: Backtest[]): MonthlyPerformance[] {
  const monthlyData: { [key: string]: { profitLoss: number; trades: number } } = {}

  backtests.forEach((trade) => {
    const date = new Date(trade.entryDateTime)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { profitLoss: 0, trades: 0 }
    }

    monthlyData[monthKey].profitLoss += trade.profitLoss || 0
    monthlyData[monthKey].trades += 1
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      profitLoss: data.profitLoss,
      trades: data.trades,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

import type {
  Backtest,
  BacktestMetrics,
  StrategyPerformance,
  EmotionalAnalysis,
  AssetClassPerformance,
  TimeAnalysis,
} from "@/types/backtest"

export function calculateTradeMetrics(backtest: Partial<Backtest>): Partial<Backtest> {
  const calculated: Partial<Backtest> = { ...backtest }

  // Calculate P&L
  if (backtest.entryPrice && backtest.exitPrice && backtest.positionSize) {
    const priceDiff = backtest.exitPrice - backtest.entryPrice
    const multiplier = backtest.tradeType === "short" ? -1 : 1
    calculated.profitLoss = priceDiff * multiplier * backtest.positionSize

    // Subtract commissions if provided
    if (backtest.commissionFees) {
      calculated.profitLoss -= backtest.commissionFees
    }
  }

  // Calculate P&L Percentage
  if (calculated.profitLoss && backtest.accountBalanceBefore) {
    calculated.profitLossPercentage = (calculated.profitLoss / backtest.accountBalanceBefore) * 100
  }

  // Determine Win/Loss Status
  if (calculated.profitLoss !== undefined) {
    if (calculated.profitLoss > 0) {
      calculated.winLossStatus = "win"
    } else if (calculated.profitLoss < 0) {
      calculated.winLossStatus = "loss"
    } else {
      calculated.winLossStatus = "breakeven"
    }
  }

  // Calculate Holding Period (in hours)
  if (backtest.entryDateTime && backtest.exitDateTime) {
    const entryTime = new Date(backtest.entryDateTime).getTime()
    const exitTime = new Date(backtest.exitDateTime).getTime()
    calculated.holdingPeriod = (exitTime - entryTime) / (1000 * 60 * 60) // Convert to hours
  }

  // Calculate Risk-Reward Ratio
  if (backtest.entryPrice && backtest.stopLossPrice && backtest.takeProfitPrice) {
    const risk = Math.abs(backtest.entryPrice - backtest.stopLossPrice)
    const reward = Math.abs(backtest.takeProfitPrice - backtest.entryPrice)
    if (risk > 0) {
      calculated.riskRewardRatio = reward / risk
    }
  }

  // Calculate Account Balance After (if not provided)
  if (backtest.accountBalanceBefore && calculated.profitLoss && !backtest.accountBalanceAfter) {
    calculated.accountBalanceAfter = backtest.accountBalanceBefore + calculated.profitLoss
  }

  return calculated
}

export function calculateMetrics(backtests: Backtest[]): BacktestMetrics {
  if (backtests.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalProfitLoss: 0,
      averageProfitLoss: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      maxDrawdown: 0,
      winningTrades: 0,
      losingTrades: 0,
      largestWin: 0,
      largestLoss: 0,
      averageHoldingPeriod: 0,
      averageRiskReward: 0,
      totalCommissions: 0,
      netProfitAfterCommissions: 0,
    }
  }

  const totalTrades = backtests.length
  const winningTrades = backtests.filter((trade) => (trade.profitLoss || 0) > 0)
  const losingTrades = backtests.filter((trade) => (trade.profitLoss || 0) < 0)

  const winRate = (winningTrades.length / totalTrades) * 100
  const totalProfitLoss = backtests.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
  const averageProfitLoss = totalProfitLoss / totalTrades

  const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0))

  const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0

  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Number.POSITIVE_INFINITY : 0
  const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss

  const largestWin = Math.max(...backtests.map((trade) => trade.profitLoss || 0))
  const largestLoss = Math.min(...backtests.map((trade) => trade.profitLoss || 0))

  // Calculate average holding period
  const tradesWithHoldingPeriod = backtests.filter((trade) => trade.holdingPeriod !== undefined)
  const averageHoldingPeriod =
    tradesWithHoldingPeriod.length > 0
      ? tradesWithHoldingPeriod.reduce((sum, trade) => sum + (trade.holdingPeriod || 0), 0) /
        tradesWithHoldingPeriod.length
      : 0

  // Calculate average risk-reward ratio
  const tradesWithRR = backtests.filter((trade) => trade.riskRewardRatio !== undefined)
  const averageRiskReward =
    tradesWithRR.length > 0
      ? tradesWithRR.reduce((sum, trade) => sum + (trade.riskRewardRatio || 0), 0) / tradesWithRR.length
      : 0

  // Calculate total commissions
  const totalCommissions = backtests.reduce((sum, trade) => sum + (trade.commissionFees || 0), 0)
  const netProfitAfterCommissions = totalProfitLoss - totalCommissions

  // Calculate max drawdown
  let runningTotal = 0
  let peak = 0
  let maxDrawdown = 0

  for (const trade of backtests.sort(
    (a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime(),
  )) {
    runningTotal += trade.profitLoss || 0
    if (runningTotal > peak) {
      peak = runningTotal
    }
    const drawdown = peak - runningTotal
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return {
    totalTrades,
    winRate,
    totalProfitLoss,
    averageProfitLoss,
    averageWin,
    averageLoss,
    profitFactor,
    expectancy,
    maxDrawdown,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    largestWin,
    largestLoss,
    averageHoldingPeriod,
    averageRiskReward,
    totalCommissions,
    netProfitAfterCommissions,
  }
}

export function calculateStrategyPerformance(backtests: Backtest[]): StrategyPerformance[] {
  const strategyData: { [key: string]: { profitLoss: number; trades: number; wins: number; riskReward: number[] } } = {}

  backtests.forEach((trade) => {
    if (!strategyData[trade.strategyName]) {
      strategyData[trade.strategyName] = { profitLoss: 0, trades: 0, wins: 0, riskReward: [] }
    }

    strategyData[trade.strategyName].profitLoss += trade.profitLoss || 0
    strategyData[trade.strategyName].trades += 1
    if ((trade.profitLoss || 0) > 0) {
      strategyData[trade.strategyName].wins += 1
    }
    if (trade.riskRewardRatio) {
      strategyData[trade.strategyName].riskReward.push(trade.riskRewardRatio)
    }
  })

  return Object.entries(strategyData).map(([strategy, data]) => {
    const winRate = (data.wins / data.trades) * 100
    const averageRiskReward =
      data.riskReward.length > 0 ? data.riskReward.reduce((sum, rr) => sum + rr, 0) / data.riskReward.length : 0

    const wins = data.profitLoss > 0 ? data.profitLoss : 0
    const losses = data.profitLoss < 0 ? Math.abs(data.profitLoss) : 0
    const profitFactor = losses > 0 ? wins / losses : wins > 0 ? Number.POSITIVE_INFINITY : 0

    return {
      strategy,
      trades: data.trades,
      profitLoss: data.profitLoss,
      winRate,
      averageRiskReward,
      profitFactor,
    }
  })
}

export function calculateEmotionalAnalysis(backtests: Backtest[]): EmotionalAnalysis[] {
  const emotions = ["confident", "anxious", "hesitant", "excited", "calm"]

  return emotions.map((emotion) => {
    const emotionTrades = backtests.filter((trade) => trade.preTradeEmotion === emotion)
    const wins = emotionTrades.filter((trade) => (trade.profitLoss || 0) > 0).length
    const winRate = emotionTrades.length > 0 ? (wins / emotionTrades.length) * 100 : 0
    const averagePL =
      emotionTrades.length > 0
        ? emotionTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / emotionTrades.length
        : 0

    return {
      emotion,
      trades: emotionTrades.length,
      winRate,
      averagePL,
    }
  })
}

export function calculateAssetClassPerformance(backtests: Backtest[]): AssetClassPerformance[] {
  const assetClasses = ["stock", "forex", "crypto", "commodity", "options", "futures"]

  return assetClasses
    .map((assetClass) => {
      const classTrades = backtests.filter((trade) => trade.assetClass === assetClass)
      const wins = classTrades.filter((trade) => (trade.profitLoss || 0) > 0).length
      const winRate = classTrades.length > 0 ? (wins / classTrades.length) * 100 : 0
      const profitLoss = classTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)

      return {
        assetClass,
        trades: classTrades.length,
        profitLoss,
        winRate,
      }
    })
    .filter((item) => item.trades > 0)
}

export function calculateTimeAnalysis(backtests: Backtest[]): TimeAnalysis[] {
  const timeframes: { [key: string]: { profitLoss: number; trades: number; wins: number } } = {}

  backtests.forEach((trade) => {
    if (!timeframes[trade.timeframe]) {
      timeframes[trade.timeframe] = { profitLoss: 0, trades: 0, wins: 0 }
    }

    timeframes[trade.timeframe].profitLoss += trade.profitLoss || 0
    timeframes[trade.timeframe].trades += 1
    if ((trade.profitLoss || 0) > 0) {
      timeframes[trade.timeframe].wins += 1
    }
  })

  return Object.entries(timeframes).map(([timeframe, data]) => ({
    timeframe,
    trades: data.trades,
    profitLoss: data.profitLoss,
    winRate: (data.wins / data.trades) * 100,
  }))
}
