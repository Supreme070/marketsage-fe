/**
 * Master Simulation Controller for MarketSage
 * Single source of truth for all application data simulation
 * Controls dashboard, AI intelligence, LeadPulse, conversions, and all metrics
 */

import { techFlowEngine, type SimulationConfig, type SimulationEvent } from './techflow-engine';

export interface MasterSimulationState {
  isRunning: boolean;
  simulationId: string | null;
  startTime: Date | null;
  
  // Dashboard KPIs
  dashboard: {
    revenueToday: number;
    activeVisitors: number;
    conversionRate: number;
    activeCampaigns: number;
    aiAdvantage: number;
  };
  
  // LeadPulse Analytics
  leadpulse: {
    totalVisitors: number;
    heatmapClicks: number;
    journeyCompletions: number;
    behaviorScore: number;
    insights: number;
  };
  
  // Conversion Tracking
  conversions: {
    totalConversions: number;
    conversionRate: number;
    revenue: number;
    costPerConversion: number;
    topChannels: Array<{
      name: string;
      conversions: number;
      rate: number;
      trend: 'up' | 'down';
    }>;
  };
  
  // AI Intelligence
  ai: {
    tasksProcessed: number;
    successRate: number;
    aiAdvantage: number;
    chatInteractions: number;
    predictions: number;
  };
  
  // Campaign Performance
  campaigns: {
    email: { sent: number; opened: number; clicked: number; conversions: number };
    sms: { sent: number; delivered: number; replied: number; conversions: number };
    whatsapp: { sent: number; delivered: number; replied: number; conversions: number };
    workflows: { active: number; triggered: number; completed: number };
  };
  
  // Geographic Distribution
  geography: {
    NGN: { visitors: number; revenue: number; conversions: number };
    KES: { visitors: number; revenue: number; conversions: number };
    GHS: { visitors: number; revenue: number; conversions: number };
    ZAR: { visitors: number; revenue: number; conversions: number };
    EGP: { visitors: number; revenue: number; conversions: number };
  };
}

