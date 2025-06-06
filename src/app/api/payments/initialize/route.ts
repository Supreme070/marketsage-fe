import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { nanoid } from "nanoid";
import type { User, Organization } from "@prisma/client";

interface UserWithOrganization extends User {
  organization: Organization | null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body;

    // Get the user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    }) as UserWithOrganization | null;

    if (!user?.organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get the subscription plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Generate a unique reference
    const reference = `pay_${nanoid()}`;

    // Create a pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: plan.price,
        currency: plan.currency,
        paystackReference: reference,
        subscription: {
          create: {
            organization: { connect: { id: user.organization.id } },
            plan: { connect: { id: plan.id } },
            status: "TRIALING",
          }
        }
      }
    });

    // Initialize payment with Paystack
    const paymentData = await initializeTransaction({
      email: user.email,
      amount: plan.price,
      reference,
      metadata: {
        planId: plan.id,
        organizationId: user.organization.id,
        transactionId: transaction.id
      }
    });

    return NextResponse.json(paymentData);
  } catch (error) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
} 