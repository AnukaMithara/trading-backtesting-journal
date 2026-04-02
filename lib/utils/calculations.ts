import type {
  Backtest,
  BacktestMetrics,
  StrategyPerformance,
  EmotionalAnalysis,
  AssetClassPerformance,
  TimeAnalysis,
} from "@/types/backtest"
import type { BacktestFormData } from "@/lib/validations/backtest"

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

export function calculateTradeMetrics(trade: BacktestFormData) {
  try {
    console.log("Calculating metrics for trade:", trade)

    const entryPrice = Number(trade.entryPrice) || 0
    const exitPrice = Number(trade.exitPrice) || 0
    const positionSize = Number(trade.positionSize) || 0
    const commissionFees = Number(trade.commissionFees) || 0
    const accountBalanceBefore = Number(trade.accountBalanceBefore) || 0

    let profitLoss = 0
    let profitLossPercentage = 0
    let winLossStatus: "win" | "loss" | "breakeven" = "breakeven"
    let holdingPeriod = 0
    let riskRewardRatio = 0

    // Calculate P&L if exit price is provided
    if (exitPrice > 0 && entryPrice > 0 && positionSize > 0) {
      if (trade.tradeType === "long") {
        profitLoss = (exitPrice - entryPrice) * positionSize - commissionFees
      } else if (trade.tradeType === "short") {
        profitLoss = (entryPrice - exitPrice) * positionSize - commissionFees
      }

      // Calculate percentage
      const totalInvestment = entryPrice * positionSize
      if (totalInvestment > 0) {
        profitLossPercentage = (profitLoss / totalInvestment) * 100
      }

      // Determine win/loss status
      if (profitLoss > 0) {
        winLossStatus = "win"
      } else if (profitLoss < 0) {
        winLossStatus = "loss"
      } else {
        winLossStatus = "breakeven"
      }
    }

    // Calculate holding period if exit date is provided
    if (trade.exitDateTime && trade.entryDateTime) {
      const entryDate = new Date(trade.entryDateTime)
      const exitDate = new Date(trade.exitDateTime)
      holdingPeriod = Math.abs(exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60) // in hours
    }

    // Calculate risk-reward ratio
    if (trade.stopLossPrice && trade.takeProfitPrice && entryPrice > 0) {
      const stopLoss = Number(trade.stopLossPrice)
      const takeProfit = Number(trade.takeProfitPrice)

      let risk = 0
      let reward = 0

      if (trade.tradeType === "long") {
        risk = Math.abs(entryPrice - stopLoss)
        reward = Math.abs(takeProfit - entryPrice)
      } else if (trade.tradeType === "short") {
        risk = Math.abs(stopLoss - entryPrice)
        reward = Math.abs(entryPrice - takeProfit)
      }

      if (risk > 0) {
        riskRewardRatio = reward / risk
      }
    }

    const calculatedData = {
      ...trade,
      profitLoss: Number(profitLoss.toFixed(2)),
      profitLossPercentage: Number(profitLossPercentage.toFixed(2)),
      winLossStatus,
      holdingPeriod: Number(holdingPeriod.toFixed(2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      accountBalanceAfter: trade.accountBalanceAfter || accountBalanceBefore + profitLoss,
    }

    console.log("Calculated trade data:", calculatedData)
    return calculatedData
  } catch (error) {
    console.error("Error calculating trade metrics:", error)
    // Return the original trade data if calculation fails
    return {
      ...trade,
      profitLoss: 0,
      profitLossPercentage: 0,
      winLossStatus: "breakeven" as const,
      holdingPeriod: 0,
      riskRewardRatio: 0,
    }
  }
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

// ---- Advanced metrics ----

export interface AdvancedMetrics {
  sortinoRatio: number
  calmarRatio: number
  cagr: number
  currentWinStreak: number
  currentLossStreak: number
  maxWinStreak: number
  maxLossStreak: number
  avgRMultiple: number
  expectancyPerTrade: number
}

export function calculateAdvancedMetrics(backtests: Backtest[]): AdvancedMetrics {
  if (backtests.length === 0) {
    return {
      sortinoRatio: 0,
      calmarRatio: 0,
      cagr: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      avgRMultiple: 0,
      expectancyPerTrade: 0,
    }
  }

  const sorted = [...backtests].sort(
    (a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime(),
  )

  // Sortino Ratio — uses only downside deviation (negative returns)
  const returns = sorted.map((t) => (t.profitLoss || 0) / Math.max(t.accountBalanceBefore || 1, 1))
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length
  const negativeReturns = returns.filter((r) => r < 0)
  const downsideDeviation =
    negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((s, r) => s + r * r, 0) / negativeReturns.length)
      : 0
  const sortinoRatio = downsideDeviation > 0 ? (avgReturn / downsideDeviation) * Math.sqrt(252) : 0

  // Max drawdown for Calmar ratio
  let runningTotal = 0
  let peak = 0
  let maxDrawdown = 0
  for (const trade of sorted) {
    runningTotal += trade.profitLoss || 0
    if (runningTotal > peak) peak = runningTotal
    const dd = peak - runningTotal
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  const totalPnL = sorted.reduce((s, t) => s + (t.profitLoss || 0), 0)

  // CAGR — compound annual growth rate based on date range
  const firstDate = new Date(sorted[0].entryDateTime)
  const lastDate = new Date(sorted[sorted.length - 1].entryDateTime)
  const years = Math.max((lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 1 / 252)
  const initialEquity = sorted[0].accountBalanceBefore || 1
  const finalEquity = initialEquity + totalPnL
  const cagr = initialEquity > 0 && finalEquity > 0 ? (Math.pow(finalEquity / initialEquity, 1 / years) - 1) * 100 : 0

  // Calmar ratio = annualised return / max drawdown
  const annualisedReturn = totalPnL / years
  const calmarRatio = maxDrawdown > 0 ? annualisedReturn / maxDrawdown : 0

  // Win/Loss streaks
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0
  let runWin = 0
  let runLoss = 0

  for (const trade of sorted) {
    const pl = trade.profitLoss || 0
    if (pl > 0) {
      runWin++
      runLoss = 0
    } else if (pl < 0) {
      runLoss++
      runWin = 0
    } else {
      runWin = 0
      runLoss = 0
    }
    if (runWin > maxWinStreak) maxWinStreak = runWin
    if (runLoss > maxLossStreak) maxLossStreak = runLoss
  }
  // Current streaks are the trailing run counts after the last trade
  currentWinStreak = runWin
  currentLossStreak = runLoss

  // R-Multiple: actual P&L / risk amount
  const tradesWithR = sorted.filter((t) => t.riskAmount && t.riskAmount > 0)
  const avgRMultiple =
    tradesWithR.length > 0
      ? tradesWithR.reduce((s, t) => s + (t.profitLoss || 0) / (t.riskAmount as number), 0) / tradesWithR.length
      : 0

  // Expectancy per trade ($ per trade)
  const wins = sorted.filter((t) => (t.profitLoss || 0) > 0)
  const losses = sorted.filter((t) => (t.profitLoss || 0) < 0)
  const winRate = wins.length / sorted.length
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.profitLoss || 0), 0) / wins.length : 0
  const avgLoss =
    losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.profitLoss || 0), 0) / losses.length) : 0
  const expectancyPerTrade = winRate * avgWin - (1 - winRate) * avgLoss

  return {
    sortinoRatio: Number(sortinoRatio.toFixed(3)),
    calmarRatio: Number(calmarRatio.toFixed(3)),
    cagr: Number(cagr.toFixed(2)),
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak,
    avgRMultiple: Number(avgRMultiple.toFixed(3)),
    expectancyPerTrade: Number(expectancyPerTrade.toFixed(2)),
  }
}

