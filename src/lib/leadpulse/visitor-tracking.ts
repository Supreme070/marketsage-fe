/**
 * Multi-Layer Visitor Tracking System
 * Privacy-compliant visitor identification and session management
 */

import { v4 as uuidv4 } from 'uuid';

export interface TrackingConsent {
  essential: boolean;    // Always true - required for basic functionality
  analytics: boolean;    // User choice - enables enhanced tracking
  marketing: boolean;    // User choice - enables marketing attribution
}

export interface VisitorIdentity {
  visitorId: string;          // Primary identifier
  sessionId: string;          // Current session
  fingerprint: string;        // Device/browser fingerprint
  trackingMethod: 'cookie' | 'localStorage' | 'fingerprint';
  consentLevel: TrackingConsent;
  isReturning: boolean;
  createdAt: Date;
  lastSeen: Date;
}

export interface DeviceFingerprint {
  screen: string;             // Screen resolution + color depth
  browser: string;            // Browser type + version
  timezone: string;           // Timezone offset
  language: string;           // Browser language
  platform: string;          // Operating system
  hardwareId: string;        // Canvas/WebGL signature
  plugins: string[];         // Installed plugins
  touchSupport: boolean;     // Touch device detection
}

class VisitorTracker {
  private visitorId: string | null = null;
  private sessionId: string | null = null;
  private fingerprint: string | null = null;
  private consent: TrackingConsent = {
    essential: true,
    analytics: false,
    marketing: false
  };

  constructor() {
    this.initializeTracking();
  }

  /**
   * Initialize tracking based on available consent and storage
   */
  private async initializeTracking(): Promise<void> {
    // 1. Check for existing consent
    this.loadConsent();
    
    // 2. Generate device fingerprint (always allowed for essential functionality)
    this.fingerprint = await this.generateDeviceFingerprint();
    
    // 3. Try to restore visitor identity using available methods
    await this.restoreVisitorIdentity();
    
    // 4. Create new visitor if no existing identity found
    if (!this.visitorId) {
      this.createNewVisitor();
    }
    
    // 5. Always create new session
    this.createNewSession();
  }

  /**
   * Generate device fingerprint for visitor identification
   */
  private async generateDeviceFingerprint(): Promise<string> {
    const fingerprint: DeviceFingerprint = {
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      browser: this.getBrowserInfo(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareId: await this.getCanvasFingerprint(),
      plugins: Array.from(navigator.plugins).map(p => p.name).sort(),
      touchSupport: 'ontouchstart' in window
    };

    // Create hash from fingerprint components
    const fingerprintString = JSON.stringify(fingerprint);
    return this.hashString(fingerprintString);
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return browser;
  }

  /**
   * Generate canvas fingerprint for hardware identification
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      // Draw unique pattern
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('LeadPulse Tracking 🚀', 2, 2);
      
      // Add gradient
      const gradient = ctx.createLinearGradient(0, 0, 100, 0);
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 10, 100, 20);
      
      return this.hashString(canvas.toDataURL());
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Hash string using simple hash algorithm
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Try to restore visitor identity from available storage
   */
  private async restoreVisitorIdentity(): Promise<void> {
    // Method 1: First-party cookies (if analytics consent given)
    if (this.consent.analytics) {
      const cookieVisitorId = this.getCookie('leadpulse_visitor_id');
      if (cookieVisitorId) {
        this.visitorId = cookieVisitorId;
        return;
      }
    }

    // Method 2: localStorage (if analytics consent given)
    if (this.consent.analytics && typeof localStorage !== 'undefined') {
      const storedVisitorId = localStorage.getItem('leadpulse_visitor_id');
      if (storedVisitorId) {
        this.visitorId = storedVisitorId;
        // Also set cookie for cross-session persistence
        this.setCookie('leadpulse_visitor_id', storedVisitorId, 365);
        return;
      }
    }

    // Method 3: Check if we've seen this fingerprint before (server lookup)
    if (this.fingerprint) {
      try {
        const response = await fetch('/api/v2/leadpulse/visitor-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: this.fingerprint })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.visitorId) {
            this.visitorId = data.visitorId;
            // Store for future sessions if consent allows
            if (this.consent.analytics) {
              this.setCookie('leadpulse_visitor_id', this.visitorId, 365);
              localStorage.setItem('leadpulse_visitor_id', this.visitorId);
            }
          }
        }
      } catch (error) {
        console.log('Visitor lookup failed:', error);
      }
    }
  }

