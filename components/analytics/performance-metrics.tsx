"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Calculator, Award } from "lucide-react"

interface PerformanceMetricsProps {
  data: any[]
  filters: any
}

export function PerformanceMetrics({ data, filters }: PerformanceMetricsProps) {
  // Filter data based on current filters
  const filteredData = data.filter((trade) => {
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const tradeDate = new Date(trade.entryDateTime)
      if (filters.dateRange.from && tradeDate < filters.dateRange.from) return false
      if (filters.dateRange.to && tradeDate > filters.dateRange.to) return false
    }
    if (filters.strategy && trade.strategyName !== filters.strategy) return false
    if (filters.broker && trade.broker !== filters.broker) return false
    if (filters.asset && trade.asset !== filters.asset) return false
    if (filters.tradeType && trade.tradeType !== filters.tradeType) return false
    return true
  })

  // Calculate metrics
  const totalTrades = filteredData.length
  const winningTrades = filteredData.filter((trade) => (trade.profitLoss || 0) > 0)
  const losingTrades = filteredData.filter((trade) => (trade.profitLoss || 0) < 0)

  const totalPnL = filteredData.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0

  const avgProfit =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / winningTrades.length
      : 0

  const avgLoss =
    losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / losingTrades.length)
      : 0

  const profitFactor = avgLoss > 0 ? avgProfit / avgLoss : avgProfit > 0 ? Number.POSITIVE_INFINITY : 0

  // Calculate Sharpe Ratio (simplified)
  const returns = filteredData.map((trade) => (trade.profitLoss || 0) / (trade.accountBalanceBefore || 1))
  const avgReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0
  const returnStdDev =
    returns.length > 1
      ? Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1))
      : 0
  const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0

  const largestWin = Math.max(...filteredData.map((trade) => trade.profitLoss || 0), 0)
  const largestLoss = Math.min(...filteredData.map((trade) => trade.profitLoss || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const metrics = [
    {
      title: "Total P&L",
      value: formatCurrency(totalPnL),
      icon: DollarSign,
      color: totalPnL >= 0 ? "text-green-600" : "text-red-600",
      bgColor: totalPnL >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: totalPnL >= 0 ? "border-green-200" : "border-red-200",
      subtitle: `${totalTrades} trades`,
    },
    {
      title: "Win Rate",
      value: formatPercent(winRate),
      icon: Target,
      color: winRate >= 50 ? "text-green-600" : "text-red-600",
      bgColor: winRate >= 50 ? "bg-green-50" : "bg-red-50",
      borderColor: winRate >= 50 ? "border-green-200" : "border-red-200",
      subtitle: `${winningTrades.length}W / ${losingTrades.length}L`,
    },
    {
      title: "Avg Profit",
      value: formatCurrency(avgProfit),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      subtitle: `${winningTrades.length} winning trades`,
    },
    {
      title: "Avg Loss",
      value: formatCurrency(avgLoss),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      subtitle: `${losingTrades.length} losing trades`,
    },
    {
      title: "Profit Factor",
      value: profitFactor === Number.POSITIVE_INFINITY ? "∞" : profitFactor.toFixed(2),
      icon: BarChart3,
      color: profitFactor >= 1.5 ? "text-green-600" : profitFactor >= 1 ? "text-yellow-600" : "text-red-600",
      bgColor: profitFactor >= 1.5 ? "bg-green-50" : profitFactor >= 1 ? "bg-yellow-50" : "bg-red-50",
      borderColor:
        profitFactor >= 1.5 ? "border-green-200" : profitFactor >= 1 ? "border-yellow-200" : "border-red-200",
      subtitle: "Gross profit / Gross loss",
    },
    {
      title: "Sharpe Ratio",
      value: sharpeRatio.toFixed(2),
      icon: Calculator,
      color: sharpeRatio >= 1 ? "text-green-600" : sharpeRatio >= 0 ? "text-yellow-600" : "text-red-600",
      bgColor: sharpeRatio >= 1 ? "bg-green-50" : sharpeRatio >= 0 ? "bg-yellow-50" : "bg-red-50",
      borderColor: sharpeRatio >= 1 ? "border-green-200" : sharpeRatio >= 0 ? "border-yellow-200" : "border-red-200",
      subtitle: "Risk-adjusted return",
    },
    {
      title: "Largest Win",
      value: formatCurrency(largestWin),
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      subtitle: "Best single trade",
    },
    {
      title: "Largest Loss",
      value: formatCurrency(Math.abs(largestLoss)),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      subtitle: "Worst single trade",
    },
  ]

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BarChart3 className="h-6 w-6 text-purple-600" />
          Performance Metrics
          {Object.keys(filters).length > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Filtered
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={index}
                className={`p-6 rounded-xl border-2 ${metric.bgColor} ${metric.borderColor} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                  <Badge variant="outline" className="text-xs">
                    {metric.title}
                  </Badge>
                </div>
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.subtitle}</div>
              </div>
            )
          })}
        </div>

        {/* Summary Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Trades:</span>
              <span className="ml-2 font-semibold">{totalTrades}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Average per Trade:</span>
              <span className={`ml-2 font-semibold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(totalTrades > 0 ? totalPnL / totalTrades : 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Risk-Reward:</span>
              <span className="ml-2 font-semibold">1:{avgLoss > 0 ? (avgProfit / avgLoss).toFixed(2) : "∞"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
