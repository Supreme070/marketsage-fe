import { randomBytes } from 'crypto';

// Type for pending registration
interface PendingRegistration {
  email: string;
  name: string;
  pin: string;
  createdAt: Date;
  verified: boolean;
}

// In-memory store for pending registrations (replace with Redis in production)
const pendingRegistrations = new Map<string, PendingRegistration>();

// Generate a random registration ID
export function generateRegistrationId(): string {
  return randomBytes(32).toString('hex');
}

// Generate a 6-digit PIN
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store a pending registration
export function storePendingRegistration(
  registrationId: string,
  email: string,
  name: string,
  pin: string
): void {
  pendingRegistrations.set(registrationId, {
    email,
    name,
    pin,
    createdAt: new Date(),
    verified: false,
  });

  // Clean up after 10 minutes
  setTimeout(() => {
    pendingRegistrations.delete(registrationId);
  }, 10 * 60 * 1000);
}

// Verify PIN
export function verifyPin(registrationId: string, pin: string): boolean {
  const registration = pendingRegistrations.get(registrationId);
  if (!registration) return false;
  
  const isValid = registration.pin === pin;
  if (isValid) {
    registration.verified = true;
    pendingRegistrations.set(registrationId, registration);
  }
  
  return isValid;
}

// Get verified registration
export function getVerifiedRegistration(registrationId: string): PendingRegistration | null {
  const registration = pendingRegistrations.get(registrationId);
  if (!registration || !registration.verified) return null;
  return registration;
}

// Delete registration
export function deletePendingRegistration(registrationId: string): void {
  pendingRegistrations.delete(registrationId);
}

// Clean up expired registrations (older than 10 minutes)
setInterval(() => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  for (const [id, registration] of pendingRegistrations.entries()) {
    if (registration.createdAt < tenMinutesAgo) {
      pendingRegistrations.delete(id);
    }
  }
}, 60 * 1000); // Run every minute 