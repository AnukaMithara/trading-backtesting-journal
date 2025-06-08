"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Calculator, TrendingUp, TrendingDown, RefreshCw, LinkIcon } from "lucide-react"
import { unifiedTradeSchema, type UnifiedTradeFormData } from "@/lib/validations/unified-trade"
import { useToast } from "@/hooks/use-toast"
import { generateTradeId } from "@/lib/utils/trade-id"

interface UnifiedTradeFormProps {
  onSuccess?: () => void
}

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="flex items-center gap-1 text-sm font-medium">
    {children}
    <span className="text-red-500">*</span>
  </Label>
)

export function UnifiedTradeForm({ onSuccess }: UnifiedTradeFormProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [reportLinks, setReportLinks] = useState<string[]>([])
  const [linkInput, setLinkInput] = useState("")
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch brokers and assets
  const { data: brokers = [] } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const response = await fetch("/api/brokers")
      if (!response.ok) throw new Error("Failed to fetch brokers")
      return response.json()
    },
  })

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets")
      if (!response.ok) throw new Error("Failed to fetch assets")
      return response.json()
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<UnifiedTradeFormData>({
    resolver: zodResolver(unifiedTradeSchema),
    defaultValues: {
      tradeId: generateTradeId(),
      entryTime: new Date().toISOString().slice(0, 16),
      entryType: "market",
      type: "long",
      timeFrame: "1h",
      leverage: 1,
      risk: "medium",
      preMarketMentality: "confident",
      postMarketMentality: "satisfied",
      reportLinks: [],
      tags: [],
    },
  })

  const formValues = watch()

  // Auto-calculate P&L and ROI when relevant fields change
  useEffect(() => {
    if (autoCalculate && formValues.entry && formValues.close && formValues.leverage) {
      const entry = formValues.entry
      const close = formValues.close
      const leverage = formValues.leverage || 1
      const isLong = formValues.type === "long"

      // Calculate P&L
      let pnl = 0
      if (isLong) {
        pnl = ((close - entry) / entry) * 100 * leverage
      } else {
        pnl = ((entry - close) / entry) * 100 * leverage
      }

      // Calculate ROI (assuming position size of 1 for simplicity)
      const roi = pnl

      setValue("netPL", Number(pnl.toFixed(2)))
      setValue("roi", Number(roi.toFixed(2)))
    }
  }, [formValues.entry, formValues.close, formValues.leverage, formValues.type, autoCalculate, setValue])

  const createTrade = useMutation({
    mutationFn: async (data: UnifiedTradeFormData) => {
      console.log("Submitting unified trade data:", data)

      const completeData = {
        ...data,
        tags: tags.filter((tag) => tag.trim() !== ""),
        reportLinks: reportLinks.filter((link) => link.trim() !== ""),
      }

      const validatedData = unifiedTradeSchema.parse(completeData)

      const response = await fetch("/api/unified-trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${errorText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({
        title: "Success",
        description: "Trade submitted successfully",
      })
      reset({
        tradeId: generateTradeId(),
        entryTime: new Date().toISOString().slice(0, 16),
        entryType: "market",
        type: "long",
        timeFrame: "1h",
        leverage: 1,
        risk: "medium",
        preMarketMentality: "confident",
        postMarketMentality: "satisfied",
        reportLinks: [],
        tags: [],
      })
      setTags([])
      setReportLinks([])
      setSubmitError(null)
      onSuccess?.()
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit trade"
      setSubmitError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const addReportLink = () => {
    if (linkInput.trim() && !reportLinks.includes(linkInput.trim())) {
      try {
        new URL(linkInput.trim()) // Validate URL
        setReportLinks([...reportLinks, linkInput.trim()])
        setLinkInput("")
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "destructive",
        })
      }
    }
  }

  const removeReportLink = (linkToRemove: string) => {
    setReportLinks(reportLinks.filter((link) => link !== linkToRemove))
  }

  const generateNewTradeId = () => {
    setValue("tradeId", generateTradeId())
  }

  const onSubmit = (data: UnifiedTradeFormData) => {
    if (tags.length === 0) {
      setSubmitError("Please add at least one tag")
      toast({
        title: "Error",
        description: "Please add at least one tag",
        variant: "destructive",
      })
      return
    }

    setSubmitError(null)
    createTrade.mutate(data)
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Unified Trade Submission
        </CardTitle>
        <CardDescription>Complete trade entry form with all essential parameters in one place</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Trade Identification Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Trade Identification</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <RequiredLabel>Trade ID</RequiredLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={generateNewTradeId}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <Input {...register("tradeId")} placeholder="TRD-20241208-0001" />
                {errors.tradeId && <p className="text-sm text-red-500">{errors.tradeId.message}</p>}
              </div>

              <div>
                <RequiredLabel>Asset</RequiredLabel>
                <Select onValueChange={(value) => setValue("asset", value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset: any) => (
                      <SelectItem key={asset._id} value={asset.symbol}>
                        {asset.symbol} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.asset && <p className="text-sm text-red-500">{errors.asset.message}</p>}
              </div>

              <div>
                <RequiredLabel>Broker</RequiredLabel>
                <Select onValueChange={(value) => setValue("broker", value)} defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map((broker: any) => (
                      <SelectItem key={broker._id} value={broker.name}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.broker && <p className="text-sm text-red-500">{errors.broker.message}</p>}
              </div>
            </div>
          </div>

          {/* Trade Execution Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Trade Execution</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <RequiredLabel>Entry Time</RequiredLabel>
                <Input type="datetime-local" {...register("entryTime")} />
                {errors.entryTime && <p className="text-sm text-red-500">{errors.entryTime.message}</p>}
              </div>

              <div>
                <Label>Exit Time</Label>
                <Input type="datetime-local" {...register("exitTime")} />
              </div>

              <div>
                <RequiredLabel>Entry Type</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("entryType", value as any)}
                  defaultValue={formValues.entryType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                    <SelectItem value="stop">Stop Order</SelectItem>
                    <SelectItem value="stop-limit">Stop-Limit Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <RequiredLabel>Trade Type</RequiredLabel>
                <Select onValueChange={(value) => setValue("type", value as any)} defaultValue={formValues.type}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Long
                      </div>
                    </SelectItem>
                    <SelectItem value="short">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Short
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <RequiredLabel>Entry Price</RequiredLabel>
                <Input type="number" step="0.01" {...register("entry", { valueAsNumber: true })} placeholder="0.00" />
                {errors.entry && <p className="text-sm text-red-500">{errors.entry.message}</p>}
              </div>

              <div>
                <Label>Close Price</Label>
                <Input type="number" step="0.01" {...register("close", { valueAsNumber: true })} placeholder="0.00" />
              </div>

              <div>
                <RequiredLabel>Time Frame</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("timeFrame", value as any)}
                  defaultValue={formValues.timeFrame}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Leverage</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  {...register("leverage", { valueAsNumber: true })}
                  placeholder="1"
                />
                {errors.leverage && <p className="text-sm text-red-500">{errors.leverage.message}</p>}
              </div>
            </div>
          </div>

          {/* Risk Management Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Risk Management</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Stop Loss</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("stopLoss", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Take Profit</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("takeProfit", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Exit Logic</Label>
                <Select onValueChange={(value) => setValue("exitLogic", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exit logic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loss-exit">Loss Exit</SelectItem>
                    <SelectItem value="profit-exit">Profit Exit</SelectItem>
                    <SelectItem value="tsl-hit">TSL Hit</SelectItem>
                    <SelectItem value="tp-hit">TP Hit</SelectItem>
                    <SelectItem value="sl-hit">SL Hit</SelectItem>
                    <SelectItem value="manual">Manual Exit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <RequiredLabel>Risk Level</RequiredLabel>
                <Select onValueChange={(value) => setValue("risk", value as any)} defaultValue={formValues.risk}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-low">Very Low</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="very-high">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Financial Metrics Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Financial Metrics</h3>
              <div className="flex items-center gap-2 ml-auto">
                <Label htmlFor="auto-calculate" className="text-sm">
                  Auto-calculate
                </Label>
                <Switch id="auto-calculate" checked={autoCalculate} onCheckedChange={setAutoCalculate} />
              </div>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Net P&L (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("netPL", { valueAsNumber: true })}
                    placeholder="0.00"
                    readOnly={autoCalculate}
                    className={autoCalculate ? "bg-gray-50" : ""}
                  />
                  {autoCalculate && (
                    <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              <div>
                <Label>ROI (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("roi", { valueAsNumber: true })}
                    placeholder="0.00"
                    readOnly={autoCalculate}
                    className={autoCalculate ? "bg-gray-50" : ""}
                  />
                  {autoCalculate && (
                    <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy & Psychology Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Strategy & Psychology</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel>Setup Description</RequiredLabel>
                <Textarea
                  {...register("setup")}
                  placeholder="Describe your trade setup, entry criteria, and reasoning..."
                  rows={3}
                />
                {errors.setup && <p className="text-sm text-red-500">{errors.setup.message}</p>}
              </div>

              <div>
                <Label>Money Management Strategy</Label>
                <Textarea
                  {...register("moneyManagement")}
                  placeholder="Describe your position sizing and money management approach..."
                  rows={3}
                />
              </div>

              <div>
                <RequiredLabel>Pre-Market Mentality</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("preMarketMentality", value as any)}
                  defaultValue={formValues.preMarketMentality}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="uncertain">Uncertain</SelectItem>
                    <SelectItem value="focused">Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <RequiredLabel>Post-Market Mentality</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("postMarketMentality", value as any)}
                  defaultValue={formValues.postMarketMentality}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satisfied">Satisfied</SelectItem>
                    <SelectItem value="disappointed">Disappointed</SelectItem>
                    <SelectItem value="relieved">Relieved</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="proud">Proud</SelectItem>
                    <SelectItem value="regretful">Regretful</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reports & Documentation Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Reports & Documentation</h3>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Report Links</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://example.com/report.pdf"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addReportLink())}
                  />
                  <Button type="button" onClick={addReportLink} variant="outline">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportLinks.map((link, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 max-w-xs">
                      <LinkIcon className="h-3 w-3" />
                      <span className="truncate">{link}</span>
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeReportLink(link)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <RequiredLabel>Tags</RequiredLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag (e.g., breakout, momentum)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                {tags.length === 0 && <p className="text-sm text-red-500">At least one tag is required</p>}
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Any additional observations, lessons learned, or important notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  tradeId: generateTradeId(),
                  entryTime: new Date().toISOString().slice(0, 16),
                  entryType: "market",
                  type: "long",
                  timeFrame: "1h",
                  leverage: 1,
                  risk: "medium",
                  preMarketMentality: "confident",
                  postMarketMentality: "satisfied",
                  reportLinks: [],
                  tags: [],
                })
                setTags([])
                setReportLinks([])
              }}
            >
              Reset Form
            </Button>
            <Button type="submit" disabled={createTrade.isPending} className="min-w-32">
              {createTrade.isPending ? "Submitting..." : "Submit Trade"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
