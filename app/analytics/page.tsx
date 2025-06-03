"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EquityCurveChart } from "@/components/charts/equity-curve-chart"
import { PerformanceByCategoryChart } from "@/components/charts/performance-by-category-chart"
import { DrawdownChart } from "@/components/charts/drawdown-chart"
import { WinLossByDayChart } from "@/components/charts/win-loss-by-day-chart"
import { PsychologicalAnalysisChart } from "@/components/charts/psychological-analysis-chart"
import { EnhancedFilterPanel } from "@/components/enhanced-filter-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Brain, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DateRange } from "react-day-picker"

export default function AnalyticsPage() {
  const [globalFilters, setGlobalFilters] = useState<{
    dateRange?: DateRange
    assetClass?: string
    broker?: string
    strategy?: string
    emotion?: string
    outcome?: string
    tradeType?: string
    asset?: string
    minAmount?: number
    maxAmount?: number
    searchTerm?: string
  }>({})

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch backtests")
      return response.json()
    },
  })

  // Filter backtests based on global filters
  const filteredBacktests = backtests.filter((backtest: any) => {
    // Date range filter
    if (globalFilters.dateRange?.from || globalFilters.dateRange?.to) {
      const tradeDate = new Date(backtest.entryDateTime)
      if (globalFilters.dateRange.from && tradeDate < globalFilters.dateRange.from) return false
      if (globalFilters.dateRange.to && tradeDate > globalFilters.dateRange.to) return false
    }

    // Search term filter
    if (globalFilters.searchTerm) {
      const searchLower = globalFilters.searchTerm.toLowerCase()
      const searchableFields = [
        backtest.tradeId,
        backtest.asset,
        backtest.strategyName,
        backtest.broker,
        backtest.tradeNotes,
        ...(backtest.tags || []),
      ]
      if (!searchableFields.some((field) => field?.toLowerCase().includes(searchLower))) {
        return false
      }
    }

    // Other filters
    if (globalFilters.assetClass && backtest.assetClass !== globalFilters.assetClass) return false
    if (globalFilters.broker && backtest.broker !== globalFilters.broker) return false
    if (globalFilters.strategy && backtest.strategyName !== globalFilters.strategy) return false
    if (globalFilters.tradeType && backtest.tradeType !== globalFilters.tradeType) return false
    if (globalFilters.asset && backtest.asset !== globalFilters.asset) return false
    if (globalFilters.emotion && backtest.preTradeEmotion !== globalFilters.emotion) return false

    // Outcome filter
    if (globalFilters.outcome) {
      const profitLoss = backtest.profitLoss || 0
      if (globalFilters.outcome === "win" && profitLoss <= 0) return false
      if (globalFilters.outcome === "loss" && profitLoss >= 0) return false
      if (globalFilters.outcome === "breakeven" && profitLoss !== 0) return false
    }

    // Amount range filters
    if (globalFilters.minAmount !== undefined && (backtest.profitLoss || 0) < globalFilters.minAmount) return false
    if (globalFilters.maxAmount !== undefined && (backtest.profitLoss || 0) > globalFilters.maxAmount) return false

    return true
  })

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Loading comprehensive trading analytics...</p>
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
    assetClasses: [...new Set(backtests.map((b: any) => b.assetClass).filter(Boolean))],
    brokers: [...new Set(backtests.map((b: any) => b.broker).filter(Boolean))],
    strategies: [...new Set(backtests.map((b: any) => b.strategyName).filter(Boolean))],
    emotions: [...new Set(backtests.map((b: any) => b.preTradeEmotion).filter(Boolean))],
    assets: [...new Set(backtests.map((b: any) => b.asset).filter(Boolean))],
    tradeTypes: [...new Set(backtests.map((b: any) => b.tradeType).filter(Boolean))],
  }

  const exportAnalytics = () => {
    const analyticsData = {
      totalTrades: filteredBacktests.length,
      winRate:
        filteredBacktests.length > 0
          ? (
              (filteredBacktests.filter((t: any) => (t.profitLoss || 0) > 0).length / filteredBacktests.length) *
              100
            ).toFixed(1)
          : 0,
      totalPL: filteredBacktests.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0).toFixed(2),
      avgDiscipline:
        filteredBacktests.length > 0
          ? (
              filteredBacktests.reduce((sum: number, t: any) => sum + (t.disciplineLevel || 0), 0) /
              filteredBacktests.length
            ).toFixed(1)
          : 0,
      activeDays: new Set(filteredBacktests.map((t: any) => new Date(t.entryDateTime).toDateString())).size,
      dateRange: globalFilters.dateRange
        ? `${globalFilters.dateRange.from?.toLocaleDateString()} - ${globalFilters.dateRange.to?.toLocaleDateString()}`
        : "All time",
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced Trading Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive performance analysis with customizable filters and insights
        </p>
      </div>

      {/* Global Filter Panel */}
      <EnhancedFilterPanel
        title="Analytics"
        filters={globalFilters}
        onFiltersChange={setGlobalFilters}
        availableOptions={availableOptions}
        showAdvanced={true}
      />

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{filteredBacktests.length}</div>
            <p className="text-xs text-blue-600">
              {backtests.length > filteredBacktests.length && `of ${backtests.length} total`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {filteredBacktests.length > 0
                ? (
                    (filteredBacktests.filter((t: any) => (t.profitLoss || 0) > 0).length / filteredBacktests.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              ${filteredBacktests.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Avg Discipline</CardTitle>
            <Brain className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">
              {filteredBacktests.length > 0
                ? (
                    filteredBacktests.reduce((sum: number, t: any) => sum + (t.disciplineLevel || 0), 0) /
                    filteredBacktests.length
                  ).toFixed(1)
                : 0}
              /10
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-800">
              {new Set(filteredBacktests.map((t: any) => new Date(t.entryDateTime).toDateString())).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportAnalytics} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Analytics
        </Button>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <EquityCurveChart data={filteredBacktests} availableOptions={availableOptions} />

        <PerformanceByCategoryChart data={filteredBacktests} availableOptions={availableOptions} />

        <DrawdownChart data={filteredBacktests} availableOptions={availableOptions} />

        <WinLossByDayChart data={filteredBacktests} availableOptions={availableOptions} />

        <PsychologicalAnalysisChart data={filteredBacktests} availableOptions={availableOptions} />
      </div>
    </div>
  )
}
