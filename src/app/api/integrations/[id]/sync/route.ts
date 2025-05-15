import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Trigger a manual sync for an integration
export async function POST(
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
    // First check if integration exists
    const integration = await prisma.user.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Simulate a synchronization process
    // In a real app, this would trigger a background job
    
    // Start a sync task and return immediately
    const syncTask = {
      id: `sync-${Date.now()}`,
      integrationId: integrationId,
      status: "RUNNING",
      startedAt: new Date(),
    };
    
    // In a real app, you'd store this task in the database
    // and have a background worker process it
    
    // For demo purposes, we'll simulate the sync happening in the background
    setTimeout(async () => {
      try {
        await simulateSyncProcess(integrationId);
      } catch (error) {
        console.error(`Error in background sync for integration ${integrationId}:`, error);
      }
    }, 0);

    return NextResponse.json({
      taskId: syncTask.id,
      status: syncTask.status,
      message: "Synchronization started successfully",
      startedAt: syncTask.startedAt,
    });
  } catch (error) {
    console.error("Error triggering sync:", error);
    return NextResponse.json(
      { error: "Failed to trigger synchronization" },
      { status: 500 }
    );
  }
}

// Get sync status for an integration
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
    // In a real app, you'd fetch the actual sync status from your database
    // For this demo, we'll just return a simulated status
    
    // First check if integration exists
    const integration = await prisma.user.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }
    
    // For demo purpose, generate a random status
    const statuses = ["COMPLETED", "RUNNING", "FAILED"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const syncInfo = {
      integrationId: integrationId,
      lastSyncStatus: randomStatus,
      lastSyncAt: new Date(),
      recordsProcessed: randomStatus === "FAILED" ? 0 : Math.floor(Math.random() * 1000),
      message: randomStatus === "FAILED" 
        ? "Sync failed due to API error" 
        : randomStatus === "RUNNING" 
          ? "Sync in progress" 
          : "Sync completed successfully",
    };

    return NextResponse.json(syncInfo);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: "Failed to fetch synchronization status" },
      { status: 500 }
    );
  }
}

// Simulate a sync process
async function simulateSyncProcess(integrationId: string) {
  console.log(`Starting sync for integration ${integrationId}`);
  
  // Simulate processing time
  const processingTime = Math.random() * 5000 + 2000;
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // In a real app, you'd:
  // 1. Fetch data from the external API
  // 2. Process and transform the data
  // 3. Save it to your database
  // 4. Update sync status and metrics
  
  // Simulate success or failure (80% success rate)
  const success = Math.random() > 0.2;
  
  if (success) {
    console.log(`Sync completed for integration ${integrationId}`);
    
    // Update integration's lastSyncedAt
    await prisma.integration.update({
      where: { id: integrationId },
      data: { 
        lastSyncedAt: new Date(),
        status: "ACTIVE",  // Ensure status is ACTIVE
      },
    });
  } else {
    console.log(`Sync failed for integration ${integrationId}`);
    
    // Don't update lastSyncedAt on failure
    await prisma.integration.update({
      where: { id: integrationId },
      data: { 
        status: "ERROR",  // Set status to ERROR
      },
    });
  }
  
  return { success };
} 