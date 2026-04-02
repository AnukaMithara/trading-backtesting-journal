"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Zap, Activity, Target } from "lucide-react"
import type { AdvancedMetrics } from "@/lib/utils/calculations"

interface AdvancedMetricsCardProps {
  data: AdvancedMetrics
}

export function AdvancedMetricsCard({ data }: AdvancedMetricsCardProps) {
  const formatNumber = (v: number, decimals = 2) => v.toFixed(decimals)
  const formatPercent = (v: number) => `${v.toFixed(2)}%`
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v)

  const cards = [
    {
      title: "Sortino Ratio",
      value: formatNumber(data.sortinoRatio),
      description: "Downside risk-adjusted return",
      color: data.sortinoRatio >= 1 ? "text-green-600" : data.sortinoRatio >= 0 ? "text-yellow-600" : "text-red-600",
      bg: data.sortinoRatio >= 1 ? "bg-green-50 border-green-200" : data.sortinoRatio >= 0 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200",
      icon: Activity,
    },
    {
      title: "Calmar Ratio",
      value: formatNumber(data.calmarRatio),
      description: "Annualised return / Max drawdown",
      color: data.calmarRatio >= 1 ? "text-green-600" : data.calmarRatio >= 0 ? "text-yellow-600" : "text-red-600",
      bg: data.calmarRatio >= 1 ? "bg-green-50 border-green-200" : data.calmarRatio >= 0 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200",
      icon: Target,
    },
    {
      title: "CAGR",
      value: formatPercent(data.cagr),
      description: "Compound annual growth rate",
      color: data.cagr >= 0 ? "text-green-600" : "text-red-600",
      bg: data.cagr >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      icon: data.cagr >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "Avg R-Multiple",
      value: formatNumber(data.avgRMultiple),
      description: "Average profit in units of risk",
      color: data.avgRMultiple >= 1 ? "text-green-600" : data.avgRMultiple >= 0 ? "text-yellow-600" : "text-red-600",
      bg: data.avgRMultiple >= 1 ? "bg-green-50 border-green-200" : data.avgRMultiple >= 0 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200",
      icon: Zap,
    },
    {
      title: "Expectancy",
      value: formatCurrency(data.expectancyPerTrade),
      description: "Expected $ per trade",
      color: data.expectancyPerTrade >= 0 ? "text-green-600" : "text-red-600",
      bg: data.expectancyPerTrade >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      icon: data.expectancyPerTrade >= 0 ? TrendingUp : TrendingDown,
    },
  ]

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="h-6 w-6 text-blue-600" />
          Advanced Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ratio metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className={`p-5 rounded-xl border-2 ${card.bg} transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                  <Badge variant="outline" className="text-xs">{card.title}</Badge>
                </div>
                <div className={`text-2xl font-bold ${card.color} mb-1`}>{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.description}</div>
              </div>
            )
          })}
        </div>

        {/* Streak stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Current Win Streak</div>
            <div className="text-2xl font-bold text-green-600">{data.currentWinStreak}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Max Win Streak</div>
            <div className="text-2xl font-bold text-green-700">{data.maxWinStreak}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Current Loss Streak</div>
            <div className="text-2xl font-bold text-red-600">{data.currentLossStreak}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Max Loss Streak</div>
            <div className="text-2xl font-bold text-red-700">{data.maxLossStreak}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
