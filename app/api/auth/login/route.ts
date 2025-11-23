import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const sanitizedUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      tokensRemaining: user.tokensRemaining ?? 0,
      billingEnabled: user.billingEnabled ?? false,
      createdAt: user.createdAt,
    }

    // decide where user goes
    const redirectUrl =
      sanitizedUser.tokensRemaining > 0 && sanitizedUser.billingEnabled
        ? "/home"
        : "/billing"

    return NextResponse.json({
      success: true,
      user: sanitizedUser,
      redirectUrl,
    })

  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
