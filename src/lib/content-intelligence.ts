/**
 * Content Intelligence Service
 * 
 * Provides AI-powered content analysis, optimization, and personalization capabilities
 * for marketing campaigns and content creation.
 */

import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// Import additional NLP libraries as needed
// import natural from 'natural';
// import compromise from 'compromise';

// Types for content intelligence
export interface ContentAnalysisRequest {
  content: string;
  contentType: ContentType;
  contextData?: Record<string, any>;
}

export interface SentimentAnalysisResult {
  score: number; // -1 to 1 (negative to positive)
  comparative: number; // normalized by text length
  tokens: string[];
  positive: string[];
  negative: string[];
  emotion?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface SubjectLineAnalysisResult {
  predictedOpenRate: number; // 0 to 1
  length: {
    characters: number;
    words: number;
    score: number; // 0 to 1
  };
  personalityScore: number; // 0 to 1
  urgencyScore: number; // 0 to 1
  curiosityScore: number; // 0 to 1
  emotionScore: number; // 0 to 1
  improvements: string[];
}

export interface ContentScoreResult {
  overallScore: number; // 0 to 100
  readabilityScore: number; // 0 to 100
  engagementScore: number; // 0 to 100
  conversionScore: number; // 0 to 100
  sentimentScore: number; // 0 to 100
  improvements: string[];
  strengths: string[];
}

export interface ContentRecommendation {
  type: RecommendationType;
  originalContent: string;
  suggestedContent: string;
  reason: string;
  impactScore: number; // 0 to 1
}

export interface PersonalizationResult {
  segments: string[];
  personalizedContent: string;
  replacements: Array<{
    original: string;
    personalized: string;
    type: PersonalizationType;
  }>;
}

export enum ContentType {
  EMAIL_SUBJECT = 'email_subject',
  EMAIL_BODY = 'email_body',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH_NOTIFICATION = 'push_notification',
  LANDING_PAGE = 'landing_page',
  SOCIAL_POST = 'social_post'
}

export enum RecommendationType {
  CLARITY = 'clarity',
  ENGAGEMENT = 'engagement',
  LENGTH = 'length',
  TONE = 'tone',
  CALL_TO_ACTION = 'call_to_action',
  PERSONALIZATION = 'personalization'
}

export enum PersonalizationType {
  NAME = 'name',
  COMPANY = 'company',
  LOCATION = 'location',
  PRODUCT = 'product',
  INTEREST = 'interest',
  BEHAVIOR = 'behavior',
  CUSTOM = 'custom'
}

/**
 * Analyze the sentiment of content
 */
export async function analyzeSentiment(
  content: string,
  contentType: ContentType
): Promise<SentimentAnalysisResult> {
  try {
    // For demo purposes, using a simple approach
    // In production, would use a proper NLP library or API
    
    // Sample positive and negative words
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'helpful', 'best', 'love', 'like', 'enjoy'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'disappointing', 'failure'];
    
    // Tokenize the content
    const tokens = content.toLowerCase().split(/\W+/).filter(word => word.length > 0);
    
    // Count positive and negative words
    const positiveMatches = tokens.filter(word => positiveWords.includes(word));
    const negativeMatches = tokens.filter(word => negativeWords.includes(word));
    
    // Calculate sentiment score
    const score = (positiveMatches.length - negativeMatches.length) / Math.max(1, tokens.length);
    const comparative = tokens.length > 0 ? score / tokens.length : 0;
    
    // Log the analysis
    logger.info(`Performed sentiment analysis on ${contentType} content`, {
      contentType,
      contentLength: content.length,
      sentimentScore: score
    });
    
    // Save analysis to database
    await saveContentAnalysis({
      type: 'SENTIMENT',
      contentType,
      originalContent: content,
      result: JSON.stringify({
        score,
        comparative,
        positiveCount: positiveMatches.length,
        negativeCount: negativeMatches.length
      })
    });
    
    return {
      score,
      comparative,
      tokens,
      positive: positiveMatches,
      negative: negativeMatches,
      emotion: {
        joy: calculateEmotionScore(content, ['happy', 'joy', 'excited', 'pleased']),
        sadness: calculateEmotionScore(content, ['sad', 'unhappy', 'sorry', 'regret']),
        anger: calculateEmotionScore(content, ['angry', 'upset', 'annoyed', 'frustrated']),
        fear: calculateEmotionScore(content, ['afraid', 'scared', 'worried', 'fear']),
        surprise: calculateEmotionScore(content, ['surprised', 'wow', 'amazing', 'unexpected'])
      }
    };
  } catch (error) {
    logger.error('Error analyzing sentiment', error);
    throw new Error('Failed to analyze sentiment');
  }
}

