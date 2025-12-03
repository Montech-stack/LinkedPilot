import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }
    const userId = session.user.id;
    const automations = await Automation.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { title, type, isActive, lastRun, topic, frequency, tone, length, selectedAccounts, nextRun, count } = body;
    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required." }, { status: 400 });
    }
    const record = await Automation.create({
      userId,
      title,
      type,
      isActive: isActive ?? true,
      lastRun: lastRun && lastRun !== "Never" ? new Date(lastRun) : null,
      topic,
      frequency,
      tone,
      length,
      selectedAccounts: selectedAccounts ? selectedAccounts.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
      nextRun: nextRun ? new Date(nextRun) : new Date(),
      count: count ?? 0,
    });
    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error creating automation:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Duplicate automation." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create automation." }, { status: 500 });
  }
}