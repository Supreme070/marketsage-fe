/**
 * Client-side utility for tracking conversions in MarketSage
 */

export interface ConversionData {
  entityType: string;
  entityId: string;
  conversionType: string;
  conversionValue?: number;
  metadata?: Record<string, any>;
}

/**
 * Track a conversion event
 * 
 * @param data The conversion data to track
 * @returns Promise with the tracking result
 */
export async function trackConversion(data: ConversionData): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/conversions/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error tracking conversion:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to track conversion',
      };
    }

    return {
      success: true,
      message: result.message || 'Conversion tracked successfully',
    };
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while tracking conversion',
    };
  }
}

/**
 * Fetch conversion data
 * 
 * @param options Optional query parameters
 * @returns Promise with the conversion data
 */
export async function fetchConversionData(
  options: {
    entityType?: string;
    entityId?: string;
    period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<any> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (options.entityType) params.append('entityType', options.entityType);
    if (options.entityId) params.append('entityId', options.entityId);
    if (options.period) params.append('period', options.period);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    
    // Make the API request
    const response = await fetch(`/api/conversions?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error fetching conversion data:', result.error);
      throw new Error(result.error || 'Failed to fetch conversion data');
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching conversion data:', error);
    throw error;
  }
}

/**
 * Common conversion types used in the application
 */
export const ConversionTypes = {
  // Lead generation conversions
  LEAD_CAPTURE: 'lead_capture',
  SIGNUP: 'signup',
  FORM_SUBMISSION: 'form_submission',
  
  // Email campaign conversions
  EMAIL_OPEN: 'email_open',
  EMAIL_CLICK: 'email_click',
  EMAIL_REPLY: 'email_reply',
  
  // SMS campaign conversions
  SMS_DELIVERED: 'sms_delivered',
  SMS_CLICK: 'sms_click',
  SMS_REPLY: 'sms_reply',
  
  // WhatsApp campaign conversions
  WHATSAPP_DELIVERED: 'whatsapp_delivered',
  WHATSAPP_READ: 'whatsapp_read',
  WHATSAPP_REPLY: 'whatsapp_reply',
  
  // Sales conversions
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  CHECKOUT_START: 'checkout_start',
  PURCHASE: 'purchase',
  
  // Custom conversion
  CUSTOM: 'custom',
}; 