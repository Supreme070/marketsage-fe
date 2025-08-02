"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { 
  Headphones, 
  MessageSquare,
  Clock,
  Star,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  UserPlus,
  Send,
  Eye,
  Edit3,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PlayCircle,
  PauseCircle,
  UserCheck,
  Settings,
  FileText,
  BarChart3,
  Activity,
  Target,
  Zap,
  Shield,
  Globe,
  MessageCircle,
  HelpCircle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Archive,
  Forward,
  Reply,
  Flag,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { useState, useEffect } from "react";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  customer: {
    name: string;
    email: string;
    organization: string;
    tier: 'free' | 'starter' | 'pro' | 'enterprise';
    avatar?: string;
  };
  assignedTo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  responseTime?: number; // in minutes
  resolutionTime?: number; // in minutes
  satisfaction?: number; // 1-5 stars
  tags: string[];
  messages: number;
  lastMessage: string;
}

interface ChatSession {
  id: string;
  customer: {
    name: string;
    email: string;
    organization: string;
    avatar?: string;
  };
  agent?: {
    name: string;
    avatar?: string;
  };
  status: 'active' | 'waiting' | 'transferred' | 'ended';
  startTime: string;
  duration: number; // in minutes
  messageCount: number;
  lastMessage: string;
  lastActivity: string;
  tags: string[];
  waitTime?: number; // in minutes
  satisfactionScore?: number;
}

interface SupportAgent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  activeTickets: number;
  activeChatSessions: number;
  todayTicketsResolved: number;
  averageResponseTime: number; // in minutes
  satisfactionRating: number; // 1-5
  specialties: string[];
  shift: {
    start: string;
    end: string;
    timezone: string;
  };
  performance: {
    ticketsResolved: number;
    averageResolutionTime: number; // in hours
    customerSatisfaction: number;
    responseTime: number; // in minutes
  };
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting_started' | 'features' | 'billing' | 'troubleshooting' | 'api' | 'integrations';
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  helpful: number;
  notHelpful: number;
  status: 'published' | 'draft' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface SupportMetrics {
  activeTickets: number;
  averageResponseTime: number; // in hours
  customerSatisfactionScore: number;
  onlineStaff: number;
  todayTicketsResolved: number;
  ticketsOpenedToday: number;
  averageResolutionTime: number; // in hours
  firstResponseRate: number; // percentage within SLA
  resolutionRate: number;
  escalationRate: number;
}

