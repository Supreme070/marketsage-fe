import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schemas
const createWindowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  windowType: z.enum(['CLICK_THROUGH', 'VIEW_THROUGH', 'ENGAGEMENT', 'CUSTOM']),
  duration: z.number().min(1).max(365), // Days
  timeUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS']),
  conversionEvents: z.array(z.string()).min(1),
  channels: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().min(1).max(100).default(50),
  conditions: z.record(z.string(), z.any()).optional(),
  createdBy: z.string().min(1)
});

const updateWindowSchema = createWindowSchema.partial().extend({
  id: z.string().min(1)
});

// Get conversion windows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');
    const windowType = searchParams.get('type');
    const conversionEvent = searchParams.get('event');

    const whereConditions: any = {};
    
    if (isActive !== null) {
      whereConditions.isActive = isActive === 'true';
    }
    
    if (windowType) {
      whereConditions.windowType = windowType;
    }

    if (conversionEvent) {
      whereConditions.conversionEvents = {
        contains: conversionEvent
      };
    }

    const windows = await prisma.leadPulseConversionWindow.findMany({
      where: whereConditions,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedWindows = windows.map(window => ({
      id: window.id,
      name: window.name,
      description: window.description,
      windowType: window.windowType,
      duration: window.duration,
      timeUnit: window.timeUnit,
      conversionEvents: JSON.parse(window.conversionEvents as string),
      channels: window.channels ? JSON.parse(window.channels as string) : [],
      isActive: window.isActive,
      priority: window.priority,
      conditions: window.conditions ? JSON.parse(window.conditions as string) : {},
      createdBy: window.createdBy,
      createdAt: window.createdAt,
      updatedAt: window.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        windows: formattedWindows,
        total: formattedWindows.length
      }
    });

  } catch (error) {
    logger.error('Error fetching conversion windows:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversion windows',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Create conversion window
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createWindowSchema.parse(body);

    const window = await prisma.leadPulseConversionWindow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        windowType: validatedData.windowType,
        duration: validatedData.duration,
        timeUnit: validatedData.timeUnit,
        conversionEvents: JSON.stringify(validatedData.conversionEvents),
        channels: validatedData.channels ? JSON.stringify(validatedData.channels) : null,
        isActive: validatedData.isActive,
        priority: validatedData.priority,
        conditions: validatedData.conditions ? JSON.stringify(validatedData.conditions) : null,
        createdBy: validatedData.createdBy
      }
    });

    const formattedWindow = {
      id: window.id,
      name: window.name,
      description: window.description,
      windowType: window.windowType,
      duration: window.duration,
      timeUnit: window.timeUnit,
      conversionEvents: JSON.parse(window.conversionEvents as string),
      channels: window.channels ? JSON.parse(window.channels as string) : [],
      isActive: window.isActive,
      priority: window.priority,
      conditions: window.conditions ? JSON.parse(window.conditions as string) : {},
      createdBy: window.createdBy,
      createdAt: window.createdAt,
      updatedAt: window.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: {
        window: formattedWindow,
        message: 'Conversion window created successfully'
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating conversion window:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create conversion window',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update conversion window
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateWindowSchema.parse(body);

    const { id, ...updateData } = validatedData;

    // Check if window exists
    const existingWindow = await prisma.leadPulseConversionWindow.findUnique({
      where: { id }
    });

    if (!existingWindow) {
      return NextResponse.json({ 
        error: 'Conversion window not found' 
      }, { status: 404 });
    }

    // Update the window
    const updatedWindow = await prisma.leadPulseConversionWindow.update({
      where: { id },
      data: {
        ...updateData,
        conversionEvents: updateData.conversionEvents ? JSON.stringify(updateData.conversionEvents) : undefined,
        channels: updateData.channels ? JSON.stringify(updateData.channels) : undefined,
        conditions: updateData.conditions ? JSON.stringify(updateData.conditions) : undefined,
        updatedAt: new Date()
      }
    });

    const formattedWindow = {
      id: updatedWindow.id,
      name: updatedWindow.name,
      description: updatedWindow.description,
      windowType: updatedWindow.windowType,
      duration: updatedWindow.duration,
      timeUnit: updatedWindow.timeUnit,
      conversionEvents: JSON.parse(updatedWindow.conversionEvents as string),
      channels: updatedWindow.channels ? JSON.parse(updatedWindow.channels as string) : [],
      isActive: updatedWindow.isActive,
      priority: updatedWindow.priority,
      conditions: updatedWindow.conditions ? JSON.parse(updatedWindow.conditions as string) : {},
      createdBy: updatedWindow.createdBy,
      createdAt: updatedWindow.createdAt,
      updatedAt: updatedWindow.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: {
        window: formattedWindow,
        message: 'Conversion window updated successfully'
      }
    });

  } catch (error) {
    logger.error('Error updating conversion window:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update conversion window',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete conversion window
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const windowId = searchParams.get('id');

    if (!windowId) {
      return NextResponse.json({ 
        error: 'Window ID is required' 
      }, { status: 400 });
    }

    // Check if window exists
    const existingWindow = await prisma.leadPulseConversionWindow.findUnique({
      where: { id: windowId }
    });

    if (!existingWindow) {
      return NextResponse.json({ 
        error: 'Conversion window not found' 
      }, { status: 404 });
    }

    // Check if this window is being used in any attribution configs
    const configCount = await prisma.leadPulseAttributionConfig.count({
      where: {
        OR: [
          { conversionEvents: { contains: existingWindow.name } },
          { touchpointTypes: { contains: existingWindow.name } }
        ]
      }
    });

    if (configCount > 0) {
      // Soft delete by marking as inactive
      await prisma.leadPulseConversionWindow.update({
        where: { id: windowId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Conversion window deactivated (used in attribution configurations)',
          deactivated: true
        }
      });
    } else {
      // Hard delete if not used
      await prisma.leadPulseConversionWindow.delete({
        where: { id: windowId }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Conversion window deleted successfully',
          deleted: true
        }
      });
    }

  } catch (error) {
    logger.error('Error deleting conversion window:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete conversion window',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}