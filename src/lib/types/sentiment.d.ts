declare module 'sentiment' {
  interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Array<{ [token: string]: number }>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  interface SentimentAnalyzer {
    analyze(text: string): SentimentResult;
  }

  const sentiment: {
    new(): SentimentAnalyzer;
  };

  export = sentiment;
} 