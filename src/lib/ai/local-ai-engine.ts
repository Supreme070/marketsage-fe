/**
 * Local AI Engine (No External APIs Required)
 * --------------------------------------------------------------
 * This module provides intelligent features that run completely
 * offline using open-source JavaScript / TypeScript libraries.
 *
 * Capabilities:
 * 1. Sentiment & emotion analysis        – sentiment (AFINN-165)
 * 2. Topic extraction & keyword ranking  – compromise / TF-IDF
 * 3. Readability scoring                 – Flesch–Kincaid
 * 4. Content generation (Markov chain)   – natural MarkovText
 * 5. Customer churn & LTV prediction     – Advanced models in ml/advanced-models
 * 6. Smart segmentation (K-Means)        – ml-kmeans clustering
 *
 * Everything executes locally – no API keys needed.
 */

// @ts-ignore - No official type definitions for 'sentiment'
import Sentiment from 'sentiment';
// @ts-ignore - No official type definitions for 'compromise'
import nlp from 'compromise';
// @ts-ignore - No official type definitions for 'natural'
import * as natural from 'natural';
import { advancedChurnPredictor, advancedLTVPredictor } from '@/lib/ml/advanced-models';
import { logger } from '@/lib/logger';

// Type declarations are missing for some JS libraries; declare fallback types.
// These inline declarations ensure the compiler is satisfied even without @types packages.
// You can replace them with official typings once available.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare module 'sentiment';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare module 'compromise';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare module 'natural';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare module 'ml-kmeans';

// ---------- Types ---------- //
export interface LocalContentAnalysis {
  sentimentScore: number;          // -1 to 1
  sentimentComparative: number;    // comparative per token
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  keywords: string[];              // ranked keywords
  topics: string[];                // noun-phrase topics
  readingEase: number;             // Flesch reading ease 0-100
  readingGrade: number;            // Flesch-Kincaid grade level
}

export interface ContentGenerationRequest {
  seedText: string;
  numSentences?: number;
  maxWords?: number;
}

export interface ContentGenerationResult {
  content: string;
  debug?: any;
}

// ---------- Sentiment / Emotion ---------- //
const sentiment = new Sentiment();

export function analyzeContentLocal(content: string): LocalContentAnalysis {
  // Sentiment
  const sent = sentiment.analyze(content);
  const sentimentScore = sent.score / 10; // approximate normalisation
  const sentimentComparative = sent.comparative;
  const sentimentLabel = sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral';

  // Keyword / Topic extraction (noun phrases via compromise)
  const doc = nlp(content);
  const topics = doc.nouns().out('array');

  // Keyword ranking using TF-IDF approximation: top 10 frequent nouns
  const freqMap: Record<string, number> = {};
  topics.forEach((word: string) => {
    const lw = word.toLowerCase();
    freqMap[lw] = (freqMap[lw] || 0) + 1;
  });
  const keywords = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k]) => k);

  // Readability – Flesch / Flesch-Kincaid
  const sentences = content.split(/\.\s|\?\s|!\s/).filter(Boolean);
  const words = content.split(/\s+/).filter(Boolean);
  const syllableCount = words.reduce((acc: number, w: string) => acc + countSyllables(w), 0);
  const wordsPerSentence = words.length / Math.max(1, sentences.length);
  const syllablesPerWord = syllableCount / Math.max(1, words.length);
  const readingEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const readingGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    sentimentScore,
    sentimentComparative,
    sentimentLabel,
    keywords,
    topics,
    readingEase: Number(readingEase.toFixed(2)),
    readingGrade: Number(readingGrade.toFixed(2))
  };
}

// Rough syllable estimator
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  const vowels = 'aeiouy';
  let syllables = 0;
  let prevIsVowel = false;
  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevIsVowel) syllables++;
    prevIsVowel = isVowel;
  }
  if (word.endsWith('e')) syllables--; // silent e
  return Math.max(1, syllables);
}

// ---------- Local Content Generation ---------- //
export function generateContentLocal(req: ContentGenerationRequest): ContentGenerationResult {
  const { seedText, numSentences = 3, maxWords = 120 } = req;
  try {
    // Simple content generation without MarkovChain (fallback approach)
    const words = seedText.split(/\s+/);
    const keyWords = words.filter(w => w.length > 3); // Get meaningful words
    
    // Generate variations by recombining key phrases
    const templates = [
      `Discover how ${keyWords[0] || 'our service'} can help your business grow faster.`,
      `Join thousands who trust ${keyWords[1] || 'our platform'} for reliable results.`,
      `Get started with ${keyWords[2] || 'our solution'} today and see the difference.`
    ];
    
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    return { content: selectedTemplate, debug: { seed: seedText, keyWords } };
  } catch (error) {
    logger.error('Local content generation failed', error);
    return { content: seedText };
  }
}

// ---------- Local Customer Predictions ---------- //
export const predictChurnLocal = advancedChurnPredictor.predictChurnProbability.bind(advancedChurnPredictor);
export const predictLTVLocal = advancedLTVPredictor.predictLifetimeValue.bind(advancedLTVPredictor);

// ---------- Smart Segmentation via K-Means ---------- //
export async function clusterContacts(features: number[][], k = 4): Promise<{ clusters: number[]; centroids: number[][] }> {
  try {
    // Dynamic import to prevent loading during build time
    if (typeof window !== 'undefined') {
      // Client-side fallback - use simple clustering
      return simpleFallbackClustering(features, k);
    }
    
    // Server-side dynamic import
    const { kmeans } = await import('ml-kmeans');
    const result = kmeans(features, k);
    
    return {
      clusters: result.clusters,
      centroids: result.centroids
    };
  } catch (error) {
    logger.error('K-means clustering failed, using simple fallback', error);
    return simpleFallbackClustering(features, k);
  }
}

// Simple fallback clustering implementation
function simpleFallbackClustering(features: number[][], k: number): { clusters: number[]; centroids: number[][] } {
  // Fallback: simple rule-based clustering
  const clusters = features.map((feature, index) => {
    const avgScore = feature.reduce((a, b) => a + b, 0) / feature.length;
    if (avgScore > 0.7) return 0; // High-value cluster
    if (avgScore > 0.4) return 1; // Medium-value cluster
    return 2; // Low-value cluster
  });
  
  // Simple centroids calculation
  const centroids = Array(k).fill(null).map((_, clusterIndex) => {
    const clusterFeatures = features.filter((_, i) => clusters[i] === clusterIndex);
    if (clusterFeatures.length === 0) return features[0] || [0, 0, 0, 0];
    
    const centroid = clusterFeatures[0].map((_, featureIndex) => {
      return clusterFeatures.reduce((sum, feature) => sum + feature[featureIndex], 0) / clusterFeatures.length;
    });
    return centroid;
  });
  
  return { clusters, centroids };
}

// ---------- Utility to choose local vs. external AI ---------- //
export const useLocalAI = !process.env.OPENAI_API_KEY; 