class MasterSimulationController {
  private state: MasterSimulationState;
  private eventCallbacks: ((state: MasterSimulationState) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 2000; // 2 seconds

  constructor() {
    this.state = this.getInitialState();
  }

  /**
   * Get initial state - all metrics at 0 (production ready)
   */
  private getInitialState(): MasterSimulationState {
    return {
      isRunning: false,
      simulationId: null,
      startTime: null,
      
      dashboard: {
        revenueToday: 0,
        activeVisitors: 0,
        conversionRate: 0,
        activeCampaigns: 0,
        aiAdvantage: 0,
      },
      
      leadpulse: {
        totalVisitors: 0,
        heatmapClicks: 0,
        journeyCompletions: 0,
        behaviorScore: 0,
        insights: 0,
      },
      
      conversions: {
        totalConversions: 0,
        conversionRate: 0,
        revenue: 0,
        costPerConversion: 0,
        topChannels: [
          { name: 'Email', conversions: 0, rate: 0, trend: 'up' },
          { name: 'WhatsApp', conversions: 0, rate: 0, trend: 'up' },
          { name: 'SMS', conversions: 0, rate: 0, trend: 'up' },
          { name: 'Workflows', conversions: 0, rate: 0, trend: 'up' }
        ],
      },
      
      ai: {
        tasksProcessed: 0,
        successRate: 0.95, // This can start at base level
        aiAdvantage: 0,
        chatInteractions: 0,
        predictions: 0,
      },
      
      campaigns: {
        email: { sent: 0, opened: 0, clicked: 0, conversions: 0 },
        sms: { sent: 0, delivered: 0, replied: 0, conversions: 0 },
        whatsapp: { sent: 0, delivered: 0, replied: 0, conversions: 0 },
        workflows: { active: 0, triggered: 0, completed: 0 },
      },
      
      geography: {
        NGN: { visitors: 0, revenue: 0, conversions: 0 },
        KES: { visitors: 0, revenue: 0, conversions: 0 },
        GHS: { visitors: 0, revenue: 0, conversions: 0 },
        ZAR: { visitors: 0, revenue: 0, conversions: 0 },
        EGP: { visitors: 0, revenue: 0, conversions: 0 },
      },
    };
  }

  /**
   * Start the master simulation - triggers everything
   */
  async startSimulation(config: SimulationConfig): Promise<string> {
    if (this.state.isRunning) {
      throw new Error('Simulation already running');
    }

    // Reset to initial state
    this.state = this.getInitialState();
    
    // Start simulation
    this.state.isRunning = true;
    this.state.simulationId = `master_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state.startTime = new Date();

    // Initialize with realistic starting values
    this.state.dashboard.activeVisitors = Math.floor(Math.random() * 15) + 5; // 5-20 initial active visitors
    this.state.leadpulse.totalVisitors = Math.floor(Math.random() * 50) + 50; // 50-100 total historical visitors

    console.log(`🚀 Starting Master MarketSage Simulation: ${this.state.simulationId}`);

    // Start TechFlow engine
    const techFlowId = await techFlowEngine.startSimulation(config);
    
    // Listen to TechFlow events and update all metrics
    techFlowEngine.onEvent(this.handleTechFlowEvent.bind(this));
    
    // Start periodic updates for all modules
    this.startPeriodicUpdates();

    // Notify all listeners
    this.notifyListeners();

    return this.state.simulationId;
  }

  /**
   * Stop the master simulation
   */
  stopSimulation(): void {
    if (!this.state.isRunning) return;

    console.log(`⏹️ Stopping Master MarketSage Simulation: ${this.state.simulationId}`);

    // Stop TechFlow engine
    techFlowEngine.stopSimulation();
    
    // Stop periodic updates
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Reset to initial state
    this.state = this.getInitialState();
    
    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Handle events from TechFlow engine and update all metrics
   */
  private handleTechFlowEvent(event: SimulationEvent): void {
    if (!this.state.isRunning) return;

    const market = event.market;
    const impact = event.impact;

    switch (event.type) {
      case 'transaction':
        this.updateFromTransaction(event, market, impact);
        break;
        
      case 'conversion':
        this.updateFromConversion(event, market, impact);
        break;
        
      case 'engagement':
        this.updateFromEngagement(event, market, impact);
        break;
        
      case 'market':
        this.updateFromMarketChange(event, market, impact);
        break;
        
      case 'system':
        this.updateFromSystemEvent(event);
        break;
    }

    // Recalculate derived metrics
    this.recalculateMetrics();
    
    // Notify all listeners
    this.notifyListeners();
  }

  private updateFromTransaction(event: SimulationEvent, market: string, impact: number): void {
    const value = event.data.value || 0;
    
    // Update dashboard
    this.state.dashboard.revenueToday += value;
    
    // Update conversions if it's a conversion transaction
    if (event.data.isConversion) {
      this.state.conversions.totalConversions += 1;
      this.state.conversions.revenue += value;
      
      // Update channel performance
      const channel = this.getChannelName(event.channel);
      const channelData = this.state.conversions.topChannels.find(c => c.name === channel);
      if (channelData) {
        channelData.conversions += 1;
      }
    }
    
    // Update geography
    if (market in this.state.geography) {
      this.state.geography[market as keyof typeof this.state.geography].revenue += value;
      if (event.data.isConversion) {
        this.state.geography[market as keyof typeof this.state.geography].conversions += 1;
      }
    }

    // Update AI metrics (processing for transactions)
    if (event.data?.aiPredicted) {
      this.state.ai.tasksProcessed += 1;
      this.state.ai.aiAdvantage = Math.min(0.95, this.state.ai.aiAdvantage + 0.01);
      this.state.dashboard.aiAdvantage = this.state.ai.aiAdvantage;
    }
  }

  private updateFromConversion(event: SimulationEvent, market: string, impact: number): void {
    // Update conversions
    this.state.conversions.totalConversions += 1;
    
    // Update LeadPulse
    this.state.leadpulse.journeyCompletions += 1;
    this.state.leadpulse.behaviorScore = Math.min(100, this.state.leadpulse.behaviorScore + 2);
    
    // Update campaigns based on channel
    this.updateCampaignMetrics(event.channel, 'conversion');
  }

  private updateFromEngagement(event: SimulationEvent, market: string, impact: number): void {
    const engaged = event.data.customersEngaged || 1;
    
    // Add to total visitors (cumulative/historical)
    this.state.leadpulse.totalVisitors += engaged;
    
    // Update active visitors with realistic limits (max 100 concurrent)
    const currentActive = this.state.dashboard.activeVisitors;
    const newActiveVisitors = Math.min(engaged, Math.max(0, 100 - currentActive));
    this.state.dashboard.activeVisitors += newActiveVisitors;
    
    // Ensure active visitors never exceed reasonable limits
    this.state.dashboard.activeVisitors = Math.min(this.state.dashboard.activeVisitors, 100);
    
    this.state.leadpulse.heatmapClicks += Math.floor(engaged * 0.3); // 30% click-through
    
    // Update geography with total visitors (not active)
    if (market in this.state.geography) {
      this.state.geography[market as keyof typeof this.state.geography].visitors += engaged;
    }
    
    // Update campaigns
    this.updateCampaignMetrics(event.channel, 'engagement');
    
    // Update AI interactions
    this.state.ai.chatInteractions += Math.floor(engaged * 0.1); // 10% chat interaction rate
  }

  private updateFromMarketChange(event: SimulationEvent, market: string, impact: number): void {
    // Market conditions affect all metrics slightly
    const multiplier = 1 + (impact * 0.1);
    
    // Adjust visitor flow based on market conditions (but respect active visitor limits)
    const visitorAdjustment = Math.floor(impact * 5); // Reduced impact
    const currentActive = this.state.dashboard.activeVisitors;
    
    if (impact > 0) {
      // Positive market conditions - add visitors but stay under limit
      const newActive = Math.min(100, currentActive + Math.abs(visitorAdjustment));
      this.state.dashboard.activeVisitors = newActive;
    } else {
      // Negative market conditions - remove some visitors
      const newActive = Math.max(0, currentActive - Math.abs(visitorAdjustment));
      this.state.dashboard.activeVisitors = newActive;
    }
  }

  private updateFromSystemEvent(event: SimulationEvent): void {
    if (event.data.liveMetrics) {
      // Update from real-time metrics
      const metrics = event.data.liveMetrics;
      this.state.dashboard.activeVisitors = metrics.activeUsers || this.state.dashboard.activeVisitors;
    }
  }

  private updateCampaignMetrics(channel: string, type: 'engagement' | 'conversion'): void {
    const increment = type === 'conversion' ? 1 : Math.floor(Math.random() * 5) + 1;
    
    switch (channel) {
      case 'email':
        if (type === 'engagement') {
          this.state.campaigns.email.sent += increment;
          this.state.campaigns.email.opened += Math.floor(increment * 0.6);
          this.state.campaigns.email.clicked += Math.floor(increment * 0.15);
        } else {
          this.state.campaigns.email.conversions += increment;
        }
        break;
        
      case 'sms':
        if (type === 'engagement') {
          this.state.campaigns.sms.sent += increment;
          this.state.campaigns.sms.delivered += Math.floor(increment * 0.95);
          this.state.campaigns.sms.replied += Math.floor(increment * 0.08);
        } else {
          this.state.campaigns.sms.conversions += increment;
        }
        break;
        
      case 'whatsapp':
        if (type === 'engagement') {
          this.state.campaigns.whatsapp.sent += increment;
          this.state.campaigns.whatsapp.delivered += Math.floor(increment * 0.98);
          this.state.campaigns.whatsapp.replied += Math.floor(increment * 0.25);
        } else {
          this.state.campaigns.whatsapp.conversions += increment;
        }
        break;
        
      case 'workflow':
      case 'automation':
        if (type === 'engagement') {
          this.state.campaigns.workflows.triggered += increment;
          this.state.campaigns.workflows.completed += Math.floor(increment * 0.8);
        }
        break;
    }
  }

  private recalculateMetrics(): void {
    // Calculate conversion rate
    const totalInteractions = this.state.leadpulse.totalVisitors || 1;
    this.state.conversions.conversionRate = (this.state.conversions.totalConversions / totalInteractions) * 100;
    this.state.dashboard.conversionRate = this.state.conversions.conversionRate;
    
    // Calculate cost per conversion
    if (this.state.conversions.totalConversions > 0) {
      this.state.conversions.costPerConversion = Math.floor(this.state.conversions.revenue / this.state.conversions.totalConversions * 0.1);
    }
    
    // Update active campaigns count
    this.state.dashboard.activeCampaigns = 
      (this.state.campaigns.email.sent > 0 ? 1 : 0) +
      (this.state.campaigns.sms.sent > 0 ? 1 : 0) +
      (this.state.campaigns.whatsapp.sent > 0 ? 1 : 0) +
      (this.state.campaigns.workflows.active);
    
    // Update channel performance rates
    this.state.conversions.topChannels.forEach(channel => {
      const campaignData = this.getCampaignData(channel.name);
      if (campaignData && campaignData.sent > 0) {
        channel.rate = (campaignData.conversions / campaignData.sent) * 100;
        // Simple trend calculation
        channel.trend = channel.rate > channel.conversions / 10 ? 'up' : 'down';
      }
    });
    
    // Update LeadPulse insights
    this.state.leadpulse.insights = Math.floor(this.state.leadpulse.totalVisitors / 50);
    
    // Update AI predictions
    this.state.ai.predictions = Math.floor(this.state.ai.tasksProcessed * 1.2);
  }

  private getChannelName(channel: string): string {
    const channelMap: Record<string, string> = {
      'email': 'Email',
      'sms': 'SMS', 
      'whatsapp': 'WhatsApp',
      'mobile-app': 'WhatsApp',
      'web': 'Email',
      'workflow': 'Workflows',
      'automation': 'Workflows'
    };
    return channelMap[channel] || 'Email';
  }

  private getCampaignData(channelName: string) {
    switch (channelName) {
      case 'Email':
        return { sent: this.state.campaigns.email.sent, conversions: this.state.campaigns.email.conversions };
      case 'SMS':
        return { sent: this.state.campaigns.sms.sent, conversions: this.state.campaigns.sms.conversions };
      case 'WhatsApp':
        return { sent: this.state.campaigns.whatsapp.sent, conversions: this.state.campaigns.whatsapp.conversions };
      case 'Workflows':
        return { sent: this.state.campaigns.workflows.triggered, conversions: this.state.campaigns.workflows.completed };
      default:
        return null;
    }
  }

  private startPeriodicUpdates(): void {
    this.intervalId = setInterval(() => {
      if (!this.state.isRunning) return;
      
      // Realistic visitor lifecycle simulation
      const currentActive = this.state.dashboard.activeVisitors;
      
      // New visitors arriving (30% chance)
      if (Math.random() > 0.7) {
        const newVisitors = Math.floor(Math.random() * 3) + 1;
        const canAdd = Math.max(0, 100 - currentActive);
        const actualNewVisitors = Math.min(newVisitors, canAdd);
        
        this.state.dashboard.activeVisitors += actualNewVisitors;
        this.state.leadpulse.totalVisitors += newVisitors; // All new visitors count in total
      }
      
      // Visitors leaving (40% chance)
      if (Math.random() > 0.6 && currentActive > 0) {
        const leavingVisitors = Math.floor(Math.random() * 2) + 1;
        this.state.dashboard.activeVisitors = Math.max(0, currentActive - leavingVisitors);
      }
      
      // Natural visitor decay (simulate session timeouts)
      if (Math.random() > 0.85 && currentActive > 5) {
        this.state.dashboard.activeVisitors = Math.max(5, Math.floor(currentActive * 0.95));
      }
      
      // Ensure active visitors stay within realistic bounds
      this.state.dashboard.activeVisitors = Math.min(this.state.dashboard.activeVisitors, 100);
      this.state.dashboard.activeVisitors = Math.max(this.state.dashboard.activeVisitors, 0);
      
      // Occasional workflow triggers
      if (Math.random() > 0.8) {
        this.state.campaigns.workflows.triggered += 1;
        this.state.campaigns.workflows.active = Math.min(50, this.state.campaigns.workflows.active + 1);
      }
      
      this.recalculateMetrics();
      this.notifyListeners();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: MasterSimulationState) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Get current simulation state
   */
  getState(): MasterSimulationState {
    return { ...this.state };
  }

  /**
   * Check if simulation is running
   */
  isRunning(): boolean {
    return this.state.isRunning;
  }

  private notifyListeners(): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in simulation state callback:', error);
      }
    });
  }
}

// Export singleton instance
export const masterSimulation = new MasterSimulationController();