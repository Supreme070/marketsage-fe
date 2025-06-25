export interface AfricanMarket {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  majorCities: string[];
  businessHours: {
    start: number; // 24h format
    end: number;
  };
  marketSize: 'large' | 'medium' | 'small';
  techAdoption: 'high' | 'medium' | 'low';
  economicGrowth: number; // GDP growth rate
  internetPenetration: number; // percentage
  mobileUsage: number; // percentage
  preferredPaymentMethods: string[];
  businessLanguages: string[];
  culturalNotes: string[];
  aiInsights: {
    conversionTrends: string;
    bestChannels: string[];
    peakHours: number[];
    seasonality: string;
    customerBehavior: string;
  };
}

export const AFRICAN_MARKETS: Record<string, AfricanMarket> = {
  nigeria: {
    country: 'Nigeria',
    countryCode: 'NG',
    currency: 'NGN',
    currencySymbol: '₦',
    timezone: 'Africa/Lagos',
    majorCities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'large',
    techAdoption: 'high',
    economicGrowth: 3.2,
    internetPenetration: 70,
    mobileUsage: 95,
    preferredPaymentMethods: ['Bank Transfer', 'Mobile Money', 'Paystack', 'Flutterwave'],
    businessLanguages: ['English', 'Yoruba', 'Igbo', 'Hausa'],
    culturalNotes: [
      'WhatsApp is preferred for business communication',
      'Trust and personal relationships are crucial',
      'Mobile-first approach is essential'
    ],
    aiInsights: {
      conversionTrends: 'Peak conversions during business hours (9 AM - 5 PM WAT). 23% higher conversion rates with WhatsApp integration.',
      bestChannels: ['WhatsApp', 'LinkedIn', 'Direct outreach', 'Referrals'],
      peakHours: [9, 10, 11, 14, 15, 16],
      seasonality: 'Q1 and Q3 show highest enterprise engagement due to budget cycles',
      customerBehavior: 'Prefer demos and trials before commitment. Value propositions around efficiency and cost savings resonate well.'
    }
  },
  kenya: {
    country: 'Kenya',
    countryCode: 'KE',
    currency: 'KES',
    currencySymbol: 'KSh',
    timezone: 'Africa/Nairobi',
    majorCities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'medium',
    techAdoption: 'high',
    economicGrowth: 5.1,
    internetPenetration: 85,
    mobileUsage: 98,
    preferredPaymentMethods: ['M-Pesa', 'Bank Transfer', 'Mobile Banking'],
    businessLanguages: ['English', 'Swahili'],
    culturalNotes: [
      'M-Pesa is the dominant payment method',
      'High mobile money adoption',
      'Innovation-focused market'
    ],
    aiInsights: {
      conversionTrends: 'Mobile-first users with 34% higher engagement rates. M-Pesa integration increases conversion by 41%.',
      bestChannels: ['Mobile apps', 'SMS marketing', 'Social media', 'M-Pesa'],
      peakHours: [8, 9, 13, 14, 18, 19],
      seasonality: 'Strong growth in Q2 and Q4, aligned with agricultural and business cycles',
      customerBehavior: 'Early adopters of fintech solutions. Respond well to innovation messaging and mobile-optimized experiences.'
    }
  },
  ghana: {
    country: 'Ghana',
    countryCode: 'GH',
    currency: 'GHS',
    currencySymbol: '₵',
    timezone: 'Africa/Accra',
    majorCities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'medium',
    techAdoption: 'medium',
    economicGrowth: 4.8,
    internetPenetration: 68,
    mobileUsage: 92,
    preferredPaymentMethods: ['Mobile Money', 'Bank Transfer', 'Cash'],
    businessLanguages: ['English', 'Twi', 'Fante'],
    culturalNotes: [
      'Growing fintech ecosystem',
      'Strong entrepreneurial culture',
      'Mobile money widely adopted'
    ],
    aiInsights: {
      conversionTrends: 'Steady growth with 28% quarter-over-quarter improvement. Local payment methods crucial for conversion.',
      bestChannels: ['Mobile money', 'Radio partnerships', 'Community networks', 'SMS'],
      peakHours: [9, 10, 15, 16, 20, 21],
      seasonality: 'Cocoa season (October-March) shows increased business activity',
      customerBehavior: 'Community-driven decisions. Testimonials and local success stories are highly effective.'
    }
  },
  southAfrica: {
    country: 'South Africa',
    countryCode: 'ZA',
    currency: 'ZAR',
    currencySymbol: 'R',
    timezone: 'Africa/Johannesburg',
    majorCities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'large',
    techAdoption: 'high',
    economicGrowth: 2.1,
    internetPenetration: 78,
    mobileUsage: 91,
    preferredPaymentMethods: ['Credit Cards', 'Bank Transfer', 'EFT', 'SnapScan'],
    businessLanguages: ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
    culturalNotes: [
      'Most developed financial infrastructure in Africa',
      'Corporate culture similar to Western markets',
      'High smartphone penetration'
    ],
    aiInsights: {
      conversionTrends: 'Mature market with 15% higher conversion rates during JSE trading hours. Enterprise sales cycles longer but more predictable.',
      bestChannels: ['LinkedIn', 'Email marketing', 'Professional networks', 'Trade shows'],
      peakHours: [8, 9, 10, 13, 14, 15],
      seasonality: 'Q4 budget approvals drive strongest performance',
      customerBehavior: 'Professional approach preferred. Detailed ROI analysis and compliance documentation are important.'
    }
  },
  egypt: {
    country: 'Egypt',
    countryCode: 'EG',
    currency: 'EGP',
    currencySymbol: '£',
    timezone: 'Africa/Cairo',
    majorCities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'],
    businessHours: { start: 9, end: 17 },
    marketSize: 'large',
    techAdoption: 'medium',
    economicGrowth: 3.8,
    internetPenetration: 75,
    mobileUsage: 94,
    preferredPaymentMethods: ['Bank Transfer', 'Mobile Wallet', 'Cash on Delivery'],
    businessLanguages: ['Arabic', 'English'],
    culturalNotes: [
      'Government digitization initiatives',
      'Growing startup ecosystem',
      'Strong B2B market potential'
    ],
    aiInsights: {
      conversionTrends: 'Rapid digital adoption with 45% YoY growth. Arabic content increases engagement by 67%.',
      bestChannels: ['Government partnerships', 'B2B networks', 'Digital platforms', 'Arabic content'],
      peakHours: [10, 11, 14, 15, 19, 20],
      seasonality: 'Ramadan affects business cycles, Q1 and Q4 strongest',
      customerBehavior: 'Formal procurement processes. Government and enterprise focus on digital transformation.'
    }
  },
  tanzania: {
    country: 'Tanzania',
    countryCode: 'TZ',
    currency: 'TZS',
    currencySymbol: 'TSh',
    timezone: 'Africa/Dar_es_Salaam',
    majorCities: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'medium',
    techAdoption: 'medium',
    economicGrowth: 6.3,
    internetPenetration: 46,
    mobileUsage: 89,
    preferredPaymentMethods: ['Mobile Money', 'Bank Transfer', 'Tigo Pesa', 'Airtel Money'],
    businessLanguages: ['Swahili', 'English'],
    culturalNotes: [
      'Fast-growing mobile money market',
      'Agricultural economy transitioning to services',
      'Young, tech-savvy population'
    ],
    aiInsights: {
      conversionTrends: 'Emerging market with 89% mobile-driven conversions. Local language content essential.',
      bestChannels: ['Mobile money', 'SMS campaigns', 'Radio', 'Local partnerships'],
      peakHours: [8, 12, 17, 18, 20],
      seasonality: 'Agricultural seasons impact business cycles, rainy season sees increased activity',
      customerBehavior: 'Price-sensitive market. Simple, affordable solutions with clear value propositions work best.'
    }
  },
  uganda: {
    country: 'Uganda',
    countryCode: 'UG',
    currency: 'UGX',
    currencySymbol: 'USh',
    timezone: 'Africa/Kampala',
    majorCities: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'small',
    techAdoption: 'medium',
    economicGrowth: 5.8,
    internetPenetration: 48,
    mobileUsage: 87,
    preferredPaymentMethods: ['Mobile Money', 'MTN MoMo', 'Airtel Money', 'Bank Transfer'],
    businessLanguages: ['English', 'Luganda', 'Swahili'],
    culturalNotes: [
      'Growing fintech adoption',
      'Strong mobile money penetration',
      'Government support for digital initiatives'
    ],
    aiInsights: {
      conversionTrends: 'Mobile-first market with 78% of conversions via mobile devices. Local payment methods critical.',
      bestChannels: ['Mobile money', 'Community networks', 'SMS', 'Local radio'],
      peakHours: [9, 10, 13, 18, 19],
      seasonality: 'Two rainy seasons affect connectivity, dry seasons show higher engagement',
      customerBehavior: 'Community-oriented decisions. Peer recommendations and local testimonials are crucial.'
    }
  },
  morocco: {
    country: 'Morocco',
    countryCode: 'MA',
    currency: 'MAD',
    currencySymbol: 'DH',
    timezone: 'Africa/Casablanca',
    majorCities: ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir'],
    businessHours: { start: 9, end: 18 },
    marketSize: 'medium',
    techAdoption: 'medium',
    economicGrowth: 3.5,
    internetPenetration: 82,
    mobileUsage: 88,
    preferredPaymentMethods: ['Bank Transfer', 'Credit Cards', 'Cash on Delivery', 'Orange Money'],
    businessLanguages: ['Arabic', 'French', 'Berber'],
    culturalNotes: [
      'French business influence',
      'Growing tech sector',
      'Government digitization push'
    ],
    aiInsights: {
      conversionTrends: 'Bilingual market (Arabic/French) shows 32% higher engagement with localized content.',
      bestChannels: ['Professional networks', 'Government channels', 'French partnerships', 'Banking networks'],
      peakHours: [9, 10, 14, 15, 16],
      seasonality: 'European business calendar alignment, summer slowdown',
      customerBehavior: 'Formal business culture. Professional presentations and proper documentation important.'
    }
  },
  ethiopia: {
    country: 'Ethiopia',
    countryCode: 'ET',
    currency: 'ETB',
    currencySymbol: 'Br',
    timezone: 'Africa/Addis_Ababa',
    majorCities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'medium',
    techAdoption: 'low',
    economicGrowth: 7.2,
    internetPenetration: 35,
    mobileUsage: 71,
    preferredPaymentMethods: ['Bank Transfer', 'Cash', 'M-Birr', 'Mobile Banking'],
    businessLanguages: ['Amharic', 'English', 'Oromo'],
    culturalNotes: [
      'Rapidly growing economy',
      'Government-led development',
      'Young demographic profile'
    ],
    aiInsights: {
      conversionTrends: 'Emerging digital adoption with 156% YoY growth in mobile transactions. Government sector leads adoption.',
      bestChannels: ['Government partnerships', 'Banking sector', 'Educational institutions', 'Development organizations'],
      peakHours: [8, 9, 14, 15],
      seasonality: 'Ethiopian calendar affects business cycles, government fiscal year important',
      customerBehavior: 'Institutional focus. Government endorsement and partnerships significantly boost credibility.'
    }
  },
  rwanda: {
    country: 'Rwanda',
    countryCode: 'RW',
    currency: 'RWF',
    currencySymbol: 'RF',
    timezone: 'Africa/Kigali',
    majorCities: ['Kigali', 'Huye', 'Musanze', 'Rubavu', 'Muhanga'],
    businessHours: { start: 8, end: 17 },
    marketSize: 'small',
    techAdoption: 'high',
    economicGrowth: 8.2,
    internetPenetration: 65,
    mobileUsage: 89,
    preferredPaymentMethods: ['Mobile Money', 'Bank Transfer', 'MTN MoMo', 'Airtel Money'],
    businessLanguages: ['Kinyarwanda', 'English', 'French'],
    culturalNotes: [
      'Leading digital transformation in Africa',
      'Strong government support for tech',
      'Innovation-focused economy'
    ],
    aiInsights: {
      conversionTrends: 'Highest digital adoption rate in East Africa. 94% mobile money penetration drives conversions.',
      bestChannels: ['Digital platforms', 'Government partnerships', 'Innovation hubs', 'Mobile money'],
      peakHours: [8, 9, 13, 14, 17],
      seasonality: 'Consistent year-round performance due to stable economy',
      customerBehavior: 'Early adopters of new technology. Innovation and efficiency messaging resonates strongly.'
    }
  }
};

