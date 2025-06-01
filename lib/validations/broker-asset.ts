import { z } from "zod"

export const brokerSchema = z.object({
  name: z.string().min(1, "Broker name is required"),
  type: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures", "multi"]),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const assetSchema = z.object({
  symbol: z.string().min(1, "Asset symbol is required"),
  name: z.string().min(1, "Asset name is required"),
  assetClass: z.enum(["stock", "forex", "crypto", "commodity", "options", "futures"]),
  exchange: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const exchangeSchema = z.object({
  name: z.string().min(1, "Exchange name is required"),
  code: z.string().min(1, "Exchange code is required"),
  country: z.string().min(1, "Country is required"),
  timezone: z.string().min(1, "Timezone is required"),
  assetClasses: z.array(z.string()).min(1, "At least one asset class is required"),
  isActive: z.boolean().default(true),
})

export type BrokerFormData = z.infer<typeof brokerSchema>
export type AssetFormData = z.infer<typeof assetSchema>
export type ExchangeFormData = z.infer<typeof exchangeSchema>