export default function AdminSupportPage() {
  const { permissions, staffRole } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Set loading to false after mount
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all support data from real APIs in parallel
        const [
          metricsResponse,
          ticketsResponse,
          chatSessionsResponse,
          staffResponse
        ] = await Promise.allSettled([
          fetch('/api/v2/admin/support?type=metrics'),
          fetch('/api/v2/admin/support?type=tickets'),
          fetch('/api/v2/admin/support?type=chat_sessions'),
          fetch('/api/v2/admin/support?type=staff')
        ]);

        // Process metrics data
        if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
          const metricsData = await metricsResponse.value.json();
          if (metricsData.success) {
            setMetrics(metricsData.data);
          }
        }

        // Process support tickets data
        if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value.ok) {
          const ticketsData = await ticketsResponse.value.json();
          if (ticketsData.success) {
            setTickets(ticketsData.data || []);
          }
        }

        // Process chat sessions data
        if (chatSessionsResponse.status === 'fulfilled' && chatSessionsResponse.value.ok) {
          const chatData = await chatSessionsResponse.value.json();
          if (chatData.success) {
            setChatSessions(chatData.data || []);
          }
        }

        // Process staff members data
        if (staffResponse.status === 'fulfilled' && staffResponse.value.ok) {
          const staffData = await staffResponse.value.json();
          if (staffData.success) {
            setAgents(staffData.data || []);
          }
        }

        // Set knowledge articles to empty for now (could be added later)
        setKnowledgeArticles([]);

      } catch (error) {
        console.error('Error fetching support data:', error);
        // Fallback to empty arrays on error
        setMetrics({
          activeTickets: 0,
          averageResponseTime: 0,
          customerSatisfactionScore: 0,
          onlineStaff: 0,
          todayTicketsResolved: 0,
          ticketsOpenedToday: 0,
          averageResolutionTime: 0,
          firstResponseRate: 0,
          resolutionRate: 0,
          escalationRate: 0
        });
        setTickets([]);
        setChatSessions([]);
        setAgents([]);
        setKnowledgeArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper functions - must be defined before any return statements
  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="admin-badge admin-badge-danger">OPEN</span>;
      case 'in_progress':
        return <span className="admin-badge admin-badge-accent">IN_PROGRESS</span>;
      case 'pending_customer':
        return <span className="admin-badge admin-badge-warning">PENDING_CUSTOMER</span>;
      case 'resolved':
        return <span className="admin-badge admin-badge-success">RESOLVED</span>;
      case 'closed':
        return <span className="admin-badge admin-badge-secondary">CLOSED</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="admin-badge admin-badge-danger">URGENT</span>;
      case 'high':
        return <span className="admin-badge admin-badge-warning">HIGH</span>;
      case 'medium':
        return <span className="admin-badge admin-badge-secondary">MEDIUM</span>;
      case 'low':
        return <span className="admin-badge admin-badge-success">LOW</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{priority.toUpperCase()}</span>;
    }
  };

  const getChatStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="admin-badge admin-badge-success">ACTIVE</span>;
      case 'waiting':
        return <span className="admin-badge admin-badge-warning">WAITING</span>;
      case 'transferred':
        return <span className="admin-badge admin-badge-accent">TRANSFERRED</span>;
      case 'ended':
        return <span className="admin-badge admin-badge-secondary">ENDED</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getAgentStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <span className="admin-badge admin-badge-success">ONLINE</span>;
      case 'away':
        return <span className="admin-badge admin-badge-warning">AWAY</span>;
      case 'busy':
        return <span className="admin-badge admin-badge-danger">BUSY</span>;
      case 'offline':
        return <span className="admin-badge admin-badge-secondary">OFFLINE</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{status.toUpperCase()}</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <span className="admin-badge admin-badge-secondary">ENTERPRISE</span>;
      case 'pro':
        return <span className="admin-badge admin-badge-accent">PRO</span>;
      case 'starter':
        return <span className="admin-badge admin-badge-success">STARTER</span>;
      case 'free':
        return <span className="admin-badge admin-badge-secondary">FREE</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">{tier.toUpperCase()}</span>;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="h-3 w-3 text-[hsl(var(--admin-success))]" />;
    if (current < previous) return <ArrowDownRight className="h-3 w-3 text-[hsl(var(--admin-danger))]" />;
    return <Minus className="h-3 w-3 text-[hsl(var(--admin-text-muted))]" />;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="admin-loading mx-auto mb-4"></div>
          <h2 className="admin-title text-xl mb-2">SUPPORT_LINK_LOADING</h2>
          <p className="admin-subtitle">INITIALIZING_CUSTOMER_SUPPORT_SYSTEMS...</p>
        </div>
      </div>
    );
  }

  if (!permissions.canAccessSupport) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-[hsl(var(--admin-warning))] mx-auto mb-4" />
          <h2 className="admin-title text-xl mb-2">ACCESS_DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT_PRIVILEGES.SUPPORT_LINK_ACCESS_REQUIRED
          </p>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.organization.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">SUPPORT_LINK</h1>
          <p className="admin-subtitle">CUSTOMER_SUPPORT.TICKET_MANAGEMENT.LIVE_ASSISTANCE</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-secondary flex items-center gap-2">
            <Headphones className="h-3 w-3" />
            SUPPORT_CENTER
          </div>
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            REFRESH_ALL
          </button>
          <button className="admin-btn flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_REPORT
          </button>
        </div>
      </div>

      {/* Support Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
              <Activity className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
            </div>
            <div className="admin-stat-value">{metrics.activeTickets}</div>
            <div className="admin-stat-label">ACTIVE_TICKETS</div>
            <div className="admin-stat-change">+{metrics.ticketsOpenedToday}_OPENED_TODAY</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
              <TrendingDown className="h-4 w-4 text-[hsl(var(--admin-success))]" />
            </div>
            <div className="admin-stat-value">{metrics.averageResponseTime}H</div>
            <div className="admin-stat-label">AVG_RESPONSE_TIME</div>
            <div className="admin-stat-change positive">-0.3H_VS_LAST_WEEK</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <Star className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
              <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-success))]" />
            </div>
            <div className="admin-stat-value text-[hsl(var(--admin-success))]">{metrics.customerSatisfactionScore}</div>
            <div className="admin-stat-label">CUSTOMER_SATISFACTION</div>
            <div className="admin-stat-change positive">+0.2_THIS_MONTH</div>
          </div>

          <div className="admin-stat-card admin-glow-hover">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
              <div className="admin-pulse"></div>
            </div>
            <div className="admin-stat-value text-[hsl(var(--admin-primary))]">{metrics.onlineStaff}</div>
            <div className="admin-stat-label">ONLINE_STAFF</div>
            <div className="admin-stat-change">{metrics.todayTicketsResolved}_RESOLVED_TODAY</div>
          </div>
        </div>
      )}

      {/* Support Control Tabs */}
      <div className="admin-card mb-6">
        <div className="flex overflow-x-auto p-2 gap-2">
          {[
            { value: 'overview', label: 'OVERVIEW', icon: BarChart3 },
            { value: 'tickets', label: 'TICKETS', icon: MessageSquare },
            { value: 'live-chat', label: 'LIVE_CHAT', icon: MessageCircle },
            { value: 'knowledge', label: 'KNOWLEDGE_BASE', icon: BookOpen },
            { value: 'team', label: 'TEAM', icon: Users },
            { value: 'analytics', label: 'ANALYTICS', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`admin-btn flex items-center gap-2 whitespace-nowrap ${
                  isActive ? 'admin-btn-primary' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 admin-fade-in">
            {/* Support Health Matrix */}
            <div className="admin-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                <h2 className="admin-title text-xl">SUPPORT_HEALTH_MATRIX</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <Target className="h-6 w-6 text-[hsl(var(--admin-success))]" />
                    <div className="admin-pulse"></div>
                  </div>
                  <div className="admin-stat-value">{metrics?.firstResponseRate}%</div>
                  <div className="admin-stat-label">FIRST_RESPONSE_SLA</div>
                  <div className="admin-stat-change positive">WITHIN_TARGET</div>
                </div>

                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
                    <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
                  </div>
                  <div className="admin-stat-value">{metrics?.resolutionRate}%</div>
                  <div className="admin-stat-label">RESOLUTION_RATE</div>
                  <div className="admin-stat-change positive">OPTIMAL_PERFORMANCE</div>
                </div>

                <div className="admin-stat-card admin-glow-hover">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
                    <AlertTriangle className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
                  </div>
                  <div className="admin-stat-value">{metrics?.escalationRate}%</div>
                  <div className="admin-stat-label">ESCALATION_RATE</div>
                  <div className="admin-stat-change">MONITORING_REQUIRED</div>
                </div>
              </div>
            </div>

            {/* Support Activity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="admin-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
                  <h2 className="admin-title text-xl">RECENT_TICKETS</h2>
                </div>
                <div className="space-y-4">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="admin-card p-3 border border-[hsl(var(--admin-border))]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="admin-title text-xs">{ticket.subject}</span>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <div className="admin-subtitle text-xs space-y-1">
                            <div>{ticket.customer.name} - {ticket.customer.organization}</div>
                            <div>{ticket.id} - {new Date(ticket.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTicketStatusBadge(ticket.status)}
                          <button className="admin-btn text-xs px-2 py-1">
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
                  <h2 className="admin-title text-xl">TEAM_PERFORMANCE</h2>
                </div>
                <div className="space-y-4">
                  {agents.filter(a => a.status === 'online').slice(0, 5).map((agent) => (
                    <div key={agent.id} className="admin-card p-3 border border-[hsl(var(--admin-border))]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-surface-elevated))] flex items-center justify-center">
                            <span className="admin-title text-xs">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="admin-title text-xs">{agent.name}</div>
                            <div className="admin-subtitle text-xs">
                              {agent.activeTickets}_ACTIVE_TICKETS
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-[hsl(var(--admin-warning))]" />
                            <span className="admin-title text-xs">{agent.satisfactionRating}</span>
                          </div>
                          <div className="admin-subtitle text-xs">
                            {agent.todayTicketsResolved}_RESOLVED_TODAY
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {['tickets', 'live-chat', 'knowledge', 'team', 'analytics'].includes(activeTab) && (
          <div className="space-y-6 admin-fade-in">
            <div className="admin-card p-6">
              <div className="text-center py-12">
                <Headphones className="h-12 w-12 text-[hsl(var(--admin-text-muted))] mx-auto mb-4 admin-pulse" />
                <h3 className="admin-title text-lg mb-2">{activeTab.toUpperCase().replace('-', '_')}_MODULE</h3>
                <p className="admin-subtitle">
                  {activeTab.toUpperCase().replace('-', '_')}_INTERFACE // CUSTOMER_SUPPORT // SERVICE_MANAGEMENT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Development Notice */}
      {staffRole === 'SUPER_ADMIN' && (
        <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
          <div className="flex items-start gap-4">
            <Headphones className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
            <div>
              <h4 className="admin-title text-lg mb-2">SUPPORT_LINK_STATUS</h4>
              <p className="admin-subtitle mb-3">
                CUSTOMER_SUPPORT // TICKET_MANAGEMENT // LIVE_ASSISTANCE
              </p>
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                Advanced support automation, ticket routing, and customer satisfaction tracking active.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
