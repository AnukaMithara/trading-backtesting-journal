import type { BacktestFormData } from "@/lib/validations/backtest"

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
