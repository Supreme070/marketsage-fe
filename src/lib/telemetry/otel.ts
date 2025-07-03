/**
 * OpenTelemetry Configuration for MarketSage
 * Sets up distributed tracing for monitoring and observability
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';

// Initialize OpenTelemetry only on server side and if enabled
let telemetryInitialized = false;

export function initializeTelemetry() {
  // Only initialize once and only on server side
  if (telemetryInitialized || typeof window !== 'undefined') {
    return;
  }

  try {
    // Create OTLP trace exporter
    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318/v1/traces',
      headers: {},
    });

    // Configure resource information
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: 'marketsage',
      [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    });

    // Initialize the SDK with basic instrumentations
    const sdk = new NodeSDK({
      resource,
      traceExporter,
    });

    // Start the SDK
    sdk.start();
    telemetryInitialized = true;
    
    console.log('OpenTelemetry tracing initialized successfully');
    console.log(`Exporting traces to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318/v1/traces'}`);

  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
  }
}

// Helper function to check if telemetry is enabled
export function isTelemetryEnabled(): boolean {
  return process.env.OTEL_ENABLED === 'true' || process.env.NODE_ENV === 'production';
}

// Initialize if enabled
if (isTelemetryEnabled()) {
  initializeTelemetry();
}