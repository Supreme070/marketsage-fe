import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for segment update validation
const segmentUpdateSchema = z.object({
  name: z.string().min(1, "Segment name is required").optional(),
  description: z.string().optional(),
  rules: z.string().min(2, "Rules are required for a segment").optional(), // JSON string
});

// GET segment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segmentId = params.id;

  try {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Check if user has access to this segment
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && segment.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error fetching segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

// PATCH/Update segment by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segmentId = params.id;

  try {
    // First check if segment exists and user has access
    const existingSegment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!existingSegment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Check if user has access to update this segment
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingSegment.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = segmentUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid segment data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updateData = validation.data;
    
    // Validate that rules is a valid JSON string if it's being updated
    if (updateData.rules) {
      try {
        JSON.parse(updateData.rules);
      } catch (e) {
        return NextResponse.json(
          { error: "Rules must be a valid JSON string" },
          { status: 400 }
        );
      }
    }
    
    // Update the segment
    const updatedSegment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.rules !== undefined && { rules: updateData.rules }),
      },
    });

    return NextResponse.json(updatedSegment);
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

// DELETE segment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const segmentId = params.id;

  try {
    // First check if segment exists and user has access
    const existingSegment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!existingSegment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // Check if user has access to delete this segment
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingSegment.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the segment
    await prisma.segment.delete({
      where: { id: segmentId },
    });

    return NextResponse.json({ message: "Segment deleted successfully" });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
} 