import { NextResponse } from 'next/server';
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

export async function GET() {
  // Return a simple 200 OK response
  return NextResponse.json({ status: 'OK', timestamp: new Date().toISOString() });
}
