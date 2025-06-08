"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Separator } from "@/components/ui/separator"
import { Filter, Calendar, X, RotateCcw, Settings } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { addDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

interface GlobalFilterPanelProps {
  filters: {
    dateRange?: DateRange
    strategy?: string
    broker?: string
    asset?: string
    tradeType?: string
    outcome?: string
    minAmount?: number
    maxAmount?: number
    riskLevel?: string
  }
  onFiltersChange: (filters: any) => void
  availableOptions: {
    strategies: string[]
    brokers: string[]
    assets: string[]
    tradeTypes: string[]
    riskLevels: string[]
  }
}

export function GlobalFilterPanel({ filters, onFiltersChange, availableOptions }: GlobalFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" || value === "" ? undefined : value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const setPresetDateRange = (preset: string) => {
    const today = new Date()
    let dateRange: DateRange | undefined

    switch (preset) {
      case "today":
        dateRange = { from: today, to: today }
        break
      case "last7days":
        dateRange = { from: addDays(today, -7), to: today }
        break
      case "last30days":
        dateRange = { from: addDays(today, -30), to: today }
        break
      case "thisMonth":
        dateRange = { from: startOfMonth(today), to: endOfMonth(today) }
        break
      case "lastMonth":
        const lastMonth = addDays(startOfMonth(today), -1)
        dateRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
        break
      case "thisYear":
        dateRange = { from: startOfYear(today), to: endOfYear(today) }
        break
      case "lastYear":
        const lastYear = new Date(today.getFullYear() - 1, 0, 1)
        dateRange = { from: startOfYear(lastYear), to: endOfYear(lastYear) }
        break
      default:
        dateRange = undefined
    }

    updateFilter("dateRange", dateRange)
  }

  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (value === undefined || value === null || value === "") return false
    if (typeof value === "object" && "from" in value) {
      return value.from !== undefined || value.to !== undefined
    }
    return true
  }).length

  const presetRanges = [
    { label: "Today", value: "today" },
    { label: "Last 7 days", value: "last7days" },
    { label: "Last 30 days", value: "last30days" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "This Year", value: "thisYear" },
    { label: "Last Year", value: "lastYear" },
  ]

  return (
    <Card className="mb-6 shadow-lg border-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="h-6 w-6 text-blue-600" />
            Global Analytics Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Settings className="h-4 w-4 mr-1" />
              {isExpanded ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Date Range Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">Date Range</Label>
            </div>

            {/* Preset Date Buttons */}
            <div className="flex flex-wrap gap-2">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetDateRange(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <DatePickerWithRange
              date={filters.dateRange}
              setDate={(dateRange) => updateFilter("dateRange", dateRange)}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Basic Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Quick Filters</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Strategy</Label>
                <Select value={filters.strategy || "all"} onValueChange={(value) => updateFilter("strategy", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Strategies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    {availableOptions.strategies.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>
                        {strategy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Broker</Label>
                <Select value={filters.broker || "all"} onValueChange={(value) => updateFilter("broker", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brokers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brokers</SelectItem>
                    {availableOptions.brokers.map((broker) => (
                      <SelectItem key={broker} value={broker}>
                        {broker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Trading Pair</Label>
                <Select value={filters.asset || "all"} onValueChange={(value) => updateFilter("asset", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Pairs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pairs</SelectItem>
                    {availableOptions.assets.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Trade Type</Label>
                <Select value={filters.tradeType || "all"} onValueChange={(value) => updateFilter("tradeType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {availableOptions.tradeTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Advanced Filters</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Outcome</Label>
                    <Select value={filters.outcome || "all"} onValueChange={(value) => updateFilter("outcome", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Outcomes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="win">Wins Only</SelectItem>
                        <SelectItem value="loss">Losses Only</SelectItem>
                        <SelectItem value="breakeven">Breakeven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Min P&L ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={filters.minAmount || ""}
                      onChange={(e) =>
                        updateFilter("minAmount", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Max P&L ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={filters.maxAmount || ""}
                      onChange={(e) =>
                        updateFilter("maxAmount", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null

                    let displayValue = value
                    if (typeof value === "object" && "from" in value) {
                      if (value.from && value.to) {
                        displayValue = `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`
                      } else if (value.from) {
                        displayValue = `From ${value.from.toLocaleDateString()}`
                      } else if (value.to) {
                        displayValue = `Until ${value.to.toLocaleDateString()}`
                      }
                    }

                    return (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-200"
                      >
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}: {String(displayValue)}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => updateFilter(key, undefined)}
                        />
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
