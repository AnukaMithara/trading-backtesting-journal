"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel } from "@/components/filter-panel"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface EquityCurveChartProps {
  data: any[]
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

export function EquityCurveChart({ data, availableOptions }: EquityCurveChartProps) {
  const [filters, setFilters] = useState({})

  // Filter data based on current filters
  const filteredData = data.filter((item) => {
    if (filters.assetClass && item.assetClass !== filters.assetClass) return false
    if (filters.broker && item.broker !== filters.broker) return false
    if (filters.strategy && item.strategy !== filters.strategy) return false
    return true
  })

  // Calculate equity curve
  let runningTotal = 0
  const equityCurve = filteredData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((trade) => {
      runningTotal += trade.profitLoss || 0
      return {
        date: trade.date,
        equity: runningTotal,
        trade: trade.tradeId,
        profitLoss: trade.profitLoss,
      }
    })

  const totalReturn = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : 0
  const maxEquity = Math.max(...equityCurve.map((d) => d.equity), 0)
  const minEquity = Math.min(...equityCurve.map((d) => d.equity), 0)
  const maxDrawdown = maxEquity - minEquity

  return (
    <div>
      <FilterPanel
        title="Equity Curve"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="h-5 w-5" />
            Equity Curve Analysis
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Total Return</p>
                <p className={`text-lg font-bold ${totalReturn >= 0 ? "text-green-700" : "text-red-700"}`}>
                  ${totalReturn.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Peak Equity</p>
                <p className="text-lg font-bold text-blue-700">${maxEquity.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-red-600 font-medium">Max Drawdown</p>
                <p className="text-lg font-bold text-red-700">${maxDrawdown.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#6366f1" />
              <YAxis stroke="#6366f1" />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === "equity" ? "Portfolio Value" : name,
                ]}
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
