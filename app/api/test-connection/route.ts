export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing MongoDB connection...")
    console.log("MongoDB URI (masked):", process.env.MONGODB_URI?.replace(/\/\/.*@/, "//***:***@"))

    const client = await clientPromise
    console.log("Client connected successfully")

    // Test database connection
    const db = client.db("backtesting")
    console.log("Database selected: backtesting")

    // Test admin command
    const adminDb = client.db("admin")
    const result = await adminDb.command({ ping: 1 })
    console.log("Ping result:", result)

    // List databases
    const databases = await client.db().admin().listDatabases()
    console.log(
      "Available databases:",
      databases.databases.map((db) => db.name),
    )

    // Test creating collection if it doesn't exist
    const collections = await db.listCollections().toArray()
    console.log(
      "Existing collections:",
      collections.map((col) => col.name),
    )

    if (!collections.find((col) => col.name === "backtests")) {
      await db.createCollection("backtests")
      console.log("Created 'backtests' collection")
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      databases: databases.databases.map((db) => db.name),
      collections: collections.map((col) => col.name),
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
