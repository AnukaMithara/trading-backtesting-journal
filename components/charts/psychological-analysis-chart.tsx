"use client"

import { useState } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPanel } from "@/components/filter-panel"
import { Heart, Target } from "lucide-react"

interface PsychologicalAnalysisChartProps {
  data: any[]
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

const EMOTION_COLORS = {
  confident: "#10b981",
  anxious: "#ef4444",
  hesitant: "#f59e0b",
  excited: "#8b5cf6",
  calm: "#06b6d4",
  stressed: "#dc2626",
  overconfident: "#f97316",
  nervous: "#ef4444",
  focused: "#22c55e",
  satisfied: "#10b981",
  frustrated: "#ef4444",
  regretful: "#dc2626",
  proud: "#8b5cf6",
  neutral: "#6b7280",
}

export function PsychologicalAnalysisChart({ data, availableOptions }: PsychologicalAnalysisChartProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [analysisType, setAnalysisType] = useState("preTradeEmotion")

  const filteredData = data.filter((item) => {
    if (filters.assetClass && item.assetClass !== filters.assetClass) return false
    if (filters.broker && item.broker !== filters.broker) return false
    if (filters.strategy && item.strategyName !== filters.strategy) return false
    return true
  })

  // Analyze emotions vs performance
  const emotionAnalysis = filteredData.reduce((acc, trade) => {
    const emotion = trade[analysisType]
    if (!emotion) return acc

    if (!acc[emotion]) {
      acc[emotion] = {
        emotion,
        trades: 0,
        wins: 0,
        totalPL: 0,
        avgDiscipline: 0,
        disciplineSum: 0,
      }
    }

    acc[emotion].trades += 1
    if ((trade.profitLoss || 0) > 0) acc[emotion].wins += 1
    acc[emotion].totalPL += trade.profitLoss || 0
    acc[emotion].disciplineSum += trade.disciplineLevel || 0

    return acc
  }, {})

  const emotionData = Object.values(emotionAnalysis).map((item: any) => ({
    ...item,
    winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    avgPL: item.trades > 0 ? item.totalPL / item.trades : 0,
    avgDiscipline: item.trades > 0 ? item.disciplineSum / item.trades : 0,
  }))

  // Discipline vs Performance correlation
  const disciplineGroups = [
    { range: "1-3", min: 1, max: 3 },
    { range: "4-6", min: 4, max: 6 },
    { range: "7-8", min: 7, max: 8 },
    { range: "9-10", min: 9, max: 10 },
  ]

  const disciplineData = disciplineGroups.map((group) => {
    const groupTrades = filteredData.filter((trade) => {
      const discipline = trade.disciplineLevel || 0
      return discipline >= group.min && discipline <= group.max
    })

    const wins = groupTrades.filter((trade) => (trade.profitLoss || 0) > 0).length
    const totalPL = groupTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0)

    return {
      discipline: group.range,
      trades: groupTrades.length,
      winRate: groupTrades.length > 0 ? (wins / groupTrades.length) * 100 : 0,
      avgPL: groupTrades.length > 0 ? totalPL / groupTrades.length : 0,
      totalPL,
    }
  })

  const bestEmotion = emotionData.reduce(
    (best, current) => (current.winRate > best.winRate ? current : best),
    emotionData[0] || {},
  )

  const worstEmotion = emotionData.reduce(
    (worst, current) => (current.winRate < worst.winRate ? current : worst),
    emotionData[0] || {},
  )

  return (
    <div>
      <FilterPanel
        title="Psychological Analysis"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion vs Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-pink-700">
                <Heart className="h-5 w-5" />
                Emotion vs Performance
              </CardTitle>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="preTradeEmotion">Pre-Trade</option>
                <option value="duringTradeEmotion">During Trade</option>
                <option value="postTradeEmotion">Post-Trade</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Best Emotion</p>
                <p className="text-lg font-bold text-green-700 capitalize">{bestEmotion?.emotion || "N/A"}</p>
                <p className="text-sm text-green-600">{bestEmotion?.winRate?.toFixed(1) || 0}% win rate</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Worst Emotion</p>
                <p className="text-lg font-bold text-red-700 capitalize">{worstEmotion?.emotion || "N/A"}</p>
                <p className="text-sm text-red-600">{worstEmotion?.winRate?.toFixed(1) || 0}% win rate</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="emotion" stroke="#be185d" />
                <YAxis stroke="#be185d" />
                <Tooltip
                  formatter={(value, name) => {
                    const n = Number(value)
                    if (name === "winRate") return [`${n.toFixed(1)}%`, "Win Rate"]
                    if (name === "avgPL") return [`$${n.toFixed(2)}`, "Avg P&L"]
                    return [value, name]
                  }}
                  contentStyle={{
                    backgroundColor: "#fdf2f8",
                    border: "1px solid #f9a8d4",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="winRate" name="winRate" radius={[4, 4, 0, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EMOTION_COLORS[entry.emotion as keyof typeof EMOTION_COLORS] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Discipline vs Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Target className="h-5 w-5" />
              Discipline vs Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disciplineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                <XAxis dataKey="discipline" stroke="#1d4ed8" />
                <YAxis stroke="#1d4ed8" />
                <Tooltip
                  formatter={(value, name) => {
                    const n = Number(value)
                    if (name === "winRate") return [`${n.toFixed(1)}%`, "Win Rate"]
                    if (name === "avgPL") return [`$${n.toFixed(2)}`, "Avg P&L"]
                    return [value, name]
                  }}
                  contentStyle={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #93c5fd",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="winRate" name="winRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {disciplineData.map((item, index) => (
                <div key={item.discipline} className="p-2 bg-blue-50 rounded text-center">
                  <p className="text-sm font-semibold text-blue-700">{item.discipline}</p>
                  <p className="text-xs text-gray-600">{item.trades} trades</p>
                  <p className="text-sm font-bold text-blue-600">{item.winRate.toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
