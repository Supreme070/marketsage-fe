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

//  Schema for adding contacts to a list
const addMembersSchema = z.object({
  contactIds: z.array(z.string()).min(1, "At least one contact must be provided"),
});

// Schema for removing contacts from a list
const removeMembersSchema = z.object({
  contactIds: z.array(z.string()).min(1, "At least one contact must be provided"),
});

// GET list members
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
    // Check if list exists
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return notFound("List not found");
    }

    // Check if user has access to this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && list.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get members with pagination
    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1");
    const limit = Number.parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Get total count first
    const totalCount = await prisma.listMember.count({
      where: { listId },
    });

    // Get the members with contact details
    const listMembers = await prisma.listMember.findMany({
      where: { listId },
      skip,
      take: limit,
      orderBy: {
        addedAt: "desc",
      },
      include: {
        contact: true,
      },
    });

    // Process the data to return clean contact objects with tags
    const members = listMembers.map((member: any) => {
      const contact = member.contact;
      return {
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        jobTitle: contact.jobTitle,
        country: contact.country,
        status: contact.status,
        tags: contact.tagsString ? JSON.parse(contact.tagsString) : [],
        addedAt: member.addedAt,
      };
    });

    return NextResponse.json({
      members,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/lists/[id]/members/route.ts");
  }
}

// POST to add contacts to a list
export async function POST(
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
    // Check if list exists
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return notFound("List not found");
    }

    // Check if user has access to this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && list.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only static lists can have members added directly
    if (list.type !== "STATIC") {
      return NextResponse.json(
        { error: "Cannot add members directly to a dynamic list" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = addMembersSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { contactIds } = validation.data;
    
    // Verify all contacts exist and user has access to them
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        ...(isAdmin ? {} : { createdById: session.user.id }),
      },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: "One or more contacts not found or you don't have access to them" },
        { status: 404 }
      );
    }

    // Check which contacts are already in the list
    const existingMembers = await prisma.listMember.findMany({
      where: {
        listId,
        contactId: { in: contactIds },
      },
      select: {
        contactId: true,
      },
    });

    const existingContactIds = new Set(existingMembers.map((m: any) => m.contactId));
    
    // Filter out contacts that are already members
    const contactsToAdd = contacts.filter((c: any) => !existingContactIds.has(c.id));
    
    if (contactsToAdd.length === 0) {
      return NextResponse.json({
        message: "All contacts are already in the list",
        added: 0,
        total: contacts.length,
      });
    }

    // Add new members
    const memberData = contactsToAdd.map((contact: any) => ({
      listId,
      contactId: contact.id,
    }));

    await prisma.listMember.createMany({
      data: memberData,
    });

    return NextResponse.json({
      message: `Added ${contactsToAdd.length} contacts to the list`,
      added: contactsToAdd.length,
      total: contacts.length,
      alreadyInList: contacts.length - contactsToAdd.length,
    });
  } catch (error) {
    return handleApiError(error, "/api/lists/[id]/members/route.ts");
  }
}

// DELETE to remove contacts from a list
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
    // Check if list exists
    const list = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return notFound("List not found");
    }

    // Check if user has access to this list
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    if (!isAdmin && list.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only static lists can have members removed manually
    if (list.type !== "STATIC") {
      return NextResponse.json(
        { error: "Cannot remove members directly from a dynamic list" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = removeMembersSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { contactIds } = validation.data;
    
    // Remove members
    const result = await prisma.listMember.deleteMany({
      where: {
        listId,
        contactId: { in: contactIds },
      },
    });

    return NextResponse.json({
      message: `Removed ${result.count} contacts from the list`,
      removed: result.count,
    });
  } catch (error) {
    return handleApiError(error, "/api/lists/[id]/members/route.ts");
  }
} 