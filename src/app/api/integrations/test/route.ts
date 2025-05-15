import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Test integration connection without saving
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, credentials } = body;

    if (!type || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Simulate API verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, we'll use a simple validation
    // In a real app, you'd make actual API calls to the services
    let isValid = true;
    let message = "Test successful! Your credentials are valid.";
    
    // Basic validation based on integration type
    switch (type) {
      case "ECOMMERCE_SHOPIFY":
        if (!credentials.apiKey || !credentials.apiSecret || !credentials.storeUrl) {
          isValid = false;
          message = "Invalid credentials. Please provide API Key, API Secret, and Store URL.";
        }
        break;
      case "ECOMMERCE_WOOCOMMERCE":
        if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.storeUrl) {
          isValid = false;
          message = "Invalid credentials. Please provide Consumer Key, Consumer Secret, and Store URL.";
        }
        break;
      case "PAYMENT_STRIPE":
        if (!credentials.secretKey || !credentials.publishableKey) {
          isValid = false;
          message = "Invalid credentials. Please provide Secret Key and Publishable Key.";
        }
        break;
      case "PAYMENT_PAYPAL":
        if (!credentials.clientId || !credentials.clientSecret) {
          isValid = false;
          message = "Invalid credentials. Please provide Client ID and Client Secret.";
        }
        break;
      case "CRM_HUBSPOT":
        if (!credentials.apiKey) {
          isValid = false;
          message = "Invalid credentials. Please provide API Key.";
        }
        break;
      case "CRM_SALESFORCE":
        if (!credentials.clientId || !credentials.clientSecret || !credentials.instanceUrl) {
          isValid = false;
          message = "Invalid credentials. Please provide Client ID, Client Secret, and Instance URL.";
        }
        break;
      default:
        isValid = Object.values(credentials).every(val => !!val);
        if (!isValid) {
          message = "Invalid credentials. All fields are required.";
        }
    }

    return NextResponse.json({
      success: isValid,
      message: message
    });
  } catch (error) {
    console.error("Error testing integration:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to test integration. Please try again later."
      },
      { status: 500 }
    );
  }
} 