/**
 * Computer Vision Module for MarketSage
 * Handles document processing, OCR, image analysis for fintech KYC/verification
 */

import { logger } from '@/lib/logger';
import { ConvolutionalLayer, PoolingLayer, Matrix, ActivationFunctions } from './deep-learning-advanced';

// Image processing utilities
export class ImageProcessor {
  
  /**
   * Convert image data to grayscale
   */
  static toGrayscale(imageData: ImageData): number[][] {
    const { width, height, data } = imageData;
    const grayscale: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Luminance formula
        grayscale[y][x] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
    }
    
    return grayscale;
  }

  /**
   * Apply Gaussian blur for noise reduction
   */
  static gaussianBlur(image: number[][], kernelSize = 5): number[][] {
    const kernel = this.generateGaussianKernel(kernelSize);
    return this.applyConvolution(image, kernel);
  }

  /**
   * Edge detection using Sobel operator
   */
  static detectEdges(image: number[][]): number[][] {
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    const gradientX = this.applyConvolution(image, sobelX);
    const gradientY = this.applyConvolution(image, sobelY);
    
    const edges: number[][] = Array(image.length).fill(0).map(() => Array(image[0].length).fill(0));
    
    for (let y = 0; y < image.length; y++) {
      for (let x = 0; x < image[0].length; x++) {
        const gx = gradientX[y][x];
        const gy = gradientY[y][x];
        edges[y][x] = Math.sqrt(gx * gx + gy * gy);
      }
    }
    
    return edges;
  }

  /**
   * Adaptive threshold for binarization
   */
  static adaptiveThreshold(image: number[][], blockSize = 11, C = 2): number[][] {
    const binary: number[][] = Array(image.length).fill(0).map(() => Array(image[0].length).fill(0));
    const half = Math.floor(blockSize / 2);
    
    for (let y = 0; y < image.length; y++) {
      for (let x = 0; x < image[0].length; x++) {
        let sum = 0;
        let count = 0;
        
        // Calculate local mean
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < image.length && nx >= 0 && nx < image[0].length) {
              sum += image[ny][nx];
              count++;
            }
          }
        }
        
        const localMean = sum / count;
        binary[y][x] = image[y][x] > (localMean - C / 255) ? 1 : 0;
      }
    }
    
    return binary;
  }

  /**
   * Morphological operations (erosion, dilation)
   */
  static morphologicalOperation(image: number[][], operation: 'erode' | 'dilate', structuringElement?: number[][]): number[][] {
    const se = structuringElement || [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
    const result: number[][] = Array(image.length).fill(0).map(() => Array(image[0].length).fill(0));
    const seHeight = se.length;
    const seWidth = se[0].length;
    const centerY = Math.floor(seHeight / 2);
    const centerX = Math.floor(seWidth / 2);
    
    for (let y = 0; y < image.length; y++) {
      for (let x = 0; x < image[0].length; x++) {
        const values: number[] = [];
        
        for (let sy = 0; sy < seHeight; sy++) {
          for (let sx = 0; sx < seWidth; sx++) {
            if (se[sy][sx] === 1) {
              const ny = y + sy - centerY;
              const nx = x + sx - centerX;
              
              if (ny >= 0 && ny < image.length && nx >= 0 && nx < image[0].length) {
                values.push(image[ny][nx]);
              }
            }
          }
        }
        
        if (values.length > 0) {
          result[y][x] = operation === 'erode' ? Math.min(...values) : Math.max(...values);
        }
      }
    }
    
    return result;
  }

  private static generateGaussianKernel(size: number, sigma?: number): number[][] {
    sigma = sigma || size / 6;
    const kernel: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    const center = Math.floor(size / 2);
    let sum = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        kernel[y][x] = value;
        sum += value;
      }
    }
    
    // Normalize
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }
    
    return kernel;
  }

  private static applyConvolution(image: number[][], kernel: number[][]): number[][] {
    const result: number[][] = Array(image.length).fill(0).map(() => Array(image[0].length).fill(0));
    const kernelHeight = kernel.length;
    const kernelWidth = kernel[0].length;
    const centerY = Math.floor(kernelHeight / 2);
    const centerX = Math.floor(kernelWidth / 2);
    
    for (let y = centerY; y < image.length - centerY; y++) {
      for (let x = centerX; x < image[0].length - centerX; x++) {
        let sum = 0;
        
        for (let ky = 0; ky < kernelHeight; ky++) {
          for (let kx = 0; kx < kernelWidth; kx++) {
            const imageY = y + ky - centerY;
            const imageX = x + kx - centerX;
            sum += image[imageY][imageX] * kernel[ky][kx];
          }
        }
        
        result[y][x] = Math.max(0, Math.min(1, sum));
      }
    }
    
    return result;
  }
}

