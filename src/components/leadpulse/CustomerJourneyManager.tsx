'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  Building,
  Globe,
  Eye,
  MousePointer,
  FileText,
  MessageSquare,
  Calendar,
  Target,
  TrendingUp,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  MoreHorizontal,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  Brain,
  Activity,
  Download,
  Share2,
  Tag,
  Send,
  UserPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface CustomerTouchpoint {
  id: string;
  timestamp: string;
  type: 'page_view' | 'form_submission' | 'email_click' | 'phone_call' | 'meeting' | 'download' | 'chat' | 'support_ticket';
  title: string;
  description: string;
  page?: string;
  source?: string;
  duration?: number;
  value?: number;
  metadata?: Record<string, any>;
}

interface CustomerProfile {
  id: string;
  visitorId?: string; // Link to original anonymous visitor
  
  // Basic Information
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  
  // Demographics & Geography
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  
  // Behavioral Data
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  conversionDate: string;
  
  // Lead Scoring
  leadScore: number;
  engagementLevel: 'cold' | 'warm' | 'hot' | 'qualified';
  conversionProbability: number;
  
  // Journey Data
  currentStage: 'awareness' | 'consideration' | 'decision' | 'customer' | 'advocate';
  touchpoints: CustomerTouchpoint[];
  tags: string[];
  
  // Business Value
  estimatedValue: number;
  actualValue?: number;
  lifetimeValue?: number;
  
  // AI Insights
  personalityType: string;
  interests: string[];
  nextBestAction: string;
  churnRisk: 'low' | 'medium' | 'high';
  
  // Campaign Attribution
  originalSource: string;
  attributedCampaigns: string[];
  
  // Status
  status: 'new' | 'contacted' | 'qualified' | 'opportunity' | 'customer' | 'churned';
  assignedTo?: string;
}

interface JourneyStage {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  avgDuration: number;
  conversionRate: number;
  dropoffRate: number;
}

interface CustomerJourneyManagerProps {
  className?: string;
}

