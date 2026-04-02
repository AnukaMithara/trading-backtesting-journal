import { MongoClient } from "mongodb"

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
} else {
  // During build time when env is not available, create a rejected promise
  clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'))
  // Suppress unhandled rejection during build
  clientPromise.catch(() => {})
}

export default clientPromise
