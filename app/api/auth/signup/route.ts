// app/api/auth/signup/route.ts
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { PLAN_IDS } from "@/lib/billing-store"

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    // New users start on a 14-day trial with 30 posts
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "user",
      plan: PLAN_IDS.TRIAL,
      tokensRemaining: 30,
      trialEndsAt,
      onboardingCompleted: false,
      onboardingStep: 0,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        plan: PLAN_IDS.TRIAL,
        tokensRemaining: 30,
        trialEndsAt,
      },
      redirectUrl: "/dashboard",
    })
  } catch (err) {
    console.error("[SIGNUP ERROR]", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
