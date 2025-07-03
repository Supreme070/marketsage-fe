/**
 * Global Geographic Coverage System
 * ===============================
 * Comprehensive geographic data and market intelligence beyond African markets
 * Supporting worldwide expansion and global customer base
 */

export interface MarketData {
  region: string;
  countries: CountryData[];
  economicIndicators: EconomicIndicators;
  digitalAdoption: DigitalAdoptionMetrics;
  marketOpportunity: MarketOpportunity;
  culturalInsights: CulturalInsights;
  regulatoryEnvironment: RegulatoryEnvironment;
}

export interface CountryData {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  capital: string;
  currency: string;
  timezone: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  population: number;
  gdpPerCapita: number;
  internetPenetration: number;
  mobilePenetration: number;
  bankingPenetration: number;
  languages: string[];
  businessHours: {
    start: string;
    end: string;
    timezone: string;
  };
  paymentMethods: PaymentMethod[];
  complianceRequirements: string[];
}

export interface EconomicIndicators {
  gdpGrowthRate: number;
  inflationRate: number;
  unemploymentRate: number;
  currencyStability: 'stable' | 'volatile' | 'hyperinflation';
  creditRating: string;
  easeOfDoingBusiness: number; // World Bank ranking
  corruptionIndex: number; // Transparency International
}

export interface DigitalAdoptionMetrics {
  internetSpeed: {
    mobile: number; // Mbps
    fixed: number; // Mbps
  };
  smartphoneAdoption: number; // percentage
  digitalPaymentAdoption: number; // percentage
  ecommerceGrowth: number; // percentage yearly growth
  socialMediaPenetration: number; // percentage
  cloudAdoption: number; // percentage
}

export interface MarketOpportunity {
  marketSize: {
    value: number; // USD billions
    growth: number; // percentage yearly
  };
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated';
  entryBarriers: string[];
  keyOpportunities: string[];
  threats: string[];
  recommendedStrategy: string;
}

export interface CulturalInsights {
  communicationStyle: 'direct' | 'indirect' | 'mixed';
  businessCulture: string[];
  preferredChannels: string[];
  culturalSensitivities: string[];
  localHolidays: string[];
  workingDays: number[];
  decisionMakingStyle: 'hierarchical' | 'collaborative' | 'individual';
}

export interface RegulatoryEnvironment {
  dataProtectionLaws: string[];
  financialRegulations: string[];
  taxRequirements: string[];
  licenseRequirements: string[];
  reportingRequirements: string[];
  sanctionsRisk: 'low' | 'medium' | 'high';
}

export interface PaymentMethod {
  type: string;
  provider: string;
  adoption: number; // percentage
  processingFee: number; // percentage
  settlementTime: string;
  currencies: string[];
}

class GlobalCoverageManager {
  private static instance: GlobalCoverageManager;
  private marketsData: Map<string, MarketData> = new Map();

  static getInstance(): GlobalCoverageManager {
    if (!this.instance) {
      this.instance = new GlobalCoverageManager();
      this.instance.initializeGlobalData();
    }
    return this.instance;
  }

