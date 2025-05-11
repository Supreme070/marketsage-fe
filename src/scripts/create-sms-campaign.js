// Script to authenticate and create an SMS campaign
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const { execSync } = require('child_process');

async function main() {
  try {
    // First, let's try to create a campaign directly with the necessary data
    // We'll use proper JSON content and provide the required fields
    
    const campaignData = {
      name: "Test SMS Campaign via Script",
      description: "Created via Node.js script",
      from: "+12345678901",
      content: "Hello! This is a test SMS message sent via our platform.",
      listIds: [],
      segmentIds: []
    };

    console.log("Attempting to create SMS campaign...");

    const response = await fetch('http://localhost:3030/api/sms/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaignData),
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Success! Campaign created:");
      console.log(result);
    } else {
      console.log("Failed to create campaign:");
      console.log(result);
      
      // Let's try accessing the session endpoint to see what we get
      console.log("\nChecking session status...");
      const sessionResponse = await fetch('http://localhost:3030/api/auth/session', {
        credentials: 'include'
      });
      
      const sessionData = await sessionResponse.json();
      console.log("Session data:", sessionData);
      
      // Note: In a browser environment, you would need to log in first
      console.log("\nPlease log in through the browser first at http://localhost:3030/login");
      console.log("Then try running this script again.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main(); 