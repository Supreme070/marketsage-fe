/**
 * Unified LeadPulse Data Provider
 * 
 * Intelligently provides data from demo, production, or simulation sources
 * without breaking existing functionality. Ensures consistent visitor counts
 * across all LeadPulse components.
 */

import type { VisitorLocation, VisitorJourney, InsightItem } from './dataProvider';
import demoProvider from './demoDataProvider';

// Data source priority: demo > production > fallback
export type DataSource = 'demo' | 'production' | 'fallback';

interface DataProviderOptions {
  timeRange?: string;
  forceSource?: DataSource;
  fallbackToDemo?: boolean;
}

/**
 * Determine which data source to use
 */
async function determineDataSource(options: DataProviderOptions = {}): Promise<DataSource> {
  // If explicitly forced, use that source
  if (options.forceSource) {
    return options.forceSource;
  }
  
  // Check demo mode or AI training mode first
  const demoConfig = demoProvider.getDemoConfig();
  if (demoConfig.mode === 'demo' || demoConfig.mode === 'ai_training') {
    return 'demo';
  }
  
  // TODO: Check for real production data when implemented
  const hasProductionData = false; // await checkProductionData();
  if (hasProductionData) {
    return 'production';
  }
  
  // Simulation system has been removed - skip simulation check
  
  // Fallback to demo data
  return 'fallback';
}

/**
 * Get visitor locations from the appropriate source
 */
export async function getVisitorLocations(
  timeRange = '24h',
  options: DataProviderOptions = {}
): Promise<VisitorLocation[]> {
  try {
    const source = await determineDataSource(options);
    
    console.log(`LeadPulse: Using ${source} data source for visitor locations`);
    
    switch (source) {
      case 'demo':
      case 'fallback':
        return demoProvider.getDemoVisitorLocations(timeRange);
        
      case 'production':
        // TODO: Implement production data fetching
        console.log('Production data not yet implemented, falling back to demo');
        return demoProvider.getDemoVisitorLocations(timeRange);
        
        
      default:
        return demoProvider.getDemoVisitorLocations(timeRange);
    }
  } catch (error) {
    console.error('Error in unified getVisitorLocations:', error);
    
    // Always fallback to demo data on error
    return demoProvider.getDemoVisitorLocations(timeRange);
  }
}

/**
 * Get visitor journeys from the appropriate source
 */
export async function getVisitorJourneys(
  timeRange = '24h',
  options: DataProviderOptions = {}
): Promise<VisitorJourney[]> {
  try {
    const source = await determineDataSource(options);
    
    console.log(`LeadPulse: Using ${source} data source for visitor journeys`);
    
    switch (source) {
      case 'demo':
      case 'fallback':
        return demoProvider.getDemoVisitorJourneys();
        
      case 'production':
        // TODO: Implement production data fetching
        console.log('Production data not yet implemented, falling back to demo');
        return demoProvider.getDemoVisitorJourneys();
        
        
      default:
        return demoProvider.getDemoVisitorJourneys();
    }
  } catch (error) {
    console.error('Error in unified getVisitorJourneys:', error);
    return demoProvider.getDemoVisitorJourneys();
  }
}

/**
 * Get insights from the appropriate source
 */
export async function getInsights(
  timeRange = '24h',
  options: DataProviderOptions = {}
): Promise<InsightItem[]> {
  try {
    const source = await determineDataSource(options);
    
    console.log(`LeadPulse: Using ${source} data source for insights`);
    
    switch (source) {
      case 'demo':
      case 'fallback':
        return demoProvider.getDemoInsights();
        
      case 'production':
        // TODO: Implement production data fetching
        console.log('Production data not yet implemented, falling back to demo');
        return demoProvider.getDemoInsights();
        
        
      default:
        return demoProvider.getDemoInsights();
    }
  } catch (error) {
    console.error('Error in unified getInsights:', error);
    return demoProvider.getDemoInsights();
  }
}

/**
 * Get analytics overview from the appropriate source
 */
export async function getAnalyticsOverview(
  timeRange = '24h',
  options: DataProviderOptions = {}
) {
  try {
    const source = await determineDataSource(options);
    
    console.log(`LeadPulse: Using ${source} data source for analytics overview`);
    
    switch (source) {
      case 'demo':
      case 'fallback':
        return demoProvider.getDemoAnalyticsOverview();
        
      case 'production':
        // TODO: Implement production data fetching
        console.log('Production data not yet implemented, falling back to demo');
        return demoProvider.getDemoAnalyticsOverview();
        
        
      default:
        return demoProvider.getDemoAnalyticsOverview();
    }
  } catch (error) {
    console.error('Error in unified getAnalyticsOverview:', error);
    return demoProvider.getDemoAnalyticsOverview();
  }
}

/**
 * Get current data source being used
 */
export async function getCurrentDataSource(): Promise<DataSource> {
  return await determineDataSource();
}

/**
 * Enable demo mode for marketing presentations
 */
export function enableDemoMode(scenario: 'standard' | 'busy_day' | 'quiet_day' | 'conversion_event' = 'standard') {
  demoProvider.setDemoConfig({
    mode: 'demo',
    scenario,
    persistData: true
  });
  
  console.log(`LeadPulse: Demo mode enabled with ${scenario} scenario`);
}

/**
 * Disable demo mode and return to automatic source selection
 */
export function disableDemoMode() {
  demoProvider.setDemoConfig({
    mode: 'production',
    persistData: true
  });
  
  console.log('LeadPulse: Demo mode disabled');
}

/**
 * Check if demo mode is active
 */
export function isDemoModeActive(): boolean {
  return demoProvider.getDemoConfig().mode === 'demo';
}

export default {
  getVisitorLocations,
  getVisitorJourneys,
  getInsights,
  getAnalyticsOverview,
  getCurrentDataSource,
  enableDemoMode,
  disableDemoMode,
  isDemoModeActive
};