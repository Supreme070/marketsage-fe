/**
 * Intelligent Alert System Component
 * 
 * AI-powered alert system for high-value visitors with predictive notifications,
 * smart prioritization, and automated response suggestions.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Zap,
  Brain,
  Star,
  Award,
  Users,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  Globe,
  Smartphone,
  Monitor,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Check,
  AlertCircle,
  Lightbulb,
  Flag,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share,
  Copy,
  Download,
  Upload,
  Link,
  ExternalLink,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  MoreHorizontal,
  Edit,
  Trash2,
  Archive,
  Unarchive,
  PinIcon,
  UnpinIcon,
  Timer,
  Alarm,
  Stopwatch,
  Gauge,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  GitBranch,
  Radar,
  Crosshair,
  Navigation,
  Compass,
  Map,
  Route,
  Megaphone,
  Speaker,
  Mic,
  MicOff,
  Camera,
  Video,
  Image,
  FileText,
  Folder,
  FolderOpen,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  BatteryLow,
  Power,
  PowerOff,
  Cpu,
  Memory,
  HardDrive,
  MousePointer,
  Keyboard,
  Printer,
  Scanner,
  Headphones,
  Webcam,
  Gamepad2,
  Joystick,
  Puzzle,
  Wrench,
  Hammer,
  Screwdriver,
  Paintbrush,
  Palette,
  Scissors,
  Paperclip,
  Pin,
  Pushpin,
  Thumbtack,
  Magnet,
  Lock,
  Unlock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  CreditCard,
  Wallet,
  Coins,
  Banknote,
  Receipt,
  Calculator,
  Abacus,
  Scale,
  Ruler,
  Scissors as ScissorsIcon,
  Divide,
  Equal,
  Percent,
  PlusCircle,
  MinusCircle,
  XSquare,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Pentagon,
  Octagon,
  Star as StarIcon,
  Heart as HeartIcon,
  Music,
  Music2,
  Music3,
  Music4,
  Disc,
  Disc2,
  Disc3,
  Radio,
  Podcast,
  Headphones as HeadphonesIcon,
  Volume,
  Volume1,
  VolumeX as VolumeXIcon,
  Shuffle,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Square as SquareIcon,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Move,
  Resize,
  ZoomIn,
  ZoomOut,
  Focus,
  Aperture,
  Shutter,
  Iso,
  Exposure,
  Contrast,
  Brightness,
  Saturation,
  Hue,
  Temperature,
  Tint,
  Vibrance,
  Clarity,
  Highlights,
  Shadows,
  Whites,
  Blacks,
  Texture,
  Structure,
  Grain,
  Vignette,
  Chromatic,
  Distortion,
  Perspective,
  Keystone,
  Barrel,
  Pincushion,
  Fisheye,
  Panorama,
  Burst,
  Hdr,
  Flash,
  FlashOff,
  Flashlight,
  FlashlightOff,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  Stars,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  Thermometer,
  Umbrella,
  Wind,
  Tornado,
  Hurricane,
  Flood,
  Drought,
  Earthquake,
  Volcano,
  Tsunami,
  Avalanche,
  Landslide,
  Wildfire,
  Blizzard,
  Heatwave,
  Coldwave,
  Smog,
  Fog,
  Mist,
  Dust,
  Sand,
  Smoke,
  Steam,
  Bubble,
  Droplet,
  Droplets,
  Waves,
  Zap as ZapIcon,
  Bolt,
  Spark,
  Flame,
  Candle,
  Lightbulb as LightbulbIcon,
  Flashlight as FlashlightIcon,
  Torch,
  Lantern,
  Campfire,
  Fireplace,
  Furnace,
  Heater,
  Radiator,
  AirConditioner,
  Fan,
  Refrigerator,
  Freezer,
  Microwave,
  Oven,
  Stove,
  Toaster,
  Kettle,
  Teapot,
  Coffee,
  Tea,
  Wine,
  Beer,
  Cocktail,
  Martini,
  Champagne,
  Soda,
  Juice,
  Water,
  Milk,
  Honey,
  Sugar,
  Salt,
  Pepper,
  Spice,
  Herb,
  Garlic,
  Onion,
  Tomato,
  Potato,
  Carrot,
  Broccoli,
  Lettuce,
  Spinach,
  Kale,
  Cabbage,
  Cauliflower,
  Cucumber,
  Zucchini,
  Eggplant,
  Bell as BellIcon,
  Chili,
  Corn,
  Pea,
  Bean,
  Lentil,
  Chickpea,
  Peanut,
  Almond,
  Walnut,
  Pistachio,
  Cashew,
  Hazelnut,
  Pecan,
  Macadamia,
  Chestnut,
  Acorn,
  Coconut,
  Avocado,
  Banana,
  Apple,
  Orange,
  Lemon,
  Lime,
  Grapefruit,
  Strawberry,
  Blueberry,
  Raspberry,
  Blackberry,
  Cherry,
  Grape,
  Pineapple,
  Mango,
  Papaya,
  Kiwi,
  Peach,
  Pear,
  Plum,
  Apricot,
  Fig,
  Date,
  Raisin,
  Cranberry,
  Pomegranate,
  Passion,
  Dragon,
  Lychee,
  Durian,
  Jackfruit,
  Breadfruit,
  Plantain,
  Yam,
  Taro,
  Cassava,
  Quinoa,
  Rice,
  Wheat,
  Barley,
  Oats,
  Rye,
  Millet,
  Sorghum,
  Buckwheat,
  Amaranth,
  Chia,
  Flax,
  Sesame,
  Sunflower,
  Pumpkin,
  Squash,
  Melon,
  Watermelon,
  Cantaloupe,
  Honeydew,
  Papaya as PapayaIcon,
  Kiwi as KiwiIcon
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface IntelligentAlert {
  id: string;
  type: 'high_value_visitor' | 'churning_customer' | 'conversion_opportunity' | 'anomaly_detected' | 'segment_shift';
  priority: 'critical' | 'high' | 'medium' | 'low';
  visitorId: string;
  visitor: {
    id: string;
    name?: string;
    email?: string;
    location: string;
    value: number;
    engagementScore: number;
    conversionProbability: number;
    churnRisk: number;
    segment: string;
    lastActivity: Date;
    deviceType: string;
    source: string;
  };
  title: string;
  message: string;
  description: string;
  predictedImpact: {
    revenue: number;
    probability: number;
    timeframe: string;
  };
  recommendedActions: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    channel: 'email' | 'sms' | 'push' | 'chat' | 'phone' | 'in-app';
    automation: boolean;
  }>;
  triggers: {
    conditions: string[];
    thresholds: Record<string, number>;
    timeWindow: string;
  };
  aiInsights: {
    confidence: number;
    reasoning: string[];
    similarCases: number;
    successRate: number;
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: IntelligentAlert['type'];
  isActive: boolean;
  conditions: Array<{
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'contains' | 'not_contains';
    value: number | string;
    weight: number;
  }>;
  actions: Array<{
    type: 'notification' | 'email' | 'webhook' | 'automation';
    config: Record<string, any>;
  }>;
  schedule: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    timeZone: string;
    activeHours?: {
      start: string;
      end: string;
    };
  };
  priority: IntelligentAlert['priority'];
  cooldown: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  dismissed: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  responseTime: {
    average: number;
    median: number;
    p95: number;
  };
  effectiveness: {
    successRate: number;
    falsePositiveRate: number;
    actionTakenRate: number;
  };
}

interface IntelligentAlertSystemProps {
  visitors: VisitorLocation[];
  enableRealTime?: boolean;
  enableAudio?: boolean;
  enablePush?: boolean;
  onAlertGenerated?: (alert: IntelligentAlert) => void;
  onAlertResolved?: (alert: IntelligentAlert) => void;
  onActionTaken?: (alert: IntelligentAlert, action: string) => void;
  maxAlerts?: number;
  autoResolveAfter?: number; // hours
}

/**
 * Intelligent Alert System Component
 */
