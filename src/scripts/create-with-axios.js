// Script to authenticate and create an SMS campaign using axios
const axios = require('axios');
const { URLSearchParams } = require('url');

// Create an axios instance that includes credentials
const api = axios.create({
  baseURL: 'http://localhost:3030',
  withCredentials: true
});

async function main() {
  try {
    console.log("Starting authentication process...");

    // First, get the CSRF token
    const csrfResponse = await api.get('/api/auth/csrf');
    const csrfToken = csrfResponse.data.csrfToken;
    
    console.log("Got CSRF token:", csrfToken);

    // Prepare credentials
    const params = new URLSearchParams();
    params.append('csrfToken', csrfToken);
    params.append('email', 'supreme@marketsage.africa');
    params.append('password', 'MS_Super2025!');
    params.append('callbackUrl', 'http://localhost:3030');
    params.append('json', 'true');

    // Attempt to sign in
    console.log("Attempting to sign in...");
    const authResponse = await api.post('/api/auth/signin/credentials', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      maxRedirects: 5
    });

    console.log("Auth response status:", authResponse.status);
    
    // Check if we have a session
    const sessionResponse = await api.get('/api/auth/session');
    console.log("Session data:", sessionResponse.data);

    if (sessionResponse.data && sessionResponse.data.user) {
      console.log("Successfully authenticated as:", sessionResponse.data.user.email);

      // Create the SMS campaign
      const campaignData = {
        name: "Test SMS Campaign via Axios",
        description: "Created with axios and authentication",
        from: "+12345678901",
        content: "Hello! This is a test SMS message with axios authentication.",
        listIds: [],
        segmentIds: []
      };

      console.log("Attempting to create SMS campaign...");
      try {
        const response = await api.post('/api/sms/campaigns', campaignData);
        console.log("Success! Campaign created:");
        console.log(response.data);
      } catch (error) {
        console.log("Failed to create campaign:");
        if (error.response) {
          console.log(error.response.status, error.response.data);
        } else {
          console.log(error.message);
        }
      }
    } else {
      console.log("Could not verify authentication. Please check credentials.");
      
      // Let's try a direct request to create campaign anyway
      console.log("Attempting direct campaign creation...");
      try {
        const campaignData = {
          name: "Test SMS Campaign Direct",
          description: "Direct attempt without verified auth",
          from: "+12345678901",
          content: "Hello! This is a direct test without verified auth.",
          listIds: [],
          segmentIds: []
        };
        
        const response = await api.post('/api/sms/campaigns', campaignData);
        console.log("Surprisingly, it worked!");
        console.log(response.data);
      } catch (error) {
        console.log("Direct attempt failed as expected:");
        if (error.response) {
          console.log(error.response.status, error.response.data);
        } else {
          console.log(error.message);
        }
      }
    }
  } catch (error) {
    console.error("Error in the authentication flow:");
    if (error.response) {
      console.log(error.response.status, error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

main(); 