// ---- Time-of-day analysis ----

export interface HourlyPerformance {
  hour: number
  label: string
  trades: number
  profitLoss: number
  winRate: number
}

export function calculateHourlyPerformance(backtests: Backtest[]): HourlyPerformance[] {
  const hourMap: Record<number, { profitLoss: number; trades: number; wins: number }> = {}

  for (const trade of backtests) {
    const hour = new Date(trade.entryDateTime).getHours()
    if (!hourMap[hour]) hourMap[hour] = { profitLoss: 0, trades: 0, wins: 0 }
    hourMap[hour].profitLoss += trade.profitLoss || 0
    hourMap[hour].trades += 1
    if ((trade.profitLoss || 0) > 0) hourMap[hour].wins += 1
  }

  return Object.entries(hourMap)
    .map(([hourStr, data]) => {
      const hour = Number(hourStr)
      const ampm = hour < 12 ? "AM" : "PM"
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return {
        hour,
        label: `${displayHour}${ampm}`,
        trades: data.trades,
        profitLoss: Number(data.profitLoss.toFixed(2)),
        winRate: data.trades > 0 ? Number(((data.wins / data.trades) * 100).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => a.hour - b.hour)
}

// ---- Day-of-week analysis ----

export interface DayOfWeekPerformance {
  day: number
  label: string
  trades: number
  profitLoss: number
  winRate: number
}

export function calculateDayOfWeekPerformance(backtests: Backtest[]): DayOfWeekPerformance[] {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayMap: Record<number, { profitLoss: number; trades: number; wins: number }> = {}

  for (const trade of backtests) {
    const day = new Date(trade.entryDateTime).getDay()
    if (!dayMap[day]) dayMap[day] = { profitLoss: 0, trades: 0, wins: 0 }
    dayMap[day].profitLoss += trade.profitLoss || 0
    dayMap[day].trades += 1
    if ((trade.profitLoss || 0) > 0) dayMap[day].wins += 1
  }

  return Object.entries(dayMap)
    .map(([dayStr, data]) => {
      const day = Number(dayStr)
      return {
        day,
        label: DAY_LABELS[day],
        trades: data.trades,
        profitLoss: Number(data.profitLoss.toFixed(2)),
        winRate: data.trades > 0 ? Number(((data.wins / data.trades) * 100).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => a.day - b.day)
}

// ---- R-Multiple distribution ----

export interface RMultipleBucket {
  range: string
  count: number
}

export function calculateRMultipleDistribution(backtests: Backtest[]): RMultipleBucket[] {
  const tradesWithR = backtests.filter((t) => t.riskAmount && t.riskAmount > 0)
  if (tradesWithR.length === 0) return []

  const rValues = tradesWithR.map((t) => (t.profitLoss || 0) / (t.riskAmount as number))

  // Fixed buckets: < -3, -3 to -2, -2 to -1, -1 to 0, 0 to 1, 1 to 2, 2 to 3, > 3
  const buckets: { min: number; max: number; label: string }[] = [
    { min: -Infinity, max: -3, label: "< -3R" },
    { min: -3, max: -2, label: "-3R to -2R" },
    { min: -2, max: -1, label: "-2R to -1R" },
    { min: -1, max: 0, label: "-1R to 0R" },
    { min: 0, max: 1, label: "0R to 1R" },
    { min: 1, max: 2, label: "1R to 2R" },
    { min: 2, max: 3, label: "2R to 3R" },
    { min: 3, max: Infinity, label: "> 3R" },
  ]

  return buckets
    .map((b) => ({
      range: b.label,
      count: rValues.filter((r) => r >= b.min && r < b.max).length,
    }))
    .filter((b) => b.count > 0)
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
