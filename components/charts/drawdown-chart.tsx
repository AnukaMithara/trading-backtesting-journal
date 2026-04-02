"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel } from "@/components/filter-panel"
import { TrendingDown, AlertTriangle } from "lucide-react"

interface DrawdownChartProps {
  data: any[]
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

export function DrawdownChart({ data, availableOptions }: DrawdownChartProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filteredData = data.filter((item) => {
    if (filters.assetClass && item.assetClass !== filters.assetClass) return false
    if (filters.broker && item.broker !== filters.broker) return false
    if (filters.strategy && item.strategyName !== filters.strategy) return false
    return true
  })

  // Calculate drawdown
  let runningTotal = 0
  let peak = 0
  const drawdownData = filteredData
    .sort((a, b) => new Date(a.entryDateTime).getTime() - new Date(b.entryDateTime).getTime())
    .map((trade) => {
      runningTotal += trade.profitLoss || 0
      if (runningTotal > peak) {
        peak = runningTotal
      }
      const drawdown = peak - runningTotal
      const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0

      return {
        date: trade.entryDateTime,
        equity: runningTotal,
        peak,
        drawdown: -drawdown, // Negative for visualization
        drawdownPercent: -drawdownPercent,
        tradeId: trade.tradeId,
      }
    })

  const maxDrawdown = Math.min(...drawdownData.map((d) => d.drawdown))
  const maxDrawdownPercent = Math.min(...drawdownData.map((d) => d.drawdownPercent))
  const currentDrawdown = drawdownData.length > 0 ? drawdownData[drawdownData.length - 1].drawdown : 0

  return (
    <div>
      <FilterPanel
        title="Drawdown Analysis"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" />
            Drawdown Analysis
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Max Drawdown</p>
                <p className="text-lg font-bold text-red-700">${Math.abs(maxDrawdown).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Max Drawdown %</p>
                <p className="text-lg font-bold text-orange-700">{Math.abs(maxDrawdownPercent).toFixed(2)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Current Drawdown</p>
                <p className="text-lg font-bold text-yellow-700">${Math.abs(currentDrawdown).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={drawdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#dc2626" />
              <YAxis stroke="#dc2626" />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => {
                  const n = Number(value)
                  if (name === "drawdown") return [`$${Math.abs(n).toFixed(2)}`, "Drawdown"]
                  if (name === "drawdownPercent") return [`${Math.abs(n).toFixed(2)}%`, "Drawdown %"]
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey="drawdown" stroke="#dc2626" fill="url(#drawdownGradient)" strokeWidth={2} />
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