/**
 * Analyze and optimize email subject lines
 */
export async function analyzeSubjectLine(subject: string): Promise<SubjectLineAnalysisResult> {
  try {
    // For demo purposes, using a simple analysis approach
    // In production, would use more sophisticated ML models
    
    const words = subject.split(/\s+/).filter(word => word.length > 0);
    const characters = subject.length;
    
    // Optimal subject line length is around 40-60 characters
    const lengthScore = characters > 0 && characters <= 70 ? 
      1 - Math.abs((characters - 50) / 50) : 0.3;
      
    // Check for personalization (e.g., [name], [company])
    const hasPersonalization = /\[.*?\]|{.*?}/.test(subject);
    const personalityScore = hasPersonalization ? 0.9 : 0.5;
    
    // Check for urgency words
    const urgencyWords = ['now', 'today', 'limited', 'deadline', 'soon', 'hurry', 'last chance'];
    const hasUrgency = urgencyWords.some(word => subject.toLowerCase().includes(word));
    const urgencyScore = hasUrgency ? 0.8 : 0.4;
    
    // Check for curiosity triggers
    const curiosityTriggers = ['how to', 'why', 'secret', 'surprising', 'discover', 'revealed', 'unknown'];
    const hasCuriosity = curiosityTriggers.some(trigger => subject.toLowerCase().includes(trigger));
    const curiosityScore = hasCuriosity ? 0.85 : 0.45;
    
    // Check for emotional words
    const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'exciting', 'incredible', 'disappointing'];
    const hasEmotion = emotionalWords.some(word => subject.toLowerCase().includes(word));
    const emotionScore = hasEmotion ? 0.75 : 0.5;
    
    // Calculate predicted open rate based on factors
    const predictedOpenRate = (lengthScore + personalityScore + urgencyScore + curiosityScore + emotionScore) / 5;
    
    // Generate improvement suggestions
    const improvements = [];
    
    if (characters < 30) {
      improvements.push('Subject line is too short; aim for 40-60 characters');
    } else if (characters > 70) {
      improvements.push('Subject line is too long; consider shortening to 40-60 characters');
    }
    
    if (!hasPersonalization) {
      improvements.push('Add personalization to improve engagement (e.g., [name])');
    }
    
    if (!hasUrgency && !hasCuriosity) {
      improvements.push('Add urgency or curiosity elements to increase open rates');
    }
    
    if (!hasEmotion) {
      improvements.push('Include emotional trigger words to create stronger engagement');
    }
    
    // Log and save the analysis
    logger.info(`Analyzed subject line: "${subject}"`, {
      characterCount: characters,
      wordCount: words.length,
      predictedOpenRate
    });
    
    await saveContentAnalysis({
      type: 'SUBJECT_LINE',
      contentType: ContentType.EMAIL_SUBJECT,
      originalContent: subject,
      result: JSON.stringify({
        predictedOpenRate,
        lengthScore,
        personalityScore,
        urgencyScore,
        curiosityScore,
        emotionScore
      })
    });
    
    return {
      predictedOpenRate,
      length: {
        characters,
        words: words.length,
        score: lengthScore
      },
      personalityScore,
      urgencyScore,
      curiosityScore,
      emotionScore,
      improvements
    };
  } catch (error) {
    logger.error('Error analyzing subject line', error);
    throw new Error('Failed to analyze subject line');
  }
}

/**
 * Score content effectiveness
 */
