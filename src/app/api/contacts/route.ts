import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { ContactStatus } from "@prisma/client";
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from "@/lib/errors";
import { smsService } from "@/lib/sms-providers/sms-service";

// Schema for contact validation
const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional().refine(
    (phone) => !phone || smsService.validatePhoneNumber(phone),
    {
      message: "Invalid phone number format. Must be a valid African phone number (e.g., +234XXXXXXXXX, 0XXXXXXXXXX)"
    }
  ),
  firstName: z.string().min(1, "First name is required"),
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
  customFields: z.record(z.string(), z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// Function to convert tags array to JSON string
function tagsToString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

// GET contacts endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Different filters based on user role
    // Super admins and admins can see all contacts, other users only see their own
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN";
    
    const contacts = await prisma.contact.findMany({
      where: isAdmin 
        ? {} // Empty filter to get all contacts for admins
        : { createdById: session.user.id }, // Filter by user ID for non-admins
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process tags for each contact
    const processedContacts = contacts.map((contact: any) => {
      let parsedTags = [];
      
      // Safely parse tags
      if (contact.tagsString) {
        try {
          parsedTags = JSON.parse(contact.tagsString);
          // Ensure the result is an array
          if (!Array.isArray(parsedTags)) {
            parsedTags = [];
          }
        } catch (e) {
          console.error(`Error parsing tags for contact ${contact.id}:`, e);
          // Return empty array if parsing fails
          parsedTags = [];
        }
      }
      
      return {
        ...contact,
        tags: parsedTags,
      };
    });

    return NextResponse.json(processedContacts);
  } catch (error) {
    // Use the global error handler
    return handleApiError(error, "/api/contacts");
  }
}

// POST endpoint to create a new contact
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validation = contactSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid contact data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const contactData = validation.data;
    const now = new Date();
    
    // Create the contact
    const newContact = await prisma.contact.create({
      data: {
        id: randomUUID(),
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        phone: contactData.phone,
        company: contactData.company,
        jobTitle: contactData.jobTitle,
        country: contactData.country,
        state: contactData.state,
        city: contactData.city,
        // customFields temporarily disabled due to schema issues
        status: (contactData.status as ContactStatus) || ContactStatus.ACTIVE,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Trigger workflow events for contact creation
    try {
      const { triggerManager } = await import('@/lib/workflow/trigger-manager');
      await triggerManager.onContactCreated(newContact.id);
    } catch (triggerError) {
      // Log error but don't fail contact creation
      console.error('Failed to trigger workflow events:', triggerError);
    }

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/contacts/route.ts");
  }
} 