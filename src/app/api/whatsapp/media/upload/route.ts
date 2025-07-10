/**
 * WhatsApp Media Upload API Endpoint
 * 
 * Uploads media files to WhatsApp for use in campaigns and messages.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { whatsappService } from '@/lib/whatsapp-service';
import { whatsappLogger } from '@/lib/whatsapp-campaign-logger';
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from '@/lib/errors';

// POST - Upload media to WhatsApp
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { fileUrl, type, filename } = body;

    // Validate required fields
    if (!fileUrl) {
      return validationError('fileUrl is required');
    }

    if (!type) {
      return validationError('type is required');
    }

    // Validate media type
    const validTypes = ['image', 'document', 'audio', 'video'];
    if (!validTypes.includes(type)) {
      return validationError(`Invalid media type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate URL format
    try {
      new URL(fileUrl);
    } catch (error) {
      return validationError('Invalid fileUrl format');
    }

    // Upload media to WhatsApp
    const uploadResult = await whatsappService.uploadMedia(fileUrl, type);

    if (!uploadResult.success) {
      await whatsappLogger.logMediaUploadFailed(fileUrl, type, uploadResult.error, {
        userId: session.user.id,
        filename
      });

      return NextResponse.json({
        success: false,
        error: uploadResult.error?.message || 'Media upload failed'
      }, { status: 400 });
    }

    await whatsappLogger.logMediaUploaded(uploadResult.mediaId!, fileUrl, type, {
      userId: session.user.id,
      filename
    });

    return NextResponse.json({
      success: true,
      mediaId: uploadResult.mediaId,
      type,
      filename: filename || null,
      originalUrl: fileUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.user.id
    });

  } catch (error) {
    console.error('Error uploading WhatsApp media:', error);
    
    await whatsappLogger.logMediaUploadError('Unknown', 'unknown', error, {
      userId: session.user.id
    });
    
    return handleApiError(error, '/api/whatsapp/media/upload/route.ts');
  }
}

// GET - Get media information
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('mediaId');

    if (!mediaId) {
      return validationError('mediaId query parameter is required');
    }

    // Get media URL from WhatsApp
    const mediaResult = await whatsappService.getMediaUrl(mediaId);

    if (!mediaResult.success) {
      return NextResponse.json({
        success: false,
        error: mediaResult.error?.message || 'Failed to get media information'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mediaId,
      url: mediaResult.url,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting WhatsApp media info:', error);
    return handleApiError(error, '/api/whatsapp/media/upload/route.ts');
  }
}