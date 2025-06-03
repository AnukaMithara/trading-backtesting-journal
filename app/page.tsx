"use client"

import { useQuery } from "@tanstack/react-query"
import { MetricCard } from "@/components/ui/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrokerAssetManagement } from "@/components/broker-asset-management"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, BarChart3, List, ArrowRight } from "lucide-react"
import Link from "next/link"

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
      return data.slice(0, 5)
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your trading dashboard...</p>
        </div>
      </div>
    )
  }

  const { metrics } = analytics

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border border-primary/10">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Welcome back, Trader
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                  Track your trading performance, analyze your strategies, and improve your results with comprehensive
                  analytics.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link href="/add">
                  <Button className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trade
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full sm:w-auto border-primary/20 hover:bg-primary/5">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/3 rounded-full blur-2xl"></div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Performance Overview</h2>
            <Link href="/analytics">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricCard
              title="Total Trades"
              value={metrics.totalTrades}
              description="All time trades"
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
            />
            <MetricCard
              title="Win Rate"
              value={`${metrics.winRate.toFixed(1)}%`}
              description={`${metrics.winningTrades} wins, ${metrics.losingTrades} losses`}
              trend={metrics.winRate >= 50 ? "up" : "down"}
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
            />
            <MetricCard
              title="Total P&L"
              value={`$${metrics.totalProfitLoss.toFixed(2)}`}
              description="Net profit/loss"
              trend={metrics.totalProfitLoss >= 0 ? "up" : "down"}
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500"
            />
            <MetricCard
              title="Average P&L"
              value={`$${metrics.averageProfitLoss.toFixed(2)}`}
              description="Per trade average"
              trend={metrics.averageProfitLoss >= 0 ? "up" : "down"}
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500"
            />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <MetricCard
            title="Max Drawdown"
            value={`$${metrics.maxDrawdown.toFixed(2)}`}
            description="Largest peak-to-trough decline"
            trend="down"
            className="hover:shadow-lg transition-all duration-200"
          />
          <MetricCard
            title="Largest Win"
            value={`$${metrics.largestWin.toFixed(2)}`}
            description="Best single trade"
            trend="up"
            className="hover:shadow-lg transition-all duration-200"
          />
          <MetricCard
            title="Largest Loss"
            value={`$${Math.abs(metrics.largestLoss).toFixed(2)}`}
            description="Worst single trade"
            trend="down"
            className="hover:shadow-lg transition-all duration-200"
          />
        </div>

        {/* Recent Trades */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Recent Trades</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Your latest trading activity</p>
              </div>
              <Link href="/trades">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <List className="h-4 w-4 mr-2" />
                  View All Trades
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map((trade: any, index: number) => (
                  <div
                    key={trade._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="space-y-1 sm:space-y-0">
                      <p className="font-medium text-sm sm:text-base">{trade.tradeId}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {trade.asset} • {trade.strategyName}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {new Date(trade.entryDateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:text-right mt-2 sm:mt-0">
                      <p
                        className={`font-semibold text-sm sm:text-base ${trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ${trade.profitLoss.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block ml-4">
                        {new Date(trade.entryDateTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No trades yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Start by adding your first backtest to track your trading performance.
                </p>
                <Link href="/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Trade
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broker & Asset Management */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Management Tools</h2>
          <BrokerAssetManagement />
        </div>
      </div>
    </div>
  )
}
