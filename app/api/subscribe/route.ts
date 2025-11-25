// app/api/subscribe/route.ts (for app router) or pages/api/subscribe.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, amount, plan } = await req.json();
  
  // Replace with your Paystack secret key
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack key not configured" }, { status: 500 });
  }

  try {
    // First, create or get plan code (ideally create plans in Paystack dashboard and hardcode codes)
    // For demo, assume plan codes: pro: 'PLN_pro', enterprise: 'PLN_enterprise'
    let planCode = '';
    if (plan === 'pro') planCode = 'PLN_xxxxxxxxxx'; // Replace with real
    else if (plan === 'enterprise') planCode = 'PLN_yyyyyyyyyy'; // Replace with real

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Already in subunits
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success?plan=${plan}`, // Handle success
      }),
    });
nse.json();
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