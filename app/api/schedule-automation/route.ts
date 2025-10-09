import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Automation from '@/models/Automation';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { topic, tone, length, count, frequency } = await request.json();

    if (!topic || !tone || !length || !count || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await Automation.create({
      topic,
      tone,
      length,
      count,
      frequency,
      nextRun: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Daily automation scheduled', automationId: result._id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error scheduling automation:', errorMessage);
    return NextResponse.json({ error: 'Failed to schedule automation', details: errorMessage }, { status: 500 });
  }
}