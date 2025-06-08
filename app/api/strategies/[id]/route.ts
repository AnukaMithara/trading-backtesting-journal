import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { strategySchema } from "@/lib/validations/settings"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("strategies")

    const strategy = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Error fetching strategy:", error)
    return NextResponse.json({ error: "Failed to fetch strategy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validatedData = strategySchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("strategies")

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
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    const updatedStrategy = await collection.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedStrategy)
  } catch (error) {
    console.error("Error updating strategy:", error)
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("strategies")

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { isActive: false, updatedAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Strategy deleted successfully" })
  } catch (error) {
    console.error("Error deleting strategy:", error)
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 })
  }
}
