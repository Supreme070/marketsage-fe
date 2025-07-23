/**
 * Customer Data MCP Server for MarketSage
 * 
 * This server provides read-only access to customer data, contact information,
 * and customer segments through the MCP protocol.
 */

import { z } from 'zod';
import { BaseMCPServer } from './base-mcp-server';
import { 
  type MCPAuthContext, 
  type MCPServerConfig,
  CustomerQuerySchema,
  type CustomerQuery,
  type CustomerProfile,
  MCPAuthorizationError,
  MCPValidationError
} from '../types/mcp-types';

import { prisma } from '../../lib/db/prisma';
import { defaultMCPConfig } from '../config/mcp-config';

export class CustomerDataMCPServer extends BaseMCPServer {
  constructor(config?: Partial<MCPServerConfig>) {
    super({
      ...defaultMCPConfig.servers.customer,
      ...config
    });
  }

  /**
   * List available customer data resources
   */
  protected async listResources(authContext: MCPAuthContext): Promise<any[]> {
    const resources = [
      {
        uri: "customer://profiles",
        name: "Customer Profiles",
        description: "Access to customer profile information",
        mimeType: "application/json"
      },
      {
        uri: "customer://segments",
        name: "Customer Segments",
        description: "Access to customer segmentation data",
        mimeType: "application/json"
      },
      {
        uri: "customer://predictions",
        name: "Customer Predictions",
        description: "Access to customer predictive analytics",
        mimeType: "application/json"
      }
    ];

    // Filter resources based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('read:org')) {
      // Users can only access their own organization's resources
      return resources.filter(r => r.uri.includes('profiles'));
    }

