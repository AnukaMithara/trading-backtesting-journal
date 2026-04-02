export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { customFieldSchema } from "@/lib/validations/settings"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("customFields")

    const customFields = await collection.find({ isActive: true }).sort({ name: 1 }).toArray()
    return NextResponse.json(customFields)
  } catch (error) {
    console.error("Error fetching custom fields:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = customFieldSchema.parse(body)

    const client = await clientPromise
    const db = client.db("backtesting")
    const collection = db.collection("customFields")

    // Check if custom field already exists
    const existingField = await collection.findOne({ name: validatedData.name })
    if (existingField) {
      return NextResponse.json({ error: "Custom field already exists" }, { status: 400 })
    }

    const customField = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(customField)
    return NextResponse.json({ ...customField, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 })
  }
}
