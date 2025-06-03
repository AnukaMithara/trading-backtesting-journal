"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { X, Filter, Calendar, Search, RotateCcw } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface EnhancedFilterPanelProps {
  title: string
  filters: {
    dateRange?: DateRange
    assetClass?: string
    broker?: string
    strategy?: string
    emotion?: string
    outcome?: string
    tradeType?: string
    asset?: string
    minAmount?: number
    maxAmount?: number
    searchTerm?: string
  }
  onFiltersChange: (filters: any) => void
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
    assets: string[]
    tradeTypes: string[]
  }
  showAdvanced?: boolean
}

export function EnhancedFilterPanel({
  title,
  filters,
  onFiltersChange,
  availableOptions,
  showAdvanced = true,
}: EnhancedFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" || value === "" ? undefined : value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (value === undefined || value === null || value === "") return false
    if (typeof value === "object" && "from" in value) {
      return value.from !== undefined || value.to !== undefined
    }
    return true
  }).length

  return (
    <Card className="mb-6 shadow-lg border-0 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            {title} Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary hover:text-primary/80"
            >
              {isExpanded ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <DatePickerWithRange
              date={filters.dateRange}
              setDate={(dateRange) => updateFilter("dateRange", dateRange)}
            />
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              placeholder="Search trades, assets, strategies..."
              value={filters.searchTerm || ""}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Basic Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Asset Class</Label>
              <Select value={filters.assetClass || "all"} onValueChange={(value) => updateFilter("assetClass", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Asset Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Asset Classes</SelectItem>
                  {availableOptions.assetClasses.map((assetClass) => (
                    <SelectItem key={assetClass} value={assetClass}>
                      {assetClass.charAt(0).toUpperCase() + assetClass.slice(1)}
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

          {/* Advanced Filters Toggle */}
          {showAdvanced && (
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-sm"
              >
                {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
              </Button>
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvanced && showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Asset</Label>
                  <Select value={filters.asset || "all"} onValueChange={(value) => updateFilter("asset", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Assets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assets</SelectItem>
                      {availableOptions.assets.map((asset) => (
                        <SelectItem key={asset} value={asset}>
                          {asset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Emotion</Label>
                  <Select value={filters.emotion || "all"} onValueChange={(value) => updateFilter("emotion", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Emotions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Emotions</SelectItem>
                      {availableOptions.emotions.map((emotion) => (
                        <SelectItem key={emotion} value={emotion}>
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Outcome</Label>
                  <Select value={filters.outcome || "all"} onValueChange={(value) => updateFilter("outcome", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Outcomes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outcomes</SelectItem>
                      <SelectItem value="win">Wins</SelectItem>
                      <SelectItem value="loss">Losses</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount Range Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min P&L Amount ($)</Label>
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
                  <Label className="text-sm font-medium">Max P&L Amount ($)</Label>
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
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
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
                      variant="outline"
                      className="flex items-center gap-1 bg-primary/5 border-primary/20"
                    >
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}: {String(displayValue)}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => updateFilter(key, undefined)}
                      />
                    </Badge>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} className="ml-4">
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
