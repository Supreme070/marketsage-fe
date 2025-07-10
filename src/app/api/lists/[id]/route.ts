import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

//  Schema for list update validation
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
    return unauthorized();
  }

  const { id: listId } = await params;

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
      return notFound("List not found");
    }

    // Check if user has access to this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
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
    return handleApiError(error, "/api/lists/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: listId } = await params;

  try {
    // First check if list exists and user has access
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return notFound("List not found");
    }

    // Check if user has access to update this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
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
    return handleApiError(error, "/api/lists/[id]/route.ts");
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
    return unauthorized();
  }

  const { id: listId } = await params;

  try {
    // First check if list exists and user has access
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!existingList) {
      return notFound("List not found");
    }

    // Check if user has access to delete this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
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
    return handleApiError(error, "/api/lists/[id]/route.ts");
  }
} 