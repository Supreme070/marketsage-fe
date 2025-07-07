const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:3000';
let sessionCookies = '';

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookies,
      ...options.headers,
    },
  });
  
  const setCookieHeaders = response.headers.raw()['set-cookie'];
  if (setCookieHeaders) {
    sessionCookies = setCookieHeaders.join('; ');
  }
  
  return response;
}

async function authenticateUser() {
  console.log('🔐 Authenticating...');
  
  const csrfResponse = await makeRequest(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfResponse.json();
  
  const signinData = new URLSearchParams({
    email: 'supreme@marketsage.africa',
    password: 'MS_Super2025!',
    csrfToken: csrfData.csrfToken,
    callbackUrl: `${BASE_URL}/dashboard`,
    json: 'true'
  });
  
  await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': sessionCookies,
    },
    body: signinData.toString(),
    redirect: 'manual'
  });
  
  const sessionResponse = await makeRequest(`${BASE_URL}/api/auth/session`);
  const sessionData = await sessionResponse.json();
  
  return !!sessionData.user;
}

async function updateKolaEmail() {
  console.log('📧 Updating Kola\'s email address...');
  
  // First, find Kola
  const contactsResponse = await makeRequest(`${BASE_URL}/api/contacts`);
  const contacts = await contactsResponse.json();
  
  const kola = contacts.find(contact => 
    contact.name?.toLowerCase().includes('kola') || 
    contact.email?.toLowerCase().includes('kola') ||
    contact.firstName?.toLowerCase().includes('kola')
  );
  
  if (kola) {
    console.log(`✅ Found Kola: ${kola.name} (${kola.email})`);
    
    // Update the email
    const updateResponse = await makeRequest(`${BASE_URL}/api/contacts/${kola.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...kola,
        email: 'kolajoseph87@gmail.com'
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Updated Kola\'s email to: kolajoseph87@gmail.com');
      return true;
    } else {
      const error = await updateResponse.text();
      console.log('❌ Failed to update Kola\'s email:', error);
      return false;
    }
  } else {
    console.log('❌ Kola not found');
    return false;
  }
}

async function createPersonalizedMarketingEmail() {
  const personalizedHtml = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; overflow: hidden;">
  
  <!-- Header -->
  <div style="background: rgba(255,255,255,0.95); padding: 30px; text-align: center;">
    <h1 style="color: #2c3e50; margin: 0; font-size: 28px; font-weight: 700;">
      🚀 Welcome to MarketSage
    </h1>
    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">
      Smart Marketing Solutions for African Businesses
    </p>
  </div>

  <!-- Main Content -->
  <div style="background: white; padding: 40px 30px;">
    
    <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 24px;">
      Transform Your Marketing Today! 🎯
    </h2>
    
    <p style="color: #34495e; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
      Dear {{firstName}},
    </p>
    
    <p style="color: #34495e; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
      Are you ready to revolutionize your marketing strategy? MarketSage is the complete marketing automation platform designed specifically for African businesses like yours.
    </p>

    <!-- Features Grid -->
    <div style="margin: 30px 0;">
      
      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3498db;">
        <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px;">📧 Email Marketing Mastery</h3>
        <p style="color: #34495e; margin: 0; line-height: 1.5;">
          Create stunning email campaigns with our visual editor. Advanced automation, A/B testing, and detailed analytics included.
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #e74c3c;">
        <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px;">📱 SMS & WhatsApp Campaigns</h3>
        <p style="color: #34495e; margin: 0; line-height: 1.5;">
          Reach your customers instantly with SMS and WhatsApp marketing. Perfect for time-sensitive promotions and updates.
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f39c12;">
        <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px;">🤖 AI-Powered Intelligence</h3>
        <p style="color: #34495e; margin: 0; line-height: 1.5;">
          Our Supreme-AI engine provides intelligent insights, customer segmentation, and predictive analytics tailored for African markets.
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #27ae60;">
        <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px;">📊 LeadPulse Analytics</h3>
        <p style="color: #34495e; margin: 0; line-height: 1.5;">
          Real-time visitor tracking, conversion analytics, and customer journey mapping to optimize your marketing funnel.
        </p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #9b59b6;">
        <h3 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 18px;">⚡ Workflow Automation</h3>
        <p style="color: #34495e; margin: 0; line-height: 1.5;">
          Build sophisticated marketing workflows with our drag-and-drop editor. Automate everything from lead nurturing to customer retention.
        </p>
      </div>

    </div>

    <!-- Personal Message -->
    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #27ae60;">
      <p style="color: #2c3e50; margin: 0; line-height: 1.6; font-size: 16px;">
        <strong>{{firstName}}, as a valued member of our community,</strong> we're excited to offer you exclusive early access to our advanced features and personalized onboarding support.
      </p>
    </div>

    <!-- Special Offer -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; color: white;">
      <h3 style="margin: 0 0 15px 0; font-size: 20px;">🎉 Exclusive Launch Offer for {{firstName}}</h3>
      <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">
        Get started with MarketSage today and receive <strong>3 months FREE</strong> on any annual plan, plus personalized setup assistance!
      </p>
      <a href="https://marketsage.africa/pricing?ref={{email}}" style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
        Claim Your Offer 🚀
      </a>
    </div>

    <!-- Testimonial -->
    <div style="background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #34495e;">
      <p style="color: #2c3e50; font-style: italic; margin: 0 0 10px 0; line-height: 1.6;">
        "MarketSage transformed our customer engagement. We saw a 300% increase in email open rates and 150% boost in conversions within the first month!"
      </p>
      <p style="color: #7f8c8d; margin: 0; font-size: 14px;">
        — Adaora Okafor, Marketing Director, Lagos Tech Hub
      </p>
    </div>

    <!-- African Markets Focus -->
    <div style="margin: 30px 0;">
      <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 20px;">🌍 Built for African Markets</h3>
      <p style="color: #34495e; line-height: 1.6; margin-bottom: 15px;">
        MarketSage understands the unique challenges and opportunities in African markets:
      </p>
      <ul style="color: #34495e; line-height: 1.8; padding-left: 20px;">
        <li>Multi-currency support (NGN, KES, ZAR, GHS)</li>
        <li>Local payment gateway integrations (Paystack, Flutterwave)</li>
        <li>Cultural intelligence for personalized messaging</li>
        <li>Mobile-first design for high mobile penetration</li>
        <li>Multi-language support for diverse markets</li>
      </ul>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin: 40px 0 20px 0;">
      <a href="https://marketsage.africa/demo?ref={{email}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
        Book Your Personal Demo 📅
      </a>
    </div>

    <p style="color: #7f8c8d; text-align: center; font-size: 14px; margin: 20px 0;">
      No credit card required • 14-day free trial • Cancel anytime
    </p>

  </div>

  <!-- Footer -->
  <div style="background: #2c3e50; color: white; padding: 30px; text-align: center;">
    <h4 style="margin: 0 0 15px 0; color: #3498db;">Ready to Get Started, {{firstName}}?</h4>
    <p style="margin: 0 0 20px 0; opacity: 0.8; line-height: 1.6;">
      Join thousands of African businesses already using MarketSage to grow their customer base and increase revenue.
    </p>
    
    <div style="margin: 20px 0;">
      <a href="mailto:info@marketsage.africa" style="color: #3498db; text-decoration: none; margin: 0 15px;">📧 info@marketsage.africa</a>
      <a href="https://marketsage.africa" style="color: #3498db; text-decoration: none; margin: 0 15px;">🌐 www.marketsage.africa</a>
    </div>
    
    <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
      This email was sent to {{email}}. Questions? Just reply to this email.
    </p>
  </div>

</div>
`;

  return personalizedHtml;
}

async function sendPersonalizedCampaign() {
  console.log('📧 Creating personalized marketing campaign...');
  
  const personalizedHtml = await createPersonalizedMarketingEmail();
  
  // Get the list info
  const listsResponse = await makeRequest(`${BASE_URL}/api/lists`);
  const lists = await listsResponse.json();
  const testList = lists.find(list => list.name === 'Test Marketing List');
  
  if (!testList) {
    console.log('❌ Test Marketing List not found');
    return;
  }
  
  const campaignData = {
    name: `MarketSage Personalized Campaign - ${new Date().toISOString().substring(0, 10)}`,
    subject: '🚀 {{firstName}}, Transform Your Marketing with MarketSage - Exclusive Offer Inside!',
    from: 'info@marketsage.africa',
    replyTo: 'hello@marketsage.africa',
    content: personalizedHtml,
    listIds: [testList.id],
  };
  
  const campaignResponse = await makeRequest(`${BASE_URL}/api/email/campaigns`, {
    method: 'POST',
    body: JSON.stringify(campaignData),
  });
  
  if (!campaignResponse.ok) {
    const error = await campaignResponse.text();
    console.log('❌ Campaign creation failed:', error);
    return;
  }
  
  const campaign = await campaignResponse.json();
  console.log('✅ Personalized campaign created!');
  console.log(`   Campaign ID: ${campaign.id}`);
  
  // Send campaign
  console.log('📤 Sending personalized campaign...');
  const sendResponse = await makeRequest(`${BASE_URL}/api/email/campaigns/${campaign.id}/send`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  
  if (!sendResponse.ok) {
    const error = await sendResponse.text();
    console.log('❌ Campaign send failed:', error);
    return;
  }
  
  const sendResult = await sendResponse.json();
  console.log('🎉 Personalized emails sent successfully!');
  console.log(`   Total Contacts: ${sendResult.totalContacts}`);
  console.log(`   Sent Count: ${sendResult.sentCount}`);
  console.log(`   Failed Count: ${sendResult.failedCount}`);
  
  console.log('\n✨ Check your inboxes for personalized emails!');
  console.log('📧 Supreme should see: "Dear Supreme,"');
  console.log('📧 Kola should see: "Dear Kola,"');
}

async function runPersonalizationFix() {
  console.log('🔧 Fixing Email Personalization & Kola\'s Email Address...\n');
  
  try {
    const isAuthenticated = await authenticateUser();
    if (!isAuthenticated) {
      console.log('❌ Authentication failed');
      return;
    }
    console.log('✅ Authentication successful\n');
    
    // Skip email update for now, focus on personalization
    console.log('⏭️  Skipping email update for now, focusing on personalization...\n');
    
    await sendPersonalizedCampaign();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the fix
runPersonalizationFix();