import { randomUUID } from 'crypto';

// Sample data initialization for A/B testing
export function createSampleTests() {
  // Create sample tests and variants
  const sampleTests = [];
  const sampleVariants = [];

  // Email Campaign A/B Test - Subject Line Test
  const emailTestId = randomUUID();
  sampleTests.push({
    id: emailTestId,
    name: "Welcome Email Subject Line Test",
    description: "Testing different subject lines for the new user welcome email to improve open rates",
    entityType: "EMAIL_CAMPAIGN",
    entityId: "camp_welcome_2023",
    status: "RUNNING",
    testType: "SIMPLE_AB",
    testElements: ["subject"],
    winnerMetric: "OPEN_RATE",
    winnerThreshold: 0.95,
    distributionPercent: 0.5,
    createdById: "mockuser123",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    startedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Email Variants
  const emailVariant1Id = randomUUID();
  const emailVariant2Id = randomUUID();
  const emailVariant3Id = randomUUID();

  sampleVariants.push({
    id: emailVariant1Id,
    testId: emailTestId,
    name: "Control",
    description: "Original subject line",
    content: {
      subject: "Welcome to MarketSage - Get Started"
    },
    trafficPercent: 0.33,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      openRate: { value: 0.21, sampleSize: 500 },
      clickRate: { value: 0.09, sampleSize: 500 }
    }
  });

  sampleVariants.push({
    id: emailVariant2Id,
    testId: emailTestId,
    name: "Variant A",
    description: "Personalized with name",
    content: {
      subject: "[name], Your MarketSage Account is Ready!"
    },
    trafficPercent: 0.33,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      openRate: { value: 0.28, sampleSize: 500 },
      clickRate: { value: 0.12, sampleSize: 500 }
    }
  });

  sampleVariants.push({
    id: emailVariant3Id,
    testId: emailTestId,
    name: "Variant B",
    description: "Urgency focused",
    content: {
      subject: "⏰ Your MarketSage Trial Starts Now - Limited Time Offer"
    },
    trafficPercent: 0.34,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      openRate: { value: 0.32, sampleSize: 500 },
      clickRate: { value: 0.14, sampleSize: 500 }
    }
  });

  // SMS Campaign A/B Test - Message Content Test
  const smsTestId = randomUUID();
  sampleTests.push({
    id: smsTestId,
    name: "SMS Flash Sale Announcement",
    description: "Testing different message formats and call-to-actions for flash sale announcement",
    entityType: "SMS_CAMPAIGN",
    entityId: "camp_summer_flash_sale",
    status: "COMPLETED",
    testType: "SIMPLE_AB",
    testElements: ["content"],
    winnerMetric: "CLICK_RATE",
    winnerThreshold: 0.95,
    distributionPercent: 0.7,
    createdById: "mockuser123",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    endedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    winnerVariantId: randomUUID() // Will update after variant creation
  });

  // SMS Variants
  const smsVariant1Id = randomUUID();
  const smsVariant2Id = randomUUID();

  sampleVariants.push({
    id: smsVariant1Id,
    testId: smsTestId,
    name: "Control",
    description: "Standard message with discount info",
    content: {
      message: "MarketSage FLASH SALE! 30% off all plans today only. Use code FLASH30 at checkout. Shop now: https://bit.ly/ms-sale"
    },
    trafficPercent: 0.5,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      openRate: { value: 0.98, sampleSize: 1000 }, // SMS open rates usually very high
      clickRate: { value: 0.12, sampleSize: 1000 }
    }
  });

  sampleVariants.push({
    id: smsVariant2Id,
    testId: smsTestId,
    name: "Variant A",
    description: "Urgency-focused with countdown",
    content: {
      message: "⏰ 6 HOURS LEFT! MarketSage flash sale ends today. 30% OFF with code FLASH30. Limited spots! Click now: https://bit.ly/ms-flash"
    },
    trafficPercent: 0.5,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    results: {
      openRate: { value: 0.99, sampleSize: 1000 },
      clickRate: { value: 0.19, sampleSize: 1000 }
    }
  });

  // Update the SMS test winner reference
  sampleTests[1].winnerVariantId = smsVariant2Id;

  // WhatsApp Campaign A/B Test - Rich Media Test
  const whatsappTestId = randomUUID();
  sampleTests.push({
    id: whatsappTestId,
    name: "WhatsApp Onboarding Experience",
    description: "Testing different onboarding message formats in WhatsApp to improve engagement",
    entityType: "WHATSAPP_CAMPAIGN",
    entityId: "camp_wa_onboarding",
    status: "DRAFT",
    testType: "MULTIVARIATE",
    testElements: ["content", "media"],
    winnerMetric: "REPLY_RATE",
    winnerThreshold: 0.90,
    distributionPercent: 0.4,
    createdById: "mockuser123",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // WhatsApp Variants
  const whatsappVariant1Id = randomUUID();
  const whatsappVariant2Id = randomUUID();
  const whatsappVariant3Id = randomUUID();

  sampleVariants.push({
    id: whatsappVariant1Id,
    testId: whatsappTestId,
    name: "Control",
    description: "Text-only welcome message",
    content: {
      message: "Welcome to MarketSage! We're excited to have you join us. Reply with 'HELP' to see available commands or 'MENU' to access the main menu.",
      media: null
    },
    trafficPercent: 0.33,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  });

  sampleVariants.push({
    id: whatsappVariant2Id,
    testId: whatsappTestId,
    name: "Variant A",
    description: "Video tutorial introduction",
    content: {
      message: "👋 Welcome to MarketSage! Here's a quick video to help you get started. Reply 'MENU' to access options or ask any question!",
      media: {
        type: "video",
        url: "https://example.com/videos/welcome.mp4",
        caption: "Getting Started with MarketSage - 60 sec guide"
      }
    },
    trafficPercent: 0.34,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  });

  sampleVariants.push({
    id: whatsappVariant3Id,
    testId: whatsappTestId,
    name: "Variant B",
    description: "Interactive buttons approach",
    content: {
      message: "Welcome to MarketSage! What would you like to do first?",
      media: null,
      interactive: {
        type: "button",
        buttons: [
          { id: "tour", text: "Take a Tour" },
          { id: "features", text: "Explore Features" },
          { id: "help", text: "Get Help" }
        ]
      }
    },
    trafficPercent: 0.33,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  });

  return { sampleTests, sampleVariants };
} 