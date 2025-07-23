import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextRequest } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(req: NextRequest): string {
  // Check various headers for the real client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check for Vercel-specific header
  const vercelIP = req.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.trim();
  }

  // Check for Cloudflare IP
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  // Check for connecting IP
  const connectingIP = req.headers.get('x-connecting-ip');
  if (connectingIP) {
    return connectingIP.trim();
  }
  
  return 'unknown';
}
