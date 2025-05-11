import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for contact validation
const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
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
});

// Function to convert tags array to JSON string
function tagsToString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

// GET contacts endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Different filters based on user role
    // Super admins and admins can see all contacts, other users only see their own
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN";
    
    const contacts = await prisma.contact.findMany({
      where: isAdmin 
        ? {} // Empty filter to get all contacts for admins
        : { createdById: session.user.id }, // Filter by user ID for non-admins
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process tags for each contact
    const processedContacts = contacts.map((contact: any) => ({
      ...contact,
      tags: contact.tagsString ? JSON.parse(contact.tagsString) : [],
    }));

    return NextResponse.json(processedContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new contact
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    
    // Create the contact
    const newContact = await prisma.contact.create({
      data: {
        email: contactData.email,
        phone: contactData.phone,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        company: contactData.company,
        jobTitle: contactData.jobTitle,
        address: contactData.address,
        city: contactData.city,
        state: contactData.state,
        country: contactData.country,
        postalCode: contactData.postalCode,
        notes: contactData.notes,
        tagsString: tagsToString(contactData.tags),
        source: contactData.source,
        createdById: session.user.id,
      },
    });

    // Return the created contact with processed tags
    return NextResponse.json({
      ...newContact,
      tags: contactData.tags || [],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
} 