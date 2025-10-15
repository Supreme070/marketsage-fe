/**
 * Multimodal AI Engine
 * Handles vision, voice, and document processing capabilities
 *
 * ✅ MIGRATED TO BACKEND API
 * All multimodal features now use secure backend endpoints.
 *
 * Backend endpoints:
 * - POST /api/v2/ai/vision/analyze ✅
 * - POST /api/v2/ai/audio/transcribe ✅
 * - POST /api/v2/ai/document/extract ✅
 */

import { logger } from '@/lib/logger';
import { aiClient } from '@/lib/api/ai-client';

interface VisionAnalysisResult {
  description: string;
  objects: DetectedObject[];
  text: ExtractedText[];
  insights: string[];
  marketingRecommendations: string[];
  brandElements: BrandElement[];
}

interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  category: string;
}

interface ExtractedText {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language: string;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BrandElement {
  type: 'logo' | 'color' | 'font' | 'style';
  value: string;
  confidence: number;
  marketingImpact: string;
}

interface VoiceAnalysisResult {
  transcript: string;
  sentiment: VoiceSentiment;
  emotion: VoiceEmotion;
  speaker: SpeakerProfile;
  intent: VoiceIntent;
  recommendations: string[];
}

interface VoiceSentiment {
  overall: 'positive' | 'negative' | 'neutral';
  confidence: number;
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
}

interface VoiceEmotion {
  primary: string;
  secondary?: string;
  intensity: number; // 0 to 1
  emotions: Record<string, number>;
}

interface SpeakerProfile {
  age: 'young' | 'middle' | 'senior';
  gender: 'male' | 'female' | 'other';
  accent: string;
  confidence: number;
  personality: PersonalityTraits;
}

interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface VoiceIntent {
  primary: string;
  confidence: number;
  context: string;
  actionRequired: boolean;
  urgency: 'low' | 'medium' | 'high';
}

interface DocumentAnalysisResult {
  extractedText: string;
  structure: DocumentStructure;
  insights: DocumentInsights;
  businessData: ExtractedBusinessData;
  recommendations: string[];
}

interface DocumentStructure {
  type: 'email' | 'report' | 'contract' | 'invoice' | 'presentation' | 'other';
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

interface DocumentSection {
  title: string;
  content: string;
  type: 'header' | 'body' | 'footer' | 'table' | 'chart';
  importance: number;
}

interface DocumentMetadata {
  pageCount: number;
  language: string;
  createdDate?: Date;
  author?: string;
  keywords: string[];
}

interface DocumentInsights {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  businessImpact: string;
}

interface ExtractedBusinessData {
  contacts: ExtractedContact[];
  financials: ExtractedFinancial[];
  dates: ExtractedDate[];
  products: ExtractedProduct[];
}

interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
}

interface ExtractedFinancial {
  amount: number;
  currency: string;
  type: 'revenue' | 'cost' | 'profit' | 'budget';
  context: string;
}

interface ExtractedDate {
  date: Date;
  type: 'deadline' | 'meeting' | 'event' | 'milestone';
  context: string;
}

interface ExtractedProduct {
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

export class MultimodalAIEngine {
  private token: string | null = null;

  constructor(authToken?: string) {
    if (authToken) {
      this.setToken(authToken);
    }
  }

  setToken(token: string) {
    this.token = token;
    aiClient.setToken(token);
  }

  /**
   * Analyze images for marketing insights and brand elements
   */
  async analyzeImage(
    imageBuffer: Buffer,
    context?: string,
    analysisType: 'marketing' | 'brand' | 'content' | 'general' = 'general'
  ): Promise<VisionAnalysisResult> {
    try {
      if (!this.token) {
        throw new Error('Authentication token not set. Please call setToken() first.');
      }

      logger.info('Starting image analysis', { analysisType, imageSize: imageBuffer.length });

      // Convert buffer to base64 data URL
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectImageMimeType(imageBuffer);
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      const prompt = this.buildVisionPrompt(analysisType, context);

      // Call backend API
      const response = await aiClient.analyzeVision(imageUrl, prompt, 'high');

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'No analysis received from vision API');
      }

      // Parse structured response from backend
      const analysis = response.data.description;
      const result = this.parseVisionAnalysis(analysis, analysisType);

