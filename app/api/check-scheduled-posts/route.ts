import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Schedule from '@/models/Schedule';

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();
    const schedules = await Schedule.find({
      status: 'pending',
      scheduleTime: { $lte: now },
    });

    for (const schedule of schedules) {
      console.log(`Posting to LinkedIn: ${schedule.content}`);
      // Add LinkedIn API call
      schedule.status = 'posted';
      await schedule.save();
    }

    return NextResponse.json({ success: true, processed: schedules.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing schedules:', error);
    return NextResponse.json({ error: 'Failed to process schedules', details: errorMessage }, { status: 500 });
  }
}