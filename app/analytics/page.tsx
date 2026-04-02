"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GlobalFilterPanel } from "@/components/analytics/global-filter-panel"
import { DailyPnLCalendar } from "@/components/analytics/daily-pnl-calendar"
import { PerformanceMetrics } from "@/components/analytics/performance-metrics"
import { StrategyPerformance } from "@/components/analytics/strategy-performance"
import { PairPerformance } from "@/components/analytics/pair-performance"
import { AdvancedMetricsCard } from "@/components/analytics/advanced-metrics"
import { HourlyPerformanceChart } from "@/components/charts/hourly-performance-chart"
import { DayOfWeekChart } from "@/components/charts/day-of-week-chart"
import { RMultipleChart } from "@/components/charts/r-multiple-chart"
import { BacktestTable } from "@/components/backtest-table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, BarChart3, Calendar, Target, Coins, Table, Zap } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { Backtest } from "@/types/backtest"

type AnalyticsData = {
  metrics: Record<string, number>
  advancedMetrics: {
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
  monthlyPerformance: unknown[]
  strategyPerformance: unknown[]
  equityCurve: unknown[]
  hourlyPerformance: { hour: number; label: string; trades: number; profitLoss: number; winRate: number }[]
  dayOfWeekPerformance: { day: number; label: string; trades: number; profitLoss: number; winRate: number }[]
  rMultipleDistribution: { range: string; count: number }[]
}

export default function AnalyticsPage() {
  const [globalFilters, setGlobalFilters] = useState<{
    dateRange?: DateRange
    strategy?: string
    broker?: string
    asset?: string
    tradeType?: string
    outcome?: string
    minAmount?: number
    maxAmount?: number
    riskLevel?: string
  }>({})

  const { data: backtests = [], isLoading: isLoadingTrades } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch backtests")
      return response.json() as Promise<Backtest[]>
    },
  })

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics")
      if (!response.ok) throw new Error("Failed to fetch analytics")
      return response.json() as Promise<AnalyticsData>
    },
  })

  const isLoading = isLoadingTrades || isLoadingAnalytics

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading comprehensive trading analytics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Get unique values for filters
  const availableOptions = {
    strategies: [...new Set(backtests.map((b) => b.strategyName).filter(Boolean))],
    brokers: [...new Set(backtests.map((b) => b.broker).filter(Boolean))],
    assets: [...new Set(backtests.map((b) => b.asset).filter(Boolean))],
    tradeTypes: [...new Set(backtests.map((b) => b.tradeType).filter(Boolean))],
    riskLevels: [] as string[],
  }

  const exportAnalytics = () => {
    const analyticsExport = {
      totalTrades: backtests.length,
      metrics: analyticsData?.metrics,
      advancedMetrics: analyticsData?.advancedMetrics,
      filters: globalFilters,
      generatedAt: new Date().toISOString(),
      data: backtests,
    }
    const blob = new Blob([JSON.stringify(analyticsExport, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const advancedMetrics = analyticsData?.advancedMetrics ?? {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced Trading Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive performance analysis with global filtering and real-time insights
        </p>
      </div>

      {/* Global Filter Panel */}
      <GlobalFilterPanel
        filters={globalFilters}
        onFiltersChange={setGlobalFilters}
        availableOptions={availableOptions}
      />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportAnalytics} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Analytics Data
        </Button>
      </div>

      {/* Analytics Tabs — consolidated from 6 to 5 meaningful tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 text-xs sm:text-sm">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-1 text-xs sm:text-sm">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Breakdown</span>
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-1 text-xs sm:text-sm">
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">Trades</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview tab — Performance metrics + strategy/pair charts */}
        <TabsContent value="overview" className="space-y-6">
          <PerformanceMetrics data={backtests} filters={globalFilters} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StrategyPerformance data={backtests} filters={globalFilters} />
            <PairPerformance data={backtests} filters={globalFilters} />
          </div>
        </TabsContent>

        {/* Advanced tab — Sortino/Calmar/CAGR/streaks + time analysis + R-multiple */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedMetricsCard data={advancedMetrics} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <HourlyPerformanceChart data={analyticsData?.hourlyPerformance ?? []} />
            <DayOfWeekChart data={analyticsData?.dayOfWeekPerformance ?? []} />
          </div>
          <RMultipleChart
            data={analyticsData?.rMultipleDistribution ?? []}
            avgRMultiple={advancedMetrics.avgRMultiple}
          />
        </TabsContent>

        {/* Calendar tab */}
        <TabsContent value="calendar" className="space-y-6">
          <DailyPnLCalendar data={backtests} filters={globalFilters} />
        </TabsContent>

        {/* Breakdown tab — Strategy + Pair detail views */}
        <TabsContent value="breakdown" className="space-y-6">
          <StrategyPerformance data={backtests} filters={globalFilters} />
          <PairPerformance data={backtests} filters={globalFilters} />
        </TabsContent>

        {/* Trades tab — full trade table */}
        <TabsContent value="trades" className="space-y-6">
          <BacktestTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
