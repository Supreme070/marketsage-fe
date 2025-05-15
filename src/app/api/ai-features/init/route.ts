import { NextResponse } from 'next/server';
import { initializeAIFeatures } from '@/lib/ai-features-init';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Verify the user is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      logger.warn("Unauthorized attempt to initialize AI features");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Initialize AI features
    const success = await initializeAIFeatures();
    
    if (success) {
      return NextResponse.json(
        { message: "AI features initialized successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to initialize AI features" },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error initializing AI features", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 