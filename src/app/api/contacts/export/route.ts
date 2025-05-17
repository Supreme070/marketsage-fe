import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Function to parse tags from string
function tagsFromString(tagsString: string | null): string[] {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString);
  } catch (e) {
    return [];
  }
}

// Simple CSV generator function
function generateCsv(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if needed
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      } else if (value instanceof Date) {
        return value.toISOString();
      } else {
        return String(value);
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

// Type for a contact result
interface ContactRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  notes: string | null;
  tagsString: string | null;
  source: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  [key: string]: any; // Allow for other fields
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    // Get query parameters for filtering
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status");
    
    // Get all contacts for the user
    const contacts = await prisma.contact.findMany({
      where: {
        createdById: session.user.id,
        ...(statusFilter ? { status: statusFilter as any } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process contacts for export
    const processedContacts = contacts.map((contact: ContactRecord) => {
      const tags = tagsFromString(contact.tagsString);
      
      return {
        id: contact.id,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        company: contact.company || "",
        jobTitle: contact.jobTitle || "",
        address: contact.address || "",
        city: contact.city || "",
        state: contact.state || "",
        country: contact.country || "",
        postalCode: contact.postalCode || "",
        notes: contact.notes || "",
        status: contact.status,
        tags: tags.join(", "),
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      };
    });

    // Generate CSV
    const csv = generateCsv(processedContacts);
    
    // Create response with CSV file
    const response = new NextResponse(csv);
    
    // Set headers for file download
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", `attachment; filename="contacts-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;
  } catch (error) {
    return handleApiError(error, "/api/contacts/export/route.ts");
  }
} 