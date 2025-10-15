#!/bin/bash

# MarketSage Email Test Script
# This script sends test emails using curl

echo "🚀 MarketSage Email Test Script"
echo "================================"
echo ""

# Base URL
BASE_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3002}"

# Function to send test email
send_test_email() {
    local email="$1"
    echo "📧 Sending test email to: $email"
    
    curl -X POST "$BASE_URL/api/email/test" \
        -H "Content-Type: application/json" \
        -d "{
            \"to\": \"$email\",
            \"subject\": \"MarketSage Test Email - $(date)\",
            \"content\": \"This is a test email from MarketSage to verify email configuration is working correctly.\"
        }" \
        -w "\nHTTP Status: %{http_code}\n" \
        -s | jq '.' || echo "Failed to parse response"
    
    echo ""
    echo "---"
    echo ""
}

# Check if emails are provided as arguments
if [ $# -eq 0 ]; then
    # Use default emails
    echo "📬 Sending test emails to default recipients:"
    echo "   - marketsageltd@gmail.com"
    echo "   - kolajoseph87@gmail.com"
    echo ""
    
    send_test_email "marketsageltd@gmail.com"
    sleep 1
    send_test_email "kolajoseph87@gmail.com"
else
    # Use provided emails
    echo "📬 Sending test emails to:"
    for email in "$@"; do
        echo "   - $email"
    done
    echo ""
    
    for email in "$@"; do
        send_test_email "$email"
        sleep 1
    done
fi

echo "✨ Email test completed!"
echo ""
echo "Note: If you get a 401 error, you need to be authenticated."
echo "Please log into MarketSage first and use the web interface to test emails."