      logger.info('Image analysis completed', {
        objectsDetected: result.objects.length,
        textExtracted: result.text.length,
        insights: result.insights.length,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to analyze image', { error });
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze voice/audio for sentiment, emotion, and intent
   */
  async analyzeVoice(
    audioBuffer: Buffer,
    context?: string,
    language = 'en'
  ): Promise<VoiceAnalysisResult> {
    try {
      logger.info('Starting voice analysis', { audioSize: audioBuffer.length, language });

      // Convert audio to text using Whisper
      const transcript = await this.transcribeAudio(audioBuffer, language);

      // Analyze the transcript for deeper insights
      const analysis = await this.analyzeTranscript(transcript, context);

      // Combine results
      const result: VoiceAnalysisResult = {
        transcript,
        ...analysis,
      };

      logger.info('Voice analysis completed', {
        transcriptLength: transcript.length,
        sentiment: result.sentiment.overall,
        primaryEmotion: result.emotion.primary,
      });

      return result;
    } catch (error) {
      logger.error('Failed to analyze voice', { error });
      throw new Error(`Voice analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze documents (PDFs, text files) for business intelligence
   */
  async analyzeDocument(
    documentBuffer: Buffer,
    filename: string,
    context?: string
  ): Promise<DocumentAnalysisResult> {
    try {
      logger.info('Starting document analysis', { filename, size: documentBuffer.length });

      // Extract text from document
      const extractedText = await this.extractTextFromDocument(documentBuffer, filename);

      // Analyze the extracted text
      const analysis = await this.analyzeDocumentText(extractedText, context, filename);

      logger.info('Document analysis completed', {
        textLength: extractedText.length,
        sectionsFound: analysis.structure.sections.length,
        actionItems: analysis.insights.actionItems.length,
      });

      return {
        extractedText,
        ...analysis,
      };
    } catch (error) {
      logger.error('Failed to analyze document', { error, filename });
      throw new Error(`Document analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate marketing content based on visual inputs
   */
  async generateContentFromVisual(
    imageBuffer: Buffer,
    contentType: 'email' | 'social' | 'ad' | 'blog',
    targetAudience: string,
    brand?: string
  ): Promise<{
    content: string;
    variations: string[];
    recommendations: string[];
  }> {
    try {
      // First analyze the image
      const visionResult = await this.analyzeImage(imageBuffer, `Generate ${contentType} content for ${targetAudience}`, 'marketing');

      // Generate content based on visual analysis
      const prompt = `
Based on this image analysis: ${JSON.stringify(visionResult.insights)}

Generate compelling ${contentType} content for ${targetAudience}.
${brand ? `Brand: ${brand}` : ''}

Requirements:
- Use insights from the image to create relevant content
- Include emotional triggers based on visual elements
- Optimize for ${targetAudience} preferences
- Provide 3 variations and specific recommendations

Return as JSON with: content, variations[], recommendations[]
      `;

      // Call backend API for chat completion
      const response = await aiClient.chat(prompt);

      if (!response.success || !response.data) {
        throw new Error('Failed to generate content from visual');
      }

      const result = JSON.parse(response.data.response || '{}');

      logger.info('Content generated from visual', {
        contentType,
        variations: result.variations?.length || 0,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to generate content from visual', { error });
      throw error;
    }
  }

  // Private helper methods

  private buildVisionPrompt(analysisType: string, context?: string): string {
    const basePrompt = `Analyze this image in detail and provide insights in JSON format with the following structure:
{
  "description": "detailed description",
  "objects": [{"name": "", "confidence": 0.9, "boundingBox": {}, "category": ""}],
  "text": [{"text": "", "confidence": 0.9, "boundingBox": {}, "language": ""}],
  "insights": ["insight1", "insight2"],
  "marketingRecommendations": ["rec1", "rec2"],
  "brandElements": [{"type": "logo|color|font|style", "value": "", "confidence": 0.9, "marketingImpact": ""}]
}`;

    switch (analysisType) {
      case 'marketing':
        return `${basePrompt}
Focus on marketing potential, brand elements, emotional triggers, and audience appeal.
${context ? `Context: ${context}` : ''}`;

      case 'brand':
        return `${basePrompt}
Focus specifically on brand elements, logo recognition, color schemes, typography, and brand consistency.
${context ? `Context: ${context}` : ''}`;

      case 'content':
        return `${basePrompt}
Focus on content creation opportunities, visual storytelling elements, and creative inspiration.
${context ? `Context: ${context}` : ''}`;

      default:
        return `${basePrompt}
${context ? `Context: ${context}` : ''}`;
    }
  }

  private parseVisionAnalysis(analysis: string, analysisType: string): VisionAnalysisResult {
    try {
      const parsed = JSON.parse(analysis);
      return {
        description: parsed.description || '',
        objects: parsed.objects || [],
        text: parsed.text || [],
        insights: parsed.insights || [],
        marketingRecommendations: parsed.marketingRecommendations || [],
        brandElements: parsed.brandElements || [],
      };
    } catch (error) {
      // Fallback parsing if JSON parsing fails
      return {
        description: analysis,
        objects: [],
        text: [],
        insights: [analysis],
        marketingRecommendations: [],
        brandElements: [],
      };
    }
  }

  private async transcribeAudio(audioBuffer: Buffer, language: string): Promise<string> {
    try {
      if (!this.token) {
        throw new Error('Authentication token not set. Please call setToken() first.');
      }

      // Convert audio buffer to base64
      const base64Audio = audioBuffer.toString('base64');

      // Call backend API
      const response = await aiClient.transcribeAudio(
        base64Audio,
        language === 'auto' ? undefined : language
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to transcribe audio');
      }

      return response.data.transcript;
    } catch (error: any) {
      logger.error('Failed to transcribe audio', { error });
      throw error;
    }
  }

  private async analyzeTranscript(
    transcript: string,
    context?: string
  ): Promise<Omit<VoiceAnalysisResult, 'transcript'>> {
    const prompt = `
Analyze this voice transcript for marketing and business insights:
"${transcript}"

${context ? `Context: ${context}` : ''}

Provide analysis in JSON format:
{
  "sentiment": {
    "overall": "positive|negative|neutral",
    "confidence": 0.9,
    "polarity": 0.5,
    "subjectivity": 0.7
  },
  "emotion": {
    "primary": "emotion",
    "intensity": 0.8,
    "emotions": {"happy": 0.8, "excited": 0.6}
  },
  "speaker": {
    "age": "young|middle|senior",
    "gender": "male|female|other",
    "accent": "description",
    "confidence": 0.7,
    "personality": {"openness": 0.8, "conscientiousness": 0.7, "extraversion": 0.9, "agreeableness": 0.8, "neuroticism": 0.3}
  },
  "intent": {
    "primary": "intent",
    "confidence": 0.9,
    "context": "description",
    "actionRequired": true,
    "urgency": "low|medium|high"
  },
  "recommendations": ["rec1", "rec2"]
}
    `;

    try {
      // Call backend API for chat completion
      const response = await aiClient.chat(prompt);

      if (!response.success || !response.data) {
        throw new Error('Failed to analyze transcript');
      }

      return JSON.parse(response.data.response || '{}');
    } catch (error) {
      // Fallback if parsing fails
      return {
        sentiment: { overall: 'neutral', confidence: 0.5, polarity: 0, subjectivity: 0.5 },
        emotion: { primary: 'neutral', intensity: 0.5, emotions: {} },
        speaker: {
          age: 'middle',
          gender: 'other',
          accent: 'unknown',
          confidence: 0.5,
          personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 }
        },
        intent: { primary: 'unknown', confidence: 0.5, context: '', actionRequired: false, urgency: 'low' },
        recommendations: [],
      };
    }
  }

  private async extractTextFromDocument(documentBuffer: Buffer, filename: string): Promise<string> {
    try {
      if (!this.token) {
        throw new Error('Authentication token not set. Please call setToken() first.');
      }

      // Convert document buffer to base64 data URL
      // For now, we'll treat documents as images for OCR via GPT-4 Vision
      const base64Doc = documentBuffer.toString('base64');
      const mimeType = this.detectImageMimeType(documentBuffer);
      const imageUrl = `data:${mimeType};base64,${base64Doc}`;

      // Call backend API for document text extraction
      const response = await aiClient.extractDocument(imageUrl);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to extract document text');
      }

      return response.data.text;
    } catch (error: any) {
      logger.error('Failed to extract text from document', { error, filename });
      // Fallback for non-image documents
      return `[Document text extraction from ${filename} - ${documentBuffer.length} bytes]`;
    }
  }

  private async analyzeDocumentText(
    text: string,
    context?: string,
    filename?: string
  ): Promise<Omit<DocumentAnalysisResult, 'extractedText'>> {
    const prompt = `
Analyze this document text for business intelligence:
"${text}"

${context ? `Context: ${context}` : ''}
${filename ? `Filename: ${filename}` : ''}

Provide analysis in JSON format:
{
  "structure": {
    "type": "email|report|contract|invoice|presentation|other",
    "sections": [{"title": "", "content": "", "type": "header|body|footer|table|chart", "importance": 0.9}],
    "metadata": {"pageCount": 1, "language": "en", "keywords": []}
  },
  "insights": {
    "summary": "",
    "keyPoints": [],
    "actionItems": [],
    "sentiment": "",
    "businessImpact": ""
  },
  "businessData": {
    "contacts": [{"name": "", "email": "", "phone": "", "company": "", "role": ""}],
    "financials": [{"amount": 1000, "currency": "USD", "type": "revenue", "context": ""}],
    "dates": [{"date": "2024-01-01", "type": "deadline", "context": ""}],
    "products": [{"name": "", "description": "", "price": 100, "category": ""}]
  },
  "recommendations": []
}
    `;

    try {
      // Call backend API for chat completion
      const response = await aiClient.chat(prompt);

      if (!response.success || !response.data) {
        throw new Error('Failed to analyze document text');
      }

      return JSON.parse(response.data.response || '{}');
    } catch (error) {
      // Fallback structure
      return {
        structure: {
          type: 'other',
          sections: [{ title: 'Content', content: text.substring(0, 500), type: 'body', importance: 1 }],
          metadata: { pageCount: 1, language: 'en', keywords: [] },
        },
        insights: {
          summary: text.substring(0, 200),
          keyPoints: [],
          actionItems: [],
          sentiment: 'neutral',
          businessImpact: 'unknown',
        },
        businessData: {
          contacts: [],
          financials: [],
          dates: [],
          products: [],
        },
        recommendations: [],
      };
    }
  }

  private detectImageMimeType(buffer: Buffer): string {
    const signatures = {
      'image/jpeg': [0xFF, 0xD8],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };

    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => buffer[index] === byte)) {
        return mimeType;
      }
    }

    return 'image/jpeg'; // Default fallback
  }
}