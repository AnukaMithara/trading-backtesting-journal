"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSubmit = async () => {
    setLoading(true)
    try {
      const testData = {
        tradeId: "TEST-001",
        date: "2024-01-15",
        asset: "AAPL",
        strategy: "Test Strategy",
        entry: 150.0,
        exit: 155.0,
        positionSize: 100,
        notes: "Test trade",
        tags: ["test", "debug"],
      }

      console.log("Sending test data:", testData)

      const response = await fetch("/api/backtests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      console.log("Response status:", response.status)

      const responseText = await response.text()
      console.log("Response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        data = { error: "Invalid JSON response", response: responseText }
      }

      setResult({
        status: response.status,
        data: data,
        success: response.ok,
      })
    } catch (error) {
      console.error("Test error:", error)
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBacktests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/backtests")
      const data = await response.json()
      setResult({
        status: response.status,
        data: data,
        success: response.ok,
        count: Array.isArray(data) ? data.length : 0,
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debug Page</h1>
        <p className="text-muted-foreground">Test API endpoints and debug issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Create Backtest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testSubmit} disabled={loading}>
              {loading ? "Testing..." : "Submit Test Backtest"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Fetch Backtests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fetchBacktests} disabled={loading}>
              {loading ? "Fetching..." : "Fetch All Backtests"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
