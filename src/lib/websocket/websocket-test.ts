/**
 * WebSocket Integration Test
 * 
 * Simple test to verify WebSocket integration is working correctly
 */

import { leadPulseWebSocketService } from './leadpulse-websocket-service';

/**
 * Test WebSocket connection
 */
export async function testWebSocketConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test service initialization
    const initialStatus = leadPulseWebSocketService.getStatus();
    
    if (initialStatus.isConnected) {
      return {
        success: true,
        message: 'WebSocket already connected',
        details: initialStatus
      };
    }
    
    // Test connection attempt
    await leadPulseWebSocketService.connect();
    
    // Wait a moment for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalStatus = leadPulseWebSocketService.getStatus();
    
    return {
      success: finalStatus.isConnected || finalStatus.isConnecting,
      message: finalStatus.isConnected 
        ? 'WebSocket connected successfully'
        : finalStatus.isConnecting 
          ? 'WebSocket connecting...'
          : 'WebSocket connection failed',
      details: finalStatus
    };
  } catch (error) {
    return {
      success: false,
      message: `WebSocket test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
}

/**
 * Test WebSocket subscription
 */
export async function testWebSocketSubscription(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test subscription
    leadPulseWebSocketService.subscribe('visitor_locations', {
      timeRange: '1h',
      includeLocation: true,
      updateInterval: 5000
    });
    
    const status = leadPulseWebSocketService.getStatus();
    
    return {
      success: status.subscriptions.includes('visitor_locations'),
      message: status.subscriptions.includes('visitor_locations')
        ? 'WebSocket subscription successful'
        : 'WebSocket subscription failed',
      details: status
    };
  } catch (error) {
    return {
      success: false,
      message: `WebSocket subscription test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
}

/**
 * Test WebSocket cleanup
 */
export async function testWebSocketCleanup(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test cleanup
    leadPulseWebSocketService.disconnect();
    
    const status = leadPulseWebSocketService.getStatus();
    
    return {
      success: !status.isConnected && status.subscriptions.length === 0,
      message: !status.isConnected && status.subscriptions.length === 0
        ? 'WebSocket cleanup successful'
        : 'WebSocket cleanup incomplete',
      details: status
    };
  } catch (error) {
    return {
      success: false,
      message: `WebSocket cleanup test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    };
  }
}

/**
 * Run all WebSocket tests
 */
export async function runWebSocketTests(): Promise<{
  success: boolean;
  message: string;
  results: Record<string, any>;
}> {
  const results: Record<string, any> = {};
  
  try {
    // Test 1: Connection
    results.connection = await testWebSocketConnection();
    
    // Test 2: Subscription (only if connection works)
    if (results.connection.success) {
      results.subscription = await testWebSocketSubscription();
    }
    
    // Test 3: Cleanup
    results.cleanup = await testWebSocketCleanup();
    
    const allSuccessful = Object.values(results).every((result: any) => result.success);
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? 'All WebSocket tests passed'
        : 'Some WebSocket tests failed',
      results
    };
  } catch (error) {
    return {
      success: false,
      message: `WebSocket test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      results
    };
  }
}

export default {
  testWebSocketConnection,
  testWebSocketSubscription,
  testWebSocketCleanup,
  runWebSocketTests
};