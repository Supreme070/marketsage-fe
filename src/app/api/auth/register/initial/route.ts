import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { generateRegistrationId, generatePin, storePendingRegistration } from "@/lib/registration";
import { sendTrackedEmail } from "@/lib/email-service";

const initialRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = initialRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email } = validation.data;

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate registration ID and PIN
    const registrationId = generateRegistrationId();
    const pin = generatePin();

    // Store pending registration
    storePendingRegistration(registrationId, email, name, pin);

    // Send PIN via email
    try {
      const contact = {
        id: registrationId,
        email: email,
        firstName: name,
        lastName: ''
      };
      
      await sendTrackedEmail(contact, `registration-${registrationId}`, {
        from: process.env.NEXT_PUBLIC_EMAIL_FROM || 'info@marketsage.africa',
        subject: "Your MarketSage Verification PIN",
        text: `Your verification PIN is: ${pin}. This PIN will expire in 10 minutes.`,
        html: `
          <h2>Welcome to MarketSage!</h2>
          <p>Your verification PIN is: <strong>${pin}</strong></p>
          <p>This PIN will expire in 10 minutes.</p>
        `,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification PIN sent",
      registrationId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 