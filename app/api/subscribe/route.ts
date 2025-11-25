// app/api/subscribe/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, amount, plan, numAccounts, numTokens } = body;
  
  // Replace with your Paystack secret key
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack key not configured" }, { status: 500 });
  }

  let planCode = '';
  const currency = 'USD'; // Adjust as needed (USD for international)

  try {
    if (plan === 'free') {
      // Handle free plan activation without payment (e.g., update user in DB)
      // For now, return success message
      return NextResponse.json({ message: "Free plan activated" });
    }

    if (plan === 'pay as you go') {
      if (!numAccounts || !numTokens) {
        return NextResponse.json({ error: "Missing numAccounts or numTokens for Pay as You Go" }, { status: 400 });
      }
      // Create a custom plan for Pay as You Go
      const planResponse = await fetch("https://api.paystack.co/plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `PayG ${numTokens} tokens ${numAccounts} accounts`,
          interval: "monthly",
          amount: amount, // Already in cents (smallest unit)
          currency: currency,
        }),
      });
      const planData = await planResponse.json();
      if (!planData.status) {
        throw new Error(planData.message || "Failed to create plan");
      }
      planCode = planData.data.plan_code;
    } else {
      // For fixed plans, use prebuilt payment links and return as authorization_url
      let paymentUrl = '';
      if (plan === 'pro') paymentUrl = 'https://paystack.shop/pay/juouqkca1k';
      else if (plan === 'enterprise') paymentUrl = 'https://paystack.shop/pay/4nxv9pmo6x';
      if (!paymentUrl) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      // Return as if initialized, with the URL
      return NextResponse.json({
        authorization_url: paymentUrl,
        access_code: 'prebuilt', // Dummy
        reference: 'prebuilt_ref' // Dummy
      });
    }

    // Initialize transaction for pay as you go
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Already in smallest unit
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success?plan=${plan}`,
      }),
    });

    const data = await response.json();
    if (data.status) {
      return NextResponse.json(data.data);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to initialize subscription" }, { status: 500 });
  }
}