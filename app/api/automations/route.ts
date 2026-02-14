import { NextResponse } from "next/server";
import Automation from "@/models/Automation";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import mongoose from "mongoose";

export const runtime = "nodejs";

// Helper: notify Python backend to sync automation data
async function triggerPythonSync() {
  const pythonUrl = process.env.PYTHON_BACKEND_URL;
  if (!pythonUrl) return;

  try {
    await fetch(`${pythonUrl}/sync-automations`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.VERCEL_CRON_SECRET || "",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.warn("Failed to sync with Python backend:", err);
  }
}

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
    const {
      title, type, isActive, lastRun, topic, postTime, tone, length,
      selectedAccounts, nextRun, count, automateImages, username, profileImageUrl,
      // New fields
      preset, generateImage, importedScheduleIds, frequency, customDays
    } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required." }, { status: 400 });
    }
    if (type === 'content' && (!postTime || !/^\d{2}:\d{2}$/.test(postTime))) {
      return NextResponse.json({ error: "Post time is required in HH:mm format." }, { status: 400 });
    }
    if (automateImages && (!username || !profileImageUrl)) {
      return NextResponse.json({ error: "Username and profile image URL are required when automating images." }, { status: 400 });
    }

    const record = await Automation.create({
      userId,
      title,
      type,
      isActive: isActive ?? true,
      lastRun: lastRun && lastRun !== "Never" ? new Date(lastRun) : null,
      topic,
      postTime,
      tone,
      length,
      selectedAccounts: selectedAccounts ? selectedAccounts.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
      nextRun: nextRun ? new Date(nextRun) : calculateNextRun(postTime, frequency, customDays),
      count: count ?? 0,
      automateImages: automateImages ?? false,
      username,
      profileImageUrl,
      // New fields
      preset: preset || null,
      generateImage: generateImage ?? false,
      importedScheduleIds: importedScheduleIds ? importedScheduleIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
      frequency: frequency || 'daily',
      customDays: customDays || [],
    });

    // Sync to Python backend
    triggerPythonSync();

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Error creating automation:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Duplicate automation." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create automation." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    const automation = await Automation.findOne({ _id: id, userId });
    if (!automation) {
      return NextResponse.json({ error: "Automation not found." }, { status: 404 });
    }
    if (updates.postTime) {
      updates.nextRun = calculateNextRun(updates.postTime)
    }
    if (updates.automateImages && (!updates.username || !updates.profileImageUrl)) {
      return NextResponse.json({ error: "Username and profile image URL are required when automating images." }, { status: 400 });
    }
    Object.assign(automation, updates);
    await automation.save();

    // Sync to Python backend
    triggerPythonSync();

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json({ error: "Failed to update automation." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    const result = await Automation.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Automation not found." }, { status: 404 });
    }
    // Sync to Python backend
    triggerPythonSync();

    return NextResponse.json({ message: "Automation deleted." });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return NextResponse.json({ error: "Failed to delete automation." }, { status: 500 });
  }
}

// Helper to calculate nextRun based on postTime, frequency, and custom days
function calculateNextRun(postTime: string, frequency: string = 'daily', customDays: number[] = []): Date {
  const [hours, minutes] = postTime.split(':').map(Number);
  const now = new Date();
  let next = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0, 0);

  // If time already passed today, start from tomorrow
  if (next < now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  // For weekdays only (Mon-Fri = 1-5)
  if (frequency === 'weekdays') {
    const dayOfWeek = next.getUTCDay();
    if (dayOfWeek === 0) next.setUTCDate(next.getUTCDate() + 1); // Sunday -> Monday
    else if (dayOfWeek === 6) next.setUTCDate(next.getUTCDate() + 2); // Saturday -> Monday
  }

  // For weekly (next Monday)
  if (frequency === 'weekly') {
    const dayOfWeek = next.getUTCDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
    next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  }

  // For custom days
  if (frequency === 'custom' && customDays.length > 0) {
    const sortedDays = [...customDays].sort((a, b) => a - b);
    const currentDay = next.getUTCDay();
    let targetDay = sortedDays.find(d => d >= currentDay);

    if (targetDay === undefined) {
      targetDay = sortedDays[0];
      next.setUTCDate(next.getUTCDate() + (7 - currentDay + targetDay));
    } else if (targetDay > currentDay) {
      next.setUTCDate(next.getUTCDate() + (targetDay - currentDay));
    }
  }

  return next;
}