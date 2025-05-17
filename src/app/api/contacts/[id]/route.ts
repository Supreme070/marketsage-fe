import { NextRequest, NextResponse } from "next/server";
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

//  Schema for contact update validation
const contactUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  status: z.enum(["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "SPAM"]).optional(),
});

// Function to convert tags array to JSON string
function tagsToString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

// Function to parse tags from string
function tagsFromString(tagsString: string | null): string[] {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString);
  } catch (e) {
    return [];
  }
}

// GET contact by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: contactId } = await params;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return notFound("Contact not found");
    }

    // Check if user has access to this contact
    if (contact.createdById !== session.user.id && session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return forbidden("You do not have permission to access this contact");
    }

    // Return contact with processed tags
    return NextResponse.json({
      ...contact,
      tags: tagsFromString(contact.tagsString),
    });
  } catch (error) {
    return handleApiError(error, "/api/contacts/[id]/route.ts");
  }
}

// PATCH/Update contact by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: contactId } = await params;

  try {
    // First check if contact exists and user has access
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      return notFound("Contact not found");
    }

    // Check if user has access to update this contact
    if (existingContact.createdById !== session.user.id && session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return forbidden("You do not have permission to update this contact");
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = contactUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError("Invalid contact data", validation.error.format());
    }

    const updateData = validation.data;
    
    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(updateData.email !== undefined && { email: updateData.email }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
        ...(updateData.firstName !== undefined && { firstName: updateData.firstName }),
        ...(updateData.lastName !== undefined && { lastName: updateData.lastName }),
        ...(updateData.company !== undefined && { company: updateData.company }),
        ...(updateData.jobTitle !== undefined && { jobTitle: updateData.jobTitle }),
        ...(updateData.address !== undefined && { address: updateData.address }),
        ...(updateData.city !== undefined && { city: updateData.city }),
        ...(updateData.state !== undefined && { state: updateData.state }),
        ...(updateData.country !== undefined && { country: updateData.country }),
        ...(updateData.postalCode !== undefined && { postalCode: updateData.postalCode }),
        ...(updateData.notes !== undefined && { notes: updateData.notes }),
        ...(updateData.tags !== undefined && { tagsString: tagsToString(updateData.tags) }),
        ...(updateData.source !== undefined && { source: updateData.source }),
        ...(updateData.status !== undefined && { status: updateData.status }),
      },
    });

    // Return the updated contact with processed tags
    return NextResponse.json({
      ...updatedContact,
      tags: updateData.tags || tagsFromString(updatedContact.tagsString),
    });
  } catch (error) {
    return handleApiError(error, "/api/contacts/[id]/route.ts");
  }
}

// DELETE contact by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  const { id: contactId } = await params;

  try {
    // First check if contact exists and user has access
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!existingContact) {
      return notFound("Contact not found");
    }

    // Check if user has access to delete this contact
    if (existingContact.createdById !== session.user.id && session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return forbidden("You do not have permission to delete this contact");
    }

    // Delete the contact
    await prisma.contact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    return handleApiError(error, "/api/contacts/[id]/route.ts");
  }
} 