import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG AUTH ===");
    
    // Check session
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));
    
    // Check cookies
    const cookies = request.headers.get('cookie');
    console.log("Cookies:", cookies);
    
    // Check NextAuth cookies specifically
    const nextAuthCookies = cookies?.split(';').filter(cookie => 
      cookie.trim().startsWith('next-auth')
    );
    console.log("NextAuth cookies:", nextAuthCookies);
    
    return NextResponse.json({
      session,
      cookies: cookies ? cookies.split(';').length : 0,
      nextAuthCookies: nextAuthCookies || [],
      authConfigLoaded: !!authOptions,
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}