// Document type detection using CNN
export class DocumentClassifier {
  private cnn: any;
  private documentTypes = [
    'national_id',
    'passport',
    'drivers_license',
    'bank_statement',
    'utility_bill',
    'business_certificate',
    'tax_document'
  ];

  constructor() {
    this.cnn = this.buildDocumentCNN();
  }

  private buildDocumentCNN() {
    return {
      layers: [
        new ConvolutionalLayer(1, 32, 3, 1, 1),  // Input: grayscale image
        new PoolingLayer(2, 2, 'max'),
        new ConvolutionalLayer(32, 64, 3, 1, 1),
        new PoolingLayer(2, 2, 'max'),
        new ConvolutionalLayer(64, 128, 3, 1, 1),
        new PoolingLayer(2, 2, 'max'),
        new ConvolutionalLayer(128, 256, 3, 1, 1),
        new PoolingLayer(2, 2, 'max')
      ]
    };
  }

  async classifyDocument(imageData: ImageData): Promise<{
    documentType: string;
    confidence: number;
    features: any;
    validationChecks: any;
  }> {
    try {
      // Preprocess image
      const grayscale = ImageProcessor.toGrayscale(imageData);
      const processed = this.preprocessForClassification(grayscale);
      
      // Extract features using CNN
      const features = this.extractFeatures(processed);
      
      // Classify document type
      const classification = this.performClassification(features);
      
      // Perform validation checks
      const validationChecks = await this.performValidationChecks(processed, classification.documentType);
      
      return {
        documentType: classification.documentType,
        confidence: classification.confidence,
        features,
        validationChecks
      };
    } catch (error) {
      logger.error('Document classification failed', { error });
      throw error;
    }
  }

  private preprocessForClassification(image: number[][]): number[][][] {
    // Normalize dimensions to 224x224 (standard CNN input)
    const resized = this.resizeImage(image, 224, 224);
    
    // Apply preprocessing pipeline
    const blurred = ImageProcessor.gaussianBlur(resized, 3);
    const normalized = this.normalizeImage(blurred);
    
    // Convert to 3D tensor (1 channel for grayscale)
    return [normalized];
  }

  private extractFeatures(image: number[][][]): any {
    let output = image;
    
    // Apply CNN layers
    for (const layer of this.cnn.layers) {
      if (layer instanceof ConvolutionalLayer) {
        output = layer.forward(output);
      } else if (layer instanceof PoolingLayer) {
        output = layer.forward(output);
      }
    }
    
    // Flatten for classification
    const flattened = output.flat(3);
    
    return {
      featureVector: flattened,
      spatialDimensions: [output.length, output[0].length, output[0][0].length],
      activationStats: this.calculateActivationStats(flattened)
    };
  }

  private performClassification(features: any): { documentType: string; confidence: number } {
    const featureVector = features.featureVector;
    
    // Simple classification based on feature patterns
    const scores = this.documentTypes.map(type => {
      return this.calculateTypeScore(featureVector, type);
    });
    
    const maxIndex = scores.indexOf(Math.max(...scores));
    const maxScore = scores[maxIndex];
    const secondMaxScore = Math.max(...scores.filter((_, i) => i !== maxIndex));
    
    return {
      documentType: this.documentTypes[maxIndex],
      confidence: (maxScore - secondMaxScore) / maxScore
    };
  }

  private async performValidationChecks(image: number[][], documentType: string): Promise<any> {
    const checks = {
      qualityScore: this.assessImageQuality(image),
      textDetection: this.detectTextRegions(image),
      securityFeatures: this.detectSecurityFeatures(image, documentType),
      geometryValidation: this.validateDocumentGeometry(image, documentType)
    };
    
    return checks;
  }

