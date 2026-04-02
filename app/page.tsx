"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, PlusCircle } from "lucide-react"
import Link from "next/link"
import type { Backtest } from "@/types/backtest"

async function getAnalytics() {
  const response = await fetch("/api/analytics")
  if (!response.ok) throw new Error("Failed to fetch analytics")
  return response.json()
}

async function getRecentTrades(): Promise<Backtest[]> {
  const response = await fetch("/api/backtests?page=1&pageSize=5")
  if (!response.ok) throw new Error("Failed to fetch trades")
  const data = await response.json()
  // Support both paginated and legacy array response
  return Array.isArray(data) ? data.slice(0, 5) : (data.trades ?? []).slice(0, 5)
}

export default function Home() {
  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
  } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
  })

  const {
    data: recentTrades = [],
    isLoading: isLoadingTrades,
    isError: isErrorTrades,
  } = useQuery({
    queryKey: ["recentTrades"],
    queryFn: getRecentTrades,
  })

  const metrics = analytics?.metrics

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount)

  const statCards = [
    {
      title: "Total Trades",
      value: isLoadingAnalytics ? null : isErrorAnalytics ? "—" : String(metrics?.totalTrades ?? 0),
      description: "All time",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Win Rate",
      value: isLoadingAnalytics ? null : isErrorAnalytics ? "—" : `${(metrics?.winRate ?? 0).toFixed(1)}%`,
      description: `${metrics?.winningTrades ?? 0}W / ${metrics?.losingTrades ?? 0}L`,
      icon: Target,
      color: (metrics?.winRate ?? 0) >= 50 ? "text-green-600" : "text-red-600",
      bg: (metrics?.winRate ?? 0) >= 50 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Total P&L",
      value: isLoadingAnalytics ? null : isErrorAnalytics ? "—" : formatCurrency(metrics?.totalProfitLoss ?? 0),
      description: `Net: ${formatCurrency(metrics?.netProfitAfterCommissions ?? 0)}`,
      icon: (metrics?.totalProfitLoss ?? 0) >= 0 ? TrendingUp : TrendingDown,
      color: (metrics?.totalProfitLoss ?? 0) >= 0 ? "text-green-600" : "text-red-600",
      bg: (metrics?.totalProfitLoss ?? 0) >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      title: "Max Drawdown",
      value: isLoadingAnalytics ? null : isErrorAnalytics ? "—" : formatCurrency(metrics?.maxDrawdown ?? 0),
      description: "Peak to trough",
      icon: TrendingDown,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Profit Factor",
      value: isLoadingAnalytics
        ? null
        : isErrorAnalytics
          ? "—"
          : metrics?.profitFactor === Infinity
            ? "∞"
            : (metrics?.profitFactor ?? 0).toFixed(2),
      description: "Gross profit / Gross loss",
      icon: DollarSign,
      color: (metrics?.profitFactor ?? 0) >= 1.5 ? "text-green-600" : "text-yellow-600",
      bg: (metrics?.profitFactor ?? 0) >= 1.5 ? "bg-green-50" : "bg-yellow-50",
    },
    {
      title: "Avg Trade",
      value: isLoadingAnalytics ? null : isErrorAnalytics ? "—" : formatCurrency(metrics?.averageProfitLoss ?? 0),
      description: "Average P&L per trade",
      icon: BarChart3,
      color: (metrics?.averageProfitLoss ?? 0) >= 0 ? "text-green-600" : "text-red-600",
      bg: (metrics?.averageProfitLoss ?? 0) >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ]

  const hasNoTrades = !isLoadingAnalytics && !isErrorAnalytics && (metrics?.totalTrades ?? 0) === 0

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/add">
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Trade
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">{card.title}</CardDescription>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {card.value === null ? (
                  <Skeleton className="h-7 w-24 mb-1" />
                ) : (
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {hasNoTrades && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
            <div>
              <h3 className="text-lg font-semibold">No trades yet</h3>
              <p className="text-muted-foreground mt-1 text-sm max-w-sm">
                Start logging your trades to see performance metrics, analytics, and insights here.
              </p>
            </div>
            <Link href="/add">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Your First Trade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Trades */}
      {!hasNoTrades && (
        <div className="w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <Link href="/trades">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {isLoadingTrades ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isErrorTrades ? (
            <p className="text-sm text-muted-foreground">Failed to load recent trades.</p>
          ) : recentTrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trades to display.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asset</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Strategy</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">P&L</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTrades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/trades/${trade._id}`} className="hover:underline text-primary">
                          {trade.asset || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{trade.strategyName || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {trade.entryDateTime ? new Date(trade.entryDateTime).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold ${
                            (trade.profitLoss ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(trade.profitLoss ?? 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            (trade.profitLoss ?? 0) > 0
                              ? "bg-green-50 text-green-700 border-green-200"
                              : (trade.profitLoss ?? 0) < 0
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {(trade.profitLoss ?? 0) > 0 ? "Win" : (trade.profitLoss ?? 0) < 0 ? "Loss" : "Breakeven"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
