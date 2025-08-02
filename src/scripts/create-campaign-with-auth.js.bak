// Script to authenticate and create an SMS campaign using credentials
const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');
const fetchCookie = require('fetch-cookie');

async function main() {
  // Create a cookie jar to store and send cookies
  const cookieJar = new CookieJar();
  const fetchWithCookies = fetchCookie(fetch, cookieJar);

  try {
    console.log("Starting authentication process...");

    // First, get the CSRF token
    const csrfResponse = await fetchWithCookies('http://localhost:3030/api/auth/csrf');
    const { csrfToken } = await csrfResponse.json();
    
    console.log("Got CSRF token:", csrfToken);

    // Authenticate with credentials
    const authParams = new URLSearchParams();
    authParams.append('csrfToken', csrfToken);
    authParams.append('email', 'supreme@marketsage.africa');
    authParams.append('password', 'MS_Super2025!');
    authParams.append('callbackUrl', 'http://localhost:3030');
    authParams.append('json', 'true');

    console.log("Attempting to sign in...");
    const authResponse = await fetchWithCookies('http://localhost:3030/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authParams.toString(),
      redirect: 'follow',
    });

    const authResult = await authResponse.json();
    console.log("Authentication response:", authResult);

    // Now check the session
    console.log("Checking session...");
    const sessionResponse = await fetchWithCookies('http://localhost:3030/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log("Session data:", sessionData);

    if (sessionData && sessionData.user) {
      console.log("Successfully authenticated as:", sessionData.user.email);

      // Create the SMS campaign
      const campaignData = {
        name: "Test SMS Campaign via Auth Script",
        description: "Created via Node.js script with authentication",
        from: "+12345678901",
        content: "Hello! This is a test SMS message with authentication.",
        listIds: [],
        segmentIds: []
      };

      console.log("Attempting to create SMS campaign...");
      const response = await fetchWithCookies('http://localhost:3030/api/sms/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Success! Campaign created:");
        console.log(result);
      } else {
        console.log("Failed to create campaign:");
        console.log(result);
      }
    } else {
      console.log("Authentication failed. Please check credentials.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Note: Before running this script, install required packages:
// npm install node-fetch@2 tough-cookie fetch-cookie

main(); 