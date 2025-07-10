# API Integration Nodes for MarketSage Workflows

This guide explains how to use the new API integration nodes in MarketSage workflows to connect with external CRM systems, payment processors, and custom APIs.

## Overview

The workflow system now supports three new node types for external API integrations:

1. **Generic API Call Node** - Make HTTP requests to any REST API
2. **CRM Action Node** - Perform specific CRM operations (HubSpot, Salesforce, etc.)
3. **Payment Webhook Node** - Send payment-related webhooks (Stripe, PayPal, Paystack)

## Security Features

- **HTTPS Only**: All external API calls require HTTPS URLs (except localhost for development)
- **Rate Limiting**: Built-in rate limiting prevents API abuse
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Timeout Control**: Configurable request timeouts (1-60 seconds)
- **Authentication Support**: Multiple authentication methods supported

## 1. Generic API Call Node

### Use Cases
- Integration with custom APIs
- Webhook notifications
- Data synchronization
- Third-party service integration

### Configuration

#### Endpoint Tab
- **API URL**: The full HTTPS URL of the API endpoint
- **HTTP Method**: GET, POST, PUT, PATCH, or DELETE

#### Authentication Tab
- **None**: No authentication required
- **Bearer Token**: Authorization: Bearer {token}
- **API Key**: Custom header with API key
- **Basic Auth**: Username/password authentication

#### Body Tab
- **Request Body Template**: JSON template with variable substitution
- Supports variables like `{{contact.email}}`, `{{contact.firstName}}`, `{{workflow.name}}`

#### Settings Tab
- **Timeout**: Request timeout in milliseconds (1000-60000)
- **Retry Count**: Number of retry attempts (0-10)

### Example Configuration

```json
{
  "url": "https://api.example.com/contacts",
  "method": "POST",
  "authentication": {
    "type": "bearer",
    "credentials": {
      "token": "your-api-token"
    }
  },
  "bodyTemplate": "{\"email\": \"{{contact.email}}\", \"name\": \"{{contact.firstName}} {{contact.lastName}}\", \"source\": \"{{workflow.name}}\"}",
  "timeout": 30000,
  "retryCount": 3
}
```

## 2. CRM Action Node

### Supported CRM Providers
- **HubSpot**: Full API integration
- **Salesforce**: Contact and lead management
- **Pipedrive**: Contact and deal operations
- **Zoho CRM**: Contact management
- **Custom API**: Any CRM with REST API

### Supported Actions
- **Create Contact**: Add new contact to CRM
- **Update Contact**: Modify existing contact
- **Add to List**: Add contact to specific list/segment
- **Remove from List**: Remove contact from list/segment
- **Add Tag**: Tag a contact
- **Remove Tag**: Remove tag from contact

### Configuration

#### Action Tab
- **CRM Provider**: Select your CRM system
- **Action Type**: Choose the operation to perform
- **Custom API URL**: For custom CRM integrations

#### Mapping Tab
- **Field Mapping**: Map MarketSage contact fields to CRM fields
- Dynamic field mapping with add/remove functionality

#### Connection Tab
- **API Key/Token**: Authentication credentials
- **Provider-specific settings**: Instance URLs, etc.

### Example Field Mapping

```json
{
  "fieldMapping": [
    {"crmField": "email", "contactField": "contact.email"},
    {"crmField": "firstname", "contactField": "contact.firstName"},
    {"crmField": "lastname", "contactField": "contact.lastName"},
    {"crmField": "company", "contactField": "contact.company"}
  ]
}
```

## 3. Payment Webhook Node

### Supported Payment Providers
- **Stripe**: Complete webhook support
- **PayPal**: Payment notifications
- **Paystack**: African payment processing
- **Flutterwave**: African payment gateway
- **Custom**: Any payment webhook endpoint

### Supported Webhook Types
- **Payment Success**: Successful payment notification
- **Payment Failed**: Failed payment notification
- **Subscription Created**: New subscription webhook
- **Subscription Cancelled**: Cancelled subscription webhook
- **Refund Processed**: Refund completion webhook

### Configuration

#### Webhook Tab
- **Payment Provider**: Select payment processor
- **Webhook Type**: Choose event type
- **Webhook URL**: Destination URL for webhook

#### Payload Tab
- **Event Data**: Additional JSON data to include
- Supports variable substitution

#### Security Tab
- **Webhook Secret**: Secret key for signature verification

### Example Configuration

