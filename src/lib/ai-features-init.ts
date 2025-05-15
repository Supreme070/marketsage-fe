/**
 * AI Features Initialization
 * 
 * This module provides a single entry point for initializing all AI features
 * in the MarketSage platform. It checks if the required database tables exist
 * and creates them if necessary.
 */

import { checkAIFeaturesTables, setupAIFeaturesTables } from '@/lib/db/setup-ai-features';
import { logger } from '@/lib/logger';

let initialized = false;

/**
 * Initialize AI features
 * This function ensures that all required database tables and initial data
 * are set up for the AI features to work properly.
 */
export async function initializeAIFeatures(): Promise<boolean> {
  if (initialized) {
    return true;
  }
  
  try {
    logger.info("Initializing AI features");
    
    // Check if tables exist
    const tablesExist = await checkAIFeaturesTables();
    
    if (!tablesExist) {
      logger.info("AI features tables do not exist, creating them");
      await setupAIFeaturesTables();
    } else {
      logger.info("AI features tables already exist");
    }
    
    initialized = true;
    logger.info("AI features initialized successfully");
    return true;
  } catch (error) {
    logger.error("Failed to initialize AI features", error);
    return false;
  }
}

/**
 * Check if AI features are available
 */
export function areAIFeaturesInitialized(): boolean {
  return initialized;
}

// For testing - if this file is directly executed
if (typeof require !== 'undefined' && require.main === module) {
  initializeAIFeatures()
    .then(success => {
      if (success) {
        console.log("AI features initialized successfully");
        process.exit(0);
      } else {
        console.error("Failed to initialize AI features");
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("Error initializing AI features:", error);
      process.exit(1);
    });
} 