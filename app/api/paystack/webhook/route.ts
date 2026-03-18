// app/api/paystack/webhook/route.ts
import { NextResponse } from "next/server"
import crypto from "crypto"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/User"
import { getPlanById, getPlanTokens, PLAN_IDS } from "@/lib/billing-store"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex")
  return hash === signature
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature") ?? ""

    // Always verify — reject anything that doesn't match
    if (!verifyPaystackSignature(rawBody, signature)) {
      console.warn("[WEBHOOK] Invalid Paystack signature — rejecting")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log("[WEBHOOK] Event received:", event.event)

    await connectToDatabase()

    switch (event.event) {
      case "charge.success": {
        const { customer, metadata, reference } = event.data
        const email: string = customer?.email
        const planId: string = metadata?.planId

        if (!email || !planId) {
          console.error("[WEBHOOK] Missing email or planId in charge.success", { email, planId })
          break
        }

        const plan = getPlanById(planId)
        if (!plan) {
          console.error("[WEBHOOK] Unknown planId:", planId)
          break
        }

        const tokens = getPlanTokens(planId)
        const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              plan: planId,
              tokensRemaining: tokens === -1 ? 999999 : tokens,
              subscriptionEndDate,
              lastPaymentRef: reference,
              pendingPlanId: null,
              pendingReference: null,
              // Clear trial fields on paid upgrade
              trialEndsAt: null,
            },
          },
          { upsert: false }
        )

        console.log(`[WEBHOOK] Plan upgraded: ${email} → ${planId}`)
        break
      }

      case "subscription.disable": {
        // User cancelled — downgrade to trial at end of period
        const email: string = event.data?.customer?.email
        if (email) {
          await User.findOneAndUpdate(
            { email },
            {
              $set: {
                planCancelledAt: new Date(),
                // Keep current plan until subscriptionEndDate
                // Cron job should downgrade after that date
              },
            }
          )
          console.log(`[WEBHOOK] Subscription cancelled: ${email}`)
        }
        break
      }

      case "invoice.payment_failed": {
        const email: string = event.data?.customer?.email
        if (email) {
          // Log failed payment — you may want to email the user here
          await User.findOneAndUpdate(
            { email },
            { $set: { lastPaymentFailed: new Date() } }
          )
          console.warn(`[WEBHOOK] Payment failed: ${email}`)
        }
        break
      }

      default:
        console.log("[WEBHOOK] Unhandled event:", event.event)
    }

    // Always return 200 to Paystack so it stops retrying
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error)
    // Still return 200 to prevent Paystack from disabling your webhook
    return NextResponse.json({ received: true })
  }
}
