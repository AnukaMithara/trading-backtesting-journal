"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Eye, Trash2 } from "lucide-react"
import type { Backtest } from "@/types/backtest"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
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
  const [filterAsset, setFilterAsset] = useState("")
  const [filterStrategy, setFilterStrategy] = useState("")
  const [filterBroker, setFilterBroker] = useState("all")
  const [filterAssetClass, setFilterAssetClass] = useState("all")

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
  const uniqueAssets = [...new Set(backtests.map((b: Backtest) => b.asset).filter(Boolean))]
  const uniqueBrokers = [...new Set(backtests.map((b: Backtest) => b.broker).filter(Boolean))]
  const uniqueAssetClasses = [...new Set(backtests.map((b: Backtest) => b.assetClass).filter(Boolean))]

  const filteredAndSortedBacktests = backtests
    .filter((backtest: Backtest) => {
      const assetMatch =
        filterAsset === "" || (backtest.asset && backtest.asset.toLowerCase().includes(filterAsset.toLowerCase()))
      const strategyMatch =
        filterStrategy === "" ||
        (backtest.strategyName && backtest.strategyName.toLowerCase().includes(filterStrategy.toLowerCase()))
      const brokerMatch = filterBroker === "all" || backtest.broker === filterBroker
      const assetClassMatch = filterAssetClass === "all" || backtest.assetClass === filterAssetClass

      return assetMatch && strategyMatch && brokerMatch && assetClassMatch
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

  const handleDelete = () => {
    if (tradeToDelete) {
      deleteTrade.mutate(tradeToDelete.id)
      setDeleteDialogOpen(false)
      setTradeToDelete(null)
    }
  }

  if (isLoading) {
    return <div>Loading backtests...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading History</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Filter by asset..."
            value={filterAsset}
            onChange={(e) => setFilterAsset(e.target.value)}
          />
          <Input
            placeholder="Filter by strategy..."
            value={filterStrategy}
            onChange={(e) => setFilterStrategy(e.target.value)}
          />
          <Select value={filterBroker} onValueChange={setFilterBroker}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by broker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brokers</SelectItem>
              {uniqueBrokers.map((broker) => (
                <SelectItem key={broker} value={broker}>
                  {broker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAssetClass} onValueChange={setFilterAssetClass}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by asset class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Asset Classes</SelectItem>
              {uniqueAssetClasses.map((assetClass) => (
                <SelectItem key={assetClass} value={assetClass}>
                  {assetClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("tradeId")} className="h-auto p-0 font-semibold">
                    Trade ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("entryDateTime")}
                    className="h-auto p-0 font-semibold"
                  >
                    Entry Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("asset")} className="h-auto p-0 font-semibold">
                    Asset
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("strategyName")}
                    className="h-auto p-0 font-semibold"
                  >
                    Strategy
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("broker")} className="h-auto p-0 font-semibold">
                    Broker
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("tradeType")} className="h-auto p-0 font-semibold">
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("profitLoss")} className="h-auto p-0 font-semibold">
                    P&L
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedBacktests.map((backtest: Backtest) => (
                <TableRow key={backtest._id}>
                  <TableCell className="font-medium">{backtest.tradeId || "N/A"}</TableCell>
                  <TableCell>
                    {backtest.entryDateTime ? new Date(backtest.entryDateTime).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>{backtest.asset || "N/A"}</TableCell>
                  <TableCell>{backtest.strategyName || "N/A"}</TableCell>
                  <TableCell>{backtest.broker || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {backtest.tradeType || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        (backtest.profitLoss || 0) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                      }
                    >
                      ${(backtest.profitLoss || 0).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/trades/${backtest._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTradeToDelete({ id: backtest._id, tradeId: backtest.tradeId })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete trade "{tradeToDelete?.tradeId}"? This action cannot be
                              undone.
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No trades found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
