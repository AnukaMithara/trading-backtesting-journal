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

    // Pagination params (optional — omitting both returns all records for backwards compat)
    const pageParam = searchParams.get("page")
    const pageSizeParam = searchParams.get("pageSize")
    const paginated = pageParam !== null || pageSizeParam !== null
    const page = Math.max(1, parseInt(pageParam ?? "1", 10))
    const pageSize = Math.min(200, Math.max(1, parseInt(pageSizeParam ?? "25", 10)))

    const filter: Record<string, unknown> = {}
    if (strategy) filter.strategyName = strategy
    if (asset) filter.asset = asset
    if (tag) filter.tags = { $in: [tag] }
    if (assetClass) filter.assetClass = assetClass

    if (paginated) {
      const [backtests, total] = await Promise.all([
        collection
          .find(filter)
          .sort({ entryDateTime: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(),
        collection.countDocuments(filter),
      ])
      return NextResponse.json({
        trades: backtests,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      })
    }

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
    console.log("Received body:", JSON.stringify(body, null, 2))

    // Validate the data
    const validatedData = backtestWithTagsSchema.parse(body)
    console.log("Validated data:", JSON.stringify(validatedData, null, 2))

    // Calculate trade metrics
    const calculatedData = calculateTradeMetrics(validatedData)
    console.log("Calculated data:", JSON.stringify(calculatedData, null, 2))

    const client = await clientPromise
    console.log("MongoDB client connected")

    const db = client.db("backtesting")
    console.log("Database selected: backtesting")

    // Ensure collection exists
    const collections = await db.listCollections({ name: "backtests" }).toArray()
    if (collections.length === 0) {
      console.log("Creating backtests collection")
      await db.createCollection("backtests")
    }

    const collection = db.collection("backtests")

    // Prepare the document for insertion
    const backtest = {
      ...calculatedData,
      entryDateTime: new Date(validatedData.entryDateTime),
      exitDateTime: validatedData.exitDateTime ? new Date(validatedData.exitDateTime) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Document to insert:", JSON.stringify(backtest, null, 2))

    // Insert the document
    const result = await collection.insertOne(backtest)
    console.log("Insert result:", result)

    if (!result.insertedId) {
      throw new Error("Failed to insert document - no insertedId returned")
    }

    // Fetch the inserted document to return
    const insertedDocument = await collection.findOne({ _id: result.insertedId })
    console.log("Inserted document:", JSON.stringify(insertedDocument, null, 2))

    return NextResponse.json(insertedDocument, { status: 201 })
  } catch (error) {
    console.error("Error creating backtest:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to create backtest",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 })
  }
}
