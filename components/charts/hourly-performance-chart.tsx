"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts"
import { Clock } from "lucide-react"
import type { HourlyPerformance } from "@/lib/utils/calculations"

interface HourlyPerformanceChartProps {
  data: HourlyPerformance[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className={item.value >= 0 ? "text-green-600" : "text-red-600"}>
        P&L: ${item.value.toFixed(2)}
      </p>
      {payload[1] && (
        <p className="text-muted-foreground">Trades: {payload[1].value}</p>
      )}
    </div>
  )
}

export function HourlyPerformanceChart({ data }: HourlyPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-indigo-600" />
            Performance by Hour of Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough data to display. Trades need entry times and risk amounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-6 w-6 text-indigo-600" />
          Performance by Hour of Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="profitLoss" name="P&L" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profitLoss >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {data.map((entry) => (
            <span key={entry.hour} className="flex items-center gap-1">
              <span className="font-medium">{entry.label}</span>: {entry.trades} trades, {entry.winRate}% win
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
