import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Route] Initial registration route called');
  
  try {
    const body = await request.json();
    console.log('[Route] Request body:', body);
    
    // Test direct call to backend
    const response = await fetch('http://127.0.0.1:3006/api/v2/auth/register/initial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    console.log('[Route] Backend response:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Route] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
