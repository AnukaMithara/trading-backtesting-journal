"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { TrendingUp, Coins, BarChart3 } from "lucide-react"

interface PairPerformanceProps {
  data: any[]
  filters: any
}

export function PairPerformance({ data, filters }: PairPerformanceProps) {
  // Filter data based on current filters
  const filteredData = data.filter((trade) => {
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const tradeDate = new Date(trade.entryDateTime)
      if (filters.dateRange.from && tradeDate < filters.dateRange.from) return false
      if (filters.dateRange.to && tradeDate > filters.dateRange.to) return false
    }
    if (filters.strategy && trade.strategyName !== filters.strategy) return false
    if (filters.broker && trade.broker !== filters.broker) return false
    if (filters.tradeType && trade.tradeType !== filters.tradeType) return false
    return true
  })

  // Group by trading pair (asset)
  const pairData = filteredData.reduce((acc, trade) => {
    const pair = trade.asset || "Unknown"
    if (!acc[pair]) {
      acc[pair] = {
        pair,
        trades: [],
        totalPnL: 0,
        wins: 0,
        losses: 0,
        totalVolume: 0,
      }
    }

    acc[pair].trades.push(trade)
    acc[pair].totalPnL += trade.profitLoss || 0
    acc[pair].totalVolume += (trade.entryPrice || 0) * (trade.positionSize || 0)

    if ((trade.profitLoss || 0) > 0) {
      acc[pair].wins += 1
    } else if ((trade.profitLoss || 0) < 0) {
      acc[pair].losses += 1
    }

    return acc
  }, {})

  const pairs = Object.values(pairData)
    .map((pair: any) => ({
      ...pair,
      winRate: pair.trades.length > 0 ? (pair.wins / pair.trades.length) * 100 : 0,
      avgPnL: pair.trades.length > 0 ? pair.totalPnL / pair.trades.length : 0,
      avgVolume: pair.trades.length > 0 ? pair.totalVolume / pair.trades.length : 0,
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

  // Prepare pie chart data for trade distribution
  const pieData = pairs.slice(0, 8).map((pair, index) => ({
    name: pair.pair,
    value: pair.trades.length,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Coins className="h-6 w-6 text-orange-600" />
          Trading Pair Performance Analysis
          {filters.asset && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {filters.asset}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* P&L Bar Chart */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              P&L by Pair
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pairs.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="pair" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Total P&L"]}
                    contentStyle={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
                    {pairs.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Distribution Pie Chart */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Trade Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Trades"]}
                    contentStyle={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pair Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pairs.slice(0, 9).map((pair, index) => (
            <div
              key={pair.pair}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                pair.totalPnL >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-lg truncate" title={pair.pair}>
                  {pair.pair}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    pair.totalPnL >= 0
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {pair.trades.length} trades
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total P&L:</span>
                  <span className={`font-bold ${pair.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(pair.totalPnL)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate:</span>
                  <span className="font-semibold">{pair.winRate.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg P&L:</span>
                  <span className={`font-semibold ${pair.avgPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(pair.avgPnL)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Volume:</span>
                  <span className="font-semibold text-sm">{formatCurrency(pair.avgVolume)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">W/L:</span>
                  <span className="font-semibold">
                    {pair.wins}/{pair.losses}
                  </span>
                </div>
              </div>

              {/* Performance indicator */}
              <div className="mt-3 pt-2 border-t border-current/20">
                <div className="flex items-center justify-center">
                  <Badge variant={pair.totalPnL >= 0 ? "default" : "destructive"} className="text-xs">
                    {pair.totalPnL >= 0 ? "Profitable" : "Losing"} Pair
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2">Pair Trading Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Pairs:</span>
              <span className="ml-2 font-semibold">{pairs.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Profitable Pairs:</span>
              <span className="ml-2 font-semibold text-green-600">{pairs.filter((p) => p.totalPnL > 0).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best Pair:</span>
              <span className="ml-2 font-semibold text-green-600">{pairs[0]?.pair || "N/A"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Best P&L:</span>
              <span className="ml-2 font-semibold text-green-600">
                {pairs[0] ? formatCurrency(pairs[0].totalPnL) : "$0"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
