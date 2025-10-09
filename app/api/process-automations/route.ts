import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Automation from '@/models/Automation';
import Schedule from '@/models/Schedule';

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();

    const automations = await Automation.find({
      frequency: 'daily',
      nextRun: { $lte: now },
    });

    for (const automation of automations) {
      const ideasResponse = await fetch('http://localhost:3000/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: automation.topic }),
      });

      if (!ideasResponse.ok) {
        throw new Error('Failed to generate ideas');
      }

      const ideasData = await ideasResponse.json();
      const ideas = ideasData.ideas.slice(0, automation.count);

      for (const idea of ideas) {
        const postsResponse = await fetch('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: idea.hook,
            tone: automation.tone,
            length: automation.length,
            count: 1,
          }),
        });

        if (!postsResponse.ok) {
          throw new Error('Failed to generate posts');
        }

        const postsData = await postsResponse.json();
        const content = postsData.posts[0].content;

        await Schedule.create({
          postId: `auto-${idea.id}-${Date.now()}`,
          content,
          scheduleTime: new Date(),
          status: 'pending',
          recurring: null,
        });
      }

      automation.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await automation.save();
    }

    return NextResponse.json({ success: true, processed: automations.length });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing automations:', errorMessage);
    return NextResponse.json({ error: 'Failed to process automations', details: errorMessage }, { status: 500 });
  }
}