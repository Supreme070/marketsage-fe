/**
 * LeadPulse Mobile SDK - Main Export
 * ================================
 * Complete mobile analytics and tracking solution for React Native and mobile web
 */

// Core SDK
export {
  LeadPulseMobileSDK,
  createMobileSDK,
  type MobileSDKConfig,
  type AppLifecycleEvent,
  type MobileUserAction,
  type MobileSession,
  type PerformanceMetric
} from './leadpulse-mobile-sdk';

// React Native Integration
export {
  useLeadPulseSDK,
  withScreenTracking,
  NavigationTracker,
  ReactNativePerformanceMonitor,
  ReactNativeCrashReporter,
  UserJourneyTracker,
  type ReactNativeConfig
} from './react-native-integration';

// Mobile Web Integration
export {
  PWAIntegration,
  MobileWebPerformanceMonitor,
  MobileGestureTracker,
  createMobileWebSDK,
  autoInitMobileWebSDK
} from './web-integration';

/**
 * Quick Start Guide
 * ================
 * 
 * ## React Native
 * ```tsx
 * import { useLeadPulseSDK } from '@/lib/mobile-sdk';
 * 
 * function App() {
 *   const { trackScreen, trackButton, setUserId } = useLeadPulseSDK({
 *     apiKey: 'your-api-key',
 *     appName: 'YourApp',
 *     appVersion: '1.0.0',
 *     environment: 'production'
 *   });
 * 
 *   useEffect(() => {
 *     trackScreen('HomeScreen');
 *   }, []);
 * 
 *   return (
 *     <Button onPress={() => trackButton('login_button', 'HomeScreen')}>
 *       Login
 *     </Button>
 *   );
 * }
 * ```
 * 
 * ## Mobile Web / PWA
 * ```javascript
 * import { autoInitMobileWebSDK } from '@/lib/mobile-sdk';
 * 
 * // Auto-initialize with page view tracking
 * const { sdk, pwa, performance, gestures } = autoInitMobileWebSDK('your-api-key', {
 *   appName: 'YourPWA',
 *   appVersion: '1.0.0',
 *   enablePerformanceMonitoring: true
 * });
 * 
 * // Manual tracking
 * sdk.trackButton('cta_button', 'landing_page');
 * sdk.trackPurchase(99.99, 'USD', 'product_123', 'checkout_page');
 * 
 * // PWA features
 * if (pwa.isInstallable()) {
 *   await pwa.promptInstall();
 * }
 * ```
 * 
 * ## Advanced Usage
 * ```javascript
 * import { createMobileSDK, NavigationTracker, UserJourneyTracker } from '@/lib/mobile-sdk';
 * 
 * const sdk = createMobileSDK({
 *   apiKey: 'your-api-key',
 *   appName: 'YourApp',
 *   appVersion: '1.0.0',
 *   environment: 'production',
 *   enableCrashReporting: true,
 *   enablePerformanceMonitoring: true,
 *   enableUserJourneyTracking: true,
 *   privacySettings: {
 *     collectDeviceInfo: true,
 *     collectLocationData: false,
 *     collectCrashLogs: true,
 *     collectPerformanceMetrics: true
 *   }
 * });
 * 
 * await sdk.initialize();
 * 
 * // Navigation tracking
 * const navigationTracker = new NavigationTracker(sdk);
 * await navigationTracker.onNavigateToScreen('ProductScreen', { productId: '123' });
 * 
 * // User journey tracking
 * const journeyTracker = new UserJourneyTracker(sdk);
 * await journeyTracker.trackStep('view_product', { productId: '123' });
 * await journeyTracker.trackStep('add_to_cart', { productId: '123', quantity: 1 });
 * await journeyTracker.completeJourney('purchase_flow', 'success');
 * ```
 */

// Default configuration for African fintech context
export const AFRICAN_FINTECH_CONFIG: Partial<MobileSDKConfig> = {
  enableDebugLogs: false,
  enableOfflineMode: true, // Important for areas with poor connectivity
  batchSize: 25, // Smaller batches for slower networks
  flushInterval: 60000, // 1 minute - longer interval for data conservation
  sessionTimeout: 600000, // 10 minutes - longer for mobile banking sessions
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableUserJourneyTracking: true,
  privacySettings: {
    collectDeviceInfo: true,
    collectLocationData: false, // Respect privacy
    collectCrashLogs: true,
    collectPerformanceMetrics: true
  }
};

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    enableDebugLogs: true,
    flushInterval: 10000, // 10 seconds for faster feedback
    batchSize: 10
  },
  staging: {
    enableDebugLogs: true,
    flushInterval: 30000,
    batchSize: 25
  },
  production: {
    enableDebugLogs: false,
    flushInterval: 60000,
    batchSize: 50
  }
};

/**
 * Create SDK with African fintech optimizations
 */
export function createAfricanFintechSDK(config: Omit<MobileSDKConfig, keyof typeof AFRICAN_FINTECH_CONFIG>) {
  const optimizedConfig: MobileSDKConfig = {
    ...AFRICAN_FINTECH_CONFIG,
    ...config,
    ...ENVIRONMENT_CONFIGS[config.environment]
  };

  return createMobileSDK(optimizedConfig);
}

/**
 * Event types specifically for African fintech applications
 */
