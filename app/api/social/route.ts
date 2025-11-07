import { NextResponse } from "next/server";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  await connectToDatabase();

  const userId = "demo-user-id"; // Replace with real auth

  const accounts = await SocialAccount.find({ userId });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  await connectToDatabase();
  const body = await req.json();

  const userId = "demo-user-id";

  const record = await SocialAccount.create({
    ...body,
    userId,
  });

  return NextResponse.json(record);
}
