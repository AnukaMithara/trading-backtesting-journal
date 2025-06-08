"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { GlobalFilterPanel } from "@/components/analytics/global-filter-panel"
import { DailyPnLCalendar } from "@/components/analytics/daily-pnl-calendar"
import { PerformanceMetrics } from "@/components/analytics/performance-metrics"
import { StrategyPerformance } from "@/components/analytics/strategy-performance"
import { PairPerformance } from "@/components/analytics/pair-performance"
import { BacktestTable } from "@/components/backtest-table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, BarChart3, Calendar, Target, Coins, Table } from "lucide-react"
import type { DateRange } from "react-day-picker"

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

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch backtests")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading comprehensive trading analytics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 bg-gray-100 rounded"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Get unique values for filters
  const availableOptions = {
    strategies: [...new Set(backtests.map((b: any) => b.strategyName).filter(Boolean))],
    brokers: [...new Set(backtests.map((b: any) => b.broker).filter(Boolean))],
    assets: [...new Set(backtests.map((b: any) => b.asset).filter(Boolean))],
    tradeTypes: [...new Set(backtests.map((b: any) => b.tradeType).filter(Boolean))],
    riskLevels: [...new Set(backtests.map((b: any) => b.riskLevel).filter(Boolean))],
  }

  const exportAnalytics = () => {
    const analyticsData = {
      totalTrades: backtests.length,
      filters: globalFilters,
      generatedAt: new Date().toISOString(),
      data: backtests,
    }

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced Trading Analytics Dashboard
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

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Strategies
          </TabsTrigger>
          <TabsTrigger value="pairs" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Pairs
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Trades
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceMetrics data={backtests} filters={globalFilters} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StrategyPerformance data={backtests} filters={globalFilters} />
            <PairPerformance data={backtests} filters={globalFilters} />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <DailyPnLCalendar data={backtests} filters={globalFilters} />
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <StrategyPerformance data={backtests} filters={globalFilters} />
        </TabsContent>

        <TabsContent value="pairs" className="space-y-6">
          <PairPerformance data={backtests} filters={globalFilters} />
        </TabsContent>

        <TabsContent value="trades" className="space-y-6">
          <BacktestTable />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <PerformanceMetrics data={backtests} filters={globalFilters} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
