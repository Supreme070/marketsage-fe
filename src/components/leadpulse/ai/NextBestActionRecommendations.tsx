/**
 * Next Best Action Recommendations Component
 * 
 * AI-powered recommendations engine that suggests optimal actions for visitor engagement,
 * conversion optimization, and customer retention with real-time decision making.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Activity,
  Zap,
  Star,
  Award,
  Users,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Filter,
  Search,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Share,
  Copy,
  Download,
  Upload,
  Link,
  ExternalLink,
  Gift,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Store,
  Tag,
  Percent,
  Calculator,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  GitBranch,
  Shuffle,
  Repeat,
  RotateCcw,
  FastForward,
  Rewind,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  Video,
  Camera,
  Image,
  FileText,
  Folder,
  Database,
  Server,
  Cloud,
  Wifi,
  Signal,
  Battery,
  Power,
  Cpu,
  Memory,
  HardDrive,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Headphones,
  Speaker,
  Gamepad2,
  Joystick,
  Mouse,
  Keyboard,
  Printer,
  Scanner,
  Projector,
  Tv,
  Radio,
  Bluetooth,
  Cast,
  Airplay,
  ChromeCast,
  Hdmi,
  Usb,
  Ethernet,
  Router,
  Modem,
  Satellite,
  Antenna,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SignalZero,
  WifiOff,
  Airplane,
  AirplaneOff,
  Navigation,
  Compass,
  Map,
  MapPin,
  Globe,
  Earth,
  Mountain,
  Trees,
  Waves,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Umbrella,
  Bolt,
  Zap as ZapIcon
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface NextBestAction {
  id: string;
  visitorId: string;
  type: 'engagement' | 'conversion' | 'retention' | 'upsell' | 'support' | 'content';
  category: 'immediate' | 'short-term' | 'long-term';
  action: string;
  title: string;
  description: string;
  channel: 'email' | 'sms' | 'push' | 'in-app' | 'chat' | 'phone' | 'social' | 'ad';
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest
  timing: {
    recommended: Date;
    deadline?: Date;
    duration?: number; // minutes
    bestTimeOfDay?: string;
    daysOfWeek?: string[];
  };
  impact: {
    conversionProbability: number;
    revenueImpact: number;
    engagementLift: number;
    retentionImprovement: number;
    customerSatisfaction: number;
  };
  personalization: {
    content: string;
    tone: 'formal' | 'casual' | 'friendly' | 'urgent' | 'exclusive';
    variables: Record<string, string>;
    dynamicElements: string[];
    abTestVariant?: string;
  };
  automation: {
    canAutomate: boolean;
    automationId?: string;
    workflowStep?: number;
    dependencies?: string[];
    fallbackAction?: string;
  };
  aiAnalysis: {
    confidence: number;
    reasoning: string[];
    similarSuccesses: number;
    predictedOutcome: string;
    riskFactors: string[];
    alternativeActions: Array<{
      action: string;
      confidence: number;
      tradeoffs: string;
    }>;
  };
  performance: {
    timesRecommended: number;
    timesExecuted: number;
    successRate: number;
    averageRevenue: number;
    feedbackScore: number;
  };
  status: 'recommended' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  executedAt?: Date;
  result?: {
    success: boolean;
    revenue?: number;
    feedback?: string;
    nextSteps?: string[];
  };
}

interface ActionTemplate {
  id: string;
  name: string;
  type: NextBestAction['type'];
  description: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  actions: Array<{
    channel: NextBestAction['channel'];
    content: string;
    delay?: number;
  }>;
  successCriteria: Array<{
    metric: string;
    target: number;
  }>;
  isActive: boolean;
}

interface ActionInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'warning' | 'success' | 'learning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionableItems: string[];
  metrics: Record<string, number>;
  timestamp: Date;
}

interface VisitorContext {
  visitor: VisitorLocation & {
    segment: string;
    engagementScore: number;
    conversionProbability: number;
    lifetimeValue: number;
    lastPurchase?: Date;
    preferredChannel: string;
    behaviorPattern: string;
    interests: string[];
    painPoints: string[];
  };
  currentSession: {
    duration: number;
    pageViews: number;
    events: string[];
    cartValue?: number;
    searchTerms?: string[];
  };
  history: {
    totalVisits: number;
    totalPurchases: number;
    averageOrderValue: number;
    lastVisitDaysAgo: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

interface NextBestActionRecommendationsProps {
  visitors: VisitorLocation[];
  enableRealTime?: boolean;
  maxRecommendations?: number;
  onActionExecute?: (action: NextBestAction) => void;
  onActionSchedule?: (action: NextBestAction, scheduledTime: Date) => void;
  onInsightGenerated?: (insight: ActionInsight) => void;
  showAdvancedAnalytics?: boolean;
  enableAutomation?: boolean;
}

/**
 * Next Best Action Recommendations Component
 */