export const getMarketByCountryCode = (countryCode: string): AfricanMarket | null => {
  return Object.values(AFRICAN_MARKETS).find(market => market.countryCode === countryCode) || null;
};

export const getMarketByCountry = (country: string): AfricanMarket | null => {
  return AFRICAN_MARKETS[country.toLowerCase()] || null;
};

export const getAllMarkets = (): AfricanMarket[] => {
  return Object.values(AFRICAN_MARKETS);
};

export const getMarketsBySize = (size: 'large' | 'medium' | 'small'): AfricanMarket[] => {
  return Object.values(AFRICAN_MARKETS).filter(market => market.marketSize === size);
};

export const getMarketsByTechAdoption = (adoption: 'high' | 'medium' | 'low'): AfricanMarket[] => {
  return Object.values(AFRICAN_MARKETS).filter(market => market.techAdoption === adoption);
};

// AI-powered market analysis functions
export const analyzeMarketOpportunity = (market: AfricanMarket): {
  score: number;
  reasons: string[];
  recommendations: string[];
} => {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Market size scoring
  if (market.marketSize === 'large') {
    score += 30;
    reasons.push(`Large market size (${market.country})`);
  } else if (market.marketSize === 'medium') {
    score += 20;
    reasons.push(`Medium market size with growth potential`);
  } else {
    score += 10;
    reasons.push(`Small but focused market opportunity`);
  }

  // Tech adoption scoring
  if (market.techAdoption === 'high') {
    score += 25;
    reasons.push(`High technology adoption rate`);
  } else if (market.techAdoption === 'medium') {
    score += 15;
    reasons.push(`Growing technology adoption`);
  } else {
    score += 5;
    reasons.push(`Emerging technology market`);
  }

  // Economic growth scoring
  if (market.economicGrowth > 6) {
    score += 20;
    reasons.push(`Strong economic growth (${market.economicGrowth}%)`);
  } else if (market.economicGrowth > 3) {
    score += 10;
    reasons.push(`Stable economic growth`);
  }

  // Internet penetration scoring
  if (market.internetPenetration > 70) {
    score += 15;
    reasons.push(`High internet penetration (${market.internetPenetration}%)`);
  } else if (market.internetPenetration > 50) {
    score += 10;
    reasons.push(`Growing internet access`);
  }

  // Mobile usage scoring
  if (market.mobileUsage > 90) {
    score += 10;
    reasons.push(`Excellent mobile adoption (${market.mobileUsage}%)`);
  } else if (market.mobileUsage > 80) {
    score += 5;
    reasons.push(`Good mobile penetration`);
  }

  // Generate recommendations
  if (market.preferredPaymentMethods.includes('Mobile Money')) {
    recommendations.push('Integrate mobile money payment options');
  }
  if (market.preferredPaymentMethods.includes('WhatsApp')) {
    recommendations.push('Implement WhatsApp Business integration');
  }
  if (market.techAdoption === 'high') {
    recommendations.push('Focus on advanced features and innovation messaging');
  } else {
    recommendations.push('Emphasize simplicity and ease of use');
  }
  if (market.internetPenetration < 60) {
    recommendations.push('Optimize for low-bandwidth scenarios');
  }

  return { score, reasons, recommendations };
};

export const formatCurrencyForMarket = (amount: number, countryCode: string): string => {
  const market = getMarketByCountryCode(countryCode);
  if (!market) return `$${amount.toFixed(2)}`;

  // Currency conversion rates (simplified - in production, use real-time rates)
  const exchangeRates: Record<string, number> = {
    NGN: 1540,    // 1 USD = 1540 NGN
    KES: 150,     // 1 USD = 150 KES
    GHS: 15,      // 1 USD = 15 GHS
    ZAR: 18,      // 1 USD = 18 ZAR
    EGP: 49,      // 1 USD = 49 EGP
    TZS: 2450,    // 1 USD = 2450 TZS
    UGX: 3700,    // 1 USD = 3700 UGX
    MAD: 10,      // 1 USD = 10 MAD
    ETB: 120,     // 1 USD = 120 ETB
    RWF: 1300     // 1 USD = 1300 RWF
  };

  const rate = exchangeRates[market.currency] || 1;
  const convertedAmount = amount * rate;

  return `${market.currencySymbol}${convertedAmount.toLocaleString()}`;
};