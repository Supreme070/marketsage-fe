/**
 * TechFlow Simulation Engine for MarketSage
 * Real-time African fintech market simulation with quantum optimization
 */

import { quantumIntegration } from '../quantum';

export interface SimulationConfig {
  market: 'NGN' | 'KES' | 'GHS' | 'ZAR' | 'EGP' | 'ALL';
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  scenario: 'normal' | 'peak-hours' | 'market-shock' | 'festival-season' | 'regulatory-change';
  enableQuantum: boolean;
  realTimeUpdates: boolean;
}

export interface MarketConditions {
  economicStability: number; // 0-1
  regulatoryClarity: number; // 0-1
  internetConnectivity: number; // 0-1
  mobilePenetration: number; // 0-1
  competitorActivity: number; // 0-1
  seasonalFactors: number; // 0-1
}

export interface SimulationMetrics {
  totalTransactions: number;
  conversionRate: number;
  revenueGenerated: number;
  customerAcquisition: number;
  channelPerformance: Record<string, number>;
  geographicDistribution: Record<string, number>;
  quantumAdvantage: number;
  simulationAccuracy: number;
}

export interface SimulationEvent {
  id: string;
  timestamp: Date;
  type: 'transaction' | 'conversion' | 'engagement' | 'system' | 'market';
  market: string;
  channel: string;
  data: any;
  impact: number;
  quantumPredicted: boolean;
}

export class TechFlowSimulationEngine {
  private isRunning = false;
  private simulationId: string | null = null;
  private eventCallbacks: ((event: SimulationEvent) => void)[] = [];
  private marketConditions: Record<string, MarketConditions> = {};
  private simulationMetrics: SimulationMetrics;
  
  constructor() {
    this.simulationMetrics = this.initializeMetrics();
    this.initializeMarketConditions();
  }