  /**
   * Initialize global market data
   */
  private initializeGlobalData(): void {
    // North America
    this.marketsData.set('north_america', {
      region: 'North America',
      countries: [
        {
          code: 'US',
          name: 'United States',
          capital: 'Washington D.C.',
          currency: 'USD',
          timezone: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
          coordinates: { latitude: 39.8283, longitude: -98.5795 },
          population: 331900000,
          gdpPerCapita: 70248,
          internetPenetration: 89.4,
          mobilePenetration: 130,
          bankingPenetration: 93,
          languages: ['English', 'Spanish'],
          businessHours: { start: '09:00', end: '17:00', timezone: 'America/New_York' },
          paymentMethods: [
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 85, processingFee: 2.9, settlementTime: '1-2 days', currencies: ['USD'] },
            { type: 'Digital Wallet', provider: 'PayPal', adoption: 76, processingFee: 2.9, settlementTime: 'instant', currencies: ['USD'] },
            { type: 'Bank Transfer', provider: 'ACH', adoption: 68, processingFee: 0.8, settlementTime: '1-3 days', currencies: ['USD'] },
            { type: 'Buy Now Pay Later', provider: 'Klarna/Affirm', adoption: 32, processingFee: 4.2, settlementTime: 'instant', currencies: ['USD'] }
          ],
          complianceRequirements: ['PCI DSS', 'SOX', 'CCPA', 'GLBA', 'BSA']
        },
        {
          code: 'CA',
          name: 'Canada',
          capital: 'Ottawa',
          currency: 'CAD',
          timezone: ['America/Toronto', 'America/Winnipeg', 'America/Vancouver'],
          coordinates: { latitude: 56.1304, longitude: -106.3468 },
          population: 38000000,
          gdpPerCapita: 46195,
          internetPenetration: 94.0,
          mobilePenetration: 88,
          bankingPenetration: 99,
          languages: ['English', 'French'],
          businessHours: { start: '09:00', end: '17:00', timezone: 'America/Toronto' },
          paymentMethods: [
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 89, processingFee: 2.8, settlementTime: '1-2 days', currencies: ['CAD'] },
            { type: 'Interac', provider: 'Interac', adoption: 91, processingFee: 1.2, settlementTime: 'instant', currencies: ['CAD'] },
            { type: 'Digital Wallet', provider: 'PayPal', adoption: 64, processingFee: 2.9, settlementTime: 'instant', currencies: ['CAD'] }
          ],
          complianceRequirements: ['PCI DSS', 'PIPEDA', 'FINTRAC']
        }
      ],
      economicIndicators: {
        gdpGrowthRate: 2.1,
        inflationRate: 3.2,
        unemploymentRate: 3.6,
        currencyStability: 'stable',
        creditRating: 'AAA',
        easeOfDoingBusiness: 6,
        corruptionIndex: 67
      },
      digitalAdoption: {
        internetSpeed: { mobile: 54.8, fixed: 145.3 },
        smartphoneAdoption: 85,
        digitalPaymentAdoption: 78,
        ecommerceGrowth: 14.2,
        socialMediaPenetration: 72,
        cloudAdoption: 81
      },
      marketOpportunity: {
        marketSize: { value: 890, growth: 8.2 },
        competitionLevel: 'saturated',
        entryBarriers: ['High customer acquisition costs', 'Regulatory complexity', 'Established competition'],
        keyOpportunities: ['Fintech innovation', 'B2B solutions', 'Crypto services', 'Embedded finance'],
        threats: ['Regulatory changes', 'Big Tech competition', 'Economic downturn'],
        recommendedStrategy: 'Focus on niche markets and innovative solutions'
      },
      culturalInsights: {
        communicationStyle: 'direct',
        businessCulture: ['Punctuality valued', 'Individual achievement', 'Innovation focus', 'Professional communication'],
        preferredChannels: ['Email', 'Mobile apps', 'Video calls', 'Social media'],
        culturalSensitivities: ['Privacy concerns', 'Transparency expectations', 'Accessibility requirements'],
        localHolidays: ['New Year', 'Independence Day', 'Thanksgiving', 'Christmas'],
        workingDays: [1, 2, 3, 4, 5],
        decisionMakingStyle: 'individual'
      },
      regulatoryEnvironment: {
        dataProtectionLaws: ['CCPA', 'PIPEDA', 'State privacy laws'],
        financialRegulations: ['Dodd-Frank', 'BSA', 'FINTRAC'],
        taxRequirements: ['Federal income tax', 'State taxes', 'Sales tax'],
        licenseRequirements: ['Money transmitter licenses', 'Banking licenses'],
        reportingRequirements: ['FinCEN reporting', 'Anti-money laundering'],
        sanctionsRisk: 'low'
      }
    });

    // Europe
    this.marketsData.set('europe', {
      region: 'Europe',
      countries: [
        {
          code: 'GB',
          name: 'United Kingdom',
          capital: 'London',
          currency: 'GBP',
          timezone: ['Europe/London'],
          coordinates: { latitude: 55.3781, longitude: -3.4360 },
          population: 67000000,
          gdpPerCapita: 42330,
          internetPenetration: 94.9,
          mobilePenetration: 120,
          bankingPenetration: 96,
          languages: ['English'],
          businessHours: { start: '09:00', end: '17:00', timezone: 'Europe/London' },
          paymentMethods: [
            { type: 'Bank Transfer', provider: 'Faster Payments', adoption: 84, processingFee: 0.2, settlementTime: 'instant', currencies: ['GBP'] },
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 82, processingFee: 2.5, settlementTime: '1-2 days', currencies: ['GBP'] },
            { type: 'Open Banking', provider: 'Plaid/TrueLayer', adoption: 31, processingFee: 0.5, settlementTime: 'instant', currencies: ['GBP'] }
          ],
          complianceRequirements: ['FCA', 'PCI DSS', 'GDPR', 'PSD2', 'Strong Customer Authentication']
        },
        {
          code: 'DE',
          name: 'Germany',
          capital: 'Berlin',
          currency: 'EUR',
          timezone: ['Europe/Berlin'],
          coordinates: { latitude: 51.1657, longitude: 10.4515 },
          population: 83000000,
          gdpPerCapita: 46259,
          internetPenetration: 88.0,
          mobilePenetration: 128,
          bankingPenetration: 99,
          languages: ['German'],
          businessHours: { start: '08:00', end: '16:00', timezone: 'Europe/Berlin' },
          paymentMethods: [
            { type: 'SEPA Transfer', provider: 'SEPA', adoption: 89, processingFee: 0.8, settlementTime: '1 day', currencies: ['EUR'] },
            { type: 'Girocard', provider: 'Girocard', adoption: 78, processingFee: 0.3, settlementTime: 'instant', currencies: ['EUR'] },
            { type: 'PayPal', provider: 'PayPal', adoption: 67, processingFee: 2.9, settlementTime: 'instant', currencies: ['EUR'] }
          ],
          complianceRequirements: ['BaFin', 'GDPR', 'PSD2', 'MiCA', 'DORA']
        }
      ],
      economicIndicators: {
        gdpGrowthRate: 1.8,
        inflationRate: 2.4,
        unemploymentRate: 4.1,
        currencyStability: 'stable',
        creditRating: 'AAA',
        easeOfDoingBusiness: 18,
        corruptionIndex: 76
      },
      digitalAdoption: {
        internetSpeed: { mobile: 45.2, fixed: 123.8 },
        smartphoneAdoption: 81,
        digitalPaymentAdoption: 71,
        ecommerceGrowth: 11.7,
        socialMediaPenetration: 58,
        cloudAdoption: 73
      },
      marketOpportunity: {
        marketSize: { value: 520, growth: 6.8 },
        competitionLevel: 'high',
        entryBarriers: ['Regulatory complexity', 'Privacy requirements', 'Established banks'],
        keyOpportunities: ['Open banking', 'Green finance', 'Cross-border payments', 'Digital identity'],
        threats: ['Regulatory changes', 'Economic uncertainty', 'Brexit impact'],
        recommendedStrategy: 'Partner with established institutions and focus on regulatory compliance'
      },
      culturalInsights: {
        communicationStyle: 'direct',
        businessCulture: ['Punctuality critical', 'Formal communication', 'Quality focus', 'Privacy valued'],
        preferredChannels: ['Email', 'Phone', 'In-person meetings', 'WhatsApp'],
        culturalSensitivities: ['Data privacy', 'Environmental concerns', 'Work-life balance'],
        localHolidays: ['Christmas', 'Easter', 'National holidays vary by country'],
        workingDays: [1, 2, 3, 4, 5],
        decisionMakingStyle: 'collaborative'
      },
      regulatoryEnvironment: {
        dataProtectionLaws: ['GDPR', 'ePrivacy Directive', 'National implementations'],
        financialRegulations: ['PSD2', 'MiFID II', 'MiCA', 'DORA'],
        taxRequirements: ['VAT', 'Corporate tax', 'Withholding tax'],
        licenseRequirements: ['Banking licenses', 'Payment institution licenses', 'E-money licenses'],
        reportingRequirements: ['AML reporting', 'Transaction reporting'],
        sanctionsRisk: 'low'
      }
    });

    // Asia Pacific
    this.marketsData.set('asia_pacific', {
      region: 'Asia Pacific',
      countries: [
        {
          code: 'CN',
          name: 'China',
          capital: 'Beijing',
          currency: 'CNY',
          timezone: ['Asia/Shanghai'],
          coordinates: { latitude: 35.8617, longitude: 104.1954 },
          population: 1412000000,
          gdpPerCapita: 12556,
          internetPenetration: 73.0,
          mobilePenetration: 107,
          bankingPenetration: 79,
          languages: ['Mandarin Chinese'],
          businessHours: { start: '09:00', end: '18:00', timezone: 'Asia/Shanghai' },
          paymentMethods: [
            { type: 'Mobile Payment', provider: 'Alipay', adoption: 86, processingFee: 0.6, settlementTime: 'instant', currencies: ['CNY'] },
            { type: 'Mobile Payment', provider: 'WeChat Pay', adoption: 85, processingFee: 0.6, settlementTime: 'instant', currencies: ['CNY'] },
            { type: 'Bank Transfer', provider: 'UnionPay', adoption: 71, processingFee: 1.2, settlementTime: '1 day', currencies: ['CNY'] }
          ],
          complianceRequirements: ['PBOC', 'CBIRC', 'Cybersecurity Law', 'Data Security Law']
        },
        {
          code: 'IN',
          name: 'India',
          capital: 'New Delhi',
          currency: 'INR',
          timezone: ['Asia/Kolkata'],
          coordinates: { latitude: 20.5937, longitude: 78.9629 },
          population: 1380000000,
          gdpPerCapita: 2277,
          internetPenetration: 50.0,
          mobilePenetration: 84,
          bankingPenetration: 80,
          languages: ['Hindi', 'English', 'Regional languages'],
          businessHours: { start: '10:00', end: '18:00', timezone: 'Asia/Kolkata' },
          paymentMethods: [
            { type: 'UPI', provider: 'NPCI', adoption: 67, processingFee: 0.0, settlementTime: 'instant', currencies: ['INR'] },
            { type: 'Digital Wallet', provider: 'Paytm/PhonePe', adoption: 58, processingFee: 1.8, settlementTime: 'instant', currencies: ['INR'] },
            { type: 'Credit Card', provider: 'Visa/Mastercard/RuPay', adoption: 34, processingFee: 2.3, settlementTime: '2-3 days', currencies: ['INR'] }
          ],
          complianceRequirements: ['RBI', 'SEBI', 'IT Act', 'Digital Personal Data Protection Act']
        }
      ],
      economicIndicators: {
        gdpGrowthRate: 5.8,
        inflationRate: 4.2,
        unemploymentRate: 5.3,
        currencyStability: 'stable',
        creditRating: 'BBB-',
        easeOfDoingBusiness: 63,
        corruptionIndex: 45
      },
      digitalAdoption: {
        internetSpeed: { mobile: 28.7, fixed: 67.4 },
        smartphoneAdoption: 68,
        digitalPaymentAdoption: 89,
        ecommerceGrowth: 23.8,
        socialMediaPenetration: 54,
        cloudAdoption: 62
      },
      marketOpportunity: {
        marketSize: { value: 1250, growth: 18.7 },
        competitionLevel: 'medium',
        entryBarriers: ['Regulatory complexity', 'Local competition', 'Cultural adaptation'],
        keyOpportunities: ['Digital payments', 'Financial inclusion', 'Cross-border remittances', 'SME lending'],
        threats: ['Regulatory changes', 'Geopolitical tensions', 'Currency volatility'],
        recommendedStrategy: 'Focus on underserved segments and mobile-first solutions'
      },
      culturalInsights: {
        communicationStyle: 'indirect',
        businessCulture: ['Relationship building', 'Hierarchical structure', 'Long-term perspective', 'Face-saving important'],
        preferredChannels: ['Mobile apps', 'WeChat/WhatsApp', 'In-person meetings', 'Video calls'],
        culturalSensitivities: ['Government relations', 'Local partnerships', 'Cultural holidays', 'Language preferences'],
        localHolidays: ['Chinese New Year', 'Diwali', 'Mid-Autumn Festival', 'National holidays'],
        workingDays: [1, 2, 3, 4, 5, 6],
        decisionMakingStyle: 'hierarchical'
      },
      regulatoryEnvironment: {
        dataProtectionLaws: ['PIPL (China)', 'Digital Personal Data Protection Act (India)', 'Local privacy laws'],
        financialRegulations: ['PBOC regulations', 'RBI guidelines', 'Local banking laws'],
        taxRequirements: ['Corporate income tax', 'VAT/GST', 'Withholding tax'],
        licenseRequirements: ['Payment licenses', 'Banking licenses', 'Foreign investment approvals'],
        reportingRequirements: ['AML/CFT reporting', 'Foreign exchange reporting'],
        sanctionsRisk: 'medium'
      }
    });

    // Latin America
    this.marketsData.set('latin_america', {
      region: 'Latin America',
      countries: [
        {
          code: 'BR',
          name: 'Brazil',
          capital: 'Brasília',
          currency: 'BRL',
          timezone: ['America/Sao_Paulo'],
          coordinates: { latitude: -14.2350, longitude: -51.9253 },
          population: 215000000,
          gdpPerCapita: 7507,
          internetPenetration: 81.0,
          mobilePenetration: 104,
          bankingPenetration: 70,
          languages: ['Portuguese'],
          businessHours: { start: '09:00', end: '18:00', timezone: 'America/Sao_Paulo' },
          paymentMethods: [
            { type: 'PIX', provider: 'Banco Central', adoption: 78, processingFee: 0.0, settlementTime: 'instant', currencies: ['BRL'] },
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 71, processingFee: 3.8, settlementTime: '2-3 days', currencies: ['BRL'] },
            { type: 'Boleto', provider: 'FEBRABAN', adoption: 65, processingFee: 2.1, settlementTime: '1-3 days', currencies: ['BRL'] }
          ],
          complianceRequirements: ['Banco Central do Brasil', 'CVM', 'LGPD', 'SPB']
        },
        {
          code: 'MX',
          name: 'Mexico',
          capital: 'Mexico City',
          currency: 'MXN',
          timezone: ['America/Mexico_City'],
          coordinates: { latitude: 23.6345, longitude: -102.5528 },
          population: 128000000,
          gdpPerCapita: 9673,
          internetPenetration: 72.0,
          mobilePenetration: 88,
          bankingPenetration: 31,
          languages: ['Spanish'],
          businessHours: { start: '09:00', end: '18:00', timezone: 'America/Mexico_City' },
          paymentMethods: [
            { type: 'SPEI', provider: 'Banco de México', adoption: 45, processingFee: 1.2, settlementTime: 'instant', currencies: ['MXN'] },
            { type: 'Cash', provider: 'OXXO/Elektra', adoption: 89, processingFee: 1.5, settlementTime: '1-2 days', currencies: ['MXN'] },
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 38, processingFee: 3.2, settlementTime: '2-3 days', currencies: ['MXN'] }
          ],
          complianceRequirements: ['CNBV', 'CONDUSEF', 'Ley Fintech', 'LFPIORPI']
        }
      ],
      economicIndicators: {
        gdpGrowthRate: 2.9,
        inflationRate: 6.8,
        unemploymentRate: 9.2,
        currencyStability: 'volatile',
        creditRating: 'BB',
        easeOfDoingBusiness: 124,
        corruptionIndex: 38
      },
      digitalAdoption: {
        internetSpeed: { mobile: 23.1, fixed: 52.3 },
        smartphoneAdoption: 72,
        digitalPaymentAdoption: 43,
        ecommerceGrowth: 27.3,
        socialMediaPenetration: 78,
        cloudAdoption: 41
      },
      marketOpportunity: {
        marketSize: { value: 186, growth: 22.4 },
        competitionLevel: 'medium',
        entryBarriers: ['Financial inclusion gap', 'Regulatory complexity', 'Economic volatility'],
        keyOpportunities: ['Financial inclusion', 'Digital payments', 'Remittances', 'SME lending'],
        threats: ['Economic instability', 'Currency devaluation', 'Regulatory changes'],
        recommendedStrategy: 'Focus on cash-to-digital transition and financial inclusion'
      },
      culturalInsights: {
        communicationStyle: 'indirect',
        businessCulture: ['Relationship focus', 'Personal connections', 'Family orientation', 'Respect for hierarchy'],
        preferredChannels: ['WhatsApp', 'Facebook', 'In-person meetings', 'Phone calls'],
        culturalSensitivities: ['Family values', 'Religious considerations', 'Economic sensitivity', 'Language preferences'],
        localHolidays: ['Dia de los Muertos', 'Christmas', 'Independence Day', 'Carnival'],
        workingDays: [1, 2, 3, 4, 5],
        decisionMakingStyle: 'hierarchical'
      },
      regulatoryEnvironment: {
        dataProtectionLaws: ['LGPD (Brazil)', 'LFPDPPP (Mexico)', 'Local privacy laws'],
        financialRegulations: ['Ley Fintech', 'Resolução CMN', 'Local banking regulations'],
        taxRequirements: ['Income tax', 'VAT/IVA', 'Financial transaction tax'],
        licenseRequirements: ['Fintech licenses', 'Payment institution licenses'],
        reportingRequirements: ['AML reporting', 'Foreign exchange controls'],
        sanctionsRisk: 'low'
      }
    });

    // Middle East
    this.marketsData.set('middle_east', {
      region: 'Middle East',
      countries: [
        {
          code: 'AE',
          name: 'United Arab Emirates',
          capital: 'Abu Dhabi',
          currency: 'AED',
          timezone: ['Asia/Dubai'],
          coordinates: { latitude: 23.4241, longitude: 53.8478 },
          population: 9900000,
          gdpPerCapita: 43498,
          internetPenetration: 99.0,
          mobilePenetration: 200,
          bankingPenetration: 85,
          languages: ['Arabic', 'English'],
          businessHours: { start: '08:00', end: '17:00', timezone: 'Asia/Dubai' },
          paymentMethods: [
            { type: 'Credit Card', provider: 'Visa/Mastercard', adoption: 87, processingFee: 2.8, settlementTime: '1-2 days', currencies: ['AED'] },
            { type: 'Digital Wallet', provider: 'Apple Pay/Samsung Pay', adoption: 64, processingFee: 2.5, settlementTime: 'instant', currencies: ['AED'] },
            { type: 'Bank Transfer', provider: 'UAE Switch', adoption: 72, processingFee: 1.0, settlementTime: 'instant', currencies: ['AED'] }
          ],
          complianceRequirements: ['CBUAE', 'SCA', 'UAE Data Protection Law', 'AML-CFT Law']
        }
      ],
      economicIndicators: {
        gdpGrowthRate: 3.8,
        inflationRate: 2.1,
        unemploymentRate: 2.4,
        currencyStability: 'stable',
        creditRating: 'AA',
        easeOfDoingBusiness: 16,
        corruptionIndex: 69
      },
      digitalAdoption: {
        internetSpeed: { mobile: 89.1, fixed: 186.2 },
        smartphoneAdoption: 96,
        digitalPaymentAdoption: 81,
        ecommerceGrowth: 16.4,
        socialMediaPenetration: 99,
        cloudAdoption: 89
      },
      marketOpportunity: {
        marketSize: { value: 87, growth: 12.3 },
        competitionLevel: 'medium',
        entryBarriers: ['Regulatory requirements', 'Local partnerships needed', 'High competition'],
        keyOpportunities: ['Crypto and blockchain', 'Cross-border payments', 'SME financing', 'Islamic finance'],
        threats: ['Regional geopolitical tensions', 'Oil price volatility', 'Regulatory changes'],
        recommendedStrategy: 'Partner with local institutions and focus on innovation hubs'
      },
      culturalInsights: {
        communicationStyle: 'indirect',
        businessCulture: ['Relationship building', 'Respect for hierarchy', 'Islamic values', 'International outlook'],
        preferredChannels: ['WhatsApp', 'Email', 'In-person meetings', 'Video calls'],
        culturalSensitivities: ['Islamic finance principles', 'Cultural holidays', 'Business etiquette', 'Language preferences'],
        localHolidays: ['Eid al-Fitr', 'Eid al-Adha', 'National Day', 'Islamic holidays'],
        workingDays: [1, 2, 3, 4, 5],
        decisionMakingStyle: 'hierarchical'
      },
      regulatoryEnvironment: {
        dataProtectionLaws: ['UAE Data Protection Law', 'DIFC Data Protection Law'],
        financialRegulations: ['CBUAE regulations', 'SCA requirements', 'Islamic finance rules'],
        taxRequirements: ['VAT', 'Corporate tax (upcoming)', 'Withholding tax'],
        licenseRequirements: ['Banking licenses', 'Payment service provider licenses'],
        reportingRequirements: ['AML-CFT reporting', 'Suspicious transaction reporting'],
        sanctionsRisk: 'medium'
      }
    });
  }

  /**
   * Get market data for a specific region
   */
  getMarketData(region: string): MarketData | null {
    return this.marketsData.get(region) || null;
  }

  /**
   * Get all available markets
   */
  getAllMarkets(): MarketData[] {
    return Array.from(this.marketsData.values());
  }

  /**
   * Get country data by country code
   */
  getCountryData(countryCode: string): CountryData | null {
    for (const market of this.marketsData.values()) {
      const country = market.countries.find(c => c.code === countryCode);
      if (country) return country;
    }
    return null;
  }

  /**
   * Get optimal payment methods for a country
   */
  getPaymentMethods(countryCode: string): PaymentMethod[] {
    const country = this.getCountryData(countryCode);
    return country?.paymentMethods || [];
  }

  /**
   * Get business hours for a country
   */
  getBusinessHours(countryCode: string): { start: string; end: string; timezone: string } | null {
    const country = this.getCountryData(countryCode);
    return country?.businessHours || null;
  }

  /**
   * Get compliance requirements for a country
   */
  getComplianceRequirements(countryCode: string): string[] {
    const country = this.getCountryData(countryCode);
    return country?.complianceRequirements || [];
  }

  /**
   * Calculate market entry score
   */
  calculateMarketEntryScore(region: string): number {
    const market = this.getMarketData(region);
    if (!market) return 0;

    const weights = {
      marketSize: 0.25,
      digitalAdoption: 0.20,
      easeOfBusiness: 0.20,
      economicStability: 0.15,
      competition: 0.10,
      corruption: 0.10
    };

    const scores = {
      marketSize: Math.min(market.marketOpportunity.marketSize.value / 1000, 1) * 100,
      digitalAdoption: market.digitalAdoption.digitalPaymentAdoption,
      easeOfBusiness: Math.max(0, 100 - market.economicIndicators.easeOfDoingBusiness),
      economicStability: market.economicIndicators.currencyStability === 'stable' ? 100 : 
                        market.economicIndicators.currencyStability === 'volatile' ? 50 : 20,
      competition: market.marketOpportunity.competitionLevel === 'low' ? 100 :
                   market.marketOpportunity.competitionLevel === 'medium' ? 70 :
                   market.marketOpportunity.competitionLevel === 'high' ? 40 : 20,
      corruption: market.economicIndicators.corruptionIndex
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }

  /**
   * Get market recommendations based on criteria
   */
  getMarketRecommendations(criteria: {
    minMarketSize?: number;
    maxCompetition?: 'low' | 'medium' | 'high' | 'saturated';
    minDigitalAdoption?: number;
    preferredRegions?: string[];
  }): MarketData[] {
    const markets = this.getAllMarkets().filter(market => {
      if (criteria.minMarketSize && market.marketOpportunity.marketSize.value < criteria.minMarketSize) {
        return false;
      }
      
      if (criteria.maxCompetition) {
        const competitionLevels = ['low', 'medium', 'high', 'saturated'];
        const maxLevel = competitionLevels.indexOf(criteria.maxCompetition);
        const marketLevel = competitionLevels.indexOf(market.marketOpportunity.competitionLevel);
        if (marketLevel > maxLevel) return false;
      }
      
      if (criteria.minDigitalAdoption && market.digitalAdoption.digitalPaymentAdoption < criteria.minDigitalAdoption) {
        return false;
      }
      
      if (criteria.preferredRegions && !criteria.preferredRegions.includes(market.region.toLowerCase().replace(' ', '_'))) {
        return false;
      }
      
      return true;
    });

    // Sort by market entry score
    return markets.sort((a, b) => {
      const scoreA = this.calculateMarketEntryScore(a.region.toLowerCase().replace(' ', '_'));
      const scoreB = this.calculateMarketEntryScore(b.region.toLowerCase().replace(' ', '_'));
      return scoreB - scoreA;
    });
  }

  /**
   * Get cultural adaptation recommendations
   */
  getCulturalAdaptations(countryCode: string): string[] {
    const country = this.getCountryData(countryCode);
    if (!country) return [];

    const market = this.getAllMarkets().find(m => 
      m.countries.some(c => c.code === countryCode)
    );
    
    if (!market) return [];

    const adaptations: string[] = [];
    
    // Communication style adaptations
    if (market.culturalInsights.communicationStyle === 'indirect') {
      adaptations.push('Use polite, indirect communication styles');
      adaptations.push('Allow for relationship building time');
    } else {
      adaptations.push('Use direct, concise communication');
      adaptations.push('Focus on efficiency and results');
    }

    // Language adaptations
    if (country.languages.length > 1) {
      adaptations.push(`Support multiple languages: ${country.languages.join(', ')}`);
    }

    // Cultural sensitivity adaptations
    adaptations.push(...market.culturalInsights.culturalSensitivities.map(s => 
      `Be mindful of: ${s}`
    ));

    // Business culture adaptations
    adaptations.push(...market.culturalInsights.businessCulture.map(c => 
      `Adapt to: ${c}`
    ));

    return adaptations;
  }
}

// Export singleton instance
export const globalCoverage = GlobalCoverageManager.getInstance();
export { GlobalCoverageManager };

// Convenience functions
export function getMarketData(region: string): MarketData | null {
  return globalCoverage.getMarketData(region);
}

export function getCountryData(countryCode: string): CountryData | null {
  return globalCoverage.getCountryData(countryCode);
}

export function getPaymentMethods(countryCode: string): PaymentMethod[] {
  return globalCoverage.getPaymentMethods(countryCode);
}

export function getMarketRecommendations(criteria: Parameters<typeof globalCoverage.getMarketRecommendations>[0]): MarketData[] {
  return globalCoverage.getMarketRecommendations(criteria);
}

export function calculateMarketEntryScore(region: string): number {
  return globalCoverage.calculateMarketEntryScore(region);
}

export function getCulturalAdaptations(countryCode: string): string[] {
  return globalCoverage.getCulturalAdaptations(countryCode);
}