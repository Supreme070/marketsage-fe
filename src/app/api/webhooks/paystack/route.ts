import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/db/prisma";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required');
}

// Verify Paystack webhook signature
const verifySignature = (payload: string, signature: string) => {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(payload)
    .digest("hex");
  return hash === signature;
};

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const signature = headersList.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 401 }
      );
    }

    const payload = await request.text();
    const isValid = verifySignature(payload, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);

    // Handle different event types
    switch (event.event) {
      case "charge.success": {
        const { reference, status, amount, customer, authorization } = event.data;

        // Check if this is a credit purchase transaction
        if (reference.startsWith('credit_')) {
          // Handle credit purchase
          const creditTransaction = await prisma.creditTransaction.findFirst({
            where: { paymentId: reference },
          });

          if (creditTransaction && creditTransaction.status === 'pending') {
            await prisma.$transaction(async (prisma) => {
              // Update credit transaction status
              await prisma.creditTransaction.update({
                where: { id: creditTransaction.id },
                data: {
                  status: 'completed',
                  metadata: {
                    ...creditTransaction.metadata,
                    paystackTransactionId: event.data.id.toString(),
                    paystackStatus: status,
                    webhookDate: new Date().toISOString(),
                  },
                },
              });

              // Update organization credit balance
              await prisma.organization.update({
                where: { id: creditTransaction.organizationId },
                data: {
                  creditBalance: {
                    increment: creditTransaction.amount,
                  },
                },
              });
            });
          }
        } else {
          // Handle subscription transaction
          const transaction = await prisma.transaction.update({
            where: { paystackReference: reference },
            data: {
              status: "SUCCESS",
              paystackTransactionId: event.data.id.toString(),
            },
            include: {
              subscription: true
            }
          });

          if (transaction.subscription) {
            // Update subscription status
            await prisma.subscription.update({
              where: { id: transaction.subscription.id },
              data: {
                status: "ACTIVE",
                paystackCustomerId: customer.customer_code,
                // If it's a card payment, save the authorization
                ...(authorization && {
                  paymentMethods: {
                    create: {
                      type: "CARD",
                      last4: authorization.last4,
                      expMonth: authorization.exp_month,
                      expYear: authorization.exp_year,
                      brand: authorization.card_type,
                      isDefault: true,
                      paystackAuthorizationCode: authorization.authorization_code,
                      organization: { connect: { id: transaction.subscription.organizationId } }
                    }
                  }
                })
              }
            });

            // Activate subscription and grant permissions
            const { SubscriptionService } = await import("@/lib/subscription-service");
            await SubscriptionService.activateSubscription(
              transaction.subscription.organizationId,
              transaction.subscription.planId,
              transaction.subscription.plan?.interval as "monthly" | "annually" || "monthly"
            );
          }
        }

        break;
      }

      case "charge.failed": {
        const { reference } = event.data;

        // Check if this is a credit purchase transaction
        if (reference.startsWith('credit_')) {
          // Handle failed credit purchase
          const creditTransaction = await prisma.creditTransaction.findFirst({
            where: { paymentId: reference },
          });

          if (creditTransaction && creditTransaction.status === 'pending') {
            await prisma.creditTransaction.update({
              where: { id: creditTransaction.id },
              data: {
                status: 'failed',
                metadata: {
                  ...creditTransaction.metadata,
                  paystackTransactionId: event.data.id.toString(),
                  paystackStatus: 'failed',
                  webhookDate: new Date().toISOString(),
                },
              },
            });
          }
        } else {
          // Handle subscription transaction
          const transaction = await prisma.transaction.update({
            where: { paystackReference: reference },
            data: {
              status: "FAILED",
              paystackTransactionId: event.data.id.toString(),
            },
            include: {
              subscription: true
            }
          });

          if (transaction.subscription) {
            // Update subscription status
            await prisma.subscription.update({
              where: { id: transaction.subscription.id },
              data: {
                status: "PAST_DUE"
              }
            });
          }
        }

        break;
      }

      case "subscription.create": {
        // Handle subscription creation
        const { customer, plan, authorization } = event.data;
        
        // Update subscription with Paystack subscription ID
        await prisma.subscription.updateMany({
          where: {
            paystackCustomerId: customer.customer_code,
            planId: plan.plan_code
          },
          data: {
            paystackSubscriptionId: event.data.subscription_code,
            status: "ACTIVE"
          }
        });

        break;
      }

      case "subscription.disable": {
        const { subscription_code } = event.data;

        // Update subscription status
        await prisma.subscription.updateMany({
          where: { paystackSubscriptionId: subscription_code },
          data: {
            status: "CANCELED",
            canceledAt: new Date()
          }
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 