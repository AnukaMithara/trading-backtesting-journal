import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Get credentials from environment variables
    const validEmail = process.env.LOGIN_EMAIL
    const validPassword = process.env.LOGIN_PASSWORD

    if (!validEmail || !validPassword) {
      return NextResponse.json({ error: "Login credentials not configured" }, { status: 500 })
    }

    // Simple credential check
    if (email === validEmail && password === validPassword) {
      // Set a simple session cookie
      const cookieStore = await cookies()
      cookieStore.set("session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
