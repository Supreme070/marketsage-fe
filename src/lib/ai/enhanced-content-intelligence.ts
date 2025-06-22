/**
 * Enhanced Content Intelligence Module
 * Advanced NLP and ML-based content analysis and optimization
 */

import natural from 'natural';
import sentiment from 'sentiment';
import nlp from 'compromise';
import { logger, LogContext } from '@/lib/logger';
import prisma from '@/lib/db/prisma';
import { type ContentType, SentimentAnalysisResult, type ContentScoreResult } from '@/lib/content-intelligence';
import { PorterStemmer, SentimentAnalyzer as NaturalSentiment, LogisticRegressionClassifier } from 'natural';
import { distance as levenshtein } from 'natural/lib/natural/distance/levenshtein_distance';
import { NGrams, WordTokenizer, BayesClassifier } from 'natural';
import type { TfIdf as NaturalTfIdf } from 'natural';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const tfidf = new natural.TfIdf();
const sentimentAnalyzer = new sentiment();

// Advanced ML Models Configuration
const BERT_CONFIG = {
  modelPath: './models/bert-base-uncased',
  maxLength: 512,
  batchSize: 32
};

// Add new interfaces for classification and advanced sentiment
interface TextClassificationResult {
  category: string;
  confidence: number;
  subcategories: Array<{
    name: string;
    confidence: number;
  }>;
  topics: Array<{
    name: string;
    relevance: number;
  }>;
}

interface AdvancedSentimentResult {
  overall: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  aspects: Array<{
    aspect: string;
    sentiment: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
    };
    examples: string[];
  }>;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    trust: number;
    anticipation: number;
    disgust: number;
  };
  /**
   * Fine-grained emotion scores produced by the classifier.
   * The keys correspond to every label present in EMOTION_TRAINING_DATA.
   */
  granularEmotions: Record<string, number>;
  intensity: number;
  subjectivity: number;
  sarcasm: {
    detected: boolean;
    confidence: number;
  };
  // Legacy raw sentiment fields kept optional for backward compatibility
  score?: number;
  comparative?: number;
  tokens?: string[];
  positive?: string[];
  negative?: string[];
  confidence?: number;
  aspectBasedSentiment?: any;
  entitySentiment?: any;
}

interface ContentFeatures {
  tokens: string[];
  ngrams: string[];
  keyPhrases: string[];
  entities: string[];
  readabilityMetrics: {
    fleschKincaid: number;
    gunningFog: number;
    smog: number;
    automatedReadability: number;
  };
  stylometricFeatures: {
    avgSentenceLength: number;
    avgWordLength: number;
    lexicalDiversity: number;
    punctuationRatio: number;
  };
}

interface SemanticAnalysisResult {
  summary: string;
  keywords: Array<{
    word: string;
    score: number;
    type: 'topic' | 'action' | 'entity';
  }>;
  topics: Array<{
    name: string;
    confidence: number;
    relatedTerms: string[];
  }>;
  semanticSimilarity: number;
  coherence: number;
}

interface TextSummarizationResult {
  shortSummary: string;
  longSummary: string;
  keyPoints: string[];
  coverage: number;
}

interface KeywordExtractionResult {
  keywords: Array<{
    term: string;
    score: number;
    frequency: number;
    position: number[];
  }>;
  phrases: Array<{
    text: string;
    score: number;
    words: string[];
  }>;
}

// Add missing interfaces and types
interface ClassificationScore {
  label: string;
  value: number;
}

interface Topic {
  name: string;
  relevance: number;
}

// Initialize classifiers
const contentClassifier = new LogisticRegressionClassifier();
const emotionClassifier = new BayesClassifier();
const topicClassifier = new BayesClassifier();

// Training data for classifiers
const EMOTION_TRAINING_DATA = {
  joy: ['happy', 'excited', 'delighted', 'pleased', 'joyful'],
  sadness: ['sad', 'disappointed', 'unhappy', 'depressed', 'gloomy'],
  anger: ['angry', 'furious', 'outraged', 'irritated', 'annoyed'],
  fear: ['scared', 'afraid', 'terrified', 'anxious', 'worried'],
  surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned'],
  trust: ['trust', 'reliable', 'dependable', 'confident', 'faithful'],
  anticipation: ['expect', 'anticipate', 'await', 'looking forward', 'hopeful'],
  disgust: ['disgusted', 'repulsed', 'revolted', 'appalled', 'horrified'],
  // Granular sub-emotions
  happiness: ['happy', 'joyful', 'cheerful', 'gleeful', 'merry'],
  contentment: ['content', 'satisfied', 'serene', 'fulfilled', 'pleased'],
  excitement: ['excited', 'thrilled', 'eager', 'enthusiastic', 'pumped'],
  frustration: ['frustrated', 'annoyed', 'irritated', 'upset', 'exasperated'],
  anxiety: ['anxious', 'nervous', 'uneasy', 'restless', 'tense'],
  wonder: ['wonder', 'awe', 'astonishment', 'amazement', 'marvel'],
  confidence: ['confident', 'assured', 'certain', 'secure', 'positive'],
  optimism: ['optimistic', 'hopeful', 'encouraged', 'upbeat', 'positive'],
  contempt: ['contempt', 'scorn', 'disdain', 'revulsion', 'loathing']
};

