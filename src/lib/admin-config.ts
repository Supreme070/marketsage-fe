/**
 * Admin Portal Configuration
 * Centralized configuration management for admin functionality
 */

export interface AdminConfig {
  enabled: boolean;
  staffEmails: string[];
  staffDomains: string[];
  sessionTimeout: number;
  twoFactorRequired: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
}

/**
 * Get admin configuration from environment variables
 */
export function getAdminConfig(): AdminConfig {
  // In development, default to enabled if not explicitly set
  const isEnabled = process.env.NODE_ENV === 'development' 
    ? process.env.ADMIN_ENABLED !== 'false' 
    : process.env.ADMIN_ENABLED === 'true';
  
  const staffEmails = process.env.ADMIN_STAFF_EMAILS?.split(',').map(email => email.trim()) || [
    'admin@marketsage.africa',
    'support@marketsage.africa',
    'supreme@marketsage.africa',
    'supreme', // Allow supreme user for testing
    'test@example.com', // Common test email
    'admin@test.com', // Another common test email
    'user@test.com' // Another test email
  ];
  
  const staffDomains = process.env.ADMIN_STAFF_DOMAINS?.split(',').map(domain => domain.trim()) || [
    'marketsage.africa'
  ];
  
  const sessionTimeout = Number.parseInt(process.env.ADMIN_SESSION_TIMEOUT || '1800'); // 30 minutes default
  const twoFactorRequired = process.env.ADMIN_2FA_REQUIRED === 'true';
  const ipWhitelistEnabled = process.env.ADMIN_IP_WHITELIST_ENABLED === 'true';
  
  const ipWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',').map(ip => ip.trim()) || [];

  return {
    enabled: isEnabled,
    staffEmails,
    staffDomains,
    sessionTimeout,
    twoFactorRequired,
    ipWhitelistEnabled,
    ipWhitelist
  };
}

/**
 * Check if an email is authorized for admin access
 */
export function isAuthorizedStaffEmail(email: string): boolean {
  if (!email) return false;
  
  const config = getAdminConfig();
  
  // Check direct email whitelist
  if (config.staffEmails.includes(email)) {
    return true;
  }
  
  // Check domain whitelist
  return config.staffDomains.some(domain => email.endsWith(`@${domain}`));
}

/**
 * Check if user has admin role
 */
export function hasAdminRole(role: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(role);
}

/**
 * Check if user is authorized admin staff
 */
export function isAuthorizedAdmin(email: string, role?: string): boolean {
  const config = getAdminConfig();
  
  // Special case for supreme user during development
  if (email === 'supreme' || email === 'supreme@marketsage.africa') {
    return true;
  }
  
  // In development mode, be more permissive
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_FALLBACK === 'true') {
    console.log('Admin Config: Development mode - allowing any user with admin role');
    if (role && hasAdminRole(role)) {
      return true;
    }
  }
  
  if (!config.enabled) {
    return false;
  }
  
  // Check email authorization
  const hasAuthorizedEmail = isAuthorizedStaffEmail(email);
  
  // Check role authorization if provided
  const hasAuthorizedRole = role ? hasAdminRole(role) : false;
  
  return hasAuthorizedEmail || hasAuthorizedRole;
}

/**
 * Get admin permissions based on role
 */
export interface AdminPermissions {
  canViewUsers: boolean;
  canManageSubscriptions: boolean;
  canAccessSystem: boolean;
  canManageStaff: boolean;
  canViewAudit: boolean;
  canAccessSecurity: boolean;
  canManageCampaigns: boolean;
  canViewAnalytics: boolean;
  canAccessAI: boolean;
  canAccessSupport: boolean;
  canManageIncidents: boolean;
}

export function getAdminPermissions(role?: string): AdminPermissions {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canViewUsers: true,
        canManageSubscriptions: true,
        canAccessSystem: true,
        canManageStaff: true,
        canViewAudit: true,
        canAccessSecurity: true,
        canManageCampaigns: true,
        canViewAnalytics: true,
        canAccessAI: true,
        canAccessSupport: true,
        canManageIncidents: true,
      };
    
    case 'IT_ADMIN':
      return {
        canViewUsers: true,
        canManageSubscriptions: false,
        canAccessSystem: true,
        canManageStaff: false,
        canViewAudit: true,
        canAccessSecurity: true,
        canManageCampaigns: false,
        canViewAnalytics: true,
        canAccessAI: true,
        canAccessSupport: true,
        canManageIncidents: true,
      };
    
    case 'ADMIN':
    default:
      return {
        canViewUsers: true,
        canManageSubscriptions: true,
        canAccessSystem: false,
        canManageStaff: false,
        canViewAudit: true,
        canAccessSecurity: false,
        canManageCampaigns: true,
        canViewAnalytics: true,
        canAccessAI: false,
        canAccessSupport: true,
        canManageIncidents: false,
      };
  }
}