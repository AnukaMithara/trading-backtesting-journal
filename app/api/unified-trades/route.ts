import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { unifiedTradeSchema } from "@/lib/validations/unified-trade"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")

    const collections = await db.listCollections({ name: "unified_trades" }).toArray()
    if (collections.length === 0) {
      await db.createCollection("unified_trades")
    }

    const collection = db.collection("unified_trades")

    const { searchParams } = new URL(request.url)
    const asset = searchParams.get("asset")
    const broker = searchParams.get("broker")
    const type = searchParams.get("type")
    const timeFrame = searchParams.get("timeFrame")

    const filter: any = {}
    if (asset) filter.asset = asset
    if (broker) filter.broker = broker
    if (type) filter.type = type
    if (timeFrame) filter.timeFrame = timeFrame

    const trades = await collection.find(filter).sort({ entryTime: -1 }).toArray()

    return NextResponse.json(trades)
  } catch (error) {
    console.error("Error fetching unified trades:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/unified-trades - Starting request processing")

    const body = await request.json()
    console.log("Received body:", JSON.stringify(body, null, 2))

    // Validate the data
    const validatedData = unifiedTradeSchema.parse(body)
    console.log("Validated data:", JSON.stringify(validatedData, null, 2))

    const client = await clientPromise
    console.log("MongoDB client connected")

    const db = client.db("backtesting")
    console.log("Database selected: backtesting")

    // Ensure collection exists
    const collections = await db.listCollections({ name: "unified_trades" }).toArray()
    if (collections.length === 0) {
      console.log("Creating unified_trades collection")
      await db.createCollection("unified_trades")
    }

    const collection = db.collection("unified_trades")

    // Prepare the document for insertion
    const trade = {
      ...validatedData,
      entryTime: new Date(validatedData.entryTime),
      exitTime: validatedData.exitTime ? new Date(validatedData.exitTime) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("Document to insert:", JSON.stringify(trade, null, 2))

    // Insert the document
    const result = await collection.insertOne(trade)
    console.log("Insert result:", result)

    if (!result.insertedId) {
      throw new Error("Failed to insert document - no insertedId returned")
    }

    // Fetch the inserted document to return
    const insertedDocument = await collection.findOne({ _id: result.insertedId })
    console.log("Inserted document:", JSON.stringify(insertedDocument, null, 2))

    return NextResponse.json(insertedDocument, { status: 201 })
  } catch (error) {
    console.error("Error creating unified trade:", error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to create unified trade",
          details: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Unknown error occurred" }, { status: 500 })
  }
}
