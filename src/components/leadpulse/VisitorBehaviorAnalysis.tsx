'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  MousePointer, 
  ArrowUpRight, 
  Clock, 
  Calendar, 
  Filter,
  BarChart2
} from 'lucide-react';

interface HeatMapPoint {
  x: number;
  y: number;
  intensity: number; // 0-100
}

interface PageSection {
  id: string;
  name: string;
  engagementScore: number;
  timeSpent: number; // seconds
  scrollDepth: number; // percentage
  clickCount: number;
}

interface PageData {
  url: string;
  title: string;
  visits: number;
  heatmapData: HeatMapPoint[];
  sections: PageSection[];
}

interface VisitorBehaviorAnalysisProps {
  data?: PageData[];
  isLoading?: boolean;
}

// Color utilities for heatmap
const getHeatmapColor = (intensity: number): string => {
  // Convert intensity (0-100) to a color gradient from blue (cold) to red (hot)
  if (intensity < 20) return 'rgba(59, 130, 246, 0.5)'; // blue-500 with opacity
  if (intensity < 40) return 'rgba(16, 185, 129, 0.5)'; // green-500 with opacity
  if (intensity < 60) return 'rgba(245, 158, 11, 0.5)'; // amber-500 with opacity
  if (intensity < 80) return 'rgba(249, 115, 22, 0.5)'; // orange-500 with opacity
  return 'rgba(239, 68, 68, 0.5)'; // red-500 with opacity
};

