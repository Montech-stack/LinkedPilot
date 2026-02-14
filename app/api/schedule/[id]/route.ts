import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";

// Helper: notify Python backend to sync schedule data
async function triggerPythonSync() {
  const pythonUrl = process.env.PYTHON_BACKEND_URL;
  if (!pythonUrl) return;

  try {
    await fetch(`${pythonUrl}/sync-schedules`, {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const updated = await ScheduledPost.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Sync to Python backend
    triggerPythonSync();

    return NextResponse.json(updated);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed updating" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const deleted = await ScheduledPost.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Sync to Python backend
    triggerPythonSync();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed deleting" }, { status: 500 });
  }
}
