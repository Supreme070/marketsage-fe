import { PrismaClient, CampaignStatus } from "@prisma/client";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config();

// Create Prisma client with direct connection to database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://marketsage:marketsage_password@postgres:5432/marketsage?schema=public"
    }
  }
});

// Sample email templates data
const sampleTemplates = [
  // VIP TESTS Workflow Templates
  {
    name: "VIP Welcome",
    description: "VIP welcome email with tracking - Step 1 of VIP journey",
    subject: "🌟 [TEST] Welcome to MarketSage VIP Program, {{firstName}}!",
    content: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        
        <!-- TEST BANNER -->
        <div style="background: linear-gradient(45deg, #ff6b6b, #feca57); padding: 8px; text-align: center;">
          <p style="margin: 0; color: white; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🧪 TEST EMAIL - MarketSage VIP Workflow Testing 🧪</p>
        </div>
        
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.7;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;"></div>
          
          <div style="position: relative; z-index: 2;">
            <h1 style="color: white; margin: 0; font-size: 3em; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🌟</h1>
            <h2 style="color: white; margin: 15px 0 10px 0; font-size: 2.2em; font-weight: 300; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">Welcome to VIP, {{firstName}}!</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 1.2em; font-weight: 300;">You're now part of our exclusive MarketSage VIP program</p>
          </div>
        </div>
        
        <!-- MAIN CONTENT -->
        <div style="background: white; padding: 50px 40px; position: relative;">
          <!-- TEST NOTICE -->
          <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 20px; border-radius: 15px; margin-bottom: 30px; border-left: 5px solid #e17055; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 2em; margin-right: 15px;">🧪</span>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #2d3436; font-size: 1.1em;">This is a Test Email</h4>
                <p style="margin: 0; color: #636e72; font-size: 0.9em;">You're receiving this as part of our MarketSage email workflow testing. All features and tracking are fully functional!</p>
              </div>
            </div>
          </div>
          
          <h3 style="color: #2d3436; margin-top: 0; font-size: 1.8em; font-weight: 400;">Hello {{firstName}},</h3>
          
          <p style="color: #636e72; line-height: 1.8; font-size: 1.1em; margin-bottom: 25px;">Welcome to the <strong style="color: #667eea;">MarketSage VIP Program</strong>! We're thrilled to have you join our exclusive community of marketing professionals and business leaders.</p>
          
          <div style="background: #e3f2fd; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #1976d2; margin: 0 0 15px 0;">🎯 What to Expect:</h4>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Exclusive Features:</strong> Early access to new MarketSage capabilities</li>
              <li><strong>Personalized Support:</strong> Direct line to our expert team</li>
              <li><strong>Advanced Analytics:</strong> Deep insights into your marketing performance</li>
              <li><strong>Strategy Sessions:</strong> Complimentary consultation calls</li>
              <li><strong>VIP Resources:</strong> Exclusive guides and templates</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.marketsage.africa/dashboard?vip=true&utm_source=email&utm_campaign=vip_welcome&utm_content=cta_button" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              🚀 Access Your VIP Dashboard
            </a>
          </div>
          
          <p>Over the next few days, you'll receive exclusive content designed specifically for VIP members like yourself. Keep an eye on your inbox!</p>
          
          <p>If you have any questions, simply reply to this email or <a href="mailto:vip@marketsage.africa">contact our VIP support team</a>.</p>
          
          <p style="margin-top: 40px;">
            Best regards,<br>
            <strong>The MarketSage VIP Team</strong><br>
            🌍 Empowering African Fintech Excellence
          </p>
        </div>
      </div>
    `,
    previewText: "Welcome to the exclusive MarketSage VIP program with advanced features and personalized support",
    category: "VIP",
  },
  {
    name: "VIP Features Showcase",
    description: "Feature showcase for engaged VIP users - Step 2A",
    subject: "🚀 [TEST] Exclusive: Advanced MarketSage Features for {{firstName}}",
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 2em;">🚀 Advanced Features</h1>
          <p style="color: white; margin: 10px 0;">Exclusively for {{firstName}}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h3 style="color: #333;">Hi {{firstName}},</h3>
          
          <p>I noticed you opened our VIP welcome email - fantastic! That tells me you're serious about taking your marketing to the next level.</p>
          
          <p>Here are the <strong>exclusive VIP features</strong> now available to you:</p>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h4 style="color: #155724; margin: 0 0 15px 0;">🎯 AI-Powered Campaign Optimization</h4>
            <p style="margin: 0;">Our advanced AI analyzes your campaigns and automatically optimizes send times, subject lines, and content for maximum engagement.</p>
          </div>
          
          <div style="background: #cce5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h4 style="color: #004085; margin: 0 0 15px 0;">📊 Real-Time Analytics Dashboard</h4>
            <p style="margin: 0;">Get instant insights with our VIP analytics dashboard featuring predictive metrics and competitor analysis.</p>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 15px 0;">🤖 Automated Workflow Builder</h4>
            <p style="margin: 0;">Create sophisticated multi-channel workflows with our drag-and-drop builder - no coding required!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.marketsage.africa/vip-features?utm_source=email&utm_campaign=vip_features&utm_content=explore_button" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 0 10px 10px 0;">
              🔍 Explore Features
            </a>
            <a href="https://app.marketsage.africa/vip-demo?utm_source=email&utm_campaign=vip_features&utm_content=demo_button" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              📺 Watch Demo
            </a>
          </div>
          
          <p><strong>Next up:</strong> I'll be sending you a quick survey to understand your specific needs so we can personalize your VIP experience even further.</p>
          
          <p>Questions? Hit reply - I read every email personally!</p>
          
          <p>
            Cheers,<br>
            <strong>Sarah Chen</strong><br>
            VIP Success Manager, MarketSage
          </p>
        </div>
      </div>
    `,
    previewText: "Discover your exclusive VIP features: AI optimization, real-time analytics, and automated workflows",
    category: "VIP",
  },
  {
    name: "VIP Reminder",
    description: "Gentle reminder for non-openers - Step 2B",
    subject: "[TEST] Don't miss out: Your VIP MarketSage access awaits, {{firstName}}",
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #fd7e14 0%, #e85d04 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">⏰ Just a Friendly Reminder</h1>
          <p style="color: white; margin: 10px 0;">Your VIP access is waiting, {{firstName}}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h3 style="color: #333;">Hi {{firstName}},</h3>
          
          <p>I wanted to make sure you didn't miss our VIP program invitation that I sent yesterday.</p>
          
          <p>As a valued member of our community, you've been selected for <strong>exclusive VIP access</strong> to MarketSage's most advanced features.</p>
          
          <div style="background: #fff3cd; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 15px 0;">🎁 What You're Missing:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Priority support from our expert team</li>
              <li>Early access to new features and updates</li>
              <li>Exclusive strategy sessions worth $500</li>
              <li>Advanced analytics and AI insights</li>
              <li>VIP-only resources and templates</li>
            </ul>
          </div>
          
          <p><strong>No pressure</strong> - I just wanted to make sure this opportunity didn't slip through the cracks of a busy inbox.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.marketsage.africa/vip-welcome?utm_source=email&utm_campaign=vip_reminder&utm_content=activate_button" 
               style="background: #fd7e14; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              ✨ Activate VIP Access
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If you're not interested, no worries at all - you'll continue to receive our regular updates and can always upgrade later.</p>
          
          <p>
            Best,<br>
            <strong>The MarketSage Team</strong>
          </p>
        </div>
      </div>
    `,
    previewText: "Your VIP MarketSage access is still available - exclusive features await",
    category: "VIP",
  },
  {
    name: "VIP Survey",
    description: "Feedback survey for VIP personalization - Step 3",
    subject: "📊 [TEST] Help us serve you better - 2-minute VIP survey",
    content: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        
        <!-- TEST BANNER -->
        <div style="background: linear-gradient(45deg, #ff6b6b, #feca57); padding: 8px; text-align: center;">
          <p style="margin: 0; color: white; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🧪 TEST EMAIL - VIP Survey Step 3 🧪</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); padding: 40px 20px; text-align: center; border-radius: 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.7;"></div>
          <div style="position: absolute; bottom: -20px; left: -20px; width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.5;"></div>
          
          <div style="position: relative; z-index: 2;">
            <h1 style="color: white; margin: 0; font-size: 3em; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">📊</h1>
            <h2 style="color: white; margin: 15px 0 10px 0; font-size: 2em; font-weight: 300; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">Quick VIP Survey</h2>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 1.1em; font-weight: 300;">Help us personalize your experience, {{firstName}}</p>
          </div>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0;">
          <!-- TEST NOTICE -->
          <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 20px; border-radius: 15px; margin-bottom: 30px; border-left: 5px solid #e17055; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 2em; margin-right: 15px;">🧪</span>
              <div>
                <h4 style="margin: 0 0 5px 0; color: #2d3436; font-size: 1.1em;">This is Step 3 of Our Test Workflow</h4>
                <p style="margin: 0; color: #636e72; font-size: 0.9em;">Testing survey functionality and response tracking. The survey link is functional for testing purposes!</p>
              </div>
            </div>
          </div>
          
          <h3 style="color: #2d3436; font-size: 1.8em; font-weight: 400;">Hi {{firstName}},</h3>
          
          <p style="color: #636e72; line-height: 1.8; font-size: 1.1em; margin-bottom: 25px;">Hope you're enjoying your VIP access so far! To make sure we're delivering exactly what you need, I'd love to learn more about your goals.</p>
          
          <p><strong>Could you spare 2 minutes</strong> to answer a few quick questions? Your input will help us:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Customize your dashboard to show the metrics that matter most</li>
              <li>Recommend the best features for your specific use case</li>
              <li>Send you relevant case studies and success stories</li>
              <li>Prioritize the training content you'll find most valuable</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://surveys.marketsage.africa/vip-feedback?contact={{email}}&utm_source=email&utm_campaign=vip_survey" 
               style="background: #6f42c1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              📝 Take 2-Minute Survey
            </a>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #2d5a2d;"><strong>🎁 Bonus:</strong> Everyone who completes the survey gets our exclusive "VIP Marketing Strategy Guide" (normally $97)</p>
          </div>
          
          <p style="font-size: 14px; color: #666;"><em>The survey is completely anonymous, and your responses will only be used to improve your VIP experience. It should take less than 2 minutes to complete.</em></p>
          
          <p>Thanks for helping us make MarketSage even better for you!</p>
          
          <p>
            Appreciate you,<br>
            <strong>Sarah Chen</strong><br>
            VIP Success Manager
          </p>
        </div>
      </div>
    `,
    previewText: "Quick 2-minute survey to personalize your VIP experience + bonus strategy guide",
    category: "VIP",
  },
  {
    name: "Welcome Email",
    description: "Email sent to welcome new subscribers",
    subject: "Welcome to MarketSage!",
    content: "<h1>Welcome to MarketSage!</h1><p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>",
    previewText: "Welcome to the MarketSage community",
    category: "Onboarding",
  },
  {
    name: "Monthly Newsletter",
    description: "Regular monthly newsletter template",
    subject: "MarketSage Monthly Updates",
    content: "<h1>Monthly Newsletter</h1><p>Here are the latest updates from MarketSage this month.</p>",
    previewText: "Check out what's new this month",
    category: "Newsletter",
  },
  {
    name: "Product Announcement",
    description: "Template for announcing new products or features",
    subject: "Exciting New Features Just Launched!",
    content: "<h1>New Features Available!</h1><p>We're excited to announce our latest features that will help you grow your business.</p>",
    previewText: "Check out our latest product updates",
    category: "Marketing",
  }
];

