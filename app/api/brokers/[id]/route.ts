export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { brokerSchema } from "@/lib/validations/settings"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("brokers")

    const broker = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!broker) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    return NextResponse.json(broker)
  } catch (error) {
    console.error("Error fetching broker:", error)
    return NextResponse.json({ error: "Failed to fetch broker" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validatedData = brokerSchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("brokers")

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    const updatedBroker = await collection.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedBroker)
  } catch (error) {
    console.error("Error updating broker:", error)
    return NextResponse.json({ error: "Failed to update broker" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("brokers")

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { isActive: false, updatedAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Broker not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Broker deleted successfully" })
  } catch (error) {
    console.error("Error deleting broker:", error)
    return NextResponse.json({ error: "Failed to delete broker" }, { status: 500 })
  }
}
