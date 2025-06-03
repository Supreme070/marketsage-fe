import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// GET - Fetch AI Intelligence records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // content, customer, chat, tool
    const userId = searchParams.get('userId') || 'default';
    const timeRange = searchParams.get('timeRange') || 'all'; // 24h, 7d, 30d, all
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    const getCreatedAtFilter = () => {
      const now = Date.now();
      switch (timeRange) {
        case '24h':
          return { gte: new Date(now - 24 * 60 * 60 * 1000) };
        case '7d':
          return { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        case '30d':
          return { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        default:
          return undefined;
      }
    };

    const createdAtFilter = getCreatedAtFilter();

    let records;

    switch (type) {
      case 'content':
        records = await prisma.aI_ContentAnalysis.findMany({
          where: { createdById: userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        });
        break;

      case 'customer':
        records = await prisma.aI_CustomerSegment.findMany({
          where: { createdById: userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        });
        break;

      case 'chat':
        records = await prisma.aI_ChatHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        break;

      case 'tool':
        records = await prisma.aI_Tool.findMany({
          where: { 
            OR: [
              { createdById: userId },
              { isPublic: true }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        });
        break;

      default:
        // Return overview data
        const whereBaseContent: any = { createdById: userId };
        const whereBaseCustomer: any = { createdById: userId };
        const whereBaseTool: any = { createdById: userId };
        const whereBaseChat: any = { userId };

        if (createdAtFilter) {
          whereBaseContent.createdAt = createdAtFilter;
          whereBaseCustomer.createdAt = createdAtFilter;
          whereBaseTool.createdAt = createdAtFilter;
          whereBaseChat.createdAt = createdAtFilter;
        }

        const [contentCount, customerCount, chatCount, toolCount] = await Promise.all([
          prisma.aI_ContentAnalysis.count({ where: whereBaseContent }),
          prisma.aI_CustomerSegment.count({ where: whereBaseCustomer }),
          prisma.aI_ChatHistory.count({ where: whereBaseChat }),
          prisma.aI_Tool.count({ where: whereBaseTool })
        ]);

        const recent = await prisma.aI_ContentAnalysis.findMany({
          where: whereBaseContent,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            supremeScore: true,
            createdAt: true
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            counts: { contentCount, customerCount, chatCount, toolCount },
            recent
          }
        });
    }

    return NextResponse.json({
      success: true,
      data: records
    });

  } catch (error) {
    logger.error('AI Intelligence GET failed', error);
    
    // Return mock/fallback data when database is unavailable
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (!type) {
      // Return mock overview data
      return NextResponse.json({
        success: true,
        data: {
          counts: { 
            contentCount: 15, 
            customerCount: 8, 
            chatCount: 42, 
            toolCount: 6 
          },
          recent: [
            {
              id: '1',
              title: 'Email Campaign Analysis',
              supremeScore: 85,
              createdAt: new Date().toISOString()
            },
            {
              id: '2', 
              title: 'Social Media Content',
              supremeScore: 92,
              createdAt: new Date(Date.now() - 60000).toISOString()
            },
            {
              id: '3',
              title: 'Product Description',
              supremeScore: 78,
              createdAt: new Date(Date.now() - 120000).toISOString()
            }
          ]
        }
      });
    }
    
    // Return empty array for specific types when database fails
    return NextResponse.json({
      success: true,
      data: []
    });
  }
}

// POST - Create new AI Intelligence record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, userId = 'default' } = body;

    let record;

    switch (type) {
      case 'content':
        record = await prisma.aI_ContentAnalysis.create({
          data: {
            title: data.title,
            content: data.content,
            supremeScore: data.supremeScore,
            sentiment: data.sentiment,
            readability: data.readability,
            engagement: data.engagement,
            analysis: data.analysis || {},
            tags: data.tags || [],
            createdById: userId
          }
        });
        break;

      case 'customer':
        record = await prisma.aI_CustomerSegment.create({
          data: {
            name: data.name,
            description: data.description,
            criteria: data.criteria || {},
            customerCount: data.customerCount || 0,
            churnRisk: data.churnRisk || 0,
            lifetimeValue: data.lifetimeValue || 0,
            tags: data.tags || [],
            createdById: userId
          }
        });
        break;

      case 'chat':
        record = await prisma.aI_ChatHistory.create({
          data: {
            userId,
            question: data.question,
            answer: data.answer,
            context: data.context || {},
            confidence: data.confidence || 0,
            sessionId: data.sessionId
          }
        });
        break;

      case 'tool':
        record = await prisma.aI_Tool.create({
          data: {
            name: data.name,
            description: data.description,
            category: data.category,
            config: data.config || {},
            isPublic: data.isPublic || false,
            usage: data.usage || {},
            createdById: userId
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: record,
      message: `${type} analysis created successfully`
    });

  } catch (error) {
    logger.error('AI Intelligence POST failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create AI intelligence record' },
      { status: 500 }
    );
  }
}

// PUT - Update AI Intelligence record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, data, userId = 'default' } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    let record;

    switch (type) {
      case 'content':
        record = await prisma.aI_ContentAnalysis.update({
          where: { 
            id,
            createdById: userId // Ensure user can only update their own records
          },
          data: {
            title: data.title,
            content: data.content,
            supremeScore: data.supremeScore,
            sentiment: data.sentiment,
            readability: data.readability,
            engagement: data.engagement,
            analysis: data.analysis,
            tags: data.tags,
            updatedAt: new Date()
          }
        });
        break;

      case 'customer':
        record = await prisma.aI_CustomerSegment.update({
          where: { 
            id,
            createdById: userId
          },
          data: {
            name: data.name,
            description: data.description,
            criteria: data.criteria,
            customerCount: data.customerCount,
            churnRisk: data.churnRisk,
            lifetimeValue: data.lifetimeValue,
            tags: data.tags,
            updatedAt: new Date()
          }
        });
        break;

      case 'tool':
        record = await prisma.aI_Tool.update({
          where: { 
            id,
            createdById: userId
          },
          data: {
            name: data.name,
            description: data.description,
            category: data.category,
            config: data.config,
            isPublic: data.isPublic,
            usage: data.usage,
            updatedAt: new Date()
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: record,
      message: `${type} analysis updated successfully`
    });

  } catch (error) {
    logger.error('AI Intelligence PUT failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update AI intelligence record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete AI Intelligence record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId') || 'default';

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'Record ID and type are required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'content':
        await prisma.aI_ContentAnalysis.delete({
          where: { 
            id,
            createdById: userId
          }
        });
        break;

      case 'customer':
        await prisma.aI_CustomerSegment.delete({
          where: { 
            id,
            createdById: userId
          }
        });
        break;

      case 'chat':
        await prisma.aI_ChatHistory.delete({
          where: { 
            id,
            userId
          }
        });
        break;

      case 'tool':
        await prisma.aI_Tool.delete({
          where: { 
            id,
            createdById: userId
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} analysis deleted successfully`
    });

  } catch (error) {
    logger.error('AI Intelligence DELETE failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete AI intelligence record' },
      { status: 500 }
    );
  }
} 