  /**
   * Create new visitor identity
   */
  private createNewVisitor(): void {
    this.visitorId = `visitor_${uuidv4()}`;
    
    // Store using available methods based on consent
    if (this.consent.analytics) {
      this.setCookie('leadpulse_visitor_id', this.visitorId, 365);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('leadpulse_visitor_id', this.visitorId);
      }
    }
  }

  /**
   * Create new session
   */
  private createNewSession(): void {
    this.sessionId = `session_${uuidv4()}`;
    
    // Session storage is always allowed (essential functionality)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('leadpulse_session_id', this.sessionId);
    }
  }

  /**
   * Update consent preferences
   */
  public updateConsent(consent: Partial<TrackingConsent>): void {
    this.consent = { ...this.consent, ...consent };
    this.saveConsent();
    
    // If analytics consent was just granted, upgrade tracking
    if (consent.analytics && this.visitorId) {
      this.setCookie('leadpulse_visitor_id', this.visitorId, 365);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('leadpulse_visitor_id', this.visitorId);
      }
    }
    
    // If consent was revoked, clean up
    if (consent.analytics === false) {
      this.deleteCookie('leadpulse_visitor_id');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('leadpulse_visitor_id');
      }
    }
  }

  /**
   * Get current visitor identity
   */
  public getVisitorIdentity(): VisitorIdentity {
    return {
      visitorId: this.visitorId || `temp_${this.fingerprint}`,
      sessionId: this.sessionId || 'no-session',
      fingerprint: this.fingerprint || 'no-fingerprint',
      trackingMethod: this.getTrackingMethod(),
      consentLevel: this.consent,
      isReturning: this.isReturningVisitor(),
      createdAt: new Date(),
      lastSeen: new Date()
    };
  }

  /**
   * Determine which tracking method is being used
   */
  private getTrackingMethod(): 'cookie' | 'localStorage' | 'fingerprint' {
    if (this.consent.analytics) {
      if (this.getCookie('leadpulse_visitor_id')) return 'cookie';
      if (typeof localStorage !== 'undefined' && localStorage.getItem('leadpulse_visitor_id')) {
        return 'localStorage';
      }
    }
    return 'fingerprint';
  }

  /**
   * Check if this is a returning visitor
   */
  private isReturningVisitor(): boolean {
    if (this.consent.analytics) {
      return !!(this.getCookie('leadpulse_visitor_id') || 
                (typeof localStorage !== 'undefined' && localStorage.getItem('leadpulse_visitor_id')));
    }
    return false; // Can't reliably determine without persistent storage
  }

  /**
   * Track pageview event
   */
  public async trackPageview(url: string, title?: string, metadata?: any): Promise<void> {
    const identity = this.getVisitorIdentity();
    
    try {
      await fetch('/api/v2/leadpulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: identity.visitorId,
          type: 'PAGEVIEW',
          url,
          title,
          metadata: {
            sessionId: identity.sessionId,
            trackingMethod: identity.trackingMethod,
            consentLevel: identity.consentLevel,
            isReturning: identity.isReturning,
            ...metadata
          },
          device: this.getBrowserInfo(),
          browser: this.getBrowserInfo(),
          os: navigator.platform
        })
      });
    } catch (error) {
      console.error('Failed to track pageview:', error);
    }
  }

  /**
   * Track custom event
   */
  public async trackEvent(type: string, url: string, metadata?: any): Promise<void> {
    const identity = this.getVisitorIdentity();
    
    try {
      await fetch('/api/v2/leadpulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: identity.visitorId,
          type,
          url,
          metadata: {
            sessionId: identity.sessionId,
            trackingMethod: identity.trackingMethod,
            ...metadata
          },
          device: this.getBrowserInfo(),
          browser: this.getBrowserInfo(),
          os: navigator.platform
        })
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Cookie utility methods
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
  }

  // Consent management
  private loadConsent(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('leadpulse_consent');
      if (stored) {
        try {
          this.consent = { ...this.consent, ...JSON.parse(stored) };
        } catch (error) {
          console.error('Failed to parse stored consent:', error);
        }
      }
    }
  }

  private saveConsent(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('leadpulse_consent', JSON.stringify(this.consent));
    }
  }
}

// Export singleton instance
export const visitorTracker = new VisitorTracker();
export default visitorTracker;