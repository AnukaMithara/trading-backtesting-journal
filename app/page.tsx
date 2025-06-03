"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

async function getMetrics() {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    tvl: 1000000,
    volume: 50000,
    fees: 500,
  }
}

async function getRecentTrades() {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    { id: "1", pair: "BTC/USD", price: 30000, amount: 0.5 },
    { id: "2", pair: "ETH/USD", price: 2000, amount: 2 },
    { id: "3", pair: "LTC/USD", price: 100, amount: 10 },
  ]
}

export default function Home() {
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
  } = useQuery({
    queryKey: ["metrics"],
    queryFn: getMetrics,
  })

  const {
    data: recentTrades,
    isLoading: isLoadingRecentTrades,
    isError: isErrorRecentTrades,
  } = useQuery({
    queryKey: ["recentTrades"],
    queryFn: getRecentTrades,
  })

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TVL</CardTitle>
            <CardDescription>Total Value Locked</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? <Skeleton className="h-5 w-20" /> : isErrorMetrics ? "Error" : `$${metrics?.tvl}`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Volume</CardTitle>
            <CardDescription>24 Hour Volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? <Skeleton className="h-5 w-20" /> : isErrorMetrics ? "Error" : `$${metrics?.volume}`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fees</CardTitle>
            <CardDescription>24 Hour Fees</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? <Skeleton className="h-5 w-20" /> : isErrorMetrics ? "Error" : `$${metrics?.fees}`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Placeholder</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg font-semibold">Recent Trades</h2>
        </div>
        {isLoadingRecentTrades ? (
          <Skeleton className="h-10 w-full" />
        ) : isErrorRecentTrades ? (
          "Error"
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">
                    Pair
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">
                    Price
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-normal text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentTrades?.map((trade) => (
                  <tr key={trade.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trade.pair}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trade.price}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trade.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
