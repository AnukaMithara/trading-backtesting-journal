"use client"

import { useQuery } from "@tanstack/react-query"
import { EquityCurveChart } from "@/components/charts/equity-curve-chart"
import { PerformanceByCategoryChart } from "@/components/charts/performance-by-category-chart"
import { DrawdownChart } from "@/components/charts/drawdown-chart"
import { WinLossByDayChart } from "@/components/charts/win-loss-by-day-chart"
import { PsychologicalAnalysisChart } from "@/components/charts/psychological-analysis-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Brain, Calendar } from "lucide-react"

export default function AnalyticsPage() {
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

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{backtests.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {backtests.length > 0
                ? ((backtests.filter((t: any) => (t.profitLoss || 0) > 0).length / backtests.length) * 100).toFixed(1)
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
              ${backtests.reduce((sum: number, t: any) => sum + (t.profitLoss || 0), 0).toFixed(2)}
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
              {backtests.length > 0
                ? (
                    backtests.reduce((sum: number, t: any) => sum + (t.disciplineLevel || 0), 0) / backtests.length
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
              {new Set(backtests.map((t: any) => new Date(t.entryDateTime).toDateString())).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <EquityCurveChart data={backtests} availableOptions={availableOptions} />

        <PerformanceByCategoryChart data={backtests} availableOptions={availableOptions} />

        <DrawdownChart data={backtests} availableOptions={availableOptions} />

        <WinLossByDayChart data={backtests} availableOptions={availableOptions} />

        <PsychologicalAnalysisChart data={backtests} availableOptions={availableOptions} />
      </div>
    </div>
  )
}