export async function scoreContent(
  content: string,
  contentType: ContentType
): Promise<ContentScoreResult> {
  try {
    // Analyze different aspects of the content
    const readabilityScore = calculateReadabilityScore(content);
    const engagementScore = calculateEngagementScore(content);
    const conversionScore = calculateConversionScore(content);
    const sentimentResult = await analyzeSentiment(content, contentType);
    const sentimentScore = Math.round((sentimentResult.score + 1) * 50); // Convert -1 to 1 to 0 to 100
    
    // Calculate overall score
    const overallScore = Math.round(
      (readabilityScore + engagementScore + conversionScore + sentimentScore) / 4
    );
    
    // Generate improvement suggestions
    const improvements = [];
    const strengths = [];
    
    if (readabilityScore < 60) {
      improvements.push('Improve readability by using shorter sentences and simpler words');
    } else if (readabilityScore > 80) {
      strengths.push('Good readability with clear and concise language');
    }
    
    if (engagementScore < 60) {
      improvements.push('Boost engagement by adding questions, emotions, or interactive elements');
    } else if (engagementScore > 80) {
      strengths.push('Strong engagement potential with compelling hooks');
    }
    
    if (conversionScore < 60) {
      improvements.push('Enhance conversion potential with clearer calls-to-action');
    } else if (conversionScore > 80) {
      strengths.push('Effective conversion elements with strong calls-to-action');
    }
    
    if (sentimentScore < 40) {
      improvements.push('Consider adjusting tone to be more positive');
    } else if (sentimentScore > 70) {
      strengths.push('Positive sentiment that should resonate well with audience');
    }
    
    // Save the analysis
    await saveContentAnalysis({
      type: 'CONTENT_SCORE',
      contentType,
      originalContent: content,
      result: JSON.stringify({
        overallScore,
        readabilityScore,
        engagementScore,
        conversionScore,
        sentimentScore
      })
    });
    
    return {
      overallScore,
      readabilityScore,
      engagementScore,
      conversionScore,
      sentimentScore,
      improvements,
      strengths
    };
  } catch (error) {
    logger.error('Error scoring content', error);
    throw new Error('Failed to score content');
  }
}

/**
 * Generate content recommendations
 */
export async function generateContentRecommendations(
  content: string,
  contentType: ContentType
): Promise<ContentRecommendation[]> {
  try {
    const recommendations: ContentRecommendation[] = [];
    
    // Analyze the content first
    const score = await scoreContent(content, contentType);
    
    // Generate recommendations based on score weaknesses
    if (score.readabilityScore < 70) {
      const simpler = simplifyContent(content);
      if (simpler !== content) {
        recommendations.push({
          type: RecommendationType.CLARITY,
          originalContent: content,
          suggestedContent: simpler,
          reason: 'Simplified language for better readability',
          impactScore: 0.7
        });
      }
    }
    
    // Check for content length and recommend adjustments
    if (contentType === ContentType.EMAIL_BODY && content.length > 1500) {
      const shortened = shortenContent(content);
      recommendations.push({
        type: RecommendationType.LENGTH,
        originalContent: content,
        suggestedContent: shortened,
        reason: 'Shortened content to improve engagement',
        impactScore: 0.6
      });
    }
    
    // Check for call to action
    if (score.conversionScore < 70) {
      const improvedCTA = improveCTA(content, contentType);
      if (improvedCTA !== content) {
        recommendations.push({
          type: RecommendationType.CALL_TO_ACTION,
          originalContent: content,
          suggestedContent: improvedCTA,
          reason: 'Enhanced call-to-action for better conversion',
          impactScore: 0.8
        });
      }
    }
    
    // Check for personalization opportunities
    if (!content.includes('[') && !content.includes('{')) {
      const personalized = addPersonalizationPlaceholders(content, contentType);
      recommendations.push({
        type: RecommendationType.PERSONALIZATION,
        originalContent: content,
        suggestedContent: personalized,
        reason: 'Added personalization to increase relevance',
        impactScore: 0.75
      });
    }
    
    // Log and return recommendations
    logger.info(`Generated ${recommendations.length} content recommendations`, {
      contentType,
      recommendationCount: recommendations.length
    });
    
    return recommendations;
  } catch (error) {
    logger.error('Error generating content recommendations', error);
    throw new Error('Failed to generate content recommendations');
  }
}

