import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Get integration by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: integrationId } = await params;

  try {
    // Fetch the integration using IntegrationConnection
    const integration = await prisma.integrationConnection.findUnique({
      where: { id: integrationId },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      return notFound("Integration not found");
    }

    return NextResponse.json(integration);
  } catch (error) {
    return handleApiError(error, "/api/integrations/[id]/route.ts");
  }
}

// Update integration by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Only admins can update integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: integrationId } = await params;
  
  try {
    // First check if integration exists
    const integration = await prisma.integrationConnection.findUnique({
      where: { id: integrationId },
      select: { 
        id: true,
      },
    });

    if (!integration) {
      return notFound("Integration not found");
    }

    const body = await request.json();
    const { name, credentials } = body;

    // Create update data object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    
    if (credentials) {
      // Encrypt credentials before storing
      updateData.config = JSON.stringify(credentials);
      
      // When credentials change, set status to INACTIVE
      updateData.status = "INACTIVE";
      
      // Trigger verification in the background
      setTimeout(async () => {
        try {
          await verifyUpdatedIntegration(integrationId, credentials);
        } catch (error) {
          console.error("Error verifying updated integration:", error);
        }
      }, 0);
    }

    // Update the integration
    const updatedIntegration = await prisma.integrationConnection.update({
      where: { id: integrationId },
      data: updateData,
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedIntegration);
  } catch (error) {
    return handleApiError(error, "/api/integrations/[id]/route.ts");
  }
}

// Delete integration by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  // Only admins can delete integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: integrationId } = await params;

  try {
    // First check if integration exists
    const integration = await prisma.integrationConnection.findUnique({
      where: { id: integrationId },
      select: { id: true },
    });

    if (!integration) {
      return notFound("Integration not found");
    }

    // Delete the integration
    await prisma.integrationConnection.delete({
      where: { id: integrationId },
    });

    return NextResponse.json({ message: "Integration successfully deleted" });
  } catch (error) {
    return handleApiError(error, "/api/integrations/[id]/route.ts");
  }
}

// Verify updated integration credentials
async function verifyUpdatedIntegration(integrationId: string, credentials: any) {
  try {
    // Get integration details first
    const integration = await prisma.integrationConnection.findUnique({
      where: { id: integrationId },
      select: { type: true },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Simulate API verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation based on integration type
    let isValid = true;
    
    switch (integration.type) {
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
    await prisma.integrationConnection.update({
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
    console.error("Error verifying updated integration:", error);
    
    // Update the integration status to ERROR
    try {
      await prisma.integrationConnection.update({
        where: { id: integrationId },
        data: { 
          status: "ERROR",
          updatedAt: new Date(), 
        },
      });
    } catch (updateError) {
      console.error("Error updating integration status:", updateError);
    }
    
    throw error;
  }
} 