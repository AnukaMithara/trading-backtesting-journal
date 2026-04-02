export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { backtestSchema } from "@/lib/validations/backtest"
import { calculateProfitLoss } from "@/lib/utils/calculations"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("backtests")

    const backtest = await collection.findOne({ _id: new ObjectId(params.id) })

    if (!backtest) {
      return NextResponse.json({ error: "Backtest not found" }, { status: 404 })
    }

    return NextResponse.json(backtest)
  } catch (error) {
    console.error("Error fetching backtest:", error)
    return NextResponse.json({ error: "Failed to fetch backtest" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validatedData = backtestSchema.parse(body)

    const profitLoss = calculateProfitLoss(validatedData.entryPrice, validatedData.exitPrice ?? 0, validatedData.positionSize)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("backtests")

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...validatedData,
          profitLoss,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Backtest not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Backtest updated successfully" })
  } catch (error) {
    console.error("Error updating backtest:", error)
    return NextResponse.json({ error: "Failed to update backtest" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("backtests")

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Backtest not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Backtest deleted successfully" })
  } catch (error) {
    console.error("Error deleting backtest:", error)
    return NextResponse.json({ error: "Failed to delete backtest" }, { status: 500 })
  }
}
