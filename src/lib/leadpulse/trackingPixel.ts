/**
 * LeadPulse Tracking Pixel Generator
 * 
 * This module creates the JavaScript tracking code that clients can embed
 * on their websites to track visitor behavior.
 */

/**
 * Generate the tracking script for a client website
 * 
 * @param pixelId - The unique identifier for this tracking instance
 * @param options - Configuration options
 * @returns JavaScript code as a string
 */
export function generateTrackingScript(
  pixelId: string, 
  options: {
    endpoint?: string;
    trackClicks?: boolean;
    trackForms?: boolean;
    trackScrollDepth?: boolean;
    trackExitIntent?: boolean;
    detectAdBlock?: boolean;
  } = {}
): string {
  // Set default options
  const config = {
    endpoint: options.endpoint || 'https://marketsage.africa/api/leadpulse/track',
    trackClicks: options.trackClicks ?? true,
    trackForms: options.trackForms ?? true,
    trackScrollDepth: options.trackScrollDepth ?? true,
    trackExitIntent: options.trackExitIntent ?? true,
    detectAdBlock: options.detectAdBlock ?? false
  };
  
  // Create the tracking script
  return `
(function(w, d, p) {
  // Don't initialize twice
  if (w.LeadPulse) return;
  
  // Configuration
  const pixelId = '${pixelId}';
  const endpoint = '${config.endpoint}';
  const config = ${JSON.stringify(config)};
  
  // Main LeadPulse object
  const lp = w.LeadPulse = {};
  let visitorId = null;
  let fingerprint = null;
  let sessionStartTime = Date.now();
  
  // Initialize storage
  function initStorage() {
    try {
      lp.storage = localStorage;
      // Test storage
      lp.storage.setItem('LP_TEST', '1');
      lp.storage.removeItem('LP_TEST');
    } catch (e) {
      // Fallback to cookie-based storage if localStorage is unavailable
      lp.storage = {
        getItem: function(key) {
          const matches = d.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'));
          return matches ? decodeURIComponent(matches[1]) : null;
        },
        setItem: function(key, value) {
          d.cookie = key + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
        }
      };
    }
    
    // Try to get existing visitor ID
    visitorId = lp.storage.getItem('LP_VID');
    fingerprint = lp.storage.getItem('LP_FP');
  }
  
  // Generate a fingerprint from browser data
  function generateFingerprint() {
    const fpData = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!w.sessionStorage,
      !!w.localStorage,
      !!w.indexedDB
    ].join('|||');
    
    return btoa(fpData).replace(/=/g, '');
  }
  
  // Send data to the endpoint
  function sendData(eventType, data = {}) {
    if (!visitorId) return;
    
    const payload = {
      pixelId,
      visitorId,
      fingerprint,
      eventType,
      url: w.location.href,
      referrer: d.referrer,
      title: d.title,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    // Add UTM parameters if present
    const urlParams = new URLSearchParams(w.location.search);
    const utmParams = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) utmParams[param] = value;
    });
    
    if (Object.keys(utmParams).length > 0) {
      payload.utm = utmParams;
    }
    
    // Send the data using a beacon if available, or fall back to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(() => {}); // Ignore errors
    }
    
    return payload;
  }
  
  // Initialize visitor tracking
  function initVisitor() {
    // If we don't have a fingerprint yet, create one
    if (!fingerprint) {
      fingerprint = generateFingerprint();
      lp.storage.setItem('LP_FP', fingerprint);
    }
    
    // Send identification request
    fetch(endpoint + '/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pixelId,
        fingerprint,
        existingId: visitorId || null,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenSize: screen.width + 'x' + screen.height,
        timezone: new Date().getTimezoneOffset(),
        referrer: d.referrer,
        url: w.location.href
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.visitorId) {
        visitorId = data.visitorId;
        lp.storage.setItem('LP_VID', visitorId);
        
        // Track page view
        sendData('pageview');
      }
    })
    .catch(() => {
      // If identification fails, generate a temporary ID
      if (!visitorId) {
        visitorId = 'tmp_' + Math.random().toString(36).substring(2, 15);
        lp.storage.setItem('LP_VID', visitorId);
        sendData('pageview');
      }
    });
  }
  
  // Initialize click tracking
  function initClickTracking() {
    if (!config.trackClicks) return;
    
    d.addEventListener('click', function(e) {
      const target = e.target as HTMLElement;
      let element = target;
      
      // Look for closest anchor or button
      while (element && element !== d.body) {
        if (element.tagName === 'A' || element.tagName === 'BUTTON' || 
            element.getAttribute('role') === 'button') {
          break;
        }
        element = element.parentElement as HTMLElement;
      }
      
      if (!element || element === d.body) return;
      
      // Get element data
      const data: Record<string, any> = {
        elementType: element.tagName.toLowerCase(),
        elementText: element.textContent?.trim().substring(0, 100) || ''
      };
      
      // If it's a link, capture the URL
      if (element.tagName === 'A') {
        const href = (element as HTMLAnchorElement).href;
        if (href) data.href = href;
      }
      
      // Capture element ID and classes
      if (element.id) data.id = element.id;
      if (element.className && typeof element.className === 'string') {
        data.classes = element.className.split(/\\s+/).join(' ');
      }
      
      // Send click event
      sendData('click', { element: data });
    });
  }
  
  // Track form interactions
  function initFormTracking() {
    if (!config.trackForms) return;
    
    // Find all forms on the page
    const forms = d.querySelectorAll('form');
    forms.forEach(form => {
      // Track form views
      if (isElementVisible(form)) {
        sendData('form_view', { formId: form.id || null });
      }
      
      // Track form field interactions
      const fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(field => {
        field.addEventListener('focus', () => {
          sendData('form_start', { 
            formId: form.id || null,
            fieldType: field.tagName.toLowerCase(),
            fieldName: (field as HTMLInputElement).name || null
          });
        });
      });
      
      // Track form submissions
      form.addEventListener('submit', () => {
        sendData('form_submit', { formId: form.id || null });
      });
    });
  }
  
  // Track scroll depth
  function initScrollTracking() {
    if (!config.trackScrollDepth) return;
    
    let maxScrollDepth = 0;
    let scrollReported = false;
    
    function calculateScrollDepth() {
      const scrollTop = w.pageYOffset || d.documentElement.scrollTop || d.body.scrollTop || 0;
      const documentHeight = Math.max(
        d.body.scrollHeight, 
        d.body.offsetHeight, 
        d.documentElement.clientHeight, 
        d.documentElement.scrollHeight, 
        d.documentElement.offsetHeight
      );
      const windowHeight = w.innerHeight || d.documentElement.clientHeight || d.body.clientHeight || 0;
      
      const scrollPercent = documentHeight > windowHeight
        ? Math.round((scrollTop / (documentHeight - windowHeight)) * 100)
        : 100;
        
      return Math.min(Math.max(scrollPercent, 0), 100);
    }
    
    // Update max scroll depth and report if needed
    function updateScrollDepth() {
      const currentDepth = calculateScrollDepth();
      
      // Update max scroll depth
      if (currentDepth > maxScrollDepth) {
        maxScrollDepth = currentDepth;
        
        // Report at 25%, 50%, 75%, and 100% thresholds
        const thresholds = [25, 50, 75, 90, 100];
        for (const threshold of thresholds) {
          if (maxScrollDepth >= threshold && !scrollReported) {
            sendData('scroll_depth', { depth: maxScrollDepth });
            scrollReported = true;
            break;
          }
        }
      }
    }
    
    // Add scroll event listener with debounce
    let scrollTimeout: ReturnType<typeof setTimeout>;
    w.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateScrollDepth, 100);
    });
    
    // Also report scroll depth when leaving the page
    w.addEventListener('beforeunload', () => {
      sendData('scroll_depth', { depth: maxScrollDepth });
    });
  }
  
  // Track exit intent
  function initExitIntentTracking() {
    if (!config.trackExitIntent) return;
    
    let exitIntentReported = false;
    
    function handleExitIntent(e: MouseEvent) {
      // Detect if the mouse is leaving the page from the top
      if (e.clientY <= 5 && !exitIntentReported) {
        exitIntentReported = true;
        sendData('exit_intent');
        
        // Remove the listener after first detection
        d.removeEventListener('mouseleave', handleExitIntent);
      }
    }
    
    d.addEventListener('mouseleave', handleExitIntent);
  }
  
  // Check if an element is visible in the viewport
  function isElementVisible(el: Element) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (w.innerHeight || d.documentElement.clientHeight) &&
      rect.right <= (w.innerWidth || d.documentElement.clientWidth)
    );
  }
  
  // Track time spent on page
  function initTimeTracking() {
    // Record time metrics when leaving the page
    w.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      sendData('time_spent', { seconds: timeSpent });
    });
    
    // Also track time for people who don't trigger beforeunload
    setInterval(() => {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      // Only send every 30 seconds to reduce data volume
      if (timeSpent % 30 === 0 && timeSpent > 0) {
        sendData('time_update', { seconds: timeSpent });
      }
    }, 5000);
  }
  
  // Public API methods
  lp.track = function(eventName: string, eventData = {}) {
    return sendData('custom', { event: eventName, ...eventData });
  };
  
  lp.identify = function(contactData = {}) {
    if (!visitorId) return null;
    
    return sendData('identify', { contact: contactData });
  };
  
  // Initialize the tracker
  function init() {
    initStorage();
    initVisitor();
    initClickTracking();
    initFormTracking();
    initScrollTracking();
    initExitIntentTracking();
    initTimeTracking();
  }
  
  // Initialize when the DOM is ready
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
  `.trim();
}

