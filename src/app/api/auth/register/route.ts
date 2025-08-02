import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { 
  handleApiError, 
  validationError 
} from "@/lib/errors";

//  Registration schema validation
const registrationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body against schema
    const validation = registrationSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.errors[0].message);
    }

    const { name, email, password, company } = validation.data;

    // Use API client to register user with backend
    const response = await apiClient.register(email, password, name, company);
    
    if (response.success) {
      return NextResponse.json({
        message: "User registered successfully",
        user: response.data
      }, { status: 201 });
    } else {
      // Handle API error response
      const errorMessage = response.error?.message || "Registration failed";
      return validationError(errorMessage);
    }
  } catch (error) {
    console.error("Registration error:", error);
    return handleApiError(error, "An error occurred during registration");
  }
}
