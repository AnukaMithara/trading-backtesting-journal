"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrokerAssetManagement } from "@/components/broker-asset-management"

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch analytics")
      return response.json()
    },
  })

  const { data: recentTrades = [] } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch backtests")
      const data = await response.json()
      return data.slice(0, 5) // Get only the 5 most recent trades
    },
  })

  if (isLoading) {
    return <div>Loading dashboard...</div>
  }

  const { metrics } = analytics

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
        <p className="text-muted-foreground">Overview of your trading performance and recent activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Trades" value={metrics.totalTrades} description="All time trades" />
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          description={`${metrics.winningTrades} wins, ${metrics.losingTrades} losses`}
          trend={metrics.winRate >= 50 ? "up" : "down"}
        />
        <MetricCard
          title="Total P&L"
          value={`$${metrics.totalProfitLoss.toFixed(2)}`}
          description="Net profit/loss"
          trend={metrics.totalProfitLoss >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Average P&L"
          value={`$${metrics.averageProfitLoss.toFixed(2)}`}
          description="Per trade average"
          trend={metrics.averageProfitLoss >= 0 ? "up" : "down"}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Max Drawdown"
          value={`$${metrics.maxDrawdown.toFixed(2)}`}
          description="Largest peak-to-trough decline"
          trend="down"
        />
        <MetricCard
          title="Largest Win"
          value={`$${metrics.largestWin.toFixed(2)}`}
          description="Best single trade"
          trend="up"
        />
        <MetricCard
          title="Largest Loss"
          value={`$${Math.abs(metrics.largestLoss).toFixed(2)}`}
          description="Worst single trade"
          trend="down"
        />
      </div>

      {/* Broker & Asset Management */}
      <BrokerAssetManagement />

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length > 0 ? (
            <div className="space-y-4">
              {recentTrades.map((trade: any) => (
                <div key={trade._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{trade.tradeId}</p>
                    <p className="text-sm text-muted-foreground">
                      {trade.asset} • {trade.strategyName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${trade.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trade.entryDateTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No trades yet. Start by adding your first backtest!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