/**
 * Generate HTML snippet for embedding the tracking pixel
 * 
 * @param pixelId - The unique pixel identifier
 * @param options - Tracking options
 * @returns HTML code snippet as a string
 */
export function generateEmbedCode(pixelId: string, options = {}): string {
  return `
<!-- LeadPulse Tracking Code -->
<script>
${generateTrackingScript(pixelId, options)}
</script>
<!-- End LeadPulse Tracking Code -->
  `.trim();
}

/**
 * Create a QR code link for WhatsApp lead generation
 * 
 * @param whatsappNumber - WhatsApp phone number with country code
 * @param message - Pre-filled message (optional)
 * @param pixelId - LeadPulse tracking pixel ID (optional)
 * @returns WhatsApp link URL
 */
export function generateWhatsAppLink(
  whatsappNumber: string,
  message?: string,
  pixelId?: string
): string {
  // Clean and format the phone number
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  
  // Create the WhatsApp URL
  let url = `https://wa.me/${cleanNumber}`;
  
  // Add pre-filled message if provided
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  // If we have a pixel ID, create a tracking URL instead
  if (pixelId) {
    const trackingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://marketsage.africa'}/api/leadpulse/redirect?pixelId=${pixelId}&target=${encodeURIComponent(url)}`;
    return trackingUrl;
  }
  
  return url;
} 