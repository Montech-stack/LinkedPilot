// app/api/user/stats/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { PLAN_IDS } from "@/lib/billing-store"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findOne({ email: session.user.email }).select(
      "plan tokensRemaining trialEndsAt subscriptionEndDate onboardingCompleted"
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = Date.now()
    const trialEndsAt = user.trialEndsAt?.getTime() ?? null
    const isTrialExpired =
      user.plan === PLAN_IDS.TRIAL && trialEndsAt !== null && now > trialEndsAt

    return NextResponse.json({
      plan: user.plan ?? PLAN_IDS.TRIAL,
      tokensRemaining: user.tokensRemaining ?? 30,
      trialEndsAt,
      isTrialExpired,
      daysLeftInTrial:
        trialEndsAt !== null
          ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
          : 14,
      subscriptionEndDate: user.subscriptionEndDate?.getTime() ?? null,
      onboardingCompleted: user.onboardingCompleted ?? false,
    })
  } catch (error) {
    console.error("[USER STATS ERROR]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
