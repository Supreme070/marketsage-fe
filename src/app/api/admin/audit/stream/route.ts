import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAdmin, getAdminPermissions } from "@/lib/admin-config";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is authorized admin
  const userRole = (session.user as any)?.role;
  if (!isAuthorizedAdmin(session.user.email, userRole)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Check permissions
  const permissions = getAdminPermissions(userRole);
  if (!permissions.canViewAudit) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Poll for new audit logs
      let lastTimestamp = new Date();
      const interval = setInterval(async () => {
        try {
          // Fetch new logs since last check
          const newLogs = await prisma.leadPulseAuditLog.findMany({
            where: {
              timestamp: {
                gt: lastTimestamp,
              },
            },
            orderBy: {
              timestamp: "desc",
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          if (newLogs.length > 0) {
            // Update last timestamp
            lastTimestamp = new Date(newLogs[0].timestamp);

            // Send new logs
            for (const log of newLogs) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "audit_log",
                    data: log,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          console.error("Error fetching new audit logs:", error);
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}