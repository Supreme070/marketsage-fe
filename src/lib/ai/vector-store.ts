/**
 * Vector Store for RAG (Enhanced for MarketSage Knowledge)
 * =======================================================
 * Local vector storage using MiniLM embeddings for semantic search
 * Now includes comprehensive MarketSage platform knowledge
 */

import fs from 'fs/promises';
import path from 'path';
import { getAllKnowledgeForRAG } from './marketsage-knowledge-base';

export interface Document {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

let embeddingModel: any = null;

// Initialize embedding model with dynamic import
async function getEmbeddingModel() {
  if (!embeddingModel) {
    try {
      // Dynamic import to prevent loading during build time
      const { pipeline } = await import('@xenova/transformers');
      embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      console.warn('Could not load transformers pipeline, using fallback embeddings', error);
      embeddingModel = null;
    }
  }
  return embeddingModel;
}

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbeddingModel();
  
  if (!model) {
    // Fallback: simple text-based embedding using character frequencies
    return generateSimpleEmbedding(text);
  }
  
  try {
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.warn('ML embedding failed, using fallback', error);
    return generateSimpleEmbedding(text);
  }
}

// Simple fallback embedding based on text characteristics
function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const chars = text.toLowerCase();
  
  // Create a 384-dimensional vector (matching MiniLM output size)
  const embedding = new Array(384).fill(0);
  
  // Simple features based on text characteristics
  embedding[0] = words.length / 100; // Normalized word count
  embedding[1] = chars.length / 1000; // Normalized character count
  embedding[2] = (chars.match(/[aeiou]/g) || []).length / chars.length; // Vowel ratio
  embedding[3] = (chars.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length / chars.length; // Consonant ratio
  
  // Hash-based features for the remaining dimensions
  for (let i = 4; i < 384; i++) {
    let hash = 0;
    for (let j = 0; j < chars.length; j++) {
      hash = ((hash << 5) - hash + chars.charCodeAt(j) + i) & 0xffffffff;
    }
    embedding[i] = (hash % 1000) / 1000 - 0.5; // Normalize to [-0.5, 0.5]
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

// Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

class VectorStore {
  private documents: Document[] = [];
  private readonly storePath = path.join(process.cwd(), 'data', 'vector-store.json');

  // Initialize with MarketSage knowledge base
  async initialize(): Promise<void> {
    try {
      // Load existing vectors if available
      await this.loadFromDisk();
      
      // Check if we need to add MarketSage knowledge
      const hasMarketSageKnowledge = this.documents.some(doc => 
        doc.metadata?.source === 'marketsage-knowledge'
      );

      if (!hasMarketSageKnowledge) {
        console.log('Indexing MarketSage knowledge base...');
        await this.indexMarketSageKnowledge();
        await this.saveToDisk();
        console.log('MarketSage knowledge base indexed successfully!');
      }
    } catch (error) {
      console.warn('Vector store initialization warning:', error);
      // Continue without existing data
      await this.indexMarketSageKnowledge();
      await this.saveToDisk();
    }
  }

  // Index MarketSage knowledge base
  private async indexMarketSageKnowledge(): Promise<void> {
    const knowledgeTexts = getAllKnowledgeForRAG();
    
    for (let i = 0; i < knowledgeTexts.length; i++) {
      const text = knowledgeTexts[i];
      const embedding = await generateEmbedding(text);
      
      this.documents.push({
        id: `marketsage-${i}`,
        text,
        embedding,
        metadata: {
          source: 'marketsage-knowledge',
          indexed: new Date().toISOString()
        }
      });
    }

    // Add some example fintech documents for context
    const fintechExamples = [
      {
        id: 'fintech-remittance-flow',
        text: 'Cross-border remittance flow: Customer registration → KYC verification → recipient details → transfer amount → payment method → compliance check → transfer execution → confirmation',
        metadata: { source: 'fintech-examples', category: 'workflows' }
      },
      {
        id: 'fintech-conversion-funnel',
        text: 'Fintech conversion funnel: Website visitor → intent detection → lead capture → KYC process → first transaction → repeat customer → advocate',
        metadata: { source: 'fintech-examples', category: 'conversion' }
      },
      {
        id: 'african-market-insights',
        text: 'African market insights: Mobile-first approach, family-oriented decisions, trust and security paramount, WhatsApp preferred communication, small initial transactions',
        metadata: { source: 'fintech-examples', category: 'market-insights' }
      },
      {
        id: 'compliance-requirements',
        text: 'Fintech compliance: AML (Anti-Money Laundering), KYC (Know Your Customer), data residency, regulatory reporting, transaction monitoring, sanctions screening',
        metadata: { source: 'fintech-examples', category: 'compliance' }
      }
    ];

    for (const example of fintechExamples) {
      const embedding = await generateEmbedding(example.text);
      this.documents.push({
        ...example,
        embedding
      });
    }
  }

  // Add document to vector store
  async addDocument(id: string, text: string, metadata?: Record<string, any>): Promise<void> {
    const embedding = await generateEmbedding(text);
    this.documents.push({ id, text, embedding, metadata });
    await this.saveToDisk();
  }

  // Search similar documents
  async search(query: string, limit = 4): Promise<Document[]> {
    if (this.documents.length === 0) {
      await this.initialize();
    }

    const queryEmbedding = await generateEmbedding(query);
    
    const similarities = this.documents.map(doc => ({
      document: doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.document);
  }

  // Save vectors to disk
  private async saveToDisk(): Promise<void> {
    try {
      const dataDir = path.dirname(this.storePath);
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(this.storePath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.warn('Could not save vector store to disk:', error);
    }
  }

  // Load vectors from disk
  private async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      this.documents = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is corrupted, start fresh
      this.documents = [];
    }
  }

  // Get document count
  getDocumentCount(): number {
    return this.documents.length;
  }

  // Clear all documents
  async clear(): Promise<void> {
    this.documents = [];
    await this.saveToDisk();
  }
}

// Export singleton instance
export const vectorStore = new VectorStore(); 