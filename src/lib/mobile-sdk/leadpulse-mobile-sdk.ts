/**
 * LeadPulse Mobile SDK
 * ====================
 * Comprehensive mobile application tracking SDK for React Native and mobile web
 * with app lifecycle tracking, session management, and offline capabilities
 */

export interface MobileSDKConfig {
  apiKey: string;
  baseUrl: string;
  appName: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  enableDebugLogs: boolean;
  enableOfflineMode: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  sessionTimeout: number; // milliseconds
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserJourneyTracking: boolean;
  privacySettings: {
    collectDeviceInfo: boolean;
    collectLocationData: boolean;
    collectCrashLogs: boolean;
    collectPerformanceMetrics: boolean;
  };
}

export interface AppLifecycleEvent {
  id: string;
  sessionId: string;
  userId?: string;
  event: 'app_start' | 'app_foreground' | 'app_background' | 'app_terminate' | 'app_crash';
  timestamp: number;
  duration?: number; // For background/foreground duration
  metadata: {
    appVersion: string;
    osVersion: string;
    deviceModel: string;
    batteryLevel?: number;
    networkType: string;
    memoryUsage?: number;
    storageUsage?: number;
    previousEvent?: string;
    crashDetails?: {
      error: string;
      stackTrace: string;
      breadcrumbs: string[];
    };
  };
}

export interface MobileUserAction {
  id: string;
  sessionId: string;
  userId?: string;
  type: 'screen_view' | 'button_tap' | 'swipe' | 'scroll' | 'form_submit' | 'purchase' | 'search' | 'custom';
  screen: string;
  element?: string;
  value?: string | number;
  timestamp: number;
  coordinates?: { x: number; y: number };
  metadata: {
    screenDimensions: { width: number; height: number };
    viewportSize: { width: number; height: number };
    orientation: 'portrait' | 'landscape';
    connectionType: string;
    loadTime?: number;
    scrollDepth?: number;
  };
}

export interface MobileSession {
  id: string;
  userId?: string;
  deviceId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  screenViews: number;
  actions: number;
  crashes: number;
  isActive: boolean;
  metadata: {
    appVersion: string;
    osVersion: string;
    deviceModel: string;
    deviceType: 'phone' | 'tablet';
    networkType: string;
    country?: string;
    timezone: string;
    firstSession: boolean;
    referrer?: string;
  };
}

export interface PerformanceMetric {
  id: string;
  sessionId: string;
  type: 'app_startup' | 'screen_load' | 'api_call' | 'memory_usage' | 'cpu_usage' | 'battery_usage';
  value: number;
  unit: string;
  timestamp: number;
  metadata: {
    screen?: string;
    apiEndpoint?: string;
    method?: string;
    statusCode?: number;
    responseSize?: number;
  };
}

class LeadPulseMobileSDK {
  private config: MobileSDKConfig;
  private currentSession: MobileSession | null = null;
  private eventQueue: (AppLifecycleEvent | MobileUserAction | PerformanceMetric)[] = [];
  private isInitialized = false;
  private lastActivityTime = Date.now();
  private backgroundTime?: number;
  private sessionTimer?: NodeJS.Timeout;
  private flushTimer?: NodeJS.Timeout;
  private deviceId: string;

  constructor(config: MobileSDKConfig) {
    this.config = config;
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Initialize the SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log('SDK already initialized');
      return;
    }

