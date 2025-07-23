import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Request validation schemas
const createNoteSchema = z.object({
  note: z.string().min(1).max(1000),
  type: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('INFO'),
});

const updateNoteSchema = z.object({
  note: z.string().min(1).max(1000),
  type: z.enum(['INFO', 'WARNING', 'CRITICAL']),
});

// Response types
interface AdminNote {
  id: string;
  note: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  updatedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// GET /api/admin/users/[id]/notes - Get all notes for a user
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Check if user exists and admin has access
    const whereClause: any = { id: userId };
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all notes for this user
    const notes = await prisma.adminNote.findMany({
      where: { userId },
      select: {
        id: true,
        note: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log the access
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'VIEW_USER_NOTES',
        resource: 'USER',
        resourceId: userId,
        details: {
          notesCount: notes.length,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('Error fetching user notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user notes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/notes - Create a new note for a user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();

    // Validate input
    const validatedData = createNoteSchema.parse(body);

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Check if user exists and admin has access
    const whereClause: any = { id: userId };
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      whereClause.organizationId = session.user.organizationId;
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create the note
    const note = await prisma.adminNote.create({
      data: {
        userId,
        createdById: session.user.id,
        note: validatedData.note,
        type: validatedData.type,
      },
      select: {
        id: true,
        note: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'CREATE_USER_NOTE',
        resource: 'USER',
        resourceId: userId,
        details: {
          noteType: validatedData.type,
          noteLength: validatedData.note.length,
          targetUser: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      note,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Error creating user note:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id]/notes/[noteId] - Update a note
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { noteId } = await req.json();
    const body = await req.json();

    // Validate input
    const validatedData = updateNoteSchema.parse(body);

    // Validate UUID formats
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Check if note exists and admin has access
    const note = await prisma.adminNote.findFirst({
      where: {
        id: noteId,
        userId,
      },
      select: {
        id: true,
        createdById: true,
        user: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check organization access for ADMIN role
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      if (note.user?.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Only the creator or SUPER_ADMIN can edit notes
    if (note.createdById !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only the note creator or Super Admin can edit notes' }, { status: 403 });
    }

    // Update the note
    const updatedNote = await prisma.adminNote.update({
      where: { id: noteId },
      data: {
        note: validatedData.note,
        type: validatedData.type,
        updatedById: session.user.id,
      },
      select: {
        id: true,
        note: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'UPDATE_USER_NOTE',
        resource: 'USER',
        resourceId: userId,
        details: {
          noteId,
          noteType: validatedData.type,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Error updating user note:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const { noteId } = await req.json();

    // Validate UUID formats
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(noteId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Check if note exists and admin has access
    const note = await prisma.adminNote.findFirst({
      where: {
        id: noteId,
        userId,
      },
      select: {
        id: true,
        createdById: true,
        note: true,
        type: true,
        user: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check organization access for ADMIN role
    if (session.user.role === 'ADMIN' && session.user.organizationId) {
      if (note.user?.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Only the creator or SUPER_ADMIN can delete notes
    if (note.createdById !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only the note creator or Super Admin can delete notes' }, { status: 403 });
    }

    // Delete the note
    await prisma.adminNote.delete({
      where: { id: noteId },
    });

    // Log the action
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        adminEmail: session.user.email,
        action: 'DELETE_USER_NOTE',
        resource: 'USER',
        resourceId: userId,
        details: {
          deletedNoteId: noteId,
          deletedNoteType: note.type,
          deletedNotePreview: note.note.substring(0, 100),
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}