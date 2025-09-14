import { NextResponse } from 'next/server';

export async function GET() {
  // Return an error response to test error handling
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'This is a test error response',
      },
    },
    { status: 500 }
  );
}

