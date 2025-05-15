import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Get all integrations for the current user's organization
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user's organization ID (assuming users belong to organizations)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get all integrations for this organization
    const integrations = await prisma.integration.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSyncedAt: true,
      },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// Create a new integration
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins and above can add integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, name, credentials } = body;

    if (!type || !name || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the user's organization ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Encrypt credentials before storing
    // In a real app, you'd use encryption here
    const encryptedCredentials = JSON.stringify(credentials);

    // Create the integration
    const integration = await prisma.integration.create({
      data: {
        type,
        name,
        status: "PENDING",
        credentials: encryptedCredentials,
        organization: {
          connect: { id: user.organizationId },
        },
        createdBy: session.user.id,
      },
    });

    // Trigger the verification process
    // This should be a background job in a real application
    const verificationResult = await verifyIntegrationConnection(
      integration.id,
      type,
      credentials
    );

    return NextResponse.json({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      status: verificationResult.status,
      message: verificationResult.message,
    });
  } catch (error) {
    console.error("Error creating integration:", error);
    return NextResponse.json(
      { error: "Failed to create integration" },
      { status: 500 }
    );
  }
}

// Helper function to verify integration connection
// In a real app, this would call the actual API of the integration
async function verifyIntegrationConnection(
  integrationId: string,
  type: string,
  credentials: any
) {
  try {
    // Simulate API verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll use a simple validation
    // In a real app, you'd make actual API calls to the integration services
    let isValid = true;
    
    // Basic validation based on integration type
    switch (type) {
      case "ECOMMERCE_SHOPIFY":
        isValid = !!credentials.apiKey && !!credentials.apiSecret && !!credentials.storeUrl;
        break;
      case "PAYMENT_STRIPE":
        isValid = !!credentials.secretKey && !!credentials.publishableKey;
        break;
      // Add other integration types as needed
      default:
        isValid = Object.values(credentials).every(val => !!val);
    }
    
    // Update the integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: isValid ? "ACTIVE" : "ERROR",
        lastSyncedAt: isValid ? new Date() : null,
      },
    });
    
    return {
      status: isValid ? "ACTIVE" : "ERROR",
      message: isValid 
        ? "Successfully connected" 
        : "Failed to connect. Please check your credentials."
    };
  } catch (error) {
    console.error("Error verifying integration:", error);
    
    // Update the integration status to ERROR
    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: "ERROR" },
    });
    
    return {
      status: "ERROR",
      message: "An unexpected error occurred during verification."
    };
  }
} 