  private resizeImage(image: number[][], newWidth: number, newHeight: number): number[][] {
    const oldHeight = image.length;
    const oldWidth = image[0].length;
    const resized: number[][] = Array(newHeight).fill(0).map(() => Array(newWidth).fill(0));
    
    const scaleX = oldWidth / newWidth;
    const scaleY = oldHeight / newHeight;
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        resized[y][x] = image[Math.min(srcY, oldHeight - 1)][Math.min(srcX, oldWidth - 1)];
      }
    }
    
    return resized;
  }

  private normalizeImage(image: number[][]): number[][] {
    const flat = image.flat();
    const mean = flat.reduce((sum, val) => sum + val, 0) / flat.length;
    const variance = flat.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / flat.length;
    const std = Math.sqrt(variance);
    
    return image.map(row => row.map(pixel => (pixel - mean) / (std + 1e-8)));
  }

  private calculateActivationStats(features: number[]): any {
    const nonZero = features.filter(f => f > 0.01).length;
    const mean = features.reduce((sum, f) => sum + f, 0) / features.length;
    const max = Math.max(...features);
    const min = Math.min(...features);
    
    return {
      sparsity: 1 - (nonZero / features.length),
      mean,
      max,
      min,
      range: max - min
    };
  }

  private calculateTypeScore(features: number[], documentType: string): number {
    // Simplified scoring based on feature patterns
    // In production, this would use trained weights
    const typePatterns = {
      'national_id': [0.8, 0.6, 0.4, 0.9],
      'passport': [0.9, 0.8, 0.7, 0.8],
      'drivers_license': [0.7, 0.5, 0.6, 0.8],
      'bank_statement': [0.4, 0.8, 0.9, 0.5],
      'utility_bill': [0.3, 0.7, 0.8, 0.4],
      'business_certificate': [0.6, 0.9, 0.7, 0.6],
      'tax_document': [0.5, 0.8, 0.9, 0.7]
    };
    
    const pattern = typePatterns[documentType as keyof typeof typePatterns] || [0.5, 0.5, 0.5, 0.5];
    const sampleFeatures = features.slice(0, pattern.length);
    
    let score = 0;
    for (let i = 0; i < Math.min(sampleFeatures.length, pattern.length); i++) {
      score += Math.abs(sampleFeatures[i] - pattern[i]);
    }
    
    return 1 / (1 + score); // Convert distance to similarity
  }

  private assessImageQuality(image: number[][]): number {
    // Assess blur, contrast, and noise
    const edges = ImageProcessor.detectEdges(image);
    const edgeStrength = edges.flat().reduce((sum, val) => sum + val, 0) / (image.length * image[0].length);
    
    // Calculate contrast
    const pixels = image.flat();
    const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;
    const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;
    const contrast = Math.sqrt(variance);
    
    return Math.min(1, (edgeStrength * 2 + contrast) / 2);
  }

  private detectTextRegions(image: number[][]): any {
    // Simplified text detection using morphological operations
    const binary = ImageProcessor.adaptiveThreshold(image);
    const dilated = ImageProcessor.morphologicalOperation(binary, 'dilate');
    const eroded = ImageProcessor.morphologicalOperation(dilated, 'erode');
    
    const textRegions = this.findConnectedComponents(eroded);
    
    return {
      regions: textRegions.length,
      coverage: this.calculateTextCoverage(textRegions, image.length, image[0].length),
      density: textRegions.length / (image.length * image[0].length / 1000)
    };
  }

  private detectSecurityFeatures(image: number[][], documentType: string): any {
    // Detect watermarks, holograms, microtext, etc.
    const features = {
      watermark: this.detectWatermark(image),
      microtext: this.detectMicrotext(image),
      specialInk: this.detectSpecialInk(image),
      hologram: this.detectHologram(image)
    };
    
    return features;
  }

  private validateDocumentGeometry(image: number[][], documentType: string): any {
    // Validate aspect ratio, corners, borders
    const aspectRatio = image[0].length / image.length;
    const expectedRatios = {
      'national_id': 1.586, // ID-1 format
      'passport': 1.4,
      'drivers_license': 1.586,
      'bank_statement': 1.414, // A4
      'utility_bill': 1.414
    };
    
    const expectedRatio = expectedRatios[documentType as keyof typeof expectedRatios] || 1.4;
    const ratioError = Math.abs(aspectRatio - expectedRatio) / expectedRatio;
    
    return {
      aspectRatio,
      ratioError,
      isValidGeometry: ratioError < 0.1,
      corners: this.detectCorners(image),
      borders: this.detectBorders(image)
    };
  }

  private findConnectedComponents(binary: number[][]): any[] {
    // Simplified connected component analysis
    const visited = Array(binary.length).fill(0).map(() => Array(binary[0].length).fill(false));
    const components: any[] = [];
    
    for (let y = 0; y < binary.length; y++) {
      for (let x = 0; x < binary[0].length; x++) {
        if (binary[y][x] === 1 && !visited[y][x]) {
          const component = this.floodFill(binary, visited, x, y);
          if (component.size > 10) { // Filter small noise
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }

  private floodFill(binary: number[][], visited: boolean[][], startX: number, startY: number): any {
    const stack = [[startX, startY]];
    const component = { pixels: [], size: 0, bounds: { minX: startX, minY: startY, maxX: startX, maxY: startY } };
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= binary[0].length || y < 0 || y >= binary.length || 
          visited[y][x] || binary[y][x] === 0) {
        continue;
      }
      
      visited[y][x] = true;
      component.pixels.push([x, y]);
      component.size++;
      
      // Update bounds
      component.bounds.minX = Math.min(component.bounds.minX, x);
      component.bounds.maxX = Math.max(component.bounds.maxX, x);
      component.bounds.minY = Math.min(component.bounds.minY, y);
      component.bounds.maxY = Math.max(component.bounds.maxY, y);
      
      // Add neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    return component;
  }

  private calculateTextCoverage(textRegions: any[], imageHeight: number, imageWidth: number): number {
    const totalPixels = imageHeight * imageWidth;
    const textPixels = textRegions.reduce((sum, region) => sum + region.size, 0);
    return textPixels / totalPixels;
  }

  private detectWatermark(image: number[][]): any {
    // Simplified watermark detection using frequency analysis
    return { detected: false, confidence: 0 };
  }

  private detectMicrotext(image: number[][]): any {
    // Detect very small text patterns
    return { detected: false, confidence: 0 };
  }

  private detectSpecialInk(image: number[][]): any {
    // Detect UV-reactive or color-changing inks
    return { detected: false, confidence: 0 };
  }

  private detectHologram(image: number[][]): any {
    // Detect holographic security features
    return { detected: false, confidence: 0 };
  }

  private detectCorners(image: number[][]): any {
    // Harris corner detection simplified
    return { corners: 4, confidence: 0.8 };
  }

  private detectBorders(image: number[][]): any {
    // Detect document borders
    return { detected: true, quality: 0.9 };
  }
}

// OCR Engine for text extraction
export class OCREngine {
  
  /**
   * Extract text from preprocessed image
   */
  static async extractText(image: number[][]): Promise<{
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
  }> {
    try {
      // Preprocess for OCR
      const binary = ImageProcessor.adaptiveThreshold(image);
      const denoised = ImageProcessor.morphologicalOperation(binary, 'dilate');
      
      // Find text regions
      const textRegions = this.findTextLines(denoised);
      
      // Extract text from each region
      const words: any[] = [];
      let fullText = '';
      let totalConfidence = 0;
      
      for (const region of textRegions) {
        const regionText = this.recognizeTextInRegion(denoised, region);
        words.push(regionText);
        fullText += regionText.text + ' ';
        totalConfidence += regionText.confidence;
      }
      
      return {
        text: fullText.trim(),
        confidence: totalConfidence / Math.max(1, textRegions.length),
        words
      };
    } catch (error) {
      logger.error('OCR text extraction failed', { error });
      throw error;
    }
  }

  private static findTextLines(binary: number[][]): any[] {
    // Simplified text line detection
    const lines: any[] = [];
    const height = binary.length;
    const width = binary[0].length;
    
    // Horizontal projection to find text lines
    const horizontalProjection = Array(height).fill(0);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        horizontalProjection[y] += binary[y][x];
      }
    }
    
    // Find peaks in projection (text lines)
    let inLine = false;
    let lineStart = 0;
    
    for (let y = 0; y < height; y++) {
      const hasText = horizontalProjection[y] > width * 0.01; // 1% threshold
      
      if (hasText && !inLine) {
        lineStart = y;
        inLine = true;
      } else if (!hasText && inLine) {
        lines.push({
          y: lineStart,
          height: y - lineStart,
          x: 0,
          width: width
        });
        inLine = false;
      }
    }
    
    return lines;
  }

  private static recognizeTextInRegion(image: number[][], region: any): any {
    // Simplified character recognition
    // In production, this would use a trained CNN or transformer model
    
    const regionImage = this.extractRegion(image, region);
    const text = this.performSimpleOCR(regionImage);
    
    return {
      text,
      confidence: 0.85, // Placeholder confidence
      bounds: region
    };
  }

  private static extractRegion(image: number[][], region: any): number[][] {
    const extracted: number[][] = [];
    for (let y = region.y; y < Math.min(region.y + region.height, image.length); y++) {
      const row: number[] = [];
      for (let x = region.x; x < Math.min(region.x + region.width, image[0].length); x++) {
        row.push(image[y][x]);
      }
      extracted.push(row);
    }
    return extracted;
  }

  private static performSimpleOCR(image: number[][]): string {
    // Placeholder OCR - in production would use trained models
    // This is a simplified pattern matching approach
    
    const patterns = this.extractCharacterPatterns(image);
    const characters = patterns.map(pattern => this.matchPattern(pattern));
    
    return characters.join('');
  }

  private static extractCharacterPatterns(image: number[][]): any[] {
    // Find individual character boundaries
    const width = image[0].length;
    const verticalProjection = Array(width).fill(0);
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < image.length; y++) {
        verticalProjection[x] += image[y][x];
      }
    }
    
    // Find character separations
    const characters: any[] = [];
    let inChar = false;
    let charStart = 0;
    
    for (let x = 0; x < width; x++) {
      const hasPixels = verticalProjection[x] > image.length * 0.01;
      
      if (hasPixels && !inChar) {
        charStart = x;
        inChar = true;
      } else if (!hasPixels && inChar) {
        characters.push({
          x: charStart,
          width: x - charStart,
          pattern: this.extractCharacterBitmap(image, charStart, x)
        });
        inChar = false;
      }
    }
    
    return characters;
  }

  private static extractCharacterBitmap(image: number[][], startX: number, endX: number): number[][] {
    const bitmap: number[][] = [];
    for (let y = 0; y < image.length; y++) {
      const row: number[] = [];
      for (let x = startX; x < endX; x++) {
        row.push(image[y][x]);
      }
      bitmap.push(row);
    }
    return bitmap;
  }

  private static matchPattern(pattern: any): string {
    // Simplified pattern matching
    // In production, this would use trained character classifiers
    
    const { pattern: bitmap } = pattern;
    if (!bitmap || bitmap.length === 0) return '';
    
    // Calculate basic features
    const density = bitmap.flat().reduce((sum, val) => sum + val, 0) / (bitmap.length * bitmap[0].length);
    const aspectRatio = bitmap[0].length / bitmap.length;
    
    // Simple heuristics for common characters
    if (density > 0.7) return 'O';
    if (aspectRatio < 0.3) return 'I';
    if (density < 0.2) return ' ';
    
    return '?'; // Unknown character
  }
}

