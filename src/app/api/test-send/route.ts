import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("TEST ENDPOINT CALLED");
  return NextResponse.json({ message: "Test endpoint working" });
}