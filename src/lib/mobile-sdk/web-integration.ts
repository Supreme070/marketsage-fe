/**
 * Web Integration for LeadPulse Mobile SDK
 * ======================================
 * Specialized implementation for mobile web applications and PWAs
 */

import { LeadPulseMobileSDK, MobileSDKConfig, createMobileSDK } from './leadpulse-mobile-sdk';

/**
 * Progressive Web App (PWA) Integration
 */
export class PWAIntegration {
  private sdk: LeadPulseMobileSDK | null = null;
  private isInstalled = false;
  private installPromptEvent: any = null;

  constructor(sdk: LeadPulseMobileSDK) {
    this.sdk = sdk;
    this.setupPWAListeners();
  }

  /**
   * Setup PWA-specific event listeners
   */
  private setupPWAListeners(): void {
    // Track PWA installation prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      
      if (this.sdk) {
        this.sdk.trackCustomEvent('pwa_install_prompt_shown', window.location.pathname);
      }
    });

    // Track PWA installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      
      if (this.sdk) {
        this.sdk.trackCustomEvent('pwa_installed', window.location.pathname);
      }
    });

    // Track standalone mode (when PWA is opened as app)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      
      if (this.sdk) {
        this.sdk.trackCustomEvent('pwa_opened_standalone', window.location.pathname);
      }
    }
  }

  /**
   * Trigger PWA installation prompt
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }

    try {
      this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;
      
      if (this.sdk) {
        this.sdk.trackCustomEvent('pwa_install_prompt_result', window.location.pathname, choiceResult.outcome);
      }

      if (choiceResult.outcome === 'accepted') {
        this.installPromptEvent = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }

  /**
   * Check if PWA is installable
   */
  isInstallable(): boolean {
    return !!this.installPromptEvent;
  }

  /**
   * Check if PWA is installed
   */
  isPWAInstalled(): boolean {
    return this.isInstalled;
  }
}

/**
 * Mobile Web Performance Monitor
 */
export class MobileWebPerformanceMonitor {
  private sdk: LeadPulseMobileSDK | null = null;
  private observer: PerformanceObserver | null = null;

  constructor(sdk: LeadPulseMobileSDK) {
    this.sdk = sdk;
    this.setupPerformanceMonitoring();
  }

  /**
   * Setup performance monitoring for mobile web
   */
  private setupPerformanceMonitoring(): void {
    // Monitor navigation timing
    this.trackNavigationTiming();

    // Monitor resource loading
    this.trackResourceTiming();

    // Monitor largest contentful paint
    this.trackLCP();

    // Monitor first input delay
    this.trackFID();

    // Monitor cumulative layout shift
    this.trackCLS();

    // Monitor network information
    this.trackNetworkChanges();
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (this.sdk && navigation) {
          // DNS lookup time
          this.sdk.trackPerformance(
            'api_call',
            navigation.domainLookupEnd - navigation.domainLookupStart,
            'ms',
            { type: 'dns_lookup' }
          );

          // TCP connection time
          this.sdk.trackPerformance(
            'api_call',
            navigation.connectEnd - navigation.connectStart,
            'ms',
            { type: 'tcp_connection' }
          );

          // Time to first byte
          this.sdk.trackPerformance(
            'api_call',
            navigation.responseStart - navigation.requestStart,
            'ms',
            { type: 'ttfb' }
          );

          // DOM content loaded
          this.sdk.trackPerformance(
            'screen_load',
            navigation.domContentLoadedEventEnd - navigation.navigationStart,
            'ms',
            { type: 'dom_content_loaded' }
          );

          // Full page load
          this.sdk.trackPerformance(
            'screen_load',
            navigation.loadEventEnd - navigation.navigationStart,
            'ms',
            { type: 'full_page_load' }
          );
        }
      }, 0);
    });
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Track slow loading resources (>1s)
          if (resource.duration > 1000 && this.sdk) {
            this.sdk.trackPerformance(
              'api_call',
              resource.duration,
              'ms',
              {
                type: 'slow_resource',
                resource: resource.name,
                size: resource.transferSize || 0
              }
            );
          }
        }
      });
      
      this.observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  private trackLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (this.sdk && lastEntry) {
          this.sdk.trackPerformance(
            'screen_load',
            lastEntry.startTime,
            'ms',
            { type: 'lcp' }
          );
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  /**
   * Track First Input Delay (FID)
   */
  private trackFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (this.sdk) {
            this.sdk.trackPerformance(
              'app_startup',
              (entry as any).processingStart - entry.startTime,
              'ms',
              { type: 'fid' }
            );
          }
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  private trackCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (this.sdk && clsValue > 0) {
          this.sdk.trackPerformance(
            'screen_load',
            clsValue,
            'score',
            { type: 'cls' }
          );
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Track network changes
   */
  private trackNetworkChanges(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Track initial connection
      if (this.sdk) {
        this.sdk.trackCustomEvent('network_info', window.location.pathname, connection.effectiveType, {
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }

      // Track connection changes
      connection.addEventListener('change', () => {
        if (this.sdk) {
          this.sdk.trackCustomEvent('network_change', window.location.pathname, connection.effectiveType, {
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          });
        }
      });
    }
  }

  /**
   * Cleanup performance monitoring
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Mobile Web Gesture Tracker
 */
export class MobileGestureTracker {
  private sdk: LeadPulseMobileSDK | null = null;
  private touchStartTime = 0;
  private touchStartPosition: { x: number; y: number } | null = null;

  constructor(sdk: LeadPulseMobileSDK) {
    this.sdk = sdk;
    this.setupGestureTracking();
  }

  /**
   * Setup gesture tracking for mobile web
   */
  private setupGestureTracking(): void {
    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });

    // Orientation change
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));

    // Device motion (if permission granted)
    this.requestMotionPermission();
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchStartPosition || !this.sdk) return;

    const touchDuration = Date.now() - this.touchStartTime;
    const touchEndPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };

    const distance = Math.sqrt(
      Math.pow(touchEndPosition.x - this.touchStartPosition.x, 2) +
      Math.pow(touchEndPosition.y - this.touchStartPosition.y, 2)
    );

    // Determine gesture type
    let gestureType = 'tap';
    if (touchDuration > 500) {
      gestureType = 'long_press';
    } else if (distance > 50) {
      gestureType = 'swipe';
    }

    // Track gesture
    this.sdk.trackUserAction(
      'custom' as any,
      window.location.pathname,
      gestureType,
      touchDuration,
      this.touchStartPosition
    );
  }

  /**
   * Handle touch move (for swipe detection)
   */
  private handleTouchMove(event: TouchEvent): void {
    // Track scroll behavior
    if (this.sdk) {
      this.sdk.trackCustomEvent('scroll', window.location.pathname, window.scrollY, {
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        scrollPercentage: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      });
    }
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    setTimeout(() => {
      if (this.sdk) {
        this.sdk.trackCustomEvent('orientation_change', window.location.pathname, screen.orientation?.angle || 0, {
          orientation: screen.orientation?.type || 'unknown',
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    }, 100); // Small delay to ensure new dimensions are available
  }

  /**
   * Request device motion permission
   */
  private async requestMotionPermission(): Promise<void> {
    if ('DeviceMotionEvent' in window && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          this.setupMotionTracking();
        }
      } catch (error) {
        console.log('Device motion permission denied');
      }
    } else if ('DeviceMotionEvent' in window) {
      // Android devices don't require permission
      this.setupMotionTracking();
    }
  }

  /**
   * Setup device motion tracking
   */
  private setupMotionTracking(): void {
    let lastShakeTime = 0;
    
    window.addEventListener('devicemotion', (event) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // Detect shake gesture (threshold of 15)
      if (totalAcceleration > 15) {
        const now = Date.now();
        if (now - lastShakeTime > 1000) { // Debounce shakes
          lastShakeTime = now;
          
          if (this.sdk) {
            this.sdk.trackCustomEvent('device_shake', window.location.pathname, totalAcceleration);
          }
        }
      }
    });
  }
}

