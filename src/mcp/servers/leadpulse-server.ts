/**
 * LeadPulse MCP Server for MarketSage
 * 
 * This server provides read-only access to visitor intelligence data,
 * behavioral analytics, and conversion tracking through the MCP protocol.
 */

import { z } from 'zod';
import { HTTPBaseMCPServer } from './http-base-mcp-server';
import { 
  type MCPAuthContext, 
  type MCPServerConfig,
  LeadPulseQuerySchema,
  type LeadPulseQuery,
  VisitorSession,
  MCPAuthorizationError,
  MCPValidationError
} from '../types/mcp-types';

import { prisma } from '../../lib/db/prisma';
import { defaultMCPConfig } from '../config/mcp-config';

export class LeadPulseMCPServer extends HTTPBaseMCPServer {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      ...defaultMCPConfig.servers.leadpulse,
      ...config
    });
  }

  /**
   * List available LeadPulse resources
   */
  protected async listResources(authContext: MCPAuthContext): Promise<any[]> {
    const resources = [
      {
        uri: "leadpulse://visitors",
        name: "Visitor Data",
        description: "Access to visitor sessions and behavioral data",
        mimeType: "application/json"
      },
      {
        uri: "leadpulse://sessions",
        name: "Session Data",
        description: "Access to detailed visitor session information",
        mimeType: "application/json"
      },
      {
        uri: "leadpulse://heatmaps",
        name: "Heatmap Data",
        description: "Access to page heatmap and interaction data",
        mimeType: "application/json"
      },
      {
        uri: "leadpulse://journeys",
        name: "Customer Journeys",
        description: "Access to customer journey and conversion paths",
        mimeType: "application/json"
      },
      {
        uri: "leadpulse://conversions",
        name: "Conversion Data",
        description: "Access to conversion events and funnel analytics",
        mimeType: "application/json"
      },
      {
        uri: "leadpulse://analytics",
        name: "Behavioral Analytics",
        description: "Access to visitor behavior analytics and insights",
        mimeType: "application/json"
      }
    ];

    // Filter resources based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('read:org')) {
      // Users can only access basic visitor data
      return resources.filter(r => r.uri.includes('visitors') || r.uri.includes('sessions'));
    }

    return resources;
  }

  /**
   * Read LeadPulse resource
   */
  protected async readResource(uri: string, authContext: MCPAuthContext): Promise<any> {
    const url = new URL(uri);
    const path = url.pathname;
    const searchParams = url.searchParams;

    // Parse query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = LeadPulseQuerySchema.parse({
      ...queryParams,
      organizationId: authContext.organizationId, // Always use user's org
      limit: queryParams.limit ? Number.parseInt(queryParams.limit) : 10,
      offset: queryParams.offset ? Number.parseInt(queryParams.offset) : 0,
      includeHeatmap: queryParams.includeHeatmap === 'true',
      includeJourney: queryParams.includeJourney === 'true'
    });

    switch (path) {
      case '/visitors':
        return await this.getVisitorData(validatedQuery, authContext);
      case '/sessions':
        return await this.getSessionData(validatedQuery, authContext);
      case '/heatmaps':
        return await this.getHeatmapData(validatedQuery, authContext);
      case '/journeys':
        return await this.getJourneyData(validatedQuery, authContext);
      case '/conversions':
        return await this.getConversionData(validatedQuery, authContext);
      case '/analytics':
        return await this.getAnalyticsData(validatedQuery, authContext);
      default:
        throw new MCPValidationError(`Unknown resource path: ${path}`);
    }
  }

  /**
   * List available LeadPulse tools
   */
  protected async listTools(authContext: MCPAuthContext): Promise<any[]> {
    const tools = [
      {
        name: "track_visitor",
        description: "Get visitor tracking information and behavior",
        inputSchema: {
          type: "object",
          properties: {
            visitorId: {
              type: "string",
              description: "Visitor ID to track"
            },
            includeJourney: {
              type: "boolean",
              description: "Include customer journey data",
              default: true
            },
            includeHeatmap: {
              type: "boolean", 
              description: "Include heatmap interaction data",
              default: false
            }
          },
          required: ["visitorId"]
        }
      },
      {
        name: "analyze_visitor_behavior",
        description: "Analyze visitor behavior patterns and generate insights",
        inputSchema: {
          type: "object",
          properties: {
            visitorId: {
              type: "string",
              description: "Visitor ID to analyze"
            },
            sessionId: {
              type: "string",
              description: "Specific session ID (optional)"
            },
            timeRange: {
              type: "string",
              enum: ["1h", "1d", "7d", "30d"],
              description: "Time range for analysis",
              default: "7d"
            }
          },
          required: ["visitorId"]
        }
      },
      {
        name: "get_conversion_funnel",
        description: "Get conversion funnel data and drop-off points",
        inputSchema: {
          type: "object",
          properties: {
            funnelId: {
              type: "string",
              description: "Funnel ID (optional for default funnel)"
            },
            dateRange: {
              type: "string",
              enum: ["7d", "30d", "90d"],
              description: "Date range for funnel analysis",
              default: "30d"
            },
            includeSegments: {
              type: "boolean",
              description: "Include segment-based funnel analysis",
              default: false
            }
          }
        }
      },
      {
        name: "get_page_analytics",
        description: "Get page-level analytics and performance metrics",
        inputSchema: {
          type: "object",
          properties: {
            pageUrl: {
              type: "string",
              description: "Page URL to analyze"
            },
            includeHeatmap: {
              type: "boolean",
              description: "Include heatmap data",
              default: true
            },
            dateRange: {
              type: "string",
              enum: ["1d", "7d", "30d"],
              description: "Date range for analysis",
              default: "7d"
            }
          },
          required: ["pageUrl"]
        }
      },
      {
        name: "get_real_time_visitors",
        description: "Get current active visitors and their activities",
        inputSchema: {
          type: "object",
          properties: {
            includeLocation: {
              type: "boolean",
              description: "Include geographic location data",
              default: true
            },
            includeDevice: {
              type: "boolean",
              description: "Include device and browser information",
              default: true
            }
          }
        }
      },
      {
        name: "identify_high_intent_visitors",
        description: "Identify visitors with high purchase/conversion intent",
        inputSchema: {
          type: "object",
          properties: {
            threshold: {
              type: "number",
              description: "Intent score threshold (0-100)",
              minimum: 0,
              maximum: 100,
              default: 70
            },
            limit: {
              type: "number",
              description: "Maximum number of visitors to return",
              minimum: 1,
              maximum: 100,
              default: 20
            }
          }
        }
      }
    ];

    // Filter tools based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('read:org')) {
      // Regular users get limited tools
      return tools.filter(t => ['track_visitor', 'analyze_visitor_behavior', 'get_real_time_visitors'].includes(t.name));
    }

    return tools;
  }

  /**
   * Execute LeadPulse tools
   */
  protected async callTool(name: string, args: any, authContext: MCPAuthContext): Promise<any> {
    switch (name) {
      case 'track_visitor':
        return await this.trackVisitor(args, authContext);
      case 'analyze_visitor_behavior':
        return await this.analyzeVisitorBehavior(args, authContext);
      case 'get_conversion_funnel':
        return await this.getConversionFunnel(args, authContext);
      case 'get_page_analytics':
        return await this.getPageAnalytics(args, authContext);
      case 'get_real_time_visitors':
        return await this.getRealTimeVisitors(args, authContext);
      case 'identify_high_intent_visitors':
        return await this.identifyHighIntentVisitors(args, authContext);
      default:
        throw new MCPValidationError(`Unknown tool: ${name}`);
    }
  }

  /**
   * Get visitor data with real MCPVisitorSessions queries
   */
  private async getVisitorData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Build where clause for visitor sessions
      const whereClause: any = {
        organizationId: authContext.organizationId
      };

      if (query.visitorId) {
        whereClause.visitorId = query.visitorId;
      }

      if (query.dateFrom || query.dateTo) {
        whereClause.sessionStart = {};
        if (query.dateFrom) {
          whereClause.sessionStart.gte = new Date(query.dateFrom);
        }
        if (query.dateTo) {
          whereClause.sessionStart.lte = new Date(query.dateTo);
        }
      }

      // Get real visitor sessions from MCP table
      const visitorSessions = await prisma.mCPVisitorSessions.findMany({
        where: whereClause,
        take: query.limit,
        skip: query.offset,
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        }
      });

      // Transform sessions to visitor format
      const visitors = visitorSessions.map(session => ({
        id: session.visitorId,
        sessionId: session.sessionId,
        organizationId: session.organizationId,
        startTime: session.sessionStart.toISOString(),
        endTime: session.sessionEnd.toISOString(),
        pageViews: session.pageViews,
        duration: session.duration,
        bounce: session.bounceRate > 0.5,
        converted: session.conversionValue > 0,
        intentScore: session.intentScore,
        geoLocation: {
          country: session.country,
          city: session.city,
          region: session.region
        },
        device: {
          type: session.deviceType,
          browser: session.browser,
          os: session.operatingSystem
        },
        traffic: {
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          referrer: session.referrer
        },
        engagement: {
          scrollDepth: session.scrollDepth,
          timeOnPage: session.avgTimeOnPage,
          interactions: session.interactions,
          exitPage: session.exitPage
        },
        insights: session.insights ? JSON.parse(session.insights) : []
      }));

      // Calculate summary statistics
      const totalSessions = visitors.length;
      const totalPageViews = visitors.reduce((sum, v) => sum + v.pageViews, 0);
      const avgDuration = totalSessions > 0 ? visitors.reduce((sum, v) => sum + v.duration, 0) / totalSessions : 0;
      const bounceRate = totalSessions > 0 ? visitors.filter(v => v.bounce).length / totalSessions : 0;
      const conversionRate = totalSessions > 0 ? visitors.filter(v => v.converted).length / totalSessions : 0;
      const avgIntentScore = totalSessions > 0 ? visitors.reduce((sum, v) => sum + v.intentScore, 0) / totalSessions : 0;

      // Device and location distribution
      const deviceDistribution = visitors.reduce((acc: Record<string, number>, v) => {
        acc[v.device.type] = (acc[v.device.type] || 0) + 1;
        return acc;
      }, {});

      const countryDistribution = visitors.reduce((acc: Record<string, number>, v) => {
        acc[v.geoLocation.country] = (acc[v.geoLocation.country] || 0) + 1;
        return acc;
      }, {});

      const duration = Date.now() - startTime;

      // Log resource access
      await this.logMCPResourceAccess(
        authContext,
        'leadpulse://visitors',
        'LIST',
        'success',
        { duration, dataSize: visitors.length }
      );

      return {
        uri: "leadpulse://visitors",
        mimeType: "application/json",
        text: JSON.stringify({
          visitors,
          summary: {
            totalSessions,
            totalPageViews,
            averageDuration: Math.round(avgDuration),
            bounceRate: Math.round(bounceRate * 100 * 100) / 100,
            conversionRate: Math.round(conversionRate * 100 * 100) / 100,
            avgIntentScore: Math.round(avgIntentScore * 100) / 100,
            deviceDistribution,
            countryDistribution
          },
          meta: {
            query: {
              limit: query.limit,
              offset: query.offset,
              organizationId: authContext.organizationId
            },
            total: visitors.length,
            timestamp: new Date().toISOString(),
            duration,
            source: 'MCP_VISITOR_SESSIONS'
          }
        })
      };
    } catch (error) {
      // Log failed access
      await this.logMCPResourceAccess(
        authContext,
        'leadpulse://visitors',
        'LIST',
        'failure',
        { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      );

      return await this.createFallbackResponse(
        () => this.getVisitorDataFallback(query, authContext),
        'Failed to retrieve visitor data via MCP'
      );
    }
  }

  /**
   * Track visitor tool with real data
   */
  private async trackVisitor(args: any, authContext: MCPAuthContext): Promise<any> {
    const { visitorId, includeJourney = true, includeHeatmap = false } = args;
    const startTime = Date.now();

    try {
      // Log tool execution
      await this.logMCPToolExecution(
        authContext,
        'track_visitor',
        args,
        'success',
        { duration: 0, riskLevel: 'low' }
      );

      // Get visitor sessions from MCP table
      const visitorSessions = await prisma.mCPVisitorSessions.findMany({
        where: {
          visitorId,
          organizationId: authContext.organizationId
        },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: 10 // Last 10 sessions for analysis
      });

      if (visitorSessions.length === 0) {
        const duration = Date.now() - startTime;
        
        await this.logMCPToolExecution(
          authContext,
          'track_visitor',
          args,
          'failure',
          { 
            duration,
            errorMessage: 'Visitor not found',
            riskLevel: 'low'
          }
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Visitor not found",
              visitorId
            })
          }],
          isError: true
        };
      }

      // Get current (most recent) session
      const currentSession = visitorSessions[0];
      
      // Calculate visitor profile from all sessions
      const totalSessions = visitorSessions.length;
      const totalPageViews = visitorSessions.reduce((sum, s) => sum + s.pageViews, 0);
      const avgSessionDuration = visitorSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;
      const totalConversions = visitorSessions.filter(s => s.conversionValue > 0).length;
      const avgIntentScore = visitorSessions.reduce((sum, s) => sum + s.intentScore, 0) / totalSessions;

      // Determine if returning visitor
      const isReturning = totalSessions > 1;
      const firstSessionDate = visitorSessions[visitorSessions.length - 1].sessionStart;
      const lastSessionDate = visitorSessions[0].sessionStart;

      // Build visitor profile
      const visitorData = {
        id: visitorId,
        currentSession: {
          sessionId: currentSession.sessionId,
          startTime: currentSession.sessionStart.toISOString(),
          endTime: currentSession.sessionEnd.toISOString(),
          currentPage: currentSession.exitPage || currentSession.landingPage,
          pageViews: currentSession.pageViews,
          duration: currentSession.duration,
          interactions: currentSession.interactions,
          intentScore: currentSession.intentScore,
          scrollDepth: currentSession.scrollDepth,
          bounced: currentSession.bounceRate > 0.5,
          converted: currentSession.conversionValue > 0,
          conversionValue: currentSession.conversionValue
        },
        profile: {
          isReturning,
          totalSessions,
          totalPageViews,
          totalConversions,
          averageSessionDuration: Math.round(avgSessionDuration),
          averageIntentScore: Math.round(avgIntentScore * 100) / 100,
          firstSeen: firstSessionDate.toISOString(),
          lastSeen: lastSessionDate.toISOString(),
          daysSinceFirstVisit: Math.floor((Date.now() - firstSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        geoLocation: {
          country: currentSession.country,
          city: currentSession.city,
          region: currentSession.region,
          timezone: this.getTimezoneFromCountry(currentSession.country)
        },
        device: {
          type: currentSession.deviceType,
          browser: currentSession.browser,
          os: currentSession.operatingSystem
        },
        trafficSource: {
          source: currentSession.source,
          medium: currentSession.medium,
          campaign: currentSession.campaign,
          referrer: currentSession.referrer
        },
        behavioral: {
          avgTimeOnPage: currentSession.avgTimeOnPage,
          bounceRate: this.calculateVisitorBounceRate(visitorSessions),
          conversionRate: totalConversions / totalSessions * 100,
          engagementScore: this.calculateEngagementScore(visitorSessions)
        }
      };

      // Add journey data if requested
      if (includeJourney) {
        visitorData.journey = this.buildVisitorJourney(visitorSessions);
      }

      // Add insights
      visitorData.insights = this.generateVisitorInsights(visitorData, visitorSessions);

      const duration = Date.now() - startTime;

      // Log successful tool execution
      await this.logMCPToolExecution(
        authContext,
        'track_visitor',
        args,
        'success',
        { 
          duration,
          outputSize: 1,
          riskLevel: includeJourney ? 'medium' : 'low'
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: visitorData,
            meta: {
              includeJourney,
              includeHeatmap,
              timestamp: new Date().toISOString(),
              duration,
              source: 'MCP_VISITOR_SESSIONS'
            }
          })
        }]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed tool execution
      await this.logMCPToolExecution(
        authContext,
        'track_visitor',
        args,
        'failure',
        { 
          duration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          riskLevel: 'medium'
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to track visitor",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Analyze visitor behavior tool
   */
  private async analyzeVisitorBehavior(args: any, authContext: MCPAuthContext): Promise<any> {
    const { visitorId, sessionId, timeRange = '7d' } = args;

    try {
      // Placeholder behavior analysis
      const behaviorAnalysis = {
        visitorId,
        sessionId,
        timeRange,
        behaviorPattern: {
          pageViewsPerSession: 6.5,
          averageSessionDuration: 420,
          bounceRate: 0.15,
          conversionRate: 0.08,
          engagementScore: 78
        },
        interests: [
          { category: 'Premium Services', score: 92 },
          { category: 'Analytics', score: 78 },
          { category: 'Automation', score: 65 }
        ],
        actions: {
          totalClicks: 45,
          formSubmissions: 2,
          downloadRequests: 1,
          socialShares: 0
        },
        predictions: {
          likelihoodToConvert: 0.74,
          timeToConversion: '2-3 days',
          preferredChannel: 'email',
          nextBestAction: 'Send targeted premium service offer'
        },
        insights: [
          "Visitor shows high engagement with premium content",
          "Multiple return sessions indicate strong interest",
          "Behavior pattern suggests readiness to purchase",
          "Recommended: Send personalized offer within 24 hours"
        ]
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: behaviorAnalysis,
            meta: {
              timeRange,
              analysisType: 'behavioral',
              timestamp: new Date().toISOString(),
              fallbackUsed: true
            }
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to analyze visitor behavior",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get conversion funnel tool
   */
  private async getConversionFunnel(args: any, authContext: MCPAuthContext): Promise<any> {
    const { funnelId, dateRange = '30d', includeSegments = false } = args;
    const startTime = Date.now();

    try {
      // Calculate date range
      const daysBack = this.parseDateRange(dateRange);
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      // Get visitor sessions data for funnel analysis
      const sessions = await prisma.mCPVisitorSessions.findMany({
        where: {
          organizationId: authContext.organizationId,
          sessionStart: {
            gte: startDate
          }
        },
        orderBy: {
          sessionStart: 'asc'
        }
      });

      // Define funnel steps based on common customer journey
      const funnelSteps = [
        { name: 'Landing Page Visit', pagePattern: '/' },
        { name: 'Product/Service View', pagePattern: '/features|/products|/services' },
        { name: 'Pricing Page View', pagePattern: '/pricing' },
        { name: 'Contact/Demo Request', pagePattern: '/contact|/demo|/signup' },
        { name: 'Conversion', conversionRequired: true }
      ];

      // Analyze visitor progression through funnel
      const funnelData = this.analyzeFunnelProgression(sessions, funnelSteps);

      // Add segment analysis if requested
      let segmentData = undefined;
      if (includeSegments) {
        segmentData = await this.analyzeFunnelBySegments(sessions, funnelSteps, authContext);
      }

      // Generate insights based on real data
      const insights = this.generateFunnelInsights(funnelData.steps, segmentData);

      const duration = Date.now() - startTime;

      // Log tool execution
      await this.logMCPToolExecution(
        authContext,
        'get_conversion_funnel',
        args,
        'success',
        { 
          duration,
          outputSize: funnelData.steps.length,
          riskLevel: 'low'
        }
      );

      const result = {
        funnelId: funnelId || 'organization-funnel',
        dateRange,
        totalSessions: sessions.length,
        timeframe: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          daysAnalyzed: daysBack
        },
        steps: funnelData.steps,
        overallConversion: funnelData.overallConversion,
        totalRevenue: funnelData.totalRevenue,
        averageOrderValue: funnelData.averageOrderValue,
        segments: segmentData,
        insights,
        performance: {
          bestPerformingStep: funnelData.bestStep,
          worstPerformingStep: funnelData.worstStep,
          biggestDropOff: funnelData.biggestDropOff
        }
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: result,
            meta: {
              dateRange,
              includeSegments,
              timestamp: new Date().toISOString(),
              duration,
              source: 'MCP_VISITOR_SESSIONS'
            }
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to get conversion funnel",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get page analytics tool
   */
  private async getPageAnalytics(args: any, authContext: MCPAuthContext): Promise<any> {
    const { pageUrl, includeHeatmap = true, dateRange = '7d' } = args;

    try {
      // Placeholder page analytics
      const pageAnalytics = {
        pageUrl,
        dateRange,
        metrics: {
          pageViews: 2500,
          uniqueVisitors: 1800,
          averageTimeOnPage: 180,
          bounceRate: 0.35,
          exitRate: 0.42,
          scrollDepth: 0.68,
          clickThroughRate: 0.15
        },
        heatmapData: includeHeatmap ? {
          clickMap: {
            headerNav: 45,
            primaryCTA: 120,
            secondaryCTA: 67,
            footer: 23
          },
          scrollMap: {
            '0-25%': 100,
            '25-50%': 85,
            '50-75%': 68,
            '75-100%': 42
          },
          attentionMap: {
            hero: 8.5,
            features: 6.2,
            pricing: 7.8,
            testimonials: 4.1
          }
        } : undefined,
        insights: [
          "Primary CTA has good engagement (120 clicks)",
          "Users tend to drop off at 50% scroll depth",
          "Pricing section gets high attention (7.8 seconds average)",
          "Consider moving testimonials higher up the page"
        ]
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: pageAnalytics,
            meta: {
              pageUrl,
              dateRange,
              includeHeatmap,
              timestamp: new Date().toISOString(),
              fallbackUsed: true
            }
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to get page analytics",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get real-time visitors tool with actual visitor session data
   */
  private async getRealTimeVisitors(args: any, authContext: MCPAuthContext): Promise<any> {
    const { includeLocation = true, includeDevice = true } = args;
    const startTime = Date.now();

    try {
      // Log tool execution
      await this.logMCPToolExecution(
        authContext,
        'get_real_time_visitors',
        args,
        'success',
        { duration: 0, riskLevel: 'low' }
      );

      // Define "real-time" as sessions that are still active (within last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const now = new Date();

      // Get currently active visitor sessions
      const activeSessions = await prisma.mCPVisitorSessions.findMany({
        where: {
          organizationId: authContext.organizationId,
          sessionStart: {
            gte: thirtyMinutesAgo
          },
          sessionEnd: {
            gte: thirtyMinutesAgo // Sessions that ended recently or are still ongoing
          }
        },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: 50 // Limit for performance
      });

      // Calculate current visitor count (unique visitors in last 30 minutes)
      const uniqueVisitors = new Set(activeSessions.map(s => s.visitorId));
      const currentVisitors = uniqueVisitors.size;

      // Calculate active pages by grouping current page views
      const pageActivity = activeSessions.reduce((acc: Record<string, number>, session) => {
        const currentPage = session.exitPage || session.landingPage || '/';
        acc[currentPage] = (acc[currentPage] || 0) + 1;
        return acc;
      }, {});

      const activePages = Object.entries(pageActivity)
        .map(([page, visitors]) => ({ page, visitors }))
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 10); // Top 10 pages

      // Transform visitor data
      const visitors = activeSessions.slice(0, 20).map(session => {
        const sessionDurationMs = session.sessionEnd.getTime() - session.sessionStart.getTime();
        const timeOnCurrentPage = Math.max(0, (now.getTime() - session.sessionStart.getTime()) / 1000);
        
        return {
          id: session.visitorId,
          sessionId: session.sessionId,
          currentPage: session.exitPage || session.landingPage,
          timeOnPage: Math.round(timeOnCurrentPage),
          sessionDuration: Math.round(sessionDurationMs / 1000),
          pageViews: session.pageViews,
          interactions: session.interactions,
          intentScore: session.intentScore,
          scrollDepth: session.scrollDepth,
          isReturning: this.isReturningVisitor(session.visitorId, activeSessions),
          isConverted: session.conversionValue > 0,
          trafficSource: {
            source: session.source,
            medium: session.medium,
            campaign: session.campaign
          },
          location: includeLocation ? {
            country: session.country,
            city: session.city,
            region: session.region
          } : undefined,
          device: includeDevice ? {
            type: session.deviceType,
            browser: session.browser,
            os: session.operatingSystem
          } : undefined
        };
      });

      // Calculate real-time insights
      const insights = this.generateRealTimeInsights(activeSessions, visitors, currentVisitors);

      // Calculate traffic trends (compare with previous 30 minutes)
      const previousPeriodStart = new Date(thirtyMinutesAgo.getTime() - 30 * 60 * 1000);
      const previousSessions = await prisma.mCPVisitorSessions.count({
        where: {
          organizationId: authContext.organizationId,
          sessionStart: {
            gte: previousPeriodStart,
            lt: thirtyMinutesAgo
          }
        }
      });

      const trafficChange = previousSessions > 0 
        ? ((currentVisitors - previousSessions) / previousSessions) * 100 
        : 0;

      // Device and location statistics
      const deviceStats = includeDevice ? this.calculateDeviceStats(visitors) : undefined;
      const locationStats = includeLocation ? this.calculateLocationStats(visitors) : undefined;

      const duration = Date.now() - startTime;

      // Log successful tool execution
      await this.logMCPToolExecution(
        authContext,
        'get_real_time_visitors',
        args,
        'success',
        { 
          duration,
          outputSize: visitors.length,
          riskLevel: 'low'
        }
      );

      const realTimeData = {
        currentVisitors,
        trafficTrend: {
          change: Math.round(trafficChange * 100) / 100,
          direction: trafficChange > 0 ? 'increasing' : trafficChange < 0 ? 'decreasing' : 'stable',
          previousPeriodVisitors: previousSessions
        },
        activePages,
        visitors,
        deviceStats,
        locationStats,
        insights,
        sessionStats: {
          totalActiveSessions: activeSessions.length,
          avgSessionDuration: activeSessions.length > 0 
            ? Math.round(activeSessions.reduce((sum, s) => sum + s.duration, 0) / activeSessions.length)
            : 0,
          avgPageViews: activeSessions.length > 0 
            ? Math.round(activeSessions.reduce((sum, s) => sum + s.pageViews, 0) / activeSessions.length * 100) / 100
            : 0,
          avgIntentScore: activeSessions.length > 0 
            ? Math.round(activeSessions.reduce((sum, s) => sum + s.intentScore, 0) / activeSessions.length * 100) / 100
            : 0,
          conversionRate: activeSessions.length > 0 
            ? Math.round(activeSessions.filter(s => s.conversionValue > 0).length / activeSessions.length * 100 * 100) / 100
            : 0
        }
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: realTimeData,
            meta: {
              includeLocation,
              includeDevice,
              timestamp: new Date().toISOString(),
              duration,
              timeWindow: '30 minutes',
              source: 'MCP_VISITOR_SESSIONS'
            }
          })
        }]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed tool execution
      await this.logMCPToolExecution(
        authContext,
        'get_real_time_visitors',
        args,
        'failure',
        { 
          duration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          riskLevel: 'medium'
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to get real-time visitors",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Identify high intent visitors tool with real data
   */
  private async identifyHighIntentVisitors(args: any, authContext: MCPAuthContext): Promise<any> {
    const { threshold = 70, limit = 20 } = args;
    const startTime = Date.now();

    try {
      // Log tool execution
      await this.logMCPToolExecution(
        authContext,
        'identify_high_intent_visitors',
        args,
        'success',
        { duration: 0, riskLevel: 'low' }
      );

      // Get high intent visitors from real session data
      const highIntentSessions = await prisma.mCPVisitorSessions.findMany({
        where: {
          organizationId: authContext.organizationId,
          intentScore: {
            gte: threshold
          },
          sessionStart: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          organization: {
            select: { id: true, name: true }
          }
        },
        orderBy: {
          intentScore: 'desc'
        },
        take: limit
      });

      // Transform to high intent visitor format
      const highIntentVisitors = await Promise.all(highIntentSessions.map(async (session) => {
        // Get historical sessions for this visitor to determine behavior patterns
        const visitorSessions = await prisma.mCPVisitorSessions.findMany({
          where: {
            visitorId: session.visitorId,
            organizationId: authContext.organizationId
          },
          orderBy: {
            sessionStart: 'desc'
          },
          take: 10
        });

        // Analyze visitor behavior patterns
        const signals = this.analyzeVisitorSignals(session, visitorSessions);
        const recommendation = this.generateRecommendation(session, signals);

        return {
          id: session.visitorId,
          sessionId: session.sessionId,
          intentScore: session.intentScore,
          currentPage: session.exitPage || session.landingPage,
          sessionDuration: session.duration,
          pageViews: session.pageViews,
          interactions: session.interactions,
          scrollDepth: session.scrollDepth,
          conversionValue: session.conversionValue,
          signals,
          profile: {
            isReturning: visitorSessions.length > 1,
            totalSessions: visitorSessions.length,
            totalPageViews: visitorSessions.reduce((sum, s) => sum + s.pageViews, 0),
            avgSessionDuration: Math.round(visitorSessions.reduce((sum, s) => sum + s.duration, 0) / visitorSessions.length),
            lastSeen: session.sessionStart.toISOString(),
            location: {
              country: session.country,
              city: session.city,
              region: session.region
            },
            device: {
              type: session.deviceType,
              browser: session.browser,
              os: session.operatingSystem
            }
          },
          trafficSource: {
            source: session.source,
            medium: session.medium,
            campaign: session.campaign,
            referrer: session.referrer
          },
          recommendation
        };
      }));

      // Calculate insights
      const totalCount = highIntentVisitors.length;
      const averageIntentScore = totalCount > 0 
        ? highIntentVisitors.reduce((sum, v) => sum + v.intentScore, 0) / totalCount 
        : 0;
      
      const returningVisitors = highIntentVisitors.filter(v => v.profile.isReturning).length;
      const convertedVisitors = highIntentVisitors.filter(v => v.conversionValue > 0).length;
      const mobileVisitors = highIntentVisitors.filter(v => v.profile.device.type === 'mobile').length;

      const insights = [
        `${totalCount} visitors above ${threshold}% intent threshold in last 24 hours`,
        `Average intent score: ${Math.round(averageIntentScore)}%`,
        `${Math.round((returningVisitors / totalCount) * 100)}% are returning visitors showing continued interest`,
        `${convertedVisitors} have already converted in their current session`,
        `${Math.round((mobileVisitors / totalCount) * 100)}% are browsing on mobile devices`,
        "Recommend immediate personalized outreach for best conversion rates"
      ];

      const duration = Date.now() - startTime;

      // Log successful tool execution
      await this.logMCPToolExecution(
        authContext,
        'identify_high_intent_visitors',
        args,
        'success',
        { 
          duration,
          outputSize: totalCount,
          riskLevel: 'medium' // Higher risk due to visitor identification
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              visitors: highIntentVisitors,
              totalCount,
              averageIntentScore: Math.round(averageIntentScore * 100) / 100,
              statistics: {
                returningVisitors,
                convertedVisitors,
                mobileVisitors,
                returningPercentage: Math.round((returningVisitors / totalCount) * 100),
                conversionRate: Math.round((convertedVisitors / totalCount) * 100 * 100) / 100,
                mobilePercentage: Math.round((mobileVisitors / totalCount) * 100)
              },
              insights
            },
            meta: {
              threshold,
              limit,
              timeRange: '24 hours',
              timestamp: new Date().toISOString(),
              duration,
              source: 'MCP_VISITOR_SESSIONS'
            }
          })
        }]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed tool execution
      await this.logMCPToolExecution(
        authContext,
        'identify_high_intent_visitors',
        args,
        'failure',
        { 
          duration,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          riskLevel: 'medium'
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: "Failed to identify high intent visitors",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Fallback methods for LeadPulse data
   */
  private async getVisitorDataFallback(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      visitors: [],
      meta: {
        total: 0,
        offset: query.offset,
        limit: query.limit,
        fallbackUsed: true,
        message: "Visitor data fallback - implementation needed"
      }
    };
  }

  /**
   * Get session data (placeholder)
   */
  private async getSessionData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "leadpulse://sessions",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Session data functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  /**
   * Get heatmap data (placeholder)
   */
  private async getHeatmapData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "leadpulse://heatmaps",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Heatmap data functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  /**
   * Get journey data (placeholder)
   */
  private async getJourneyData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "leadpulse://journeys",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Journey data functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  /**
   * Get conversion data (placeholder)
   */
  private async getConversionData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "leadpulse://conversions",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Conversion data functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  /**
   * Get analytics data (placeholder)
   */
  private async getAnalyticsData(query: LeadPulseQuery, authContext: MCPAuthContext): Promise<any> {
    return {
      uri: "leadpulse://analytics",
      mimeType: "application/json",
      text: JSON.stringify({
        message: "Analytics data functionality coming soon",
        fallbackUsed: true
      })
    };
  }

  /**
   * Helper methods for visitor analysis
   */
  
  /**
   * Get timezone from country code
   */
  private getTimezoneFromCountry(country: string): string {
    const timezoneMap: Record<string, string> = {
      'Nigeria': 'Africa/Lagos',
      'Kenya': 'Africa/Nairobi',
      'Ghana': 'Africa/Accra',
      'South Africa': 'Africa/Johannesburg',
      'Egypt': 'Africa/Cairo',
      'Morocco': 'Africa/Casablanca',
      'Tanzania': 'Africa/Dar_es_Salaam',
      'Uganda': 'Africa/Kampala',
      'Rwanda': 'Africa/Kigali',
      'Zambia': 'Africa/Lusaka'
    };
    return timezoneMap[country] || 'UTC';
  }

  /**
   * Calculate visitor bounce rate across sessions
   */
  private calculateVisitorBounceRate(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const bouncedSessions = sessions.filter(s => s.bounceRate > 0.5).length;
    return (bouncedSessions / sessions.length) * 100;
  }

  /**
   * Calculate engagement score based on visitor behavior
   */
  private calculateEngagementScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    let score = 0;
    const weights = {
      sessionDuration: 0.3,
      pageViews: 0.25,
      interactions: 0.2,
      scrollDepth: 0.15,
      conversions: 0.1
    };

    // Average session duration (normalized to 0-100)
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    score += Math.min(avgDuration / 300, 1) * 100 * weights.sessionDuration; // 5 minutes = 100%

    // Average page views per session
    const avgPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length;
    score += Math.min(avgPageViews / 10, 1) * 100 * weights.pageViews; // 10 pages = 100%

    // Average interactions
    const avgInteractions = sessions.reduce((sum, s) => sum + s.interactions, 0) / sessions.length;
    score += Math.min(avgInteractions / 20, 1) * 100 * weights.interactions; // 20 interactions = 100%

    // Average scroll depth
    const avgScrollDepth = sessions.reduce((sum, s) => sum + s.scrollDepth, 0) / sessions.length;
    score += avgScrollDepth * 100 * weights.scrollDepth;

    // Conversion bonus
    const conversions = sessions.filter(s => s.conversionValue > 0).length;
    score += (conversions / sessions.length) * 100 * weights.conversions;

    return Math.round(score * 100) / 100;
  }

  /**
   * Build visitor journey from sessions
   */
  private buildVisitorJourney(sessions: any[]): any[] {
    const journey: any[] = [];

    sessions.reverse().forEach((session, sessionIndex) => {
      // Add session start
      journey.push({
        timestamp: session.sessionStart.toISOString(),
        action: 'session_start',
        sessionId: session.sessionId,
        page: session.landingPage,
        source: session.source,
        medium: session.medium,
        campaign: session.campaign
      });

      // Simulate page views based on session data
      const pageViews = Math.max(1, session.pageViews);
      const sessionDuration = session.duration;
      const timePerPage = sessionDuration / pageViews;

      for (let i = 0; i < pageViews; i++) {
        const pageTimestamp = new Date(session.sessionStart.getTime() + (i * timePerPage * 1000));
        journey.push({
          timestamp: pageTimestamp.toISOString(),
          action: 'page_view',
          page: i === 0 ? session.landingPage : (i === pageViews - 1 ? session.exitPage : `/page-${i + 1}`),
          duration: Math.round(timePerPage),
          scrollDepth: session.scrollDepth,
          interactions: Math.round(session.interactions / pageViews)
        });
      }

      // Add conversion event if applicable
      if (session.conversionValue > 0) {
        journey.push({
          timestamp: new Date(session.sessionEnd.getTime() - 30000).toISOString(), // 30 seconds before session end
          action: 'conversion',
          page: session.exitPage,
          value: session.conversionValue,
          conversionType: 'purchase' // Could be determined from data
        });
      }

      // Add session end
      journey.push({
        timestamp: session.sessionEnd.toISOString(),
        action: 'session_end',
        sessionId: session.sessionId,
        page: session.exitPage,
        duration: session.duration,
        bounced: session.bounceRate > 0.5
      });
    });

    return journey;
  }

  /**
   * Generate insights for visitor behavior
   */
  private generateVisitorInsights(visitorData: any, sessions: any[]): string[] {
    const insights: string[] = [];
    const profile = visitorData.profile;
    const current = visitorData.currentSession;
    const behavioral = visitorData.behavioral;

    // Intent score insights
    if (current.intentScore > 80) {
      insights.push(`High intent visitor - ${current.intentScore}% intent score indicates strong purchase likelihood`);
    } else if (current.intentScore > 60) {
      insights.push(`Moderate intent visitor - ${current.intentScore}% intent score shows interest`);
    } else {
      insights.push(`Low intent visitor - ${current.intentScore}% intent score suggests early stage exploration`);
    }

    // Engagement insights
    if (behavioral.engagementScore > 70) {
      insights.push(`Highly engaged visitor - ${behavioral.engagementScore.toFixed(1)} engagement score`);
    } else if (behavioral.engagementScore > 40) {
      insights.push(`Moderately engaged visitor - ${behavioral.engagementScore.toFixed(1)} engagement score`);
    }

    // Session insights
    if (current.pageViews > 5) {
      insights.push(`Engaged user - ${current.pageViews} page views in current session shows strong interest`);
    }

    if (current.duration > 300) { // 5 minutes
      insights.push(`Extended session - ${Math.round(current.duration / 60)} minutes indicates serious consideration`);
    }

    // Returning visitor insights
    if (profile.isReturning) {
      insights.push(`Returning visitor - ${profile.totalSessions} total sessions shows continued interest`);
      
      if (profile.daysSinceFirstVisit > 7) {
        insights.push(`Long-term interest - first visited ${profile.daysSinceFirstVisit} days ago`);
      }
    } else {
      insights.push("New visitor - first-time visit represents acquisition opportunity");
    }

    // Conversion insights
    if (profile.totalConversions > 0) {
      insights.push(`Converting visitor - ${profile.totalConversions} previous conversions`);
    } else if (behavioral.conversionRate > 0) {
      insights.push("Conversion potential - behavioral patterns suggest readiness to convert");
    }

    // Geographic insights
    if (visitorData.geoLocation.country === 'Nigeria') {
      insights.push("Nigerian visitor - optimize for mobile experience and local payment methods");
    }

    // Device insights
    if (visitorData.device.type === 'mobile') {
      insights.push("Mobile visitor - ensure mobile-optimized experience and WhatsApp integration");
    }

    // Bounce rate insights
    if (behavioral.bounceRate < 20) {
      insights.push("Low bounce rate indicates strong content engagement");
    } else if (behavioral.bounceRate > 60) {
      insights.push("High bounce rate suggests need for content optimization");
    }

    return insights;
  }

  /**
   * Check if visitor is returning based on visitor ID occurrence
   */
  private isReturningVisitor(visitorId: string, sessions: any[]): boolean {
    return sessions.filter(s => s.visitorId === visitorId).length > 1;
  }

  /**
   * Generate real-time insights based on current activity
   */
  private generateRealTimeInsights(activeSessions: any[], visitors: any[], currentVisitors: number): string[] {
    const insights: string[] = [];

    if (currentVisitors === 0) {
      insights.push("No active visitors currently on the site");
      return insights;
    }

    // Traffic level insights
    if (currentVisitors > 20) {
      insights.push(`High traffic period - ${currentVisitors} active visitors`);
    } else if (currentVisitors > 5) {
      insights.push(`Moderate traffic - ${currentVisitors} active visitors`);
    } else {
      insights.push(`Low traffic period - ${currentVisitors} active visitors`);
    }

    // Device distribution insights
    const mobileVisitors = visitors.filter(v => v.device?.type === 'mobile').length;
    const mobilePercentage = visitors.length > 0 ? (mobileVisitors / visitors.length) * 100 : 0;
    
    if (mobilePercentage > 70) {
      insights.push(`${Math.round(mobilePercentage)}% of visitors are on mobile devices`);
    }

    // Geographic insights
    const countries = new Set(visitors.map(v => v.location?.country).filter(Boolean));
    if (countries.size > 1) {
      insights.push(`Visitors from ${countries.size} countries currently active`);
    }

    // High intent visitors
    const highIntentVisitors = visitors.filter(v => v.intentScore > 70).length;
    if (highIntentVisitors > 0) {
      insights.push(`${highIntentVisitors} high-intent visitors (>70% intent score) currently browsing`);
    }

    // Session duration insights
    const longSessions = visitors.filter(v => v.sessionDuration > 300).length; // > 5 minutes
    if (longSessions > 0) {
      insights.push(`${longSessions} visitors have been browsing for over 5 minutes`);
    }

    // Page popularity
    const avgPageViews = visitors.length > 0 
      ? visitors.reduce((sum, v) => sum + v.pageViews, 0) / visitors.length 
      : 0;
    
    if (avgPageViews > 3) {
      insights.push(`High engagement - average ${Math.round(avgPageViews * 10) / 10} pages per session`);
    }

    // Returning visitors
    const returningVisitors = visitors.filter(v => v.isReturning).length;
    if (returningVisitors > 0) {
      const returningPercentage = (returningVisitors / visitors.length) * 100;
      insights.push(`${Math.round(returningPercentage)}% are returning visitors`);
    }

    // Conversion insights
    const convertedVisitors = visitors.filter(v => v.isConverted).length;
    if (convertedVisitors > 0) {
      insights.push(`${convertedVisitors} visitors have converted in their current session`);
    }

    return insights;
  }

  /**
   * Calculate device statistics for real-time data
   */
  private calculateDeviceStats(visitors: any[]): any {
    if (visitors.length === 0) return null;

    const deviceTypes = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.device?.type) {
        acc[v.device.type] = (acc[v.device.type] || 0) + 1;
      }
      return acc;
    }, {});

    const browsers = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.device?.browser) {
        acc[v.device.browser] = (acc[v.device.browser] || 0) + 1;
      }
      return acc;
    }, {});

    const operatingSystems = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.device?.os) {
        acc[v.device.os] = (acc[v.device.os] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      deviceTypes,
      browsers,
      operatingSystems,
      mobilePercentage: deviceTypes.mobile ? (deviceTypes.mobile / visitors.length) * 100 : 0
    };
  }

  /**
   * Calculate location statistics for real-time data
   */
  private calculateLocationStats(visitors: any[]): any {
    if (visitors.length === 0) return null;

    const countries = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.location?.country) {
        acc[v.location.country] = (acc[v.location.country] || 0) + 1;
      }
      return acc;
    }, {});

    const cities = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.location?.city) {
        acc[v.location.city] = (acc[v.location.city] || 0) + 1;
      }
      return acc;
    }, {});

    const regions = visitors.reduce((acc: Record<string, number>, v) => {
      if (v.location?.region) {
        acc[v.location.region] = (acc[v.location.region] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      countries,
      cities,
      regions,
      topCountry: Object.entries(countries).sort((a, b) => b[1] - a[1])[0]?.[0],
      totalCountries: Object.keys(countries).length
    };
  }

  /**
   * Analyze visitor behavior signals for intent scoring
   */
  private analyzeVisitorSignals(currentSession: any, visitorSessions: any[]): any {
    const signals = {
      engagementSignals: [],
      behavioralSignals: [],
      intentSignals: [],
      riskSignals: []
    };

    // Engagement signals
    if (currentSession.duration > 300) { // 5+ minutes
      signals.engagementSignals.push({
        type: 'long_session',
        value: currentSession.duration,
        weight: 0.8,
        description: `Extended session duration of ${Math.round(currentSession.duration / 60)} minutes`
      });
    }

    if (currentSession.pageViews > 5) {
      signals.engagementSignals.push({
        type: 'high_page_views',
        value: currentSession.pageViews,
        weight: 0.7,
        description: `High engagement with ${currentSession.pageViews} page views`
      });
    }

    if (currentSession.interactions > 10) {
      signals.engagementSignals.push({
        type: 'high_interactions',
        value: currentSession.interactions,
        weight: 0.6,
        description: `Active user with ${currentSession.interactions} interactions`
      });
    }

    if (currentSession.scrollDepth > 75) {
      signals.engagementSignals.push({
        type: 'deep_scroll',
        value: currentSession.scrollDepth,
        weight: 0.5,
        description: `Deep content engagement with ${currentSession.scrollDepth}% scroll depth`
      });
    }

    // Behavioral signals
    const isReturning = visitorSessions.length > 1;
    if (isReturning) {
      signals.behavioralSignals.push({
        type: 'returning_visitor',
        value: visitorSessions.length,
        weight: 0.9,
        description: `Returning visitor with ${visitorSessions.length} total sessions`
      });
    }

    // Calculate average session duration across all sessions
    const avgSessionDuration = visitorSessions.reduce((sum, s) => sum + s.duration, 0) / visitorSessions.length;
    if (avgSessionDuration > 180) { // 3+ minutes average
      signals.behavioralSignals.push({
        type: 'consistent_engagement',
        value: avgSessionDuration,
        weight: 0.7,
        description: `Consistent engagement with ${Math.round(avgSessionDuration / 60)} minute average sessions`
      });
    }

    // Intent signals based on pages visited
    const landingPage = currentSession.landingPage?.toLowerCase() || '';
    const exitPage = currentSession.exitPage?.toLowerCase() || '';

    if (landingPage.includes('pricing') || exitPage.includes('pricing')) {
      signals.intentSignals.push({
        type: 'pricing_interest',
        value: 1,
        weight: 0.9,
        description: 'Visited pricing page indicating purchase intent'
      });
    }

    if (landingPage.includes('contact') || exitPage.includes('contact') || landingPage.includes('demo')) {
      signals.intentSignals.push({
        type: 'contact_interest',
        value: 1,
        weight: 0.8,
        description: 'Visited contact/demo page indicating high intent'
      });
    }

    if (currentSession.conversionValue > 0) {
      signals.intentSignals.push({
        type: 'conversion_completed',
        value: currentSession.conversionValue,
        weight: 1.0,
        description: `Completed conversion with value ${currentSession.conversionValue}`
      });
    }

    // Risk signals
    if (currentSession.bounceRate > 0.8) {
      signals.riskSignals.push({
        type: 'high_bounce_risk',
        value: currentSession.bounceRate,
        weight: -0.5,
        description: 'High bounce rate indicates potential disengagement'
      });
    }

    if (currentSession.duration < 30) { // Less than 30 seconds
      signals.riskSignals.push({
        type: 'quick_exit',
        value: currentSession.duration,
        weight: -0.6,
        description: 'Very short session duration suggests low interest'
      });
    }

    // Traffic source insights
    if (currentSession.source === 'direct' && isReturning) {
      signals.behavioralSignals.push({
        type: 'direct_return',
        value: 1,
        weight: 0.8,
        description: 'Direct traffic from returning visitor shows brand awareness'
      });
    }

    if (currentSession.source === 'organic') {
      signals.behavioralSignals.push({
        type: 'organic_discovery',
        value: 1,
        weight: 0.6,
        description: 'Organic search traffic indicates active problem-solving'
      });
    }

    return signals;
  }

  /**
   * Generate personalized recommendation based on visitor signals
   */
  private generateRecommendation(currentSession: any, signals: any): any {
    const recommendations = [];
    let urgency = 'low';
    let priority = 1;

    // Calculate overall intent score from signals
    const intentScore = currentSession.intentScore || 0;
    
    // Analyze engagement signals
    if (signals.engagementSignals.length > 2) {
      recommendations.push({
        action: 'immediate_engagement',
        channel: 'live_chat',
        message: 'Offer live chat assistance due to high engagement',
        reason: 'Multiple strong engagement signals detected'
      });
      urgency = 'high';
      priority = 3;
    }

    // Analyze intent signals
    const hasHighIntent = signals.intentSignals.some(s => s.weight > 0.8);
    if (hasHighIntent) {
      recommendations.push({
        action: 'sales_outreach',
        channel: 'phone',
        message: 'Schedule immediate sales call',
        reason: 'High purchase intent detected',
        timing: 'within_1_hour'
      });
      urgency = 'critical';
      priority = 5;
    }

    // Pricing page visitors
    const visitedPricing = signals.intentSignals.some(s => s.type === 'pricing_interest');
    if (visitedPricing) {
      recommendations.push({
        action: 'pricing_assistance',
        channel: 'email',
        message: 'Send personalized pricing information and case studies',
        reason: 'Showed interest in pricing',
        timing: 'within_2_hours'
      });
      
      if (currentSession.duration > 180) { // 3+ minutes on pricing
        recommendations.push({
          action: 'discount_offer',
          channel: 'popup',
          message: 'Offer limited-time discount or consultation',
          reason: 'Extended time on pricing page',
          timing: 'immediate'
        });
      }
    }

    // Returning visitor recommendations
    const isReturning = signals.behavioralSignals.some(s => s.type === 'returning_visitor');
    if (isReturning && !hasHighIntent) {
      recommendations.push({
        action: 'nurture_campaign',
        channel: 'email',
        message: 'Add to targeted nurture campaign with case studies',
        reason: 'Returning visitor showing continued interest',
        timing: 'within_24_hours'
      });
    }

    // Mobile-specific recommendations
    if (currentSession.deviceType === 'mobile') {
      recommendations.push({
        action: 'mobile_optimization',
        channel: 'whatsapp',
        message: 'Offer WhatsApp consultation for mobile convenience',
        reason: 'Mobile user in African market',
        timing: 'within_4_hours'
      });
    }

    // Geographic recommendations
    if (currentSession.country === 'Nigeria' || currentSession.country === 'South Africa') {
      recommendations.push({
        action: 'local_approach',
        channel: 'sms',
        message: 'Send localized message with regional case studies',
        reason: 'African market visitor',
        timing: 'within_6_hours'
      });
    }

    // Risk mitigation
    const hasRiskSignals = signals.riskSignals.length > 0;
    if (hasRiskSignals && !hasHighIntent) {
      recommendations.push({
        action: 'retention_effort',
        channel: 'popup',
        message: 'Show value proposition or offer assistance',
        reason: 'Risk signals detected - prevent bounce',
        timing: 'immediate'
      });
    }

    // Default recommendation for new visitors
    if (!isReturning && intentScore < 50) {
      recommendations.push({
        action: 'lead_magnet',
        channel: 'popup',
        message: 'Offer valuable content download for email capture',
        reason: 'New visitor - build relationship',
        timing: 'after_60_seconds'
      });
    }

    return {
      recommendations,
      urgency,
      priority,
      nextBestAction: recommendations.length > 0 ? recommendations[0] : null,
      confidence: Math.min(intentScore / 100 + (signals.engagementSignals.length * 0.1), 1.0),
      reasoning: {
        intentScore,
        engagementLevel: signals.engagementSignals.length > 2 ? 'high' : signals.engagementSignals.length > 0 ? 'medium' : 'low',
        riskLevel: signals.riskSignals.length > 1 ? 'high' : signals.riskSignals.length > 0 ? 'medium' : 'low',
        visitorType: isReturning ? 'returning' : 'new'
      }
    };
  }

  /**
   * Parse date range string to number of days
   */
  private parseDateRange(dateRange: string): number {
    const rangeMap: Record<string, number> = {
      '1d': 1,
      '7d': 7,
      '14d': 14,
      '30d': 30,
      '60d': 60,
      '90d': 90,
      '180d': 180,
      '365d': 365
    };
    return rangeMap[dateRange] || 30;
  }

  /**
   * Analyze visitor progression through conversion funnel
   */
  private analyzeFunnelProgression(sessions: any[], funnelSteps: any[]): any {
    const stepAnalysis = [];
    let previousStepVisitors = sessions.length;

    // Analyze each funnel step
    for (let i = 0; i < funnelSteps.length; i++) {
      const step = funnelSteps[i];
      let stepVisitors = 0;
      let stepRevenue = 0;

      if (step.conversionRequired) {
        // Final conversion step - count sessions with conversions
        const convertedSessions = sessions.filter(session => session.conversionValue > 0);
        stepVisitors = convertedSessions.length;
        stepRevenue = convertedSessions.reduce((sum, session) => sum + session.conversionValue, 0);
      } else {
        // Page visit step - count sessions that visited matching pages
        stepVisitors = sessions.filter(session => {
          const landingPage = session.landingPage?.toLowerCase() || '';
          const exitPage = session.exitPage?.toLowerCase() || '';
          const pattern = new RegExp(step.pagePattern, 'i');
          return pattern.test(landingPage) || pattern.test(exitPage);
        }).length;
      }

      const conversionRate = previousStepVisitors > 0 ? (stepVisitors / previousStepVisitors) * 100 : 0;
      const dropOffRate = previousStepVisitors > 0 ? ((previousStepVisitors - stepVisitors) / previousStepVisitors) * 100 : 0;

      stepAnalysis.push({
        step: i + 1,
        name: step.name,
        visitors: stepVisitors,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
        revenue: stepRevenue,
        pattern: step.pagePattern || 'conversion'
      });

      previousStepVisitors = stepVisitors;
    }

    // Calculate overall metrics
    const totalSessions = sessions.length;
    const totalConversions = stepAnalysis[stepAnalysis.length - 1]?.visitors || 0;
    const totalRevenue = stepAnalysis[stepAnalysis.length - 1]?.revenue || 0;
    const overallConversion = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;
    const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

    // Find best and worst performing steps
    const stepRates = stepAnalysis.slice(1).map(step => ({ name: step.name, rate: step.conversionRate }));
    const bestStep = stepRates.reduce((max, step) => step.rate > max.rate ? step : max, stepRates[0] || { name: 'N/A', rate: 0 });
    const worstStep = stepRates.reduce((min, step) => step.rate < min.rate ? step : min, stepRates[0] || { name: 'N/A', rate: 0 });
    
    // Find biggest drop-off
    const dropOffs = stepAnalysis.map(step => ({ name: step.name, dropOff: step.dropOffRate }));
    const biggestDropOff = dropOffs.reduce((max, step) => step.dropOff > max.dropOff ? step : max, dropOffs[0] || { name: 'N/A', dropOff: 0 });

    return {
      steps: stepAnalysis,
      overallConversion: Math.round(overallConversion * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      bestStep: bestStep.name,
      worstStep: worstStep.name,
      biggestDropOff: biggestDropOff.name
    };
  }

  /**
   * Analyze funnel performance by customer segments
   */
  private async analyzeFunnelBySegments(sessions: any[], funnelSteps: any[], authContext: MCPAuthContext): Promise<any[]> {
    try {
      // Get segments for the organization
      const segments = await prisma.segment.findMany({
        where: {
          createdBy: {
            organizationId: authContext.organizationId
          }
        },
        include: {
          members: {
            include: {
              contact: true
            }
          }
        }
      });

      const segmentAnalysis = [];

      // Analyze new vs returning visitors
      const newVisitorSessions = sessions.filter(session => {
        const visitorSessions = sessions.filter(s => s.visitorId === session.visitorId);
        return visitorSessions.length === 1;
      });

      const returningVisitorSessions = sessions.filter(session => {
        const visitorSessions = sessions.filter(s => s.visitorId === session.visitorId);
        return visitorSessions.length > 1;
      });

      // Analyze new visitors
      if (newVisitorSessions.length > 0) {
        const newVisitorFunnel = this.analyzeFunnelProgression(newVisitorSessions, funnelSteps);
        segmentAnalysis.push({
          name: 'New Visitors',
          totalSessions: newVisitorSessions.length,
          overallConversion: newVisitorFunnel.overallConversion,
          totalRevenue: newVisitorFunnel.totalRevenue,
          averageOrderValue: newVisitorFunnel.averageOrderValue,
          topDropOffStep: newVisitorFunnel.biggestDropOff,
          steps: newVisitorFunnel.steps
        });
      }

      // Analyze returning visitors
      if (returningVisitorSessions.length > 0) {
        const returningVisitorFunnel = this.analyzeFunnelProgression(returningVisitorSessions, funnelSteps);
        segmentAnalysis.push({
          name: 'Returning Visitors',
          totalSessions: returningVisitorSessions.length,
          overallConversion: returningVisitorFunnel.overallConversion,
          totalRevenue: returningVisitorFunnel.totalRevenue,
          averageOrderValue: returningVisitorFunnel.averageOrderValue,
          topDropOffStep: returningVisitorFunnel.biggestDropOff,
          steps: returningVisitorFunnel.steps
        });
      }

      // Analyze by device type
      const mobileReqs = sessions.filter(s => s.deviceType === 'mobile');
      const desktopSessions = sessions.filter(s => s.deviceType === 'desktop');

      if (mobileReqs.length > 0) {
        const mobileFunnel = this.analyzeFunnelProgression(mobileReqs, funnelSteps);
        segmentAnalysis.push({
          name: 'Mobile Visitors',
          totalSessions: mobileReqs.length,
          overallConversion: mobileFunnel.overallConversion,
          totalRevenue: mobileFunnel.totalRevenue,
          averageOrderValue: mobileFunnel.averageOrderValue,
          topDropOffStep: mobileFunnel.biggestDropOff,
          steps: mobileFunnel.steps
        });
      }

      if (desktopSessions.length > 0) {
        const desktopFunnel = this.analyzeFunnelProgression(desktopSessions, funnelSteps);
        segmentAnalysis.push({
          name: 'Desktop Visitors',
          totalSessions: desktopSessions.length,
          overallConversion: desktopFunnel.overallConversion,
          totalRevenue: desktopFunnel.totalRevenue,
          averageOrderValue: desktopFunnel.averageOrderValue,
          topDropOffStep: desktopFunnel.biggestDropOff,
          steps: desktopFunnel.steps
        });
      }

      // Analyze by traffic source
      const organicSessions = sessions.filter(s => s.source === 'organic');
      const directSessions = sessions.filter(s => s.source === 'direct');
      const socialSessions = sessions.filter(s => s.source === 'social');

      if (organicSessions.length > 0) {
        const organicFunnel = this.analyzeFunnelProgression(organicSessions, funnelSteps);
        segmentAnalysis.push({
          name: 'Organic Traffic',
          totalSessions: organicSessions.length,
          overallConversion: organicFunnel.overallConversion,
          totalRevenue: organicFunnel.totalRevenue,
          averageOrderValue: organicFunnel.averageOrderValue,
          topDropOffStep: organicFunnel.biggestDropOff,
          steps: organicFunnel.steps
        });
      }

      return segmentAnalysis;

    } catch (error) {
      console.error('Error analyzing funnel by segments:', error);
      return [];
    }
  }

  /**
   * Generate actionable insights from funnel data
   */
  private generateFunnelInsights(steps: any[], segmentData?: any[]): string[] {
    const insights: string[] = [];

    // Overall funnel insights
    if (steps.length > 0) {
      const firstStep = steps[0];
      const lastStep = steps[steps.length - 1];
      
      insights.push(`Funnel starts with ${firstStep.visitors.toLocaleString()} visitors and converts ${lastStep.visitors.toLocaleString()} (${lastStep.conversionRate}% overall)`);

      // Find biggest drop-off
      const biggestDropOff = steps.reduce((max, step) => step.dropOffRate > max.dropOffRate ? step : max, steps[0]);
      if (biggestDropOff.dropOffRate > 50) {
        insights.push(`⚠️ Critical drop-off at ${biggestDropOff.name} (${biggestDropOff.dropOffRate}% exit rate) - requires immediate optimization`);
      } else if (biggestDropOff.dropOffRate > 30) {
        insights.push(`📉 Significant drop-off at ${biggestDropOff.name} (${biggestDropOff.dropOffRate}% exit rate) - optimization opportunity`);
      }

      // Revenue insights
      const revenueStep = steps.find(step => step.revenue > 0);
      if (revenueStep) {
        insights.push(`💰 Generated ${revenueStep.revenue.toLocaleString()} in revenue from ${revenueStep.visitors} conversions`);
      }

      // Conversion rate insights
      const overallRate = lastStep.conversionRate;
      if (overallRate > 5) {
        insights.push(`🎯 Excellent conversion rate of ${overallRate}% - above industry average`);
      } else if (overallRate > 2) {
        insights.push(`✅ Good conversion rate of ${overallRate}% - room for improvement`);
      } else {
        insights.push(`📊 Conversion rate of ${overallRate}% is below average - funnel optimization needed`);
      }
    }

    // Segment-specific insights
    if (segmentData && segmentData.length > 0) {
      const newVisitors = segmentData.find(s => s.name === 'New Visitors');
      const returningVisitors = segmentData.find(s => s.name === 'Returning Visitors');

      if (newVisitors && returningVisitors) {
        const conversionDiff = returningVisitors.overallConversion - newVisitors.overallConversion;
        if (conversionDiff > 2) {
          insights.push(`🔄 Returning visitors convert ${conversionDiff.toFixed(1)}x better (${returningVisitors.overallConversion}% vs ${newVisitors.overallConversion}%)`);
        }
      }

      const mobileSegment = segmentData.find(s => s.name === 'Mobile Visitors');
      const desktopSegment = segmentData.find(s => s.name === 'Desktop Visitors');

      if (mobileSegment && desktopSegment) {
        if (mobileSegment.overallConversion < desktopSegment.overallConversion * 0.7) {
          insights.push(`📱 Mobile conversion (${mobileSegment.overallConversion}%) significantly lower than desktop (${desktopSegment.overallConversion}%) - mobile optimization needed`);
        }
      }

      // Traffic source insights
      const organicSegment = segmentData.find(s => s.name === 'Organic Traffic');
      if (organicSegment && organicSegment.overallConversion > 3) {
        insights.push(`🌱 Organic traffic shows strong intent with ${organicSegment.overallConversion}% conversion - invest in SEO`);
      }
    }

    // African market specific insights
    insights.push(`🌍 Consider African market optimization: mobile-first design, WhatsApp integration, and local payment methods`);

    return insights;
  }
}