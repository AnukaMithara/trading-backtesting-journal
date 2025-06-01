import { BacktestTable } from "@/components/backtest-table"

export default function TradesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
        <p className="text-muted-foreground">View and manage all your backtest trades</p>
      </div>

      <BacktestTable />
    </div>
  )
}
