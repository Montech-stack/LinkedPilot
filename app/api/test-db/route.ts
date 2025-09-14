import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
    try {
        await connectToDatabase()
        return NextResponse.json({ success: true, message: 'Connected to MongoDB' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to connect to MongoDB', details: error }, { status: 500 })
    }
}