  /**
   * Start TechFlow simulation with quantum optimization
   */
  async startSimulation(config: SimulationConfig): Promise<string> {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.simulationId = `techflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.isRunning = true;
    
    console.log(`🚀 Starting TechFlow simulation: ${this.simulationId}`);
    console.log(`Market: ${config.market}, Duration: ${config.duration}min, Scenario: ${config.scenario}`);

    // Initialize quantum-enhanced market simulation
    if (config.enableQuantum) {
      await this.initializeQuantumSimulation(config);
    }

    // Start simulation loops
    this.startMarketSimulation(config);
    this.startCustomerBehaviorSimulation(config);
    this.startTransactionSimulation(config);
    
    if (config.realTimeUpdates) {
      this.startRealTimeUpdates(config);
    }

    // Auto-stop after duration
    setTimeout(() => {
      this.stopSimulation();
    }, config.duration * 60 * 1000);

    return this.simulationId;
  }

  /**
   * Stop running simulation
   */
  stopSimulation(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log(`⏹️ TechFlow simulation stopped: ${this.simulationId}`);
    
    // Emit final metrics
    this.emitEvent({
      id: `final_${Date.now()}`,
      timestamp: new Date(),
      type: 'system',
      market: 'ALL',
      channel: 'system',
      data: { 
        finalMetrics: this.simulationMetrics,
        simulationId: this.simulationId 
      },
      impact: 0,
      quantumPredicted: false
    });
  }

  /**
   * Register event callback for real-time updates
   */
  onEvent(callback: (event: SimulationEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Get current simulation metrics
   */
  getMetrics(): SimulationMetrics {
    return { ...this.simulationMetrics };
  }

  /**
   * Get current market conditions
   */
  getMarketConditions(market?: string): MarketConditions | Record<string, MarketConditions> {
    if (market) {
      return this.marketConditions[market] || this.marketConditions['NGN'];
    }
    return { ...this.marketConditions };
  }

  // Private simulation methods
  private async initializeQuantumSimulation(config: SimulationConfig): Promise<void> {
    // Use quantum algorithms to predict optimal simulation parameters
    try {
      const optimizationResult = await quantumIntegration.optimizeForAfricanMarkets(
        {
          simulationConfig: config,
          marketConditions: this.marketConditions
        },
        'fintech'
      );

      if (optimizationResult.success) {
        console.log(`🔬 Quantum optimization applied. Advantage: ${optimizationResult.quantumAdvantage}`);
        this.simulationMetrics.quantumAdvantage = optimizationResult.quantumAdvantage;
      }
    } catch (error) {
      console.warn('Quantum optimization failed, using classical simulation:', error);
    }
  }

  private startMarketSimulation(config: SimulationConfig): void {
    const markets = config.market === 'ALL' 
      ? ['NGN', 'KES', 'GHS', 'ZAR', 'EGP'] 
      : [config.market];

    const updateInterval = this.getUpdateInterval(config.intensity);

    const marketLoop = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(marketLoop);
        return;
      }

      markets.forEach(market => {
        this.simulateMarketConditions(market, config);
      });
    }, updateInterval);
  }

  private startCustomerBehaviorSimulation(config: SimulationConfig): void {
    const behaviorInterval = this.getUpdateInterval(config.intensity) * 2;

    const behaviorLoop = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(behaviorLoop);
        return;
      }

      this.simulateCustomerBehavior(config);
    }, behaviorInterval);
  }

  private startTransactionSimulation(config: SimulationConfig): void {
    const transactionInterval = this.getUpdateInterval(config.intensity) / 3;

    const transactionLoop = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(transactionLoop);
        return;
      }

      this.simulateTransactions(config);
    }, transactionInterval);
  }

  private startRealTimeUpdates(config: SimulationConfig): void {
    const updateInterval = 1000; // 1 second

    const updateLoop = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(updateLoop);
        return;
      }

      this.broadcastRealTimeUpdate(config);
    }, updateInterval);
  }

  private simulateMarketConditions(market: string, config: SimulationConfig): void {
    const conditions = this.marketConditions[market];
    if (!conditions) return;

    // Apply scenario-based changes
    const scenarioImpact = this.getScenarioImpact(config.scenario);
    
    // Simulate natural market fluctuations
    const volatility = this.getMarketVolatility(config.intensity);
    
    conditions.economicStability += (Math.random() - 0.5) * volatility * scenarioImpact.economic;
    conditions.regulatoryClarity += (Math.random() - 0.5) * volatility * scenarioImpact.regulatory;
    conditions.internetConnectivity += (Math.random() - 0.5) * volatility * 0.1;
    conditions.competitorActivity += (Math.random() - 0.5) * volatility * scenarioImpact.competition;
    
    // Clamp values between 0 and 1
    Object.keys(conditions).forEach(key => {
      conditions[key as keyof MarketConditions] = Math.max(0, Math.min(1, conditions[key as keyof MarketConditions]));
    });

    // Emit market update event
    this.emitEvent({
      id: `market_${Date.now()}_${market}`,
      timestamp: new Date(),
      type: 'market',
      market,
      channel: 'system',
      data: { conditions: { ...conditions } },
      impact: volatility,
      quantumPredicted: false
    });
  }

  private simulateCustomerBehavior(config: SimulationConfig): void {
    const channels = ['email', 'sms', 'whatsapp', 'mobile-app', 'web'];
    const markets = config.market === 'ALL' 
      ? ['NGN', 'KES', 'GHS', 'ZAR', 'EGP'] 
      : [config.market];

    markets.forEach(market => {
      channels.forEach(channel => {
        const engagementProbability = this.calculateEngagementProbability(market, channel, config);
        
        if (Math.random() < engagementProbability) {
          const customersEngaged = Math.floor(Math.random() * 50) + 1;
          
          this.simulationMetrics.channelPerformance[channel] = 
            (this.simulationMetrics.channelPerformance[channel] || 0) + customersEngaged;
          
          this.simulationMetrics.geographicDistribution[market] = 
            (this.simulationMetrics.geographicDistribution[market] || 0) + customersEngaged;

          this.emitEvent({
            id: `engagement_${Date.now()}_${market}_${channel}`,
            timestamp: new Date(),
            type: 'engagement',
            market,
            channel,
            data: { 
              customersEngaged,
              engagementType: this.getRandomEngagementType()
            },
            impact: customersEngaged / 100,
            quantumPredicted: Math.random() > 0.7 // 30% quantum predicted
          });
        }
      });
    });
  }

  private simulateTransactions(config: SimulationConfig): void {
    const markets = config.market === 'ALL' 
      ? ['NGN', 'KES', 'GHS', 'ZAR', 'EGP'] 
      : [config.market];

    markets.forEach(market => {
      const transactionProbability = this.calculateTransactionProbability(market, config);
      
      if (Math.random() < transactionProbability) {
        const transactionValue = this.generateTransactionValue(market);
        const isConversion = Math.random() < this.calculateConversionProbability(market, config);
        
        this.simulationMetrics.totalTransactions++;
        this.simulationMetrics.revenueGenerated += transactionValue;
        
        if (isConversion) {
          this.simulationMetrics.customerAcquisition++;
          this.simulationMetrics.conversionRate = 
            this.simulationMetrics.customerAcquisition / this.simulationMetrics.totalTransactions;
        }

        this.emitEvent({
          id: `transaction_${Date.now()}_${market}`,
          timestamp: new Date(),
          type: isConversion ? 'conversion' : 'transaction',
          market,
          channel: this.getRandomChannel(),
          data: {
            value: transactionValue,
            currency: this.getMarketCurrency(market),
            paymentMethod: this.getRandomPaymentMethod(market),
            isConversion
          },
          impact: transactionValue / 100000,
          quantumPredicted: Math.random() > 0.6 // 40% quantum predicted
        });
      }
    });
  }

  private broadcastRealTimeUpdate(config: SimulationConfig): void {
    const liveMetrics = {
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      transactionsPerSecond: Math.floor(Math.random() * 50) + 10,
      conversionRate: this.simulationMetrics.conversionRate,
      revenueToday: this.simulationMetrics.revenueGenerated,
      topMarket: this.getTopPerformingMarket(),
      quantumAdvantage: this.simulationMetrics.quantumAdvantage
    };

    this.emitEvent({
      id: `realtime_${Date.now()}`,
      timestamp: new Date(),
      type: 'system',
      market: 'ALL',
      channel: 'dashboard',
      data: liveMetrics,
      impact: 0,
      quantumPredicted: false
    });
  }

  private emitEvent(event: SimulationEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });
  }

  // Helper methods
  private initializeMetrics(): SimulationMetrics {
    return {
      totalTransactions: 0,
      conversionRate: 0,
      revenueGenerated: 0,
      customerAcquisition: 0,
      channelPerformance: {},
      geographicDistribution: {},
      quantumAdvantage: 0,
      simulationAccuracy: 0.85
    };
  }

  private initializeMarketConditions(): void {
    this.marketConditions = {
      NGN: {
        economicStability: 0.65,
        regulatoryClarity: 0.70,
        internetConnectivity: 0.65,
        mobilePenetration: 0.92,
        competitorActivity: 0.80,
        seasonalFactors: 0.75
      },
      KES: {
        economicStability: 0.75,
        regulatoryClarity: 0.85,
        internetConnectivity: 0.45,
        mobilePenetration: 0.95,
        competitorActivity: 0.70,
        seasonalFactors: 0.80
      },
      GHS: {
        economicStability: 0.70,
        regulatoryClarity: 0.75,
        internetConnectivity: 0.58,
        mobilePenetration: 0.88,
        competitorActivity: 0.60,
        seasonalFactors: 0.85
      },
      ZAR: {
        economicStability: 0.60,
        regulatoryClarity: 0.80,
        internetConnectivity: 0.68,
        mobilePenetration: 0.91,
        competitorActivity: 0.85,
        seasonalFactors: 0.70
      },
      EGP: {
        economicStability: 0.55,
        regulatoryClarity: 0.65,
        internetConnectivity: 0.57,
        mobilePenetration: 0.94,
        competitorActivity: 0.75,
        seasonalFactors: 0.80
      }
    };
  }

  private getUpdateInterval(intensity: string): number {
    switch (intensity) {
      case 'low': return 5000; // 5 seconds
      case 'medium': return 3000; // 3 seconds
      case 'high': return 1000; // 1 second
      case 'extreme': return 500; // 0.5 seconds
      default: return 3000;
    }
  }

  private getScenarioImpact(scenario: string): any {
    switch (scenario) {
      case 'peak-hours':
        return { economic: 1.2, regulatory: 1.0, competition: 1.5 };
      case 'market-shock':
        return { economic: 0.3, regulatory: 0.7, competition: 2.0 };
      case 'festival-season':
        return { economic: 1.5, regulatory: 1.0, competition: 1.3 };
      case 'regulatory-change':
        return { economic: 0.8, regulatory: 0.4, competition: 1.1 };
      default:
        return { economic: 1.0, regulatory: 1.0, competition: 1.0 };
    }
  }

  private getMarketVolatility(intensity: string): number {
    switch (intensity) {
      case 'low': return 0.02;
      case 'medium': return 0.05;
      case 'high': return 0.10;
      case 'extreme': return 0.20;
      default: return 0.05;
    }
  }

  private calculateEngagementProbability(market: string, channel: string, config: SimulationConfig): number {
    const baseProb = 0.1;
    const conditions = this.marketConditions[market];
    
    const channelMultiplier = {
      'mobile-app': conditions.mobilePenetration,
      'whatsapp': conditions.mobilePenetration * 0.9,
      'sms': conditions.mobilePenetration * 0.8,
      'email': conditions.internetConnectivity,
      'web': conditions.internetConnectivity * 0.7
    };

    return baseProb * (channelMultiplier[channel as keyof typeof channelMultiplier] || 0.5) * 
           conditions.economicStability;
  }

  private calculateTransactionProbability(market: string, config: SimulationConfig): number {
    const conditions = this.marketConditions[market];
    const baseProb = 0.05;
    
    return baseProb * conditions.economicStability * conditions.regulatoryClarity;
  }

  private calculateConversionProbability(market: string, config: SimulationConfig): number {
    const conditions = this.marketConditions[market];
    return 0.12 * conditions.regulatoryClarity * (1 + this.simulationMetrics.quantumAdvantage);
  }

  private generateTransactionValue(market: string): number {
    const baseCurrency = {
      NGN: 50000,   // ₦50,000
      KES: 5000,    // KSh 5,000
      GHS: 500,     // GH₵ 500
      ZAR: 1000,    // R 1,000
      EGP: 1500     // £E 1,500
    };

    const base = baseCurrency[market as keyof typeof baseCurrency] || 1000;
    return Math.floor(base * (0.5 + Math.random() * 2)); // 50% to 250% of base
  }

  private getRandomChannel(): string {
    const channels = ['email', 'sms', 'whatsapp', 'mobile-app', 'web'];
    return channels[Math.floor(Math.random() * channels.length)];
  }

  private getRandomEngagementType(): string {
    const types = ['click', 'open', 'reply', 'share', 'forward', 'download'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getRandomPaymentMethod(market: string): string {
    const methods = {
      NGN: ['mobile-money', 'bank-transfer', 'cards', 'ussd'],
      KES: ['mpesa', 'bank-transfer', 'airtel-money', 'cards'],
      GHS: ['mobile-money', 'bank-transfer', 'cards'],
      ZAR: ['cards', 'eft', 'mobile-payment', 'crypto'],
      EGP: ['cards', 'mobile-wallet', 'bank-transfer']
    };

    const marketMethods = methods[market as keyof typeof methods] || ['bank-transfer'];
    return marketMethods[Math.floor(Math.random() * marketMethods.length)];
  }

  private getMarketCurrency(market: string): string {
    const currencies = {
      NGN: 'Nigerian Naira',
      KES: 'Kenyan Shilling',
      GHS: 'Ghanaian Cedi',
      ZAR: 'South African Rand',
      EGP: 'Egyptian Pound'
    };

    return currencies[market as keyof typeof currencies] || 'USD';
  }

  private getTopPerformingMarket(): string {
    const markets = Object.keys(this.simulationMetrics.geographicDistribution);
    if (markets.length === 0) return 'NGN';
    
    return markets.reduce((top, market) => 
      this.simulationMetrics.geographicDistribution[market] > 
      this.simulationMetrics.geographicDistribution[top] ? market : top
    );
  }
}

// Export singleton instance
export const techFlowEngine = new TechFlowSimulationEngine();