import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const existing = await User.findOne({ email })

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      provider: "credentials",
      role: "user",
      plan: "free",
      tokensRemaining: 0,
      billingEnabled: false,
      onboardingCompleted: false,
      onboardingStep: 0,
    })

    const sanitizedUser = {
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      tokensRemaining: 0,
      billingEnabled: false,
    }

    // Always redirect to dashboard - onboarding will show there
    const redirectUrl = "/dashboard"

    return NextResponse.json({
      success: true,
      user: sanitizedUser,
      redirectUrl,
    })

  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
