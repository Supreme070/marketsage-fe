import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcrypt";

// Define UserRole enum to match Prisma schema
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  IT_ADMIN = "IT_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

const prisma = new PrismaClient();

// Helper function to get tags from string
function getTagsFromString(tagsString: string | null): string[] {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString);
  } catch (e) {
    return [];
  }
}

// Helper function to add tags to contacts
function addTagsToContacts(contacts: any[]): any[] {
  return contacts.map(contact => ({
    ...contact,
    tags: getTagsFromString(contact.tagsString),
  }));
}

// Get all users - only accessible by Super Admin and Admin
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin or super admin
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        // Don't include password hash
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Super Admins can see all users
    if (session.user.role === "SUPER_ADMIN") {
      return NextResponse.json(users);
    }

    // Regular admins can't see super admins
    const filteredUsers = users.filter((user) => user.role !== "SUPER_ADMIN");
    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create a new user - Super Admin can create any role, Admin can only create regular users
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has permission
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins and super admins can create users
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Role-based permission check
    const userRole = role || "USER";

    // If not a super admin, can only create regular users
    if (session.user.role !== "SUPER_ADMIN") {
      if (userRole !== "USER") {
        return NextResponse.json(
          { error: "You can only create regular users" },
          { status: 403 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole as UserRole,
        emailVerified: new Date(), // Auto-verify for now
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Don't include password
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
