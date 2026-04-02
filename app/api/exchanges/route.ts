export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { exchangeSchema } from "@/lib/validations/broker-asset"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("exchanges")

    const exchanges = await collection.find({ isActive: true }).sort({ name: 1 }).toArray()
    return NextResponse.json(exchanges)
  } catch (error) {
    console.error("Error fetching exchanges:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = exchangeSchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("exchanges")

    // Check if exchange already exists
    const existingExchange = await collection.findOne({ code: validatedData.code })
    if (existingExchange) {
      return NextResponse.json({ error: "Exchange already exists" }, { status: 400 })
    }

    const exchange = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(exchange)
    return NextResponse.json({ ...exchange, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating exchange:", error)
    return NextResponse.json({ error: "Failed to create exchange" }, { status: 500 })
  }
}
