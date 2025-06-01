"use client"

import { BacktestFormMultiStep } from "@/components/backtest-form-multi-step"
import { useRouter } from "next/navigation"

export default function AddTradePage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Add New Trade</h1>
        <p className="text-muted-foreground">Record a comprehensive backtest trade with detailed analysis</p>
      </div>

      <BacktestFormMultiStep onSuccess={() => router.push("/trades")} />
    </div>
  )
}
