import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Schedule from '@/models/Schedule'

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()
    console.log("Received schedule request:", body)
    
    const { postId, content, scheduleTime, recurring } = body

    if (!postId || !content || !scheduleTime) {
      console.error("Missing required fields:", { postId, content, scheduleTime })
      return NextResponse.json({ error: 'Missing required fields: postId, content, or scheduleTime' }, { status: 400 })
    }

    const scheduleDate = new Date(scheduleTime)
    if (isNaN(scheduleDate.getTime()) || scheduleDate < new Date()) {
      console.error("Invalid schedule time:", scheduleTime)
      return NextResponse.json({ error: 'Invalid or past schedule time' }, { status: 400 })
    }

    const result = await Schedule.create({
      postId,
      content,
      scheduleTime: scheduleDate,
      status: 'pending',
      recurring: recurring || null,
    })
    console.log("Saved schedule document:", result)

    return NextResponse.json({ success: true, message: 'Post scheduled', documentId: result._id })
  } catch (error) {
    console.error('Error scheduling post:', error)
    return NextResponse.json({ error: 'Failed to schedule post', details: error }, { status: 500 })
  }
}