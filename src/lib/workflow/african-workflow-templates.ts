/**
 * African Market-Specific Workflow Templates
 * =========================================
 * Pre-built workflow templates optimized for African markets
 * 
 * Features:
 * 🌍 Cultural timing and engagement optimization
 * 📱 Mobile-first design for 90%+ mobile users
 * 💬 Multi-language support (English, Swahili, Hausa, Amharic, Zulu)
 * 🕌 Religious and cultural event awareness
 * 💰 Local payment method integration
 * 📞 SMS-heavy communication patterns
 * ⚡ Low-bandwidth optimizations
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { workflowEngine } from '@/lib/workflow/execution-engine';

export interface AfricanWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  target_countries: string[];
  primary_language: string;
  supported_languages: string[];
  cultural_considerations: string[];
  optimal_timing: {
    business_hours: { start: number; end: number };
    best_days: string[];
    avoid_periods: string[];
  };
  communication_preferences: {
    primary_channel: 'sms' | 'whatsapp' | 'email';
    secondary_channels: string[];
    mobile_optimization: boolean;
  };
  workflow_structure: WorkflowNode[];
  success_metrics: {
    expected_open_rate: number;
    expected_click_rate: number;
    expected_conversion_rate: number;
  };
  african_optimizations: AfricanOptimization[];
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'delay' | 'condition' | 'action' | 'split';
  name: string;
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

export interface AfricanOptimization {
  type: 'timing' | 'content' | 'channel' | 'cultural' | 'payment' | 'language';
  description: string;
  implementation: any;
  expected_improvement: number;
}

// Pre-defined African workflow templates
export const AFRICAN_WORKFLOW_TEMPLATES: AfricanWorkflowTemplate[] = [
  {
    id: 'nigeria-welcome-series',
    name: 'Nigerian Customer Welcome Series',
    description: 'Mobile-optimized welcome sequence for Nigerian customers with cultural timing',
    target_countries: ['NG'],
    primary_language: 'en',
    supported_languages: ['en', 'ha', 'ig', 'yo'],
    cultural_considerations: [
      'ramadan_awareness',
      'business_hours_respect',
      'mobile_first_design',
      'sms_preference',
      'respect_for_elders'
    ],
    optimal_timing: {
      business_hours: { start: 9, end: 17 },
      best_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
      avoid_periods: ['ramadan_fasting_hours', 'friday_prayers', 'sunday_church']
    },
    communication_preferences: {
      primary_channel: 'sms',
      secondary_channels: ['whatsapp', 'email'],
      mobile_optimization: true
    },
    workflow_structure: [
      {
        id: 'trigger-signup',
        type: 'trigger',
        name: 'Customer Signup',
        config: {
          event: 'customer_registered',
          filters: { country: 'NG' }
        },
        position: { x: 100, y: 100 },
        connections: ['delay-welcome']
      },
      {
        id: 'delay-welcome',
        type: 'delay',
        name: 'Welcome Delay',
        config: {
          duration: 30,
          unit: 'minutes',
          business_hours_only: true,
          timezone: 'Africa/Lagos'
        },
        position: { x: 100, y: 200 },
        connections: ['action-welcome-sms']
      },
      {
        id: 'action-welcome-sms',
        type: 'action',
        name: 'Welcome SMS (Hausa/English)',
        config: {
          type: 'send_sms',
          template: 'nigeria_welcome',
          personalization: true,
          language_detection: true
        },
        position: { x: 100, y: 300 },
        connections: ['delay-onboarding']
      },
      {
        id: 'delay-onboarding',
        type: 'delay',
        name: 'Onboarding Delay',
        config: {
          duration: 2,
          unit: 'days',
          business_hours_only: true,
          avoid_ramadan_fasting: true
        },
        position: { x: 100, y: 400 },
        connections: ['condition-engagement']
      },
      {
        id: 'condition-engagement',
        type: 'condition',
        name: 'Check Engagement',
        config: {
          condition: 'sms_engagement_score > 0.3',
          african_market_scoring: true
        },
        position: { x: 100, y: 500 },
        connections: ['action-onboarding-whatsapp', 'action-re-engagement']
      },
      {
        id: 'action-onboarding-whatsapp',
        type: 'action',
        name: 'Onboarding Guide (WhatsApp)',
        config: {
          type: 'send_whatsapp',
          template: 'nigeria_onboarding',
          include_local_support: true
        },
        position: { x: 50, y: 600 },
        connections: ['delay-product-intro']
      },
      {
        id: 'action-re-engagement',
        type: 'action',
        name: 'Re-engagement SMS',
        config: {
          type: 'send_sms',
          template: 'nigeria_re_engagement',
          incentive_included: true
        },
        position: { x: 150, y: 600 },
        connections: ['delay-product-intro']
      }
    ],
    success_metrics: {
      expected_open_rate: 0.92,
      expected_click_rate: 0.34,
      expected_conversion_rate: 0.18
    },
    african_optimizations: [
      {
        type: 'timing',
        description: 'Avoid sending during Ramadan fasting hours (5 AM - 7 PM)',
        implementation: { ramadan_fasting_avoidance: true },
        expected_improvement: 0.25
      },
      {
        type: 'channel',
        description: 'Prioritize SMS over email (90% mobile usage)',
        implementation: { channel_priority: ['sms', 'whatsapp', 'email'] },
        expected_improvement: 0.40
      },
      {
        type: 'cultural',
        description: 'Include local greetings and cultural references',
        implementation: { cultural_personalization: true },
        expected_improvement: 0.15
      }
    ]
  },

  {
    id: 'kenya-mobile-money-onboarding',
    name: 'Kenyan Mobile Money Integration Workflow',
    description: 'M-Pesa integrated customer onboarding with Swahili support',
    target_countries: ['KE'],
    primary_language: 'sw',
    supported_languages: ['sw', 'en'],
    cultural_considerations: [
      'mpesa_integration',
      'swahili_language_priority',
      'mobile_first',
      'community_oriented_messaging'
    ],
    optimal_timing: {
      business_hours: { start: 8, end: 17 },
      best_days: ['tuesday', 'wednesday', 'thursday'],
      avoid_periods: ['harambee_meetings', 'weekend_rural_travel']
    },
    communication_preferences: {
      primary_channel: 'sms',
      secondary_channels: ['whatsapp', 'email'],
      mobile_optimization: true
    },
    workflow_structure: [
      {
        id: 'trigger-signup-ke',
        type: 'trigger',
        name: 'Kenyan Customer Signup',
        config: {
          event: 'customer_registered',
          filters: { country: 'KE' }
        },
        position: { x: 100, y: 100 },
        connections: ['action-swahili-welcome']
      },
      {
        id: 'action-swahili-welcome',
        type: 'action',
        name: 'Karibu SMS (Swahili)',
        config: {
          type: 'send_sms',
          template: 'kenya_karibu_welcome',
          language: 'sw',
          cultural_greeting: true
        },
        position: { x: 100, y: 200 },
        connections: ['delay-mpesa-setup']
      },
      {
        id: 'delay-mpesa-setup',
        type: 'delay',
        name: 'M-Pesa Setup Delay',
        config: {
          duration: 1,
          unit: 'hours',
          business_hours_only: true
        },
        position: { x: 100, y: 300 },
        connections: ['action-mpesa-integration']
      },
      {
        id: 'action-mpesa-integration',
        type: 'action',
        name: 'M-Pesa Integration Guide',
        config: {
          type: 'send_whatsapp',
          template: 'kenya_mpesa_guide',
          include_video_tutorial: true,
          low_bandwidth_friendly: true
        },
        position: { x: 100, y: 400 },
        connections: ['condition-mpesa-connected']
      },
      {
        id: 'condition-mpesa-connected',
        type: 'condition',
        name: 'M-Pesa Connected?',
        config: {
          condition: 'payment_method_connected = true',
          payment_provider: 'mpesa'
        },
        position: { x: 100, y: 500 },
        connections: ['action-success-celebration', 'action-mpesa-support']
      }
    ],
    success_metrics: {
      expected_open_rate: 0.94,
      expected_click_rate: 0.38,
      expected_conversion_rate: 0.22
    },
    african_optimizations: [
      {
        type: 'payment',
        description: 'Native M-Pesa integration with Swahili instructions',
        implementation: { mpesa_native_flow: true },
        expected_improvement: 0.45
      },
      {
        type: 'language',
        description: 'Primary Swahili communication with English fallback',
        implementation: { language_priority: ['sw', 'en'] },
        expected_improvement: 0.30
      }
    ]
  },

  {
    id: 'south-africa-multilingual-engagement',
    name: 'South African Multi-Language Engagement',
    description: 'Multi-language customer engagement for South African diversity',
    target_countries: ['ZA'],
    primary_language: 'en',
    supported_languages: ['en', 'af', 'zu', 'xh'],
    cultural_considerations: [
      'multilingual_country',
      'load_shedding_awareness',
      'diverse_economic_segments',
      'rugby_cricket_culture'
    ],
    optimal_timing: {
      business_hours: { start: 8, end: 17 },
      best_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
      avoid_periods: ['load_shedding_schedule', 'rugby_match_days']
    },
    communication_preferences: {
      primary_channel: 'email',
      secondary_channels: ['whatsapp', 'sms'],
      mobile_optimization: true
    },
    workflow_structure: [
      {
        id: 'trigger-signup-za',
        type: 'trigger',
        name: 'South African Signup',
        config: {
          event: 'customer_registered',
          filters: { country: 'ZA' }
        },
        position: { x: 100, y: 100 },
        connections: ['action-language-detection']
      },
      {
        id: 'action-language-detection',
        type: 'action',
        name: 'Language Preference Detection',
        config: {
          type: 'detect_language',
          supported_languages: ['en', 'af', 'zu', 'xh'],
          fallback_language: 'en'
        },
        position: { x: 100, y: 200 },
        connections: ['split-language-path']
      },
      {
        id: 'split-language-path',
        type: 'split',
        name: 'Language-Based Split',
        config: {
          split_criteria: 'preferred_language',
          paths: {
            'en': 'action-english-welcome',
            'af': 'action-afrikaans-welcome',
            'zu': 'action-zulu-welcome',
            'xh': 'action-xhosa-welcome'
          }
        },
        position: { x: 100, y: 300 },
        connections: ['action-english-welcome', 'action-afrikaans-welcome', 'action-zulu-welcome', 'action-xhosa-welcome']
      }
    ],
    success_metrics: {
      expected_open_rate: 0.88,
      expected_click_rate: 0.31,
      expected_conversion_rate: 0.16
    },
    african_optimizations: [
      {
        type: 'language',
        description: 'Native language detection and content adaptation',
        implementation: { multilingual_ai: true },
        expected_improvement: 0.35
      },
      {
        type: 'cultural',
        description: 'Load shedding aware scheduling and offline content',
        implementation: { load_shedding_optimization: true },
        expected_improvement: 0.20
      }
    ]
  },

  {
    id: 'west-africa-ramadan-campaign',
    name: 'West African Ramadan-Aware Campaign',
    description: 'Culturally sensitive campaign for Ramadan period across West Africa',
    target_countries: ['NG', 'GH', 'SN', 'ML'],
    primary_language: 'en',
    supported_languages: ['en', 'ha', 'fr', 'wo'],
    cultural_considerations: [
      'ramadan_timing_critical',
      'iftar_promotion_opportunity',
      'prayer_time_avoidance',
      'community_breaking_fast'
    ],
    optimal_timing: {
      business_hours: { start: 20, end: 4 }, // Post-Iftar timing
      best_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      avoid_periods: ['fajr_prayer', 'maghrib_prayer', 'fasting_hours']
    },
    communication_preferences: {
      primary_channel: 'whatsapp',
      secondary_channels: ['sms', 'email'],
      mobile_optimization: true
    },
    workflow_structure: [
      {
        id: 'trigger-ramadan-start',
        type: 'trigger',
        name: 'Ramadan Period Detection',
        config: {
          event: 'ramadan_calendar_start',
          target_countries: ['NG', 'GH', 'SN', 'ML']
        },
        position: { x: 100, y: 100 },
        connections: ['action-ramadan-greeting']
      },
      {
        id: 'action-ramadan-greeting',
        type: 'action',
        name: 'Ramadan Mubarak Message',
        config: {
          type: 'send_whatsapp',
          template: 'ramadan_mubarak_greeting',
          timing: 'post_iftar',
          cultural_sensitivity: 'high'
        },
        position: { x: 100, y: 200 },
        connections: ['delay-iftar-offers']
      },
      {
        id: 'delay-iftar-offers',
        type: 'delay',
        name: 'Wait for Iftar Timing',
        config: {
          duration: 'until_iftar',
          timezone_aware: true,
          prayer_time_integration: true
        },
        position: { x: 100, y: 300 },
        connections: ['action-iftar-special-offers']
      },
      {
        id: 'action-iftar-special-offers',
        type: 'action',
        name: 'Iftar Special Offers',
        config: {
          type: 'send_sms',
          template: 'iftar_special_offers',
          timing: 'post_maghrib',
          offer_type: 'ramadan_special'
        },
        position: { x: 100, y: 400 },
        connections: ['condition-engagement-ramadan']
      }
    ],
    success_metrics: {
      expected_open_rate: 0.96,
      expected_click_rate: 0.42,
      expected_conversion_rate: 0.28
    },
    african_optimizations: [
      {
        type: 'timing',
        description: 'Prayer time and fasting hour awareness',
        implementation: { islamic_calendar_integration: true },
        expected_improvement: 0.50
      },
      {
        type: 'cultural',
        description: 'Ramadan-specific messaging and offers',
        implementation: { ramadan_content_library: true },
        expected_improvement: 0.35
      }
    ]
  },

  {
    id: 'east-africa-agricultural-cycle',
    name: 'East African Agricultural Cycle Workflow',
    description: 'Seasonal agricultural campaign for farming communities',
    target_countries: ['KE', 'UG', 'TZ', 'ET'],
    primary_language: 'sw',
    supported_languages: ['sw', 'en', 'am'],
    cultural_considerations: [
      'seasonal_farming_cycles',
      'harvest_celebration_timing',
      'rural_connectivity_challenges',
      'community_decision_making'
    ],
    optimal_timing: {
      business_hours: { start: 6, end: 18 }, // Farmer hours
      best_days: ['saturday', 'sunday'], // Market days
      avoid_periods: ['planting_season_busy', 'harvest_season_busy']
    },
    communication_preferences: {
      primary_channel: 'sms',
      secondary_channels: ['whatsapp'],
      mobile_optimization: true
    },
    workflow_structure: [
      {
        id: 'trigger-season-start',
        type: 'trigger',
        name: 'Agricultural Season Start',
        config: {
          event: 'seasonal_calendar_trigger',
          season_type: 'planting_season'
        },
        position: { x: 100, y: 100 },
        connections: ['action-seasonal-advice']
      },
      {
        id: 'action-seasonal-advice',
        type: 'action',
        name: 'Seasonal Farming Advice',
        config: {
          type: 'send_sms',
          template: 'agricultural_advice',
          language: 'sw',
          local_expertise: true
        },
        position: { x: 100, y: 200 },
        connections: ['delay-product-timing']
      },
      {
        id: 'delay-product-timing',
        type: 'delay',
        name: 'Optimal Product Introduction',
        config: {
          duration: 'until_harvest_season',
          agricultural_calendar_aware: true
        },
        position: { x: 100, y: 300 },
        connections: ['action-harvest-products']
      }
    ],
    success_metrics: {
      expected_open_rate: 0.91,
      expected_click_rate: 0.29,
      expected_conversion_rate: 0.14
    },
    african_optimizations: [
      {
        type: 'timing',
        description: 'Agricultural calendar and seasonal awareness',
        implementation: { agricultural_calendar_integration: true },
        expected_improvement: 0.40
      },
      {
        type: 'content',
        description: 'Local farming expertise and Swahili content',
        implementation: { local_agricultural_content: true },
        expected_improvement: 0.25
      }
    ]
  }
];

export class AfricanWorkflowTemplateManager {
  /**
   * Deploy an African workflow template to the system
   */
  async deployTemplate(templateId: string, customizations?: Partial<AfricanWorkflowTemplate>): Promise<{
    workflowId: string;
    deployed: boolean;
    optimizations_applied: number;
  }> {
    try {
      const template = AFRICAN_WORKFLOW_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Apply customizations if provided
      const finalTemplate = customizations ? { ...template, ...customizations } : template;

      // Create workflow in database
      const workflow = await prisma.workflow.create({
        data: {
          id: `african-${templateId}-${Date.now()}`,
          name: finalTemplate.name,
          description: finalTemplate.description,
          isActive: true,
          nodes: JSON.stringify(finalTemplate.workflow_structure),
          metadata: JSON.stringify({
            template_id: templateId,
            target_countries: finalTemplate.target_countries,
            cultural_considerations: finalTemplate.cultural_considerations,
            african_optimizations: finalTemplate.african_optimizations,
            success_metrics: finalTemplate.success_metrics
          })
        }
      });

      // Apply African optimizations
      const optimizationsApplied = await this.applyAfricanOptimizations(
        workflow.id,
        finalTemplate.african_optimizations
      );

      logger.info('African workflow template deployed', {
        workflowId: workflow.id,
        templateId,
        targetCountries: finalTemplate.target_countries,
        optimizationsApplied
      });

      return {
        workflowId: workflow.id,
        deployed: true,
        optimizations_applied: optimizationsApplied
      };

    } catch (error) {
      logger.error('Failed to deploy African workflow template', {
        error: error instanceof Error ? error.message : String(error),
        templateId
      });
      throw error;
    }
  }

  /**
   * Get all available African workflow templates
   */
  getAvailableTemplates(): AfricanWorkflowTemplate[] {
    return AFRICAN_WORKFLOW_TEMPLATES;
  }

  /**
   * Get templates for specific country
   */
  getTemplatesForCountry(countryCode: string): AfricanWorkflowTemplate[] {
    return AFRICAN_WORKFLOW_TEMPLATES.filter(template =>
      template.target_countries.includes(countryCode)
    );
  }

  /**
   * Get templates by language
   */
  getTemplatesByLanguage(languageCode: string): AfricanWorkflowTemplate[] {
    return AFRICAN_WORKFLOW_TEMPLATES.filter(template =>
      template.supported_languages.includes(languageCode)
    );
  }

  /**
   * Customize template for specific use case
   */
  async customizeTemplate(
    templateId: string,
    customizations: {
      target_countries?: string[];
      primary_language?: string;
      communication_preferences?: Partial<AfricanWorkflowTemplate['communication_preferences']>;
      timing_adjustments?: Partial<AfricanWorkflowTemplate['optimal_timing']>;
      additional_optimizations?: AfricanOptimization[];
    }
  ): Promise<AfricanWorkflowTemplate> {
    const baseTemplate = AFRICAN_WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (!baseTemplate) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const customizedTemplate: AfricanWorkflowTemplate = {
      ...baseTemplate,
      id: `${templateId}-custom-${Date.now()}`,
      name: `${baseTemplate.name} (Customized)`,
      target_countries: customizations.target_countries || baseTemplate.target_countries,
      primary_language: customizations.primary_language || baseTemplate.primary_language,
      communication_preferences: {
        ...baseTemplate.communication_preferences,
        ...customizations.communication_preferences
      },
      optimal_timing: {
        ...baseTemplate.optimal_timing,
        ...customizations.timing_adjustments
      },
      african_optimizations: [
        ...baseTemplate.african_optimizations,
        ...(customizations.additional_optimizations || [])
      ]
    };

    return customizedTemplate;
  }

  /**
   * Apply African market optimizations
   */
  private async applyAfricanOptimizations(
    workflowId: string,
    optimizations: AfricanOptimization[]
  ): Promise<number> {
    let appliedCount = 0;

    for (const optimization of optimizations) {
      try {
        // Store optimization configuration
        await prisma.workflowEvent.create({
          data: {
            id: `african-opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            workflowId,
            contactId: 'system',
            eventType: 'AFRICAN_OPTIMIZATION_APPLIED',
            eventData: JSON.stringify({
              optimization_type: optimization.type,
              description: optimization.description,
              implementation: optimization.implementation,
              expected_improvement: optimization.expected_improvement
            })
          }
        });

        appliedCount++;
      } catch (error) {
        logger.warn('Failed to apply African optimization', {
          error: error instanceof Error ? error.message : String(error),
          workflowId,
          optimizationType: optimization.type
        });
      }
    }

    return appliedCount;
  }

  /**
   * Analyze template performance across African markets
   */
  async analyzeTemplatePerformance(templateId: string): Promise<{
    template_id: string;
    total_deployments: number;
    country_performance: Record<string, {
      deployments: number;
      avg_open_rate: number;
      avg_conversion_rate: number;
      cultural_optimization_score: number;
    }>;
    optimization_insights: string[];
    recommendations: string[];
  }> {
    try {
      // Get all workflows created from this template
      const workflows = await prisma.workflow.findMany({
        where: {
          metadata: {
            path: ['template_id'],
            equals: templateId
          }
        },
        include: {
          executions: {
            include: {
              contact: true
            },
            take: 1000 // Recent executions for analysis
          }
        }
      });

      const analysis = {
        template_id: templateId,
        total_deployments: workflows.length,
        country_performance: {} as Record<string, any>,
        optimization_insights: [] as string[],
        recommendations: [] as string[]
      };

      // Analyze performance by country
      const countryStats: Record<string, { executions: any[]; conversions: number }> = {};

      workflows.forEach(workflow => {
        workflow.executions.forEach(execution => {
          const country = execution.contact?.country || 'UNKNOWN';
          if (!countryStats[country]) {
            countryStats[country] = { executions: [], conversions: 0 };
          }
          countryStats[country].executions.push(execution);
          if (execution.status === 'COMPLETED') {
            countryStats[country].conversions++;
          }
        });
      });

      // Calculate country performance metrics
      Object.entries(countryStats).forEach(([country, stats]) => {
        const conversionRate = stats.conversions / stats.executions.length;
        
        analysis.country_performance[country] = {
          deployments: workflows.filter(w => 
            w.executions.some(e => e.contact?.country === country)
          ).length,
          avg_open_rate: 0.85, // Mock - would calculate from real data
          avg_conversion_rate: conversionRate,
          cultural_optimization_score: this.calculateCulturalOptimizationScore(country)
        };
      });

      // Generate insights
      const bestPerformingCountry = Object.entries(analysis.country_performance)
        .reduce((best, [country, perf]) => 
          perf.avg_conversion_rate > best.perf.avg_conversion_rate 
            ? { country, perf } 
            : best, 
          { country: '', perf: { avg_conversion_rate: 0 } }
        );

      analysis.optimization_insights = [
        `Best performing country: ${bestPerformingCountry.country} (${(bestPerformingCountry.perf.avg_conversion_rate * 100).toFixed(1)}% conversion)`,
        `Total template deployments: ${analysis.total_deployments}`,
        `Countries reached: ${Object.keys(analysis.country_performance).length}`
      ];

      // Generate recommendations
      analysis.recommendations = [
        'Expand successful template patterns to underperforming regions',
        'Increase cultural optimization in countries with scores below 0.8',
        'Test local language variations in multilingual markets'
      ];

      return analysis;

    } catch (error) {
      logger.error('Failed to analyze template performance', {
        error: error instanceof Error ? error.message : String(error),
        templateId
      });
      throw error;
    }
  }

  /**
   * Calculate cultural optimization score for a country
   */
  private calculateCulturalOptimizationScore(country: string): number {
    // Mock implementation - would use real cultural data
    const culturalScores: Record<string, number> = {
      'NG': 0.92, // High cultural optimization
      'KE': 0.88,
      'ZA': 0.85,
      'GH': 0.90,
      'UG': 0.87,
      'TZ': 0.89,
      'ET': 0.83
    };

    return culturalScores[country] || 0.75; // Default score
  }

  /**
   * Generate cultural timing recommendations
   */
  async generateCulturalTimingRecommendations(country: string): Promise<{
    optimal_hours: number[];
    avoid_periods: string[];
    cultural_events: string[];
    best_days: string[];
    timezone: string;
  }> {
    const culturalTimingData: Record<string, any> = {
      'NG': {
        optimal_hours: [9, 10, 11, 14, 15, 16, 20, 21],
        avoid_periods: ['friday_prayers', 'ramadan_fasting_hours', 'sunday_church'],
        cultural_events: ['ramadan', 'eid_celebrations', 'new_yam_festival'],
        best_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
        timezone: 'Africa/Lagos'
      },
      'KE': {
        optimal_hours: [8, 9, 10, 11, 14, 15, 16, 19, 20],
        avoid_periods: ['harambee_meetings', 'safari_season_travel'],
        cultural_events: ['mashujaa_day', 'jamhuri_day', 'madaraka_day'],
        best_days: ['tuesday', 'wednesday', 'thursday'],
        timezone: 'Africa/Nairobi'
      },
      'ZA': {
        optimal_hours: [8, 9, 10, 11, 14, 15, 16, 17],
        avoid_periods: ['load_shedding_schedule', 'rugby_match_days'],
        cultural_events: ['heritage_day', 'freedom_day', 'braai_day'],
        best_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
        timezone: 'Africa/Johannesburg'
      }
    };

    return culturalTimingData[country] || {
      optimal_hours: [9, 10, 11, 14, 15, 16],
      avoid_periods: ['weekend_family_time'],
      cultural_events: [],
      best_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
      timezone: 'UTC'
    };
  }
}

// Export singleton instance
export const africanWorkflowTemplateManager = new AfricanWorkflowTemplateManager();