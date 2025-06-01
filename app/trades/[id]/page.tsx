"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Brain, Target, Trash2 } from "lucide-react"
import Link from "next/link"

export default function TradeDetailPage({ params }: { params: { id: string } }) {
  const { data: trade, isLoading } = useQuery({
    queryKey: ["backtest", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/backtests/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch trade")
      return response.json()
    },
  })

  const router = useRouter()
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
      router.push("/trades")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete trade",
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    deleteTrade.mutate(params.id)
  }

  if (isLoading) {
    return <div>Loading trade details...</div>
  }

  if (!trade) {
    return <div>Trade not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/trades">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trades
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Trade
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trade</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete trade "{trade?.tradeId}"? This action cannot be undone and will remove
                all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteTrade.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteTrade.isPending ? "Deleting..." : "Delete Trade"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Details</h1>
          <p className="text-muted-foreground">Trade ID: {trade.tradeId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trade Identification */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Trade Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entry Date/Time</p>
              <p>{trade.entryDateTime ? new Date(trade.entryDateTime).toLocaleString() : "N/A"}</p>
            </div>
            {trade.exitDateTime && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exit Date/Time</p>
                <p>{new Date(trade.exitDateTime).toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset</p>
              <p className="font-semibold">{trade.asset}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trade Type</p>
              <Badge variant="outline" className="capitalize">
                {trade.tradeType}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Broker</p>
              <p>{trade.broker}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <Badge variant="secondary" className="capitalize">
                {trade.accountType}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Strategy & Setup */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Strategy & Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Strategy</p>
              <p className="font-semibold">{trade.strategyName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timeframe</p>
              <p>{trade.timeframe}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Market Condition</p>
              <Badge variant="outline" className="capitalize">
                {trade.marketCondition}
              </Badge>
            </div>
            {trade.setupDescription && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Setup Description</p>
                <p className="text-sm">{trade.setupDescription}</p>
              </div>
            )}
            {trade.indicatorsUsed && trade.indicatorsUsed.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Indicators Used</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {trade.indicatorsUsed.map((indicator: string) => (
                    <Badge key={indicator} variant="secondary" className="text-xs">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price & Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price & Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entry Price</p>
                <p className="font-semibold">${trade.entryPrice?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exit Price</p>
                <p className="font-semibold">${trade.exitPrice?.toFixed(2) || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Position Size</p>
              <p>{trade.positionSize}</p>
            </div>
            <div>
              <p className={`text-sm font-medium text-muted-foreground`}>Profit/Loss</p>
              <p className={`text-2xl font-bold ${(trade.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${(trade.profitLoss || 0).toFixed(2)}
              </p>
            </div>
            {trade.profitLossPercentage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">P&L Percentage</p>
                <p className={`font-semibold ${trade.profitLossPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {trade.profitLossPercentage.toFixed(2)}%
                </p>
              </div>
            )}
            {trade.holdingPeriod && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Holding Period</p>
                <p>{trade.holdingPeriod.toFixed(1)} hours</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Amount</p>
              <p className="font-semibold">${trade.riskAmount?.toFixed(2) || "N/A"}</p>
            </div>
            {trade.stopLossPrice && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stop Loss</p>
                <p>${trade.stopLossPrice.toFixed(2)}</p>
              </div>
            )}
            {trade.takeProfitPrice && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Take Profit</p>
                <p>${trade.takeProfitPrice.toFixed(2)}</p>
              </div>
            )}
            {trade.riskRewardRatio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk:Reward Ratio</p>
                <p className="font-semibold">1:{trade.riskRewardRatio.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Position Sizing Method</p>
              <p className="text-sm">{trade.positionSizingMethod}</p>
            </div>
          </CardContent>
        </Card>

        {/* Psychology */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Psychology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pre-Trade Emotion</p>
              <Badge variant="outline" className="capitalize">
                {trade.preTradeEmotion}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">During-Trade Emotion</p>
              <Badge variant="outline" className="capitalize">
                {trade.duringTradeEmotion}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Post-Trade Emotion</p>
              <Badge variant="outline" className="capitalize">
                {trade.postTradeEmotion}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Discipline Level</p>
              <p className="font-semibold">{trade.disciplineLevel}/10</p>
            </div>
            {trade.tradeRating && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trade Rating</p>
                <p className="font-semibold">{"⭐".repeat(trade.tradeRating)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Context */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Market Sentiment</p>
              <Badge variant="outline" className="capitalize">
                {trade.marketSentiment}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Session/Time</p>
              <p>{trade.sessionTimeOfDay}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Asset Class</p>
              <Badge variant="secondary" className="capitalize">
                {trade.assetClass}
              </Badge>
            </div>
            {trade.marketSector && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Market Sector</p>
                <p>{trade.marketSector}</p>
              </div>
            )}
            {trade.volatilityIndex && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility Index</p>
                <p>{trade.volatilityIndex}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(trade.tags || []).map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      {(trade.tradeNotes || trade.performanceNotes || trade.lessonsLearned || trade.mistakesMade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trade.tradeNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Trade Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{trade.tradeNotes}</p>
              </CardContent>
            </Card>
          )}

          {trade.performanceNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{trade.performanceNotes}</p>
              </CardContent>
            </Card>
          )}

          {trade.lessonsLearned && (
            <Card>
              <CardHeader>
                <CardTitle>Lessons Learned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{trade.lessonsLearned}</p>
              </CardContent>
            </Card>
          )}

          {trade.mistakesMade && (
            <Card>
              <CardHeader>
                <CardTitle>Mistakes Made</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{trade.mistakesMade}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