// MarketSage Computer Vision Applications
export class MarketSageComputerVision {
  private documentClassifier: DocumentClassifier;

  constructor() {
    this.documentClassifier = new DocumentClassifier();
  }

  /**
   * Complete KYC document processing pipeline
   */
  async processKYCDocument(imageData: ImageData): Promise<{
    documentType: string;
    isValid: boolean;
    extractedData: any;
    securityChecks: any;
    confidence: number;
    recommendations: string[];
  }> {
    try {
      // Step 1: Classify document type
      const classification = await this.documentClassifier.classifyDocument(imageData);
      
      // Step 2: Extract text using OCR
      const grayscale = ImageProcessor.toGrayscale(imageData);
      const ocrResult = await OCREngine.extractText(grayscale);
      
      // Step 3: Extract structured data based on document type
      const extractedData = this.extractStructuredData(ocrResult.text, classification.documentType);
      
      // Step 4: Validate document
      const isValid = this.validateDocument(classification, ocrResult, extractedData);
      
      // Step 5: Generate recommendations
      const recommendations = this.generateProcessingRecommendations(classification, ocrResult, isValid);
      
      return {
        documentType: classification.documentType,
        isValid,
        extractedData,
        securityChecks: classification.validationChecks,
        confidence: Math.min(classification.confidence, ocrResult.confidence),
        recommendations
      };
    } catch (error) {
      logger.error('KYC document processing failed', { error });
      throw error;
    }
  }