/**
 * Mobile Web SDK Factory
 */
export function createMobileWebSDK(config: Omit<MobileSDKConfig, 'baseUrl'> & { baseUrl?: string }): {
  sdk: LeadPulseMobileSDK;
  pwa: PWAIntegration;
  performance: MobileWebPerformanceMonitor;
  gestures: MobileGestureTracker;
} {
  const fullConfig: MobileSDKConfig = {
    baseUrl: config.baseUrl || window.location.origin,
    ...config
  };

  const sdk = createMobileSDK(fullConfig);
  const pwa = new PWAIntegration(sdk);
  const performance = new MobileWebPerformanceMonitor(sdk);
  const gestures = new MobileGestureTracker(sdk);

  return {
    sdk,
    pwa,
    performance,
    gestures
  };
}

/**
 * Auto-initialization for mobile web
 */
export function autoInitMobileWebSDK(apiKey: string, options: Partial<MobileSDKConfig> = {}) {
  const config: MobileSDKConfig = {
    apiKey,
    baseUrl: window.location.origin,
    appName: document.title || 'Unknown App',
    appVersion: '1.0.0',
    environment: 'production',
    enableDebugLogs: false,
    enableOfflineMode: true,
    batchSize: 50,
    flushInterval: 30000,
    sessionTimeout: 300000,
    enableCrashReporting: true,
    enablePerformanceMonitoring: true,
    enableUserJourneyTracking: true,
    privacySettings: {
      collectDeviceInfo: true,
      collectLocationData: false,
      collectCrashLogs: true,
      collectPerformanceMetrics: true
    },
    ...options
  };

  const { sdk, pwa, performance, gestures } = createMobileWebSDK(config);
  
  // Auto-initialize
  sdk.initialize().catch(console.error);

  // Auto-track page views
  let currentPath = window.location.pathname;
  
  // Track initial page view
  sdk.trackScreen(currentPath);

  // Track subsequent page views (for SPAs)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      sdk.trackScreen(currentPath);
    }
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      sdk.trackScreen(currentPath);
    }
  };

  window.addEventListener('popstate', () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      sdk.trackScreen(currentPath);
    }
  });

  return { sdk, pwa, performance, gestures };
}

export default {
  PWAIntegration,
  MobileWebPerformanceMonitor,
  MobileGestureTracker,
  createMobileWebSDK,
  autoInitMobileWebSDK
};