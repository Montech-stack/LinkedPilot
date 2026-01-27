import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            onboardingStep: user.onboardingStep || 0,
            onboardingCompleted: user.onboardingCompleted || false,
            onboardingData: user.onboardingData || {},
        });
    } catch (error) {
        console.error('Error fetching onboarding status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { step, data, completed } = body;

        await connectToDatabase();

        const updateData: any = {};

        if (typeof step === 'number') {
            updateData.onboardingStep = step;
        }

        if (data) {
            // Merge with existing onboarding data
            const user = await User.findOne({ email: session.user.email });
            updateData.onboardingData = {
                ...(user?.onboardingData || {}),
                ...data,
            };
        }

        if (typeof completed === 'boolean') {
            updateData.onboardingCompleted = completed;
        }

        await User.updateOne(
            { email: session.user.email },
            { $set: updateData }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating onboarding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // Skip onboarding - just mark current step, don't complete
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { skipToStep } = body;

        await connectToDatabase();

        // Just update the step without completing
        await User.updateOne(
            { email: session.user.email },
            { $set: { onboardingStep: skipToStep || 0 } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error skipping onboarding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
