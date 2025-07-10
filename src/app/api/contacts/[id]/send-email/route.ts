import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendTrackedEmail } from '@/lib/email-service';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const sendEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  useTemplate: z.boolean().optional().default(false),
  replyTo: z.string().email().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Find the contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        jobTitle: true,
        status: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Contact has no email address' }, { status: 400 });
    }

    if (contact.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Contact is not active' }, { status: 400 });
    }

    // Prepare the email content
    let emailContent = validatedData.message;
    
    // If using template, wrap the message in a professional template
    if (validatedData.useTemplate) {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">MarketSage</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Smart Marketing Solutions</p>
          </div>
          
          <div style="margin: 20px 0;">
            <p style="color: #333; line-height: 1.6;">Dear {{firstName}},</p>
            <div style="color: #333; line-height: 1.6; margin: 20px 0;">
              ${validatedData.message}
            </div>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Best regards,<br>
              MarketSage Team<br>
              📧 info@marketsage.africa | 🌐 www.marketsage.africa
            </p>
          </div>
        </div>
      `;
    }

    // Generate a unique campaign ID for tracking (individual emails)
    const trackingId = `individual-${randomUUID()}`;

    // Send the email using the existing email service
    const result = await sendTrackedEmail(
      contact,
      trackingId,
      {
        from: 'info@marketsage.africa',
        subject: validatedData.subject,
        html: emailContent,
        replyTo: validatedData.replyTo || 'info@marketsage.africa',
        metadata: {
          type: 'individual',
          sentBy: session.user.id,
          contactId: contact.id,
        },
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      sentTo: contact.email,
      contact: {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
      },
    });

  } catch (error) {
    console.error('Error sending individual email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}