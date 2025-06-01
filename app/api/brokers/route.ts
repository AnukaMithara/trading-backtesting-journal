import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { brokerSchema } from "@/lib/validations/broker-asset"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("brokers")

    const brokers = await collection.find({ isActive: true }).sort({ name: 1 }).toArray()
    return NextResponse.json(brokers)
  } catch (error) {
    console.error("Error fetching brokers:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = brokerSchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("brokers")

    // Check if broker already exists
    const existingBroker = await collection.findOne({ name: validatedData.name })
    if (existingBroker) {
      return NextResponse.json({ error: "Broker already exists" }, { status: 400 })
    }

    const broker = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(broker)
    return NextResponse.json({ ...broker, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating broker:", error)
    return NextResponse.json({ error: "Failed to create broker" }, { status: 500 })
  }
}
