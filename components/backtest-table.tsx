import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BacktestTableProps {
  data: any[] // Replace 'any' with a more specific type if possible
}

export function BacktestTable({ data }: BacktestTableProps) {
  return (
    <div className="w-full space-y-4">
      <Table>
        <TableCaption>Backtest Results</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px] text-left">Symbol</TableHead>
            <TableHead className="min-w-[80px] text-left">Type</TableHead>
            <TableHead className="min-w-[100px] text-right">Entry</TableHead>
            <TableHead className="min-w-[100px] text-right">Exit</TableHead>
            <TableHead className="min-w-[80px] text-right">P&L</TableHead>
            <TableHead className="min-w-[100px] text-right">Return %</TableHead>
            <TableHead className="min-w-[80px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.symbol}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell className="text-right">{row.entry}</TableCell>
              <TableCell className="text-right">{row.exit}</TableCell>
              <TableCell className="text-right">{row.pnl}</TableCell>
              <TableCell className="text-right">{row.return}</TableCell>
              <TableCell className="text-center">
                {/* Add action buttons here */}
                Actions
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
