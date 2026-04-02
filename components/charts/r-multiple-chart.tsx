"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Sigma } from "lucide-react"
import type { RMultipleBucket } from "@/lib/utils/calculations"

interface RMultipleChartProps {
  data: RMultipleBucket[]
  avgRMultiple?: number
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-muted-foreground">Trades: <span className="font-medium text-foreground">{payload[0].value}</span></p>
    </div>
  )
}

function isPositiveBucket(range: string): boolean {
  // Positive if range starts with "0R to" or "> X" where X > 0 or "1R to" etc.
  return (
    range.startsWith("0R to") ||
    range.startsWith("1R") ||
    range.startsWith("2R") ||
    range.startsWith("> ")
  )
}

export function RMultipleChart({ data, avgRMultiple }: RMultipleChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sigma className="h-6 w-6 text-purple-600" />
            R-Multiple Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No R-multiple data available. Add risk amount to your trades to see R-multiples.
          </p>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((s, b) => s + b.count, 0)

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sigma className="h-6 w-6 text-purple-600" />
            R-Multiple Distribution
          </CardTitle>
          {avgRMultiple !== undefined && (
            <div className="text-sm text-muted-foreground">
              Avg R: <span className={`font-bold ${avgRMultiple >= 1 ? "text-green-600" : avgRMultiple >= 0 ? "text-yellow-600" : "text-red-600"}`}>
                {avgRMultiple.toFixed(2)}R
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={isPositiveBucket(entry.range) ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Based on {total} trades with defined risk. R = P&L / Risk Amount.
        </p>
      </CardContent>
    </Card>
  )
}
