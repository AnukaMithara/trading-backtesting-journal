export interface Broker {
  _id?: string
  name: string
  type: "stock" | "forex" | "crypto" | "commodity" | "options" | "futures" | "multi"
  website?: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Asset {
  _id?: string
  symbol: string
  name: string
  assetClass: "stock" | "forex" | "crypto" | "commodity" | "options" | "futures"
  exchange?: string
  description?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Exchange {
  _id?: string
  name: string
  code: string
  country: string
  timezone: string
  assetClasses: string[]
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}