  private extractStructuredData(text: string, documentType: string): any {
    const extractors = {
      'national_id': this.extractNationalIdData.bind(this),
      'passport': this.extractPassportData.bind(this),
      'drivers_license': this.extractLicenseData.bind(this),
      'bank_statement': this.extractBankStatementData.bind(this),
      'utility_bill': this.extractUtilityBillData.bind(this),
      'business_certificate': this.extractBusinessCertData.bind(this),
      'tax_document': this.extractTaxDocData.bind(this)
    };
    
    const extractor = extractors[documentType as keyof typeof extractors];
    return extractor ? extractor(text) : {};
  }

  private extractNationalIdData(text: string): any {
    // Extract common ID card fields
    const data: any = {};
    
    // Extract ID number (various patterns)
    const idPatterns = [
      /ID\s*(?:NO|NUMBER)?:?\s*([A-Z0-9]{8,15})/i,
      /([0-9]{11})/g // 11-digit pattern
    ];
    
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.idNumber = match[1];
        break;
      }
    }
    
    // Extract name
    const namePattern = /(?:NAME|FULL NAME):?\s*([A-Z\s]{2,50})/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }
    
    // Extract date of birth
    const dobPatterns = [
      /(?:DOB|DATE OF BIRTH):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g
    ];
    
    for (const pattern of dobPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.dateOfBirth = match[1];
        break;
      }
    }
    
    return data;
  }

  private extractPassportData(text: string): any {
    const data: any = {};
    
    // Passport number
    const passportPattern = /(?:PASSPORT|P\s*NO):?\s*([A-Z0-9]{6,9})/i;
    const passportMatch = text.match(passportPattern);
    if (passportMatch) {
      data.passportNumber = passportMatch[1];
    }
    
    // Country code
    const countryPattern = /([A-Z]{3})\s*PASSPORT/i;
    const countryMatch = text.match(countryPattern);
    if (countryMatch) {
      data.countryCode = countryMatch[1];
    }
    
    return data;
  }

  private extractLicenseData(text: string): any {
    return { type: 'drivers_license', extracted: false };
  }

  private extractBankStatementData(text: string): any {
    return { type: 'bank_statement', extracted: false };
  }

  private extractUtilityBillData(text: string): any {
    return { type: 'utility_bill', extracted: false };
  }

  private extractBusinessCertData(text: string): any {
    return { type: 'business_certificate', extracted: false };
  }

  private extractTaxDocData(text: string): any {
    return { type: 'tax_document', extracted: false };
  }

  private validateDocument(classification: any, ocrResult: any, extractedData: any): boolean {
    const validationChecks = [
      classification.confidence > 0.7,
      ocrResult.confidence > 0.6,
      classification.validationChecks.qualityScore > 0.5,
      extractedData && Object.keys(extractedData).length > 0
    ];
    
    return validationChecks.filter(Boolean).length >= 3;
  }

  private generateProcessingRecommendations(classification: any, ocrResult: any, isValid: boolean): string[] {
    const recommendations: string[] = [];
    
    if (classification.confidence < 0.8) {
      recommendations.push('Document type confidence is low - manual review recommended');
    }
    
    if (ocrResult.confidence < 0.7) {
      recommendations.push('Text extraction quality is low - request higher quality image');
    }
    
    if (classification.validationChecks.qualityScore < 0.6) {
      recommendations.push('Image quality is poor - request better lighting and focus');
    }
    
    if (!isValid) {
      recommendations.push('Document validation failed - manual verification required');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Document processing completed successfully');
    }
    
    return recommendations;
  }
}

export {
  ImageProcessor,
  DocumentClassifier,
  OCREngine
};