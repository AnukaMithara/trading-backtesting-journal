"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel } from "@/components/filter-panel"
import { BarChart3 } from "lucide-react"

interface PerformanceByCategoryChartProps {
  data: any[]
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export function PerformanceByCategoryChart({ data, availableOptions }: PerformanceByCategoryChartProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [categoryType, setCategoryType] = useState("assetClass")

  const filteredData = data.filter((item) => {
    if (filters.assetClass && item.assetClass !== filters.assetClass) return false
    if (filters.broker && item.broker !== filters.broker) return false
    if (filters.strategy && item.strategyName !== filters.strategy) return false
    return true
  })

  // Group data by selected category
  const groupedData = filteredData.reduce((acc, trade) => {
    const category = trade[categoryType] || "Unknown"
    if (!acc[category]) {
      acc[category] = {
        category,
        profitLoss: 0,
        trades: 0,
        wins: 0,
        totalWinAmount: 0,
        totalLossAmount: 0,
      }
    }
    acc[category].profitLoss += trade.profitLoss || 0
    acc[category].trades += 1
    if ((trade.profitLoss || 0) > 0) {
      acc[category].wins += 1
      acc[category].totalWinAmount += trade.profitLoss
    } else if ((trade.profitLoss || 0) < 0) {
      acc[category].totalLossAmount += Math.abs(trade.profitLoss)
    }
    return acc
  }, {})

  const chartData = Object.values(groupedData).map((item: any) => ({
    ...item,
    winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    avgProfitLoss: item.trades > 0 ? item.profitLoss / item.trades : 0,
  }))

  return (
    <div>
      <FilterPanel
        title="Performance by Category"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BarChart3 className="h-5 w-5" />
              Performance by {categoryType.charAt(0).toUpperCase() + categoryType.slice(1)}
            </CardTitle>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="assetClass">Asset Class</option>
              <option value="broker">Broker</option>
              <option value="strategyName">Strategy</option>
              <option value="preTradeEmotion">Pre-Trade Emotion</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="category" stroke="#7c3aed" />
              <YAxis stroke="#7c3aed" />
              <Tooltip
                formatter={(value, name) => {
                  const n = Number(value)
                  if (name === "profitLoss") return [`$${n.toFixed(2)}`, "Total P&L"]
                  if (name === "winRate") return [`${n.toFixed(1)}%`, "Win Rate"]
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: "#faf5ff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="profitLoss" name="profitLoss" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profitLoss >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chartData.slice(0, 4).map((item, index) => (
              <div key={item.category} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <h4 className="font-semibold text-purple-700">{item.category}</h4>
                <p className="text-sm text-gray-600">{item.trades} trades</p>
                <p className={`text-lg font-bold ${item.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${item.profitLoss.toFixed(2)}
                </p>
                <p className="text-sm text-blue-600">{item.winRate.toFixed(1)}% win rate</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
