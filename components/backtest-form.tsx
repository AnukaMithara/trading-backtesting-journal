"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { backtestSchema, backtestWithTagsSchema, type BacktestFormData } from "@/lib/validations/backtest"
import { useToast } from "@/hooks/use-toast"

interface BacktestFormProps {
  onSuccess?: () => void
}

export function BacktestForm({ onSuccess }: BacktestFormProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<BacktestFormData>({
    resolver: zodResolver(backtestSchema), // Use the schema without tags
  })

  // Watch form values for debugging
  const formValues = watch()

  const createBacktest = useMutation({
    mutationFn: async (data: BacktestFormData) => {
      // Combine form data with tags and validate the complete object
      const completeData = { ...data, tags }

      console.log("Validating complete data:", completeData)

      // Validate the complete data including tags
      const validatedData = backtestWithTagsSchema.parse(completeData)
      console.log("Validation successful:", validatedData)

      console.log("Submitting backtest data:", validatedData)

      const response = await fetch("/api/backtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Response error:", errorData)
        throw new Error(`Failed to create backtest: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Success result:", result)
      return result
    },
    onSuccess: (data) => {
      console.log("Mutation success:", data)
      queryClient.invalidateQueries({ queryKey: ["backtests"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({
        title: "Success",
        description: "Backtest created successfully",
      })
      reset()
      setTags([])
      setSubmitError(null)
      onSuccess?.()
    },
    onError: (error) => {
      console.error("Mutation error:", error)
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

  const onSubmit = (data: BacktestFormData) => {
    console.log("Form submitted with data:", data)
    console.log("Tags:", tags)
    console.log("Form errors:", errors)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Backtest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tradeId">Trade ID</Label>
              <Input id="tradeId" {...register("tradeId")} placeholder="Enter trade ID" />
              {errors.tradeId && <p className="text-sm text-red-500">{errors.tradeId.message}</p>}
            </div>

            <div>
              <Label htmlFor="entryDateTime">Date/Time</Label>
              <Input id="entryDateTime" type="datetime-local" {...register("entryDateTime")} />
              {errors.entryDateTime && <p className="text-sm text-red-500">{errors.entryDateTime.message}</p>}
            </div>

            <div>
              <Label htmlFor="asset">Asset</Label>
              <Input id="asset" {...register("asset")} placeholder="e.g., AAPL, EUR/USD, BTC" />
              {errors.asset && <p className="text-sm text-red-500">{errors.asset.message}</p>}
            </div>

            <div>
              <Label htmlFor="strategyName">Strategy</Label>
              <Input id="strategyName" {...register("strategyName")} placeholder="e.g., Moving Average, RSI" />
              {errors.strategyName && <p className="text-sm text-red-500">{errors.strategyName.message}</p>}
            </div>

            <div>
              <Label htmlFor="entryPrice">Entry Price</Label>
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
              <Label htmlFor="positionSize">Position Size</Label>
              <Input
                id="positionSize"
                type="number"
                step="0.01"
                {...register("positionSize", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.positionSize && <p className="text-sm text-red-500">{errors.positionSize.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="tradeNotes" {...register("tradeNotes")} placeholder="Trading observations and notes..." rows={3} />
          </div>

          <div>
            <Label>Tags</Label>
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

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createBacktest.isPending}>
            {createBacktest.isPending ? "Creating..." : "Create Backtest"}
          </Button>

          {/* Debug info - remove in production */}
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">Debug Info</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify({ formValues, tags, errors, tagsCount: tags.length }, null, 2)}
            </pre>
          </details>
        </form>
      </CardContent>
    </Card>
  )
}
