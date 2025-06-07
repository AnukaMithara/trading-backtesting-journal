import type { BacktestFormData } from "@/lib/validations/backtest"

const SAVED_TRADE_KEY = "last-successful-trade"

export function saveLastSuccessfulTrade(trade: BacktestFormData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SAVED_TRADE_KEY, JSON.stringify(trade))
  }
}

export function getLastSuccessfulTrade(): BacktestFormData | null {
  if (typeof window !== "undefined") {
    const savedTrade = localStorage.getItem(SAVED_TRADE_KEY)
    if (savedTrade) {
      try {
        return JSON.parse(savedTrade)
      } catch (error) {
        console.error("Error parsing saved trade:", error)
        return null
      }
    }
  }
  return null
}

export function clearLastSuccessfulTrade(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SAVED_TRADE_KEY)
  }
}

// Fields that should NOT be pre-filled from the last trade
export const EXCLUDE_FROM_PREFILL = [
  "tradeId",
  "entryDateTime",
  "exitDateTime",
  "chartScreenshot",
  "screenshots",
  "exitPrice",
  "exitReason",
  "performanceNotes",
  "lessonsLearned",
  "mistakesMade",
  "accountBalanceAfter",
]

// Fields that should be pre-filled but with a clear indication
export const HIGHLIGHT_PREFILLED = ["asset", "broker", "strategyName", "timeframe", "positionSizingMethod"]