// Mapping of granular emotion labels back to the 8 primary categories
const GRANULAR_TO_BASE_MAP: Record<string, keyof Omit<AdvancedSentimentResult['emotions'], never>> = {
  happiness: 'joy',
  contentment: 'joy',
  excitement: 'joy',
  frustration: 'anger',
  anxiety: 'fear',
  wonder: 'surprise',
  confidence: 'trust',
  optimism: 'anticipation',
  contempt: 'disgust'
};

/**
 * Enhanced sentiment analysis using multiple models and aspect-based analysis
 */
export async function enhancedSentimentAnalysis(
  content: string,
  contentType: ContentType
): Promise<AdvancedSentimentResult> {
  try {
    // Tokenize and preprocess
    const tokens = tokenizer.tokenize(content.toLowerCase()) || [];
    const doc = nlp(content);
    
    // Get base sentiment using multiple models
    const vaderResult = sentimentAnalyzer.analyze(content);
    
    // Extract named entities
    const entities = doc.topics().json();
    
    // Perform aspect-based sentiment analysis
    const aspects = await extractAspects(content);
    const aspectSentiments = await analyzeAspectSentiments(content, aspects);
    
    // Entity-level sentiment
    const entitySentiments = await analyzeEntitySentiments(content, entities);
    
    // Calculate confidence based on model agreement
    const confidence = calculateModelConfidence([
      vaderResult.score,
      // Add other model scores here
    ]);
    
    // Combine results
    return {
      score: vaderResult.score,
      comparative: vaderResult.comparative,
      tokens: tokens,
      positive: vaderResult.positive || [],
      negative: vaderResult.negative || [],
      confidence: confidence,
      emotions: await analyzeEmotions(content),
      aspectBasedSentiment: aspectSentiments,
      entitySentiment: entitySentiments
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentType: contentType as string,
      contentLength: content.length
    };
    logger.error('Error in enhanced sentiment analysis', errorContext);
    throw new Error('Failed to perform enhanced sentiment analysis');
  }
}

/**
 * Extract advanced content features for ML models
 */
export async function extractContentFeatures(content: string): Promise<ContentFeatures> {
  const tokens = tokenizer.tokenize(content) || [];
  const doc = nlp(content);
  
  // Generate n-grams
  const bigrams = natural.NGrams.bigrams(tokens);
  const trigrams = natural.NGrams.trigrams(tokens);
  
  // Extract key phrases using TF-IDF
  tfidf.addDocument(content);
  const keyPhrases = getTopTfIdfTerms(tfidf, 10);
  
  // Calculate readability metrics
  const readabilityMetrics = {
    fleschKincaid: calculateFleschKincaid(content),
    gunningFog: calculateGunningFog(content),
    smog: calculateSMOG(content),
    automatedReadability: calculateARI(content)
  };

  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate stylometric features
  const stylometricFeatures = {
    avgSentenceLength: sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length,
    avgWordLength: tokens.reduce((sum, w) => sum + w.length, 0) / tokens.length,
    lexicalDiversity: new Set(tokens.map(t => t.toLowerCase())).size / tokens.length,
    punctuationRatio: (content.match(/[.,!?;:]/g) || []).length / content.length
  };
  
  const topics = doc.topics().out('array') || [];
  
  return {
    tokens,
    ngrams: [...bigrams, ...trigrams].map(ng => ng.join(' ')),
    keyPhrases,
    entities: topics,
    readabilityMetrics,
    stylometricFeatures
  };
}

/**
 * Enhanced content scoring using ML models and historical data
 */
export async function enhancedContentScoring(
  content: string,
  contentType: ContentType
): Promise<ContentScoreResult> {
  try {
    // Extract features
    const features = await extractContentFeatures(content);
    
    // Get historical performance data
    const historicalData = await getHistoricalPerformance(contentType);
    
    // Calculate advanced metrics
    const readabilityScore = calculateEnhancedReadabilityScore(features);
    const engagementScore = await predictEngagementScore(features, historicalData);
    const conversionScore = await predictConversionScore(features, historicalData);
    const sentimentResult = await enhancedSentimentAnalysis(content, contentType);
    
    // Generate ML-based improvements
    const { improvements, strengths } = await generateMLBasedRecommendations(
      features,
      {
        readabilityScore,
        engagementScore,
        conversionScore,
        sentimentScore: sentimentResult.score
      }
    );
    
    return {
      overallScore: calculateOverallScore([
        readabilityScore,
        engagementScore,
        conversionScore,
        sentimentResult.score
      ]),
      readabilityScore,
      engagementScore,
      conversionScore,
      sentimentScore: sentimentResult.score,
      improvements,
      strengths
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentType: contentType as string,
      contentLength: content.length
    };
    logger.error('Error in enhanced content scoring', errorContext);
    throw new Error('Failed to perform enhanced content scoring');
  }
}