    return resources;
  }

  /**
   * Read customer data resource
   */
  protected async readResource(uri: string, authContext: MCPAuthContext): Promise<any> {
    const url = new URL(uri);
    const path = url.pathname;
    const searchParams = url.searchParams;

    // Parse query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = CustomerQuerySchema.parse({
      ...queryParams,
      organizationId: authContext.organizationId, // Always use user's org
      limit: queryParams.limit ? Number.parseInt(queryParams.limit) : 10,
      offset: queryParams.offset ? Number.parseInt(queryParams.offset) : 0,
      includeSegments: queryParams.includeSegments === 'true',
      includePredictions: queryParams.includePredictions === 'true'
    });

    switch (path) {
      case '/profiles':
        return await this.getCustomerProfiles(validatedQuery, authContext);
      case '/segments':
        return await this.getCustomerSegments(validatedQuery, authContext);
      case '/predictions':
        return await this.getCustomerPredictions(validatedQuery, authContext);
      default:
        throw new MCPValidationError(`Unknown resource path: ${path}`);
    }
  }

  /**
   * List available customer data tools
   */
  protected async listTools(authContext: MCPAuthContext): Promise<any[]> {
    const tools = [
      {
        name: "search_customers",
        description: "Search for customers by email, phone, or other criteria",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (email, phone, name)"
            },
            limit: {
              type: "number",
              description: "Maximum number of results (1-100)",
              minimum: 1,
              maximum: 100,
              default: 10
            },
            includeSegments: {
              type: "boolean",
              description: "Include customer segments in results",
              default: false
            },
            includePredictions: {
              type: "boolean",
              description: "Include predictive analytics in results",
              default: false
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_customer_profile",
        description: "Get detailed profile information for a specific customer",
        inputSchema: {
          type: "object",
          properties: {
            customerId: {
              type: "string",
              description: "Customer ID"
            },
            includeSegments: {
              type: "boolean",
              description: "Include customer segments",
              default: true
            },
            includePredictions: {
              type: "boolean",
              description: "Include predictive analytics",
              default: true
            }
          },
          required: ["customerId"]
        }
      },
      {
        name: "get_customer_segments",
        description: "Get all customer segments for the organization",
        inputSchema: {
          type: "object",
          properties: {
            includeStats: {
              type: "boolean",
              description: "Include segment statistics",
              default: true
            }
          }
        }
      }
    ];

    // Filter tools based on permissions
    if (!authContext.permissions.includes('*') && !authContext.permissions.includes('read:org')) {
      // Regular users get limited tools
      return tools.filter(t => ['search_customers', 'get_customer_profile'].includes(t.name));
    }

    return tools;
  }

  /**
   * Execute customer data tools
   */
  protected async callTool(name: string, args: any, authContext: MCPAuthContext): Promise<any> {
    switch (name) {
      case 'search_customers':
        return await this.searchCustomers(args, authContext);
      case 'get_customer_profile':
        return await this.getCustomerProfile(args, authContext);
      case 'get_customer_segments':
        return await this.getCustomerSegments(args, authContext);
      default:
        throw new MCPValidationError(`Unknown tool: ${name}`);
    }
  }

  /**
   * Get customer profiles
   */
  private async getCustomerProfiles(query: CustomerQuery, authContext: MCPAuthContext): Promise<any> {
    try {
      const customers = await prisma.contact.findMany({
        where: {
          organizationId: authContext.organizationId,
          ...(query.email && { email: { contains: query.email } }),
          ...(query.phone && { phone: { contains: query.phone } }),
          ...(query.id && { id: query.id })
        },
        take: query.limit,
        skip: query.offset,
        include: {
          segments: query.includeSegments,
          predictions: query.includePredictions
        }
      });

      const profiles: CustomerProfile[] = customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        organizationId: customer.organizationId,
        segments: query.includeSegments ? customer.segments?.map(s => s.name) : undefined,
        predictions: query.includePredictions ? {
          churnRisk: customer.predictions?.churnRisk || 0,
          lifetimeValue: customer.predictions?.lifetimeValue || 0,
          engagementScore: customer.predictions?.engagementScore || 0
        } : undefined,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      }));

      return {
        uri: "customer://profiles",
        mimeType: "application/json",
        text: JSON.stringify({
          profiles,
          meta: {
            total: profiles.length,
            offset: query.offset,
            limit: query.limit
          }
        })
      };
    } catch (error) {
      // Fallback to direct database access
      return await this.createFallbackResponse(
        () => this.getCustomerProfilesFallback(query, authContext),
        'Failed to retrieve customer profiles via MCP'
      );
    }
  }

  /**
   * Search customers tool
   */
  private async searchCustomers(args: any, authContext: MCPAuthContext): Promise<any> {
    const { query, limit = 10, includeSegments = false, includePredictions = false } = args;
    const startTime = Date.now();

    try {
      // Log tool execution start
      await this.logMCPToolExecution(
        authContext,
        'search_customers',
        args,
        'success',
        { duration: 0, riskLevel: 'low' }
      );
      const customers = await prisma.contact.findMany({
        where: {
          organizationId: authContext.organizationId,
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        include: {
          segments: includeSegments,
          predictions: includePredictions
        }
      });

      const results = customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        segments: includeSegments ? customer.segments?.map(s => s.name) : undefined,
        predictions: includePredictions ? {
          churnRisk: customer.predictions?.churnRisk || 0,
          lifetimeValue: customer.predictions?.lifetimeValue || 0,
          engagementScore: customer.predictions?.engagementScore || 0
        } : undefined
      }));

      const duration = Date.now() - startTime;

      // Log successful tool execution
      await this.logMCPToolExecution(
        authContext,
        'search_customers',
        args,
        'success',
        { 
          duration,
          outputSize: results.length,
          riskLevel: includeSegments || includePredictions ? 'medium' : 'low'
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            results,
            meta: {
              query,
              total: results.length,
              hasMore: results.length === limit,
              duration
            }
          })
        }]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log failed tool execution
      await this.logMCPToolExecution(
        authContext,
        'search_customers',
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
            error: "Failed to search customers",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Get customer profile tool
   */
  private async getCustomerProfile(args: any, authContext: MCPAuthContext): Promise<any> {
    const { customerId, includeSegments = true, includePredictions = true } = args;

    try {
      const customer = await prisma.contact.findFirst({
        where: {
          id: customerId,
          organizationId: authContext.organizationId
        },
        include: {
          segments: includeSegments,
          predictions: includePredictions
        }
      });

      if (!customer) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: "Customer not found",
              customerId
            })
          }],
          isError: true
        };
      }

      const profile = {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        segments: includeSegments ? customer.segments?.map(s => s.name) : undefined,
        predictions: includePredictions ? {
          churnRisk: customer.predictions?.churnRisk || 0,
          lifetimeValue: customer.predictions?.lifetimeValue || 0,
          engagementScore: customer.predictions?.engagementScore || 0
        } : undefined,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(profile)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to retrieve customer profile",
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  }

  /**
   * Fallback method for customer profiles
   */
  private async getCustomerProfilesFallback(query: CustomerQuery, authContext: MCPAuthContext): Promise<any> {
    // Direct database access as fallback
    const customers = await prisma.contact.findMany({
      where: {
        organizationId: authContext.organizationId,
        ...(query.email && { email: { contains: query.email } }),
        ...(query.phone && { phone: { contains: query.phone } }),
        ...(query.id && { id: query.id })
      },
      take: query.limit,
      skip: query.offset
    });

    return {
      profiles: customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        organizationId: customer.organizationId,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      })),
      meta: {
        total: customers.length,
        offset: query.offset,
        limit: query.limit,
        fallbackUsed: true
      }
    };
  }

  /**
   * Get customer segments with real data
   */
  private async getCustomerSegments(query: any, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Get segments with member counts and statistics
      const segments = await prisma.segment.findMany({
        where: {
          createdBy: {
            organizationId: authContext.organizationId
          }
        },
        include: {
          members: {
            include: {
              contact: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  lastEngaged: true,
                  createdAt: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              emailCampaigns: true,
              smsCampaigns: true,
              waCampaigns: true
            }
          }
        }
      });

      // Calculate segment statistics
      const segmentStats = segments.map(segment => {
        const memberData = segment.members.map(m => m.contact);
        const totalMembers = memberData.length;
        
        // Calculate engagement statistics
        const now = new Date();
        const recentlyEngaged = memberData.filter(contact => {
          if (!contact.lastEngaged) return false;
          const daysSinceEngagement = (now.getTime() - contact.lastEngaged.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceEngagement <= 30;
        }).length;

        const newMembers = memberData.filter(contact => {
          const daysSinceCreated = (now.getTime() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreated <= 30;
        }).length;

        return {
          id: segment.id,
          name: segment.name,
          description: segment.description,
          rules: JSON.parse(segment.rules || '{}'),
          statistics: {
            totalMembers,
            recentlyEngaged,
            newMembers,
            engagementRate: totalMembers > 0 ? (recentlyEngaged / totalMembers) * 100 : 0,
            growthRate: totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0,
            campaignUsage: {
              emailCampaigns: segment._count.emailCampaigns,
              smsCampaigns: segment._count.smsCampaigns,
              whatsappCampaigns: segment._count.waCampaigns
            }
          },
          createdAt: segment.createdAt.toISOString(),
          updatedAt: segment.updatedAt.toISOString(),
          ...(query.includeMembers && {
            members: memberData.slice(0, 50).map(contact => ({
              id: contact.id,
              email: contact.email,
              firstName: contact.firstName,
              lastName: contact.lastName,
              lastEngaged: contact.lastEngaged?.toISOString()
            }))
          })
        };
      });

      const duration = Date.now() - startTime;

      // Log the resource access
      await this.logMCPResourceAccess(
        authContext,
        'customer://segments',
        'LIST',
        'success',
        { duration, dataSize: segmentStats.length }
      );

      return {
        uri: "customer://segments",
        mimeType: "application/json",
        text: JSON.stringify({
          segments: segmentStats,
          meta: {
            total: segmentStats.length,
            organizationId: authContext.organizationId,
            timestamp: new Date().toISOString(),
            duration
          }
        })
      };
    } catch (error) {
      // Log failed access
      await this.logMCPResourceAccess(
        authContext,
        'customer://segments',
        'LIST',
        'failure',
        { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
      );

      return {
        uri: "customer://segments",
        mimeType: "application/json",
        text: JSON.stringify({
          error: "Failed to retrieve customer segments",
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }

  /**
   * Get customer predictions with real MCP seeded data
   */
  private async getCustomerPredictions(query: CustomerQuery, authContext: MCPAuthContext): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Build where clause
      const whereClause: any = {
        organizationId: authContext.organizationId
      };

      if (query.id) {
        whereClause.contactId = query.id;
      }

      // Get predictions from MCP table
      const predictions = await prisma.mCPCustomerPredictions.findMany({
        where: whereClause,
        take: query.limit,
        skip: query.offset,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              company: true,
              lastEngaged: true,
              createdAt: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });

      // Transform predictions data
      const predictionData = predictions.map(pred => ({
        id: pred.id,
        contactId: pred.contactId,
        customer: pred.contact ? {
          id: pred.contact.id,
          email: pred.contact.email,
          firstName: pred.contact.firstName,
          lastName: pred.contact.lastName,
          phone: pred.contact.phone,
          company: pred.contact.company,
          lastEngaged: pred.contact.lastEngaged?.toISOString(),
          createdAt: pred.contact.createdAt.toISOString()
        } : null,
        predictions: {
          churnRisk: pred.churnRisk,
          lifetimeValue: pred.lifetimeValue,
          engagementScore: pred.engagementScore,
          segment: pred.segment,
          confidenceScore: pred.confidenceScore
        },
        insights: {
          lastActivityDate: pred.lastActivityDate.toISOString(),
          nextBestAction: pred.nextBestAction,
          preferredChannel: pred.preferredChannel,
          behavioralScores: pred.behavioralScores,
          actionableInsights: pred.insights
        },
        calculatedAt: pred.calculatedAt.toISOString()
      }));

      // Calculate summary statistics
      const totalPredictions = predictionData.length;
      const avgChurnRisk = totalPredictions > 0 
        ? predictionData.reduce((sum, p) => sum + p.predictions.churnRisk, 0) / totalPredictions 
        : 0;
      const avgLifetimeValue = totalPredictions > 0 
        ? predictionData.reduce((sum, p) => sum + p.predictions.lifetimeValue, 0) / totalPredictions 
        : 0;
      const avgEngagementScore = totalPredictions > 0 
        ? predictionData.reduce((sum, p) => sum + p.predictions.engagementScore, 0) / totalPredictions 
        : 0;

      // Risk distribution
      const highRisk = predictionData.filter(p => p.predictions.churnRisk > 70).length;
      const mediumRisk = predictionData.filter(p => p.predictions.churnRisk > 30 && p.predictions.churnRisk <= 70).length;
      const lowRisk = predictionData.filter(p => p.predictions.churnRisk <= 30).length;

      // Segment distribution
      const segmentDistribution = predictionData.reduce((acc: Record<string, number>, p) => {
        acc[p.predictions.segment] = (acc[p.predictions.segment] || 0) + 1;
        return acc;
      }, {});

      // Channel preferences
      const channelPreferences = predictionData.reduce((acc: Record<string, number>, p) => {
        acc[p.insights.preferredChannel] = (acc[p.insights.preferredChannel] || 0) + 1;
        return acc;
      }, {});

      const duration = Date.now() - startTime;

      // Log the resource access
      await this.logMCPResourceAccess(
        authContext,
        'customer://predictions',
        'READ',
        'success',
        { 
          duration, 
          dataSize: predictionData.length,
          riskLevel: totalPredictions > 50 ? 'medium' : 'low' 
        }
      );

      return {
        uri: "customer://predictions",
        mimeType: "application/json",
        text: JSON.stringify({
          predictions: predictionData,
          summary: {
            totalPredictions,
            averages: {
              churnRisk: Math.round(avgChurnRisk * 100) / 100,
              lifetimeValue: Math.round(avgLifetimeValue * 100) / 100,
              engagementScore: Math.round(avgEngagementScore * 100) / 100
            },
            riskDistribution: {
              highRisk: { count: highRisk, percentage: totalPredictions > 0 ? (highRisk / totalPredictions) * 100 : 0 },
              mediumRisk: { count: mediumRisk, percentage: totalPredictions > 0 ? (mediumRisk / totalPredictions) * 100 : 0 },
              lowRisk: { count: lowRisk, percentage: totalPredictions > 0 ? (lowRisk / totalPredictions) * 100 : 0 }
            },
            segmentDistribution,
            channelPreferences
          },
          meta: {
            query: {
              limit: query.limit,
              offset: query.offset,
              organizationId: authContext.organizationId
            },
            timestamp: new Date().toISOString(),
            duration,
            source: 'MCP_CUSTOMER_PREDICTIONS'
          }
        })
      };
    } catch (error) {
      // Log failed access
      await this.logMCPResourceAccess(
        authContext,
        'customer://predictions',
        'READ',
        'failure',
        { 
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          riskLevel: 'high' // Data access failures are high risk
        }
      );

      // Fallback to basic response
      return {
        uri: "customer://predictions",
        mimeType: "application/json",
        text: JSON.stringify({
          error: "Failed to retrieve customer predictions",
          details: error instanceof Error ? error.message : 'Unknown error',
          fallback: {
            message: "Predictions temporarily unavailable",
            timestamp: new Date().toISOString()
          }
        })
      };
    }
  }
}