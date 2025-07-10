import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized,
  validationError 
} from "@/lib/errors";

// Schema for WhatsApp personalization preview request
const previewSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  contactId: z.string().optional(),
  sampleData: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    customFields: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

// POST endpoint to preview personalized WhatsApp content
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const validation = previewSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError("Invalid preview request", validation.error.format());
    }

    const { content, contactId, sampleData } = validation.data;

    let contactData = sampleData;

    // If contactId is provided, fetch real contact data
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          jobTitle: true,
          address: true,
          city: true,
          state: true,
          country: true,
          customFields: true,
        }
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this contact
      const isAdmin = session.user.role === "SUPER_ADMIN" || 
                     session.user.role === "ADMIN" || 
                     session.user.role === "IT_ADMIN";
      
      if (!isAdmin && contact.createdById !== session.user.id) {
        return NextResponse.json(
          { error: "Access denied to this contact" },
          { status: 403 }
        );
      }

      contactData = {
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        address: contact.address || '',
        city: contact.city || '',
        state: contact.state || '',
        country: contact.country || '',
        customFields: contact.customFields ? 
          (typeof contact.customFields === 'string' ? 
            JSON.parse(contact.customFields) : 
            contact.customFields) : 
          {}
      };
    }

    // If no contact data provided, use default sample data
    if (!contactData) {
      contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+234XXXXXXXXXX',
        company: 'Example Corp',
        jobTitle: 'Marketing Manager',
        address: '123 Business Street',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        customFields: {
          preferredLanguage: 'English',
          customerSegment: 'Premium'
        }
      };
    }

    // Apply personalization
    const personalizedContent = personalizeMessage(content, contactData);

    // Extract and analyze variables used in the content
    const variablesFound = extractVariablesFromContent(content);
    const availableVariables = getAvailableVariables();
    const missingVariables = variablesFound.filter(variable => 
      !(variable in contactData) && !availableVariables.includes(variable)
    );

    // Generate personalization insights
    const insights = generatePersonalizationInsights(content, contactData, personalizedContent);

    return NextResponse.json({
      originalContent: content,
      personalizedContent,
      contactData,
      analysis: {
        variablesFound,
        missingVariables,
        characterCount: {
          original: content.length,
          personalized: personalizedContent.length,
          difference: personalizedContent.length - content.length
        },
        whatsappLimits: {
          maxLength: 4096,
          withinLimit: personalizedContent.length <= 4096,
          remaining: 4096 - personalizedContent.length
        },
        insights
      },
      availableVariables: getAvailableVariablesWithDescriptions()
    });

  } catch (error) {
    return handleApiError(error, "/api/whatsapp/personalization/preview/route.ts");
  }
}

