/**
 * Bulk Pricing Configuration for Credit Purchases
 */

export interface PricingTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  discountPercentage: number;
  bonusCredits: number;
  description: string;
  popular?: boolean;
  savings?: string;
}

export interface PaymentOption {
  id: string;
  name: string;
  provider: 'paystack' | 'stripe' | 'flutterwave' | 'razorpay';
  currencies: string[];
  regions: string[];
  icon: string;
  processingFee: number; // Percentage
  description: string;
  enabled: boolean;
}

// Bulk pricing tiers with discounts
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    minAmount: 10,
    maxAmount: 49,
    discountPercentage: 0,
    bonusCredits: 0,
    description: 'Perfect for small campaigns',
    savings: 'Standard rate'
  },
  {
    id: 'growth',
    name: 'Growth Pack',
    minAmount: 50,
    maxAmount: 99,
    discountPercentage: 5,
    bonusCredits: 2,
    description: 'Great for growing businesses',
    savings: 'Save 5% + 2 bonus credits'
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    minAmount: 100,
    maxAmount: 249,
    discountPercentage: 10,
    bonusCredits: 10,
    description: 'Ideal for professional use',
    popular: true,
    savings: 'Save 10% + 10 bonus credits'
  },
  {
    id: 'business',
    name: 'Business Pack',
    minAmount: 250,
    maxAmount: 499,
    discountPercentage: 15,
    bonusCredits: 40,
    description: 'Perfect for businesses',
    savings: 'Save 15% + 40 bonus credits'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    minAmount: 500,
    discountPercentage: 20,
    bonusCredits: 100,
    description: 'Maximum value for enterprises',
    savings: 'Save 20% + 100 bonus credits'
  }
];

// Payment options for different regions
export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    provider: 'paystack',
    currencies: ['NGN', 'USD', 'GHS', 'ZAR', 'KES'],
    regions: ['nigeria', 'ghana', 'south-africa', 'kenya', 'global'],
    icon: '/icons/paystack.png',
    processingFee: 1.5,
    description: 'Cards, Bank Transfer, USSD, Mobile Money',
    enabled: true
  },
  {
    id: 'stripe',
    name: 'Stripe',
    provider: 'stripe',
    currencies: ['USD', 'EUR', 'GBP'],
    regions: ['global', 'us', 'europe'],
    icon: '/icons/stripe.png',
    processingFee: 2.9,
    description: 'Credit/Debit Cards, Digital Wallets',
    enabled: true
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    provider: 'flutterwave',
    currencies: ['NGN', 'USD', 'GHS', 'KES', 'UGX'],
    regions: ['nigeria', 'ghana', 'kenya', 'uganda', 'africa'],
    icon: '/icons/flutterwave.png',
    processingFee: 1.4,
    description: 'Cards, Bank Transfer, Mobile Money',
    enabled: true
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    provider: 'razorpay',
    currencies: ['INR', 'USD'],
    regions: ['india', 'global'],
    icon: '/icons/razorpay.png',
    processingFee: 2.0,
    description: 'UPI, Cards, Net Banking, Wallets',
    enabled: false // Disabled by default
  }
];

export class BulkPricingCalculator {
  /**
   * Calculate final price with bulk discounts
   */
  static calculatePrice(baseAmount: number): {
    tier: PricingTier;
    baseAmount: number;
    discount: number;
    bonusCredits: number;
    finalAmount: number;
    totalCredits: number;
    savings: number;
  } {
    const tier = this.getTierForAmount(baseAmount);
    const discount = (baseAmount * tier.discountPercentage) / 100;
    const finalAmount = baseAmount - discount;
    const totalCredits = baseAmount + tier.bonusCredits;
    const savings = discount;

    return {
      tier,
      baseAmount,
      discount,
      bonusCredits: tier.bonusCredits,
      finalAmount,
      totalCredits,
      savings
    };
  }

  /**
   * Get pricing tier for amount
   */
  static getTierForAmount(amount: number): PricingTier {
    return PRICING_TIERS.find(tier => 
      amount >= tier.minAmount && 
      (tier.maxAmount === undefined || amount <= tier.maxAmount)
    ) || PRICING_TIERS[0];
  }

  /**
   * Get available payment options for region
   */
  static getPaymentOptionsForRegion(region: string): PaymentOption[] {
    return PAYMENT_OPTIONS.filter(option => 
      option.enabled && 
      (option.regions.includes(region) || option.regions.includes('global'))
    );
  }

  /**
   * Calculate processing fee for payment method
   */
  static calculateProcessingFee(amount: number, paymentOptionId: string): number {
    const option = PAYMENT_OPTIONS.find(opt => opt.id === paymentOptionId);
    if (!option) return 0;
    
    return (amount * option.processingFee) / 100;
  }

  /**
   * Get recommended payment option for region
   */
  static getRecommendedPaymentOption(region: string): PaymentOption | null {
    const options = this.getPaymentOptionsForRegion(region);
    
    // Regional preferences
    if (region === 'nigeria' || region === 'ghana' || region === 'kenya') {
      return options.find(opt => opt.id === 'paystack') || options[0];
    }
    
    if (region === 'us' || region === 'europe') {
      return options.find(opt => opt.id === 'stripe') || options[0];
    }
    
    if (region === 'africa') {
      return options.find(opt => opt.id === 'flutterwave') || options[0];
    }
    
    return options[0] || null;
  }

  /**
   * Validate purchase amount
   */
  static validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount < 10) {
      return { isValid: false, error: 'Minimum purchase amount is $10' };
    }
    
    if (amount > 10000) {
      return { isValid: false, error: 'Maximum purchase amount is $10,000' };
    }
    
    return { isValid: true };
  }

  /**
   * Get suggested amounts for UI
   */
  static getSuggestedAmounts(): number[] {
    return [25, 50, 100, 250, 500, 1000];
  }

  /**
   * Check if amount qualifies for bulk discount
   */
  static qualifiesForBulkDiscount(amount: number): boolean {
    const tier = this.getTierForAmount(amount);
    return tier.discountPercentage > 0 || tier.bonusCredits > 0;
  }
}

// Currency conversion rates (in production, fetch from API)
export const CURRENCY_RATES = {
  USD: 1,
  NGN: 1600,
  GHS: 16,
  KES: 160,
  ZAR: 18,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83
};

export class CurrencyConverter {
  /**
   * Convert amount between currencies
   */
  static convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = CURRENCY_RATES[fromCurrency as keyof typeof CURRENCY_RATES] || 1;
    const toRate = CURRENCY_RATES[toCurrency as keyof typeof CURRENCY_RATES] || 1;
    
    return (amount / fromRate) * toRate;
  }

  /**
   * Format currency amount
   */
  static format(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Get currency symbol
   */
  static getSymbol(currency: string): string {
    const symbols = {
      USD: '$',
      NGN: '₦',
      GHS: '₵',
      KES: 'KSh',
      ZAR: 'R',
      EUR: '€',
      GBP: '£',
      INR: '₹'
    };
    
    return symbols[currency as keyof typeof symbols] || currency;
  }
}