'use client';

import * as Sentry from '@sentry/nextjs';

/**
 * User Interaction Tracker
 * Tracks clicks, navigation, and form interactions for Real User Monitoring
 *
 * VERIFIED: Created for Phase 1.2 - Frontend RUM
 * Integrates with Sentry for error correlation and analytics endpoint for storage
 */

interface InteractionEvent {
  type: 'click' | 'navigation' | 'form_submit' | 'form_abandon' | 'form_error';
  target: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class InteractionTracker {
  private events: InteractionEvent[] = [];
  private readonly maxEvents = 100;
  private sessionId: string;
  private isEnabled = true;

  constructor() {
    this.sessionId = this.generateSessionId();

    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  /**
   * Initialize all tracking listeners
   */
  private initializeTracking(): void {
    // Track all clicks
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Track navigation
    window.addEventListener('popstate', this.handleNavigation.bind(this));

    // Track form submissions
    document.addEventListener('submit', this.handleFormSubmit.bind(this), true);

    // Track page visibility for session end
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Send events before page unload
    window.addEventListener('beforeunload', this.flush.bind(this));
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const targetInfo = this.getElementInfo(target);

    // Only track meaningful clicks (buttons, links, interactive elements)
    if (['button', 'a', 'input'].includes(tagName) || target.onclick || target.closest('[role="button"]')) {
      this.recordEvent({
        type: 'click',
        target: targetInfo,
        timestamp: Date.now(),
        metadata: {
          x: event.clientX,
          y: event.clientY,
          page: window.location.pathname,
        },
      });

      // Add Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'ui.click',
        message: `Clicked: ${targetInfo}`,
        level: 'info',
        data: {
          target: targetInfo,
          page: window.location.pathname,
        },
      });
    }
  }

  /**
   * Handle navigation events
   */
  private handleNavigation(): void {
    if (!this.isEnabled) return;

    this.recordEvent({
      type: 'navigation',
      target: window.location.pathname,
      timestamp: Date.now(),
      metadata: {
        from: document.referrer,
        type: 'popstate',
      },
    });

    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to: ${window.location.pathname}`,
      level: 'info',
    });
  }

  /**
   * Handle form submissions
   */
  private handleFormSubmit(event: SubmitEvent): void {
    if (!this.isEnabled) return;

    const form = event.target as HTMLFormElement;
    const formInfo = this.getElementInfo(form);

    this.recordEvent({
      type: 'form_submit',
      target: formInfo,
      timestamp: Date.now(),
      metadata: {
        page: window.location.pathname,
        action: form.action,
        method: form.method,
      },
    });

    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: 'ui.form',
      message: `Form submitted: ${formInfo}`,
      level: 'info',
    });
  }

  /**
   * Handle page visibility changes (for session end tracking)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.flush();
    }
  }

  /**
   * Get element information for tracking
   */
  private getElementInfo(element: HTMLElement): string {
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ')[0]}` : '';
    const text = element.textContent?.trim().substring(0, 30) || '';
    const tagName = element.tagName.toLowerCase();

    return `${tagName}${id}${className} ${text ? `"${text}"` : ''}`.trim();
  }

  /**
   * Record an interaction event
   */
  private recordEvent(event: InteractionEvent): void {
    this.events.push(event);

    // Trim events if too many
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Flush if we have many events
    if (this.events.length >= 50) {
      this.flush();
    }
  }

  /**
   * Flush events to backend
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      const response = await fetch('/api/analytics/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events: eventsToSend,
          page: window.location.pathname,
          timestamp: Date.now(),
        }),
        keepalive: true,
      });

      if (!response.ok && process.env.NODE_ENV === 'development') {
        console.warn('Failed to send interaction events:', response.statusText);
      }
    } catch (error) {
      // Silently fail - don't disrupt user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to flush interaction events:', error);
      }
    }
  }

  /**
   * Track custom event
   */
  trackEvent(type: string, target: string, metadata?: Record<string, any>): void {
    this.recordEvent({
      type: type as any,
      target,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const interactionTracker = new InteractionTracker();

/**
 * Hook to manually track interactions in React components
 */
export function useInteractionTracking() {
  return {
    trackClick: (target: string, metadata?: Record<string, any>) =>
      interactionTracker.trackEvent('click', target, metadata),
    trackNavigation: (target: string, metadata?: Record<string, any>) =>
      interactionTracker.trackEvent('navigation', target, metadata),
    sessionId: interactionTracker.getSessionId(),
  };
}