```json
{
  "provider": "stripe",
  "webhookType": "payment_success",
  "url": "https://your-app.com/webhooks/stripe",
  "eventData": {
    "amount": 1000,
    "currency": "USD",
    "customer_id": "{{contact.id}}",
    "email": "{{contact.email}}"
  },
  "secretKey": "whsec_your_webhook_secret"
}
```

## Variable Substitution

All API integration nodes support variable substitution in URLs, body templates, and event data:

### Available Variables
- `{{contact.email}}` - Contact email address
- `{{contact.firstName}}` - Contact first name
- `{{contact.lastName}}` - Contact last name
- `{{contact.company}}` - Contact company
- `{{contact.phone}}` - Contact phone number
- `{{contact.id}}` - Contact ID
- `{{workflow.name}}` - Workflow name
- `{{workflow.id}}` - Workflow ID
- `{{variables.customField}}` - Custom workflow variables
- `{{timestamp}}` - Current ISO timestamp
- `{{uuid}}` - Generated UUID

### Example Usage

```json
{
  "bodyTemplate": "{\"contact\": {\"email\": \"{{contact.email}}\", \"name\": \"{{contact.firstName}} {{contact.lastName}}\", \"created_at\": \"{{timestamp}}\", \"source\": \"workflow-{{workflow.id}}\"}}"
}
```

## Error Handling and Monitoring

### Automatic Retry Logic
- Configurable retry attempts (0-10)
- Exponential backoff between retries
- Preserves original error messages

### Rate Limiting
- Built-in rate limiting per contact
- Prevents API abuse and quota exhaustion
- Graceful error handling when limits exceeded

### Logging and Monitoring
- All API calls are logged with request/response details
- Error tracking with detailed error messages
- Performance monitoring for response times

### Success/Failure Handling
- Custom success condition evaluation
- Response data mapping for downstream workflow steps
- Context variable storage for successful responses

## Best Practices

### Security
1. **Use Environment Variables**: Store API keys and secrets in environment variables
2. **HTTPS Only**: Never use HTTP URLs for production integrations
3. **Webhook Signatures**: Always verify webhook signatures when possible
4. **Rate Limiting**: Respect API rate limits and implement appropriate delays

### Performance
1. **Timeout Configuration**: Set appropriate timeouts based on API response times
2. **Retry Strategy**: Use exponential backoff for retries
3. **Batch Operations**: Consider batching when APIs support it
4. **Caching**: Cache responses when appropriate to reduce API calls

### Reliability
1. **Error Handling**: Always handle API errors gracefully
2. **Validation**: Validate all configuration before deployment
3. **Testing**: Test integrations thoroughly with sample data
4. **Monitoring**: Monitor API call success rates and response times

## Troubleshooting

### Common Issues

#### 1. SSL/TLS Errors
- Ensure API URLs use HTTPS
- Check certificate validity
- Verify TLS version compatibility

#### 2. Authentication Failures
- Verify API credentials are correct
- Check token expiration
- Ensure proper header format

#### 3. Rate Limiting
- Implement appropriate delays between requests
- Monitor API usage quotas
- Consider upgrading API plans if needed

#### 4. Timeout Errors
- Increase timeout values for slow APIs
- Check network connectivity
- Consider API server response times

### Debugging Steps

1. **Check Logs**: Review workflow execution logs for detailed error messages
2. **Test Configuration**: Use API testing tools to verify endpoints work
3. **Validate Data**: Ensure variable substitution produces valid data
4. **Monitor Network**: Check for network connectivity issues

## API Provider-Specific Notes

### HubSpot
- Requires private app token or OAuth
- Rate limit: 100 requests per 10 seconds
- Uses property-based contact model

### Salesforce
- Requires OAuth or session ID
- Instance URL required (e.g., your-company.salesforce.com)
- Uses sobject-based data model

### Stripe
- Requires secret key for API calls
- Webhook endpoint verification recommended
- Supports idempotency keys

### PayPal
- Requires client credentials for OAuth
- Sandbox vs production environment URLs
- Event verification through IPN

### Paystack
- Requires secret key
- African-focused payment processing
- Webhook signature verification supported

## Migration from Existing Webhooks

If you're migrating from the existing webhook node to the new API integration nodes:

1. **Generic API → API Call Node**: Direct migration with enhanced features
2. **Payment Processing → Payment Webhook Node**: More structured payment handling
3. **CRM Updates → CRM Action Node**: Simplified CRM operations with field mapping

The new nodes provide better error handling, validation, and monitoring compared to the generic webhook node.