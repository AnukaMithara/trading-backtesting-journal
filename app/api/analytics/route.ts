import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import {
  calculateMetrics,
  calculateMonthlyPerformance,
  calculateStrategyPerformance,
  calculateAdvancedMetrics,
  calculateHourlyPerformance,
  calculateDayOfWeekPerformance,
  calculateRMultipleDistribution,
} from "@/lib/utils/calculations"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("backtests")

    const backtests = await collection.find({}).toArray()

    const metrics = calculateMetrics(backtests)
    const advancedMetrics = calculateAdvancedMetrics(backtests)
    const monthlyPerformance = calculateMonthlyPerformance(backtests)
    const strategyPerformance = calculateStrategyPerformance(backtests)
    const hourlyPerformance = calculateHourlyPerformance(backtests)
    const dayOfWeekPerformance = calculateDayOfWeekPerformance(backtests)
    const rMultipleDistribution = calculateRMultipleDistribution(backtests)

    // Calculate equity curve
    const sortedTrades = [...backtests].sort(
      (a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime(),
    )
    let runningTotal = 0
    const equityCurve = sortedTrades.map((trade) => {
      runningTotal += trade.profitLoss || 0
      return {
        date: trade.entryDateTime,
        equity: Number(runningTotal.toFixed(2)),
      }
    })

    return NextResponse.json({
      metrics,
      advancedMetrics,
      monthlyPerformance,
      strategyPerformance,
      equityCurve,
      hourlyPerformance,
      dayOfWeekPerformance,
      rMultipleDistribution,
    })
  } catch (error) {
    console.error("MongoDB connection error:", error)

    // Return default empty analytics to prevent UI crashes
    const defaultMetrics = {
      totalTrades: 0,
      winRate: 0,
      totalProfitLoss: 0,
      averageProfitLoss: 0,
      maxDrawdown: 0,
      winningTrades: 0,
      losingTrades: 0,
      largestWin: 0,
      largestLoss: 0,
    }

    return NextResponse.json({
      metrics: defaultMetrics,
      advancedMetrics: {
        sortinoRatio: 0,
        calmarRatio: 0,
        cagr: 0,
        currentWinStreak: 0,
        currentLossStreak: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        avgRMultiple: 0,
        expectancyPerTrade: 0,
      },
      monthlyPerformance: [],
      strategyPerformance: [],
      equityCurve: [],
      hourlyPerformance: [],
      dayOfWeekPerformance: [],
      rMultipleDistribution: [],
    })
  }
}
