import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcrypt";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// Define UserRole enum to match Prisma schema
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  IT_ADMIN = "IT_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

// Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely
    const { id: userId } = await params;

    // Users can view their own profile, admins can view anyone
    if (
      session.user.id !== userId &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "IT_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        image: true,
        // Don't include password
      },
    });

    if (!user) {
      return notFound("User not found");
    }

    // If user is an admin but not super admin, they can't view super admin details
    if (
      session.user.role === "ADMIN" &&
      user.role === "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, "/api/users/[id]/route.ts");
  }
}

// Update user by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Access params safely
    const { id: userId } = await params;

    // Users can update their own basic info, admins can update anyone except super admins
    const canUpdateBasicInfo =
      session.user.id === userId ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!canUpdateBasicInfo) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    // Get the existing user first to check role and make security checks
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!existingUser) {
      return notFound("User not found");
    }

    // Only super admins can update the role of a user
    // Regular admins can't change anyone's role
    if (role && role !== existingUser.role) {
      if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only super admins can change user roles" },
          { status: 403 }
        );
      }
    }

    // Only super admins can update super admin accounts
    if (existingUser.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admins can modify super admin accounts" },
        { status: 403 }
      );
    }

    // Create update data object
    const updateData: any = {};

    if (name) updateData.name = name;

    // Email updates require checking for duplicates
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // Password needs to be hashed
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Only super admins or admins can change active status
    if (isActive !== undefined && (session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN")) {
      updateData.isActive = isActive;
    }

    // Role can only be changed by super admins
    if (role && session.user.role === "SUPER_ADMIN") {
      updateData.role = role;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        // Don't include password
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return handleApiError(error, "/api/users/[id]/route.ts");
  }
}

// Delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return unauthorized();
    }

    // Only super admins and regular admins can delete users
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Access params safely
    const { id: userId } = await params;

    // Get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return notFound("User not found");
    }

    // Regular admins cannot delete super admins or other admins
    if (session.user.role === "ADMIN" && (user.role === "SUPER_ADMIN" || user.role === "ADMIN")) {
      return NextResponse.json(
        { error: "You cannot delete admin or super admin accounts" },
        { status: 403 }
      );
    }

    // Instead of hard deleting, we'll soft delete by setting isActive to false
    // This preserves the user's data and relationships
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "User successfully deactivated" });
  } catch (error) {
    return handleApiError(error, "/api/users/[id]/route.ts");
  }
}