    try {
      this.log('Initializing LeadPulse Mobile SDK...');
      
      // Setup event listeners for app lifecycle
      this.setupLifecycleListeners();
      
      // Start session
      await this.startSession();
      
      // Setup periodic flush
      this.setupPeriodicFlush();
      
      // Setup session timeout monitoring
      this.setupSessionMonitoring();
      
      // Track app start event
      await this.trackLifecycleEvent('app_start', {
        appVersion: this.config.appVersion,
        osVersion: this.getOSVersion(),
        deviceModel: this.getDeviceModel(),
        networkType: this.getNetworkType(),
        memoryUsage: this.getMemoryUsage(),
        storageUsage: this.getStorageUsage()
      });

      this.isInitialized = true;
      this.log('SDK initialized successfully');
    } catch (error) {
      this.log('Failed to initialize SDK:', error);
      throw error;
    }
  }

  /**
   * Start a new session
   */
  private async startSession(): Promise<void> {
    const isFirstSession = !this.hasExistingSession();
    
    this.currentSession = {
      id: this.generateSessionId(),
      userId: undefined, // Will be set when user logs in
      deviceId: this.deviceId,
      startTime: Date.now(),
      screenViews: 0,
      actions: 0,
      crashes: 0,
      isActive: true,
      metadata: {
        appVersion: this.config.appVersion,
        osVersion: this.getOSVersion(),
        deviceModel: this.getDeviceModel(),
        deviceType: this.getDeviceType(),
        networkType: this.getNetworkType(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        firstSession: isFirstSession
      }
    };

    // Store session locally for persistence
    this.storeSession(this.currentSession);
    
    this.log('Session started:', this.currentSession.id);
  }

  /**
   * End current session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.isActive = false;

    // Flush any remaining events
    await this.flush();
    
    this.log('Session ended:', this.currentSession.id, 'Duration:', this.currentSession.duration);
    this.currentSession = null;
  }

  /**
   * Track app lifecycle events
   */
  async trackLifecycleEvent(
    event: AppLifecycleEvent['event'], 
    additionalMetadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.currentSession) {
      this.log('No active session for lifecycle event:', event);
      return;
    }

    const lifecycleEvent: AppLifecycleEvent = {
      id: this.generateEventId(),
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      event,
      timestamp: Date.now(),
      metadata: {
        appVersion: this.config.appVersion,
        osVersion: this.getOSVersion(),
        deviceModel: this.getDeviceModel(),
        batteryLevel: this.getBatteryLevel(),
        networkType: this.getNetworkType(),
        memoryUsage: this.getMemoryUsage(),
        ...additionalMetadata
      }
    };

    this.eventQueue.push(lifecycleEvent);
    this.log('Lifecycle event tracked:', event);

    // Immediate flush for critical events
    if (event === 'app_crash' || event === 'app_terminate') {
      await this.flush();
    }
  }

  /**
   * Track user actions
   */
  async trackUserAction(
    type: MobileUserAction['type'],
    screen: string,
    element?: string,
    value?: string | number,
    coordinates?: { x: number; y: number }
  ): Promise<void> {
    if (!this.currentSession) {
      this.log('No active session for user action:', type);
      return;
    }

    const action: MobileUserAction = {
      id: this.generateEventId(),
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      type,
      screen,
      element,
      value,
      timestamp: Date.now(),
      coordinates,
      metadata: {
        screenDimensions: this.getScreenDimensions(),
        viewportSize: this.getViewportSize(),
        orientation: this.getOrientation(),
        connectionType: this.getNetworkType()
      }
    };

    this.eventQueue.push(action);
    this.currentSession.actions++;
    this.updateLastActivity();

    if (type === 'screen_view') {
      this.currentSession.screenViews++;
    }

    this.log('User action tracked:', type, screen);
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    type: PerformanceMetric['type'],
    value: number,
    unit: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.config.enablePerformanceMonitoring || !this.currentSession) return;

    const metric: PerformanceMetric = {
      id: this.generateEventId(),
      sessionId: this.currentSession.id,
      type,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    this.eventQueue.push(metric);
    this.log('Performance metric tracked:', type, value, unit);
  }

  /**
   * Set user ID for session
   */
  setUserId(userId: string): void {
    if (this.currentSession) {
      this.currentSession.userId = userId;
      this.log('User ID set:', userId);
    }
  }

  /**
   * Track crash with details
   */
  async trackCrash(error: Error, breadcrumbs: string[] = []): Promise<void> {
    if (!this.config.enableCrashReporting) return;

    const crashDetails = {
      error: error.message,
      stackTrace: error.stack || '',
      breadcrumbs
    };

    await this.trackLifecycleEvent('app_crash', {
      crashDetails
    });

    if (this.currentSession) {
      this.currentSession.crashes++;
    }

    this.log('Crash tracked:', error.message);
  }

  /**
   * Setup app lifecycle listeners
   */
  private setupLifecycleListeners(): void {
    // React Native specific listeners
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      // Handle React Native app state changes
      this.setupReactNativeListeners();
    } else {
      // Handle web-based mobile listeners
      this.setupWebListeners();
    }
  }

  private setupReactNativeListeners(): void {
    // In a real React Native app, you would use:
    // import { AppState } from 'react-native';
    // AppState.addEventListener('change', this.handleAppStateChange);
    
    this.log('React Native listeners would be set up here');
  }

  private setupWebListeners(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.handleAppBackground();
        } else {
          this.handleAppForeground();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.handleAppTerminate();
      });

      window.addEventListener('error', (event) => {
        this.trackCrash(new Error(event.message));
      });
    }
  }

  private async handleAppBackground(): Promise<void> {
    this.backgroundTime = Date.now();
    await this.trackLifecycleEvent('app_background');
    await this.flush(); // Ensure events are sent before backgrounding
  }

  private async handleAppForeground(): Promise<void> {
    const duration = this.backgroundTime ? Date.now() - this.backgroundTime : 0;
    this.backgroundTime = undefined;
    
    await this.trackLifecycleEvent('app_foreground', { duration });
    this.updateLastActivity();
  }

  private async handleAppTerminate(): Promise<void> {
    await this.trackLifecycleEvent('app_terminate');
    await this.endSession();
  }

  /**
   * Setup periodic event flushing
   */
  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Setup session timeout monitoring
   */
  private setupSessionMonitoring(): void {
    this.sessionTimer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      
      if (timeSinceLastActivity > this.config.sessionTimeout) {
        this.log('Session timeout detected, ending session');
        this.endSession();
      }
    }, 60000); // Check every minute
  }

  /**
   * Flush events to server
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = this.eventQueue.splice(0, this.config.batchSize);
      
      const response = await fetch(`${this.config.baseUrl}/api/mobile/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-App-Version': this.config.appVersion,
          'X-Device-ID': this.deviceId
        },
        body: JSON.stringify({
          events,
          session: this.currentSession,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.log(`Flushed ${events.length} events to server`);
    } catch (error) {
      this.log('Failed to flush events:', error);
      
      // Re-add events to queue if offline mode is enabled
      if (this.config.enableOfflineMode) {
        this.eventQueue.unshift(...this.eventQueue);
        this.storeEventsOffline(this.eventQueue);
      }
    }
  }

  /**
   * Utility methods
   */
  private updateLastActivity(): void {
    this.lastActivityTime = Date.now();
  }

  private generateDeviceId(): string {
    // In production, use a more robust device ID generation
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOSVersion(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'unknown';
  }

  private getDeviceModel(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }
    return 'unknown';
  }

  private getDeviceType(): 'phone' | 'tablet' {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width > 768 ? 'tablet' : 'phone';
    }
    return 'phone';
  }

  private getNetworkType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  private getBatteryLevel(): number | undefined {
    // Battery API is deprecated but still useful for analytics
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return Math.round(battery.level * 100);
      });
    }
    return undefined;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof (performance as any)?.memory !== 'undefined') {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  private getStorageUsage(): number | undefined {
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      (navigator as any).storage.estimate().then((estimate: any) => {
        return estimate.usage;
      });
    }
    return undefined;
  }

  private getScreenDimensions(): { width: number; height: number } {
    if (typeof screen !== 'undefined') {
      return { width: screen.width, height: screen.height };
    }
    return { width: 0, height: 0 };
  }

  private getViewportSize(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 0, height: 0 };
  }

  private getOrientation(): 'portrait' | 'landscape' {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
    return 'portrait';
  }

  private hasExistingSession(): boolean {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('leadpulse_session') !== null;
    }
    return false;
  }

  private storeSession(session: MobileSession): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('leadpulse_session', JSON.stringify(session));
    }
  }

  private storeEventsOffline(events: any[]): void {
    if (typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem('leadpulse_offline_events') || '[]';
      const existingEvents = JSON.parse(existing);
      localStorage.setItem('leadpulse_offline_events', JSON.stringify([...existingEvents, ...events]));
    }
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogs) {
      console.log(`[LeadPulse SDK] ${message}`, ...args);
    }
  }

  /**
   * Public API methods
   */
  
  async trackScreen(screenName: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.trackUserAction('screen_view', screenName);
    await this.trackPerformance('screen_load', Date.now(), 'ms', { screen: screenName, ...metadata });
  }

  async trackButton(buttonName: string, screen: string, coordinates?: { x: number; y: number }): Promise<void> {
    await this.trackUserAction('button_tap', screen, buttonName, undefined, coordinates);
  }

  async trackPurchase(amount: number, currency: string, productId: string, screen: string): Promise<void> {
    await this.trackUserAction('purchase', screen, productId, amount);
  }

  async trackSearch(query: string, screen: string, resultsCount?: number): Promise<void> {
    await this.trackUserAction('search', screen, 'search_query', query);
  }

  async trackCustomEvent(eventName: string, screen: string, value?: string | number, metadata: Record<string, any> = {}): Promise<void> {
    await this.trackUserAction('custom', screen, eventName, value);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    this.endSession();
    this.log('SDK destroyed');
  }
}

// Export convenience functions
export function createMobileSDK(config: MobileSDKConfig): LeadPulseMobileSDK {
  return new LeadPulseMobileSDK(config);
}

export { LeadPulseMobileSDK };