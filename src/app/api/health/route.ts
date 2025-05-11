import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple 200 OK response
  return NextResponse.json({ status: 'OK', timestamp: new Date().toISOString() });
}
