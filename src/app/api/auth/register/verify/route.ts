import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPin } from "@/lib/registration";

const verifySchema = z.object({
  registrationId: z.string(),
  pin: z.string().length(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { registrationId, pin } = validation.data;

    // Verify PIN
    const isValid = verifyPin(registrationId, pin);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid or expired PIN" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "PIN verified successfully",
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during verification" },
      { status: 500 }
    );
  }
} 