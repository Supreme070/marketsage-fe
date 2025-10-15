/**
 * Password Validation Utility
 *
 * Client-side password strength validation for MarketSage
 * Enforces OWASP password security requirements
 *
 * @see PHASE_2_SECURITY_AUDIT.md - Task 37a
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  preventCommonPasswords: boolean;
}

/**
 * Default password requirements following OWASP guidelines
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  preventCommonPasswords: true,
};

/**
 * Common passwords to reject (top 100 most common)
 * In production, this should be expanded or use HaveIBeenPwned API
 */
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
  'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', 'superman',
  '123456789', 'password123', 'qwerty123', 'welcome', 'admin',
  'password1', '1234567890', 'football', 'princess', 'login',
]);

/**
 * Validates password strength against requirements
 *
 * @param password - The password to validate
 * @param requirements - Custom requirements (defaults to OWASP standards)
 * @returns Validation result with errors and strength score
 *
 * @example
 * ```typescript
 * const result = validatePassword('MySecureP@ss2024!');
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // 1. Length check (most important)
  if (!password || password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += 20;
    // Bonus points for extra length
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;
  }

  // 2. Uppercase letter
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (requirements.requireUppercase) {
    score += 15;
  }

  // 3. Lowercase letter
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (requirements.requireLowercase) {
    score += 15;
  }

  // 4. Number
  if (requirements.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (requirements.requireNumber) {
    score += 15;
  }

  // 5. Special character
  if (requirements.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>?/)');
  } else if (requirements.requireSpecialChar) {
    score += 15;
  }

  // 6. Common password check
  if (requirements.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push('This password is too common. Please choose a more unique password');
      score = Math.max(0, score - 30); // Penalty for common passwords
    }
  }

  // 7. Additional strength checks (bonus points)

  // Check for character variety
  const uniqueChars = new Set(password.split('')).size;
  if (uniqueChars >= 10) score += 10;

  // Check for multiple numbers
  const numberCount = (password.match(/\d/g) || []).length;
  if (numberCount >= 3) score += 5;

  // Check for multiple special characters
  const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (specialCount >= 3) score += 5;

  // 8. Sequential/repeated character penalty
  if (/(.)\1{2,}/.test(password)) {
    // Repeated characters (e.g., "aaa", "111")
    score = Math.max(0, score - 10);
  }

  if (/012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh/.test(password.toLowerCase())) {
    // Sequential characters (e.g., "123", "abc")
    score = Math.max(0, score - 10);
  }

  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, score));

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else if (score < 90) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Quick validation check (returns only boolean)
 *
 * @param password - The password to validate
 * @returns true if password meets all requirements
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}

/**
 * Get password strength label with color coding
 *
 * @param password - The password to evaluate
 * @returns Object with strength label and suggested color
 */
export function getPasswordStrength(password: string): {
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'emerald';
  score: number;
} {
  const result = validatePassword(password);

  const strengthMap = {
    'weak': { label: 'Weak', color: 'red' as const },
    'medium': { label: 'Medium', color: 'orange' as const },
    'strong': { label: 'Strong', color: 'yellow' as const },
    'very-strong': { label: 'Very Strong', color: 'emerald' as const },
  };

  return {
    ...strengthMap[result.strength],
    score: result.score,
  };
}

/**
 * Generate password requirements text for UI display
 *
 * @param requirements - Custom requirements (defaults to OWASP standards)
 * @returns Array of requirement strings for display
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const text: string[] = [];

  text.push(`At least ${requirements.minLength} characters long`);

  if (requirements.requireUppercase) {
    text.push('At least one uppercase letter (A-Z)');
  }

  if (requirements.requireLowercase) {
    text.push('At least one lowercase letter (a-z)');
  }

  if (requirements.requireNumber) {
    text.push('At least one number (0-9)');
  }

  if (requirements.requireSpecialChar) {
    text.push('At least one special character (!@#$%^&*...)');
  }

  if (requirements.preventCommonPasswords) {
    text.push('Not a commonly used password');
  }

  return text;
}

/**
 * Check if password contains user information (email, name, etc.)
 * This helps prevent passwords like "john@example.com123"
 *
 * @param password - The password to check
 * @param userInfo - Object containing user information to check against
 * @returns true if password contains user info, false otherwise
 */
export function containsUserInfo(
  password: string,
  userInfo: { email?: string; name?: string; username?: string }
): boolean {
  const lowerPassword = password.toLowerCase();

  // Check email (without domain)
  if (userInfo.email) {
    const emailPrefix = userInfo.email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 3 && lowerPassword.includes(emailPrefix)) {
      return true;
    }
  }

  // Check name (first/last)
  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 3 && lowerPassword.includes(part)) {
        return true;
      }
    }
  }

  // Check username
  if (userInfo.username) {
    const username = userInfo.username.toLowerCase();
    if (username.length >= 3 && lowerPassword.includes(username)) {
      return true;
    }
  }

  return false;
}

/**
 * Comprehensive password validation with user info check
 *
 * @param password - The password to validate
 * @param userInfo - Optional user information to check against
 * @param requirements - Custom requirements (defaults to OWASP standards)
 * @returns Validation result with errors and strength score
 */
export function validatePasswordWithUserInfo(
  password: string,
  userInfo?: { email?: string; name?: string; username?: string },
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const result = validatePassword(password, requirements);

  // Additional check: password shouldn't contain user info
  if (userInfo && containsUserInfo(password, userInfo)) {
    result.errors.push('Password should not contain your email, name, or username');
    result.isValid = false;
    result.score = Math.max(0, result.score - 20);

    // Downgrade strength
    if (result.strength === 'very-strong') result.strength = 'strong';
    else if (result.strength === 'strong') result.strength = 'medium';
    else if (result.strength === 'medium') result.strength = 'weak';
  }

  return result;
}
