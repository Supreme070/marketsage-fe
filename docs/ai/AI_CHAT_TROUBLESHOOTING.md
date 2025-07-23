# AI Chat Troubleshooting Guide

## Common Issues and Solutions

### Issue: "I apologize, but I encountered an error while processing your request"

This error typically occurs due to one of the following issues:

### 1. Missing OpenAI API Key

**Problem**: The AI chat system can't access OpenAI services without a valid API key.

**Solution**: 
1. Create a `.env.local` file in the project root if it doesn't exist
2. Add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```
3. Restart the development server

**Note**: The system will work with a local fallback AI when no API key is provided, but you may see this error during the transition.

### 2. Database Connection Issues

**Problem**: The system can't connect to PostgreSQL database.

**Solution**:
1. Ensure PostgreSQL is running
2. Check your database URL in `.env.local`:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/marketsage"
```
3. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Prisma Client Issues

**Problem**: Database client is not properly initialized.

**Solution**:
1. Regenerate Prisma client:
```bash
npx prisma generate
```
2. Reset the database if needed:
```bash
npx prisma migrate reset
```

## Quick Fixes

### Restart Development Server
```bash
npm run dev
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Verify Environment Variables
```bash
# Check if environment variables are loaded
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI API Key: SET' : 'OpenAI API Key: NOT SET')"
node -e "console.log(process.env.DATABASE_URL ? 'Database URL: SET' : 'Database URL: NOT SET')"
```

## Working Without OpenAI

The AI chat system has intelligent fallbacks that work without OpenAI:

- **Local AI Engine**: Provides basic sentiment analysis and content recommendations
- **Fallback Responses**: Context-aware responses for common MarketSage questions
- **Graceful Degradation**: System continues to work with reduced AI capabilities

## Testing the Chat

1. Go to `/ai-intelligence/chat` in your browser
2. Try simple questions like:
   - "How do I create an email campaign?"
   - "What are the best practices for SMS marketing?"
   - "Help me with customer segmentation"

## Expected Behavior

- **With OpenAI API Key**: Full AI capabilities with contextual responses
- **Without OpenAI API Key**: Fallback responses that are still helpful
- **Database Issues**: System provides general guidance while logging errors

## Getting Help

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Check the server logs for backend errors
3. Verify all environment variables are properly set
4. Ensure all dependencies are installed: `npm install`

## Environment Template

Create `.env.local` with these variables:

```bash
# OpenAI Configuration (Optional - system works without it)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database Configuration (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/marketsage"

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Other API Keys (Optional)
WHATSAPP_API_KEY=your-whatsapp-key
SENDGRID_API_KEY=your-sendgrid-key
```

The system is designed to work gracefully even when some services are unavailable, ensuring users can always get help with MarketSage. 