// Helper functions

async function extractAspects(content: string): Promise<string[]> {
  const doc = nlp(content);
  return doc.nouns().out('array');
}

async function analyzeAspectSentiments(content: string, aspects: string[]) {
  const results: any = {};
  for (const aspect of aspects) {
    const relevantSentences = extractRelevantSentences(content, aspect);
    results[aspect] = {
      score: await calculateAspectSentiment(relevantSentences),
      confidence: calculateConfidenceScore(relevantSentences.length),
      aspects: findRelatedAspects(aspect, aspects)
    };
  }
  return results;
}

async function analyzeEntitySentiments(content: string, entities: any[]) {
  return entities.map(entity => ({
    entity: entity.text,
    sentiment: calculateEntitySentiment(content, entity),
    confidence: calculateConfidenceScore(entity.count)
  }));
}

async function analyzeEmotions(content: string) {
  const doc = nlp(content);
  return {
    joy: calculateEmotionIntensity(doc, 'joy'),
    sadness: calculateEmotionIntensity(doc, 'sadness'),
    anger: calculateEmotionIntensity(doc, 'anger'),
    fear: calculateEmotionIntensity(doc, 'fear'),
    surprise: calculateEmotionIntensity(doc, 'surprise')
  };
}

function calculateEmotionIntensity(doc: any, emotion: string): number {
  // Implement emotion-specific intensity calculation
  return 0.5; // Placeholder
}

function calculateModelConfidence(scores: number[]): number {
  const variance = calculateVariance(scores);
  return 1 - Math.min(variance, 1);
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b) / numbers.length;
  const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

