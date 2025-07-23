import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { verifyTransaction } from '@/lib/paystack';
import { z } from 'zod';

const verifySchema = z.object({
  reference: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reference } = verifySchema.parse(body);

    // Find the pending transaction
    const transaction = await prisma.creditTransaction.findFirst({
      where: {
        paymentId: reference,
        organizationId: session.user.organization.id,
        status: 'pending',
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify payment with Paystack
    const paystackResponse = await verifyTransaction(reference);

    if (!paystackResponse.status) {
      throw new Error(paystackResponse.message || 'Payment verification failed');
    }

    const paymentData = paystackResponse.data;

    if (paymentData.status === 'success') {
      // Payment successful, update transaction and credit balance
      const result = await prisma.$transaction(async (prisma) => {
        // Update credit transaction record
        await prisma.creditTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            metadata: {
              ...transaction.metadata,
              paystackTransactionId: paymentData.id,
              paystackStatus: paymentData.status,
              verificationDate: new Date().toISOString(),
            },
          },
        });

        // Update organization credit balance
        const updatedOrg = await prisma.organization.update({
          where: { id: session.user.organization.id },
          data: {
            creditBalance: {
              increment: transaction.amount,
            },
          },
          select: {
            creditBalance: true,
          },
        });

        return updatedOrg;
      });

      return NextResponse.json({
        success: true,
        status: 'completed',
        newBalance: result.creditBalance,
        purchasedAmount: transaction.amount,
        transactionId: paymentData.id,
      });
    } else {
      // Payment failed, update transaction status
      await prisma.creditTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          metadata: {
            ...transaction.metadata,
            paystackTransactionId: paymentData.id,
            paystackStatus: paymentData.status,
            verificationDate: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Payment was not successful',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}