export default function VisitorBehaviorAnalysis({
  data = [],
  isLoading = false
}: VisitorBehaviorAnalysisProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'sections'>('heatmap');
  const [heatMapType, setHeatMapType] = useState<'clicks' | 'movement'>('clicks');
  
  // Generate mock data if none is provided
  useEffect(() => {
    if (data.length === 0) {
      const mockPages: PageData[] = [
        {
          url: '/products',
          title: 'Product Listing Page',
          visits: 1245,
          heatmapData: Array(50).fill(0).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            intensity: Math.random() * 100
          })),
          sections: [
            { id: 's1', name: 'Header Navigation', engagementScore: 78, timeSpent: 12, scrollDepth: 100, clickCount: 145 },
            { id: 's2', name: 'Featured Products', engagementScore: 92, timeSpent: 45, scrollDepth: 100, clickCount: 278 },
            { id: 's3', name: 'Category Filters', engagementScore: 65, timeSpent: 28, scrollDepth: 100, clickCount: 89 },
            { id: 's4', name: 'Product Grid', engagementScore: 88, timeSpent: 124, scrollDepth: 85, clickCount: 312 },
            { id: 's5', name: 'Footer Links', engagementScore: 23, timeSpent: 5, scrollDepth: 30, clickCount: 18 }
          ]
        },
        {
          url: '/pricing',
          title: 'Pricing Page',
          visits: 876,
          heatmapData: Array(40).fill(0).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            intensity: Math.random() * 100
          })),
          sections: [
            { id: 's1', name: 'Header Navigation', engagementScore: 71, timeSpent: 10, scrollDepth: 100, clickCount: 98 },
            { id: 's2', name: 'Pricing Tiers', engagementScore: 94, timeSpent: 68, scrollDepth: 100, clickCount: 215 },
            { id: 's3', name: 'Feature Comparison', engagementScore: 87, timeSpent: 45, scrollDepth: 92, clickCount: 124 },
            { id: 's4', name: 'FAQs', engagementScore: 42, timeSpent: 15, scrollDepth: 45, clickCount: 32 },
            { id: 's5', name: 'CTA Buttons', engagementScore: 76, timeSpent: 12, scrollDepth: 100, clickCount: 187 }
          ]
        },
        {
          url: '/about',
          title: 'About Us Page',
          visits: 542,
          heatmapData: Array(35).fill(0).map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            intensity: Math.random() * 100
          })),
          sections: [
            { id: 's1', name: 'Header Navigation', engagementScore: 68, timeSpent: 8, scrollDepth: 100, clickCount: 78 },
            { id: 's2', name: 'Company Story', engagementScore: 72, timeSpent: 45, scrollDepth: 95, clickCount: 32 },
            { id: 's3', name: 'Team Members', engagementScore: 84, timeSpent: 62, scrollDepth: 88, clickCount: 156 },
            { id: 's4', name: 'Mission Statement', engagementScore: 65, timeSpent: 28, scrollDepth: 75, clickCount: 12 },
            { id: 's5', name: 'Contact Form', engagementScore: 79, timeSpent: 34, scrollDepth: 65, clickCount: 98 }
          ]
        }
      ];
      // Mock implementation - in a real app, we'd set this to state
      // For now we'll use the mock data directly
    }
  }, [data]);
  
  // Get the currently selected page data
  const selectedPage = data[selectedPageIndex] || {
    url: '/products',
    title: 'Product Listing Page',
    visits: 1245,
    heatmapData: Array(50).fill(0).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random() * 100
    })),
    sections: [
      { id: 's1', name: 'Header Navigation', engagementScore: 78, timeSpent: 12, scrollDepth: 100, clickCount: 145 },
      { id: 's2', name: 'Featured Products', engagementScore: 92, timeSpent: 45, scrollDepth: 100, clickCount: 278 },
      { id: 's3', name: 'Category Filters', engagementScore: 65, timeSpent: 28, scrollDepth: 100, clickCount: 89 },
      { id: 's4', name: 'Product Grid', engagementScore: 88, timeSpent: 124, scrollDepth: 85, clickCount: 312 },
      { id: 's5', name: 'Footer Links', engagementScore: 23, timeSpent: 5, scrollDepth: 30, clickCount: 18 }
    ]
  };

  // Render heatmap visualization
  const renderHeatmap = () => {
    return (
      <div className="relative w-full h-[400px] border rounded-md bg-white">
        {/* Browser mockup header */}
        <div className="h-8 bg-gray-100 border-b flex items-center px-3 rounded-t-md">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="mx-auto text-xs text-gray-500 flex items-center">
            <span>{selectedPage.url}</span>
          </div>
        </div>
        
        {/* Heatmap overlay */}
        <div className="p-4 relative h-[calc(400px-2rem)]">
          {/* Page content mockup */}
          <div className="absolute inset-0 opacity-5">
            {/* Header section */}
            <div className="h-16 w-full bg-gray-800 mb-4"></div>
            
            {/* Hero section */}
            <div className="h-40 w-full bg-gray-200 mb-4 flex items-center justify-center">
              <div className="w-1/2 h-10 bg-gray-400"></div>
            </div>
            
            {/* Content grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-300"></div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="h-24 w-full bg-gray-800"></div>
          </div>
          
          {/* Heatmap points */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {selectedPage.heatmapData.map((point, index) => (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={point.intensity / 10 + 2}
                fill="url(#heatGradient)"
                color={getHeatmapColor(point.intensity)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{ 
                  delay: index * 0.01, 
                  duration: 0.5
                }}
              />
            ))}
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-white/80 p-2 rounded-md border text-xs">
            <div className="font-medium mb-1">Engagement Intensity</div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2 bg-blue-500/50"></div>
              <div className="w-4 h-2 bg-green-500/50"></div>
              <div className="w-4 h-2 bg-amber-500/50"></div>
              <div className="w-4 h-2 bg-orange-500/50"></div>
              <div className="w-4 h-2 bg-red-500/50"></div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render sections analysis
  const renderSectionAnalysis = () => {
    return (
      <div className="space-y-4">
        {selectedPage.sections.map((section, index) => (
          <motion.div 
            key={section.id}
            className="border rounded-md p-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{section.name}</div>
              <div className="text-sm flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Engagement:</span>
                <div className={`px-2 py-0.5 rounded-full text-white text-xs ${
                  section.engagementScore > 80 ? 'bg-green-500' :
                  section.engagementScore > 60 ? 'bg-blue-500' :
                  section.engagementScore > 40 ? 'bg-amber-500' :
                  section.engagementScore > 20 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}>
                  {section.engagementScore}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="border rounded-md p-2 flex flex-col items-center justify-center">
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Time Spent
                </div>
                <div className="font-medium text-sm">
                  {section.timeSpent < 60 ? 
                    `${section.timeSpent}s` : 
                    `${Math.floor(section.timeSpent / 60)}m ${section.timeSpent % 60}s`}
                </div>
              </div>
              
              <div className="border rounded-md p-2 flex flex-col items-center justify-center">
                <div className="text-xs text-muted-foreground flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  Scroll Depth
                </div>
                <div className="font-medium text-sm">
                  {section.scrollDepth}%
                </div>
              </div>
              
              <div className="border rounded-md p-2 flex flex-col items-center justify-center">
                <div className="text-xs text-muted-foreground flex items-center">
                  <MousePointer className="w-3 h-3 mr-1" />
                  Clicks
                </div>
                <div className="font-medium text-sm">
                  {section.clickCount}
                </div>
              </div>
            </div>
            
            {/* Engagement bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Engagement Level</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${
                    section.engagementScore > 80 ? 'bg-green-500' :
                    section.engagementScore > 60 ? 'bg-blue-500' :
                    section.engagementScore > 40 ? 'bg-amber-500' :
                    section.engagementScore > 20 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${section.engagementScore}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                ></motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Visitor Behavior Analysis</CardTitle>
            <CardDescription>
              Understanding how visitors interact with your pages
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setSelectedPageIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedPageIndex === 0}
            >
              Previous
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setSelectedPageIndex(prev => Math.min((data.length || 3) - 1, prev + 1))}
              disabled={selectedPageIndex === (data.length || 3) - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-pulse">Analyzing visitor behavior...</div>
          </div>
        ) : (
          <>
            {/* Page info */}
            <div className="bg-muted rounded-lg p-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Page</div>
                  <div className="font-medium">{selectedPage.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{selectedPage.url}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Visits</div>
                    <div className="text-xl font-bold">{selectedPage.visits.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg. Time on Page</div>
                    <div className="text-xl font-bold">
                      {Math.floor(selectedPage.sections.reduce((sum, s) => sum + s.timeSpent, 0) / selectedPage.sections.length / 60)}m {Math.floor(selectedPage.sections.reduce((sum, s) => sum + s.timeSpent, 0) / selectedPage.sections.length % 60)}s
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visualization tabs */}
            <Tabs defaultValue="heatmap" className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger 
                    value="heatmap" 
                    onClick={() => setActiveTab('heatmap')}
                  >
                    Heatmap
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sections" 
                    onClick={() => setActiveTab('sections')}
                  >
                    Page Sections
                  </TabsTrigger>
                </TabsList>
                
                {activeTab === 'heatmap' && (
                  <div className="flex gap-1">
                    <Button 
                      variant={heatMapType === 'clicks' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setHeatMapType('clicks')}
                    >
                      <MousePointer className="h-3 w-3 mr-1" />
                      Clicks
                    </Button>
                    <Button 
                      variant={heatMapType === 'movement' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setHeatMapType('movement')}
                    >
                      <MousePointer className="h-3 w-3 mr-1" />
                      Movement
                    </Button>
                  </div>
                )}
              </div>
              
              <TabsContent value="heatmap" className="mt-0">
                {renderHeatmap()}
              </TabsContent>
              
              <TabsContent value="sections" className="mt-0">
                {renderSectionAnalysis()}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
} 