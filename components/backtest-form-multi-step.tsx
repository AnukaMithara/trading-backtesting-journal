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
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, ChevronLeft, ChevronRight, RefreshCw, Info, Copy } from "lucide-react"
import { backtestSchema, backtestWithTagsSchema, type BacktestFormData } from "@/lib/validations/backtest"
import { useToast } from "@/hooks/use-toast"
import {
  saveLastSuccessfulTrade,
  getLastSuccessfulTrade,
  EXCLUDE_FROM_PREFILL,
  HIGHLIGHT_PREFILLED,
} from "@/lib/utils/saved-trade"
import { generateTradeId } from "@/lib/utils/trade-id"

interface BacktestFormProps {
  onSuccess?: () => void
}

const STEPS = [
  { id: 1, title: "Trade Identification", description: "Basic trade information" },
  { id: 2, title: "Strategy & Setup", description: "Trading strategy and setup details" },
  { id: 3, title: "Execution & Risk", description: "Trade execution and risk management" },
  { id: 4, title: "Psychology & Context", description: "Emotional factors and market context" },
  { id: 5, title: "Portfolio & Notes", description: "Account tracking and additional notes" },
]

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="flex items-center gap-1">
    {children}
    <span className="text-red-500">*</span>
  </Label>
)

const PrefilledLabel = ({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) => (
  <Label className="flex items-center gap-1">
    {children}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-xs font-normal px-1 py-0 h-5 bg-blue-50">
            <Info className="h-3 w-3 mr-1 text-blue-500" />
            Pre-filled
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip || "This field is pre-filled from your last successful trade"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </Label>
)

export function BacktestFormMultiStep({ onSuccess }: BacktestFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [indicators, setIndicators] = useState<string[]>([])
  const [indicatorInput, setIndicatorInput] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [usePrefill, setUsePrefill] = useState(true)
  const [hasPrefilled, setHasPrefilled] = useState(false)
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

  const { data: exchanges = [] } = useQuery({
    queryKey: ["exchanges"],
    queryFn: async () => {
      const response = await fetch("/api/exchanges")
      if (!response.ok) throw new Error("Failed to fetch exchanges")
      return response.json()
    },
  })

  // Get default values from last successful trade or use initial defaults
  const getDefaultValues = (): Partial<BacktestFormData> => {
    const lastTrade = getLastSuccessfulTrade()

    // Base default values that are always used
    const baseDefaults: Partial<BacktestFormData> = {
      tradeId: generateTradeId(),
      entryDateTime: new Date().toISOString().slice(0, 16),
      tradeType: "long",
      accountType: "live",
      marketCondition: "trending",
      orderType: "market",
      preTradeEmotion: "confident",
      duringTradeEmotion: "calm",
      postTradeEmotion: "satisfied",
      disciplineLevel: 5,
      marketSentiment: "neutral",
      assetClass: "stock",
      tradeRating: 3,
    }

    // If we have a last trade and user wants to use prefill
    if (lastTrade && usePrefill) {
      const prefillValues: Partial<BacktestFormData> = {}

      // Copy values from last trade, excluding specific fields
      Object.keys(lastTrade).forEach((key) => {
        const typedKey = key as keyof BacktestFormData
        if (!EXCLUDE_FROM_PREFILL.includes(typedKey)) {
          prefillValues[typedKey] = lastTrade[typedKey]
        }
      })

      // Merge with base defaults, with prefill taking precedence
      return { ...baseDefaults, ...prefillValues }
    }

    return baseDefaults
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm<BacktestFormData>({
    resolver: zodResolver(backtestSchema),
    defaultValues: getDefaultValues(),
  })

  // Initialize tags and indicators from last trade
  useEffect(() => {
    const lastTrade = getLastSuccessfulTrade()
    if (lastTrade && usePrefill) {
      // Set tags from last trade if available
      if (lastTrade.tags && Array.isArray(lastTrade.tags)) {
        setTags(lastTrade.tags)
      }

      // Set indicators from last trade if available
      if (lastTrade.indicatorsUsed && Array.isArray(lastTrade.indicatorsUsed)) {
        setIndicators(lastTrade.indicatorsUsed)
      }

      setHasPrefilled(true)
    }
  }, [usePrefill])

  // Generate a new trade ID
  const generateNewTradeId = () => {
    setValue("tradeId", generateTradeId())
  }

  // Reset form to default values
  const resetForm = () => {
    reset(getDefaultValues())
    setTags([])
    setIndicators([])
    setHasPrefilled(false)

    toast({
      title: "Form Reset",
      description: "All fields have been reset to default values",
    })
  }

  // Toggle prefill option
  const togglePrefill = () => {
    const newPrefillState = !usePrefill
    setUsePrefill(newPrefillState)

    if (newPrefillState && !hasPrefilled) {
      // Apply prefill values
      const lastTrade = getLastSuccessfulTrade()
      if (lastTrade) {
        const prefillValues: Partial<BacktestFormData> = {}

        Object.keys(lastTrade).forEach((key) => {
          const typedKey = key as keyof BacktestFormData
          if (!EXCLUDE_FROM_PREFILL.includes(typedKey)) {
            prefillValues[typedKey] = lastTrade[typedKey]
          }
        })

        // Reset with prefill values
        reset({ ...getValues(), ...prefillValues })

        // Set tags and indicators
        if (lastTrade.tags && Array.isArray(lastTrade.tags)) {
          setTags(lastTrade.tags)
        }

        if (lastTrade.indicatorsUsed && Array.isArray(lastTrade.indicatorsUsed)) {
          setIndicators(lastTrade.indicatorsUsed)
        }

        setHasPrefilled(true)

        toast({
          title: "Values Pre-filled",
          description: "Form has been pre-filled with values from your last trade",
        })
      }
    } else if (!newPrefillState) {
      // Reset to base defaults
      const currentTradeId = getValues("tradeId")
      const currentEntryDateTime = getValues("entryDateTime")

      reset({
        tradeId: currentTradeId,
        entryDateTime: currentEntryDateTime,
        tradeType: "long",
        accountType: "live",
        marketCondition: "trending",
        orderType: "market",
        preTradeEmotion: "confident",
        duringTradeEmotion: "calm",
        postTradeEmotion: "satisfied",
        disciplineLevel: 5,
        marketSentiment: "neutral",
        assetClass: "stock",
        tradeRating: 3,
      })

      setTags([])
      setIndicators([])

      toast({
        title: "Pre-fill Disabled",
        description: "Form has been reset to default values",
      })
    }
  }

  const formValues = watch()

  const createBacktest = useMutation({
    mutationFn: async (data: BacktestFormData) => {
      const completeData = { ...data, tags, indicatorsUsed: indicators }
      const validatedData = backtestWithTagsSchema.parse(completeData)

      const response = await fetch("/api/backtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to create backtest: ${response.status} - ${errorData}`)
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Save the successful trade data for future pre-fill
      saveLastSuccessfulTrade({ ...variables, tags, indicatorsUsed: indicators })

      queryClient.invalidateQueries({ queryKey: ["backtests"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({
        title: "Success",
        description: "Backtest created successfully",
      })
      reset()
      setTags([])
      setIndicators([])
      setCurrentStep(1)
      setSubmitError(null)
      onSuccess?.()
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to create backtest"
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

  const addIndicator = () => {
    if (indicatorInput.trim() && !indicators.includes(indicatorInput.trim())) {
      setIndicators([...indicators, indicatorInput.trim()])
      setIndicatorInput("")
    }
  }

  const removeIndicator = (indicatorToRemove: string) => {
    setIndicators(indicators.filter((indicator) => indicator !== indicatorToRemove))
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await trigger(fieldsToValidate)

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step: number): (keyof BacktestFormData)[] => {
    switch (step) {
      case 1:
        return ["tradeId", "entryDateTime", "asset", "tradeType", "broker", "accountType"]
      case 2:
        return ["strategyName", "timeframe", "marketCondition"]
      case 3:
        return ["entryPrice", "positionSize", "orderType", "riskAmount", "positionSizingMethod"]
      case 4:
        return [
          "preTradeEmotion",
          "duringTradeEmotion",
          "postTradeEmotion",
          "disciplineLevel",
          "marketSentiment",
          "sessionTimeOfDay",
        ]
      case 5:
        return ["assetClass", "accountBalanceBefore"]
      default:
        return []
    }
  }

  const onSubmit = (data: BacktestFormData) => {
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
    createBacktest.mutate(data)
  }

  // Check if a field should show the prefilled indicator
  const isPrefilledField = (fieldName: keyof BacktestFormData): boolean => {
    if (!usePrefill || !hasPrefilled) return false

    const lastTrade = getLastSuccessfulTrade()
    if (!lastTrade) return false

    return HIGHLIGHT_PREFILLED.includes(fieldName) && fieldName in lastTrade && lastTrade[fieldName] !== undefined
  }

  // Duplicate last trade with a new ID
  const duplicateLastTrade = () => {
    const lastTrade = getLastSuccessfulTrade()
    if (!lastTrade) {
      toast({
        title: "No Previous Trade",
        description: "There is no previous trade data to duplicate",
        variant: "destructive",
      })
      return
    }

    // Create a duplicate with new ID and current timestamp
    const duplicatedTrade = {
      ...lastTrade,
      tradeId: generateTradeId(),
      entryDateTime: new Date().toISOString().slice(0, 16),
      exitDateTime: undefined,
      exitPrice: undefined,
      exitReason: undefined,
      performanceNotes: undefined,
      lessonsLearned: undefined,
      mistakesMade: undefined,
      accountBalanceAfter: undefined,
    }

    // Reset form with duplicated values
    reset(duplicatedTrade)

    // Set tags and indicators
    if (lastTrade.tags && Array.isArray(lastTrade.tags)) {
      setTags([...lastTrade.tags])
    }

    if (lastTrade.indicatorsUsed && Array.isArray(lastTrade.indicatorsUsed)) {
      setIndicators([...lastTrade.indicatorsUsed])
    }

    setHasPrefilled(true)
    setUsePrefill(true)

    toast({
      title: "Trade Duplicated",
      description: "Previous trade has been duplicated with a new ID",
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Trade Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input id="tradeId" {...register("tradeId")} placeholder="Enter trade ID" />
                {errors.tradeId && <p className="text-sm text-red-500">{errors.tradeId.message}</p>}
              </div>

              <div>
                <RequiredLabel>Entry Date & Time</RequiredLabel>
                <Input id="entryDateTime" type="datetime-local" {...register("entryDateTime")} />
                {errors.entryDateTime && <p className="text-sm text-red-500">{errors.entryDateTime.message}</p>}
              </div>

              <div>
                <Label htmlFor="exitDateTime">Exit Date & Time</Label>
                <Input id="exitDateTime" type="datetime-local" {...register("exitDateTime")} />
              </div>

              <div>
                {isPrefilledField("asset") ? (
                  <PrefilledLabel>Asset</PrefilledLabel>
                ) : (
                  <RequiredLabel>Asset</RequiredLabel>
                )}
                <Select onValueChange={(value) => setValue("asset", value)} defaultValue={formValues.asset || ""}>
                  <SelectTrigger className={isPrefilledField("asset") ? "border-blue-300 bg-blue-50" : ""}>
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
                <RequiredLabel>Trade Type</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("tradeType", value as any)}
                  defaultValue={formValues.tradeType || "long"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="call">Call Option</SelectItem>
                    <SelectItem value="put">Put Option</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tradeType && <p className="text-sm text-red-500">{errors.tradeType.message}</p>}
              </div>

              <div>
                {isPrefilledField("broker") ? (
                  <PrefilledLabel>Broker/Exchange</PrefilledLabel>
                ) : (
                  <RequiredLabel>Broker/Exchange</RequiredLabel>
                )}
                <Select onValueChange={(value) => setValue("broker", value)} defaultValue={formValues.broker || ""}>
                  <SelectTrigger className={isPrefilledField("broker") ? "border-blue-300 bg-blue-50" : ""}>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map((broker: any) => (
                      <SelectItem key={broker._id} value={broker.name}>
                        {broker.name} ({broker.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.broker && <p className="text-sm text-red-500">{errors.broker.message}</p>}
              </div>

              <div>
                <RequiredLabel>Account Type</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("accountType", value as any)}
                  defaultValue={formValues.accountType || "live"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="margin">Margin</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
                {errors.accountType && <p className="text-sm text-red-500">{errors.accountType.message}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Strategy & Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {isPrefilledField("strategyName") ? (
                  <PrefilledLabel>Strategy Name</PrefilledLabel>
                ) : (
                  <RequiredLabel>Strategy Name</RequiredLabel>
                )}
                <Input
                  id="strategyName"
                  {...register("strategyName")}
                  placeholder="e.g., Breakout, Mean Reversion"
                  className={isPrefilledField("strategyName") ? "border-blue-300 bg-blue-50" : ""}
                />
                {errors.strategyName && <p className="text-sm text-red-500">{errors.strategyName.message}</p>}
              </div>

              <div>
                {isPrefilledField("timeframe") ? (
                  <PrefilledLabel>Timeframe</PrefilledLabel>
                ) : (
                  <RequiredLabel>Timeframe</RequiredLabel>
                )}
                <Input
                  id="timeframe"
                  {...register("timeframe")}
                  placeholder="e.g., 1H, 4H, Daily"
                  className={isPrefilledField("timeframe") ? "border-blue-300 bg-blue-50" : ""}
                />
                {errors.timeframe && <p className="text-sm text-red-500">{errors.timeframe.message}</p>}
              </div>

              <div>
                <RequiredLabel>Market Condition</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("marketCondition", value as any)}
                  defaultValue={formValues.marketCondition || "trending"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="ranging">Ranging</SelectItem>
                    <SelectItem value="volatile">Volatile</SelectItem>
                    <SelectItem value="low-liquidity">Low Liquidity</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marketCondition && <p className="text-sm text-red-500">{errors.marketCondition.message}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="setupDescription">Setup Description</Label>
                <Textarea
                  id="setupDescription"
                  {...register("setupDescription")}
                  placeholder="Describe the trade setup..."
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="entryTrigger">Entry Trigger</Label>
                <Textarea
                  id="entryTrigger"
                  {...register("entryTrigger")}
                  placeholder="What triggered the entry..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Indicators Used</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={indicatorInput}
                    onChange={(e) => setIndicatorInput(e.target.value)}
                    placeholder="Add an indicator"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIndicator())}
                  />
                  <Button type="button" onClick={addIndicator} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {indicators.map((indicator) => (
                    <Badge key={indicator} variant="secondary" className="flex items-center gap-1">
                      {indicator}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeIndicator(indicator)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="fundamentalAnalysis">Fundamental Analysis</Label>
                <Textarea
                  id="fundamentalAnalysis"
                  {...register("fundamentalAnalysis")}
                  placeholder="Any fundamental factors..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Execution & Risk Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel>Entry Price</RequiredLabel>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  {...register("entryPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.entryPrice && <p className="text-sm text-red-500">{errors.entryPrice.message}</p>}
              </div>

              <div>
                <Label htmlFor="exitPrice">Exit Price</Label>
                <Input
                  id="exitPrice"
                  type="number"
                  step="0.01"
                  {...register("exitPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.exitPrice && <p className="text-sm text-red-500">{errors.exitPrice.message}</p>}
              </div>

              <div>
                <RequiredLabel>Position Size</RequiredLabel>
                <Input
                  id="positionSize"
                  type="number"
                  step="0.01"
                  {...register("positionSize", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.positionSize && <p className="text-sm text-red-500">{errors.positionSize.message}</p>}
              </div>

              <div>
                <RequiredLabel>Order Type</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("orderType", value as any)}
                  defaultValue={formValues.orderType || "market"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop-limit">Stop Limit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.orderType && <p className="text-sm text-red-500">{errors.orderType.message}</p>}
              </div>

              <div>
                <Label htmlFor="stopLossPrice">Stop Loss Price</Label>
                <Input
                  id="stopLossPrice"
                  type="number"
                  step="0.01"
                  {...register("stopLossPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="takeProfitPrice">Take Profit Price</Label>
                <Input
                  id="takeProfitPrice"
                  type="number"
                  step="0.01"
                  {...register("takeProfitPrice", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <RequiredLabel>Risk Amount ($)</RequiredLabel>
                <Input
                  id="riskAmount"
                  type="number"
                  step="0.01"
                  {...register("riskAmount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.riskAmount && <p className="text-sm text-red-500">{errors.riskAmount.message}</p>}
              </div>

              <div>
                {isPrefilledField("positionSizingMethod") ? (
                  <PrefilledLabel>Position Sizing Method</PrefilledLabel>
                ) : (
                  <RequiredLabel>Position Sizing Method</RequiredLabel>
                )}
                <Input
                  id="positionSizingMethod"
                  {...register("positionSizingMethod")}
                  placeholder="e.g., Fixed %, Kelly Criterion"
                  className={isPrefilledField("positionSizingMethod") ? "border-blue-300 bg-blue-50" : ""}
                />
                {errors.positionSizingMethod && (
                  <p className="text-sm text-red-500">{errors.positionSizingMethod.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="commissionFees">Commission/Fees ($)</Label>
                <Input
                  id="commissionFees"
                  type="number"
                  step="0.01"
                  {...register("commissionFees", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="slippage">Slippage ($)</Label>
                <Input
                  id="slippage"
                  type="number"
                  step="0.01"
                  {...register("slippage", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="mae">Maximum Adverse Excursion ($)</Label>
                <Input
                  id="mae"
                  type="number"
                  step="0.01"
                  {...register("mae", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="mfe">Maximum Favorable Excursion ($)</Label>
                <Input
                  id="mfe"
                  type="number"
                  step="0.01"
                  {...register("mfe", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="riskNotes">Risk Management Notes</Label>
                <Textarea
                  id="riskNotes"
                  {...register("riskNotes")}
                  placeholder="Risk management observations..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Psychology & Market Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel>Pre-Trade Emotion</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("preTradeEmotion", value as any)}
                  defaultValue={formValues.preTradeEmotion || "confident"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confident">Confident</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="hesitant">Hesitant</SelectItem>
                    <SelectItem value="excited">Excited</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                  </SelectContent>
                </Select>
                {errors.preTradeEmotion && <p className="text-sm text-red-500">{errors.preTradeEmotion.message}</p>}
              </div>

              <div>
                <RequiredLabel>During-Trade Emotion</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("duringTradeEmotion", value as any)}
                  defaultValue={formValues.duringTradeEmotion || "calm"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stressed">Stressed</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="overconfident">Overconfident</SelectItem>
                    <SelectItem value="nervous">Nervous</SelectItem>
                    <SelectItem value="focused">Focused</SelectItem>
                  </SelectContent>
                </Select>
                {errors.duringTradeEmotion && (
                  <p className="text-sm text-red-500">{errors.duringTradeEmotion.message}</p>
                )}
              </div>

              <div>
                <RequiredLabel>Post-Trade Emotion</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("postTradeEmotion", value as any)}
                  defaultValue={formValues.postTradeEmotion || "satisfied"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satisfied">Satisfied</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="regretful">Regretful</SelectItem>
                    <SelectItem value="proud">Proud</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                {errors.postTradeEmotion && <p className="text-sm text-red-500">{errors.postTradeEmotion.message}</p>}
              </div>

              <div>
                <RequiredLabel>Discipline Level (1-10)</RequiredLabel>
                <div className="px-3">
                  <Slider
                    value={[formValues.disciplineLevel || 5]}
                    onValueChange={(value) => setValue("disciplineLevel", value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1</span>
                    <span>Current: {formValues.disciplineLevel || 5}</span>
                    <span>10</span>
                  </div>
                </div>
                {errors.disciplineLevel && <p className="text-sm text-red-500">{errors.disciplineLevel.message}</p>}
              </div>

              <div>
                <RequiredLabel>Market Sentiment</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("marketSentiment", value as any)}
                  defaultValue={formValues.marketSentiment || "neutral"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bullish">Bullish</SelectItem>
                    <SelectItem value="bearish">Bearish</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marketSentiment && <p className="text-sm text-red-500">{errors.marketSentiment.message}</p>}
              </div>

              <div>
                <RequiredLabel>Session/Time of Day</RequiredLabel>
                <Input
                  id="sessionTimeOfDay"
                  {...register("sessionTimeOfDay")}
                  placeholder="e.g., London Open, NY Close"
                />
                {errors.sessionTimeOfDay && <p className="text-sm text-red-500">{errors.sessionTimeOfDay.message}</p>}
              </div>

              <div>
                <Label htmlFor="volatilityIndex">Volatility Index (VIX)</Label>
                <Input
                  id="volatilityIndex"
                  type="number"
                  step="0.01"
                  {...register("volatilityIndex", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="tradeRating">Trade Rating (1-5 stars)</Label>
                <div className="px-3">
                  <Slider
                    value={[formValues.tradeRating || 3]}
                    onValueChange={(value) => setValue("tradeRating", value[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>1⭐</span>
                    <span>Current: {formValues.tradeRating || 3}⭐</span>
                    <span>5⭐</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="economicEvents">Economic Events</Label>
                <Textarea
                  id="economicEvents"
                  {...register("economicEvents")}
                  placeholder="Relevant economic events..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="mistakesMade">Mistakes Made</Label>
                <Textarea
                  id="mistakesMade"
                  {...register("mistakesMade")}
                  placeholder="Any mistakes or errors..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="lessonsLearned">Lessons Learned</Label>
                <Textarea id="lessonsLearned" {...register("lessonsLearned")} placeholder="Key takeaways..." rows={2} />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Portfolio & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel>Asset Class</RequiredLabel>
                <Select
                  onValueChange={(value) => setValue("assetClass", value as any)}
                  defaultValue={formValues.assetClass || "stock"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="commodity">Commodity</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                  </SelectContent>
                </Select>
                {errors.assetClass && <p className="text-sm text-red-500">{errors.assetClass.message}</p>}
              </div>

              <div>
                <Label htmlFor="marketSector">Market Sector</Label>
                <Input id="marketSector" {...register("marketSector")} placeholder="e.g., Technology, Healthcare" />
              </div>

              <div>
                <RequiredLabel>Account Balance Before ($)</RequiredLabel>
                <Input
                  id="accountBalanceBefore"
                  type="number"
                  step="0.01"
                  {...register("accountBalanceBefore", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.accountBalanceBefore && (
                  <p className="text-sm text-red-500">{errors.accountBalanceBefore.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountBalanceAfter">Account Balance After ($)</Label>
                <Input
                  id="accountBalanceAfter"
                  type="number"
                  step="0.01"
                  {...register("accountBalanceAfter", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="portfolioAllocation">Portfolio Allocation (%)</Label>
                <Input
                  id="portfolioAllocation"
                  type="number"
                  step="0.01"
                  {...register("portfolioAllocation", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="exitReason">Exit Reason</Label>
                <Input id="exitReason" {...register("exitReason")} placeholder="e.g., Hit stop loss, Take profit" />
              </div>

              <div className="md:col-span-2">
                <RequiredLabel>Tags</RequiredLabel>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
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

              <div className="md:col-span-2">
                <Label htmlFor="tradeNotes">Trade Notes</Label>
                <Textarea
                  id="tradeNotes"
                  {...register("tradeNotes")}
                  placeholder="Additional notes and observations..."
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="performanceNotes">Performance Notes</Label>
                <Textarea
                  id="performanceNotes"
                  {...register("performanceNotes")}
                  placeholder="Performance observations..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add New Backtest</CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={duplicateLastTrade}>
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate Last
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new trade based on your last successful trade</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all fields to default values</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.id}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {STEPS.find((step) => step.id === currentStep)?.description}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Use pre-filled values</span>
            <Switch checked={usePrefill} onCheckedChange={togglePrefill} id="use-prefill" />
          </div>
        </div>

        {usePrefill && hasPrefilled && (
          <CardDescription className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md text-blue-700">
            <Info className="h-4 w-4 inline-block mr-1" />
            Some fields are pre-filled from your last successful trade. Pre-filled fields are highlighted in blue.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderStep()}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createBacktest.isPending}>
                {createBacktest.isPending ? "Creating..." : "Create Backtest"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