export const FINTECH_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  BIOMETRIC_AUTH: 'biometric_auth',
  PIN_AUTH: 'pin_auth',
  OTP_SENT: 'otp_sent',
  OTP_VERIFIED: 'otp_verified',
  
  // Transactions
  TRANSFER_INITIATED: 'transfer_initiated',
  TRANSFER_COMPLETED: 'transfer_completed',
  TRANSFER_FAILED: 'transfer_failed',
  BILL_PAYMENT: 'bill_payment',
  AIRTIME_PURCHASE: 'airtime_purchase',
  
  // Mobile Money
  MOBILE_MONEY_DEPOSIT: 'mobile_money_deposit',
  MOBILE_MONEY_WITHDRAWAL: 'mobile_money_withdrawal',
  AGENT_TRANSACTION: 'agent_transaction',
  
  // Banking
  ACCOUNT_BALANCE_CHECK: 'balance_check',
  STATEMENT_DOWNLOAD: 'statement_download',
  LOAN_APPLICATION: 'loan_application',
  SAVINGS_DEPOSIT: 'savings_deposit',
  
  // KYC/Compliance
  KYC_DOCUMENT_UPLOAD: 'kyc_document_upload',
  KYC_SELFIE_CAPTURE: 'kyc_selfie_capture',
  KYC_COMPLETION: 'kyc_completion',
  
  // Investment
  INVESTMENT_VIEW: 'investment_view',
  INVESTMENT_PURCHASE: 'investment_purchase',
  PORTFOLIO_CHECK: 'portfolio_check',
  
  // Support
  HELP_CENTER_VISIT: 'help_center_visit',
  LIVE_CHAT_START: 'live_chat_start',
  SUPPORT_TICKET: 'support_ticket'
};

/**
 * Common screens for African fintech apps
 */
export const FINTECH_SCREENS = {
  // Authentication
  LOGIN: 'login_screen',
  REGISTRATION: 'registration_screen',
  OTP_VERIFICATION: 'otp_screen',
  PIN_SETUP: 'pin_setup_screen',
  BIOMETRIC_SETUP: 'biometric_setup_screen',
  
  // Dashboard
  HOME: 'home_screen',
  DASHBOARD: 'dashboard_screen',
  WALLET: 'wallet_screen',
  
  // Transactions
  SEND_MONEY: 'send_money_screen',
  RECEIVE_MONEY: 'receive_money_screen',
  TRANSACTION_HISTORY: 'transaction_history_screen',
  TRANSACTION_DETAILS: 'transaction_details_screen',
  
  // Bills & Payments
  BILL_PAYMENTS: 'bill_payments_screen',
  AIRTIME_DATA: 'airtime_data_screen',
  UTILITY_BILLS: 'utility_bills_screen',
  
  // Banking
  ACCOUNT_DETAILS: 'account_details_screen',
  STATEMENT: 'statement_screen',
  LOANS: 'loans_screen',
  SAVINGS: 'savings_screen',
  
  // Investment
  INVESTMENTS: 'investments_screen',
  PORTFOLIO: 'portfolio_screen',
  MARKET_DATA: 'market_data_screen',
  
  // Profile & Settings
  PROFILE: 'profile_screen',
  SETTINGS: 'settings_screen',
  KYC: 'kyc_screen',
  SECURITY: 'security_screen',
  
  // Support
  HELP: 'help_screen',
  SUPPORT: 'support_screen',
  FAQ: 'faq_screen'
};

/**
 * Helper function to track common fintech user journeys
 */
export class FintechJourneyTracker {
  private journeyTracker: UserJourneyTracker;

  constructor(sdk: LeadPulseMobileSDK) {
    this.journeyTracker = new UserJourneyTracker(sdk);
  }

  async trackMoneyTransferJourney() {
    await this.journeyTracker.trackStep('transfer_initiated', { journey: 'money_transfer' });
  }

  async trackRegistrationJourney(step: 'started' | 'phone_verified' | 'kyc_started' | 'kyc_completed' | 'completed') {
    await this.journeyTracker.trackStep(`registration_${step}`, { journey: 'user_registration' });
    
    if (step === 'completed') {
      await this.journeyTracker.completeJourney('user_registration', 'success');
    }
  }

  async trackLoanApplicationJourney(step: 'started' | 'eligibility_check' | 'documents_uploaded' | 'submitted' | 'approved' | 'disbursed') {
    await this.journeyTracker.trackStep(`loan_${step}`, { journey: 'loan_application' });
    
    if (step === 'disbursed') {
      await this.journeyTracker.completeJourney('loan_application', 'success');
    }
  }

  async trackInvestmentJourney(step: 'browse_products' | 'view_details' | 'risk_assessment' | 'amount_selection' | 'payment' | 'confirmation') {
    await this.journeyTracker.trackStep(`investment_${step}`, { journey: 'investment_purchase' });
    
    if (step === 'confirmation') {
      await this.journeyTracker.completeJourney('investment_purchase', 'success');
    }
  }
}

export default {
  // Core exports
  LeadPulseMobileSDK,
  createMobileSDK,
  createAfricanFintechSDK,
  
  // Platform-specific
  useLeadPulseSDK,
  withScreenTracking,
  autoInitMobileWebSDK,
  
  // Trackers
  NavigationTracker,
  UserJourneyTracker,
  FintechJourneyTracker,
  
  // Constants
  FINTECH_EVENTS,
  FINTECH_SCREENS,
  AFRICAN_FINTECH_CONFIG,
  ENVIRONMENT_CONFIGS
};