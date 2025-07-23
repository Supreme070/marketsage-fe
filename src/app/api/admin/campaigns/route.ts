import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-api-auth';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return auth.response;
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    
    const skip = (page - 1) * limit;

    // Build where conditions
    const searchConditions = search ? {
      name: { contains: search, mode: 'insensitive' as const }
    } : {};

    const statusConditions = status !== 'all' ? {
      status: status.toUpperCase()
    } : {};

    // Fetch Email Campaigns
    const [emailCampaigns, emailCount] = await Promise.all([
      type === 'all' || type === 'EMAIL' ? prisma.emailCampaign.findMany({
        where: {
          ...searchConditions,
          ...statusConditions
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          activities: {
            select: {
              type: true
            }
          },
          lists: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          },
          segments: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          }
        },
        skip: type === 'EMAIL' ? skip : 0,
        take: type === 'EMAIL' ? limit : undefined,
        orderBy: {
          createdAt: 'desc'
        }
      }) : [],
      type === 'all' || type === 'EMAIL' ? prisma.emailCampaign.count({
        where: {
          ...searchConditions,
          ...statusConditions
        }
      }) : 0
    ]);

    // Fetch SMS Campaigns
    const [smsCampaigns, smsCount] = await Promise.all([
      type === 'all' || type === 'SMS' ? prisma.sMSCampaign.findMany({
        where: {
          ...searchConditions,
          ...statusConditions
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          activities: {
            select: {
              type: true
            }
          },
          lists: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          },
          segments: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          }
        },
        skip: type === 'SMS' ? skip : 0,
        take: type === 'SMS' ? limit : undefined,
        orderBy: {
          createdAt: 'desc'
        }
      }) : [],
      type === 'all' || type === 'SMS' ? prisma.sMSCampaign.count({
        where: {
          ...searchConditions,
          ...statusConditions
        }
      }) : 0
    ]);

    // Fetch WhatsApp Campaigns
    const [whatsappCampaigns, whatsappCount] = await Promise.all([
      type === 'all' || type === 'WHATSAPP' ? prisma.whatsAppCampaign.findMany({
        where: {
          ...searchConditions,
          ...statusConditions
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          },
          activities: {
            select: {
              type: true
            }
          },
          lists: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          },
          segments: {
            select: {
              _count: {
                select: {
                  contacts: true
                }
              }
            }
          }
        },
        skip: type === 'WHATSAPP' ? skip : 0,
        take: type === 'WHATSAPP' ? limit : undefined,
        orderBy: {
          createdAt: 'desc'
        }
      }) : [],
      type === 'all' || type === 'WHATSAPP' ? prisma.whatsAppCampaign.count({
        where: {
          ...searchConditions,
          ...statusConditions
        }
      }) : 0
    ]);

    // Get campaign metrics
    const campaignMetrics = await prisma.mCPCampaignMetrics.findMany({
      select: {
        campaignId: true,
        campaignType: true,
        sent: true,
        delivered: true,
        opened: true,
        clicked: true,
        bounced: true,
        openRate: true,
        clickRate: true,
        bounceRate: true
      }
    });

    // Create metrics lookup
    const metricsLookup = Object.fromEntries(
      campaignMetrics.map(m => [m.campaignId, m])
    );

    // Transform email campaigns
    const transformedEmailCampaigns = emailCampaigns.map(campaign => {
      const metrics = metricsLookup[campaign.id];
      const totalRecipients = campaign.lists.reduce((sum, list) => sum + list._count.contacts, 0) +
                             campaign.segments.reduce((sum, segment) => sum + segment._count.contacts, 0);

      // Calculate stats from activities
      const activities = campaign.activities || [];
      const sentCount = activities.filter(a => a.type === 'SENT').length;
      const deliveredCount = activities.filter(a => a.type === 'DELIVERED').length;
      const openedCount = activities.filter(a => a.type === 'OPENED').length;
      const clickedCount = activities.filter(a => a.type === 'CLICKED').length;
      const bouncedCount = activities.filter(a => a.type === 'BOUNCED').length;

      return {
        id: campaign.id,
        name: campaign.name,
        type: 'EMAIL' as const,
        status: campaign.status.toLowerCase(),
        organization: campaign.organization || { id: 'unknown', name: 'Unknown Organization' },
        creator: {
          name: campaign.createdBy.name || 'Unknown',
          email: campaign.createdBy.email || 'unknown@example.com'
        },
        stats: {
          sent: metrics?.sent || sentCount || 0,
          delivered: metrics?.delivered || deliveredCount || 0,
          opened: metrics?.opened || openedCount || 0,
          clicked: metrics?.clicked || clickedCount || 0,
          failed: metrics?.bounced || bouncedCount || 0,
          deliveryRate: metrics?.delivered && metrics?.sent ? 
            (metrics.delivered / metrics.sent * 100) : 
            (deliveredCount && sentCount ? deliveredCount / sentCount * 100 : 0),
          openRate: metrics?.openRate || 0,
          clickRate: metrics?.clickRate || 0
        },
        scheduledAt: campaign.scheduledFor?.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
        lastUpdated: campaign.updatedAt.toISOString(),
        audience: {
          totalRecipients: totalRecipients || 0,
          segmentName: campaign.segments[0]?.name || campaign.lists[0]?.name || 'All Contacts'
        }
      };
    });

    // Transform SMS campaigns
    const transformedSmsCampaigns = smsCampaigns.map(campaign => {
      const metrics = metricsLookup[campaign.id];
      const totalRecipients = campaign.lists.reduce((sum, list) => sum + list._count.contacts, 0) +
                             campaign.segments.reduce((sum, segment) => sum + segment._count.contacts, 0);

      const activities = campaign.activities || [];
      const sentCount = activities.filter(a => a.type === 'SENT').length;
      const deliveredCount = activities.filter(a => a.type === 'DELIVERED').length;
      const bouncedCount = activities.filter(a => a.type === 'BOUNCED').length;

      return {
        id: campaign.id,
        name: campaign.name,
        type: 'SMS' as const,
        status: campaign.status.toLowerCase(),
        organization: { id: 'system', name: 'System' }, // SMS campaigns don't have organization field
        creator: {
          name: campaign.createdBy.name || 'Unknown',
          email: campaign.createdBy.email || 'unknown@example.com'
        },
        stats: {
          sent: metrics?.sent || sentCount || 0,
          delivered: metrics?.delivered || deliveredCount || 0,
          failed: metrics?.bounced || bouncedCount || 0,
          deliveryRate: metrics?.delivered && metrics?.sent ? 
            (metrics.delivered / metrics.sent * 100) : 
            (deliveredCount && sentCount ? deliveredCount / sentCount * 100 : 0)
        },
        scheduledAt: campaign.scheduledFor?.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
        lastUpdated: campaign.updatedAt.toISOString(),
        audience: {
          totalRecipients: totalRecipients || 0,
          segmentName: campaign.segments[0]?.name || campaign.lists[0]?.name || 'All Contacts'
        }
      };
    });

    // Transform WhatsApp campaigns
    const transformedWhatsAppCampaigns = whatsappCampaigns.map(campaign => {
      const metrics = metricsLookup[campaign.id];
      const totalRecipients = campaign.lists.reduce((sum, list) => sum + list._count.contacts, 0) +
                             campaign.segments.reduce((sum, segment) => sum + segment._count.contacts, 0);

      const activities = campaign.activities || [];
      const sentCount = activities.filter(a => a.type === 'SENT').length;
      const deliveredCount = activities.filter(a => a.type === 'DELIVERED').length;
      const bouncedCount = activities.filter(a => a.type === 'BOUNCED').length;

      return {
        id: campaign.id,
        name: campaign.name,
        type: 'WHATSAPP' as const,
        status: campaign.status.toLowerCase(),
        organization: { id: 'system', name: 'System' }, // WhatsApp campaigns don't have organization field
        creator: {
          name: campaign.createdBy.name || 'Unknown',
          email: campaign.createdBy.email || 'unknown@example.com'
        },
        stats: {
          sent: metrics?.sent || sentCount || 0,
          delivered: metrics?.delivered || deliveredCount || 0,
          failed: metrics?.bounced || bouncedCount || 0,
          deliveryRate: metrics?.delivered && metrics?.sent ? 
            (metrics.delivered / metrics.sent * 100) : 
            (deliveredCount && sentCount ? deliveredCount / sentCount * 100 : 0)
        },
        scheduledAt: campaign.scheduledFor?.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
        lastUpdated: campaign.updatedAt.toISOString(),
        audience: {
          totalRecipients: totalRecipients || 0,
          segmentName: campaign.segments[0]?.name || campaign.lists[0]?.name || 'All Contacts'
        }
      };
    });

    // Combine all campaigns
    let allCampaigns = [
      ...transformedEmailCampaigns,
      ...transformedSmsCampaigns,
      ...transformedWhatsAppCampaigns
    ];

    // Sort by creation date (most recent first)
    allCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination if fetching all types
    if (type === 'all') {
      allCampaigns = allCampaigns.slice(skip, skip + limit);
    }

    // Calculate total count
    const totalCount = emailCount + smsCount + whatsappCount;

    // Calculate stats
    const totalCampaigns = totalCount;
    const activeCampaigns = await Promise.all([
      prisma.emailCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.sMSCampaign.count({ where: { status: 'ACTIVE' } }),
      prisma.whatsAppCampaign.count({ where: { status: 'ACTIVE' } })
    ]);
    
    const totalSent = campaignMetrics.reduce((sum, m) => sum + m.sent, 0);
    const totalDelivered = campaignMetrics.reduce((sum, m) => sum + m.delivered, 0);
    const averageDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        campaigns: allCampaigns,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        stats: {
          totalCampaigns,
          activeCampaigns: activeCampaigns.reduce((sum, count) => sum + count, 0),
          totalSent,
          averageDeliveryRate: Number(averageDeliveryRate.toFixed(1))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin campaigns' },
      { status: 500 }
    );
  }
}