import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcrypt";
import prisma from "@/lib/db/prisma";
import { getVerifiedRegistration, deletePendingRegistration } from "@/lib/registration";

const completeRegisterSchema = z.object({
  registrationId: z.string(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = completeRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { registrationId, password } = validation.data;

    // Get verified registration
    const registration = getVerifiedRegistration(registrationId);
    if (!registration) {
      return NextResponse.json(
        { message: "Invalid or expired registration" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: registration.name,
        email: registration.email,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        // Create default preferences
        preference: {
          create: {
            preferences: JSON.stringify({
              theme: 'light',
              notifications: true,
              emailNotifications: true,
            })
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    // Clean up registration data
    deletePendingRegistration(registrationId);

    return NextResponse.json({
      message: "Registration completed successfully",
      user
    });
  } catch (error) {
    console.error("Registration completion error:", error);
    return NextResponse.json(
      { message: "An error occurred while completing registration" },
      { status: 500 }
    );
  }
} 