interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResult> {
  try {
    // Mock SMS sending for now - replace with real SMS provider
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    
    // Simulate success
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'SMS sending failed',
      },
    };
  }
} 