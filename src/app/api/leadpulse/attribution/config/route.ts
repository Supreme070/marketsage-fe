import { NextRequest, NextResponse } from 'next/server';
import { leadPulseAttributionService } from '@/lib/leadpulse/attribution-service';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

// Validation schemas
const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  viewThroughWindow: z.number().min(1).max(90).default(1), // Days
  clickThroughWindow: z.number().min(1).max(365).default(30), // Days
  attributionModel: z.enum(['FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY', 'POSITION_BASED', 'DATA_DRIVEN', 'CUSTOM']),
  conversionEvents: z.array(z.string()).min(1),
  conversionValue: z.record(z.string(), z.number()).optional(),
  channels: z.object({
    weights: z.record(z.string(), z.number()),
    aliases: z.record(z.string(), z.array(z.string())).optional(),
    hierarchies: z.record(z.string(), z.number()).optional()
  }),
  touchpointTypes: z.array(z.string()),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  crossDevice: z.boolean().default(false),
  crossDomain: z.boolean().default(false),
  deduplicationWindow: z.number().min(1).max(168).default(24), // Hours
  duplicateHandling: z.enum(['FIRST_TOUCH', 'LAST_TOUCH', 'HIGHEST_VALUE', 'SUM_VALUES', 'IGNORE_DUPLICATES']),
  createdBy: z.string().min(1)
});

const updateConfigSchema = createConfigSchema.partial().extend({
  id: z.string().min(1)
});

