// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/mongodb'; // Adjust path if needed
import mongoose from 'mongoose';

// Define User schema if not already defined elsewhere
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  plan: { type: String, default: 'free' },
  // Add more fields as needed, e.g., subscriptionId, etc.
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Define Subscription schema for pending/paid subs
const subscriptionSchema = new mongoose.Schema({
  email: String,
  plan: String,
  status: String,
  reference: String,
  // Add more fields like period, numAccounts, etc.
});
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, amount, plan, numAccounts, numTokens, period } = body;
  
  // Replace with your Paystack secret key
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack key not configured" }, { status: 500 });
  }

  let planCode = '';
  const currency = 'NGN'; // Changed to NGN
  const usdToNgnRate = 1460; // Approximate current rate (Nov 2025); update as needed or fetch dynamically if possible
  const interval = period === 'yearly' ? 'annually' : 'monthly';

  try {
    await connectToDatabase(); // Connect to DB

    if (plan === 'free') {
      // Update user plan in DB
      await User.updateOne({ email }, { $set: { plan: 'free' } }, { upsert: true });
      return NextResponse.json({ message: "Free plan activated" });
    }

    // Convert amount from USD to NGN kobo
    const usdAmount = amount; // amount is in USD from frontend
    const ngnAmount = usdAmount * usdToNgnRate;
    const amountInKobo = Math.round(ngnAmount * 100); // Convert to kobo (smallest unit for NGN)

    // Create dynamic plan for all paid plans
    let planName = '';
    if (plan === 'pay as you go') {
      if (!numAccounts || !numTokens) {
        return NextResponse.json({ error: "Missing numAccounts or numTokens for Pay as You Go" }, { status: 400 });
      }
      planName = `PayG ${numTokens} tokens ${numAccounts} accounts - ${interval}`;
    } else if (plan === 'starter') {
      planName = `Starter Plan - ${interval}`;
    } else if (plan === 'pro') {
      planName = `Pro Plan - ${interval}`;
    } else if (plan === 'enterprise') {
      planName = `Enterprise Plan - ${interval}`;
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create the plan
    const planResponse = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: planName,
        interval: interval,
        amount: amountInKobo, // In kobo
        currency: currency,
      }),
    });
    const planData = await planResponse.json();
    if (!planData.status) {
      throw new Error(planData.message || "Failed to create plan");
    }
    planCode = planData.data.plan_code;

    // Initialize transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo, // In kobo
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success?plan=${plan}`,
        currency: currency,
      }),
    });

    const data = await response.json();
    if (data.status) {
      // Save pending subscription to DB
      await Subscription.create({
        email,
        plan,
        status: 'pending',
        reference: data.data.reference,
      });
      return NextResponse.json(data.data);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to initialize subscription" }, { status: 500 });
  }
}