/**
 * Personalize content for a specific contact
 */
export async function personalizeContent(
  content: string,
  contactId: string,
  contentType: ContentType
): Promise<PersonalizationResult> {
  try {
    // Get contact data
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        city: true,
        state: true,
        country: true,
        tagsString: true,
      }
    });
    
    if (!contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    
    // Parse tags
    const tags = contact.tagsString ? JSON.parse(contact.tagsString) : [];
    
    // Initialize replacement tracking
    let personalizedContent = content;
    const replacements = [];
    
    // Replace standard placeholders
    if (contact.firstName && personalizedContent.includes('[firstName]')) {
      personalizedContent = personalizedContent.replace(/\[firstName\]/g, contact.firstName);
      replacements.push({
        original: '[firstName]',
        personalized: contact.firstName,
        type: PersonalizationType.NAME
      });
    }
    
    if (contact.lastName && personalizedContent.includes('[lastName]')) {
      personalizedContent = personalizedContent.replace(/\[lastName\]/g, contact.lastName);
      replacements.push({
        original: '[lastName]',
        personalized: contact.lastName,
        type: PersonalizationType.NAME
      });
    }
    
    if (contact.company && personalizedContent.includes('[company]')) {
      personalizedContent = personalizedContent.replace(/\[company\]/g, contact.company);
      replacements.push({
        original: '[company]',
        personalized: contact.company,
        type: PersonalizationType.COMPANY
      });
    }
    
    if (contact.city && personalizedContent.includes('[city]')) {
      personalizedContent = personalizedContent.replace(/\[city\]/g, contact.city);
      replacements.push({
        original: '[city]',
        personalized: contact.city,
        type: PersonalizationType.LOCATION
      });
    }
    
    // Advanced behavioral personalization
    const segments = await determineContactSegments(contactId);
    
    // Add behavioral personalization based on segments
    if (segments.includes('high_value') && personalizedContent.includes('[special_offer]')) {
      personalizedContent = personalizedContent.replace(/\[special_offer\]/g, 'premium discount');
      replacements.push({
        original: '[special_offer]',
        personalized: 'premium discount',
        type: PersonalizationType.BEHAVIOR
      });
    } else if (personalizedContent.includes('[special_offer]')) {
      personalizedContent = personalizedContent.replace(/\[special_offer\]/g, 'special offer');
      replacements.push({
        original: '[special_offer]',
        personalized: 'special offer',
        type: PersonalizationType.BEHAVIOR
      });
    }
    
    // Log personalization
    logger.info(`Personalized content for contact: ${contactId}`, {
      contentType,
      replacementsCount: replacements.length,
      segments
    });
    
    return {
      segments,
      personalizedContent,
      replacements
    };
  } catch (error) {
    logger.error(`Error personalizing content for contact: ${contactId}`, error);
    throw new Error('Failed to personalize content');
  }
}

// Helper functions

/**
 * Save content analysis to database
 */
