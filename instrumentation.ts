/**
 * Next.js Instrumentation Hook
 * This file is automatically loaded by Next.js to set up OpenTelemetry
 */

export async function register() {
  // Only initialize on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeTelemetry, isTelemetryEnabled } = await import('./src/lib/telemetry/otel');
    
    if (isTelemetryEnabled()) {
      initializeTelemetry();
    }
  }
}