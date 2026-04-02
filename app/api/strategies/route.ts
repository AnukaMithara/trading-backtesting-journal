export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { strategySchema } from "@/lib/validations/settings"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("strategies")

    const strategies = await collection.find({ isActive: true }).sort({ name: 1 }).toArray()
    return NextResponse.json(strategies)
  } catch (error) {
    console.error("Error fetching strategies:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = strategySchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("strategies")

    // Check if strategy already exists
    const existingStrategy = await collection.findOne({ name: validatedData.name })
    if (existingStrategy) {
      return NextResponse.json({ error: "Strategy already exists" }, { status: 400 })
    }

    const strategy = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(strategy)
    return NextResponse.json({ ...strategy, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating strategy:", error)
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
  }
}
