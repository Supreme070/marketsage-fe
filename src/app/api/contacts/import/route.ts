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
import { randomUUID } from "crypto";

//  Schema for contact validation
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

// Type for contact data from the schema
type ContactData = z.infer<typeof contactSchema>;

// Function to convert tags array to JSON string
function tagsToString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return JSON.stringify(tags);
}

// Simple CSV parser function
function parseCsv(csvText: string): { data: Record<string, string>[], errors: any[] } {
  const errors: any[] = [];
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length < 2) {
    errors.push({ message: "CSV file must contain a header row and at least one data row" });
    return { data: [], errors };
  }
  
  // Parse header row
  const headers = parseRow(lines[0]);
  
  // Parse data rows
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const row = parseRow(lines[i]);
      
      if (row.length !== headers.length) {
        errors.push({
          message: `Row ${i} has ${row.length} columns, but header has ${headers.length} columns`,
          row: i
        });
        continue;
      }
      
      const dataObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        dataObj[header] = row[index];
      });
      
      data.push(dataObj);
    } catch (error) {
      errors.push({
        message: `Error parsing row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        row: i
      });
    }
  }
  
  return { data, errors };
}

// Helper function to parse a CSV row, handling quotes and commas
function parseRow(rowText: string): string[] {
  const row: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    
    if (char === '"') {
      if (inQuotes && rowText[i + 1] === '"') {
        // Handle escaped quote ("") within quoted string
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      row.push(currentValue);
      currentValue = '';
    } else {
      // Add character to current value
      currentValue += char;
    }
  }
  
  // Add the last value
  row.push(currentValue);
  
  return row;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file content
    const fileText = await file.text();
    
    // Parse CSV
    const { data, errors } = parseCsv(fileText);

    if (errors.length > 0 && data.length === 0) {
      return NextResponse.json(
        { error: "Error parsing CSV file", details: errors },
        { status: 400 }
      );
    }

    // Validate and prepare contacts for import
    const validContacts: ContactData[] = [];
    const invalidContacts: Array<{data: any, errors: any}> = [];

    for (const row of data) {
      // Try to parse tags if they exist
      let tags: string[] = [];
      if (row.tags) {
        try {
          // Check if tags is already a string representation of an array
          if (row.tags.startsWith("[") && row.tags.endsWith("]")) {
            tags = JSON.parse(row.tags);
          } else {
            // Otherwise, split by comma
            tags = row.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
          }
        } catch (e) {
          // If parsing fails, treat as comma-separated list
          tags = row.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
        }
      }

      // Create contact object with parsed tags
      const contactData = {
        email: row.email || null,
        phone: row.phone || null,
        firstName: row.firstName || row["first name"] || row["First Name"] || "",
        lastName: row.lastName || row["last name"] || row["Last Name"] || null,
        company: row.company || row.organization || null,
        jobTitle: row.jobTitle || row["job title"] || row["Job Title"] || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        country: row.country || null,
        postalCode: row.postalCode || row["postal code"] || row["Postal Code"] || null,
        notes: row.notes || null,
        tags,
        source: "import",
      };

      // Validate the contact data
      const validation = contactSchema.safeParse(contactData);
      if (validation.success) {
        validContacts.push(validation.data);
      } else {
        invalidContacts.push({
          data: contactData,
          errors: validation.error.format(),
        });
      }
    }

    // Save valid contacts to database
    const savedContacts = [];
    for (const contact of validContacts) {
      const savedContact = await prisma.contact.create({
        data: {
          id: randomUUID(), // Generate a random UUID for the contact
          email: contact.email,
          phone: contact.phone,
          firstName: contact.firstName,
          lastName: contact.lastName,
          company: contact.company,
          jobTitle: contact.jobTitle,
          address: contact.address,
          city: contact.city,
          state: contact.state,
          country: contact.country,
          postalCode: contact.postalCode,
          notes: contact.notes,
          tagsString: tagsToString(contact.tags),
          source: contact.source,
          status: "ACTIVE", // Add default status
          createdById: session.user.id,
          updatedAt: new Date(), // Add current date for updatedAt
        } as any, // Use type assertion to bypass type checking if needed
      });

      savedContacts.push({
        ...savedContact,
        tags: contact.tags || [],
      });
    }

    return NextResponse.json({
      success: true,
      imported: savedContacts.length,
      failed: invalidContacts.length,
      contacts: savedContacts,
      errors: invalidContacts.length > 0 ? invalidContacts : undefined,
    });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
} 