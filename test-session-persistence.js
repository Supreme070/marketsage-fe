const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');

async function testSessionPersistence() {
  console.log('🧪 Testing NextAuth Session Persistence...\n');
  
  const jar = new CookieJar();
  const baseUrl = 'http://localhost:3000';
  
  // Helper function to make requests with cookie handling
  async function makeRequest(url, options = {}) {
    const cookieHeader = await jar.getCookieString(url);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    // Store cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(',').map(cookie => cookie.trim());
      for (const cookie of cookies) {
        await jar.setCookie(cookie, url);
      }
    }
    
    return response;
  }
  
  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    console.log('CSRF token:', csrfData.csrfToken);
    
    // Step 2: Attempt sign in
    console.log('\n2️⃣ Attempting sign in...');
    const signinResponse = await makeRequest(`${baseUrl}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'adewolemayowa@gmail.com',
        password: 'admin123456',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000/dashboard',
        json: 'true'
      })
    });
    
    console.log('Sign-in response status:', signinResponse.status);
    console.log('Sign-in response headers:', Object.fromEntries(signinResponse.headers.entries()));
    
    const signinResult = await signinResponse.text();
    console.log('Sign-in response body:', signinResult);
    
    // Step 3: Check session immediately after signin
    console.log('\n3️⃣ Checking session after signin...');
    const sessionResponse = await makeRequest(`${baseUrl}/api/auth/session`);
    const sessionData = await sessionResponse.json();
    console.log('Session data:', JSON.stringify(sessionData, null, 2));
    
    // Step 4: Check debug auth endpoint
    console.log('\n4️⃣ Checking debug auth endpoint...');
    const debugResponse = await makeRequest(`${baseUrl}/api/debug-auth`);
    const debugData = await debugResponse.json();
    console.log('Debug auth data:', JSON.stringify(debugData, null, 2));
    
    // Step 5: Test a protected API endpoint
    console.log('\n5️⃣ Testing protected API endpoint...');
    const apiResponse = await makeRequest(`${baseUrl}/api/v2/notifications`);
    console.log('API response status:', apiResponse.status);
    const apiData = await apiResponse.text();
    console.log('API response body:', apiData);
    
    // Step 6: Check session again
    console.log('\n6️⃣ Checking session again...');
    const sessionResponse2 = await makeRequest(`${baseUrl}/api/auth/session`);
    const sessionData2 = await sessionResponse2.json();
    console.log('Session data (2nd check):', JSON.stringify(sessionData2, null, 2));
    
    // Step 7: Check what cookies we have
    console.log('\n7️⃣ Checking stored cookies...');
    const cookies = await jar.getCookies(baseUrl);
    console.log('Stored cookies:', cookies.map(c => `${c.key}=${c.value.substring(0, 20)}...`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSessionPersistence();

