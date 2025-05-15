import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Get integration by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const integrationId = params.id;

  try {
    // Fetch the integration
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastSyncedAt: true,
        organizationId: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Check if user has access to this integration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (user?.organizationId !== integration.organizationId && 
        !["SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can update integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const integrationId = params.id;
  
  try {
    // First check if integration exists and user has access
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { 
        id: true,
        organizationId: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Check if user has access to this integration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (user?.organizationId !== integration.organizationId && 
        !["SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, credentials } = body;

    // Create update data object
    const updateData: any = {};

    if (name) updateData.name = name;
    
    if (credentials) {
      // Encrypt credentials before storing
      // In a real app, you'd use encryption here
      updateData.credentials = JSON.stringify(credentials);
      
      // When credentials change, set status to PENDING
      updateData.status = "PENDING";
      
      // Trigger verification in the background
      // In a real app, this would be a background job
      setTimeout(async () => {
        try {
          await verifyUpdatedIntegration(integrationId, credentials);
        } catch (error) {
          console.error("Error verifying updated integration:", error);
        }
      }, 0);
    }

    // Update the integration
    const updatedIntegration = await prisma.integration.update({
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
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can delete integrations
  if (!["ADMIN", "SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const integrationId = params.id;

  try {
    // First check if integration exists and user has access
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      select: { 
        id: true,
        organizationId: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Check if user has access to this integration
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (user?.organizationId !== integration.organizationId && 
        !["SUPER_ADMIN", "IT_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the integration
    await prisma.integration.delete({
      where: { id: integrationId },
    });

    return NextResponse.json({ message: "Integration successfully deleted" });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}

// Verify updated integration credentials
async function verifyUpdatedIntegration(integrationId: string, credentials: any) {
  try {
    // Get integration details first
    const integration = await prisma.integration.findUnique({
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
    console.error("Error verifying updated integration:", error);
    
    // Update the integration status to ERROR
    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: "ERROR" },
    });
    
    throw error;
  }
} 