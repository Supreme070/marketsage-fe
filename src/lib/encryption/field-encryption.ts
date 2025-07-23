import * as crypto from 'crypto';

// Environment variables for encryption
const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || 'build-time-placeholder-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Only throw error in production if key is missing
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('FIELD_ENCRYPTION_KEY environment variable is required for encryption in production');
}

/**
 * Field-level encryption utility for sensitive customer data
 * Encrypts PII fields like emails, phone numbers, and addresses
 */
class FieldEncryption {
  private masterKey: string;

  constructor() {
    this.masterKey = ENCRYPTION_KEY!;
  }

  /**
   * Derive a cryptographic key from the master key using PBKDF2
   * @param salt Random salt for key derivation
   * @returns Derived key buffer
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(this.masterKey, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
  }

  /**
   * Encrypt a string value
   * @param text Plain text to encrypt
   * @returns Encrypted string with format: salt:iv:authTag:encryptedData
   */
  encrypt(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);
      
      // Create cipher with derived key and IV
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Add additional authenticated data
      const aad = Buffer.from('marketsage-pii-v2', 'utf8');
      cipher.setAAD(aad);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Return format: salt:iv:authTag:encryptedData
      return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   * @param encryptedText Encrypted string with format: salt:iv:authTag:encryptedData
   * @returns Decrypted plain text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }

    // Check if text is encrypted (contains colons)
    if (!encryptedText.includes(':')) {
      return encryptedText; // Return as-is if not encrypted
    }

    try {
      const parts = encryptedText.split(':');
      
      // Handle both old format (3 parts) and new format (4 parts)
      if (parts.length === 3) {
        // Legacy format: iv:authTag:encryptedData
        return this.decryptLegacy(encryptedText);
      } else if (parts.length !== 4) {
        return encryptedText; // Return original if format is wrong
      }

      const [saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Derive key from master key and salt
      const key = this.deriveKey(salt);

      // Create decipher with derived key and IV
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      
      // Set additional authenticated data
      const aad = Buffer.from('marketsage-pii-v2', 'utf8');
      decipher.setAAD(aad);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Decrypt legacy encrypted data (backward compatibility)
   * @param encryptedText Legacy encrypted string with format: iv:authTag:encryptedData
   * @returns Decrypted plain text
   */
  private decryptLegacy(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      // Use old key derivation method for legacy data
      const legacyKey = Buffer.alloc(32);
      Buffer.from(this.masterKey, 'utf8').copy(legacyKey);

      const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
      decipher.setAAD(Buffer.from('marketsage-pii', 'utf8'));
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Legacy decryption error:', error);
      throw new Error('Failed to decrypt legacy data');
    }
  }

  /**
   * Encrypt an object's PII fields
   * @param data Object containing potentially sensitive fields
   * @returns Object with encrypted PII fields
   */
  encryptPIIFields(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'email', 'phone', 'phoneNumber', 'address', 'firstName', 'lastName',
      'company', 'jobTitle', 'notes', 'tags'
    ];

    const encrypted = { ...data };

    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt an object's PII fields
   * @param data Object containing encrypted PII fields
   * @returns Object with decrypted PII fields
   */
  decryptPIIFields(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'email', 'phone', 'phoneNumber', 'address', 'firstName', 'lastName',
      'company', 'jobTitle', 'notes', 'tags'
    ];

    const decrypted = { ...data };

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }

    return decrypted;
  }

  /**
   * Hash a field for searching while maintaining privacy
   * @param text Text to hash
   * @returns SHA-256 hash for searching
   */
  hashForSearch(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    return crypto
      .createHash('sha256')
      .update(text.toLowerCase())
      .digest('hex');
  }
}

// Export singleton instance
export const fieldEncryption = new FieldEncryption();

// Helper functions for common operations
export const encryptEmail = (email: string): string => fieldEncryption.encrypt(email);
export const decryptEmail = (encryptedEmail: string): string => fieldEncryption.decrypt(encryptedEmail);
export const encryptPhone = (phone: string): string => fieldEncryption.encrypt(phone);
export const decryptPhone = (encryptedPhone: string): string => fieldEncryption.decrypt(encryptedPhone);
export const hashEmailForSearch = (email: string): string => fieldEncryption.hashForSearch(email);

// Export functions expected by social media service
export const encryptField = (text: string): string => fieldEncryption.encrypt(text);
export const decryptField = (encryptedText: string): string => fieldEncryption.decrypt(encryptedText);