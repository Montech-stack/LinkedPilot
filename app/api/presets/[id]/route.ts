import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Preset from '@/models/Preset';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // params is a Promise in Next.js 15
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectToDatabase();

        // Ensure the preset belongs to the user
        const deleted = await Preset.findOneAndDelete({
            _id: id,
            userId: session.user.email
        });

        if (!deleted) {
            return NextResponse.json({ error: 'Preset not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting preset:', error);
        return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 });
    }
}
