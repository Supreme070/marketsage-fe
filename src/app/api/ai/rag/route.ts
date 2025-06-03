import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ragQuery } from '@/lib/ai/rag-engine';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { question } = body;
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const result = await ragQuery(question);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('RAG API failed', error);
    return NextResponse.json({ error: 'RAG failed' }, { status: 500 });
  }
} 