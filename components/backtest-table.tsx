"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EnhancedFilterPanel } from "@/components/enhanced-filter-panel"
import { ArrowUpDown, Eye, Trash2, Download, Filter } from "lucide-react"
import type { Backtest } from "@/types/backtest"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { DateRange } from "react-day-picker"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function BacktestTable() {
  const [sortField, setSortField] = useState<keyof Backtest>("entryDateTime")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filters, setFilters] = useState<{
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
  }>({})

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState<{ id: string; tradeId: string } | null>(null)

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ["backtests"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch backtests")
      return response.json()
    },
  })

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteTrade = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/backtests/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete trade")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backtests"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({
        title: "Success",
        description: "Trade deleted successfully",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete trade",
        variant: "destructive",
      })
    },
  })

  const handleSort = (field: keyof Backtest) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get unique values for filters
  const availableOptions = useMemo(() => {
    return {
      assetClasses: [...new Set(backtests.map((b: Backtest) => b.assetClass).filter(Boolean))],
      brokers: [...new Set(backtests.map((b: Backtest) => b.broker).filter(Boolean))],
      strategies: [...new Set(backtests.map((b: Backtest) => b.strategyName).filter(Boolean))],
      emotions: [...new Set(backtests.map((b: Backtest) => b.preTradeEmotion).filter(Boolean))],
      assets: [...new Set(backtests.map((b: Backtest) => b.asset).filter(Boolean))],
      tradeTypes: [...new Set(backtests.map((b: Backtest) => b.tradeType).filter(Boolean))],
    }
  }, [backtests])

  const filteredAndSortedBacktests = useMemo(() => {
    return backtests
      .filter((backtest: Backtest) => {
        // Date range filter
        if (filters.dateRange?.from || filters.dateRange?.to) {
          const tradeDate = new Date(backtest.entryDateTime)
          if (filters.dateRange.from && tradeDate < filters.dateRange.from) return false
          if (filters.dateRange.to && tradeDate > filters.dateRange.to) return false
        }

        // Search term filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase()
          const searchableFields = [
            backtest.tradeId,
            backtest.asset,
            backtest.strategyName,
            backtest.broker,
            backtest.tradeNotes,
            ...(backtest.tags || []),
          ]
          if (!searchableFields.some((field) => field?.toLowerCase().includes(searchLower))) {
            return false
          }
        }

        // Basic filters
        if (filters.assetClass && backtest.assetClass !== filters.assetClass) return false
        if (filters.broker && backtest.broker !== filters.broker) return false
        if (filters.strategy && backtest.strategyName !== filters.strategy) return false
        if (filters.tradeType && backtest.tradeType !== filters.tradeType) return false
        if (filters.asset && backtest.asset !== filters.asset) return false
        if (filters.emotion && backtest.preTradeEmotion !== filters.emotion) return false

        // Outcome filter
        if (filters.outcome) {
          const profitLoss = backtest.profitLoss || 0
          if (filters.outcome === "win" && profitLoss <= 0) return false
          if (filters.outcome === "loss" && profitLoss >= 0) return false
          if (filters.outcome === "breakeven" && profitLoss !== 0) return false
        }

        // Amount range filters
        if (filters.minAmount !== undefined && (backtest.profitLoss || 0) < filters.minAmount) return false
        if (filters.maxAmount !== undefined && (backtest.profitLoss || 0) > filters.maxAmount) return false

        return true
      })
      .sort((a: Backtest, b: Backtest) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortDirection === "asc" ? -1 : 1
        if (bValue == null) return sortDirection === "asc" ? 1 : -1

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
  }, [backtests, filters, sortField, sortDirection])

  const handleDelete = () => {
    if (tradeToDelete) {
      deleteTrade.mutate(tradeToDelete.id)
      setDeleteDialogOpen(false)
      setTradeToDelete(null)
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Trade ID",
      "Date",
      "Asset",
      "Strategy",
      "Broker",
      "Type",
      "Entry Price",
      "Exit Price",
      "Position Size",
      "P&L",
      "Win/Loss",
    ]

    const csvData = filteredAndSortedBacktests.map((trade) => [
      trade.tradeId,
      new Date(trade.entryDateTime).toLocaleDateString(),
      trade.asset,
      trade.strategyName,
      trade.broker,
      trade.tradeType,
      trade.entryPrice,
      trade.exitPrice || "",
      trade.positionSize,
      trade.profitLoss || 0,
      (trade.profitLoss || 0) > 0 ? "Win" : (trade.profitLoss || 0) < 0 ? "Loss" : "Breakeven",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trades-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `Exported ${filteredAndSortedBacktests.length} trades to CSV`,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filter Panel */}
      <EnhancedFilterPanel
        title="Trade History"
        filters={filters}
        onFiltersChange={setFilters}
        availableOptions={availableOptions}
        showAdvanced={true}
      />

      {/* Results Summary and Actions */}
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Trading History</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Showing {filteredAndSortedBacktests.length} of {backtests.length} trades
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredAndSortedBacktests.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="rounded-lg border bg-background/50 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("tradeId")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Trade ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("entryDateTime")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Entry Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("asset")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Asset
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("strategyName")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Strategy
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("broker")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Broker
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("tradeType")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("profitLoss")}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        P&L
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedBacktests.map((backtest: Backtest) => (
                    <TableRow key={backtest._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm">{backtest.tradeId || "N/A"}</TableCell>
                      <TableCell className="text-sm">
                        {backtest.entryDateTime ? new Date(backtest.entryDateTime).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{backtest.asset || "N/A"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{backtest.strategyName || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{backtest.broker || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="capitalize text-xs">
                          {backtest.tradeType || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold text-sm ${
                            (backtest.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${(backtest.profitLoss || 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/trades/${backtest._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setTradeToDelete({ id: backtest._id, tradeId: backtest.tradeId })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete trade "{tradeToDelete?.tradeId}"? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDelete}
                                  disabled={deleteTrade.isPending}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteTrade.isPending ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedBacktests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="space-y-3">
                          <Filter className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <h3 className="text-lg font-medium">No trades found</h3>
                            <p className="text-muted-foreground">
                              Try adjusting your filters or{" "}
                              <Button variant="link" className="p-0 h-auto" onClick={() => setFilters({})}>
                                clear all filters
                              </Button>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