async function getHistoricalPerformance(contentType: ContentType) {
  return await prisma.contentAnalysis.findMany({
    where: { contentType },
    select: {
      originalContent: true,
      result: true
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 */
function calculateFleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllables / words.length;
  
  return 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
}

/**
 * Calculate Gunning Fog Index
 * Formula: 0.4 * ((words/sentences) + 100 * (complex words/words))
 */
function calculateGunningFog(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const complexWords = words.filter(word => countSyllables(word) > 2);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const wordsPerSentence = words.length / sentences.length;
  const complexWordPercentage = (complexWords.length / words.length) * 100;
  
  return 0.4 * (wordsPerSentence + complexWordPercentage);
}

/**
 * Calculate SMOG Index
 * Formula: 1.043 * sqrt(30 * complex words / sentences) + 3.1291
 */
function calculateSMOG(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const complexWords = words.filter(word => countSyllables(word) > 2);
  
  if (sentences.length === 0) return 0;
  
  return 1.043 * Math.sqrt((30 * complexWords.length) / sentences.length) + 3.1291;
}

/**
 * Calculate Automated Readability Index
 * Formula: 4.71 * (characters/words) + 0.5 * (words/sentences) - 21.43
 */
function calculateARI(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const characters = text.replace(/\s+/g, '').length;
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const charsPerWord = characters / words.length;
  const wordsPerSentence = words.length / sentences.length;
  
  return 4.71 * charsPerWord + 0.5 * wordsPerSentence - 21.43;
}

/**
 * Count syllables in a word using basic rules
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  // Remove common silent 'e' at the end
  word = word.replace(/e$/, '');
  
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  return vowelGroups ? vowelGroups.length : 1;
}

/**
 * Get top TF-IDF terms from a document
 */
function getTopTfIdfTerms(tfidf: natural.TfIdf, n: number): string[] {
  const terms: Array<{term: string, score: number}> = [];
  
  tfidf.listTerms(0).forEach(item => {
    terms.push({ term: item.term, score: item.tfidf });
  });
  
  return terms
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(item => item.term);
}

async function predictEngagementScore(
  features: ContentFeatures,
  historicalData: any[]
): Promise<number> {
  // Implement ML-based engagement prediction
  return 75; // Placeholder
}

async function predictConversionScore(
  features: ContentFeatures,
  historicalData: any[]
): Promise<number> {
  // Implement ML-based conversion prediction
  return 80; // Placeholder
}

async function generateMLBasedRecommendations(
  features: ContentFeatures,
  scores: {
    readabilityScore: number;
    engagementScore: number;
    conversionScore: number;
    sentimentScore: number;
  }
): Promise<{ improvements: string[]; strengths: string[] }> {
  // Implement ML-based recommendation generation
  return {
    improvements: [],
    strengths: []
  };
}

function calculateOverallScore(scores: number[]): number {
  return Math.round(scores.reduce((a, b) => a + b) / scores.length);
}

// Export additional helper functions as needed
export const contentIntelligenceHelpers = {
  extractContentFeatures,
  analyzeEmotions,
  calculateModelConfidence
};

// Add missing helper functions
function extractRelevantSentences(content: string, aspect: string): string[] {
  return content
    .split(/[.!?]+/)
    .filter(sentence => sentence.toLowerCase().includes(aspect.toLowerCase()));
}

async function calculateAspectSentiment(sentences: string[]): Promise<number> {
  if (sentences.length === 0) return 0;
  
  const sentiments = sentences.map(s => sentimentAnalyzer.analyze(s).score);
  return sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
}

function calculateConfidenceScore(count: number): number {
  return Math.min(1, Math.log(count + 1) / Math.log(10));
}

function findRelatedAspects(aspect: string, allAspects: string[]): string[] {
  return allAspects.filter(a => 
    a !== aspect && 
    (a.includes(aspect) || aspect.includes(a))
  );
}

function calculateEntitySentiment(content: string, entity: any): number {
  const relevantSentences = extractRelevantSentences(content, entity.text);
  const sentiments = relevantSentences.map(s => sentimentAnalyzer.analyze(s).score);
  return sentiments.length > 0 
    ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
    : 0;
}

function calculateEnhancedReadabilityScore(features: ContentFeatures): number {
  const {
    fleschKincaid,
    gunningFog,
    smog,
    automatedReadability
  } = features.readabilityMetrics;
  
  // Normalize and combine different readability metrics
  return Math.round(
    (normalizeScore(fleschKincaid) +
     normalizeScore(gunningFog) +
     normalizeScore(smog) +
     normalizeScore(automatedReadability)) / 4
  );
}

function normalizeScore(score: number): number {
  // Normalize score to 0-100 range
  return Math.max(0, Math.min(100, (100 - score * 10)));
}

// Add new NLP features

/**
 * Perform semantic analysis of content
 */
export async function analyzeSemantics(content: string): Promise<SemanticAnalysisResult> {
  try {
    const doc = nlp(content);
    const tokens = tokenizer.tokenize(content) || [];
    
    // Extract topics and entities
    const topics = await extractTopics(content);
    const entities = doc.topics().json();
    
    // Calculate semantic coherence
    const coherence = calculateSemanticCoherence(tokens);
    
    // Extract keywords with their types
    const keywordResults = await extractEnhancedKeywords(content);
    
    // Calculate semantic similarity with historical content
    const similarity = await calculateSemanticSimilarity(content);
    
    // Generate summary using extractive summarization
    const summaryResult = await generateSummary(content);
    
    return {
      summary: summaryResult.shortSummary,
      keywords: keywordResults.keywords.map(k => ({
        word: k.term,
        score: k.score,
        type: determineKeywordType(k.term, entities)
      })),
      topics: topics.map(t => ({
        name: t.topic,
        confidence: t.confidence,
        relatedTerms: t.related
      })),
      semanticSimilarity: similarity,
      coherence
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length
    };
    logger.error('Error in semantic analysis', errorContext);
    throw new Error('Failed to perform semantic analysis');
  }
}

/**
 * Generate intelligent text summaries
 */
export async function generateSummary(content: string): Promise<TextSummarizationResult> {
  try {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate sentence importance scores
    const sentenceScores = calculateSentenceImportance(sentences);
    
    // Generate summaries of different lengths
    const shortSummary = await generateExtractiveSummary(sentences, sentenceScores, 0.2);
    const longSummary = await generateExtractiveSummary(sentences, sentenceScores, 0.4);
    
    // Extract key points using topic modeling
    const keyPoints = await extractKeyPoints(content);
    
    // Calculate coverage score
    const coverage = calculateSummaryCoverage(content, shortSummary);
    
    return {
      shortSummary,
      longSummary,
      keyPoints,
      coverage
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length
    };
    logger.error('Error generating summary', errorContext);
    throw new Error('Failed to generate summary');
  }
}

/**
 * Enhanced keyword extraction with phrase mining
 */
export async function extractEnhancedKeywords(content: string): Promise<KeywordExtractionResult> {
  try {
    const tokens = tokenizer.tokenize(content) || [];
    const doc = nlp(content);
    
    // TF-IDF based keyword extraction
    const tfidfKeywords = extractTfIdfKeywords(content, tokens);
    
    // TextRank based phrase extraction
    const textRankPhrases = extractTextRankPhrases(content, tokens);
    
    // Position-based scoring
    const positionScores = calculatePositionScores(tokens);
    
    // Combine results
    return {
      keywords: tfidfKeywords.map(k => ({
        term: k.term,
        score: k.score,
        frequency: k.frequency,
        position: positionScores[k.term] || []
      })),
      phrases: textRankPhrases
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length
    };
    logger.error('Error extracting keywords', errorContext);
    throw new Error('Failed to extract keywords');
  }
}

// Helper functions for new NLP features

async function extractTopics(content: string): Promise<Array<{topic: string; confidence: number; related: string[]}>> {
  const doc = nlp(content);
  const topics: Array<{topic: string; confidence: number; related: string[]}> = [];
  
  // Extract nouns and noun phrases
  const nouns = doc.nouns().out('array');
  const phrases = doc.match('#Noun+ (#Preposition? #Noun+)?').out('array');
  
  // Calculate topic scores using TF-IDF
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(content);
  
  // Process each potential topic
  const processedTopics = new Set<string>();
  [...nouns, ...phrases].forEach(topic => {
    if (!processedTopics.has(topic)) {
      processedTopics.add(topic);
      
      // Find related terms
      const related = findRelatedTerms(topic, [...nouns, ...phrases]);
      
      // Calculate confidence score
      const confidence = calculateTopicConfidence(topic, content, related);
      
      topics.push({
        topic,
        confidence,
        related: related.slice(0, 5) // Top 5 related terms
      });
    }
  });
  
  return topics.sort((a, b) => b.confidence - a.confidence);
}

function calculateSemanticCoherence(tokens: string[]): number {
  let coherenceScore = 0;
  const windowSize = 5;
  
  // Calculate local coherence using sliding window
  for (let i = 0; i < tokens.length - windowSize; i++) {
    const window = tokens.slice(i, i + windowSize);
    coherenceScore += calculateLocalCoherence(window);
  }
  
  return Math.min(1, coherenceScore / Math.max(1, tokens.length - windowSize));
}

async function calculateSemanticSimilarity(content: string): Promise<number> {
  // Get historical content from database
  const historicalContent = await prisma.contentAnalysis.findMany({
    select: { originalContent: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  
  if (historicalContent.length === 0) return 1;
  
  // Calculate similarity with each historical content
  const similarities = historicalContent.map((h: { originalContent: string }) => 
    calculateCosineSimilarity(
      extractFeatureVector(content),
      extractFeatureVector(h.originalContent)
    )
  );
  
  return Math.max(...similarities);
}

function calculateSentenceImportance(sentences: string[]): number[] {
  const scores: number[] = [];
  const localTfidf = new natural.TfIdf();
  
  // Add each sentence as a document
  sentences.forEach(s => localTfidf.addDocument(s));
  
  // Calculate importance score for each sentence
  sentences.forEach((sentence, i) => {
    const words = tokenizer.tokenize(sentence) || [];
    let score = 0;
    
    words.forEach(word => {
      score += localTfidf.tfidf(word, i);
    });
    
    scores.push(score / Math.max(1, words.length));
  });
  
  return scores;
}

async function generateExtractiveSummary(
  sentences: string[],
  scores: number[],
  ratio: number
): Promise<string> {
  const numSentences = Math.max(1, Math.round(sentences.length * ratio));
  
  // Get top sentences
  const topSentences = sentences
    .map((sentence, index) => ({ sentence, score: scores[index] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
    .map(item => item.sentence);
  
  return topSentences.join(' ');
}

async function extractKeyPoints(content: string): Promise<string[]> {
  const doc = nlp(content);
  const sentences = doc.sentences().out('array');
  const keyPoints: string[] = [];
  
  // Look for key indicators
  sentences.forEach((sentence: string) => {
    if (
      sentence.includes('importantly') ||
      sentence.includes('key') ||
      sentence.includes('main') ||
      sentence.includes('primary') ||
      sentence.includes('crucial') ||
      sentence.match(/first|second|third|finally/i)
    ) {
      keyPoints.push(sentence.trim());
    }
  });
  
  return keyPoints;
}

function calculateSummaryCoverage(original: string, summary: string): number {
  const originalTokens = new Set(tokenizer.tokenize(original));
  const summaryTokens = new Set(tokenizer.tokenize(summary));
  
  let covered = 0;
  summaryTokens.forEach(token => {
    if (originalTokens.has(token)) covered++;
  });
  
  return covered / originalTokens.size;
}

function extractFeatureVector(text: string): number[] {
  // Implement feature extraction (e.g., word embeddings, TF-IDF)
  // This is a simplified version
  const vector: number[] = new Array(100).fill(0);
  const tokens = tokenizer.tokenize(text) || [];
  
  tokens.forEach((token, i) => {
    vector[i % 100] += 1;
  });
  
  return vector;
}

function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  const dotProduct = v1.reduce((sum, v, i) => sum + v * v2[i], 0);
  const mag1 = Math.sqrt(v1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(v2.reduce((sum, v) => sum + v * v, 0));
  return dotProduct / (mag1 * mag2);
}

function calculateLocalCoherence(window: string[]): number {
  let coherence = 0;
  
  // Calculate average semantic similarity between adjacent words
  for (let i = 0; i < window.length - 1; i++) {
    coherence += 1 - (levenshtein(window[i], window[i + 1]) / Math.max(window[i].length, window[i + 1].length));
  }
  
  return coherence / (window.length - 1);
}

function findRelatedTerms(topic: string, allTerms: string[]): string[] {
  return allTerms
    .filter(term => term !== topic)
    .map(term => ({
      term,
      similarity: 1 - (levenshtein(topic, term) / Math.max(topic.length, term.length))
    }))
    .filter(item => item.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .map(item => item.term);
}

function calculateTopicConfidence(topic: string, content: string, related: string[]): number {
  // Calculate confidence based on frequency and related terms
  const frequency = (content.match(new RegExp(topic, 'gi')) || []).length;
  const relatedScore = related.length / 10; // Normalize to 0-1
  
  return Math.min(1, (frequency / 100) + (relatedScore * 0.5));
}

function determineKeywordType(
  keyword: string,
  entities: any[]
): 'topic' | 'action' | 'entity' {
  // Check if it's an entity
  if (entities.some(e => e.text === keyword)) {
    return 'entity';
  }
  
  // Check if it's an action (verb)
  const doc = nlp(keyword);
  if (doc.verbs().length > 0) {
    return 'action';
  }
  
  // Default to topic
  return 'topic';
}

// Add missing functions

function extractTfIdfKeywords(content: string, tokens: string[]): Array<{term: string; score: number; frequency: number}> {
  const localTfidf = new natural.TfIdf();
  localTfidf.addDocument(content);
  
  return tokens
    .map(term => ({
      term,
      score: localTfidf.tfidf(term, 0),
      frequency: (content.match(new RegExp(term, 'gi')) || []).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // Top 20 keywords
}

function extractTextRankPhrases(content: string, tokens: string[]): Array<{text: string; score: number; words: string[]}> {
  const phrases: Array<{text: string; score: number; words: string[]}> = [];
  
  // Extract noun phrases using compromise
  const doc = nlp(content);
  const nounPhrases = doc.match('#Noun+ (#Preposition? #Noun+)?').out('array');
  
  // Score phrases using TF-IDF and length
  nounPhrases.forEach((phrase: string) => {
    const words = phrase.split(/\s+/);
    const phraseTfidf = new natural.TfIdf();
    phraseTfidf.addDocument(phrase);
    
    const score = words.reduce((sum: number, word: string) => sum + phraseTfidf.tfidf(word, 0), 0) / words.length;
    
    phrases.push({
      text: phrase,
      score,
      words
    });
  });
  
  return phrases
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 phrases
}

function calculatePositionScores(tokens: string[]): Record<string, number[]> {
  const positions: Record<string, number[]> = {};
  
  tokens.forEach((token, index) => {
    if (!positions[token]) {
      positions[token] = [];
    }
    positions[token].push(index);
  });
  
  return positions;
}

// Export new NLP helpers
export const nlpHelpers = {
  analyzeSemantics,
  generateSummary,
  extractEnhancedKeywords,
  calculateSemanticSimilarity
};

// Add new functions for classification and advanced sentiment

/**
 * Advanced text classification with hierarchical categories
 */
export async function classifyText(content: string): Promise<TextClassificationResult> {
  try {
    const doc = nlp(content);
    const tokens = tokenizer.tokenize(content) || [];
    
    // Extract features for classification
    const features = await extractClassificationFeatures(content, tokens);
    
    // Classify main category
    const categoryScores = await classifyCategory(features);
    const mainCategory = categoryScores[0];
    
    // Get subcategories based on main category
    const subcategories = await classifySubcategories(features, mainCategory.category);
    
    // Extract relevant topics
    const topics = await extractRelevantTopics(content, mainCategory.category);
    
    return {
      category: mainCategory.category,
      confidence: mainCategory.confidence,
      subcategories: subcategories.map(sub => ({
        name: sub.name,
        confidence: sub.confidence
      })),
      topics: topics.map(topic => ({
        name: topic.name,
        relevance: topic.relevance
      }))
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length
    };
    logger.error('Error in text classification', errorContext);
    throw new Error('Failed to classify text');
  }
}

/**
 * Advanced sentiment analysis with aspect-based and emotion detection
 */
export async function analyzeAdvancedSentiment(content: string): Promise<AdvancedSentimentResult> {
  try {
    const doc = nlp(content);
    const sentences = doc.sentences().out('array');
    
    // Overall sentiment using ensemble approach
    const overallSentiment = await calculateEnsembleSentiment(content);
    
    // Aspect-based sentiment analysis
    const aspects = await extractAndAnalyzeAspects(content);
    
    // Fine-grained and base-level emotion analysis
    const granularEmotions = analyzeGranularEmotions(content);
    const emotions = aggregateToBaseEmotions(granularEmotions);
    
    // Additional sentiment metrics
    const intensity = calculateSentimentIntensity(content);
    const subjectivity = calculateSubjectivity(content);
    const sarcasm = detectSarcasm(content);
    
    return {
      overall: {
        score: overallSentiment.score,
        label: overallSentiment.label,
        confidence: overallSentiment.confidence
      },
      aspects,
      emotions,
      granularEmotions,
      intensity,
      subjectivity,
      sarcasm
    };
  } catch (error) {
    const errorContext = {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length
    };
    logger.error('Error in advanced sentiment analysis', errorContext);
    throw new Error('Failed to analyze sentiment');
  }
}

// Helper functions for classification

async function extractClassificationFeatures(content: string, tokens: string[]) {
  // TF-IDF features
  const localTfidf = new natural.TfIdf();
  localTfidf.addDocument(content);
  
  // N-gram features
  const bigrams = NGrams.bigrams(tokens);
  const trigrams = NGrams.trigrams(tokens);
  
  // POS features
  const doc = nlp(content);
  const pos = doc.terms().out('tags');
  
  // Combine features
  return {
    tokens,
    tfidf: tokens.map(t => ({ term: t, score: localTfidf.tfidf(t, 0) })),
    ngrams: [...bigrams, ...trigrams].map(ng => ng.join(' ')),
    pos
  };
}

async function classifyCategory(features: any): Promise<Array<{category: string; confidence: number}>> {
  // Use logistic regression classifier
  const scores = contentClassifier.getClassifications(features.tokens.join(' '));
  
  return scores
    .map(s => ({
      category: s.label,
      confidence: Math.exp(s.value) / (1 + Math.exp(s.value)) // Convert to probability
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function classifySubcategories(
  features: any,
  mainCategory: string
): Promise<Array<{name: string; confidence: number}>> {
  // Get subcategories based on main category
  const subcategories = getSubcategories(mainCategory);
  
  // Calculate confidence for each subcategory
  const results = subcategories.map(sub => {
    const confidence = calculateSubcategoryConfidence(features, sub);
    return {
      name: sub,
      confidence
    };
  });
  
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Top 3 subcategories
}

function getSubcategories(category: string): string[] {
  // Define subcategories for each main category
  const subcategoryMap: Record<string, string[]> = {
    marketing: ['social-media', 'email', 'content', 'advertising', 'branding'],
    technical: ['development', 'infrastructure', 'security', 'data', 'integration'],
    financial: ['payments', 'banking', 'investment', 'compliance', 'risk'],
    support: ['customer-service', 'technical-support', 'documentation', 'training']
  };
  
  return subcategoryMap[category] || [];
}

function calculateSubcategoryConfidence(features: any, subcategory: string): number {
  // Simple confidence calculation based on term frequency
  const relevantTerms = _getRelevantTermsInternal(subcategory);
  const termMatches = features.tokens.filter((token: string) => 
    relevantTerms.some(term => token.toLowerCase().includes(term))
  ).length;
  
  return Math.min(1, termMatches / Math.max(1, features.tokens.length));
}

function _getRelevantTermsInternal(subcategory: string): string[] {
  // Define relevant terms for each subcategory
  const termMap: Record<string, string[]> = {
    'social-media': ['social', 'media', 'post', 'engagement', 'followers'],
    'email': ['email', 'newsletter', 'campaign', 'open', 'click'],
    'content': ['content', 'blog', 'article', 'video', 'post'],
    // Add more subcategories and terms as needed
  };
  
  return termMap[subcategory] || [];
}

// Helper functions for advanced sentiment analysis

async function calculateEnsembleSentiment(content: string): Promise<{
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
}> {
  // Get sentiment from multiple models
  const vaderScore = sentimentAnalyzer.analyze(content).score;
  const naturalScore = new NaturalSentiment('English', PorterStemmer, 'afinn').getSentiment(
    tokenizer.tokenize(content) || []
  );
  
  // Combine scores with weights
  const combinedScore = (vaderScore * 0.6) + (naturalScore * 0.4);
  
  // Calculate confidence based on agreement
  const confidence = 1 - Math.abs(vaderScore - naturalScore) / 2;
  
  return {
    score: combinedScore,
    label: combinedScore > 0.1 ? 'positive' : combinedScore < -0.1 ? 'negative' : 'neutral',
    confidence
  };
}

async function extractAndAnalyzeAspects(content: string): Promise<Array<{
  aspect: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  examples: string[];
}>> {
  const doc = nlp(content);
  const aspects: Array<{
    aspect: string;
    sentiment: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
    };
    examples: string[];
  }> = [];
  
  // Extract noun phrases as potential aspects
  const nounPhrases = doc.match('#Noun+').out('array');
  
  for (const aspect of nounPhrases) {
    // Find sentences containing the aspect
    const relevantSentences = content
      .split(/[.!?]+/)
      .filter(s => s.toLowerCase().includes(aspect.toLowerCase()));
    
    if (relevantSentences.length > 0) {
      // Calculate sentiment for each mention
      const sentiments = await Promise.all(
        relevantSentences.map(s => calculateEnsembleSentiment(s))
      );
      
      // Average sentiment scores
      const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      
      aspects.push({
        aspect,
        sentiment: {
          score: avgScore,
          label: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral'
        },
        examples: relevantSentences.slice(0, 3) // Top 3 examples
      });
    }
  }
  
  return aspects;
}

function analyzeGranularEmotions(content: string): Record<string, number> {
  const sentences = content.split(/[.!?]+/);
  // Initialise score map
  const granularScores: Record<string, number> = {};
  Object.keys(EMOTION_TRAINING_DATA).forEach(label => {
    granularScores[label] = 0;
  });

  for (const sentence of sentences) {
    const classifications = emotionClassifier.getClassifications(sentence);
    classifications.forEach(c => {
      if (granularScores[c.label] !== undefined) {
        const prob = Math.exp(c.value) / (1 + Math.exp(c.value));
        granularScores[c.label] += prob;
      }
    });
  }

  // Normalise
  const total = Object.values(granularScores).reduce((sum, v) => sum + v, 0);
  if (total > 0) {
    Object.keys(granularScores).forEach(k => {
      granularScores[k] /= total;
    });
  }

  return granularScores;
}

function aggregateToBaseEmotions(granular: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    trust: 0,
    anticipation: 0,
    disgust: 0
  };

  Object.entries(granular).forEach(([label, score]) => {
    const mapped = GRANULAR_TO_BASE_MAP[label as keyof typeof GRANULAR_TO_BASE_MAP] as keyof typeof base | undefined;
    if (mapped) {
      base[mapped] += score;
    } else if ((base as any)[label] !== undefined) {
      // label already a base category
      (base as any)[label] += score;
    }
  });

  return base;
}

function calculateSentimentIntensity(content: string): number {
  const intensifiers = ['very', 'extremely', 'absolutely', 'totally', 'completely'];
  const exclamations = (content.match(/!/g) || []).length;
  const upperCase = (content.match(/[A-Z]{2,}/g) || []).length;
  const intensifierCount = intensifiers.reduce(
    (count, word) => count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length,
    0
  );
  
  return Math.min(1, (intensifierCount * 0.2 + exclamations * 0.3 + upperCase * 0.1));
}

function calculateSubjectivity(content: string): number {
  const doc = nlp(content);
  const words = doc.terms().out('array');
  
  // Count subjective indicators
  const personalPronouns = doc.match('(i|me|my|mine|we|us|our|ours)').out('array').length;
  const opinions = doc.match('(think|feel|believe|assume|suppose)').out('array').length;
  const adjectives = doc.match('#Adjective').out('array').length;
  
  return Math.min(1, (personalPronouns + opinions * 2 + adjectives) / words.length);
}

function detectSarcasm(content: string): { detected: boolean; confidence: number } {
  const sarcasmIndicators = [
    // Contrast between positive and negative
    content.match(/\b(great|awesome|fantastic|wonderful)\b.*\b(terrible|awful|horrible)\b/i),
    // Exaggeration
    content.match(/\b(obviously|clearly|totally|absolutely|definitely)\b/gi),
    // Question marks and exclamation points
    content.match(/[!?]{2,}/g),
    // Quotation marks for emphasis
    content.match(/"([^"]*?)"/g)
  ];
  
  const indicatorCount = sarcasmIndicators.filter(i => i !== null).length;
  const confidence = Math.min(1, indicatorCount * 0.25);
  
  return {
    detected: confidence > 0.5,
    confidence
  };
}

// Initialize and train classifiers
function initializeClassifiers() {
  // Train emotion classifier
  Object.entries(EMOTION_TRAINING_DATA).forEach(([emotion, examples]) => {
    examples.forEach(example => {
      emotionClassifier.addDocument(example, emotion);
    });
  });
  emotionClassifier.train();
  
  // Train content classifier (example categories)
  const contentCategories = {
    marketing: ['campaign', 'promotion', 'advertisement', 'brand', 'market'],
    technical: ['software', 'hardware', 'system', 'data', 'technology'],
    financial: ['payment', 'transaction', 'money', 'finance', 'banking'],
    support: ['help', 'assistance', 'problem', 'issue', 'resolution']
  };
  
  Object.entries(contentCategories).forEach(([category, examples]) => {
    examples.forEach(example => {
      contentClassifier.addDocument(example, category);
    });
  });
  contentClassifier.train();
}

// Initialize classifiers when module loads
initializeClassifiers();

// Export new functions
export const advancedTextAnalysis = {
  classifyText,
  analyzeAdvancedSentiment,
  detectSarcasm,
  calculateSubjectivity
};

// Add missing functions

async function extractRelevantTopics(content: string, category: string): Promise<Topic[]> {
  const doc = nlp(content);
  const localTfidf = new natural.TfIdf();
  
  // Add category-specific documents to TF-IDF
  const categoryDocs = getCategoryDocuments(category);
  categoryDocs.forEach(doc => localTfidf.addDocument(doc));
  
  // Add current content
  localTfidf.addDocument(content);
  
  // Extract topics using TF-IDF scores
  const terms = localTfidf.listTerms(0);
  const topics = terms
    .slice(0, 10)
    .map(term => ({
      name: term.term,
      relevance: term.tfidf
    }));
  
  return topics;
}

function getCategoryDocuments(category: string): string[] {
  // Sample documents for each category
  const categoryDocs: Record<string, string[]> = {
    marketing: [
      'digital marketing campaign brand awareness social media',
      'marketing strategy customer engagement promotion advertising',
      'market research consumer behavior brand positioning'
    ],
    technical: [
      'software development system architecture database',
      'technical documentation api integration deployment',
      'hardware specifications system requirements maintenance'
    ],
    financial: [
      'financial transactions payment processing banking',
      'investment portfolio asset management trading',
      'financial analysis risk assessment compliance'
    ],
    support: [
      'customer support ticket resolution troubleshooting',
      'technical assistance user guide documentation',
      'support services maintenance customer care'
    ]
  };
  
  return categoryDocs[category] || [];
}

 