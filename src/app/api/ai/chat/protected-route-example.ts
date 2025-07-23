import { NextResponse } from "next/server";
import { withSubscription } from "@/lib/subscription-middleware";
import { SubscriptionTier } from "@/lib/subscription-service";

// Example 1: Protect AI Chat feature (Professional tier and above)
export const POST = withSubscription(
  async (request: Request) => {
    // Your AI chat logic here
    const body = await request.json();
    
    // AI chat is now automatically protected
    // Only PROFESSIONAL and ENTERPRISE users can access
    
    return NextResponse.json({
      message: "AI response here",
      data: body
    });
  },
  { 
    feature: "aiChatEnabled",
    minimumTier: SubscriptionTier.PROFESSIONAL 
  }
);

// Example 2: Protect SMS sending with usage tracking
export const sendSMS = withSubscription(
  async (request: Request) => {
    const { recipients, message } = await request.json();
    const smsCount = recipients.length;
    
    // SMS sending logic here
    // Usage is automatically tracked and deducted
    
    return NextResponse.json({
      success: true,
      messagesSent: smsCount
    });
  },
  { 
    usageType: "sms",
    incrementUsage: smsCount // Will be calculated dynamically
  }
);

// Example 3: Protect LeadPulse features
export const trackVisitor = withSubscription(
  async (request: Request) => {
    // Visitor tracking logic
    return NextResponse.json({ tracked: true });
  },
  { 
    feature: "leadPulseEnabled",
    usageType: "leadPulseVisits",
    incrementUsage: 1
  }
);