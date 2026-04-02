"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"

interface FilterPanelProps {
  title: string
  filters: {
    assetClass?: string
    broker?: string
    strategy?: string
    emotion?: string
    outcome?: string
    dateRange?: { from: Date; to: Date } | null
  }
  onFiltersChange: (filters: any) => void
  availableOptions: {
    assetClasses: string[]
    brokers: string[]
    strategies: string[]
    emotions: string[]
  }
}

export function FilterPanel({ title, filters, onFiltersChange, availableOptions }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            {title} Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Select value={filters.assetClass || "all"} onValueChange={(value) => updateFilter("assetClass", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Asset Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Asset Classes</SelectItem>
                {availableOptions.assetClasses.map((assetClass) => (
                  <SelectItem key={assetClass} value={assetClass}>
                    {assetClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.broker || "all"} onValueChange={(value) => updateFilter("broker", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Broker" />
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

            <Select value={filters.strategy || "all"} onValueChange={(value) => updateFilter("strategy", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Strategy" />
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

            <Select value={filters.emotion || "all"} onValueChange={(value) => updateFilter("emotion", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Emotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emotions</SelectItem>
                {availableOptions.emotions.map((emotion) => (
                  <SelectItem key={emotion} value={emotion}>
                    {emotion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.outcome || "all"} onValueChange={(value) => updateFilter("outcome", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="win">Wins</SelectItem>
                <SelectItem value="loss">Losses</SelectItem>
                <SelectItem value="breakeven">Breakeven</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null
                  return (
                    <Badge key={key} variant="outline" className="flex items-center gap-1">
                      {key}: {typeof value === "string" ? value : JSON.stringify(value)}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter(key, "all")} />
                    </Badge>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
