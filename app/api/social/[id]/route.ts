import { NextResponse } from "next/server";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  await connectToDatabase();
  const body = await req.json();

  const updated = await SocialAccount.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await connectToDatabase();

    const deleted = await SocialAccount.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete social account error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
