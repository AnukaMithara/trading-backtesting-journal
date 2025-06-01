import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { assetSchema } from "@/lib/validations/broker-asset"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("assets")

    const { searchParams } = new URL(request.url)
    const assetClass = searchParams.get("assetClass")

    const filter: any = { isActive: true }
    if (assetClass) filter.assetClass = assetClass

    const assets = await collection.find(filter).sort({ symbol: 1 }).toArray()
    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = assetSchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("assets")

    // Check if asset already exists
    const existingAsset = await collection.findOne({ symbol: validatedData.symbol })
    if (existingAsset) {
      return NextResponse.json({ error: "Asset already exists" }, { status: 400 })
    }

    const asset = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(asset)
    return NextResponse.json({ ...asset, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating asset:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
