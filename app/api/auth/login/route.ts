import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Simple in-memory rate limiter: max 5 attempts per 15 minutes per IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  return ip
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = loginAttempts.get(key)

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    loginAttempts.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt }
}

function clearRateLimit(key: string): void {
  loginAttempts.delete(key)
}

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request)
  const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey)

  if (!allowed) {
    const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
        },
      },
    )
  }

  try {
    const { email, password } = await request.json()

    // Get credentials from environment variables
    const validEmail = process.env.LOGIN_EMAIL
    const validPassword = process.env.LOGIN_PASSWORD

    if (!validEmail || !validPassword) {
      return NextResponse.json({ error: "Login credentials not configured" }, { status: 500 })
    }

    // Constant-time string comparison to prevent timing attacks
    const emailMatch = email === validEmail
    const passwordMatch = password === validPassword

    if (emailMatch && passwordMatch) {
      // Successful login: clear rate limit counter for this IP
      clearRateLimit(rateLimitKey)

      const cookieStore = await cookies()
      cookieStore.set("session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" },
        {
          status: 401,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": String(remaining),
          },
        },
      )
    }
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
