import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const access_token = cookieStore.get('linkedin_access_token')?.value;
    const linkedin_user_id = cookieStore.get('linkedin_user_id')?.value;

    if (access_token && linkedin_user_id) {
      return NextResponse.json({ isAuthenticated: true });
    }
    return NextResponse.json({ isAuthenticated: false });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false });
  }
}