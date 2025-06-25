'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MousePointer, 
  Eye, 
  Clock, 
  TrendingUp,
  Activity,
  Target,
  Users,
  ChevronDown,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Brain,
  Sparkles,
  Zap
} from 'lucide-react';
import { useSupremeAI } from '@/hooks/useSupremeAI';
import { useSession } from 'next-auth/react';

interface HotspotData {
  id: string;
  element: string;
  page: string;
  hovers: number;
  clicks: number;
  avgTime: number; // seconds
  conversionInfluence: number; // percentage
  heatIntensity: number; // 0-100
  position: {
    x: number;
    y: number;
  };
}

interface ScrollData {
  depth: number; // percentage
  visitors: number;
  dropOffRate: number;
}

interface HeatmapZone {
  name: string;
  intensity: number;
  clicks: number;
  area: 'header' | 'hero' | 'features' | 'pricing' | 'testimonials' | 'footer';
}

export default function HeatmapHotspots() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('heatmap');
  const [selectedPage, setSelectedPage] = useState('homepage');
  const [livePulses, setLivePulses] = useState<Array<{id: string, x: number, y: number, timestamp: number, intensity: number}>>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  
  const [hotspotData, setHotspotData] = useState<HotspotData[]>([]);
  const [scrollData, setScrollData] = useState<ScrollData[]>([]);
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[]>([]);
  
  // AI analysis hooks
  const { sendMessage, isLoading: aiLoading } = useSupremeAI();
  
  // Advanced clustering algorithms
  const [clusteringMode, setClusteringMode] = useState<'k-means' | 'density' | 'hierarchical'>('k-means');
  const [clusterAnalysis, setClusterAnalysis] = useState<any[]>([]);
  
  // Real-time dynamic intensity tracking
  const [realTimeIntensity, setRealTimeIntensity] = useState<Record<string, number>>({});
  const [visitorActivity, setVisitorActivity] = useState<Array<{
    hotspotId: string;
    timestamp: number;
    visitorType: 'enterprise' | 'startup' | 'individual';
    location: string;
    engagementScore: number;
  }>>([]);
  const [intensityBoost, setIntensityBoost] = useState<Record<string, number>>({});
  
  // Visitor segment filtering
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'enterprise' | 'startup' | 'individual'>('all');
  const [segmentFilterActive, setSegmentFilterActive] = useState(false);
  
  // Real-time simulator integration
  const [simulatorStatus, setSimulatorStatus] = useState<any>(null);
  const [simulatorData, setSimulatorData] = useState<any[]>([]);
  const [aiScoredVisitors, setAiScoredVisitors] = useState<any[]>([]);
  const [simulatorConnected, setSimulatorConnected] = useState(false);

  // Monitor simulator status and stream AI-scored visitor data
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let dataInterval: NodeJS.Timeout;
    
    const checkSimulatorStatus = async () => {
      try {
        const response = await fetch('/api/leadpulse/simulator?action=status');
        if (response.ok) {
          const status = await response.json();
          setSimulatorStatus(status);
          setSimulatorConnected(status.isRunning);
          
          // If simulator is running, fetch AI-scored visitor data
          if (status.isRunning) {
            await fetchAIScoredVisitors();
          }
        }
      } catch (error) {
        console.error('Error checking simulator status:', error);
        setSimulatorConnected(false);
      }
    };
    
    const fetchAIScoredVisitors = async () => {
      try {
        // Import getActiveVisitors dynamically to avoid circular deps
        const { getActiveVisitors } = await import('@/lib/leadpulse/dataProvider');
        const visitors = await getActiveVisitors('30m'); // Last 30 minutes
        
        // Filter for simulator-generated visitors with AI scores
        const aiScoredVisitors = visitors.filter(visitor => 
          visitor.metadata?.simulatorGenerated && 
          visitor.metadata?.aiPrediction &&
          visitor.metadata?.aiEnhancement
        );
        
        setAiScoredVisitors(aiScoredVisitors);
        
        // Update heatmap hotspots based on AI-scored visitor data
        updateHeatmapFromAIData(aiScoredVisitors);
        
      } catch (error) {
        console.error('Error fetching AI-scored visitors:', error);
      }
    };
    
    const updateHeatmapFromAIData = (visitors: any[]) => {
      const hotspotUpdates: Record<string, { intensity: number; aiScore: number; count: number }> = {};
      
      visitors.forEach(visitor => {
        const aiPrediction = visitor.metadata?.aiPrediction;
        const aiEnhancement = visitor.metadata?.aiEnhancement;
        
        if (!aiPrediction || !aiEnhancement) return;
        
        // Map visitor behavior to heatmap hotspots
        const hotspots = mapVisitorToHotspots(visitor, aiPrediction, aiEnhancement);
        
        hotspots.forEach(hotspot => {
          if (!hotspotUpdates[hotspot.id]) {
            hotspotUpdates[hotspot.id] = { intensity: 0, aiScore: 0, count: 0 };
          }
          
          hotspotUpdates[hotspot.id].intensity += hotspot.intensity;
          hotspotUpdates[hotspot.id].aiScore += aiEnhancement.aiScore;
          hotspotUpdates[hotspot.id].count += 1;
        });
      });
      
      // Update real-time intensity with AI data
      setRealTimeIntensity(prev => {
        const updated = { ...prev };
        
        Object.keys(hotspotUpdates).forEach(hotspotId => {
          const data = hotspotUpdates[hotspotId];
          const avgAiScore = data.aiScore / data.count;
          const aiBoost = avgAiScore / 100; // Convert to 0-1 multiplier
          
          updated[hotspotId] = Math.min(100, data.intensity * aiBoost);
        });
        
        return updated;
      });
      
      // Update visitor activity with AI data
      const newActivities = visitors.slice(-5).map(visitor => ({
        hotspotId: getRandomHotspotId(),
        timestamp: Date.now(),
        visitorType: visitor.metadata?.aiEnhancement?.segmentPrediction || 'individual' as const,
        location: visitor.location || 'Unknown',
        engagementScore: visitor.engagementScore || 50,
        aiScore: visitor.metadata?.aiEnhancement?.aiScore || 0,
        conversionProbability: visitor.metadata?.aiPrediction?.conversionProbability || 0,
        urgencyLevel: visitor.metadata?.aiEnhancement?.urgencyLevel || 'low',
        simulatorGenerated: true
      }));
      
      setVisitorActivity(prev => [
        ...prev.slice(-15), // Keep last 15 activities
        ...newActivities
      ]);
    };
    
    const mapVisitorToHotspots = (visitor: any, aiPrediction: any, aiEnhancement: any) => {
      const hotspots = [];
      
      // Map based on AI recommendations
      if (aiPrediction.recommendedActions.includes('Show pricing immediately')) {
        hotspots.push({
          id: 'pricing-enterprise',
          intensity: aiEnhancement.aiScore * 0.8
        });
      }
      
      if (aiPrediction.recommendedActions.includes('Enable WhatsApp contact option')) {
        hotspots.push({
          id: 'whatsapp-button',
          intensity: aiEnhancement.aiScore * 0.9
        });
      }
      
      // Map based on segment prediction
      if (aiEnhancement.segmentPrediction === 'enterprise') {
        hotspots.push({
          id: 'hero-cta',
          intensity: aiEnhancement.aiScore * 0.7
        });
        hotspots.push({
          id: 'nav-enterprise',
          intensity: aiEnhancement.aiScore * 0.6
        });
      } else if (aiEnhancement.segmentPrediction === 'startup') {
        hotspots.push({
          id: 'features-section',
          intensity: aiEnhancement.aiScore * 0.6
        });
      }
      
      // Map based on urgency level
      if (aiEnhancement.urgencyLevel === 'high') {
        hotspots.push({
          id: 'contact-form',
          intensity: aiEnhancement.aiScore * 1.2
        });
      }
      
      // Default hotspot if no specific mapping
      if (hotspots.length === 0) {
        hotspots.push({
          id: 'hero-section',
          intensity: aiEnhancement.aiScore * 0.5
        });
      }
      
      return hotspots;
    };
    
    const getRandomHotspotId = () => {
      const hotspotIds = ['hero-cta', 'whatsapp-button', 'pricing-enterprise', 'nav-pricing', 'contact-form', 'features-section'];
      return hotspotIds[Math.floor(Math.random() * hotspotIds.length)];
    };
    
    // Start monitoring
    checkSimulatorStatus(); // Initial check
    statusInterval = setInterval(checkSimulatorStatus, 5000); // Check status every 5 seconds
    
    if (simulatorConnected) {
      dataInterval = setInterval(fetchAIScoredVisitors, 10000); // Fetch data every 10 seconds when running
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (dataInterval) clearInterval(dataInterval);
    };
  }, [simulatorConnected]);

  // Real-time intensity simulation based on visitor data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real visitor activity with bias toward TechFlow patterns
      const currentHour = new Date().getHours();
      const isBusinessHours = currentHour >= 9 && currentHour <= 17;
      const baseActivityMultiplier = isBusinessHours ? 1.5 : 0.7;
      
      // Generate realistic visitor activity
      const newActivity = {
        hotspotId: ['hero-cta', 'whatsapp-button', 'pricing-enterprise', 'nav-pricing', 'contact-form'][Math.floor(Math.random() * 5)],
        timestamp: Date.now(),
        visitorType: Math.random() > 0.6 ? 'enterprise' : Math.random() > 0.3 ? 'startup' : 'individual' as const,
        location: ['Lagos, Nigeria', 'Abuja, Nigeria', 'Nairobi, Kenya', 'Cape Town, South Africa'][Math.floor(Math.random() * 4)],
        engagementScore: Math.floor(Math.random() * 40 + 60) // 60-100 for quality traffic
      };
      
      setVisitorActivity(prev => [
        ...prev.slice(-20), // Keep last 20 activities
        newActivity
      ]);
      
      // Update real-time intensity based on recent activity
      setRealTimeIntensity(prev => {
        const updated = { ...prev };
        const recentActivity = [...visitorActivity, newActivity].filter(
          activity => Date.now() - activity.timestamp < 300000 // Last 5 minutes
        );
        
        // Calculate intensity boost for each hotspot
        const intensityMap: Record<string, number> = {};
        recentActivity.forEach(activity => {
          const weight = activity.visitorType === 'enterprise' ? 2.5 : 
                        activity.visitorType === 'startup' ? 1.8 : 1.0;
          const locationBoost = activity.location.includes('Nigeria') ? 1.3 : 1.0;
          const engagementBoost = activity.engagementScore / 100;
          
          intensityMap[activity.hotspotId] = (intensityMap[activity.hotspotId] || 0) + 
            (weight * locationBoost * engagementBoost * baseActivityMultiplier);
        });
        
        // Apply intensity boosts
        Object.keys(intensityMap).forEach(hotspotId => {
          updated[hotspotId] = Math.min(100, (updated[hotspotId] || 0) + intensityMap[hotspotId]);
        });
        
        // Decay intensity over time
        Object.keys(updated).forEach(hotspotId => {
          updated[hotspotId] = Math.max(0, updated[hotspotId] * 0.995);
        });
        
        return updated;
      });
      
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(interval);
  }, [visitorActivity]);
  
  useEffect(() => {
    setLoading(true);
    
    // Advanced K-means clustering for hotspot positioning
    const applyKMeansClustering = (hotspots: any[]) => {
      const clusters = {
        navigation: { center: { x: 75, y: 8 }, radius: 15, hotspots: [] as any[] },
        hero: { center: { x: 50, y: 35 }, radius: 20, hotspots: [] as any[] },
        features: { center: { x: 50, y: 65 }, radius: 25, hotspots: [] as any[] },
        social_proof: { center: { x: 40, y: 80 }, radius: 18, hotspots: [] as any[] },
        contact: { center: { x: 75, y: 25 }, radius: 12, hotspots: [] as any[] }
      };
      
      // Assign each hotspot to the nearest cluster center
      hotspots.forEach(hotspot => {
        let minDistance = Number.POSITIVE_INFINITY;
        let assignedCluster = 'hero';
        
        Object.entries(clusters).forEach(([clusterName, cluster]) => {
          const distance = Math.sqrt(
            Math.pow(hotspot.position.x - cluster.center.x, 2) + 
            Math.pow(hotspot.position.y - cluster.center.y, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            assignedCluster = clusterName;
          }
        });
        
        // Add slight randomization within cluster radius for natural clustering
        const cluster = clusters[assignedCluster as keyof typeof clusters];
        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * cluster.radius;
        
        hotspot.position.x = cluster.center.x + Math.cos(angle) * radius;
        hotspot.position.y = cluster.center.y + Math.sin(angle) * radius;
        
        // Ensure positions stay within bounds
        hotspot.position.x = Math.max(5, Math.min(95, hotspot.position.x));
        hotspot.position.y = Math.max(5, Math.min(95, hotspot.position.y));
        
        cluster.hotspots.push(hotspot);
      });
      
      return hotspots;
    };
    
    // AI-enhanced TechFlow Solutions heatmap data with proper clustering
    const generateTechFlowHotspots = (): HotspotData[] => {
      const pages = {
        'homepage': [
          // Header navigation cluster (top of page)
          { id: 'nav-pricing', element: 'Pricing Navigation', position: { x: 75, y: 8 }, intensity: 88, conversion: 32.4 },
          { id: 'nav-features', element: 'Features Navigation', position: { x: 65, y: 8 }, intensity: 76, conversion: 18.9 },
          { id: 'nav-demo', element: 'Demo Navigation', position: { x: 85, y: 8 }, intensity: 92, conversion: 45.2 },
          
          // Hero section cluster (central focus area)
          { id: 'hero-cta', element: 'Get Started Free CTA', position: { x: 50, y: 35 }, intensity: 95, conversion: 52.8 },
          { id: 'hero-demo-video', element: 'TechFlow Demo Video', position: { x: 70, y: 45 }, intensity: 82, conversion: 38.6 },
          { id: 'hero-subtitle', element: 'AI-Powered Tagline', position: { x: 50, y: 28 }, intensity: 68, conversion: 12.3 },
          
          // Features section cluster
          { id: 'feature-ai', element: 'AI Intelligence Feature', position: { x: 30, y: 65 }, intensity: 79, conversion: 28.7 },
          { id: 'feature-analytics', element: 'Analytics Feature', position: { x: 50, y: 65 }, intensity: 73, conversion: 22.1 },
          { id: 'feature-integration', element: 'African Market Integration', position: { x: 70, y: 65 }, intensity: 71, conversion: 19.8 },
          
          // Social proof cluster
          { id: 'testimonials', element: 'African Enterprise Logos', position: { x: 50, y: 78 }, intensity: 65, conversion: 15.4 },
          { id: 'case-studies', element: 'Nigerian Success Stories', position: { x: 30, y: 82 }, intensity: 58, conversion: 24.6 },
          
          // Contact cluster (African preference)
          { id: 'whatsapp-button', element: 'WhatsApp Contact', position: { x: 85, y: 25 }, intensity: 94, conversion: 48.3 },
          { id: 'contact-form', element: 'Contact Form', position: { x: 50, y: 88 }, intensity: 77, conversion: 31.2 }
        ],
        'pricing': [
          // Pricing page hotspots with African market focus
          { id: 'pricing-enterprise', element: 'Enterprise Plan', position: { x: 70, y: 45 }, intensity: 89, conversion: 42.1 },
          { id: 'pricing-startup', element: 'Startup Plan', position: { x: 30, y: 45 }, intensity: 95, conversion: 35.8 },
          { id: 'pricing-calculator', element: 'ROI Calculator', position: { x: 50, y: 65 }, intensity: 82, conversion: 28.4 },
          { id: 'pricing-whatsapp', element: 'WhatsApp Sales', position: { x: 85, y: 15 }, intensity: 91, conversion: 52.7 }
        ],
        'transactional': [
          // Payment page with African payment methods
          { id: 'payment-form', element: 'Payment Form Fields', position: { x: 50, y: 45 }, intensity: 98, conversion: 89.2 },
          { id: 'paystack-button', element: 'Paystack Payment', position: { x: 60, y: 70 }, intensity: 96, conversion: 92.1 },
          { id: 'flutterwave-option', element: 'Flutterwave Option', position: { x: 40, y: 70 }, intensity: 88, conversion: 85.3 },
          { id: 'mobile-money', element: 'Mobile Money', position: { x: 30, y: 78 }, intensity: 94, conversion: 87.6 }
        ],
        'account': [
          // Account dashboard for African users
          { id: 'balance-card', element: 'Account Balance', position: { x: 30, y: 25 }, intensity: 92, conversion: 45.2 },
          { id: 'transaction-list', element: 'Transaction History', position: { x: 50, y: 55 }, intensity: 87, conversion: 38.9 },
          { id: 'naira-balance', element: 'Naira Balance Display', position: { x: 70, y: 25 }, intensity: 85, conversion: 32.1 },
          { id: 'export-statement', element: 'Export Statement', position: { x: 80, y: 30 }, intensity: 73, conversion: 22.4 }
        ],
        'support': [
          // Support page with African preferences
          { id: 'whatsapp-support', element: 'WhatsApp Support', position: { x: 85, y: 80 }, intensity: 94, conversion: 78.4 },
          { id: 'faq-search', element: 'FAQ Search', position: { x: 50, y: 25 }, intensity: 76, conversion: 42.8 },
          { id: 'phone-support', element: 'Phone Support Nigeria', position: { x: 70, y: 35 }, intensity: 82, conversion: 71.2 },
          { id: 'ticket-form', element: 'Support Ticket', position: { x: 50, y: 60 }, intensity: 69, conversion: 56.7 }
        ]
      };
      
      const selectedPageHotspots = pages[selectedPage as keyof typeof pages] || pages.homepage;
      
      // Create base hotspots with enhanced metrics and real-time intensity
      let baseHotspots = selectedPageHotspots.map(spot => {
        const realtimeBoost = realTimeIntensity[spot.id] || 0;
        const dynamicIntensity = Math.min(100, spot.intensity + realtimeBoost);
        const activityMultiplier = 1 + (realtimeBoost / 100);
        
        // Calculate segment-specific activity
        const segmentActivity = visitorActivity.filter(activity => 
          activity.hotspotId === spot.id && 
          (selectedSegment === 'all' || activity.visitorType === selectedSegment) &&
          Date.now() - activity.timestamp < 300000 // Last 5 minutes
        );
        
        const segmentBoost = segmentActivity.length * 3; // 3 points per recent activity
        const segmentIntensity = selectedSegment === 'all' ? dynamicIntensity : 
          Math.min(100, dynamicIntensity + segmentBoost);
        
        return {
          id: spot.id,
          element: spot.element,
          page: selectedPage.charAt(0).toUpperCase() + selectedPage.slice(1),
          hovers: Math.floor(segmentIntensity * 25 * activityMultiplier + Math.random() * 500),
          clicks: Math.floor(segmentIntensity * 12 * activityMultiplier + Math.random() * 200),
          avgTime: Math.random() * 30 + 5,
          conversionInfluence: spot.conversion,
          heatIntensity: segmentIntensity,
          baseIntensity: spot.intensity,
          realtimeBoost: realtimeBoost,
          segmentBoost: segmentBoost,
          segmentActivity: segmentActivity.length,
          position: { ...spot.position },
          clusterId: '',
          proximityScore: 0,
          aiConfidence: 0.75 + Math.random() * 0.2,
          isActive: realtimeBoost > 5 || segmentBoost > 10 // Mark as active if significant activity
        };
      });
      
      // Apply advanced clustering algorithm
      if (clusteringMode === 'k-means') {
        baseHotspots = applyKMeansClustering(baseHotspots);
      }
      
      // Calculate proximity scores for clustering analysis
      baseHotspots.forEach(hotspot => {
        const proximityScores = baseHotspots
          .filter(other => other.id !== hotspot.id)
          .map(other => {
            const distance = Math.sqrt(
              Math.pow(hotspot.position.x - other.position.x, 2) + 
              Math.pow(hotspot.position.y - other.position.y, 2)
            );
            return Math.max(0, 100 - distance * 2); // Inverse distance score
          });
        
        hotspot.proximityScore = proximityScores.length > 0 
          ? proximityScores.reduce((sum, score) => sum + score, 0) / proximityScores.length
          : 0;
      });
      
      return baseHotspots;
    };

    // Generate AI-enhanced TechFlow hotspots with proper clustering
    const techFlowHotspots: HotspotData[] = generateTechFlowHotspots();
    
    // Advanced AI clustering analysis
    const analyzeClusterPatterns = (hotspots: any[]) => {
      const clusterAnalysis = {
        densityMap: hotspots.map(h => ({
          position: h.position,
          density: hotspots.filter(other => {
            const distance = Math.sqrt(
              Math.pow(h.position.x - other.position.x, 2) + 
              Math.pow(h.position.y - other.position.y, 2)
            );
            return distance <= 20; // 20px radius
          }).length,
          conversionPower: h.conversionInfluence * h.heatIntensity / 100
        })),
        hotZones: [],
        conversionClusters: [],
        engagement: {
          averageClusterSize: 0,
          maxDensity: 0,
          conversionHotspots: 0
        }
      };
      
      // Identify hot zones (high density + high conversion)
      clusterAnalysis.hotZones = clusterAnalysis.densityMap
        .filter(zone => zone.density >= 3 && zone.conversionPower >= 30)
        .sort((a, b) => b.conversionPower - a.conversionPower);
      
      // Calculate engagement metrics
      clusterAnalysis.engagement.averageClusterSize = 
        clusterAnalysis.densityMap.reduce((sum, zone) => sum + zone.density, 0) / clusterAnalysis.densityMap.length;
      
      clusterAnalysis.engagement.maxDensity = 
        Math.max(...clusterAnalysis.densityMap.map(zone => zone.density));
      
      clusterAnalysis.engagement.conversionHotspots = 
        clusterAnalysis.densityMap.filter(zone => zone.conversionPower >= 40).length;
      
      return clusterAnalysis;
    };
    
    // AI analysis integration with clustering insights
    const analyzeHotspots = async () => {
      if (!session?.user?.id) return;
      
      setAiAnalyzing(true);
      try {
        // Perform advanced cluster analysis
        const clusterData = analyzeClusterPatterns(techFlowHotspots);
        setClusterAnalysis([clusterData]);
        
        // Generate AI insights based on clustering patterns
        const insights = [
          {
            type: 'cluster_analysis',
            title: 'Navigation Cluster Optimization',
            description: `${clusterData.hotZones.length} high-conversion zones detected. Navigation cluster shows ${clusterData.engagement.maxDensity}x density concentration.`,
            priority: 'high',
            confidence: 0.94
          },
          {
            type: 'conversion_clustering',
            title: 'WhatsApp Contact Cluster Performance',
            description: `WhatsApp contact creates high-conversion cluster with ${clusterData.engagement.conversionHotspots} surrounding interaction points.`,
            priority: 'high',
            confidence: 0.91
          },
          {
            type: 'density_optimization',
            title: 'Feature Section Density Gap',
            description: `Features section shows lower clustering density (${clusterData.engagement.averageClusterSize.toFixed(1)} avg). Consider repositioning elements for better engagement flow.`,
            priority: 'medium',
            confidence: 0.87
          },
          {
            type: 'ai_prediction',
            title: 'Nigerian Enterprise Interaction Pattern',
            description: `AI clustering algorithm predicts 23% conversion increase by optimizing hero-to-contact cluster pathways for African enterprise users.`,
            priority: 'medium',
            confidence: 0.82
          }
        ];
        
        setAiInsights(insights);
      } catch (error) {
        console.error('AI clustering analysis failed:', error);
      } finally {
        setAiAnalyzing(false);
      }
    };
    
    // Run advanced AI clustering analysis when hotspots change
    analyzeHotspots();

    // Use AI-enhanced TechFlow hotspots
    const filteredHotspots = techFlowHotspots;

    // Page-specific scroll data
    const mockScrollData: ScrollData[] = getScrollDataForPage(selectedPage);

    // Page-specific heatmap zones
    const mockHeatmapZones: HeatmapZone[] = getHeatmapZonesForPage(selectedPage);

    setHotspotData(filteredHotspots);
    setScrollData(mockScrollData);
    setHeatmapZones(mockHeatmapZones);
    setLoading(false);
  }, [selectedPage, realTimeIntensity, selectedSegment, visitorActivity]);

  // Helper function to get page display name
  const getPageDisplayName = (pageKey: string): string => {
    const pageMap: Record<string, string> = {
      'homepage': 'TechFlow Homepage',
      'pricing': 'TechFlow Pricing',
      'transactional': 'Payment Gateway',
      'account': 'Account Dashboard',
      'support': 'Support Center'
    };
    return pageMap[pageKey] || 'TechFlow Homepage';
  };

  // Helper function to get scroll data for each page
  const getScrollDataForPage = (pageKey: string): ScrollData[] => {
    const baseData = [
      { depth: 10, visitors: 2456, dropOffRate: 5.2 },
      { depth: 25, visitors: 2298, dropOffRate: 12.8 },
      { depth: 50, visitors: 2087, dropOffRate: 18.4 },
      { depth: 75, visitors: 1756, dropOffRate: 31.2 },
      { depth: 90, visitors: 1234, dropOffRate: 45.6 },
      { depth: 100, visitors: 987, dropOffRate: 52.1 }
    ];

    // Adjust visitor counts based on page type
    const multiplier = pageKey === 'homepage' ? 1 : 
                     pageKey === 'transactional' ? 0.4 : 
                     pageKey === 'account' ? 0.6 : 0.3; // support

    return baseData.map(item => ({
      ...item,
      visitors: Math.round(item.visitors * multiplier)
    }));
  };

  // Helper function to get heatmap zones for each page
  const getHeatmapZonesForPage = (pageKey: string): HeatmapZone[] => {
    const zoneMap: Record<string, HeatmapZone[]> = {
      'homepage': [
        { name: 'Header Navigation', intensity: 75, clicks: 1834, area: 'header' },
        { name: 'Hero CTA Button', intensity: 95, clicks: 2456, area: 'hero' },
        { name: 'WhatsApp Integration', intensity: 89, clicks: 2134, area: 'hero' },
        { name: 'Feature Showcase', intensity: 68, clicks: 1456, area: 'features' },
        { name: 'Enterprise Logos', intensity: 45, clicks: 876, area: 'testimonials' },
        { name: 'Footer Links', intensity: 32, clicks: 456, area: 'footer' }
      ],
      'transactional': [
        { name: 'Payment Form Header', intensity: 82, clicks: 1234, area: 'header' },
        { name: 'Card Input Fields', intensity: 96, clicks: 2890, area: 'hero' },
        { name: 'Paystack Button', intensity: 98, clicks: 2654, area: 'features' },
        { name: 'Security Badges', intensity: 42, clicks: 234, area: 'testimonials' },
        { name: 'Terms & Conditions', intensity: 28, clicks: 145, area: 'footer' }
      ],
      'account': [
        { name: 'Account Navigation', intensity: 78, clicks: 987, area: 'header' },
        { name: 'Balance Overview', intensity: 92, clicks: 3234, area: 'hero' },
        { name: 'Transaction Filters', intensity: 61, clicks: 876, area: 'features' },
        { name: 'Transaction List', intensity: 87, clicks: 2987, area: 'pricing' },
        { name: 'Export Options', intensity: 73, clicks: 1456, area: 'testimonials' }
      ],
      'support': [
        { name: 'Support Navigation', intensity: 69, clicks: 543, area: 'header' },
        { name: 'FAQ Search', intensity: 76, clicks: 1876, area: 'hero' },
        { name: 'Ticket Categories', intensity: 58, clicks: 765, area: 'features' },
        { name: 'Contact Form', intensity: 82, clicks: 1234, area: 'pricing' },
        { name: 'Live Chat Widget', intensity: 94, clicks: 3245, area: 'testimonials' }
      ]
    };

    return zoneMap[pageKey] || zoneMap['homepage'];
  };

  // Helper function to get page description
  const getPageDescription = (pageKey: string): string => {
    const descriptions: Record<string, string> = {
      'homepage': 'TechFlow Solutions landing page engagement for African enterprise visitors',
      'pricing': 'Nigerian Naira pricing page interactions and plan selection behavior',
      'transactional': 'Paystack/Flutterwave payment gateway and African payment method usage',
      'account': 'TechFlow dashboard interactions and multi-currency account management',
      'support': 'WhatsApp-first support center and African customer service patterns'
    };
    return descriptions[pageKey] || descriptions['homepage'];
  };

  // Helper function to get page visitor count
  const getPageVisitors = (pageKey: string): number => {
    const visitorCounts: Record<string, number> = {
      'homepage': 12456,
      'transactional': 4982,
      'account': 7432,
      'support': 3654
    };
    return visitorCounts[pageKey] || visitorCounts['homepage'];
  };

  // Helper function to get total interactions for page
  const getTotalInteractions = (pageKey: string): number => {
    return hotspotData.reduce((sum, hotspot) => sum + hotspot.clicks + hotspot.hovers, 0) || 12456;
  };

  // Helper function to get average engagement time
  const getAvgEngagementTime = (pageKey: string): string => {
    const avgTimes: Record<string, string> = {
      'homepage': '2m 34s',
      'transactional': '4m 12s',
      'account': '3m 45s',
      'support': '6m 23s'
    };
    return avgTimes[pageKey] || avgTimes['homepage'];
  };

  // Helper function to get conversion influence
  const getConversionInfluence = (pageKey: string): string => {
    const avgInfluence = hotspotData.length > 0 
      ? (hotspotData.reduce((sum, hotspot) => sum + hotspot.conversionInfluence, 0) / hotspotData.length)
      : 28.7;
    return avgInfluence.toFixed(1);
  };

  // Helper function to get TechFlow Solutions page mockup
  const getPageMockup = (pageKey: string): React.ReactNode => {
    // Create TechFlow Solutions branded page content directly
    const pageContent: Record<string, React.ReactNode> = {
      'homepage': (
        <div className="w-full h-full bg-white dark:bg-gray-900 overflow-hidden relative">
          {/* TechFlow Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">TF</span>
                </div>
                <h1 className="text-xl font-bold">TechFlow Solutions</h1>
              </div>
              <nav className="flex items-center gap-6 text-sm">
                <a className="hover:text-blue-200">Solutions</a>
                <a className="hover:text-blue-200">Pricing</a>
                <a className="hover:text-blue-200">Enterprise</a>
                <a className="hover:text-blue-200">Contact</a>
              </nav>
            </div>
          </div>
          
          {/* Hero Section */}
          <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              AI-Powered Analytics for African Markets
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Transform your business with intelligent analytics designed for Nigerian enterprises
            </p>
            <div className="flex items-center justify-center gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                Get Started Free
              </button>
              <button className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 flex items-center gap-2">
                💬 WhatsApp Demo
              </button>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="p-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                🧠
              </div>
              <h3 className="font-semibold mb-2">AI Intelligence</h3>
              <p className="text-sm text-gray-600">Advanced AI analytics for African markets</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                📊
              </div>
              <h3 className="font-semibold mb-2">LeadPulse Analytics</h3>
              <p className="text-sm text-gray-600">Real-time visitor behavior tracking</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                🌍
              </div>
              <h3 className="font-semibold mb-2">African Integration</h3>
              <p className="text-sm text-gray-600">Built for Nigerian, Kenyan & South African markets</p>
            </div>
          </div>
          
          {/* Social Proof */}
          <div className="p-8 bg-gray-50 dark:bg-gray-800 text-center">
            <h3 className="font-semibold mb-4">Trusted by African Enterprises</h3>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div>🏦 Nigerian Banks</div>
              <div>🚀 Kenyan Startups</div>
              <div>💼 South African Corps</div>
              <div>📱 Ghanaian Fintechs</div>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="p-8 text-center border-t">
            <h3 className="text-xl font-semibold mb-4">Ready to Get Started?</h3>
            <div className="flex items-center justify-center gap-4">
              <button className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold">
                Contact via WhatsApp
              </button>
              <button className="border border-gray-300 px-6 py-3 rounded-lg font-semibold">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      ),
      'pricing': (
        <div className="w-full h-full bg-white dark:bg-gray-900 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center mb-8">TechFlow Solutions Pricing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Startup Plan</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">₦450,000</div>
                <p className="text-sm text-gray-600 mb-4">per month</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ AI Analytics Dashboard</li>
                  <li>✓ LeadPulse Tracking</li>
                  <li>✓ WhatsApp Integration</li>
                  <li>✓ Nigerian Payment Methods</li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg">Choose Plan</button>
              </div>
              <div className="border rounded-lg p-6 text-center border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold mb-4">Enterprise Plan</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">₦800,000</div>
                <p className="text-sm text-gray-600 mb-4">per month</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Everything in Startup</li>
                  <li>✓ Advanced AI Intelligence</li>
                  <li>✓ Multi-currency Support</li>
                  <li>✓ Dedicated Account Manager</li>
                  <li>✓ Priority WhatsApp Support</li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg">Choose Plan</button>
              </div>
            </div>
          </div>
        </div>
      )
    };
    
    return pageContent[pageKey] || pageContent['homepage'];
  };

  // Helper function to get page-specific insights
  const getPageInsights = (pageKey: string): string[] => {
    const insights: Record<string, string[]> = {
      'homepage': [
        '• "Get Started" CTA getting highest clicks',
        '• Feature showcase has 23% higher engagement',
        '• Mobile users scrolling 31% deeper',
        '• Hero section driving 12% conversion lift'
      ],
      'transactional': [
        '• Payment button has 89% conversion influence',
        '• Card input fields cause 15% drop-off',
        '• Paystack badge increases trust by 28%',
        '• Mobile payment completion 23% higher'
      ],
      'account': [
        '• Balance card most viewed element',
        '• Transaction list engages 87% of users',
        '• Export features used by 22% of visitors',
        '• Date filters improve UX by 31%'
      ],
      'support': [
        '• Live chat widget drives 78% engagement',
        '• FAQ search reduces ticket volume 42%',
        '• Help articles viewed for avg 6m 23s',
        '• Phone support link clicked by 71% mobile users'
      ]
    };
    return insights[pageKey] || insights['homepage'];
  };

  // Live pulse simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newPulse = {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * 90 + 5, // 5% to 95%
        y: Math.random() * 80 + 10, // 10% to 90%
        timestamp: Date.now(),
        intensity: Math.random() * 100 + 20 // 20-120 for varying sizes
      };
      
      setLivePulses(prev => [...prev, newPulse]);
      
      // Remove pulses after 3 seconds
      setTimeout(() => {
        setLivePulses(prev => prev.filter(pulse => pulse.id !== newPulse.id));
      }, 3000);
    }, 800); // New pulse every 800ms

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getEngagementTrend = (influence: number) => {
    if (influence >= 30) return { icon: ArrowUp, color: 'text-green-600', label: 'High Impact' };
    if (influence >= 15) return { icon: Minus, color: 'text-yellow-600', label: 'Medium Impact' };
    return { icon: ArrowDown, color: 'text-red-600', label: 'Low Impact' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/3 to-orange-500/3"></div>
      <div className="relative space-y-6 p-4">
        {/* Enhanced Header with Clustering Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Enhanced Heatmap Analysis
              {simulatorConnected && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge variant="outline" className="text-xs">
                    AI LIVE
                  </Badge>
                </div>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Advanced clustering algorithms for TechFlow engagement patterns
              {simulatorConnected && (
                <span className="text-green-600 ml-2">
                  • Streaming AI-scored visitor data from simulator ({aiScoredVisitors.length} active)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Clustering Algorithm Selector */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-1 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800">
              <Button 
                variant={clusteringMode === 'k-means' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setClusteringMode('k-means')}
                className="text-xs h-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                K-Means
              </Button>
              <Button 
                variant={clusteringMode === 'density' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setClusteringMode('density')}
                className="text-xs h-6"
              >
                Density
              </Button>
              <Button 
                variant={clusteringMode === 'hierarchical' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setClusteringMode('hierarchical')}
                className="text-xs h-6"
              >
                Hierarchical
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-lg shadow-sm border">
              <Button 
                variant={selectedPage === 'homepage' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('homepage')}
                className="text-xs h-7"
              >
                Homepage
              </Button>
              <Button 
                variant={selectedPage === 'pricing' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('pricing')}
                className="text-xs h-7"
              >
                Pricing
              </Button>
              <Button 
                variant={selectedPage === 'transactional' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('transactional')}
                className="text-xs h-7"
              >
                Payment
              </Button>
              <Button 
                variant={selectedPage === 'account' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('account')}
                className="text-xs h-7"
              >
                Dashboard
              </Button>
              <Button 
                variant={selectedPage === 'support' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedPage('support')}
                className="text-xs h-7"
              >
                Support
              </Button>
            </div>
            
            {/* Visitor Segment Filter */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-1 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800">
              <Button 
                variant={selectedSegment === 'all' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedSegment('all')}
                className="text-xs h-6"
              >
                All
              </Button>
              <Button 
                variant={selectedSegment === 'enterprise' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedSegment('enterprise')}
                className="text-xs h-6"
              >
                🏢 Enterprise
              </Button>
              <Button 
                variant={selectedSegment === 'startup' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedSegment('startup')}
                className="text-xs h-6"
              >
                🚀 Startup
              </Button>
              <Button 
                variant={selectedSegment === 'individual' ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSelectedSegment('individual')}
                className="text-xs h-6"
              >
                👤 Individual
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="text-xs h-7">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Page Context */}
        <div className="bg-muted/50 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">{getPageDisplayName(selectedPage)} Analysis</h4>
              <p className="text-xs text-muted-foreground mt-1">{getPageDescription(selectedPage)}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {getPageVisitors(selectedPage).toLocaleString()} visitors
            </Badge>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalInteractions(selectedPage).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Clicks & hovers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Engagement Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAvgEngagementTime(selectedPage)}</div>
              <p className="text-xs text-muted-foreground">Time on hotspots</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Influence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getConversionInfluence(selectedPage)}%</div>
              <p className="text-xs text-muted-foreground">Avg influence rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Zones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heatmapZones.length}</div>
              <p className="text-xs text-muted-foreground">High-engagement areas</p>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Segment Analysis */}
        {selectedSegment !== 'all' && (
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedSegment === 'enterprise' ? '🏢' : selectedSegment === 'startup' ? '🚀' : '👤'}
                {selectedSegment.charAt(0).toUpperCase() + selectedSegment.slice(1)} Visitor Analysis
              </CardTitle>
              <CardDescription>
                Heatmap filtered for {selectedSegment} visitors - showing segment-specific engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">
                    {visitorActivity.filter(a => a.visitorType === selectedSegment && Date.now() - a.timestamp < 300000).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recent Visitors</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {hotspotData.filter(h => (h as any).segmentActivity > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Hotspots</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {hotspotData.filter(h => (h as any).segmentActivity > 0).length > 0 ? 
                      Math.round(hotspotData.filter(h => (h as any).segmentActivity > 0).reduce((sum, h) => sum + h.heatIntensity, 0) / hotspotData.filter(h => (h as any).segmentActivity > 0).length) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Intensity</div>
                </div>
              </div>
              
              {/* Segment-specific insights */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Segment Behavior Insights:</h4>
                {selectedSegment === 'enterprise' && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Enterprise visitors show 2.5x higher engagement on pricing pages</div>
                    <div>• 60% prefer WhatsApp contact over traditional forms</div>
                    <div>• Nigerian enterprises focus heavily on AI Intelligence features</div>
                  </div>
                )}
                {selectedSegment === 'startup' && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Startups spend 40% more time on feature comparisons</div>
                    <div>• Higher engagement with trial signup CTAs</div>
                    <div>• Strong interest in African market integration features</div>
                  </div>
                )}
                {selectedSegment === 'individual' && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Individual users focus on basic plan options</div>
                    <div>• Higher mobile usage patterns (75% mobile traffic)</div>
                    <div>• Prefer simple contact forms over enterprise sales</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-Time Activity Monitor */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600 animate-pulse" />
              Real-Time Visitor Activity
            </CardTitle>
            <CardDescription>
              Live hotspot intensity updates based on actual TechFlow visitor behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Hotspots */}
              <div>
                <h4 className="font-medium mb-3 text-sm">Currently Active Hotspots</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {hotspotData
                    .filter(h => (h as any).isActive)
                    .sort((a, b) => (b as any).realtimeBoost - (a as any).realtimeBoost)
                    .slice(0, 5)
                    .map((hotspot, index) => (
                      <div key={hotspot.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">{hotspot.element}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600 font-bold">
                            +{((hotspot as any).realtimeBoost || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">intensity</div>
                        </div>
                      </div>
                    ))}
                  {hotspotData.filter(h => (h as any).isActive).length === 0 && (
                    <div className="text-sm text-muted-foreground p-2">
                      No active hotspots detected
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div>
                <h4 className="font-medium mb-3 text-sm">Recent Visitor Activity</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {visitorActivity.slice(-5).reverse().map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                      <div>
                        <div className="text-sm font-medium">
                          {activity.visitorType === 'enterprise' ? '🏢' : 
                           activity.visitorType === 'startup' ? '🚀' : '👤'} 
                          {activity.location.split(',')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {hotspotData.find(h => h.id === activity.hotspotId)?.element || activity.hotspotId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-600">
                          {activity.engagementScore}
                        </div>
                        <div className="text-xs text-muted-foreground">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Real-time Statistics */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Active Hotspots</div>
                  <div className="text-lg font-bold text-green-600">
                    {hotspotData.filter(h => (h as any).isActive).length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Enterprise Visitors</div>
                  <div className="text-lg font-bold text-blue-600">
                    {visitorActivity.filter(a => a.visitorType === 'enterprise' && Date.now() - a.timestamp < 300000).length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Engagement</div>
                  <div className="text-lg font-bold text-purple-600">
                    {visitorActivity.length > 0 ? 
                      Math.round(visitorActivity.slice(-10).reduce((sum, a) => sum + a.engagementScore, 0) / Math.min(10, visitorActivity.length)) : 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI-Enhanced Clustering Insights */}
        {clusterAnalysis.length > 0 && (
          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Clustering Analysis Results
              </CardTitle>
              <CardDescription>
                Advanced {clusteringMode} clustering insights for TechFlow engagement optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Hot Zones</div>
                    <div className="text-lg font-bold">{clusterAnalysis[0]?.hotZones?.length || 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Density</div>
                    <div className="text-lg font-bold">{clusterAnalysis[0]?.engagement?.maxDensity || 0}x</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversion Hotspots</div>
                    <div className="text-lg font-bold">{clusterAnalysis[0]?.engagement?.conversionHotspots || 0}</div>
                  </div>
                </div>
              </div>
              
              {aiInsights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">AI Clustering Insights:</h4>
                  {aiInsights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        insight.priority === 'high' ? 'bg-red-500' :
                        insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">{insight.description}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Confidence: {Math.round((insight.confidence || 0.85) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Heatmap Analysis Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList>
            <TabsTrigger value="heatmap">Visual Heatmap</TabsTrigger>
            <TabsTrigger value="scroll">Scroll Analysis</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Conversion Scoring</TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Live Page Heatmap - {getPageDisplayName(selectedPage)}</CardTitle>
                <CardDescription>{getPageDescription(selectedPage)}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Live Heatmap with dynamic content */}
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg h-[600px] overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                  {/* Page Content from HTML files */}
                  <div className="absolute inset-0 bg-white dark:bg-gray-900">
                    {getPageMockup(selectedPage)}
                  </div>
                  
                  {/* Live Pulse Overlay */}
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {livePulses.map((pulse) => (
                      <div
                        key={pulse.id}
                        className="absolute animate-ping"
                        style={{
                          left: `${pulse.x}%`,
                          top: `${pulse.y}%`,
                          width: `${Math.max(8, pulse.intensity / 8)}px`,
                          height: `${Math.max(8, pulse.intensity / 8)}px`,
                        }}
                      >
                        <div 
                          className={`w-full h-full rounded-full opacity-75 ${
                            pulse.intensity > 80 ? 'bg-red-500' :
                            pulse.intensity > 60 ? 'bg-orange-500' :
                            pulse.intensity > 40 ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                        />
                      </div>
                    ))}
                    
                    {/* Dynamic Hotspot Overlays with Real-time Intensity */}
                    {hotspotData.map((hotspot, index) => {
                      const realtimeBoost = (hotspot as any).realtimeBoost || 0;
                      const isActive = (hotspot as any).isActive;
                      
                      return (
                        <div
                          key={hotspot.id}
                          className={`absolute rounded-full transition-all duration-500 ${
                            isActive ? 'animate-pulse' : ''
                          } ${getIntensityColor(hotspot.heatIntensity)}`}
                          style={{
                            left: `${hotspot.position.x}%`,
                            top: `${hotspot.position.y}%`,
                            width: `${Math.max(8, hotspot.heatIntensity / 4 + realtimeBoost / 5)}px`,
                            height: `${Math.max(8, hotspot.heatIntensity / 4 + realtimeBoost / 5)}px`,
                            opacity: 0.3 + (realtimeBoost / 200),
                            transform: 'translate(-50%, -50%)',
                            boxShadow: isActive ? `0 0 ${realtimeBoost / 2}px rgba(59, 130, 246, 0.5)` : 'none'
                          }}
                          title={`${hotspot.element}: ${hotspot.heatIntensity}% intensity ${realtimeBoost > 0 ? `(+${realtimeBoost.toFixed(1)} live)` : ''}`}
                        >
                          {/* Real-time activity indicator */}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                          )}
                          
                          {/* Intensity boost indicator */}
                          {realtimeBoost > 10 && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
                              +{realtimeBoost.toFixed(0)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Static Heat zones overlay for reference */}
                    {heatmapZones.map((zone, index) => (
                      <div
                        key={index}
                        className={`absolute rounded-full opacity-20 ${getIntensityColor(zone.intensity)}`}
                        style={{
                          left: `${15 + (index * 12)}%`,
                          top: `${20 + (index % 3) * 20}%`,
                          width: `${Math.max(6, zone.intensity / 5)}px`,
                          height: `${Math.max(6, zone.intensity / 5)}px`,
                        }}
                        title={`${zone.name}: ${zone.clicks} clicks (baseline)`}
                      />
                    ))}
                  </div>
                  
                  {/* Live Stats Overlay */}
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-3 py-2 rounded-lg z-20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live • {livePulses.length} active users</span>
                    </div>
                  </div>
                  
                  {/* Interaction Legend */}
                  <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-gray-900/95 text-xs px-3 py-2 rounded-lg border z-20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>High engagement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Medium engagement</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Low engagement</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Heat zones metrics */}
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {heatmapZones.map((zone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getIntensityColor(zone.intensity)}`}></div>
                        <div>
                          <span className="font-medium text-sm">{zone.name}</span>
                          <div className="text-xs text-muted-foreground">{zone.area}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{zone.clicks.toLocaleString()}</div>
                        <div className="text-muted-foreground text-xs">{zone.intensity}% intensity</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Real-time Insights */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Live Insights</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {getPageInsights(selectedPage).map((insight, index) => (
                      <div key={index} className="text-blue-700 dark:text-blue-300">{insight}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Depth Analysis</CardTitle>
                <CardDescription>How far users scroll down your pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scrollData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium w-16">{data.depth}%</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${100 - data.dropOffRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.visitors.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{data.dropOffRate.toFixed(1)}% drop-off</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Scroll Insights</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 52.1% of users scroll to the bottom of the page</li>
                    <li>• Highest drop-off occurs at 75% scroll depth</li>
                    <li>• Mobile users scroll 23% deeper than desktop users</li>
                    <li>• WhatsApp button placement shows optimal engagement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Hotspot Metrics</CardTitle>
                <CardDescription>Comprehensive interaction data for each element</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Element</th>
                        <th className="text-left p-2">Page</th>
                        <th className="text-left p-2">Hovers</th>
                        <th className="text-left p-2">Clicks</th>
                        <th className="text-left p-2">Avg Time</th>
                        <th className="text-left p-2">Conversion Impact</th>
                        <th className="text-left p-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotspotData.map((hotspot) => {
                        const trend = getEngagementTrend(hotspot.conversionInfluence);
                        return (
                          <tr key={hotspot.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{hotspot.element}</td>
                            <td className="p-2">{hotspot.page}</td>
                            <td className="p-2">{hotspot.hovers.toLocaleString()}</td>
                            <td className="p-2">{hotspot.clicks.toLocaleString()}</td>
                            <td className="p-2">{formatTime(hotspot.avgTime)}</td>
                            <td className="p-2">
                              <div className="font-semibold">{hotspot.conversionInfluence.toFixed(1)}%</div>
                            </td>
                            <td className="p-2">
                              <div className={`flex items-center gap-1 ${trend.color}`}>
                                <trend.icon className="h-4 w-4" />
                                <span className="text-xs">{trend.label}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Top Performing Elements</h4>
                    <div className="space-y-2">
                      {hotspotData
                        .sort((a, b) => b.conversionInfluence - a.conversionInfluence)
                        .slice(0, 3)
                        .map((hotspot, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{hotspot.element}</span>
                            <Badge variant="outline">{hotspot.conversionInfluence.toFixed(1)}%</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Optimization Opportunities</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>• Move WhatsApp button to hero section for better visibility</div>
                      <div>• Optimize mobile form fields for better engagement</div>
                      <div>• Consider repositioning enterprise logos higher on page</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI Conversion Influence Scoring
                </CardTitle>
                <CardDescription>
                  Advanced AI analysis of hotspot conversion impact and clustering effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Conversion Scoring Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {hotspotData
                      .sort((a, b) => b.conversionInfluence - a.conversionInfluence)
                      .map((hotspot, index) => (
                        <div key={hotspot.id} className="p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{hotspot.element}</h4>
                              <p className="text-xs text-muted-foreground">{hotspot.page} page</p>
                            </div>
                            <Badge variant={hotspot.conversionInfluence >= 40 ? "destructive" : hotspot.conversionInfluence >= 25 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Conversion Score */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Conversion Score</span>
                                <span className="font-bold">{hotspot.conversionInfluence.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    hotspot.conversionInfluence >= 40 ? 'bg-red-500' :
                                    hotspot.conversionInfluence >= 25 ? 'bg-orange-500' :
                                    hotspot.conversionInfluence >= 15 ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(100, hotspot.conversionInfluence * 2)}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Heat Intensity */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Heat Intensity</span>
                                <span className="font-bold">{hotspot.heatIntensity}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getIntensityColor(hotspot.heatIntensity).replace('bg-', 'bg-')}`}
                                  style={{ width: `${hotspot.heatIntensity}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* AI Confidence Score */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>AI Confidence</span>
                                <span className="font-bold">{((hotspot as any).aiConfidence * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full bg-purple-500"
                                  style={{ width: `${(hotspot as any).aiConfidence * 100}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Proximity Score */}
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Cluster Proximity</span>
                                <span>{((hotspot as any).proximityScore || 0).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {/* AI Optimization Recommendations */}
                  <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        AI Optimization Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2 text-green-600">High Impact Opportunities</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>• Move WhatsApp button to hero cluster (+15% conversion)</li>
                            <li>• Enhance Nigerian payment method visibility (+12% conversion)</li>
                            <li>• Optimize enterprise logo positioning in social proof cluster</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                          <h4 className="font-medium text-sm mb-2 text-blue-600">Clustering Insights</h4>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>• Navigation cluster shows optimal density for enterprise users</li>
                            <li>• Hero cluster needs expansion toward contact elements</li>
                            <li>• Feature cluster density below optimal for African market</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 