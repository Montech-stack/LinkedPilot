// app/api/user/update-plan/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { getPlanById, getPlanTokens, PLAN_IDS } from "@/lib/billing-store"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await req.json()
    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json(
        { error: `Invalid planId: ${planId}. Valid plans: ${Object.values(PLAN_IDS).join(", ")}` },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const tokens = getPlanTokens(planId)
    // -1 means unlimited — store as large number in DB for simpler queries
    const tokensToStore = tokens === -1 ? 999999 : tokens

    const updateData: Record<string, unknown> = {
      plan: planId,
      tokensRemaining: tokensToStore,
    }

    if (planId === PLAN_IDS.TRIAL) {
      updateData.trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, select: "-password" }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      plan: user.plan,
      tokensRemaining: user.tokensRemaining,
    })
  } catch (error) {
    console.error("[UPDATE-PLAN ERROR]", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
