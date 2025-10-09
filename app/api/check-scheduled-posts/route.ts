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
      const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: process.env.LINKEDIN_PERSON_URN,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: schedule.content },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });

      if (!linkedInResponse.ok) {
        const errorData = await linkedInResponse.json();
        if (linkedInResponse.status === 422) {
          console.warn(`Skipping duplicate post: ${schedule.content}`);
          schedule.status = 'failed';
          schedule.error = 'Duplicate post detected';
        } else {
          throw new Error(`LinkedIn API error: ${linkedInResponse.status} - ${JSON.stringify(errorData)}`);
        }
      } else {
        schedule.status = 'posted';
      }
      await schedule.save();
    }

    return NextResponse.json({ success: true, processed: schedules.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing schedules:', errorMessage);
    return NextResponse.json({ error: 'Failed to process schedules', details: errorMessage }, { status: 500 });
  }
}