// Sample email campaigns data
const sampleCampaigns = [
  {
    name: "Welcome Campaign",
    description: "First welcome email for new subscribers",
    subject: "Welcome to MarketSage!",
    from: "marketing@marketsage.com",
    replyTo: "support@marketsage.com",
    status: CampaignStatus.DRAFT,
  },
  {
    name: "June Newsletter",
    description: "Monthly newsletter for June 2023",
    subject: "MarketSage June Updates",
    from: "newsletter@marketsage.com",
    replyTo: "marketing@marketsage.com",
    status: CampaignStatus.SCHEDULED,
    scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    name: "Product Launch",
    description: "Announcement for new dashboard features",
    subject: "New Dashboard Features Available Now!",
    from: "updates@marketsage.com",
    replyTo: "support@marketsage.com",
    status: CampaignStatus.SENT,
    sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
  }
];

async function seedEmailMarketing() {
  console.log("Starting to seed email marketing data...");

  // Get the first admin user
  let adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({});

    if (!adminUser) {
      console.error("No users found in the database. Please create a user first.");
      return;
    }
  }

  console.log(`Using user ${adminUser.email} (${adminUser.id}) as the creator.`);

  // Create email templates
  const createdTemplates = [];
  for (const templateData of sampleTemplates) {
    try {
      const now = new Date();
      const template = await prisma.emailTemplate.create({
        data: {
          id: randomUUID(),
          name: templateData.name,
          description: templateData.description,
          subject: templateData.subject,
          content: templateData.content,
          previewText: templateData.previewText,
          category: templateData.category,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now
        },
      });
      createdTemplates.push(template);
      console.log(`Created email template: ${template.name} (${template.id})`);
    } catch (error) {
      console.error(`Error creating email template "${templateData.name}":`, error);
    }
  }

  // Get lists for campaigns
  const lists = await prisma.list.findMany({
    take: 3,
  });

  if (lists.length === 0) {
    console.log("No lists found. Consider running seedLists.ts first.");
  } else {
    console.log(`Found ${lists.length} lists to use for campaigns.`);
  }

  // Get segments for campaigns
  const segments = await prisma.segment.findMany({
    take: 2,
  });

  if (segments.length === 0) {
    console.log("No segments found. Consider creating segments first.");
  } else {
    console.log(`Found ${segments.length} segments to use for campaigns.`);
  }

  // Create email campaigns
  const createdCampaigns = [];
  for (let i = 0; i < sampleCampaigns.length; i++) {
    const campaignData = sampleCampaigns[i];
    
    try {
      // Use the corresponding template if available
      const templateToUse = createdTemplates[i] || null;
      
      // Determine which lists to use (alternate between available lists)
      const selectedLists = lists.filter((_, index) => index % (i + 1) === 0);
      
      // Create the campaign
      const now = new Date();
      const campaign = await prisma.emailCampaign.create({
        data: {
          id: randomUUID(),
          name: campaignData.name,
          description: campaignData.description,
          subject: campaignData.subject,
          from: campaignData.from,
          replyTo: campaignData.replyTo,
          status: campaignData.status,
          scheduledFor: campaignData.scheduledFor,
          sentAt: campaignData.sentAt,
          createdById: adminUser.id,
          createdAt: now,
          updatedAt: now,
          ...(templateToUse ? { templateId: templateToUse.id } : {}),
          ...(selectedLists.length > 0 ? {
            lists: {
              connect: selectedLists.map(list => ({ id: list.id })),
            },
          } : {}),
          ...(segments.length > 0 && i === 2 ? { // Only connect segments to the third campaign
            segments: {
              connect: segments.map(segment => ({ id: segment.id })),
            },
          } : {}),
        },
      });
      
      createdCampaigns.push(campaign);
      console.log(`Created email campaign: ${campaign.name} (${campaign.id})`);
      
      // If the campaign is marked as sent, create some email activities for it
      if (campaign.status === CampaignStatus.SENT) {
        // Get some contacts to create activities for
        const contacts = await prisma.contact.findMany({
          take: 20,
        });
        
        if (contacts.length > 0) {
          for (const contact of contacts) {
            // Create random email activities
            const activityType = Math.random() > 0.7 ? "OPENED" : 
                                Math.random() > 0.5 ? "DELIVERED" : 
                                Math.random() > 0.3 ? "CLICKED" : "SENT";
            
            await prisma.emailActivity.create({
              data: {
                id: randomUUID(),
                campaignId: campaign.id,
                contactId: contact.id,
                type: activityType,
                timestamp: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
              },
            });
          }
          
          console.log(`Created email activities for ${contacts.length} contacts.`);
        }
      }
    } catch (error) {
      console.error(`Error creating email campaign "${campaignData.name}":`, error);
    }
  }

  console.log(`Successfully created ${createdTemplates.length} email templates and ${createdCampaigns.length} email campaigns.`);

  await prisma.$disconnect();
}

// Run the seed function
seedEmailMarketing()
  .catch((error) => {
    console.error("Error running seed script:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("Email marketing data seeding complete.");
  }); 