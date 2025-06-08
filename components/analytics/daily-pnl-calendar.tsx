"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"

interface DailyPnLCalendarProps {
  data: any[]
  filters: any
}

interface DayData {
  date: Date
  trades: any[]
  totalPnL: number
  winRate: number
  volume: number
}

export function DailyPnLCalendar({ data, filters }: DailyPnLCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Filter data based on current filters
  const filteredData = data.filter((trade) => {
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const tradeDate = new Date(trade.entryDateTime)
      if (filters.dateRange.from && tradeDate < filters.dateRange.from) return false
      if (filters.dateRange.to && tradeDate > filters.dateRange.to) return false
    }
    if (filters.strategy && trade.strategyName !== filters.strategy) return false
    if (filters.broker && trade.broker !== filters.broker) return false
    if (filters.asset && trade.asset !== filters.asset) return false
    if (filters.tradeType && trade.tradeType !== filters.tradeType) return false
    return true
  })

  // Group trades by day
  const dayData: { [key: string]: DayData } = {}

  filteredData.forEach((trade) => {
    const tradeDate = new Date(trade.entryDateTime)
    const dateKey = format(tradeDate, "yyyy-MM-dd")

    if (!dayData[dateKey]) {
      dayData[dateKey] = {
        date: tradeDate,
        trades: [],
        totalPnL: 0,
        winRate: 0,
        volume: 0,
      }
    }

    dayData[dateKey].trades.push(trade)
    dayData[dateKey].totalPnL += trade.profitLoss || 0
    dayData[dateKey].volume += (trade.entryPrice || 0) * (trade.positionSize || 0)
  })

  // Calculate win rates
  Object.values(dayData).forEach((day) => {
    const wins = day.trades.filter((trade) => (trade.profitLoss || 0) > 0).length
    day.winRate = day.trades.length > 0 ? (wins / day.trades.length) * 100 : 0
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getDayColor = (pnl: number) => {
    if (pnl > 0) return "bg-green-100 border-green-300 text-green-800"
    if (pnl < 0) return "bg-red-100 border-red-300 text-red-800"
    return "bg-gray-50 border-gray-200 text-gray-600"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalMonthPnL = Object.values(dayData)
    .filter((day) => isSameMonth(day.date, currentMonth))
    .reduce((sum, day) => sum + day.totalPnL, 0)

  const totalMonthTrades = Object.values(dayData)
    .filter((day) => isSameMonth(day.date, currentMonth))
    .reduce((sum, day) => sum + day.trades.length, 0)

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
            Daily P&L Calendar
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Month P&L: {formatCurrency(totalMonthPnL)}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {totalMonthTrades} trades
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[140px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayInfo = dayData[dateKey]
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={dateKey}
                className={`
                  min-h-[120px] p-2 border-2 rounded-lg transition-all hover:shadow-md cursor-pointer
                  ${dayInfo ? getDayColor(dayInfo.totalPnL) : "bg-gray-50 border-gray-200"}
                  ${isToday ? "ring-2 ring-blue-400" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isToday ? "text-blue-600" : ""}`}>{format(day, "d")}</span>
                  {dayInfo && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {dayInfo.trades.length}
                    </Badge>
                  )}
                </div>

                {dayInfo && (
                  <div className="space-y-1">
                    <div className="text-sm font-bold">{formatCurrency(dayInfo.totalPnL)}</div>
                    <div className="text-xs opacity-75">Win: {dayInfo.winRate.toFixed(0)}%</div>
                    <div className="text-xs opacity-75">Vol: {formatCurrency(dayInfo.volume)}</div>
                    {dayInfo.totalPnL > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : dayInfo.totalPnL < 0 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-muted-foreground">Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-muted-foreground">Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-sm text-muted-foreground">No Trades</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
