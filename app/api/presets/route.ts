import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Preset from '@/models/Preset';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);

        // Allow fetching without session if specifically needed, but usually we want user specific
        // For now, let's assume we need a session to get *custom* presets.
        // If no session, return empty array? Or 401?
        if (!session?.user?.email) {
            return NextResponse.json([]);
        }

        const userId = session.user.id || session.user.email; // Fallback if ID not populated
        // Note: If your User model uses _id, you should consistently use that. Assuming session has .id populated.
        // Ideally we look up the User by email to get the _id if session.id is missing.

        // For safety, let's query purely by the identifier we trust.
        // However, the Model expects `userId`. 
        // Let's assume session.user.id exists as it is standard in NextAuth if configured correctly.
        // If not, we might fail to find matches.

        // Let's use email as fallback if id is not present, assuming we stored email in userId field or adjust logic.
        // But better practice:

        const presets = await Preset.find({ userId: session.user.email }).sort({ createdAt: -1 });
        // IMPORTANT: I am using email as userId for simplicity unless ID is guaranteed. 
        // If you prefer _id, we need to ensure it's in the session.
        // Edit: The user seemingly uses email in other routes (deduct-token uses email).

        return NextResponse.json(presets);
    } catch (error) {
        console.error('Error fetching presets:', error);
        return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { name, description, promptSnippet, category } = await req.json();

        if (!name || !promptSnippet) {
            return NextResponse.json({ error: 'Name and prompt snippet are required' }, { status: 400 });
        }

        const newPreset = await Preset.create({
            userId: session.user.email, // Using email as the stable identifier for now
            name,
            description,
            promptSnippet,
            category: category || 'Custom',
        });

        return NextResponse.json(newPreset);
    } catch (error) {
        console.error('Error creating preset:', error);
        return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
    }
}
