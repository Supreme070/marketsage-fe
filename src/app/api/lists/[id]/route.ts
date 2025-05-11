import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for list update validation
const listUpdateSchema = z.object({
  name: z.string().min(1, "List name is required").optional(),
  description: z.string().optional(),
  type: z.enum(["STATIC", "DYNAMIC"]).optional(),
});

// GET list by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listId = params.id;

  try {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check if user has access to this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && list.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format the response
    const formattedList = {
      id: list.id,
      name: list.name,
      description: list.description,
      type: list.type,
      memberCount: list._count.members,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      createdById: list.createdById,
    };

    return NextResponse.json(formattedList);
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      { error: "Failed to fetch list" },
      { status: 500 }
    );
  }
}

// PATCH/Update list by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listId = params.id;

  try {
    // First check if list exists and user has access
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check if user has access to update this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingList.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = listUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid list data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const updateData = validation.data;
    
    // Update the list
    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.type !== undefined && { type: updateData.type }),
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Format the response
    const formattedList = {
      id: updatedList.id,
      name: updatedList.name,
      description: updatedList.description,
      type: updatedList.type,
      memberCount: updatedList._count.members,
      createdAt: updatedList.createdAt,
      updatedAt: updatedList.updatedAt,
      createdById: updatedList.createdById,
    };

    return NextResponse.json(formattedList);
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 }
    );
  }
}

// DELETE list by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listId = params.id;

  try {
    // First check if list exists and user has access
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check if user has access to delete this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    if (!isAdmin && existingList.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // First delete all list members to avoid foreign key constraints
    await prisma.listMember.deleteMany({
      where: { listId },
    });

    // Then delete the list
    await prisma.list.delete({
      where: { id: listId },
    });

    return NextResponse.json({ message: "List deleted successfully" });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json(
      { error: "Failed to delete list" },
      { status: 500 }
    );
  }
} 