import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Get all integrations
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Use Integration model (not IntegrationConnection)
    const integrations = await prisma.integration.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    return handleApiError(error, "/api/integrations/route.ts");
  }
}

// Create a new integration
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Only admins and above can add integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, name, description, credentials } = body;

    if (!type || !name || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Encrypt credentials before storing
    // In a real app, you'd use encryption here
    const credentialsData = JSON.stringify(credentials);
    
    // Generate a random UUID for the ID
    const id = randomUUID();

    // Create the integration using the correct Integration model
    const integration = await prisma.integration.create({
      data: {
        id,
        name,
        type,
        description: description || null,
        credentials: credentialsData,
        status: "PENDING", // Start as pending until verified
        organizationId: (session.user as any).organizationId || "default-org", // Fallback to default
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Trigger the verification process
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
    return handleApiError(error, "/api/integrations/route.ts");
  }
}

// Helper function to verify integration connection
async function verifyIntegrationConnection(
  integrationId: string,
  type: string,
  credentials: any
) {
  try {
    // Simulate API verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll use a simple validation
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
    
    // Update the integration status using the correct Integration model
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: isValid ? "ACTIVE" : "ERROR",
        updatedAt: new Date(),
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
    try {
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: "ERROR",
          updatedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error("Error updating integration status:", updateError);
    }
    
    return {
      status: "ERROR",
      message: "An unexpected error occurred during verification."
    };
  }
} 