async function saveContentAnalysis({
  type,
  contentType,
  originalContent,
  result
}: {
  type: 'SENTIMENT' | 'SUBJECT_LINE' | 'CONTENT_SCORE';
  contentType: ContentType;
  originalContent: string;
  result: string;
}) {
  try {
    await prisma.contentAnalysis.create({
      data: {
        id: randomUUID(),
        type,
        contentType,
        originalContent,
        result,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error saving content analysis', error);
    // Don't throw, just log the error to prevent analysis failures
  }
}

/**
 * Calculate emotion score based on presence of emotion words
 */
function calculateEmotionScore(content: string, emotionWords: string[]): number {
  const lowerContent = content.toLowerCase();
  const matches = emotionWords.filter(word => lowerContent.includes(word));
  return matches.length / Math.max(1, emotionWords.length);
}

/**
 * Calculate readability score (simplified Flesch-Kincaid)
 */
function calculateReadabilityScore(content: string): number {
  // Split into sentences and words
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) {
    return 50; // Default score for empty content
  }
  
  // Average words per sentence
  const avgWordsPerSentence = words.length / sentences.length;
  
  // Average word length
  const totalChars = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = totalChars / words.length;
  
  // Simplified Flesch-Kincaid formula (higher score = easier to read)
  const readabilityScore = 100 - (1.015 * avgWordsPerSentence) - (84.6 * (avgWordLength / 100));
  
  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, readabilityScore));
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(content: string): number {
  let score = 50; // Base score
  
  // Check for questions (increases engagement)
  const questionCount = (content.match(/\?/g) || []).length;
  score += Math.min(15, questionCount * 5);
  
  // Check for exclamations (can increase engagement)
  const exclamationCount = (content.match(/!/g) || []).length;
  score += Math.min(10, exclamationCount * 2.5);
  
  // Check for calls to action
  const ctaWords = ['click', 'sign up', 'register', 'join', 'download', 'get', 'try', 'buy', 'shop'];
  const hasCTA = ctaWords.some(word => content.toLowerCase().includes(word));
  if (hasCTA) {
    score += 15;
  }
  
  // Check for emotional words
  const emotionalWords = ['love', 'hate', 'amazing', 'fantastic', 'terrible', 'exciting', 'surprising'];
  const emotionCount = emotionalWords.reduce(
    (count, word) => count + (content.toLowerCase().includes(word) ? 1 : 0),
    0
  );
  score += Math.min(10, emotionCount * 2);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate conversion potential score
 */
function calculateConversionScore(content: string): number {
  let score = 40; // Base score
  
  // Check for strong CTAs
  const strongCTAs = ['buy now', 'sign up today', 'get started', 'limited time', 'exclusive offer'];
  const strongCTACount = strongCTAs.reduce(
    (count, cta) => count + (content.toLowerCase().includes(cta) ? 1 : 0),
    0
  );
  score += Math.min(25, strongCTACount * 5);
  
  // Check for urgency/scarcity (boosts conversion)
  const urgencyWords = ['limited', 'expires', 'today only', 'last chance', 'closing soon', 'hurry'];
  const urgencyCount = urgencyWords.reduce(
    (count, word) => count + (content.toLowerCase().includes(word) ? 1 : 0),
    0
  );
  score += Math.min(15, urgencyCount * 5);
  
  // Check for trust elements
  const trustWords = ['guarantee', 'secure', 'trusted', 'proven', 'testimonial', 'review'];
  const trustCount = trustWords.reduce(
    (count, word) => count + (content.toLowerCase().includes(word) ? 1 : 0),
    0
  );
  score += Math.min(10, trustCount * 2);
  
  // Check for clear benefits
  const benefitPhrases = ['you will', 'benefits include', 'advantages', 'why choose', 'features'];
  const benefitCount = benefitPhrases.reduce(
    (count, phrase) => count + (content.toLowerCase().includes(phrase) ? 1 : 0),
    0
  );
  score += Math.min(10, benefitCount * 2);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Simplify content for better readability
 */
function simplifyContent(content: string): string {
  // Demo version with simple replacements
  // In production, would use more sophisticated NLP
  let simplified = content;
  
  // Replace complex words with simpler alternatives
  const replacements = [
    { complex: 'utilize', simple: 'use' },
    { complex: 'commence', simple: 'start' },
    { complex: 'sufficient', simple: 'enough' },
    { complex: 'assist', simple: 'help' },
    { complex: 'purchase', simple: 'buy' },
    { complex: 'requirement', simple: 'need' },
    { complex: 'obtain', simple: 'get' },
    { complex: 'regarding', simple: 'about' },
    { complex: 'additional', simple: 'more' },
    { complex: 'numerous', simple: 'many' }
  ];
  
  replacements.forEach(({ complex, simple }) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  });
  
  // Break up long sentences (very basic approach)
  simplified = simplified.replace(/(.{60,}?)(,|;|but|and|or)/g, '$1.\n$2');
  
  return simplified;
}

/**
 * Shorten content while preserving key messages
 */
function shortenContent(content: string): string {
  // For demo purposes, using a simple approach
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length <= 5) {
    return content; // Already short
  }
  
  // Keep first 2 and last 2 sentences, plus a middle one for context
  const middleIndex = Math.floor(sentences.length / 2);
  const keptSentences = [
    sentences[0],
    sentences[1],
    sentences[middleIndex],
    sentences[sentences.length - 2],
    sentences[sentences.length - 1],
  ];
  
  return keptSentences.join('. ') + '.';
}

/**
 * Improve call-to-action in content
 */
function improveCTA(content: string, contentType: ContentType): string {
  // Check if content already has a strong CTA
  const strongCTAs = ['buy now', 'sign up today', 'get started', 'try for free', 'learn more', 'contact us'];
  const hasStrongCTA = strongCTAs.some(cta => content.toLowerCase().includes(cta));
  
  if (hasStrongCTA) {
    return content;
  }
  
  // Add appropriate CTA based on content type
  let updatedContent = content;
  
  switch (contentType) {
    case ContentType.EMAIL_BODY:
      if (!content.includes('button') && !content.includes('click')) {
        updatedContent = content + '\n\nClick here to get started today!';
      }
      break;
    case ContentType.SMS:
    case ContentType.WHATSAPP:
      if (!content.includes('http')) {
        updatedContent = content + ' Reply YES to confirm or click here: [link]';
      }
      break;
    case ContentType.LANDING_PAGE:
      if (!content.includes('form') && !content.includes('submit')) {
        updatedContent = content + '\n\nSign up now to receive exclusive updates!';
      }
      break;
    default:
      // No change for other content types
      break;
  }
  
  return updatedContent;
}

/**
 * Add personalization placeholders to content
 */
function addPersonalizationPlaceholders(content: string, contentType: ContentType): string {
  let personalized = content;
  
  // Simple heuristics for adding personalization
  if (contentType === ContentType.EMAIL_BODY) {
    // Add greeting if it doesn't exist
    if (!personalized.includes('Hi') && !personalized.includes('Hello') && !personalized.includes('Dear')) {
      personalized = 'Hi [firstName],\n\n' + personalized;
    } else {
      // Replace generic greeting with personalized one
      personalized = personalized.replace(/Hi there|Hello there|Dear customer/i, 'Hi [firstName]');
    }
    
    // Add company personalization if relevant
    if (personalized.includes('your company') || personalized.includes('your business')) {
      personalized = personalized.replace(/your company|your business/g, '[company]');
    }
  } else if (contentType === ContentType.EMAIL_SUBJECT) {
    // Add name to subject if not already personal
    if (!personalized.includes('[') && !personalized.includes('{')) {
      personalized = `[firstName], ${personalized}`;
    }
  }
  
  return personalized;
}

/**
 * Determine segments for a contact based on behavior and data
 */
async function determineContactSegments(contactId: string): Promise<string[]> {
  try {
    // Get contact's activity history
    const emailActivities = await prisma.emailActivity.findMany({
      where: { contactId },
      select: { type: true, timestamp: true }
    });
    
    const segments: string[] = [];
    
    // Check for high engagement
    const openCount = emailActivities.filter(a => a.type === 'OPENED').length;
    const clickCount = emailActivities.filter(a => a.type === 'CLICKED').length;
    
    if (clickCount > 5) {
      segments.push('high_engagement');
    } else if (openCount > 10 && clickCount > 0) {
      segments.push('medium_engagement');
    } else if (openCount === 0) {
      segments.push('disengaged');
    }
    
    // Check for recency
    const recentActivities = emailActivities.filter(
      a => new Date(a.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );
    
    if (recentActivities.length > 0) {
      segments.push('recently_active');
    }
    
    // Add more segmentation logic as needed
    
    return segments;
  } catch (error) {
    logger.error(`Error determining segments for contact: ${contactId}`, error);
    return []; // Return empty array on error to avoid breaking personalization
  }
} 