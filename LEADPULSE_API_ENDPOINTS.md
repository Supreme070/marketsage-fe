# LeadPulse Analytics API Endpoints

This document describes the newly created API endpoints for the LeadPulse analytics system. These endpoints replace mock data generators and connect to the existing Prisma database schema.

## Created Endpoints

### 1. `/api/leadpulse/ai/behavioral-scores`
**File**: `src/app/api/leadpulse/ai/behavioral-scores/route.ts`

**Purpose**: Provides AI-powered behavioral scoring data for visitors
**Method**: GET
**Query Parameters**:
- `sort` (optional): Sort field - 'conversionProbability', 'engagementScore', 'riskScore'
- `segment` (optional): Filter by segment - 'all' or specific segment name
- `limit` (optional): Number of results (default: 25, max: 100)

**Response Structure**:
```typescript
{
  scores: BehaviorScore[],
  total: number,
  metadata: {
    sort: string,
    segment: string,
    timestamp: string
  }
}
```

**Key Features**:
- Calculates behavioral metrics from real visitor data and touchpoints
- Generates AI predictions (conversion probability, churn risk, etc.)
- Determines behavioral patterns (explorer, researcher, buyer, etc.)
- Creates personalized visitor segments and traits
- Real-time activity tracking

### 2. `/api/leadpulse/ai/score-predictions`
**File**: `src/app/api/leadpulse/ai/score-predictions/route.ts`

**Purpose**: Provides AI-driven predictions based on visitor behavior patterns
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')

**Response Structure**:
```typescript
{
  predictions: ScorePrediction[],
  metadata: {
    timeRange: string,
    totalVisitors: number,
    activeVisitors: number,
    conversions: number,
    formSubmissions: number,
    generatedAt: string
  }
}
```

**Prediction Types**:
- Conversion rate forecasts
- Engagement trend analysis
- Churn risk alerts
- High-value prospect identification
- Optimal timing recommendations

### 3. `/api/leadpulse/ai/behavioral-insights`
**File**: `src/app/api/leadpulse/ai/behavioral-insights/route.ts`

**Purpose**: Generates actionable insights from visitor behavior analysis
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')

**Response Structure**:
```typescript
{
  insights: BehaviorInsight[],
  metadata: {
    timeRange: string,
    totalInsights: number,
    dataPoints: object,
    generatedAt: string
  }
}
```

**Insight Types**:
- Geographic patterns (African market focus)
- Mobile vs desktop behavior differences
- Form conversion opportunities
- Engagement trend analysis
- Weekend/timing patterns

### 4. `/api/leadpulse/heatmap-analysis`
**File**: `src/app/api/leadpulse/heatmap-analysis/route.ts`

**Purpose**: Provides detailed heatmap analysis for specific pages
**Method**: GET
**Query Parameters**:
- `url` (optional): Target page URL (default: '/dashboard')
- `type` (optional): Analysis type - 'click', 'scroll', 'attention', 'movement'
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')
- `device` (optional): Device filter - 'all', 'desktop', 'mobile', 'tablet'

**Response Structure**:
```typescript
{
  analysis: HeatmapAnalysis,
  metadata: {
    totalTouchpoints: number,
    totalPageViews: number,
    deviceFilter: string,
    generatedAt: string
  }
}
```

**Features**:
- Element-level click analysis
- Heat intensity mapping
- Performance vs average calculations
- Device-specific insights
- Actionable recommendations

### 5. `/api/leadpulse/heatmaps`
**File**: `src/app/api/leadpulse/heatmaps/route.ts`

**Purpose**: Provides overview of all page heatmaps
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')
- `limit` (optional): Number of pages to return (default: 10)

**Response Structure**:
```typescript
{
  heatmaps: HeatmapOverview[],
  summary: HeatmapSummary,
  metadata: {
    timeRange: string,
    totalPages: number,
    generatedAt: string
  }
}
```

