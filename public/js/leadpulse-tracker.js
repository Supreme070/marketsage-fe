(function() {
  'use strict';
  
  // LeadPulse Tracking Script v2.1.0
  // This script tracks visitor behavior and sends data to LeadPulse Analytics
  
  class LeadPulseTracker {
    constructor(config = {}) {
      this.config = {
        apiEndpoint: config.apiEndpoint || window.location.origin + '/api/leadpulse',
        trackingId: config.trackingId || 'demo',
        debug: config.debug || false,
        trackClicks: config.trackClicks !== false,
        trackScroll: config.trackScroll !== false,
        trackForms: config.trackForms !== false,
        trackHeatmap: config.trackHeatmap !== false,
        sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutes
        heartbeatInterval: config.heartbeatInterval || 10000, // 10 seconds
        ...config
      };
      
      this.session = this.initializeSession();
      this.eventQueue = [];
      this.isTracking = false;
      this.heartbeatTimer = null;
      this.scrollDepth = 0;
      this.maxScrollDepth = 0;
      this.engagementScore = 0;
      this.interactions = 0;
      
      this.init();
    }
    
    // Initialize session
    initializeSession() {
      const stored = localStorage.getItem('leadpulse_session');
      let session = stored ? JSON.parse(stored) : null;
      
      // Check if session is expired
      if (session && (Date.now() - session.lastActivity) > this.config.sessionTimeout) {
        session = null;
      }
      
      if (!session) {
        session = {
          id: this.generateSessionId(),
          fingerprint: this.generateFingerprint(),
          startTime: Date.now(),
          lastActivity: Date.now(),
          pageViews: 0,
          clicks: 0,
          formInteractions: 0,
          timeOnSite: 0
        };
      }
      
      session.lastActivity = Date.now();
      localStorage.setItem('leadpulse_session', JSON.stringify(session));
      
      return session;
    }
    
    // Generate unique session ID
    generateSessionId() {
      return 'lp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Generate browser fingerprint
    generateFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('LeadPulse fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      return this.hashCode(fingerprint).toString();
    }
    
    // Simple hash function
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    }
    
    // Initialize tracking
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.startTracking());
      } else {
        this.startTracking();
      }
    }
    
    // Start tracking
    startTracking() {
      if (this.isTracking) return;
      
      this.isTracking = true;
      this.log('LeadPulse tracking started');
      
      // Track initial page view
      this.trackPageView();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Track session end on page unload
      window.addEventListener('beforeunload', () => this.endSession());
    }
    
    // Set up event listeners
    setupEventListeners() {
      // Click tracking
      if (this.config.trackClicks) {
        document.addEventListener('click', (e) => this.handleClick(e));
      }
      
      // Scroll tracking
      if (this.config.trackScroll) {
        window.addEventListener('scroll', this.throttle(() => this.handleScroll(), 250));
      }
      
      // Form tracking
      if (this.config.trackForms) {
        document.addEventListener('focus', (e) => this.handleFormFocus(e), true);
        document.addEventListener('blur', (e) => this.handleFormBlur(e), true);
        document.addEventListener('submit', (e) => this.handleFormSubmit(e));
      }
      
      // Heatmap tracking
      if (this.config.trackHeatmap) {
        document.addEventListener('mousemove', this.throttle((e) => this.handleMouseMove(e), 500));
      }
      
      // Visibility changes
      document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
    
    // Handle click events
    handleClick(event) {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const isImportant = ['a', 'button', 'input'].includes(tagName) || 
                         target.getAttribute('data-track') === 'true';
      
      this.session.clicks++;
      this.interactions++;
      this.engagementScore += isImportant ? 10 : 5;
      
      const clickData = {
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        element: {
          tagName: tagName,
          id: target.id || null,
          className: target.className || null,
          text: target.textContent?.slice(0, 100) || null,
          href: target.href || null
        },
        timestamp: Date.now()
      };
      
      this.trackEvent('click', clickData);
      
      // Track heatmap interaction
      if (this.config.trackHeatmap) {
        this.trackHeatmapInteraction(event.pageX, event.pageY, 'click');
      }
      
      this.log('Click tracked:', clickData);
    }
    
    // Handle scroll events
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const windowHeight = window.innerHeight;
      
      this.scrollDepth = Math.min(100, Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      ));
      
      if (this.scrollDepth > this.maxScrollDepth) {
        this.maxScrollDepth = this.scrollDepth;
        this.engagementScore += 1;
        
        // Track milestone scroll depths
        if ([25, 50, 75, 100].includes(this.scrollDepth)) {
          this.trackEvent('scroll_milestone', {
            depth: this.scrollDepth,
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Handle mouse movement for heatmap
    handleMouseMove(event) {
      if (!this.config.trackHeatmap) return;
      
      // Only track movements on important areas
      const target = event.target;
      const isImportantArea = target.tagName.toLowerCase() in ['a', 'button', 'input', 'form'] ||
                             target.closest('[data-track="true"]');
      
      if (isImportantArea) {
        this.trackHeatmapInteraction(event.pageX, event.pageY, 'hover');
      }
    }
    
    // Handle form interactions
    handleFormFocus(event) {
      if (event.target.tagName.toLowerCase() in ['input', 'textarea', 'select']) {
        this.session.formInteractions++;
        this.engagementScore += 15;
        
        this.trackEvent('form_focus', {
          element: {
            tagName: event.target.tagName.toLowerCase(),
            type: event.target.type || null,
            name: event.target.name || null,
            id: event.target.id || null
          },
          timestamp: Date.now()
        });
      }
    }
    
    handleFormSubmit(event) {
      this.engagementScore += 30;
      
      this.trackEvent('form_submit', {
        formId: event.target.id || null,
        formAction: event.target.action || null,
        timestamp: Date.now()
      });
    }
    
    // Handle visibility changes
    handleVisibilityChange() {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    }
    
    // Track page view
    trackPageView() {
      this.session.pageViews++;
      
      const pageData = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: screen.width,
          height: screen.height
        }
      };
      
      this.trackEvent('pageview', pageData);
      this.log('Page view tracked:', pageData);
    }
    
    // Track heatmap interaction
    trackHeatmapInteraction(x, y, type) {
      const percentX = (x / document.documentElement.scrollWidth) * 100;
      const percentY = (y / document.documentElement.scrollHeight) * 100;
      
      // Send to analytics API
      this.sendToAPI('analytics', {
        type: 'heatmap_interaction',
        data: {
          pageUrl: window.location.pathname,
          x: percentX,
          y: percentY,
          interactionType: type
        }
      });
    }
    
    // Generic event tracking
    trackEvent(eventType, data) {
      const event = {
        type: eventType,
        sessionId: this.session.id,
        fingerprint: this.session.fingerprint,
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        data: data
      };
      
      this.eventQueue.push(event);
      
      // Send events in batches
      if (this.eventQueue.length >= 5) {
        this.flushEvents();
      }
    }
    
    // Send events to server
    flushEvents() {
      if (this.eventQueue.length === 0) return;
      
      const events = [...this.eventQueue];
      this.eventQueue = [];
      
      this.sendToAPI('visitors', {
        fingerprint: this.session.fingerprint,
        event: events[events.length - 1], // Send latest event
        url: window.location.href,
        title: document.title,
        location: this.getLocation(),
        device: this.getDeviceInfo(),
        browser: this.getBrowserInfo()
      });
    }
    
    // Get user location (approximate)
    getLocation() {
      // In production, you might use IP geolocation
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    
    // Get device information
    getDeviceInfo() {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile ? 'Mobile' : 'Desktop';
    }
    
    // Get browser information
    getBrowserInfo() {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    }
    
    // Send data to API
    sendToAPI(endpoint, data) {
      const url = `${this.config.apiEndpoint}/${endpoint}`;
      
      if (navigator.sendBeacon) {
        // Use sendBeacon for better reliability
        navigator.sendBeacon(url, JSON.stringify(data));
      } else {
        // Fallback to fetch
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(error => {
          this.log('Error sending data:', error);
        });
      }
    }
    
    // Start heartbeat to keep session alive
    startHeartbeat() {
      this.heartbeatTimer = setInterval(() => {
        this.updateSession();
        this.flushEvents();
      }, this.config.heartbeatInterval);
    }
    
    // Update session data
    updateSession() {
      this.session.lastActivity = Date.now();
      this.session.timeOnSite = Date.now() - this.session.startTime;
      localStorage.setItem('leadpulse_session', JSON.stringify(this.session));
    }
    
    // Pause session (when tab becomes hidden)
    pauseSession() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }
    
    // Resume session (when tab becomes visible)
    resumeSession() {
      if (!this.heartbeatTimer) {
        this.startHeartbeat();
      }
    }
    
    // End session
    endSession() {
      this.flushEvents();
      
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
      }
      
      // Send final session data
      this.sendToAPI('visitors', {
        fingerprint: this.session.fingerprint,
        event: {
          type: 'session_end',
          sessionId: this.session.id,
          duration: Date.now() - this.session.startTime,
          pageViews: this.session.pageViews,
          clicks: this.session.clicks,
          formInteractions: this.session.formInteractions,
          maxScrollDepth: this.maxScrollDepth,
          engagementScore: Math.min(100, this.engagementScore),
          timestamp: Date.now()
        }
      });
      
      this.log('Session ended');
    }
    
    // Utility function for throttling
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
    
    // Debug logging
    log(...args) {
      if (this.config.debug) {
        console.log('[LeadPulse]', ...args);
      }
    }
    
    // Public API methods
    identify(userId, traits = {}) {
      this.session.userId = userId;
      this.session.traits = traits;
      this.updateSession();
      
      this.trackEvent('identify', { userId, traits });
    }
    
    track(eventName, properties = {}) {
      this.trackEvent('custom', { eventName, properties });
    }
    
    setProperty(key, value) {
      if (!this.session.properties) {
        this.session.properties = {};
      }
      this.session.properties[key] = value;
      this.updateSession();
    }
  }
  
  // Auto-initialize if config is provided
  if (window.leadpulseConfig) {
    window.LeadPulse = new LeadPulseTracker(window.leadpulseConfig);
  } else {
    // Export class for manual initialization
    window.LeadPulseTracker = LeadPulseTracker;
  }
  
})(); 