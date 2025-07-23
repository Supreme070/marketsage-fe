import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { leadPulseAuthIntegration } from '@/lib/leadpulse/auth-integration';
import { z } from 'zod';

// Request schemas
const processAuthSchema = z.object({
  visitorFingerprint: z.string(),
  sessionId: z.string(),
  authMethod: z.enum(['signin', 'signup', 'sso', 'token_refresh']).optional()
});

const trackActionSchema = z.object({
  visitorFingerprint: z.string(),
  action: z.string(),
  metadata: z.record(z.any()).optional()
});

const getJourneySchema = z.object({
  contactId: z.string().optional(),
  visitorFingerprint: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'process-authentication':
        const authData = processAuthSchema.parse(body);
        const authResult = await leadPulseAuthIntegration.processAuthenticationEvent(
          authData.visitorFingerprint,
          authData.sessionId,
          authData.authMethod
        );
        return NextResponse.json(authResult);

      case 'track-action':
        const actionData = trackActionSchema.parse(body);
        const trackResult = await leadPulseAuthIntegration.trackAuthenticatedAction(
          actionData.visitorFingerprint,
          actionData.action,
          actionData.metadata
        );
        return NextResponse.json({ success: trackResult });

      case 'get-authenticated-visitor':
        const visitorFingerprint = body.visitorFingerprint;
        if (!visitorFingerprint) {
          return NextResponse.json({ error: 'Visitor fingerprint required' }, { status: 400 });
        }

        const authenticatedVisitor = await leadPulseAuthIntegration.getAuthenticatedVisitor(visitorFingerprint);
        return NextResponse.json({ visitor: authenticatedVisitor });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Authentication integration API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'get-journey-timeline':
        const contactId = searchParams.get('contactId');
        if (!contactId) {
          return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
        }

        const timeline = await leadPulseAuthIntegration.getCustomerJourneyTimeline(contactId);
        return NextResponse.json({ timeline });

      case 'get-authenticated-visitor':
        const visitorFingerprint = searchParams.get('visitorFingerprint');
        if (!visitorFingerprint) {
          return NextResponse.json({ error: 'Visitor fingerprint required' }, { status: 400 });
        }

        const authenticatedVisitor = await leadPulseAuthIntegration.getAuthenticatedVisitor(visitorFingerprint);
        return NextResponse.json({ visitor: authenticatedVisitor });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Authentication integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}