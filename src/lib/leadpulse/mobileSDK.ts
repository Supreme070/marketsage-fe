/**
 * LeadPulse Mobile SDK
 * 
 * This SDK enables tracking of mobile app users in React Native, native iOS/Android,
 * and hybrid mobile applications, integrating with the existing LeadPulse web tracking system.
 */

export interface MobileVisitorData {
  deviceId: string;
  appId: string;
  platform: 'ios' | 'android' | 'react-native' | 'flutter' | 'hybrid';
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  locale: string;
  timezone: string;
  screenSize: { width: number; height: number };
  pushToken?: string;
  advertisingId?: string;
}

export interface MobileEventData {
  eventType: 'app_open' | 'screen_view' | 'button_tap' | 'form_interaction' | 'conversion' | 'app_background' | 'custom';
  screenName?: string;
  elementId?: string;
  formId?: string;
  eventName?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export class LeadPulseMobileTracker {
  protected config: {
    apiEndpoint: string;
    appId: string;
    debug: boolean;
  };
  
  private deviceId: string;
  private visitorId: string | null = null;
  private sessionId: string;
  private sessionStartTime: number;
  private isInitialized = false;

  constructor(config: { apiEndpoint: string; appId: string; debug?: boolean; autoTrack?: boolean }) {
    this.config = {
      debug: false,
      autoTrack: true, // Enable automatic tracking by default
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.deviceId = ''; // Will be set during initialization
  }

  /**
   * Initialize the mobile tracker
   */
  async initialize(deviceData: MobileVisitorData): Promise<void> {
    try {
      this.deviceId = deviceData.deviceId;
      
             // Check for existing visitor ID in local storage
       this.visitorId = await this.getStoredVisitorId() || null;
      
      // Register or identify the mobile visitor
      const response = await this.sendRequest('/api/leadpulse/mobile/identify', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: this.deviceId,
          existingVisitorId: this.visitorId,
          deviceData,
          sessionId: this.sessionId,
          appInstallTime: await this.getAppInstallTime(),
          lastLaunchTime: Date.now()
        })
      });

      if (response.visitorId) {
        this.visitorId = response.visitorId;
        await this.storeVisitorId(this.visitorId);
        this.isInitialized = true;
        
        // Track app open
        await this.trackEvent({
          eventType: 'app_open',
          timestamp: new Date().toISOString()
        });

        this.log('LeadPulse Mobile SDK initialized', { visitorId: this.visitorId });
      }
    } catch (error) {
      this.log('Failed to initialize LeadPulse Mobile SDK', error);
      throw error;
    }
  }

  /**
   * Track a screen view (equivalent to page view in web)
   */
  async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      eventType: 'screen_view',
      screenName,
      properties,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track a button tap or UI interaction
   */
  async trackInteraction(elementId: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      eventType: 'button_tap',
      elementId,
      properties,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track form interactions
   */
  async trackFormInteraction(formId: string, action: 'view' | 'start' | 'submit', properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      eventType: 'form_interaction',
      formId,
      properties: { action, ...properties },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track conversions (purchases, sign-ups, etc.)
   */
  async trackConversion(conversionType: string, value?: number, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      eventType: 'conversion',
      eventName: conversionType,
      properties: { value, ...properties },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track custom events
   */
  async trackCustomEvent(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.trackEvent({
      eventType: 'custom',
      eventName,
      properties,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Identify a user (when they log in)
   */
  async identifyUser(userId: string, userProperties: Record<string, any> = {}): Promise<void> {
    if (!this.isInitialized || !this.visitorId) {
      this.log('SDK not initialized');
      return;
    }

    await this.sendRequest('/api/leadpulse/mobile/identify-user', {
      method: 'POST',
      body: JSON.stringify({
        visitorId: this.visitorId,
        userId,
        userProperties,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Update push notification token
   */
  async updatePushToken(pushToken: string): Promise<void> {
    if (!this.isInitialized || !this.visitorId) {
      this.log('SDK not initialized');
      return;
    }

    await this.sendRequest('/api/leadpulse/mobile/push-token', {
      method: 'POST',
      body: JSON.stringify({
        visitorId: this.visitorId,
        pushToken,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Track app going to background
   */
  async trackAppBackground(): Promise<void> {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    await this.trackEvent({
      eventType: 'app_background',
      properties: { sessionDuration },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Internal method to track events
   */
  private async trackEvent(eventData: MobileEventData): Promise<void> {
    if (!this.isInitialized || !this.visitorId) {
      this.log('SDK not initialized or no visitor ID');
      return;
    }

    try {
      await this.sendRequest('/api/leadpulse/mobile/track', {
        method: 'POST',
        body: JSON.stringify({
          visitorId: this.visitorId,
          deviceId: this.deviceId,
          sessionId: this.sessionId,
          appId: this.config.appId,
          ...eventData
        })
      });

      this.log('Event tracked:', eventData);
    } catch (error) {
      this.log('Failed to track event:', error);
    }
  }

  /**
   * Send HTTP request to LeadPulse API
   */
  private async sendRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.config.apiEndpoint}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `LeadPulse-Mobile-SDK/${this.config.appId}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored visitor ID (platform-specific implementation needed)
   */
  protected async getStoredVisitorId(): Promise<string | null> {
    // This would be implemented differently for each platform:
    // - React Native: AsyncStorage
    // - iOS: NSUserDefaults or Keychain
    // - Android: SharedPreferences or Keystore
    // - Web/Hybrid: localStorage
    
    // Placeholder implementation
    return null;
  }

  /**
   * Store visitor ID (platform-specific implementation needed)
   */
  private async storeVisitorId(visitorId: string): Promise<void> {
    // Platform-specific storage implementation
  }

  /**
   * Get app install time (platform-specific implementation needed)
   */
  private async getAppInstallTime(): Promise<number> {
    // Platform-specific implementation to get app install timestamp
    return Date.now(); // Placeholder
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[LeadPulse Mobile]`, message, data);
    }
  }
}

/**
 * React Native specific implementation
 */
export class LeadPulseReactNative extends LeadPulseMobileTracker {
  constructor(config: { apiEndpoint: string; appId: string; debug?: boolean }) {
    super(config);
  }

  /**
   * Initialize with React Native specific device data
   */
  async initializeWithDeviceInfo(): Promise<void> {
    // This would use react-native-device-info package
    const deviceData: MobileVisitorData = {
      deviceId: await this.getDeviceId(),
      appId: this.config.appId,
      platform: 'react-native',
      appVersion: await this.getAppVersion(),
      deviceModel: await this.getDeviceModel(),
      osVersion: await this.getOSVersion(),
      locale: await this.getLocale(),
      timezone: await this.getTimezone(),
      screenSize: await this.getScreenSize(),
      pushToken: await this.getPushToken(),
      advertisingId: await this.getAdvertisingId()
    };

    await this.initialize(deviceData);
  }

  // React Native specific helper methods (would use actual RN libraries)
  private async getDeviceId(): Promise<string> {
    // Using react-native-device-info: DeviceInfo.getUniqueId()
    return `rn_${Math.random().toString(36).substr(2, 15)}`;
  }

  private async getAppVersion(): Promise<string> {
    // DeviceInfo.getVersion()
    return '1.0.0';
  }

  private async getDeviceModel(): Promise<string> {
    // DeviceInfo.getModel()
    return 'Unknown';
  }

  private async getOSVersion(): Promise<string> {
    // DeviceInfo.getSystemVersion()
    return 'Unknown';
  }

  private async getLocale(): Promise<string> {
    // DeviceInfo.getDeviceLocale()
    return 'en-US';
  }

  private async getTimezone(): Promise<string> {
    // DeviceInfo.getTimezone()
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  private async getScreenSize(): Promise<{ width: number; height: number }> {
    // Dimensions.get('screen')
    return { width: 375, height: 812 };
  }

  private async getPushToken(): Promise<string | undefined> {
    // Firebase messaging token
    return undefined;
  }

  private async getAdvertisingId(): Promise<string | undefined> {
    // IDFA (iOS) or GAID (Android)
    return undefined;
  }
}

/**
 * Web/Hybrid app implementation
 */
export class LeadPulseWebApp extends LeadPulseMobileTracker {
  constructor(config: { apiEndpoint: string; appId: string; debug?: boolean }) {
    super(config);
  }

  async initializeForWebApp(): Promise<void> {
    const deviceData: MobileVisitorData = {
      deviceId: this.generateWebDeviceId(),
      appId: this.config.appId,
      platform: 'hybrid',
      appVersion: this.getWebAppVersion(),
      deviceModel: navigator.userAgent,
      osVersion: navigator.platform,
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenSize: { width: screen.width, height: screen.height }
    };

    await this.initialize(deviceData);
  }

  private generateWebDeviceId(): string {
    // Create a persistent device ID for web/hybrid apps
    let deviceId = localStorage.getItem('leadpulse_device_id');
    if (!deviceId) {
      deviceId = `web_${Math.random().toString(36).substr(2, 15)}`;
      localStorage.setItem('leadpulse_device_id', deviceId);
    }
    return deviceId;
  }

  private getWebAppVersion(): string {
    return (window as any).APP_VERSION || '1.0.0';
  }

  protected async getStoredVisitorId(): Promise<string | null> {
    return localStorage.getItem('leadpulse_visitor_id');
  }

  protected async storeVisitorId(visitorId: string): Promise<void> {
    localStorage.setItem('leadpulse_visitor_id', visitorId);
  }
}

// Usage examples for GTBank:

/**
 * React Native Usage:
 * 
 * import { LeadPulseReactNative } from '@/lib/leadpulse/mobileSDK';
 * 
 * const tracker = new LeadPulseReactNative({
 *   apiEndpoint: 'https://marketsage.africa',
 *   appId: 'gtbank-mobile-app',
 *   debug: __DEV__
 * });
 * 
 * // Initialize in App.js
 * await tracker.initializeWithDeviceInfo();
 * 
 * // Track screen views
 * tracker.trackScreenView('AccountBalance', { accountType: 'savings' });
 * 
 * // Track interactions
 * tracker.trackInteraction('transfer_button', { amount: 10000 });
 * 
 * // Track conversions
 * tracker.trackConversion('money_transfer', 10000, { 
 *   fromAccount: 'savings', 
 *   toAccount: 'external' 
 * });
 */

/**
 * Native iOS Usage (Swift):
 * 
 * // Bridge to the mobile tracking API
 * func trackEvent(eventType: String, properties: [String: Any]) {
 *   let endpoint = "https://marketsage.africa/api/leadpulse/mobile/track"
 *   // ... HTTP request implementation
 * }
 */

/**
 * Native Android Usage (Kotlin):
 * 
 * // Bridge to the mobile tracking API
 * fun trackEvent(eventType: String, properties: Map<String, Any>) {
 *   val endpoint = "https://marketsage.africa/api/leadpulse/mobile/track"
 *   // ... HTTP request implementation
 * }
 */ 