export default function CustomerJourneyManager({ className }: CustomerJourneyManagerProps) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>([]);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'leadScore' | 'estimatedValue'>('lastSeen');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTouchpoint, setExpandedTouchpoint] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [filterStage, filterStatus, sortBy]);

  const fetchCustomerData = async () => {
    try {
      setIsLoading(true);
      const [customersRes, stagesRes] = await Promise.all([
        fetch(`/api/v2/leadpulse/customers?stage=${filterStage}&status=${filterStatus}&sort=${sortBy}&search=${searchQuery}`),
        fetch('/api/v2/leadpulse/journey-stages')
      ]);

      if (customersRes.ok && stagesRes.ok) {
        const customersData = await customersRes.json();
        const stagesData = await stagesRes.json();
        
        setCustomers(customersData.customers);
        setJourneyStages(stagesData.stages);
        
        if (customersData.customers.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customersData.customers[0]);
        }
      } else {
        // Use mock data for demo
        const mockCustomers = generateMockCustomers();
        const mockStages = generateMockStages();
        setCustomers(mockCustomers);
        setJourneyStages(mockStages);
        
        if (mockCustomers.length > 0) {
          setSelectedCustomer(mockCustomers[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      const mockCustomers = generateMockCustomers();
      const mockStages = generateMockStages();
      setCustomers(mockCustomers);
      setJourneyStages(mockStages);
      
      if (mockCustomers.length > 0) {
        setSelectedCustomer(mockCustomers[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockStages = (): JourneyStage[] => {
    return [
      {
        id: 'awareness',
        name: 'Awareness',
        description: 'Customer discovers your brand',
        customerCount: 1250,
        avgDuration: 3,
        conversionRate: 15.2,
        dropoffRate: 84.8
      },
      {
        id: 'consideration',
        name: 'Consideration',
        description: 'Customer evaluates your solution',
        customerCount: 190,
        avgDuration: 7,
        conversionRate: 32.1,
        dropoffRate: 67.9
      },
      {
        id: 'decision',
        name: 'Decision',
        description: 'Customer ready to purchase',
        customerCount: 61,
        avgDuration: 4,
        conversionRate: 68.9,
        dropoffRate: 31.1
      },
      {
        id: 'customer',
        name: 'Customer',
        description: 'Active paying customer',
        customerCount: 42,
        avgDuration: 365,
        conversionRate: 85.7,
        dropoffRate: 14.3
      },
      {
        id: 'advocate',
        name: 'Advocate',
        description: 'Customer promotes your brand',
        customerCount: 36,
        avgDuration: 730,
        conversionRate: 95.0,
        dropoffRate: 5.0
      }
    ];
  };

  const generateMockCustomers = (): CustomerProfile[] => {
    const locations = [
      { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos' },
      { city: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi' },
      { city: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg' },
      { city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
      { city: 'Abuja', country: 'Nigeria', timezone: 'Africa/Lagos' }
    ];

    const companies = ['Flutterwave', 'Paystack', 'Interswitch', 'Kuda Bank', 'Carbon', 'PiggyVest', 'Cowrywise', 'Chipper Cash'];
    const stages = ['awareness', 'consideration', 'decision', 'customer', 'advocate'];
    const statuses = ['new', 'contacted', 'qualified', 'opportunity', 'customer'];
    const sources = ['Google Organic', 'LinkedIn', 'Twitter', 'Direct', 'Email Campaign', 'Referral'];

    return Array.from({ length: 25 }, (_, i) => {
      const location = locations[Math.floor(Math.random() * locations.length)];
      const stage = stages[Math.floor(Math.random() * stages.length)] as any;
      const conversionDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      return {
        id: `customer_${i}`,
        visitorId: `visitor_${i}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+234${Math.floor(Math.random() * 900000000) + 100000000}`,
        company: companies[Math.floor(Math.random() * companies.length)],
        jobTitle: ['CEO', 'CTO', 'Product Manager', 'Marketing Director', 'Operations Manager'][Math.floor(Math.random() * 5)],
        location,
        firstSeen: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        totalSessions: Math.floor(Math.random() * 20) + 1,
        totalPageViews: Math.floor(Math.random() * 100) + 10,
        avgSessionDuration: Math.floor(Math.random() * 300) + 60,
        conversionDate: conversionDate.toISOString(),
        leadScore: Math.floor(Math.random() * 100),
        engagementLevel: ['cold', 'warm', 'hot', 'qualified'][Math.floor(Math.random() * 4)] as any,
        conversionProbability: Math.floor(Math.random() * 100),
        currentStage: stage,
        touchpoints: generateMockTouchpoints(5 + Math.floor(Math.random() * 10)),
        tags: ['Nigerian Market', 'Enterprise', 'High Intent', 'Mobile User'].slice(0, Math.floor(Math.random() * 3) + 1),
        estimatedValue: Math.floor(Math.random() * 50000) + 5000,
        actualValue: Math.random() > 0.7 ? Math.floor(Math.random() * 30000) + 10000 : undefined,
        personalityType: ['Analytical', 'Driver', 'Expressive', 'Amiable'][Math.floor(Math.random() * 4)],
        interests: ['Fintech', 'Mobile Banking', 'Digital Payments', 'APIs', 'Security'].slice(0, Math.floor(Math.random() * 3) + 1),
        nextBestAction: [
          'Schedule demo call',
          'Send pricing information',
          'Invite to webinar',
          'Share case study',
          'Connect with sales'
        ][Math.floor(Math.random() * 5)],
        churnRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        originalSource: sources[Math.floor(Math.random() * sources.length)],
        attributedCampaigns: ['Q1 Growth Campaign', 'Fintech Summit 2024'].slice(0, Math.floor(Math.random() * 2) + 1),
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        assignedTo: Math.random() > 0.5 ? `Sales Rep ${Math.floor(Math.random() * 5) + 1}` : undefined
      };
    });
  };

  const generateMockTouchpoints = (count: number): CustomerTouchpoint[] => {
    const types = ['page_view', 'form_submission', 'email_click', 'phone_call', 'meeting', 'download', 'chat'] as const;
    const pages = ['/pricing', '/demo', '/contact', '/solutions', '/about', '/blog/fintech-trends'];
    const sources = ['email', 'organic', 'direct', 'social', 'paid'];

    return Array.from({ length: count }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const timestamp = new Date(Date.now() - (count - i) * 2 * 60 * 60 * 1000);
      
      return {
        id: `touchpoint_${i}`,
        timestamp: timestamp.toISOString(),
        type,
        title: getTouchpointTitle(type),
        description: getTouchpointDescription(type),
        page: type === 'page_view' ? pages[Math.floor(Math.random() * pages.length)] : undefined,
        source: sources[Math.floor(Math.random() * sources.length)],
        duration: type === 'page_view' ? Math.floor(Math.random() * 300) + 30 : undefined,
        value: type === 'form_submission' ? Math.floor(Math.random() * 100) + 10 : undefined,
        metadata: {
          device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
          browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)]
        }
      };
    });
  };

  const getTouchpointTitle = (type: string): string => {
    const titles = {
      page_view: 'Page View',
      form_submission: 'Form Submission',
      email_click: 'Email Click',
      phone_call: 'Phone Call',
      meeting: 'Meeting Scheduled',
      download: 'Resource Download',
      chat: 'Live Chat',
      support_ticket: 'Support Request'
    };
    return titles[type as keyof typeof titles] || 'Activity';
  };

  const getTouchpointDescription = (type: string): string => {
    const descriptions = {
      page_view: 'Viewed page content',
      form_submission: 'Submitted contact form',
      email_click: 'Clicked email campaign link',
      phone_call: 'Inbound phone inquiry',
      meeting: 'Booked demo meeting',
      download: 'Downloaded whitepaper',
      chat: 'Started live chat session',
      support_ticket: 'Created support ticket'
    };
    return descriptions[type as keyof typeof descriptions] || 'Customer activity';
  };

  const getTouchpointIcon = (type: string) => {
    const icons = {
      page_view: Eye,
      form_submission: FileText,
      email_click: Mail,
      phone_call: Phone,
      meeting: Calendar,
      download: Download,
      chat: MessageSquare,
      support_ticket: AlertTriangle
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const getStageColor = (stage: string) => {
    const colors = {
      awareness: 'bg-blue-100 text-blue-800',
      consideration: 'bg-yellow-100 text-yellow-800',
      decision: 'bg-orange-100 text-orange-800',
      customer: 'bg-green-100 text-green-800',
      advocate: 'bg-purple-100 text-purple-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEngagementColor = (level: string) => {
    const colors = {
      cold: 'bg-gray-100 text-gray-800',
      warm: 'bg-yellow-100 text-yellow-800',
      hot: 'bg-red-100 text-red-800',
      qualified: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      opportunity: 'bg-purple-100 text-purple-800',
      customer: 'bg-green-100 text-green-800',
      churned: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  // Filter customers based on search and filters
  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = filterStage === 'all' || customer.currentStage === filterStage;
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      
      return matchesSearch && matchesStage && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'leadScore':
          return b.leadScore - a.leadScore;
        case 'estimatedValue':
          return b.estimatedValue - a.estimatedValue;
        case 'lastSeen':
        default:
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      }
    });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 animate-pulse" />
            <span>Loading customer journeys...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Journey Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCustomerData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Journey Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Stages Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {journeyStages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStageColor(stage.id)} mb-2`}>
                    <span className="font-semibold">{stage.customerCount}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{stage.name}</h3>
                  <p className="text-xs text-gray-600 text-center mb-1">{stage.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {stage.conversionRate}% convert
                  </Badge>
                </div>
                {index < journeyStages.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Customers ({filteredCustomers.length})</CardTitle>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {journeyStages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastSeen">Last Seen</SelectItem>
                    <SelectItem value="leadScore">Lead Score</SelectItem>
                    <SelectItem value="estimatedValue">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{customer.name}</h3>
                        <p className="text-xs text-gray-600 truncate">{customer.company}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${getEngagementColor(customer.engagementLevel)}`}>
                          {customer.engagementLevel}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <Badge className={getStageColor(customer.currentStage)}>
                        {customer.currentStage}
                      </Badge>
                      <span className="text-gray-500">{formatTimeAgo(customer.lastSeen)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Score: {customer.leadScore}</span>
                      <span className="font-medium text-green-600">{formatCurrency(customer.estimatedValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {selectedCustomer ? (
                  <>
                    <User className="w-5 h-5" />
                    {selectedCustomer.name}
                  </>
                ) : (
                  'Select a customer to view journey'
                )}
              </CardTitle>
              {selectedCustomer && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Phone className="w-4 h-4 mr-2" />
                      Schedule Call
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tag
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="journey">Journey</TabsTrigger>
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Contact Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{selectedCustomer.email}</span>
                          </div>
                          {selectedCustomer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span>{selectedCustomer.phone}</span>
                            </div>
                          )}
                          {selectedCustomer.company && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span>{selectedCustomer.company}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{selectedCustomer.location.city}, {selectedCustomer.location.country}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Lead Scoring</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Lead Score</span>
                              <span className="font-medium">{selectedCustomer.leadScore}/100</span>
                            </div>
                            <Progress value={selectedCustomer.leadScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">Conversion Probability</span>
                              <span className="font-medium">{selectedCustomer.conversionProbability}%</span>
                            </div>
                            <Progress value={selectedCustomer.conversionProbability} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Current Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Stage:</span>
                            <Badge className={getStageColor(selectedCustomer.currentStage)}>
                              {selectedCustomer.currentStage}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge className={getStatusColor(selectedCustomer.status)}>
                              {selectedCustomer.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Engagement:</span>
                            <Badge className={getEngagementColor(selectedCustomer.engagementLevel)}>
                              {selectedCustomer.engagementLevel}
                            </Badge>
                          </div>
                          {selectedCustomer.assignedTo && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Assigned to:</span>
                              <span className="text-sm font-medium">{selectedCustomer.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-3">Business Value</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Value:</span>
                            <span className="font-medium text-green-600">{formatCurrency(selectedCustomer.estimatedValue)}</span>
                          </div>
                          {selectedCustomer.actualValue && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Actual Value:</span>
                              <span className="font-medium text-green-600">{formatCurrency(selectedCustomer.actualValue)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sessions:</span>
                            <span className="font-medium">{selectedCustomer.totalSessions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Page Views:</span>
                            <span className="font-medium">{selectedCustomer.totalPageViews}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Tags & Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {selectedCustomer.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="journey" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Customer Touchpoints</h3>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {selectedCustomer.touchpoints
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((touchpoint, index) => {
                            const Icon = getTouchpointIcon(touchpoint.type);
                            const isExpanded = expandedTouchpoint === touchpoint.id;
                            
                            return (
                              <div key={touchpoint.id} className="border rounded-lg">
                                <div
                                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => setExpandedTouchpoint(isExpanded ? null : touchpoint.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Icon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">{touchpoint.title}</h4>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500">
                                            {formatTimeAgo(touchpoint.timestamp)}
                                          </span>
                                          {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600">{touchpoint.description}</p>
                                      {touchpoint.page && (
                                        <p className="text-xs text-blue-600">{touchpoint.page}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-3 pb-3 border-t bg-gray-50">
                                    <div className="pt-3 grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-600">Source:</span>
                                        <span className="font-medium ml-1">{touchpoint.source}</span>
                                      </div>
                                      {touchpoint.duration && (
                                        <div>
                                          <span className="text-gray-600">Duration:</span>
                                          <span className="font-medium ml-1">{touchpoint.duration}s</span>
                                        </div>
                                      )}
                                      {touchpoint.value && (
                                        <div>
                                          <span className="text-gray-600">Value:</span>
                                          <span className="font-medium ml-1">{touchpoint.value} points</span>
                                        </div>
                                      )}
                                      {touchpoint.metadata?.device && (
                                        <div>
                                          <span className="text-gray-600">Device:</span>
                                          <span className="font-medium ml-1">{touchpoint.metadata.device}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          Personality Profile
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="font-medium">{selectedCustomer.personalityType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Churn Risk:</span>
                            <Badge className={
                              selectedCustomer.churnRisk === 'high' ? 'bg-red-100 text-red-800' :
                              selectedCustomer.churnRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {selectedCustomer.churnRisk}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-600" />
                          Next Best Action
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-3">{selectedCustomer.nextBestAction}</p>
                        <Button size="sm" className="w-full">
                          <Zap className="w-4 h-4 mr-2" />
                          Take Action
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Attribution Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Original Source</h4>
                          <Badge variant="outline">{selectedCustomer.originalSource}</Badge>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Attributed Campaigns</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCustomer.attributedCampaigns.map((campaign, index) => (
                              <Badge key={index} variant="secondary">{campaign}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button className="h-16 flex-col">
                      <Mail className="w-6 h-6 mb-1" />
                      Send Email
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Phone className="w-6 h-6 mb-1" />
                      Schedule Call
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <Calendar className="w-6 h-6 mb-1" />
                      Book Meeting
                    </Button>
                    <Button variant="outline" className="h-16 flex-col">
                      <FileText className="w-6 h-6 mb-1" />
                      Send Proposal
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Input placeholder="Add a note about this customer..." />
                        <Button size="sm">
                          <Send className="w-4 h-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a customer from the left to view their journey details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}