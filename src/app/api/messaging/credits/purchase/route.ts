import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { initializeTransaction, verifyTransaction, formatAmount } from '@/lib/paystack';
import { BulkPricingCalculator } from '@/lib/pricing/bulk-pricing';
import { z } from 'zod';

const purchaseSchema = z.object({
  amount: z.number().min(10).max(10000),
  paymentMethod: z.enum(['paystack', 'stripe', 'flutterwave', 'razorpay', 'manual']).optional().default('paystack'),
  region: z.string().optional().default('global'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, region } = purchaseSchema.parse(body);

    // Validate purchase amount
    const validation = BulkPricingCalculator.validateAmount(amount);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Calculate bulk pricing
    const pricing = BulkPricingCalculator.calculatePrice(amount);
    const processingFee = BulkPricingCalculator.calculateProcessingFee(pricing.finalAmount, paymentMethod);
    const totalAmount = pricing.finalAmount + processingFee;

    // Generate unique reference for this transaction
    const reference = `credit_${session.user.organization.id}_${Date.now()}`;

    if (paymentMethod === 'paystack') {
      // Initialize Paystack transaction
      const paystackResponse = await initializeTransaction({
        email: session.user.email,
        amount: totalAmount, // Amount in USD, will be converted to kobo
        reference,
        metadata: {
          organizationId: session.user.organization.id,
          userId: session.user.id,
          type: 'credit_purchase',
          baseAmount: amount,
          discountAmount: pricing.discount,
          bonusCredits: pricing.bonusCredits,
          totalCredits: pricing.totalCredits,
          processingFee,
          tier: pricing.tier.id,
        },
        callback_url: `${process.env.NEXTAUTH_URL}/settings/messaging?payment=success`,
      });

      if (!paystackResponse.status) {
        throw new Error(paystackResponse.message || 'Failed to initialize payment');
      }

      // Create pending credit transaction record
      await prisma.creditTransaction.create({
        data: {
          organizationId: session.user.organization.id,
          type: 'purchase',
          amount: pricing.totalCredits,
          description: `Credit purchase - ${pricing.tier.name} (${pricing.totalCredits} credits)`,
          paymentMethod,
          paymentId: reference,
          status: 'pending',
          metadata: {
            paymentMethod,
            paystackReference: reference,
            paystackAccessCode: paystackResponse.data.access_code,
            purchaseDate: new Date().toISOString(),
            baseAmount: amount,
            discountAmount: pricing.discount,
            bonusCredits: pricing.bonusCredits,
            processingFee,
            tier: pricing.tier.id,
            region,
          },
        },
      });

      return NextResponse.json({
        success: true,
        paymentUrl: paystackResponse.data.authorization_url,
        reference,
        accessCode: paystackResponse.data.access_code,
        pricing: {
          baseAmount: amount,
          discount: pricing.discount,
          bonusCredits: pricing.bonusCredits,
          totalCredits: pricing.totalCredits,
          finalAmount: pricing.finalAmount,
          processingFee,
          totalAmount,
          tier: pricing.tier,
        },
      });
    } else if (paymentMethod === 'manual') {
      // For manual/testing purposes only
      const result = await prisma.$transaction(async (prisma) => {
        // Create credit transaction record
        await prisma.creditTransaction.create({
          data: {
            organizationId: session.user.organization.id,
            type: 'purchase',
            amount: pricing.totalCredits,
            description: `Manual credit purchase - ${pricing.tier.name} (${pricing.totalCredits} credits)`,
            paymentMethod,
            paymentId: reference,
            status: 'completed',
            metadata: {
              paymentMethod,
              purchaseDate: new Date().toISOString(),
              baseAmount: amount,
              discountAmount: pricing.discount,
              bonusCredits: pricing.bonusCredits,
              tier: pricing.tier.id,
              region,
            },
          },
        });

        // Update organization credit balance
        const updatedOrg = await prisma.organization.update({
          where: { id: session.user.organization.id },
          data: {
            creditBalance: {
              increment: pricing.totalCredits,
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
        newBalance: result.creditBalance,
        purchasedAmount: pricing.totalCredits,
        reference,
        pricing: {
          baseAmount: amount,
          discount: pricing.discount,
          bonusCredits: pricing.bonusCredits,
          totalCredits: pricing.totalCredits,
          finalAmount: pricing.finalAmount,
          tier: pricing.tier,
        },
      });
    } else {
      return NextResponse.json({ error: 'Payment method not supported' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error purchasing credits:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}