**Features**:
- Page-level performance metrics
- Click-through rates and conversion rates
- Device breakdown analysis
- Top performing elements identification
- Trend analysis and improvement opportunities

### 6. `/api/leadpulse/form-analytics`
**File**: `src/app/api/leadpulse/form-analytics/route.ts`

**Purpose**: Comprehensive form analytics and performance data
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')
- `formId` (optional): Specific form ID to analyze

**Response Structure**:
```typescript
{
  forms: FormAnalytics[],
  metadata: {
    timeRange: string,
    totalForms: number,
    generatedAt: string
  }
}
```

**Features**:
- Form conversion rates and abandonment analysis
- Field-level performance metrics
- Device and source breakdown
- Drop-off point identification
- Completion time analysis

### 7. `/api/leadpulse/form-insights`
**File**: `src/app/api/leadpulse/form-insights/route.ts`

**Purpose**: AI-generated insights for form optimization
**Method**: GET
**Query Parameters**:
- `timeRange` (optional): '24h', '7d', '30d' (default: '7d')
- `formId` (optional): Specific form ID

**Response Structure**:
```typescript
{
  insights: FormInsight[],
  metadata: {
    timeRange: string,
    totalInsights: number,
    generatedAt: string
  }
}
```

**Insight Categories**:
- Optimization opportunities
- Performance issues
- Success patterns
- Field-specific recommendations
- Mobile-specific insights

### 8. `/api/leadpulse/visitors` (Enhanced)
**File**: `src/app/api/leadpulse/visitors/route.ts` (Fixed syntax error)

**Purpose**: Visitor tracking and real-time activity data
**Methods**: GET, POST
**Features**:
- Real-time visitor tracking
- Simulator integration
- Touchpoint recording
- Engagement score calculation
- Activity timeline

## Database Integration

All endpoints connect to the existing Prisma database schema using these models:
- `LeadPulseVisitor` - Core visitor data
- `LeadPulseTouchpoint` - Visitor interactions
- `LeadPulseForm` - Form definitions
- `LeadPulseFormSubmission` - Form submissions
- `LeadPulseFormField` - Form field configurations

## Key Features

### Real Data Integration
- All endpoints query actual database data
- Fallback to realistic mock data when needed
- Smart data transformation and enrichment

### AI-Powered Analytics
- Behavioral pattern recognition
- Predictive modeling
- Automated insight generation
- Cultural intelligence for African markets

### Performance Optimized
- Efficient database queries with proper indexing
- Pagination support
- Time-range filtering
- Caching considerations

### African Market Focus
- Geographic intelligence for Nigeria, Kenya, Ghana, South Africa
- Mobile-first analytics (important for African markets)
- Business hours optimization
- Cultural behavior patterns

## Error Handling

All endpoints include:
- Comprehensive try-catch blocks
- Graceful fallbacks to mock data
- Detailed error logging
- Appropriate HTTP status codes

## Usage Examples

### Fetch Behavioral Scores
```javascript
const response = await fetch('/api/leadpulse/ai/behavioral-scores?sort=conversionProbability&limit=50');
const data = await response.json();
```

### Get Heatmap Analysis
```javascript
const response = await fetch('/api/leadpulse/heatmap-analysis?url=/pricing&device=mobile');
const analysis = await response.json();
```

### Form Analytics
```javascript
const response = await fetch('/api/leadpulse/form-analytics?timeRange=30d');
const forms = await response.json();
```

## Integration with Frontend Components

These endpoints are designed to work with the existing LeadPulse components:
- `AIBehavioralScoring.tsx` → `/api/leadpulse/ai/behavioral-scores`
- `HeatmapAnalysisDetailed.tsx` → `/api/leadpulse/heatmap-analysis`
- `HeatmapOverview.tsx` → `/api/leadpulse/heatmaps`
- `FormAnalyticsAdvanced.tsx` → `/api/leadpulse/form-analytics`

To integrate, simply replace the mock data calls in the components with actual API calls to these endpoints.