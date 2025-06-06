import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
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

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return validationError("Email already exists");
    }

    // Hash password (use higher rounds in production)
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await hash(password, saltRounds);

    // Create user with company if provided
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        company,
        role: 'USER', // Default role
        isActive: true,
        emailVerified: null, // Will be set after email verification
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        createdAt: true,
      }
    });

    // Create default user preferences
    await prisma.userPreference.create({
      data: {
        userId: newUser.id,
        preferences: JSON.stringify({
          theme: 'light',
          notifications: true,
          emailNotifications: true,
        })
      }
    });

    return NextResponse.json({
      message: "User registered successfully",
      user: newUser
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return handleApiError(error, "An error occurred during registration");
  }
}
