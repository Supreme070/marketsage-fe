/**
 * Workflow Template Marketplace Service
 * 
 * Provides functionality for:
 * - Browsing and discovering workflow templates
 * - Installing templates into user workflows
 * - Managing template collections and categories
 * - Template analytics and recommendations
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface WorkflowTemplateFilter {
  category?: string;
  complexity?: string;
  tags?: string[];
  industry?: string[];
  search?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  minRating?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'popular' | 'rating' | 'newest' | 'alphabetical';
}

export interface TemplateInstallOptions {
  templateId: string;
  userId: string;
  workflowName?: string;
  customizations?: Record<string, any>;
  installationType?: 'clone' | 'reference' | 'custom';
}

export interface TemplateCreateOptions {
  name: string;
  description: string;
  category: string;
  complexity: string;
  definition: any;
  tags?: string[];
  industry?: string[];
  useCase: string;
  features?: string[];
  requirements?: Record<string, any>;
  variables?: Record<string, any>;
  triggerTypes?: string[];
  authorName?: string;
  authorUrl?: string;
  isPremium?: boolean;
  price?: number;
  createdBy: string;
}

export class WorkflowTemplateMarketplace {
  /**
   * Get marketplace templates with filtering and sorting
   */
  async getTemplates(filters: WorkflowTemplateFilter = {}) {
    try {
      const {
        category,
        complexity,
        tags,
        industry,
        search,
        isFeatured,
        isPremium,
        minRating,
        limit = 20,
        offset = 0,
        sortBy = 'popular'
      } = filters;

      // Build where condition
      const whereCondition: any = {
        status: 'PUBLISHED'
      };

      if (category) {
        whereCondition.category = category;
      }

      if (complexity) {
        whereCondition.complexity = complexity;
      }

      if (tags && tags.length > 0) {
        whereCondition.tags = {
          hasSome: tags
        };
      }

      if (industry && industry.length > 0) {
        whereCondition.industry = {
          hasSome: industry
        };
      }

      if (search) {
        whereCondition.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { useCase: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ];
      }

      if (typeof isFeatured === 'boolean') {
        whereCondition.isFeatured = isFeatured;
      }

      if (typeof isPremium === 'boolean') {
        whereCondition.isPremium = isPremium;
      }

      if (minRating) {
        whereCondition.rating = { gte: minRating };
      }

      // Build sort condition
      let orderBy: any = {};
      switch (sortBy) {
        case 'popular':
          orderBy = [
            { usageCount: 'desc' },
            { downloadCount: 'desc' }
          ];
          break;
        case 'rating':
          orderBy = [
            { rating: 'desc' },
            { ratingCount: 'desc' }
          ];
          break;
        case 'newest':
          orderBy = { publishedAt: 'desc' };
          break;
        case 'alphabetical':
          orderBy = { name: 'asc' };
          break;
        default:
          orderBy = { usageCount: 'desc' };
      }

      const templates = await prisma.workflowTemplate.findMany({
        where: whereCondition,
        include: {
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              installations: true,
              reviews: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      });

      // Transform for response
      const transformedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        complexity: template.complexity,
        thumbnail: template.thumbnail,
        tags: template.tags,
        industry: template.industry,
        useCase: template.useCase,
        estimatedSetupTime: template.estimatedSetupTime,
        features: template.features,
        triggerTypes: template.triggerTypes,
        usageCount: template.usageCount,
        rating: template.rating || 0,
        ratingCount: template.ratingCount,
        downloadCount: template.downloadCount,
        isFeatured: template.isFeatured,
        isPremium: template.isPremium,
        price: template.price,
        authorName: template.authorName || template.creator.name,
        authorUrl: template.authorUrl,
        version: template.version,
        publishedAt: template.publishedAt,
        installationCount: template._count.installations,
        reviewCount: template._count.reviews,
        recentReviews: template.reviews.map(review => ({
          rating: review.rating,
          comment: review.comment,
          reviewer: review.reviewer.name,
          createdAt: review.createdAt
        }))
      }));

      return transformedTemplates;
    } catch (error) {
      logger.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template with full details
   */
  async getTemplate(templateId: string, userId?: string) {
    try {
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId },
        include: {
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: {
                select: {
                  name: true
                }
              }
            }
          },
          categories: true,
          _count: {
            select: {
              installations: true,
              reviews: true
            }
          }
        }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check if user has already installed this template
      let isInstalled = false;
      if (userId) {
        const installation = await prisma.workflowTemplateInstallation.findFirst({
          where: {
            templateId,
            userId,
            isActive: true
          }
        });
        isInstalled = !!installation;

        // Track template view
        await this.trackAnalytics(templateId, 'view', userId);
      }

      return {
        ...template,
        definition: JSON.parse(template.definition),
        requirements: template.requirements,
        variables: template.variables,
        installationCount: template._count.installations,
        reviewCount: template._count.reviews,
        isInstalled
      };
    } catch (error) {
      logger.error('Error getting template:', error);
      throw error;
    }
  }

  /**
   * Install a template into a new workflow
   */
  async installTemplate(options: TemplateInstallOptions) {
    try {
      const {
        templateId,
        userId,
        workflowName,
        customizations = {},
        installationType = 'clone'
      } = options;

      // Get the template
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Parse template definition
      const templateDefinition = JSON.parse(template.definition);

      // Apply customizations if provided
      let workflowDefinition = { ...templateDefinition };
      if (Object.keys(customizations).length > 0) {
        workflowDefinition = this.applyCustomizations(workflowDefinition, customizations);
      }

      // Create new workflow from template
      const workflowId = uuidv4();
      const workflow = await prisma.workflow.create({
        data: {
          id: workflowId,
          name: workflowName || `${template.name} - Copy`,
          description: `Created from template: ${template.name}`,
          status: 'INACTIVE', // User needs to activate manually
          definition: JSON.stringify(workflowDefinition),
          createdById: userId
        }
      });

      // Create installation record
      await prisma.workflowTemplateInstallation.create({
        data: {
          templateId,
          workflowId: workflow.id,
          userId,
          installationType,
          customizations: customizations,
          installedAt: new Date()
        }
      });

      // Update template usage count
      await prisma.workflowTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 }
        }
      });

      // Track installation analytics
      await this.trackAnalytics(templateId, 'install', userId, {
        workflowId: workflow.id,
        installationType
      });

      logger.info('Template installed successfully', {
        templateId,
        workflowId: workflow.id,
        userId
      });

      return {
        workflow,
        template: {
          id: template.id,
          name: template.name
        }
      };
    } catch (error) {
      logger.error('Error installing template:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow template
   */
  async createTemplate(options: TemplateCreateOptions) {
    try {
      const templateId = uuidv4();

      const template = await prisma.workflowTemplate.create({
        data: {
          id: templateId,
          name: options.name,
          description: options.description,
          category: options.category as any,
          complexity: options.complexity as any,
          definition: JSON.stringify(options.definition),
          tags: options.tags || [],
          industry: options.industry || [],
          useCase: options.useCase,
          features: options.features || [],
          requirements: options.requirements || {},
          variables: options.variables || {},
          triggerTypes: options.triggerTypes || [],
          authorName: options.authorName,
          authorUrl: options.authorUrl,
          isPremium: options.isPremium || false,
          price: options.price || 0,
          status: 'DRAFT', // Templates start as draft
          createdBy: options.createdBy
        }
      });

      logger.info('Template created successfully', {
        templateId: template.id,
        name: template.name,
        createdBy: options.createdBy
      });

      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Get featured template collections
   */
  async getFeaturedCollections() {
    try {
      const collections = await prisma.workflowTemplateCollection.findMany({
        where: {
          isPublic: true,
          isFeatured: true
        },
        include: {
          templates: {
            where: { status: 'PUBLISHED' },
            take: 4, // Preview templates
            select: {
              id: true,
              name: true,
              thumbnail: true,
              rating: true,
              usageCount: true
            }
          },
          creator: {
            select: {
              name: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      return collections;
    } catch (error) {
      logger.error('Error getting featured collections:', error);
      throw error;
    }
  }

  /**
   * Get template categories with counts
   */
  async getCategories() {
    try {
      const categories = await prisma.workflowTemplate.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: {
          category: true
        }
      });

      return categories.map(cat => ({
        category: cat.category,
        count: cat._count.category
      }));
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Add review for a template
   */
  async addReview(templateId: string, userId: string, rating: number, comment?: string) {
    try {
      // Check if user has already reviewed this template
      const existingReview = await prisma.workflowTemplateReview.findUnique({
        where: {
          templateId_userId: {
            templateId,
            userId
          }
        }
      });

      if (existingReview) {
        // Update existing review
        const review = await prisma.workflowTemplateReview.update({
          where: { id: existingReview.id },
          data: {
            rating,
            comment,
            updatedAt: new Date()
          }
        });

        await this.updateTemplateRating(templateId);
        return review;
      } else {
        // Create new review
        const review = await prisma.workflowTemplateReview.create({
          data: {
            templateId,
            userId,
            rating,
            comment
          }
        });

        await this.updateTemplateRating(templateId);
        
        // Track review analytics
        await this.trackAnalytics(templateId, 'rate', userId, { rating });

        return review;
      }
    } catch (error) {
      logger.error('Error adding review:', error);
      throw error;
    }
  }

  /**
   * Get recommended templates for a user
   */
  async getRecommendations(userId: string, limit: number = 6) {
    try {
      // Get user's installed templates to understand preferences
      const userInstallations = await prisma.workflowTemplateInstallation.findMany({
        where: { userId },
        include: {
          template: {
            select: {
              category: true,
              tags: true,
              industry: true
            }
          }
        }
      });

      // Extract user preferences
      const preferredCategories = [...new Set(userInstallations.map(i => i.template.category))];
      const preferredTags = [...new Set(userInstallations.flatMap(i => i.template.tags))];
      const preferredIndustries = [...new Set(userInstallations.flatMap(i => i.template.industry))];

      // Get installed template IDs to exclude
      const installedTemplateIds = userInstallations.map(i => i.templateId);

      // Build recommendation query
      const recommendations = await prisma.workflowTemplate.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: installedTemplateIds },
          OR: [
            { category: { in: preferredCategories } },
            { tags: { hasSome: preferredTags } },
            { industry: { hasSome: preferredIndustries } },
            { isFeatured: true },
            { rating: { gte: 4.0 } }
          ]
        },
        include: {
          creator: {
            select: { name: true }
          },
          _count: {
            select: { installations: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { usageCount: 'desc' }
        ],
        take: limit
      });

      return recommendations.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail: template.thumbnail,
        rating: template.rating,
        usageCount: template.usageCount,
        authorName: template.authorName || template.creator.name,
        installationCount: template._count.installations
      }));
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Private helper methods

  private applyCustomizations(definition: any, customizations: Record<string, any>) {
    // Deep clone the definition
    const customized = JSON.parse(JSON.stringify(definition));

    // Apply variable substitutions
    if (customizations.variables) {
      Object.keys(customizations.variables).forEach(key => {
        const value = customizations.variables[key];
        this.replaceTemplateVariables(customized, `{{${key}}}`, value);
      });
    }

    // Apply node customizations
    if (customizations.nodes) {
      customized.nodes?.forEach((node: any) => {
        if (customizations.nodes[node.id]) {
          Object.assign(node.data.properties, customizations.nodes[node.id]);
        }
      });
    }

    return customized;
  }

  private replaceTemplateVariables(obj: any, placeholder: string, value: any) {
    if (typeof obj === 'string') {
      return obj.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceTemplateVariables(item, placeholder, value));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      Object.keys(obj).forEach(key => {
        result[key] = this.replaceTemplateVariables(obj[key], placeholder, value);
      });
      return result;
    }
    
    return obj;
  }

  private async updateTemplateRating(templateId: string) {
    try {
      const reviews = await prisma.workflowTemplateReview.findMany({
        where: { templateId },
        select: { rating: true }
      });

      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        await prisma.workflowTemplate.update({
          where: { id: templateId },
          data: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            ratingCount: reviews.length
          }
        });
      }
    } catch (error) {
      logger.error('Error updating template rating:', error);
    }
  }

  private async trackAnalytics(templateId: string, eventType: string, userId?: string, metadata?: any) {
    try {
      await prisma.workflowTemplateAnalytics.create({
        data: {
          templateId,
          eventType,
          userId,
          metadata: metadata || {},
          timestamp: new Date()
        }
      });
    } catch (error) {
      // Don't fail the main operation if analytics tracking fails
      logger.warn('Error tracking template analytics:', error);
    }
  }
}

// Export singleton instance
export const workflowTemplateMarketplace = new WorkflowTemplateMarketplace();