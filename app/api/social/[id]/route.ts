import { NextResponse } from "next/server";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  await connectToDatabase();
  const body = await req.json();

  const updated = await SocialAccount.findByIdAndUpdate(
    params.id,
    { $set: body },
    { new: true }
  );

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Params) {
  await connectToDatabase();

  await SocialAccount.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
