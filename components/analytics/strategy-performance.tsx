"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, Target, Award } from "lucide-react"

interface StrategyPerformanceProps {
  data: any[]
  filters: any
}

export function StrategyPerformance({ data, filters }: StrategyPerformanceProps) {
  // Filter data based on current filters
  const filteredData = data.filter((trade) => {
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const tradeDate = new Date(trade.entryDateTime)
      if (filters.dateRange.from && tradeDate < filters.dateRange.from) return false
      if (filters.dateRange.to && tradeDate > filters.dateRange.to) return false
    }
    if (filters.broker && trade.broker !== filters.broker) return false
    if (filters.asset && trade.asset !== filters.asset) return false
    if (filters.tradeType && trade.tradeType !== filters.tradeType) return false
    return true
  })

  // Group by strategy
  const strategyData = filteredData.reduce((acc, trade) => {
    const strategy = trade.strategyName || "Unknown"
    if (!acc[strategy]) {
      acc[strategy] = {
        strategy,
        trades: [],
        totalPnL: 0,
        wins: 0,
        losses: 0,
        totalVolume: 0,
      }
    }

    acc[strategy].trades.push(trade)
    acc[strategy].totalPnL += trade.profitLoss || 0
    acc[strategy].totalVolume += (trade.entryPrice || 0) * (trade.positionSize || 0)

    if ((trade.profitLoss || 0) > 0) {
      acc[strategy].wins += 1
    } else if ((trade.profitLoss || 0) < 0) {
      acc[strategy].losses += 1
    }

    return acc
  }, {})

  const strategies = Object.values(strategyData)
    .map((strategy: any) => ({
      ...strategy,
      winRate: strategy.trades.length > 0 ? (strategy.wins / strategy.trades.length) * 100 : 0,
      avgPnL: strategy.trades.length > 0 ? strategy.totalPnL / strategy.trades.length : 0,
      profitFactor:
        strategy.losses > 0
          ? (strategy.totalPnL > 0 ? strategy.totalPnL : 0) / Math.abs(strategy.totalPnL < 0 ? strategy.totalPnL : 1)
          : strategy.totalPnL > 0
            ? Number.POSITIVE_INFINITY
            : 0,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-6 w-6 text-green-600" />
          Strategy Performance Analysis
          {filters.strategy && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {filters.strategy}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategies.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="strategy" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "totalPnL" ? formatCurrency(value) : value,
                  name === "totalPnL" ? "Total P&L" : name,
                ]}
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="totalPnL" name="totalPnL" radius={[4, 4, 0, 0]}>
                {strategies.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.slice(0, 6).map((strategy, index) => (
            <div
              key={strategy.strategy}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                strategy.totalPnL >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm truncate" title={strategy.strategy}>
                  {strategy.strategy}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    strategy.totalPnL >= 0
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {strategy.trades.length} trades
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total P&L:</span>
                  <span className={`font-bold text-sm ${strategy.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(strategy.totalPnL)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Win Rate:</span>
                  <span className="font-semibold text-sm">{strategy.winRate.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Avg P&L:</span>
                  <span className={`font-semibold text-sm ${strategy.avgPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(strategy.avgPnL)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">W/L Ratio:</span>
                  <span className="font-semibold text-sm">
                    {strategy.wins}/{strategy.losses}
                  </span>
                </div>
              </div>

              {/* Performance indicator */}
              <div className="mt-3 pt-2 border-t border-current/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {strategy.totalPnL >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                    )}
                    <span className="text-xs font-medium">{strategy.totalPnL >= 0 ? "Profitable" : "Losing"}</span>
                  </div>
                  {strategy.winRate >= 60 && <Award className="h-3 w-3 text-yellow-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Strategy Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Strategies:</span>
              <span className="ml-2 font-semibold">{strategies.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Profitable:</span>
              <span className="ml-2 font-semibold text-green-600">
                {strategies.filter((s) => s.totalPnL > 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Strategy:</span>
              <span className="ml-2 font-semibold text-green-600">{strategies[0]?.strategy || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best P&L:</span>
              <span className="ml-2 font-semibold text-green-600">
                {strategies[0] ? formatCurrency(strategies[0].totalPnL) : "$0"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
