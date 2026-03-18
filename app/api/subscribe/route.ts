// app/api/subscribe/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { PLAN_IDS, getPlanById } from "@/lib/billing-store"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

async function getLiveUsdToNgn(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } } // Cache 1 hour
    )
    const data = await res.json()
    return data?.rates?.NGN ?? 1600
  } catch {
    // Fallback if API is down — still better than a hardcoded stale value
    console.warn("[FX] Exchange rate API failed, using fallback rate")
    return 1600
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    const body = await req.json()
    const { planId, period = "monthly" } = body

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: `Invalid planId: ${planId}` }, { status: 400 })
    }

    await connectToDatabase()

    // Handle trial activation (no payment needed)
    if (planId === PLAN_IDS.TRIAL) {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            plan: PLAN_IDS.TRIAL,
            tokensRemaining: 30,
            trialEndsAt,
            onboardingCompleted: false,
          },
        },
        { upsert: true }
      )
      return NextResponse.json({ message: "Trial activated", trialEndsAt })
    }

    // Agency is contact-sales only — no Paystack flow
    if (planId === PLAN_IDS.AGENCY) {
      return NextResponse.json(
        { error: "Agency plan requires contacting sales" },
        { status: 400 }
      )
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment processor not configured" },
        { status: 500 }
      )
    }

    // Determine price
    const usdAmount =
      period === "yearly" ? plan.yearlyPrice * 12 : plan.price
    if (usdAmount === 0) {
      return NextResponse.json({ error: "Plan has no price" }, { status: 400 })
    }

    // Live FX conversion
    const fxRate = await getLiveUsdToNgn()
    const ngnAmount = Math.round(usdAmount * fxRate)
    const amountInKobo = ngnAmount * 100

    const interval = period === "yearly" ? "annually" : "monthly"
    const planName = `Maxis ${plan.name} - ${period === "yearly" ? "Annual" : "Monthly"}`

    // Create Paystack plan
    const planRes = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: planName,
        interval,
        amount: amountInKobo,
        currency: "NGN",
      }),
    })
    const planData = await planRes.json()
    if (!planData.status) {
      throw new Error(planData.message || "Failed to create Paystack plan")
    }

    // Initialize transaction
    const txRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        plan: planData.data.plan_code,
        callback_url: `${SITE_URL}/billing/success?plan=${planId}&period=${period}`,
        currency: "NGN",
        metadata: {
          planId,
          period,
          userId: session.user.email,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: plan.name },
            { display_name: "Period", variable_name: "period", value: period },
          ],
        },
      }),
    })

    const txData = await txRes.json()
    if (!txData.status) {
      throw new Error(txData.message || "Failed to initialize transaction")
    }

    // Save pending subscription reference
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          pendingPlanId: planId,
          pendingReference: txData.data.reference,
        },
      }
    )

    return NextResponse.json({
      authorization_url: txData.data.authorization_url,
      reference: txData.data.reference,
    })
  } catch (error) {
    console.error("[SUBSCRIBE ERROR]", error)
    return NextResponse.json(
      { error: "Failed to initialize subscription" },
      { status: 500 }
    )
  }
}
