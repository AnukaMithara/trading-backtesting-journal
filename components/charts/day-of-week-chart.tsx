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
import { CalendarDays } from "lucide-react"
import type { DayOfWeekPerformance } from "@/lib/utils/calculations"

interface DayOfWeekChartProps {
  data: DayOfWeekPerformance[]
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
    </div>
  )
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="h-6 w-6 text-teal-600" />
            Performance by Day of Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="h-6 w-6 text-teal-600" />
          Performance by Day of Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="profitLoss" name="P&L" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profitLoss >= 0 ? "hsl(160, 60%, 40%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-7 gap-2 text-xs">
          {data.map((entry) => (
            <div key={entry.day} className="text-center p-2 rounded-lg bg-muted/40">
              <div className="font-semibold">{entry.label}</div>
              <div className={entry.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                ${entry.profitLoss.toFixed(0)}
              </div>
              <div className="text-muted-foreground">{entry.winRate}% WR</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