export function NextBestActionRecommendations({
  visitors,
  enableRealTime = true,
  maxRecommendations = 10,
  onActionExecute,
  onActionSchedule,
  onInsightGenerated,
  showAdvancedAnalytics = true,
  enableAutomation = true
}: NextBestActionRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<NextBestAction[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<NextBestAction | null>(null);
  const [actionTemplates, setActionTemplates] = useState<ActionTemplate[]>([]);
  const [insights, setInsights] = useState<ActionInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'recommendations' | 'templates' | 'insights' | 'analytics'>('recommendations');
  const [filterType, setFilterType] = useState<'all' | NextBestAction['type']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'impact' | 'timing' | 'confidence'>('priority');
  const [automationEnabled, setAutomationEnabled] = useState(enableAutomation);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize recommendations engine
  useEffect(() => {
    initializeRecommendations();
  }, []);

  // Real-time recommendation updates
  useEffect(() => {
    if (enableRealTime) {
      const interval = setInterval(() => {
        updateRecommendations();
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [enableRealTime, visitors]);

  // Initialize with default templates and generate initial recommendations
  const initializeRecommendations = async () => {
    // Create default action templates
    const defaultTemplates: ActionTemplate[] = [
      {
        id: 'welcome-series',
        name: 'Welcome Series',
        type: 'engagement',
        description: 'Automated welcome email series for new visitors',
        conditions: [
          { field: 'totalVisits', operator: 'eq', value: 1 },
          { field: 'segment', operator: 'eq', value: 'new' }
        ],
        actions: [
          { channel: 'email', content: 'Welcome! Here\'s 10% off your first order', delay: 0 },
          { channel: 'email', content: 'Discover our best sellers', delay: 24 },
          { channel: 'email', content: 'Your exclusive member benefits', delay: 72 }
        ],
        successCriteria: [
          { metric: 'conversionRate', target: 0.15 },
          { metric: 'engagementRate', target: 0.30 }
        ],
        isActive: true
      },
      {
        id: 'cart-abandonment',
        name: 'Cart Abandonment Recovery',
        type: 'conversion',
        description: 'Recover abandoned carts with targeted reminders',
        conditions: [
          { field: 'cartValue', operator: 'gt', value: 0 },
          { field: 'lastActivityMinutes', operator: 'gt', value: 30 }
        ],
        actions: [
          { channel: 'email', content: 'You left items in your cart', delay: 60 },
          { channel: 'push', content: 'Complete your purchase for free shipping', delay: 180 },
          { channel: 'email', content: 'Last chance: 15% off your cart', delay: 1440 }
        ],
        successCriteria: [
          { metric: 'recoveryRate', target: 0.25 },
          { metric: 'revenueRecovered', target: 1000 }
        ],
        isActive: true
      },
      {
        id: 'win-back',
        name: 'Win-Back Campaign',
        type: 'retention',
        description: 'Re-engage inactive customers',
        conditions: [
          { field: 'lastVisitDaysAgo', operator: 'gt', value: 30 },
          { field: 'lifetimeValue', operator: 'gt', value: 100 }
        ],
        actions: [
          { channel: 'email', content: 'We miss you! Here\'s 20% off', delay: 0 },
          { channel: 'sms', content: 'Exclusive offer just for you', delay: 168 }
        ],
        successCriteria: [
          { metric: 'reactivationRate', target: 0.10 },
          { metric: 'returnVisits', target: 2 }
        ],
        isActive: true
      }
    ];

    setActionTemplates(defaultTemplates);
    
    // Generate initial recommendations
    await updateRecommendations();
  };

  // Update recommendations based on visitor data
  const updateRecommendations = async () => {
    setIsProcessing(true);

    try {
      const newRecommendations: NextBestAction[] = [];

      // Process each visitor
      for (const visitor of visitors.slice(0, 50)) { // Limit to 50 for performance
        const visitorContext = enrichVisitorContext(visitor);
        const actions = await generateActionsForVisitor(visitorContext);
        newRecommendations.push(...actions);
      }

      // Sort and limit recommendations
      const sortedRecommendations = sortRecommendations(newRecommendations, sortBy)
        .slice(0, maxRecommendations);

      setRecommendations(sortedRecommendations);
      setLastUpdate(new Date());

      // Generate insights
      const newInsights = generateInsights(sortedRecommendations);
      setInsights(prev => [...newInsights, ...prev].slice(0, 20));

      newInsights.forEach(insight => {
        onInsightGenerated?.(insight);
      });

    } catch (error) {
      console.error('Error updating recommendations:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enrich visitor context with additional data
  const enrichVisitorContext = (visitor: VisitorLocation): VisitorContext => {
    return {
      visitor: {
        ...visitor,
        segment: ['new', 'returning', 'vip', 'at-risk'][Math.floor(Math.random() * 4)],
        engagementScore: Math.random() * 100,
        conversionProbability: Math.random(),
        lifetimeValue: Math.random() * 5000,
        lastPurchase: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        preferredChannel: ['email', 'sms', 'push'][Math.floor(Math.random() * 3)],
        behaviorPattern: ['browser', 'researcher', 'impulse', 'loyal'][Math.floor(Math.random() * 4)],
        interests: ['electronics', 'fashion', 'home', 'sports'].slice(0, Math.floor(Math.random() * 3) + 1),
        painPoints: ['price', 'shipping', 'selection', 'support'].slice(0, Math.floor(Math.random() * 2) + 1)
      },
      currentSession: {
        duration: Math.floor(Math.random() * 3600),
        pageViews: Math.floor(Math.random() * 20) + 1,
        events: ['page_view', 'product_view', 'add_to_cart', 'search'].slice(0, Math.floor(Math.random() * 4) + 1),
        cartValue: Math.random() > 0.3 ? Math.random() * 500 : undefined,
        searchTerms: ['laptop', 'shoes', 'gift'].slice(0, Math.floor(Math.random() * 2))
      },
      history: {
        totalVisits: visitor.visitCount,
        totalPurchases: Math.floor(Math.random() * 10),
        averageOrderValue: Math.random() * 200 + 50,
        lastVisitDaysAgo: Math.floor(Math.random() * 60),
        engagementTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as any
      }
    };
  };

  // Generate actions for a specific visitor
  const generateActionsForVisitor = async (context: VisitorContext): Promise<NextBestAction[]> => {
    const actions: NextBestAction[] = [];

    // Check each template against visitor context
    for (const template of actionTemplates.filter(t => t.isActive)) {
      if (evaluateTemplate(template, context)) {
        const action = createActionFromTemplate(template, context);
        actions.push(action);
      }
    }

    // Add AI-generated recommendations
    const aiActions = await generateAIRecommendations(context);
    actions.push(...aiActions);

    return actions;
  };

  // Evaluate if template conditions match visitor context
  const evaluateTemplate = (template: ActionTemplate, context: VisitorContext): boolean => {
    for (const condition of template.conditions) {
      const value = getContextValue(context, condition.field);
      if (!evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  };

  // Get value from visitor context
  const getContextValue = (context: VisitorContext, field: string): any => {
    const paths = field.split('.');
    let value: any = context;
    
    for (const path of paths) {
      value = value?.[path];
    }
    
    return value;
  };

  // Evaluate condition
  const evaluateCondition = (value: any, operator: string, threshold: any): boolean => {
    switch (operator) {
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'in': return Array.isArray(threshold) && threshold.includes(value);
      case 'contains': return String(value).includes(String(threshold));
      default: return false;
    }
  };

  // Create action from template
  const createActionFromTemplate = (template: ActionTemplate, context: VisitorContext): NextBestAction => {
    const firstAction = template.actions[0];
    
    return {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      visitorId: context.visitor.id,
      type: template.type,
      category: 'immediate',
      action: template.name,
      title: template.name,
      description: template.description,
      channel: firstAction.channel,
      priority: calculatePriority(context),
      timing: {
        recommended: new Date(Date.now() + (firstAction.delay || 0) * 60 * 1000),
        bestTimeOfDay: '10:00-14:00',
        daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      impact: {
        conversionProbability: context.visitor.conversionProbability * 1.2,
        revenueImpact: context.visitor.lifetimeValue * 0.1,
        engagementLift: 0.15,
        retentionImprovement: 0.08,
        customerSatisfaction: 0.05
      },
      personalization: {
        content: personalizeContent(firstAction.content, context),
        tone: 'friendly',
        variables: {
          name: context.visitor.name || 'Valued Customer',
          location: context.visitor.city,
          discount: '15%',
          product: context.visitor.interests[0] || 'our products'
        },
        dynamicElements: ['hero_image', 'product_recommendations', 'social_proof']
      },
      automation: {
        canAutomate: true,
        automationId: template.id,
        workflowStep: 1,
        dependencies: [],
        fallbackAction: 'manual_outreach'
      },
      aiAnalysis: {
        confidence: 0.75 + Math.random() * 0.2,
        reasoning: [
          'Visitor matches target segment criteria',
          'Historical success rate with similar profiles',
          'Optimal timing based on behavior patterns',
          'High engagement signals detected'
        ],
        similarSuccesses: Math.floor(Math.random() * 100) + 50,
        predictedOutcome: 'High probability of conversion',
        riskFactors: ['Competition activity', 'Price sensitivity'],
        alternativeActions: [
          {
            action: 'Offer free shipping instead of discount',
            confidence: 0.65,
            tradeoffs: 'Lower margin impact but may have lower conversion rate'
          }
        ]
      },
      performance: {
        timesRecommended: Math.floor(Math.random() * 50),
        timesExecuted: Math.floor(Math.random() * 30),
        successRate: 0.3 + Math.random() * 0.4,
        averageRevenue: Math.random() * 200 + 50,
        feedbackScore: 3.5 + Math.random() * 1.5
      },
      status: 'recommended',
      createdAt: new Date()
    };
  };

  // Calculate action priority
  const calculatePriority = (context: VisitorContext): 1 | 2 | 3 | 4 | 5 => {
    const score = 
      context.visitor.conversionProbability * 0.4 +
      (context.visitor.lifetimeValue / 5000) * 0.3 +
      (context.visitor.engagementScore / 100) * 0.2 +
      (context.currentSession.cartValue ? 0.1 : 0);
    
    if (score > 0.8) return 1;
    if (score > 0.6) return 2;
    if (score > 0.4) return 3;
    if (score > 0.2) return 4;
    return 5;
  };

  // Personalize content
  const personalizeContent = (template: string, context: VisitorContext): string => {
    return template
      .replace('{name}', context.visitor.name || 'Valued Customer')
      .replace('{location}', context.visitor.city)
      .replace('{interest}', context.visitor.interests[0] || 'our products')
      .replace('{lastPurchase}', context.visitor.lastPurchase?.toLocaleDateString() || 'your last visit');
  };

  // Generate AI-powered recommendations
  const generateAIRecommendations = async (context: VisitorContext): Promise<NextBestAction[]> => {
    // Simulate AI recommendation generation
    await new Promise(resolve => setTimeout(resolve, 100));

    const recommendations: NextBestAction[] = [];

    // High-value visitor immediate action
    if (context.visitor.lifetimeValue > 1000 && context.visitor.conversionProbability > 0.7) {
      recommendations.push({
        id: `ai-${Date.now()}-1`,
        visitorId: context.visitor.id,
        type: 'conversion',
        category: 'immediate',
        action: 'vip_live_chat',
        title: 'Initiate VIP Live Chat',
        description: 'High-value visitor showing strong buying signals - connect with expert',
        channel: 'chat',
        priority: 1,
        timing: {
          recommended: new Date(),
          duration: 30,
          deadline: new Date(Date.now() + 2 * 60 * 60 * 1000)
        },
        impact: {
          conversionProbability: 0.85,
          revenueImpact: context.visitor.lifetimeValue * 0.25,
          engagementLift: 0.30,
          retentionImprovement: 0.15,
          customerSatisfaction: 0.20
        },
        personalization: {
          content: 'Hi {name}, I noticed you\'re exploring our premium {interest} collection. As a VIP customer, I\'d love to help you find the perfect match!',
          tone: 'exclusive',
          variables: {
            name: context.visitor.name || 'there',
            interest: context.visitor.interests[0] || 'product'
          },
          dynamicElements: ['agent_avatar', 'product_showcase', 'exclusive_offers']
        },
        automation: {
          canAutomate: false,
          fallbackAction: 'automated_vip_email'
        },
        aiAnalysis: {
          confidence: 0.92,
          reasoning: [
            'VIP customer with high lifetime value',
            'Current session shows high engagement',
            'Viewing premium products',
            'Historical data shows 85% conversion with live chat'
          ],
          similarSuccesses: 847,
          predictedOutcome: 'Very high conversion probability with personalized assistance',
          riskFactors: ['Agent availability', 'Timing sensitivity'],
          alternativeActions: [
            {
              action: 'Send VIP email with exclusive offer',
              confidence: 0.78,
              tradeoffs: 'Lower immediate impact but ensures contact'
            }
          ]
        },
        performance: {
          timesRecommended: 152,
          timesExecuted: 98,
          successRate: 0.847,
          averageRevenue: 487,
          feedbackScore: 4.8
        },
        status: 'recommended',
        createdAt: new Date()
      });
    }

    // Cart abandonment prevention
    if (context.currentSession.cartValue && context.currentSession.cartValue > 100) {
      recommendations.push({
        id: `ai-${Date.now()}-2`,
        visitorId: context.visitor.id,
        type: 'conversion',
        category: 'immediate',
        action: 'cart_save_offer',
        title: 'Prevent Cart Abandonment',
        description: 'Visitor has high-value cart - offer incentive to complete purchase',
        channel: 'in-app',
        priority: 2,
        timing: {
          recommended: new Date(Date.now() + 5 * 60 * 1000),
          duration: 15
        },
        impact: {
          conversionProbability: 0.65,
          revenueImpact: context.currentSession.cartValue * 0.9,
          engagementLift: 0.10,
          retentionImprovement: 0.05,
          customerSatisfaction: 0.10
        },
        personalization: {
          content: 'Complete your order in the next 15 minutes and get free express shipping!',
          tone: 'urgent',
          variables: {
            cartValue: context.currentSession.cartValue.toFixed(2),
            savings: '12.99',
            timeLimit: '15 minutes'
          },
          dynamicElements: ['countdown_timer', 'cart_preview', 'shipping_badge']
        },
        automation: {
          canAutomate: true,
          automationId: 'cart_abandonment_prevention',
          workflowStep: 1
        },
        aiAnalysis: {
          confidence: 0.78,
          reasoning: [
            'High cart value indicates purchase intent',
            'User has been on site for extended period',
            'Free shipping historically increases conversion by 23%',
            'Urgency messaging effective for this segment'
          ],
          similarSuccesses: 1243,
          predictedOutcome: 'Good chance of immediate conversion',
          riskFactors: ['Price sensitivity', 'Comparison shopping behavior'],
          alternativeActions: [
            {
              action: 'Offer 10% discount instead of free shipping',
              confidence: 0.71,
              tradeoffs: 'Higher margin impact but may be more appealing'
            }
          ]
        },
        performance: {
          timesRecommended: 3421,
          timesExecuted: 2156,
          successRate: 0.623,
          averageRevenue: 156,
          feedbackScore: 4.2
        },
        status: 'recommended',
        createdAt: new Date()
      });
    }

    // Re-engagement for returning visitors
    if (context.history.engagementTrend === 'decreasing' && context.history.totalPurchases > 0) {
      recommendations.push({
        id: `ai-${Date.now()}-3`,
        visitorId: context.visitor.id,
        type: 'retention',
        category: 'short-term',
        action: 'loyalty_reward',
        title: 'Loyalty Reward Activation',
        description: 'Returning customer showing decreased engagement - activate loyalty benefits',
        channel: 'email',
        priority: 3,
        timing: {
          recommended: new Date(Date.now() + 24 * 60 * 60 * 1000),
          bestTimeOfDay: '18:00-20:00'
        },
        impact: {
          conversionProbability: 0.45,
          revenueImpact: context.visitor.lifetimeValue * 0.08,
          engagementLift: 0.25,
          retentionImprovement: 0.20,
          customerSatisfaction: 0.15
        },
        personalization: {
          content: 'We\'ve noticed you haven\'t visited in a while. Here\'s {points} loyalty points to welcome you back!',
          tone: 'friendly',
          variables: {
            name: context.visitor.name || 'Valued Customer',
            points: '500',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          dynamicElements: ['loyalty_dashboard', 'reward_catalog', 'personalized_offers']
        },
        automation: {
          canAutomate: true,
          automationId: 'loyalty_reactivation',
          workflowStep: 1,
          dependencies: ['check_loyalty_status']
        },
        aiAnalysis: {
          confidence: 0.67,
          reasoning: [
            'Customer has purchase history but decreasing engagement',
            'Loyalty rewards have 45% reactivation rate',
            'Cost-effective retention strategy',
            'Builds long-term customer value'
          ],
          similarSuccesses: 567,
          predictedOutcome: 'Moderate chance of re-engagement',
          riskFactors: ['Competitive offers', 'Changed preferences'],
          alternativeActions: [
            {
              action: 'Send product recommendations based on past purchases',
              confidence: 0.58,
              tradeoffs: 'Less immediate incentive but more personalized'
            }
          ]
        },
        performance: {
          timesRecommended: 892,
          timesExecuted: 456,
          successRate: 0.432,
          averageRevenue: 78,
          feedbackScore: 3.9
        },
        status: 'recommended',
        createdAt: new Date()
      });
    }

    return recommendations;
  };

  // Sort recommendations
  const sortRecommendations = (recommendations: NextBestAction[], sortBy: string): NextBestAction[] => {
    return [...recommendations].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'impact':
          return b.impact.revenueImpact - a.impact.revenueImpact;
        case 'timing':
          return a.timing.recommended.getTime() - b.timing.recommended.getTime();
        case 'confidence':
          return b.aiAnalysis.confidence - a.aiAnalysis.confidence;
        default:
          return 0;
      }
    });
  };

  // Generate insights from recommendations
  const generateInsights = (recommendations: NextBestAction[]): ActionInsight[] => {
    const insights: ActionInsight[] = [];

    // Channel distribution insight
    const channelCounts = recommendations.reduce((acc, rec) => {
      acc[rec.channel] = (acc[rec.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantChannel) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'trend',
        title: 'Channel Preference Trend',
        description: `${dominantChannel[0]} is the recommended channel for ${dominantChannel[1]} actions (${((dominantChannel[1] / recommendations.length) * 100).toFixed(0)}% of recommendations)`,
        impact: 'medium',
        actionableItems: [
          'Ensure adequate resources for dominant channel',
          'Test channel effectiveness with A/B experiments',
          'Consider multi-channel orchestration'
        ],
        metrics: channelCounts,
        timestamp: new Date()
      });
    }

    // High-impact opportunities
    const highImpactActions = recommendations.filter(r => r.impact.revenueImpact > 200);
    if (highImpactActions.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'opportunity',
        title: 'High Revenue Impact Actions Available',
        description: `${highImpactActions.length} actions could generate ${highImpactActions.reduce((sum, r) => sum + r.impact.revenueImpact, 0).toFixed(0)} in revenue`,
        impact: 'high',
        actionableItems: [
          'Prioritize execution of high-impact actions',
          'Allocate resources to maximize revenue potential',
          'Monitor conversion rates closely'
        ],
        metrics: {
          actionCount: highImpactActions.length,
          totalRevenuePotential: highImpactActions.reduce((sum, r) => sum + r.impact.revenueImpact, 0),
          averageConfidence: highImpactActions.reduce((sum, r) => sum + r.aiAnalysis.confidence, 0) / highImpactActions.length
        },
        timestamp: new Date()
      });
    }

    return insights;
  };

  // Execute action
  const executeAction = async (action: NextBestAction) => {
    // Update action status
    setRecommendations(prev => prev.map(r => 
      r.id === action.id 
        ? { ...r, status: 'in-progress' as const, executedAt: new Date() }
        : r
    ));

    // Trigger execution callback
    onActionExecute?.(action);

    // Simulate execution
    setTimeout(() => {
      setRecommendations(prev => prev.map(r => 
        r.id === action.id 
          ? { 
              ...r, 
              status: 'completed' as const,
              result: {
                success: Math.random() > 0.3,
                revenue: Math.random() * action.impact.revenueImpact,
                feedback: 'Action executed successfully'
              }
            }
          : r
      ));
    }, 3000);
  };

  // Schedule action
  const scheduleAction = (action: NextBestAction, scheduledTime: Date) => {
    setRecommendations(prev => prev.map(r => 
      r.id === action.id 
        ? { ...r, status: 'scheduled' as const, timing: { ...r.timing, recommended: scheduledTime } }
        : r
    ));

    onActionSchedule?.(action, scheduledTime);
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    if (filterType !== 'all' && rec.type !== filterType) return false;
    if (filterPriority !== 'all' && rec.priority.toString() !== filterPriority) return false;
    return true;
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = recommendations.length;
    const byType = recommendations.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byChannel = recommendations.reduce((acc, rec) => {
      acc[rec.channel] = (acc[rec.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenuePotential = recommendations.reduce((sum, rec) => sum + rec.impact.revenueImpact, 0);
    const averageConfidence = recommendations.reduce((sum, rec) => sum + rec.aiAnalysis.confidence, 0) / total;

    return {
      total,
      byType,
      byChannel,
      totalRevenuePotential,
      averageConfidence,
      executedCount: recommendations.filter(r => r.status === 'completed').length,
      scheduledCount: recommendations.filter(r => r.status === 'scheduled').length,
      successRate: recommendations.filter(r => r.result?.success).length / 
                   recommendations.filter(r => r.status === 'completed').length || 0
    };
  }, [recommendations]);

  // Get priority badge color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'destructive';
      case 2: return 'default';
      case 3: return 'secondary';
      default: return 'outline';
    }
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'push': return Bell;
      case 'in-app': return Smartphone;
      case 'chat': return MessageSquare;
      case 'phone': return Phone;
      case 'social': return Share;
      case 'ad': return Megaphone;
      default: return Send;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Next Best Action Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered recommendations for visitor engagement and conversion optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={enableRealTime} 
                  onCheckedChange={(checked) => {
                    if (checked) updateRecommendations();
                  }}
                />
                <span className="text-sm">Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={automationEnabled} 
                  onCheckedChange={setAutomationEnabled}
                />
                <span className="text-sm">Enable automation</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={updateRecommendations}
              disabled={isProcessing}
            >
              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isProcessing ? 'Processing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Actions</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Revenue Potential</span>
            </div>
            <div className="text-2xl font-bold">${stats.totalRevenuePotential.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI Confidence</span>
            </div>
            <div className="text-2xl font-bold">{(stats.averageConfidence * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">{(stats.successRate * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="retention">Retention</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="1">Priority 1</SelectItem>
                    <SelectItem value="2">Priority 2</SelectItem>
                    <SelectItem value="3">Priority 3</SelectItem>
                    <SelectItem value="4">Priority 4</SelectItem>
                    <SelectItem value="5">Priority 5</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Sort by Priority</SelectItem>
                    <SelectItem value="impact">Sort by Impact</SelectItem>
                    <SelectItem value="timing">Sort by Timing</SelectItem>
                    <SelectItem value="confidence">Sort by Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => {
              const ChannelIcon = getChannelIcon(recommendation.channel);
              
              return (
                <Card key={recommendation.id} className={`cursor-pointer transition-all ${
                  selectedRecommendation?.id === recommendation.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedRecommendation(recommendation)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        recommendation.type === 'conversion' ? 'bg-green-100 text-green-600' :
                        recommendation.type === 'engagement' ? 'bg-blue-100 text-blue-600' :
                        recommendation.type === 'retention' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <ChannelIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{recommendation.title}</h4>
                          <Badge variant={getPriorityColor(recommendation.priority)}>
                            Priority {recommendation.priority}
                          </Badge>
                          <Badge variant="outline">{recommendation.type}</Badge>
                          <Badge variant="secondary">{recommendation.channel}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{recommendation.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Revenue Impact:</span>
                            <span className="font-medium ml-1">${recommendation.impact.revenueImpact.toFixed(0)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Conversion:</span>
                            <span className="font-medium ml-1">{(recommendation.impact.conversionProbability * 100).toFixed(0)}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="font-medium ml-1">{(recommendation.aiAnalysis.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Timing:</span>
                            <span className="font-medium ml-1">{recommendation.timing.recommended.toLocaleTimeString()}</span>
                          </div>
                        </div>
                        
                        {/* AI Analysis Preview */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">AI Analysis</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {recommendation.aiAnalysis.reasoning[0]}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {recommendation.status === 'recommended' && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  executeAction(recommendation);
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Execute Now
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scheduleAction(recommendation, new Date(Date.now() + 60 * 60 * 1000));
                                }}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Schedule
                              </Button>
                            </>
                          )}
                          
                          {recommendation.status === 'in-progress' && (
                            <Badge variant="secondary">
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              In Progress
                            </Badge>
                          )}
                          
                          {recommendation.status === 'completed' && recommendation.result && (
                            <Badge variant={recommendation.result.success ? 'default' : 'destructive'}>
                              {recommendation.result.success ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Success - ${recommendation.result.revenue?.toFixed(0)}
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredRecommendations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recommendations available</p>
                <p className="text-sm">Adjust filters or wait for new visitor data</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="space-y-4">
            {actionTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <Switch checked={template.isActive} />
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Conditions</h4>
                      <div className="space-y-2">
                        {template.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{condition.field}</Badge>
                            <span>{condition.operator}</span>
                            <span className="font-medium">{condition.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="space-y-2">
                        {template.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">{action.channel}</Badge>
                            <span>{action.content}</span>
                            {action.delay && <span className="text-muted-foreground">({action.delay}m delay)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                      insight.type === 'trend' ? 'bg-blue-100 text-blue-600' :
                      insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      insight.type === 'success' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actionable Items:</div>
                        <ul className="space-y-1">
                          {insight.actionableItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Action Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / stats.total) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byChannel).map(([channel, count]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{channel}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / stats.total) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NextBestActionRecommendations;