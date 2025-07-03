/**
 * Enhanced CORS configuration for MarketSage
 * Provides secure cross-origin resource sharing with environment-specific settings
 */

interface CorsConfig {
  origin: string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  optionsSuccessStatus: number;
  maxAge: number;
}

/**
 * Get CORS configuration based on environment
 */
export function getCorsConfig(): CorsConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Development CORS - more permissive for local development
  if (isDevelopment) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3030',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3030',
      // Add any additional local development origins
      ...(process.env.CORS_ORIGIN?.split(',') || [])
    ];

    return {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-tenant-id',
        'x-client-version',
        'x-api-key'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 3600 // 1 hour
    };
  }

  // Production CORS - restrictive and secure
  if (isProduction) {
    const allowedOrigins = [
      // Add your production domains here
      'https://marketsage.africa',
      'https://www.marketsage.africa',
      'https://app.marketsage.africa',
      // Add environment-specific origins
      ...(process.env.CORS_ORIGIN?.split(',') || [])
    ].filter(Boolean); // Remove empty strings

    return {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-tenant-id',
        'x-client-version'
      ],
      credentials: true,
      optionsSuccessStatus: 204,
      maxAge: 86400 // 24 hours
    };
  }

  // Test environment CORS
  return {
    origin: ['http://localhost:3000', 'http://localhost:3030'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-tenant-id'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 300 // 5 minutes
  };
}

/**
 * Validate if an origin is allowed
 * @param origin The origin to validate
 * @returns Whether the origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;

  const config = getCorsConfig();
  
  // If origin is boolean (true = allow all, false = allow none)
  if (typeof config.origin === 'boolean') {
    return config.origin;
  }

  // If origin is array, check if current origin is in the list
  return config.origin.includes(origin);
}

/**
 * Apply CORS headers to a Response
 * @param response The response to add headers to
 * @param origin The request origin
 * @returns Response with CORS headers
 */
export function applyCorsHeaders(response: Response, origin?: string): Response {
  const config = getCorsConfig();

  // Check if origin is allowed
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (config.origin === true) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', config.maxAge.toString());

  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Additional security headers
  response.headers.set('Vary', 'Origin');
  
  return response;
}

/**
 * Handle preflight OPTIONS requests
 * @param request The incoming request
 * @returns Response for preflight request
 */
export function handlePreflightRequest(request: Request): Response {
  const origin = request.headers.get('Origin');
  const config = getCorsConfig();

  // Check if origin is allowed
  if (!isOriginAllowed(origin || '')) {
    return new Response(null, { 
      status: 403,
      statusText: 'Forbidden - Origin not allowed'
    });
  }

  // Create preflight response
  const response = new Response(null, { 
    status: config.optionsSuccessStatus,
    statusText: 'OK'
  });

  // Apply CORS headers
  return applyCorsHeaders(response, origin || undefined);
}

/**
 * Security middleware for CORS validation
 * Use this in API routes to validate and apply CORS
 */
export function validateCors(request: Request): { isValid: boolean; error?: string } {
  const origin = request.headers.get('Origin');
  
  // For same-origin requests, no CORS validation needed
  if (!origin) {
    return { isValid: true };
  }

  // Check if origin is allowed
  if (!isOriginAllowed(origin)) {
    return { 
      isValid: false, 
      error: `Origin '${origin}' is not allowed by CORS policy` 
    };
  }

  return { isValid: true };
}