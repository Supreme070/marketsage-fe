/**
 * SMS Cost Calculation API Endpoint
 * 
 * Calculates SMS campaign costs with provider comparison and bulk discounts.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  handleApiError, 
  unauthorized, 
  validationError 
} from '@/lib/errors';

// SMS pricing configuration for African providers
const SMS_PRICING = {
  providers: {
    africastalking: {
      name: 'Africa\'s Talking',
      baseRate: 0.005, // $0.005 per SMS
      bulkDiscounts: [
        { minQuantity: 1000, discountPercentage: 3 },
        { minQuantity: 5000, discountPercentage: 7 },
        { minQuantity: 25000, discountPercentage: 12 }
      ],
      regionalRates: {
        '234': 0.006, // Nigeria
        '254': 0.004, // Kenya
        '256': 0.005, // Uganda
        '255': 0.006  // Tanzania
      },
      features: ['Delivery Reports', 'Unicode Support', 'Shortcode Support']
    },
    termii: {
      name: 'Termii',
      baseRate: 0.007, // $0.007 per SMS
      bulkDiscounts: [
        { minQuantity: 500, discountPercentage: 5 },
        { minQuantity: 2500, discountPercentage: 8 },
        { minQuantity: 15000, discountPercentage: 12 }
      ],
      regionalRates: {
        '234': 0.0065, // Nigeria primary
        '233': 0.008,  // Ghana
        '237': 0.009   // Cameroon
      },
      features: ['OTP Support', 'Sender ID', 'Number Verification']
    },
    twilio: {
      name: 'Twilio',
      baseRate: 0.0075, // $0.0075 per SMS
      bulkDiscounts: [
        { minQuantity: 1000, discountPercentage: 5 },
        { minQuantity: 10000, discountPercentage: 10 },
        { minQuantity: 100000, discountPercentage: 15 }
      ],
      regionalRates: {
        '234': 0.008, // Nigeria
        '254': 0.009, // Kenya
        '27': 0.012,  // South Africa
        '233': 0.010  // Ghana
      },
      features: ['Global Coverage', 'Advanced Analytics', 'API Documentation']
    },
    clickatell: {
      name: 'Clickatell',
      baseRate: 0.008, // $0.008 per SMS
      bulkDiscounts: [
        { minQuantity: 1000, discountPercentage: 4 },
        { minQuantity: 5000, discountPercentage: 8 },
        { minQuantity: 20000, discountPercentage: 14 }
      ],
      regionalRates: {
        '234': 0.0075, // Nigeria
        '27': 0.011,   // South Africa
        '254': 0.0085, // Kenya
        '233': 0.009   // Ghana
      },
      features: ['Rich Messaging', 'Two-Way SMS', 'Platform Integration']
    }
  },
  defaultProvider: 'termii'
};

function calculateProviderCost(
  messageCount: number, 
  provider: string, 
  countryCode?: string
) {
  const providerConfig = SMS_PRICING.providers[provider as keyof typeof SMS_PRICING.providers];
  if (!providerConfig) {
    throw new Error(`Provider ${provider} not supported`);
  }

  // Determine the rate
  let baseRate = providerConfig.baseRate;
  if (countryCode && providerConfig.regionalRates[countryCode as keyof typeof providerConfig.regionalRates]) {
    baseRate = providerConfig.regionalRates[countryCode as keyof typeof providerConfig.regionalRates];
  }

  // Calculate original cost
  const originalCost = messageCount * baseRate;

  // Apply bulk discounts
  let discount = 0;
  for (const tier of providerConfig.bulkDiscounts) {
    if (messageCount >= tier.minQuantity) {
      discount = tier.discountPercentage;
    }
  }

  const discountAmount = originalCost * (discount / 100);
  const finalCost = originalCost - discountAmount;
  const costPerMessage = finalCost / messageCount;

  return {
    provider,
    providerName: providerConfig.name,
    messageCount,
    baseRate,
    originalCost: Math.round(originalCost * 10000) / 10000,
    discount,
    discountAmount: Math.round(discountAmount * 10000) / 10000,
    finalCost: Math.round(finalCost * 10000) / 10000,
    costPerMessage: Math.round(costPerMessage * 10000) / 10000,
    features: providerConfig.features,
    savings: Math.round(discountAmount * 100) / 100
  };
}

// POST - Calculate SMS costs
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { 
      messageCount, 
      providers = ['termii', 'africastalking', 'twilio'], 
      countryCode,
      compareAll = false 
    } = body;

    // Validate required fields
    if (!messageCount || messageCount <= 0) {
      return validationError('messageCount must be a positive number');
    }

    if (messageCount > 1000000) {
      return validationError('messageCount cannot exceed 1,000,000');
    }

    // Validate country code format
    if (countryCode && !/^\d{2,3}$/.test(countryCode)) {
      return validationError('countryCode must be 2-3 digits (e.g., "234" for Nigeria)');
    }

    // Calculate costs for requested providers
    const providersToCalculate = compareAll ? 
      Object.keys(SMS_PRICING.providers) : 
      providers.filter(p => SMS_PRICING.providers[p as keyof typeof SMS_PRICING.providers]);

    if (providersToCalculate.length === 0) {
      return validationError('No valid providers specified');
    }

    const calculations = providersToCalculate.map(provider => {
      try {
        return calculateProviderCost(messageCount, provider, countryCode);
      } catch (error) {
        return {
          provider,
          error: error instanceof Error ? error.message : 'Calculation failed'
        };
      }
    });

    // Find the most cost-effective option
    const validCalculations = calculations.filter(calc => !calc.error);
    const cheapest = validCalculations.reduce((best, current) => 
      current.finalCost < best.finalCost ? current : best
    );

    // Calculate potential savings
    const mostExpensive = validCalculations.reduce((worst, current) => 
      current.finalCost > worst.finalCost ? current : worst
    );

    const maxSavings = mostExpensive.finalCost - cheapest.finalCost;

    // Provide recommendations
    const recommendations = [];
    
    if (messageCount >= 1000) {
      recommendations.push({
        type: 'bulk_discount',
        message: `You qualify for bulk discounts! Save up to ${Math.max(...validCalculations.map(c => c.discount))}% on large volumes.`,
        priority: 'high'
      });
    }

    if (countryCode) {
      const regionalProviders = validCalculations.filter(calc => 
        SMS_PRICING.providers[calc.provider as keyof typeof SMS_PRICING.providers].regionalRates[countryCode]
      );
      
      if (regionalProviders.length > 0) {
        recommendations.push({
          type: 'regional_optimization',
          message: `Consider regional providers for ${countryCode} - they may offer better rates for your target market.`,
          priority: 'medium'
        });
      }
    }

    if (maxSavings > messageCount * 0.001) { // If savings > $0.001 per message
      recommendations.push({
        type: 'cost_optimization',
        message: `Switch to ${cheapest.providerName} to save $${maxSavings.toFixed(4)} (${Math.round((maxSavings / mostExpensive.finalCost) * 100)}%) on this campaign.`,
        priority: 'high'
      });
    }

    // Add cost efficiency insights
    const insights = {
      mostAffordable: cheapest.providerName,
      potentialSavings: Math.round(maxSavings * 100) / 100,
      costRange: {
        min: Math.round(cheapest.finalCost * 100) / 100,
        max: Math.round(mostExpensive.finalCost * 100) / 100
      },
      averageCostPerMessage: Math.round(
        (validCalculations.reduce((sum, calc) => sum + calc.costPerMessage, 0) / validCalculations.length) * 10000
      ) / 10000,
      bulkDiscountEligible: messageCount >= 500
    };

    return NextResponse.json({
      success: true,
      messageCount,
      countryCode: countryCode || 'global',
      calculations: validCalculations,
      recommendations,
      insights,
      summary: {
        cheapestOption: {
          provider: cheapest.provider,
          providerName: cheapest.providerName,
          cost: cheapest.finalCost,
          costPerMessage: cheapest.costPerMessage
        },
        totalSavings: maxSavings > 0 ? maxSavings : 0,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error calculating SMS costs:', error);
    return handleApiError(error, '/api/sms/cost/calculate/route.ts');
  }
}

// GET - Get pricing information
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const includeRates = searchParams.get('includeRates') === 'true';

    if (provider) {
      // Get specific provider information
      const providerConfig = SMS_PRICING.providers[provider as keyof typeof SMS_PRICING.providers];
      if (!providerConfig) {
        return validationError(`Provider ${provider} not found`);
      }

      const response = {
        provider,
        name: providerConfig.name,
        features: providerConfig.features,
        bulkDiscounts: providerConfig.bulkDiscounts,
        ...(includeRates && {
          baseRate: providerConfig.baseRate,
          regionalRates: providerConfig.regionalRates
        })
      };

      return NextResponse.json(response);
    }

    // Get all providers overview
    const providersOverview = Object.entries(SMS_PRICING.providers).map(([key, config]) => ({
      provider: key,
      name: config.name,
      features: config.features,
      bulkDiscounts: config.bulkDiscounts,
      ...(includeRates && {
        baseRate: config.baseRate,
        hasRegionalRates: Object.keys(config.regionalRates).length > 0
      })
    }));

    return NextResponse.json({
      success: true,
      providers: providersOverview,
      defaultProvider: SMS_PRICING.defaultProvider,
      supportedCountries: {
        '234': 'Nigeria',
        '254': 'Kenya',
        '27': 'South Africa',
        '233': 'Ghana',
        '256': 'Uganda',
        '255': 'Tanzania',
        '237': 'Cameroon'
      }
    });

  } catch (error) {
    console.error('Error getting SMS pricing info:', error);
    return handleApiError(error, '/api/sms/cost/calculate/route.ts');
  }
}