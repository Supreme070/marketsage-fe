import { type NextRequest, NextResponse } from 'next/server';
import { multiModalIntelligence } from '@/lib/ai/multimodal-intelligence';
import { logger } from '@/lib/logger';

/**
 * PUT /api/ai/multimodal/kyc
 * KYC document verification using computer vision
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, documentType, customerId } = body;

    if (!imageBase64 || !documentType || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageBase64, documentType, customerId' },
        { status: 400 }
      );
    }

    const verification = await multiModalIntelligence.verifyKYCDocument(
      imageBase64,
      documentType
    );

    return NextResponse.json({
      success: true,
      verification,
      customerId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('KYC document verification failed', { error: String(error) });
    return NextResponse.json(
      { error: 'KYC verification failed', details: String(error) },
      { status: 500 }
    );
  }
} 