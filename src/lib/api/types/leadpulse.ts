// LeadPulse API types and interfaces

// Form Types
export interface LeadPulseForm {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  layout: 'SINGLE_COLUMN' | 'MULTI_COLUMN';
  fields: LeadPulseFormField[];
  settings: {
    redirectUrl?: string;
    successMessage?: string;
    submitButtonText?: string;
    theme?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LeadPulseFormField {
  id: string;
  formId: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'RADIO' | 'DATE';
  label: string;
  placeholder?: string;
  required: boolean;
  width: 'FULL' | 'HALF' | 'THIRD';
  options?: string[]; // For SELECT, RADIO, CHECKBOX
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormDto {
  name: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  layout?: 'SINGLE_COLUMN' | 'MULTI_COLUMN';
  fields?: CreateFormFieldDto[];
  settings?: {
    redirectUrl?: string;
    successMessage?: string;
    submitButtonText?: string;
    theme?: string;
  };
}

export interface CreateFormFieldDto {
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'RADIO' | 'DATE';
  label: string;
  placeholder?: string;
  required?: boolean;
  width?: 'FULL' | 'HALF' | 'THIRD';
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  order?: number;
}

export interface UpdateFormDto {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  layout?: 'SINGLE_COLUMN' | 'MULTI_COLUMN';
  fields?: CreateFormFieldDto[];
  settings?: {
    redirectUrl?: string;
    successMessage?: string;
    submitButtonText?: string;
    theme?: string;
  };
}

export interface FormQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form Submission Types
export interface LeadPulseFormSubmission {
  id: string;
  formId: string;
  visitorId?: string;
  submissionData: Record<string, any>;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'SPAM';
  score?: number;
  quality?: 'LOW' | 'MEDIUM' | 'HIGH';
  context?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    timestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionDto {
  formId: string;
  visitorId?: string;
  data: Record<string, any>;
  context?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  };
}

export interface SubmissionQueryDto {
  page?: number;
  limit?: number;
  formId?: string;
  visitorId?: string;
  status?: 'PENDING' | 'PROCESSED' | 'FAILED' | 'SPAM';
  quality?: 'LOW' | 'MEDIUM' | 'HIGH';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Visitor Types
export interface LeadPulseVisitor {
  id: string;
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  referrer?: string;
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
  touchpoints: LeadPulseTouchpoint[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitorDto {
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  referrer?: string;
}

export interface VisitorQueryDto {
  page?: number;
  limit?: number;
  fingerprint?: string;
  country?: string;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Touchpoint Types
export interface LeadPulseTouchpoint {
  id: string;
  visitorId?: string;
  anonymousVisitorId?: string;
  type: 'PAGEVIEW' | 'CLICK' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CONVERSION';
  url?: string;
  element?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

export interface CreateTouchpointDto {
  visitorId?: string;
  anonymousVisitorId?: string;
  type: 'PAGEVIEW' | 'CLICK' | 'FORM_VIEW' | 'FORM_START' | 'FORM_SUBMIT' | 'CONVERSION';
  url?: string;
  element?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Insight Types
export interface LeadPulseInsight {
  id: string;
  type: 'BEHAVIOR' | 'PREDICTION' | 'OPPORTUNITY' | 'TREND';
  title: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  metric?: {
    label: string;
    value: number;
    format?: 'PERCENTAGE' | 'CURRENCY' | 'NUMBER';
    change?: number;
  };
  recommendation?: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInsightDto {
  type: 'BEHAVIOR' | 'PREDICTION' | 'OPPORTUNITY' | 'TREND';
  title: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  metric?: {
    label: string;
    value: number;
    format?: 'PERCENTAGE' | 'CURRENCY' | 'NUMBER';
    change?: number;
  };
  recommendation?: string;
  data?: Record<string, any>;
}

export interface InsightQueryDto {
  page?: number;
  limit?: number;
  type?: 'BEHAVIOR' | 'PREDICTION' | 'OPPORTUNITY' | 'TREND';
  importance?: 'LOW' | 'MEDIUM' | 'HIGH';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GenerateInsightDto {
  trigger: string;
  data?: Record<string, any>;
}

// Response Types
export interface LeadPulseFormListResponse {
  forms: LeadPulseForm[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadPulseSubmissionListResponse {
  submissions: LeadPulseFormSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadPulseVisitorListResponse {
  visitors: LeadPulseVisitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadPulseInsightListResponse {
  insights: LeadPulseInsight[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Analytics Types
export interface LeadPulseAnalytics {
  totalForms: number;
  totalSubmissions: number;
  totalVisitors: number;
  totalTouchpoints: number;
  conversionRate: number;
  averageScore: number;
  topPerformingForms: Array<{
    formId: string;
    formName: string;
    submissions: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    type: 'FORM_SUBMIT' | 'VISITOR_CREATE' | 'TOUCHPOINT_CREATE';
    timestamp: string;
    data: Record<string, any>;
  }>;
}

// API Key Types (for public endpoints)
export interface LeadPulseApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  expiresAt?: string;
}

export interface UpdateApiKeyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  expiresAt?: string;
}
