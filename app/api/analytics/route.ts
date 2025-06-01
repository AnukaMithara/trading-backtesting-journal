import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { calculateMetrics, calculateMonthlyPerformance, calculateStrategyPerformance } from "@/lib/utils/calculations"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("backtests")

    const backtests = await collection.find({}).toArray()

    const metrics = calculateMetrics(backtests)
    const monthlyPerformance = calculateMonthlyPerformance(backtests)
    const strategyPerformance = calculateStrategyPerformance(backtests)

    // Calculate equity curve
    const sortedTrades = backtests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    let runningTotal = 0
    const equityCurve = sortedTrades.map((trade) => {
      runningTotal += trade.profitLoss
      return {
        date: trade.date,
        equity: runningTotal,
      }
    })

    return NextResponse.json({
      metrics,
      monthlyPerformance,
      strategyPerformance,
      equityCurve,
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
      monthlyPerformance: [],
      strategyPerformance: [],
      equityCurve: [],
    })
  }
}
