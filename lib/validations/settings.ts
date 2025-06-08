import { z } from "zod"

// Enhanced Broker Schema
export const brokerSchema = z.object({
  name: z.string().min(1, "Broker name is required"),
  type: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures", "multi"]),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  apiEndpoint: z.string().url().optional().or(z.literal("")),
  commission: z.number().min(0).optional(),
  spreadType: z.enum(["fixed", "variable", "none"]).optional(),
  leverage: z.number().min(1).max(1000).optional(),
  minDeposit: z.number().min(0).optional(),
  supportedAssets: z.array(z.string()).optional().default([]),
  isActive: z.boolean().default(true),
})

// Enhanced Asset Schema
export const assetSchema = z.object({
  symbol: z.string().min(1, "Asset symbol is required"),
  name: z.string().min(1, "Asset name is required"),
  assetClass: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures", "index", "bond"]),
  exchange: z.string().optional(),
  description: z.string().optional(),
  tickSize: z.number().positive().optional(),
  contractSize: z.number().positive().optional(),
  currency: z.string().optional(),
  sector: z.string().optional(),
  marketHours: z.string().optional(),
  isActive: z.boolean().default(true),
})

// Strategy Schema
export const strategySchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional(),
  category: z.enum([
    "trend",
    "momentum",
    "reversal",
    "breakout",
    "scalping",
    "swing",
    "position",
    "arbitrage",
    "other",
  ]),
  timeframes: z.array(z.string()).min(1, "At least one timeframe is required"),
  riskLevel: z.enum(["very-low", "low", "medium", "high", "very-high"]),
  winRate: z.number().min(0).max(100).optional(),
  profitFactor: z.number().positive().optional(),
  maxDrawdown: z.number().min(0).max(100).optional(),
  parameters: z.record(z.string(), z.any()).optional().default({}),
  rules: z
    .object({
      entry: z.string().optional(),
      exit: z.string().optional(),
      stopLoss: z.string().optional(),
      takeProfit: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().default(true),
})

// Custom Field Schema
export const customFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Field label is required"),
  type: z.enum(["select", "multiselect", "text", "number", "boolean"]),
  options: z.array(z.string()).optional().default([]),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type BrokerFormData = z.infer<typeof brokerSchema>
export type AssetFormData = z.infer<typeof assetSchema>
export type StrategyFormData = z.infer<typeof strategySchema>
export type CustomFieldFormData = z.infer<typeof customFieldSchema>
