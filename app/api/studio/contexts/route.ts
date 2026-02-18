import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ImageContext from "@/models/ImageContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Find contexts for this user (using email or ID if available)
        // Assuming simple auth for now, fetching all or filtering by user
        const contexts = await ImageContext.find({}).sort({ createdAt: -1 });

        return NextResponse.json(contexts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch contexts" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, triggerWord, description, referenceImageUrls } = body;

        if (!name || !triggerWord) {
            return NextResponse.json({ error: "Name and Trigger Word are required" }, { status: 400 });
        }

        await connectToDatabase();

        const newContext = await ImageContext.create({
            userId: session.user.email, // Using email as ID for now
            name,
            triggerWord,
            description,
            referenceImageUrls: referenceImageUrls || []
        });

        return NextResponse.json(newContext, { status: 201 });

    } catch (error) {
        console.error("Create Context Error:", error);
        return NextResponse.json({ error: "Failed to create context" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await connectToDatabase();
        await ImageContext.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
