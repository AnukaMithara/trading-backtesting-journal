"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel } from "@/components/filter-panel"
import { Calendar } from "lucide-react"

interface WinLossByDayChartProps {
  data: any[]
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#8b5cf6"]

export function WinLossByDayChart({ data, availableOptions }: WinLossByDayChartProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})

  const filteredData = data.filter((item) => {
    if (filters.assetClass && item.assetClass !== filters.assetClass) return false
    if (filters.broker && item.broker !== filters.broker) return false
    if (filters.strategy && item.strategyName !== filters.strategy) return false
    return true
  })

  // Group by day of week
  const dayData = DAYS.map((day, index) => {
    const dayTrades = filteredData.filter((trade) => {
      const tradeDay = new Date(trade.entryDateTime).getDay()
      return tradeDay === index
    })

    const wins = dayTrades.filter((trade) => (trade.profitLoss || 0) > 0).length
    const losses = dayTrades.filter((trade) => (trade.profitLoss || 0) < 0).length
    const totalPL = dayTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0

    return {
      day,
      dayIndex: index,
      wins,
      losses,
      total: dayTrades.length,
      winRate,
      totalPL,
      avgPL: dayTrades.length > 0 ? totalPL / dayTrades.length : 0,
    }
  })

  const bestDay = dayData.reduce((best, current) => (current.winRate > best.winRate ? current : best), dayData[0])

  const worstDay = dayData.reduce((worst, current) => (current.winRate < worst.winRate ? current : worst), dayData[0])

  return (
    <div>
      <FilterPanel
        title="Performance by Day of Week"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Calendar className="h-5 w-5" />
            Win/Loss Ratio by Day of Week
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Best Trading Day</p>
              <p className="text-lg font-bold text-green-700">{bestDay.day}</p>
              <p className="text-sm text-green-600">{bestDay.winRate.toFixed(1)}% win rate</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Worst Trading Day</p>
              <p className="text-lg font-bold text-red-700">{worstDay.day}</p>
              <p className="text-sm text-red-600">{worstDay.winRate.toFixed(1)}% win rate</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="day" stroke="#4f46e5" />
              <YAxis stroke="#4f46e5" />
              <Tooltip
                formatter={(value, name) => {
                  const n = Number(value)
                  if (name === "winRate") return [`${n.toFixed(1)}%`, "Win Rate"]
                  if (name === "totalPL") return [`$${n.toFixed(2)}`, "Total P&L"]
                  return [value, name]
                }}
                contentStyle={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="winRate" name="winRate" radius={[4, 4, 0, 0]}>
                {dayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DAY_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {dayData.map((day, index) => (
              <div key={day.day} className="p-3 bg-gradient-to-b from-indigo-50 to-blue-50 rounded-lg text-center">
                <h4 className="font-semibold text-indigo-700 text-sm">{day.day.slice(0, 3)}</h4>
                <p className="text-xs text-gray-600">{day.total} trades</p>
                <p className="text-sm font-bold" style={{ color: DAY_COLORS[index] }}>
                  {day.winRate.toFixed(0)}%
                </p>
                <p className={`text-xs ${day.totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${day.totalPL.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
