import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { backtestWithTagsSchema } from "@/lib/validations/backtest"
import { calculateTradeMetrics } from "@/lib/utils/calculations"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")

    const collections = await db.listCollections({ name: "backtests" }).toArray()
    if (collections.length === 0) {
      await db.createCollection("backtests")
    }

    const collection = db.collection("backtests")

    const { searchParams } = new URL(request.url)
    const strategy = searchParams.get("strategy")
    const asset = searchParams.get("asset")
    const tag = searchParams.get("tag")
    const assetClass = searchParams.get("assetClass")

    const filter: any = {}
    if (strategy) filter.strategyName = strategy
    if (asset) filter.asset = asset
    if (tag) filter.tags = { $in: [tag] }
    if (assetClass) filter.assetClass = assetClass

    const backtests = await collection.find(filter).sort({ entryDateTime: -1 }).toArray()

    return NextResponse.json(backtests)
  } catch (error) {
    console.error("Error fetching backtests:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/backtests - Starting request processing")

    const body = await request.json()
    console.log("Received body:", body)

    const validatedData = backtestWithTagsSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Calculate trade metrics
    const calculatedData = calculateTradeMetrics(validatedData)
    console.log("Calculated data:", calculatedData)

    const client = await clientPromise
    const db = client.db("backtesting")

    const collections = await db.listCollections({ name: "backtests" }).toArray()
    if (collections.length === 0) {
      await db.createCollection("backtests")
    }

    const collection = db.collection("backtests")

    const backtest = {
      ...calculatedData,
      entryDateTime: new Date(validatedData.entryDateTime),
      exitDateTime: validatedData.exitDateTime ? new Date(validatedData.exitDateTime) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Document to insert:", backtest)

    const result = await collection.insertOne(backtest)
    console.log("Insert result:", result)

    if (!result.insertedId) {
      throw new Error("Failed to insert document - no insertedId returned")
    }

    const responseData = { ...backtest, _id: result.insertedId }
    console.log("Sending response:", responseData)

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error creating backtest:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to create backtest",
          details: error.message,
          stack: error.stack,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 })
  }
}
