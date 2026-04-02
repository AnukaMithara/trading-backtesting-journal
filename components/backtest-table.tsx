"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedFilterPanel } from "@/components/enhanced-filter-panel"
import { ArrowUpDown, Eye, Trash2, Download, Filter, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function BacktestTable() {
  const [sortField, setSortField] = useState<keyof Backtest>("entryDateTime")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
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

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["backtests", page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/backtests?page=${page}&pageSize=${pageSize}`)
      if (!response.ok) throw new Error("Failed to fetch backtests")
      return response.json() as Promise<{
        trades: Backtest[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>
    },
  })

  // Also fetch all trades (without pagination) for client-side filtering & CSV export
  const { data: allTrades = [] } = useQuery({
    queryKey: ["backtests-all"],
    queryFn: async () => {
      const response = await fetch("/api/backtests")
      if (!response.ok) throw new Error("Failed to fetch all backtests")
      return response.json() as Promise<Backtest[]>
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
      queryClient.invalidateQueries({ queryKey: ["backtests-all"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({ title: "Success", description: "Trade deleted successfully" })
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

  // Get unique values for filters from all trades
  const availableOptions = useMemo(() => {
    return {
      assetClasses: [...new Set(allTrades.map((b) => b.assetClass).filter(Boolean))],
      brokers: [...new Set(allTrades.map((b) => b.broker).filter(Boolean))],
      strategies: [...new Set(allTrades.map((b) => b.strategyName).filter(Boolean))],
      emotions: [...new Set(allTrades.map((b) => b.preTradeEmotion).filter(Boolean))],
      assets: [...new Set(allTrades.map((b) => b.asset).filter(Boolean))],
      tradeTypes: [...new Set(allTrades.map((b) => b.tradeType).filter(Boolean))],
    }
  }, [allTrades])

  // Filter from all trades (client-side) for display when filters are active
  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "")

  const filteredAndSortedTrades = useMemo(() => {
    const source = hasFilters ? allTrades : (paginatedData?.trades ?? [])
    return source
      .filter((backtest) => {
        if (filters.dateRange?.from || filters.dateRange?.to) {
          const tradeDate = new Date(backtest.entryDateTime)
          if (filters.dateRange?.from && tradeDate < filters.dateRange.from) return false
          if (filters.dateRange?.to && tradeDate > filters.dateRange.to) return false
        }
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
          if (!searchableFields.some((field) => field?.toLowerCase().includes(searchLower))) return false
        }
        if (filters.assetClass && backtest.assetClass !== filters.assetClass) return false
        if (filters.broker && backtest.broker !== filters.broker) return false
        if (filters.strategy && backtest.strategyName !== filters.strategy) return false
        if (filters.tradeType && backtest.tradeType !== filters.tradeType) return false
        if (filters.asset && backtest.asset !== filters.asset) return false
        if (filters.emotion && backtest.preTradeEmotion !== filters.emotion) return false
        if (filters.outcome) {
          const pl = backtest.profitLoss || 0
          if (filters.outcome === "win" && pl <= 0) return false
          if (filters.outcome === "loss" && pl >= 0) return false
          if (filters.outcome === "breakeven" && pl !== 0) return false
        }
        if (filters.minAmount !== undefined && (backtest.profitLoss || 0) < filters.minAmount) return false
        if (filters.maxAmount !== undefined && (backtest.profitLoss || 0) > filters.maxAmount) return false
        return true
      })
      .sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        if (aValue == null && bValue == null) return 0
        if (aValue == null) return sortDirection === "asc" ? -1 : 1
        if (bValue == null) return sortDirection === "asc" ? 1 : -1
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
  }, [allTrades, paginatedData, filters, sortField, sortDirection, hasFilters])

  const handleDelete = () => {
    if (tradeToDelete) {
      deleteTrade.mutate(tradeToDelete.id)
      setDeleteDialogOpen(false)
      setTradeToDelete(null)
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Trade ID", "Date", "Asset", "Strategy", "Broker", "Type",
      "Entry Price", "Exit Price", "Position Size", "P&L", "Win/Loss",
    ]
    const csvData = filteredAndSortedTrades.map((trade) => [
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
    toast({ title: "Export Complete", description: `Exported ${filteredAndSortedTrades.length} trades to CSV` })
  }

  const totalTrades = paginatedData?.total ?? allTrades.length
  const totalPages = hasFilters
    ? Math.ceil(filteredAndSortedTrades.length / pageSize)
    : (paginatedData?.totalPages ?? 1)
  const displayedTrades = hasFilters
    ? filteredAndSortedTrades.slice((page - 1) * pageSize, page * pageSize)
    : filteredAndSortedTrades

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // True empty state (no trades exist at all)
  if (!isLoading && totalTrades === 0 && !hasFilters) {
    return (
      <div className="space-y-6">
        <EnhancedFilterPanel
          title="Trade History"
          filters={filters}
          onFiltersChange={setFilters}
          availableOptions={availableOptions}
          showAdvanced={true}
        />
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Filter className="h-16 w-16 text-muted-foreground/40" />
            <div>
              <h3 className="text-xl font-semibold">No trades yet</h3>
              <p className="text-muted-foreground mt-2 text-sm max-w-md">
                You haven&apos;t logged any trades yet. Start by adding your first trade to begin tracking your performance.
              </p>
            </div>
            <Link href="/add">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Your First Trade
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EnhancedFilterPanel
        title="Trade History"
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters)
          setPage(1) // Reset to page 1 on filter change
        }}
        availableOptions={availableOptions}
        showAdvanced={true}
      />

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">Trading History</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? `Showing ${filteredAndSortedTrades.length} filtered trades (${totalTrades} total)`
                  : `${totalTrades} total trades`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredAndSortedTrades.length === 0}
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
                      <Button variant="ghost" onClick={() => handleSort("tradeId")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Trade ID <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Button variant="ghost" onClick={() => handleSort("entryDateTime")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Entry Date <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Button variant="ghost" onClick={() => handleSort("asset")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Asset <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">
                      <Button variant="ghost" onClick={() => handleSort("strategyName")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Strategy <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">
                      <Button variant="ghost" onClick={() => handleSort("broker")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Broker <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">
                      <Button variant="ghost" onClick={() => handleSort("tradeType")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        Type <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Button variant="ghost" onClick={() => handleSort("profitLoss")} className="h-auto p-0 font-semibold hover:bg-transparent">
                        P&L <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTrades.map((backtest) => (
                    <TableRow key={backtest._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm">{backtest.tradeId || "N/A"}</TableCell>
                      <TableCell className="text-sm">
                        {backtest.entryDateTime ? new Date(backtest.entryDateTime).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{backtest.asset || "N/A"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{backtest.strategyName || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{backtest.broker || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="capitalize text-xs">{backtest.tradeType || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold text-sm ${(backtest.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
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
                                onClick={() => setTradeToDelete({ id: backtest._id ?? "", tradeId: backtest.tradeId ?? "" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete trade &ldquo;{tradeToDelete?.tradeId}&rdquo;? This action cannot be undone.
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
                  {displayedTrades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16">
                        <div className="space-y-3">
                          <Filter className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <h3 className="text-lg font-medium">No trades match your filters</h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              Try adjusting your filters or{" "}
                              <Button variant="link" className="p-0 h-auto" onClick={() => { setFilters({}); setPage(1) }}>
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