// Get all attribution configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');
    const isDefault = searchParams.get('default');

    const whereConditions: any = {};
    
    if (isActive !== null) {
      whereConditions.isActive = isActive === 'true';
    }
    
    if (isDefault !== null) {
      whereConditions.isDefault = isDefault === 'true';
    }

    const configs = await prisma.leadPulseAttributionConfig.findMany({
      where: whereConditions,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedConfigs = configs.map(config => ({
      id: config.id,
      name: config.name,
      description: config.description,
      viewThroughWindow: config.viewThroughWindow,
      clickThroughWindow: config.clickThroughWindow,
      attributionModel: config.attributionModel,
      conversionEvents: JSON.parse(config.conversionEvents as string),
      conversionValue: config.conversionValue ? JSON.parse(config.conversionValue as string) : {},
      channels: JSON.parse(config.channels as string),
      touchpointTypes: JSON.parse(config.touchpointTypes as string),
      isActive: config.isActive,
      isDefault: config.isDefault,
      crossDevice: config.crossDevice,
      crossDomain: config.crossDomain,
      deduplicationWindow: config.deduplicationWindow,
      duplicateHandling: config.duplicateHandling,
      createdBy: config.createdBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        configs: formattedConfigs,
        total: formattedConfigs.length
      }
    });

  } catch (error) {
    logger.error('Error fetching attribution configs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch attribution configurations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Create attribution configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConfigSchema.parse(body);

    const configId = await leadPulseAttributionService.createAttributionConfig(
      validatedData,
      validatedData.createdBy
    );

    // Fetch the created config to return full data
    const createdConfig = await prisma.leadPulseAttributionConfig.findUnique({
      where: { id: configId }
    });

    if (!createdConfig) {
      throw new Error('Failed to retrieve created configuration');
    }

    const formattedConfig = {
      id: createdConfig.id,
      name: createdConfig.name,
      description: createdConfig.description,
      viewThroughWindow: createdConfig.viewThroughWindow,
      clickThroughWindow: createdConfig.clickThroughWindow,
      attributionModel: createdConfig.attributionModel,
      conversionEvents: JSON.parse(createdConfig.conversionEvents as string),
      conversionValue: createdConfig.conversionValue ? JSON.parse(createdConfig.conversionValue as string) : {},
      channels: JSON.parse(createdConfig.channels as string),
      touchpointTypes: JSON.parse(createdConfig.touchpointTypes as string),
      isActive: createdConfig.isActive,
      isDefault: createdConfig.isDefault,
      crossDevice: createdConfig.crossDevice,
      crossDomain: createdConfig.crossDomain,
      deduplicationWindow: createdConfig.deduplicationWindow,
      duplicateHandling: createdConfig.duplicateHandling,
      createdBy: createdConfig.createdBy,
      createdAt: createdConfig.createdAt,
      updatedAt: createdConfig.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: {
        config: formattedConfig,
        message: 'Attribution configuration created successfully'
      }
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating attribution config:', error);
    
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
        error: 'Failed to create attribution configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update attribution configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    const { id, ...updateData } = validatedData;

    // Check if config exists
    const existingConfig = await prisma.leadPulseAttributionConfig.findUnique({
      where: { id }
    });

    if (!existingConfig) {
      return NextResponse.json({ 
        error: 'Attribution configuration not found' 
      }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await prisma.leadPulseAttributionConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Update the configuration
    const updatedConfig = await prisma.leadPulseAttributionConfig.update({
      where: { id },
      data: {
        ...updateData,
        conversionEvents: updateData.conversionEvents ? JSON.stringify(updateData.conversionEvents) : undefined,
        conversionValue: updateData.conversionValue ? JSON.stringify(updateData.conversionValue) : undefined,
        channels: updateData.channels ? JSON.stringify(updateData.channels) : undefined,
        touchpointTypes: updateData.touchpointTypes ? JSON.stringify(updateData.touchpointTypes) : undefined,
        updatedAt: new Date()
      }
    });

    const formattedConfig = {
      id: updatedConfig.id,
      name: updatedConfig.name,
      description: updatedConfig.description,
      viewThroughWindow: updatedConfig.viewThroughWindow,
      clickThroughWindow: updatedConfig.clickThroughWindow,
      attributionModel: updatedConfig.attributionModel,
      conversionEvents: JSON.parse(updatedConfig.conversionEvents as string),
      conversionValue: updatedConfig.conversionValue ? JSON.parse(updatedConfig.conversionValue as string) : {},
      channels: JSON.parse(updatedConfig.channels as string),
      touchpointTypes: JSON.parse(updatedConfig.touchpointTypes as string),
      isActive: updatedConfig.isActive,
      isDefault: updatedConfig.isDefault,
      crossDevice: updatedConfig.crossDevice,
      crossDomain: updatedConfig.crossDomain,
      deduplicationWindow: updatedConfig.deduplicationWindow,
      duplicateHandling: updatedConfig.duplicateHandling,
      createdBy: updatedConfig.createdBy,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: {
        config: formattedConfig,
        message: 'Attribution configuration updated successfully'
      }
    });

  } catch (error) {
    logger.error('Error updating attribution config:', error);
    
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
        error: 'Failed to update attribution configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete attribution configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json({ 
        error: 'Configuration ID is required' 
      }, { status: 400 });
    }

    // Check if config exists
    const existingConfig = await prisma.leadPulseAttributionConfig.findUnique({
      where: { id: configId }
    });

    if (!existingConfig) {
      return NextResponse.json({ 
        error: 'Attribution configuration not found' 
      }, { status: 404 });
    }

    // Check if this is the default config
    if (existingConfig.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete the default attribution configuration' 
      }, { status: 400 });
    }

    // Check if there are any attributions using this config
    const attributionCount = await prisma.leadPulseAttribution.count({
      where: { configId }
    });

    if (attributionCount > 0) {
      // Soft delete by marking as inactive
      await prisma.leadPulseAttributionConfig.update({
        where: { id: configId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Attribution configuration deactivated (has existing attributions)',
          deactivated: true
        }
      });
    } else {
      // Hard delete if no attributions exist
      await prisma.leadPulseAttributionConfig.delete({
        where: { id: configId }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Attribution configuration deleted successfully',
          deleted: true
        }
      });
    }

  } catch (error) {
    logger.error('Error deleting attribution config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete attribution configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}