export function IntelligentAlertSystem({
  visitors,
  enableRealTime = true,
  enableAudio = false,
  enablePush = true,
  onAlertGenerated,
  onAlertResolved,
  onActionTaken,
  maxAlerts = 100,
  autoResolveAfter = 24
}: IntelligentAlertSystemProps) {
  const [alerts, setAlerts] = useState<IntelligentAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    active: 0,
    resolved: 0,
    dismissed: 0,
    byPriority: {},
    byType: {},
    responseTime: { average: 0, median: 0, p95: 0 },
    effectiveness: { successRate: 0, falsePositiveRate: 0, actionTakenRate: 0 }
  });
  const [selectedAlert, setSelectedAlert] = useState<IntelligentAlert | null>(null);
  const [viewMode, setViewMode] = useState<'alerts' | 'rules' | 'stats' | 'settings'>('alerts');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved' | 'dismissed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(enableRealTime);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [pushEnabled, setPushEnabled] = useState(enablePush);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize alert system
  useEffect(() => {
    initializeAlertSystem();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Real-time monitoring
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    return () => stopMonitoring();
  }, [isMonitoring]);

  // Initialize alert system with default rules
  const initializeAlertSystem = () => {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-value-visitor',
        name: 'High-Value Visitor Alert',
        description: 'Alert when a high-value visitor is detected',
        type: 'high_value_visitor',
        isActive: true,
        conditions: [
          { field: 'value', operator: 'gt', value: 1000, weight: 0.8 },
          { field: 'engagementScore', operator: 'gt', value: 75, weight: 0.6 },
          { field: 'conversionProbability', operator: 'gt', value: 0.7, weight: 0.9 }
        ],
        actions: [
          { type: 'notification', config: { sound: true, desktop: true } },
          { type: 'email', config: { template: 'high_value_visitor', delay: 0 } }
        ],
        schedule: { frequency: 'realtime', timeZone: 'UTC' },
        priority: 'high',
        cooldown: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'churning-customer',
        name: 'Churning Customer Alert',
        description: 'Alert when a customer shows signs of churning',
        type: 'churning_customer',
        isActive: true,
        conditions: [
          { field: 'churnRisk', operator: 'gt', value: 0.8, weight: 1.0 },
          { field: 'lastActivity', operator: 'gt', value: 7, weight: 0.7 },
          { field: 'value', operator: 'gt', value: 500, weight: 0.5 }
        ],
        actions: [
          { type: 'notification', config: { sound: true, desktop: true } },
          { type: 'automation', config: { workflow: 'retention_campaign' } }
        ],
        schedule: { frequency: 'hourly', timeZone: 'UTC' },
        priority: 'critical',
        cooldown: 240,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'conversion-opportunity',
        name: 'Conversion Opportunity Alert',
        description: 'Alert when a visitor shows high conversion potential',
        type: 'conversion_opportunity',
        isActive: true,
        conditions: [
          { field: 'conversionProbability', operator: 'gt', value: 0.85, weight: 0.9 },
          { field: 'engagementScore', operator: 'gt', value: 70, weight: 0.6 },
          { field: 'sessionDuration', operator: 'gt', value: 300, weight: 0.4 }
        ],
        actions: [
          { type: 'notification', config: { sound: false, desktop: true } },
          { type: 'automation', config: { workflow: 'conversion_assist' } }
        ],
        schedule: { frequency: 'realtime', timeZone: 'UTC' },
        priority: 'high',
        cooldown: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setAlertRules(defaultRules);
  };

  // Start monitoring
  const startMonitoring = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      processAlerts();
    }, 30000); // Check every 30 seconds
    
    // Initial check
    processAlerts();
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Process alerts based on rules
  const processAlerts = async () => {
    const activeRules = alertRules.filter(rule => rule.isActive);
    const newAlerts: IntelligentAlert[] = [];

    for (const visitor of visitors) {
      for (const rule of activeRules) {
        const alertCandidate = await evaluateRule(rule, visitor);
        if (alertCandidate) {
          // Check if similar alert already exists
          const existingAlert = alerts.find(a => 
            a.visitorId === visitor.id && 
            a.type === rule.type && 
            a.status === 'active'
          );
          
          if (!existingAlert) {
            newAlerts.push(alertCandidate);
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, maxAlerts));
      
      // Trigger callbacks and notifications
      newAlerts.forEach(alert => {
        onAlertGenerated?.(alert);
        triggerNotifications(alert);
      });
    }

    // Update stats
    updateStats();
  };

  // Evaluate alert rule against visitor
  const evaluateRule = async (rule: AlertRule, visitor: VisitorLocation): Promise<IntelligentAlert | null> => {
    // Simulate visitor enrichment
    const enrichedVisitor = {
      id: visitor.id,
      name: `Visitor ${visitor.id.slice(-4)}`,
      email: `visitor${visitor.id.slice(-4)}@example.com`,
      location: `${visitor.city}, ${visitor.country}`,
      value: Math.random() * 2000,
      engagementScore: Math.random() * 100,
      conversionProbability: Math.random(),
      churnRisk: Math.random(),
      segment: ['high-value', 'new', 'returning', 'at-risk'][Math.floor(Math.random() * 4)],
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
      source: ['organic', 'paid', 'social', 'email'][Math.floor(Math.random() * 4)]
    };

    // Evaluate conditions
    let score = 0;
    let totalWeight = 0;
    
    for (const condition of rule.conditions) {
      const fieldValue = getFieldValue(enrichedVisitor, condition.field);
      const conditionMet = evaluateCondition(fieldValue, condition.operator, condition.value);
      
      if (conditionMet) {
        score += condition.weight;
      }
      totalWeight += condition.weight;
    }

    const confidence = score / totalWeight;
    
    // Check if alert should be triggered
    if (confidence > 0.7) {
      return await generateAlert(rule, enrichedVisitor, confidence);
    }

    return null;
  };

  // Get field value from visitor object
  const getFieldValue = (visitor: any, field: string): any => {
    if (field === 'lastActivity') {
      return Math.floor((Date.now() - visitor.lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    }
    return visitor[field] || 0;
  };

  // Evaluate condition
  const evaluateCondition = (value: any, operator: string, threshold: any): boolean => {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'contains': return String(value).includes(String(threshold));
      case 'not_contains': return !String(value).includes(String(threshold));
      default: return false;
    }
  };

  // Generate alert
  const generateAlert = async (rule: AlertRule, visitor: any, confidence: number): Promise<IntelligentAlert> => {
    const alert: IntelligentAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: rule.type,
      priority: rule.priority,
      visitorId: visitor.id,
      visitor,
      title: getAlertTitle(rule.type, visitor),
      message: getAlertMessage(rule.type, visitor),
      description: getAlertDescription(rule.type, visitor),
      predictedImpact: {
        revenue: calculatePredictedRevenue(rule.type, visitor),
        probability: confidence,
        timeframe: getTimeframe(rule.type)
      },
      recommendedActions: getRecommendedActions(rule.type, visitor),
      triggers: {
        conditions: rule.conditions.map(c => `${c.field} ${c.operator} ${c.value}`),
        thresholds: rule.conditions.reduce((acc, c) => ({ ...acc, [c.field]: c.value }), {}),
        timeWindow: rule.schedule.frequency
      },
      aiInsights: {
        confidence,
        reasoning: getAIReasoning(rule.type, visitor),
        similarCases: Math.floor(Math.random() * 100),
        successRate: Math.random() * 0.3 + 0.7
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [rule.type, visitor.segment, visitor.deviceType],
      metadata: { ruleId: rule.id, visitorData: visitor }
    };

    return alert;
  };

  // Get alert title
  const getAlertTitle = (type: string, visitor: any): string => {
    switch (type) {
      case 'high_value_visitor':
        return `High-Value Visitor Detected: ${visitor.name}`;
      case 'churning_customer':
        return `Churn Risk Alert: ${visitor.name}`;
      case 'conversion_opportunity':
        return `Conversion Opportunity: ${visitor.name}`;
      default:
        return `Alert: ${visitor.name}`;
    }
  };

  // Get alert message
  const getAlertMessage = (type: string, visitor: any): string => {
    switch (type) {
      case 'high_value_visitor':
        return `A high-value visitor (${visitor.value.toFixed(0)} value) from ${visitor.location} is currently active.`;
      case 'churning_customer':
        return `Customer ${visitor.name} shows high churn risk (${(visitor.churnRisk * 100).toFixed(0)}%) and needs attention.`;
      case 'conversion_opportunity':
        return `Visitor ${visitor.name} has high conversion probability (${(visitor.conversionProbability * 100).toFixed(0)}%) and should be engaged.`;
      default:
        return `Alert for visitor ${visitor.name}`;
    }
  };

  // Get alert description
  const getAlertDescription = (type: string, visitor: any): string => {
    switch (type) {
      case 'high_value_visitor':
        return `This visitor has demonstrated high value potential with an engagement score of ${visitor.engagementScore.toFixed(0)} and conversion probability of ${(visitor.conversionProbability * 100).toFixed(0)}%. Immediate attention recommended.`;
      case 'churning_customer':
        return `This customer has not been active for ${Math.floor((Date.now() - visitor.lastActivity.getTime()) / (1000 * 60 * 60 * 24))} days and shows concerning engagement patterns. Retention efforts should be prioritized.`;
      case 'conversion_opportunity':
        return `This visitor is showing strong buying signals with high engagement and optimal timing. A timely intervention could significantly increase conversion likelihood.`;
      default:
        return `Alert triggered for visitor ${visitor.name}`;
    }
  };

  // Calculate predicted revenue
  const calculatePredictedRevenue = (type: string, visitor: any): number => {
    switch (type) {
      case 'high_value_visitor':
        return visitor.value * visitor.conversionProbability;
      case 'churning_customer':
        return visitor.value * 0.5; // Potential lost revenue
      case 'conversion_opportunity':
        return visitor.value * visitor.conversionProbability * 1.2;
      default:
        return visitor.value * 0.3;
    }
  };

  // Get timeframe
  const getTimeframe = (type: string): string => {
    switch (type) {
      case 'high_value_visitor':
        return 'next 24 hours';
      case 'churning_customer':
        return 'next 7 days';
      case 'conversion_opportunity':
        return 'next 4 hours';
      default:
        return 'next 48 hours';
    }
  };

  // Get recommended actions
  const getRecommendedActions = (type: string, visitor: any) => {
    switch (type) {
      case 'high_value_visitor':
        return [
          {
            action: 'Send personalized offer',
            description: 'Create and send a tailored offer based on visitor behavior',
            priority: 'high' as const,
            effort: 'medium' as const,
            impact: 'high' as const,
            channel: 'email' as const,
            automation: true
          },
          {
            action: 'Trigger live chat',
            description: 'Initiate proactive live chat to assist with decision-making',
            priority: 'high' as const,
            effort: 'low' as const,
            impact: 'high' as const,
            channel: 'chat' as const,
            automation: false
          },
          {
            action: 'Show urgency banner',
            description: 'Display time-sensitive offer or stock availability',
            priority: 'medium' as const,
            effort: 'low' as const,
            impact: 'medium' as const,
            channel: 'in-app' as const,
            automation: true
          }
        ];
      case 'churning_customer':
        return [
          {
            action: 'Launch retention campaign',
            description: 'Start automated retention email sequence',
            priority: 'high' as const,
            effort: 'low' as const,
            impact: 'high' as const,
            channel: 'email' as const,
            automation: true
          },
          {
            action: 'Offer special discount',
            description: 'Provide exclusive discount to re-engage',
            priority: 'high' as const,
            effort: 'medium' as const,
            impact: 'high' as const,
            channel: 'email' as const,
            automation: true
          },
          {
            action: 'Schedule follow-up call',
            description: 'Personal outreach to understand concerns',
            priority: 'medium' as const,
            effort: 'high' as const,
            impact: 'high' as const,
            channel: 'phone' as const,
            automation: false
          }
        ];
      case 'conversion_opportunity':
        return [
          {
            action: 'Display exit-intent popup',
            description: 'Show compelling offer when visitor attempts to leave',
            priority: 'high' as const,
            effort: 'low' as const,
            impact: 'high' as const,
            channel: 'in-app' as const,
            automation: true
          },
          {
            action: 'Send cart abandonment email',
            description: 'Remind about items in cart with incentive',
            priority: 'medium' as const,
            effort: 'low' as const,
            impact: 'medium' as const,
            channel: 'email' as const,
            automation: true
          },
          {
            action: 'Enable smart recommendations',
            description: 'Show AI-powered product recommendations',
            priority: 'medium' as const,
            effort: 'low' as const,
            impact: 'medium' as const,
            channel: 'in-app' as const,
            automation: true
          }
        ];
      default:
        return [];
    }
  };

  // Get AI reasoning
  const getAIReasoning = (type: string, visitor: any): string[] => {
    switch (type) {
      case 'high_value_visitor':
        return [
          'High engagement score indicates strong interest',
          'Premium location suggests higher purchasing power',
          'Extended session duration shows serious consideration',
          'Multiple page views indicate product research behavior'
        ];
      case 'churning_customer':
        return [
          'Extended period without activity indicates disengagement',
          'Declining engagement score over time',
          'Historical pattern matches churning customers',
          'Reduced response rate to communications'
        ];
      case 'conversion_opportunity':
        return [
          'Current behavior matches successful conversion patterns',
          'Optimal timing based on historical data',
          'High engagement with key product pages',
          'Strong intent signals from user actions'
        ];
      default:
        return ['Alert triggered based on predefined criteria'];
    }
  };

  // Trigger notifications
  const triggerNotifications = (alert: IntelligentAlert) => {
    // Audio notification
    if (audioEnabled && alert.priority === 'critical') {
      playNotificationSound();
    }

    // Push notification
    if (pushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/icon-192x192.png',
        tag: alert.id
      });
    }

    // Desktop notification
    if (document.visibilityState === 'hidden') {
      document.title = `🔔 ${alert.title}`;
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Update stats
  const updateStats = () => {
    const total = alerts.length;
    const active = alerts.filter(a => a.status === 'active').length;
    const resolved = alerts.filter(a => a.status === 'resolved').length;
    const dismissed = alerts.filter(a => a.status === 'dismissed').length;

    const byPriority = alerts.reduce((acc, alert) => {
      acc[alert.priority] = (acc[alert.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      total,
      active,
      resolved,
      dismissed,
      byPriority,
      byType,
      responseTime: {
        average: Math.random() * 60 + 30, // 30-90 minutes
        median: Math.random() * 45 + 25, // 25-70 minutes
        p95: Math.random() * 120 + 90 // 90-210 minutes
      },
      effectiveness: {
        successRate: Math.random() * 0.3 + 0.7, // 70-100%
        falsePositiveRate: Math.random() * 0.1 + 0.05, // 5-15%
        actionTakenRate: Math.random() * 0.4 + 0.6 // 60-100%
      }
    });
  };

  // Resolve alert
  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const, resolvedAt: new Date() }
        : alert
    ));
    
    const resolvedAlert = alerts.find(a => a.id === alertId);
    if (resolvedAlert) {
      onAlertResolved?.(resolvedAlert);
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'dismissed' as const, updatedAt: new Date() }
        : alert
    ));
  };

  // Take action
  const takeAction = (alert: IntelligentAlert, action: string) => {
    onActionTaken?.(alert, action);
    
    // Mark alert as acknowledged
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, status: 'acknowledged' as const, updatedAt: new Date() }
        : a
    ));
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'high_value_visitor': return Star;
      case 'churning_customer': return AlertTriangle;
      case 'conversion_opportunity': return Target;
      case 'anomaly_detected': return Eye;
      case 'segment_shift': return TrendingUp;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Intelligent Alert System
          </CardTitle>
          <CardDescription>
            AI-powered alerts for high-value visitors and conversion opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isMonitoring} 
                  onCheckedChange={setIsMonitoring}
                />
                <span className="text-sm">Real-time monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={audioEnabled} 
                  onCheckedChange={setAudioEnabled}
                />
                <span className="text-sm">Audio alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={setPushEnabled}
                />
                <span className="text-sm">Push notifications</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {stats.active} active
              </Badge>
              <Badge variant="outline">
                {stats.total} total
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="text-2xl font-bold">{stats.byPriority.critical || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">High Priority</span>
            </div>
            <div className="text-2xl font-bold">{stats.byPriority.high || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <div className="text-2xl font-bold">{stats.responseTime.average.toFixed(0)}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold">{(stats.effectiveness.successRate * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              return (
                <Card key={alert.id} className={`cursor-pointer transition-all ${
                  selectedAlert?.id === alert.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedAlert(alert)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        getPriorityColor(alert.priority)
                      }`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant="outline">{alert.priority}</Badge>
                          <Badge variant="secondary">{alert.visitor.segment}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Impact: ${alert.predictedImpact.revenue.toFixed(0)}</span>
                          <span>Confidence: {(alert.aiInsights.confidence * 100).toFixed(0)}%</span>
                          <span>Created: {alert.createdAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                resolveAlert(alert.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissAlert(alert.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts found</p>
                <p className="text-sm">Adjust filters or check back later</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{rule.name}</span>
                    <Switch checked={rule.isActive} />
                  </CardTitle>
                  <CardDescription>{rule.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Conditions</h4>
                      <div className="space-y-2">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{condition.field}</Badge>
                            <span>{condition.operator}</span>
                            <span className="font-medium">{condition.value}</span>
                            <span className="text-muted-foreground">(weight: {condition.weight})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {rule.actions.map((action, index) => (
                          <Badge key={index} variant="secondary">
                            {action.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
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
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average</span>
                    <span className="font-medium">{stats.responseTime.average.toFixed(0)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Median</span>
                    <span className="font-medium">{stats.responseTime.median.toFixed(0)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95th Percentile</span>
                    <span className="font-medium">{stats.responseTime.p95.toFixed(0)} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Real-time monitoring</Label>
                  <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Audio notifications</Label>
                  <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push notifications</Label>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Max alerts to keep</Label>
                  <Input type="number" value={maxAlerts} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Auto-resolve after (hours)</Label>
                  <Input type="number" value={autoResolveAfter} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
        <source src="/notification.ogg" type="audio/ogg" />
      </audio>
    </div>
  );
}

export default IntelligentAlertSystem;