// Enhanced personalization function (same as in campaign sending)
function personalizeMessage(content: string, contact: any): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  let personalizedContent = content;
  
  // Comprehensive contact variable mapping
  const contactVariables = {
    // Basic contact information
    'firstName': contact.firstName || '',
    'lastName': contact.lastName || '',
    'fullName': `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Customer',
    'email': contact.email || '',
    'phone': contact.phone || '',
    'company': contact.company || '',
    'jobTitle': contact.jobTitle || '',
    
    // Additional contact fields
    'address': contact.address || '',
    'city': contact.city || '',
    'state': contact.state || '',
    'country': contact.country || '',
    'postalCode': contact.postalCode || '',
    
    // Dynamic variables
    'date': new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    'time': new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    'dayOfWeek': new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    'month': new Date().toLocaleDateString('en-US', { month: 'long' }),
    'year': new Date().getFullYear().toString(),
    
    // Greeting variables based on time
    'greeting': getTimeBasedGreeting(),
    'timeGreeting': getTimeSpecificGreeting(),
  };

  // Parse and extract custom fields if available
  if (contact.customFields) {
    try {
      const customFields = typeof contact.customFields === 'string' 
        ? JSON.parse(contact.customFields) 
        : contact.customFields;
      
      if (customFields && typeof customFields === 'object') {
        Object.entries(customFields).forEach(([key, value]) => {
          contactVariables[`custom_${key}`] = String(value || '');
        });
      }
    } catch (error) {
      console.warn('Failed to parse custom fields for personalization:', error);
    }
  }

  // Replace all variables using regex
  Object.entries(contactVariables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    personalizedContent = personalizedContent.replace(regex, String(value));
  });

  // Handle special formatting for names
  personalizedContent = personalizedContent.replace(/\{\{firstName\|title\}\}/gi, 
    contact.firstName ? toTitleCase(contact.firstName) : '');
  personalizedContent = personalizedContent.replace(/\{\{lastName\|title\}\}/gi, 
    contact.lastName ? toTitleCase(contact.lastName) : '');
  personalizedContent = personalizedContent.replace(/\{\{fullName\|title\}\}/gi, 
    `${toTitleCase(contact.firstName || '')} ${toTitleCase(contact.lastName || '')}`.trim() || 'Customer');

  // Handle conditional personalization
  personalizedContent = handleConditionalPersonalization(personalizedContent, contact);

  // Clean up any remaining empty placeholders
  personalizedContent = personalizedContent.replace(/\{\{[^}]*\}\}/g, '');
  
  // Clean up extra spaces and normalize whitespace
  personalizedContent = personalizedContent.replace(/\s+/g, ' ').trim();
  
  // Ensure message ends properly (no trailing punctuation issues)
  personalizedContent = normalizeMessageEnding(personalizedContent);
  
  return personalizedContent;
}

// Extract variables from content
function extractVariablesFromContent(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].split('|')[0]; // Remove formatting modifiers
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
}

// Get list of available variables
function getAvailableVariables(): string[] {
  return [
    'firstName', 'lastName', 'fullName', 'email', 'phone', 'company', 'jobTitle',
    'address', 'city', 'state', 'country', 'postalCode',
    'date', 'time', 'dayOfWeek', 'month', 'year',
    'greeting', 'timeGreeting'
  ];
}

// Get available variables with descriptions
function getAvailableVariablesWithDescriptions() {
  return {
    // Contact Information
    firstName: { description: "Contact's first name", example: "John" },
    lastName: { description: "Contact's last name", example: "Doe" },
    fullName: { description: "Contact's full name", example: "John Doe" },
    email: { description: "Contact's email address", example: "john@example.com" },
    phone: { description: "Contact's phone number", example: "+234XXXXXXXXXX" },
    company: { description: "Contact's company name", example: "Example Corp" },
    jobTitle: { description: "Contact's job title", example: "Marketing Manager" },
    
    // Address Information
    address: { description: "Contact's street address", example: "123 Business St" },
    city: { description: "Contact's city", example: "Lagos" },
    state: { description: "Contact's state/province", example: "Lagos State" },
    country: { description: "Contact's country", example: "Nigeria" },
    postalCode: { description: "Contact's postal/zip code", example: "12345" },
    
    // Dynamic Date/Time Variables
    date: { description: "Current date", example: "December 1, 2024" },
    time: { description: "Current time", example: "02:30 PM" },
    dayOfWeek: { description: "Current day of week", example: "Monday" },
    month: { description: "Current month", example: "December" },
    year: { description: "Current year", example: "2024" },
    
    // Smart Greetings
    greeting: { description: "Time-based greeting", example: "Good morning" },
    timeGreeting: { description: "Contextual time greeting", example: "Hope you're having a great morning" },
    
    // Special Formatting
    'firstName|title': { description: "First name in title case", example: "JOHN → John" },
    'lastName|title': { description: "Last name in title case", example: "DOE → Doe" },
    'fullName|title': { description: "Full name in title case", example: "john doe → John Doe" },
    
    // Conditional Logic
    '{{if:company}}at {{company}}{{/if}}': { description: "Show text only if company exists", example: "at Example Corp" },
    '{{if:jobTitle}}as {{jobTitle}}{{/if}}': { description: "Show text only if job title exists", example: "as Marketing Manager" },
    
    // Custom Fields
    'custom_fieldName': { description: "Custom field value (replace fieldName)", example: "{{custom_preferredLanguage}}" }
  };
}

// Generate personalization insights
function generatePersonalizationInsights(original: string, contact: any, personalized: string): string[] {
  const insights = [];
  
  // Check for empty variables
  if (personalized.includes('{{')) {
    insights.push('⚠️ Some variables were not replaced. Check if contact has required data.');
  }
  
  // Check message length for WhatsApp limits
  if (personalized.length > 4096) {
    insights.push(`🚨 Message exceeds WhatsApp limit (${personalized.length}/4096 characters). Consider shortening.`);
  } else if (personalized.length > 3000) {
    insights.push(`⚠️ Message is approaching WhatsApp limit (${personalized.length}/4096 characters).`);
  }
  
  // Check for personalization effectiveness
  const variableCount = (original.match(/\{\{[^}]+\}\}/g) || []).length;
  if (variableCount === 0) {
    insights.push('💡 Consider adding personalization variables to improve engagement.');
  } else if (variableCount > 0) {
    insights.push(`✅ ${variableCount} personalization variable(s) used for better engagement.`);
  }
  
  // Check for greeting usage
  if (original.includes('{{greeting}}') || original.includes('{{timeGreeting}}')) {
    insights.push('🌅 Dynamic time-based greeting will adapt throughout the day.');
  }
  
  // WhatsApp-specific insights
  if (original.includes('{{firstName}}') || original.includes('{{fullName}}')) {
    insights.push('👋 Personal greetings can improve WhatsApp message open rates.');
  }
  
  return insights;
}

// Helper functions (same as in campaign sending)
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeSpecificGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Hope you\'re having a restful night';
  if (hour < 12) return 'Hope you\'re having a great morning';
  if (hour < 17) return 'Hope you\'re having a productive afternoon';
  if (hour < 21) return 'Hope you\'re having a lovely evening';
  return 'Hope you\'re having a peaceful night';
}

function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function handleConditionalPersonalization(content: string, contact: any): string {
  // Simple conditional logic for company
  const companyConditionalRegex = /\{\{if:company\}\}(.*?)\{\{\/if\}\}/gi;
  content = content.replace(companyConditionalRegex, (match, innerContent) => {
    return contact.company ? innerContent.replace(/\{\{company\}\}/g, contact.company) : '';
  });

  // Simple conditional logic for job title
  const jobTitleConditionalRegex = /\{\{if:jobTitle\}\}(.*?)\{\{\/if\}\}/gi;
  content = content.replace(jobTitleConditionalRegex, (match, innerContent) => {
    return contact.jobTitle ? innerContent.replace(/\{\{jobTitle\}\}/g, contact.jobTitle) : '';
  });

  return content;
}

function normalizeMessageEnding(content: string): string {
  // Remove multiple punctuation marks at the end
  content = content.replace(/[.!?]+$/, '');
  
  // Add appropriate ending if message doesn't end with punctuation
  if (content && !content.match(/[.!?]$/)) {
    // If message seems like a question, add question mark
    if (content.toLowerCase().includes('how') || content.toLowerCase().includes('what') || 
        content.toLowerCase().includes('when') || content.toLowerCase().includes('where') ||
        content.toLowerCase().includes('why') || content.toLowerCase().includes('would you')) {
      content += '?';
    } else {
      content += '.';
    }
  }
  
  return content;
}