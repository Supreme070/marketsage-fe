import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { assignContactToVariant, getVariantContent } from "@/lib/ab-testing";
import { 
  handleApiError, 
  unauthorized, 
  validationError,
  notFound 
} from "@/lib/errors";

// Schema for validating assignment requests
const assignmentSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required")
});

// POST endpoint to assign a contact to a variant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }
  
  try {
    const testId = params.id;
    const body = await request.json();
    
    // Validate the request body
    const result = assignmentSchema.safeParse(body);
    
    if (!result.success) {
      return validationError(result.error.errors);
    }
    
    const { contactId } = result.data;
    
    // Assign the contact to a variant
    const variantId = await assignContactToVariant(testId, contactId);
    
    if (!variantId) {
      // This contact isn't part of the test or test isn't running
      return NextResponse.json({
        included: false,
        message: "Contact not included in test or test not running"
      });
    }
    
    // Get variant content
    const content = await getVariantContent(variantId);
    
    if (!content) {
      return notFound("Variant content not found");
    }
    
    return NextResponse.json({
      included: true,
      variantId,
      content
    });
  } catch (error) {
    return handleApiError(error, "/api/ab-tests/[id]/assign/route.ts [POST]");
  }
} 