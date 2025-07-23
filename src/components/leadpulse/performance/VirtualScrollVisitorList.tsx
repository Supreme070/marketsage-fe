/**
 * Virtual Scroll Visitor List Component
 * 
 * High-performance virtual scrolling for large visitor lists with
 * intelligent windowing, progressive loading, and memory optimization.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  MapPin,
  Activity,
  Eye,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Star,
  Heart,
  Bookmark,
  Flag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Share,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Loader2,
  Database,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import type { VisitorLocation } from '@/lib/leadpulse/dataProvider';

interface VirtualScrollVisitor extends VisitorLocation {
  engagementScore: number;
  conversionProbability: number;
  sessionDuration: number;
  pageViews: number;
  lastSeen: Date;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  status: 'active' | 'idle' | 'converted' | 'bounced';
  value: number;
  tags: string[];
  source: string;
  campaign?: string;
}

interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  buffer: number;
  chunkSize: number;
  maxMemoryItems: number;
  preloadDistance: number;
}

interface FilterCriteria {
  searchTerm: string;
  status: string[];
  deviceType: string[];
  minEngagement: number;
  maxEngagement: number;
  minValue: number;
  maxValue: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
  source: string[];
}

interface SortConfig {
  field: keyof VirtualScrollVisitor;
  direction: 'asc' | 'desc';
}

interface VirtualScrollVisitorListProps {
  visitors: VirtualScrollVisitor[];
  onVisitorClick?: (visitor: VirtualScrollVisitor) => void;
  onVisitorSelect?: (visitors: VirtualScrollVisitor[]) => void;
  enableMultiSelect?: boolean;
  enableVirtualization?: boolean;
  virtualScrollConfig?: Partial<VirtualScrollConfig>;
  initialFilters?: Partial<FilterCriteria>;
  initialSort?: SortConfig;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableExport?: boolean;
  maxDisplayItems?: number;
}

/**
 * Virtual Scroll Visitor List Component
 */
export function VirtualScrollVisitorList({
  visitors,
  onVisitorClick,
  onVisitorSelect,
  enableMultiSelect = false,
  enableVirtualization = true,
  virtualScrollConfig = {},
  initialFilters = {},
  initialSort = { field: 'lastSeen', direction: 'desc' },
  enableSearch = true,
  enableFilters = true,
  enableExport = true,
  maxDisplayItems = 10000
}: VirtualScrollVisitorListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: '',
    status: [],
    deviceType: [],
    minEngagement: 0,
    maxEngagement: 100,
    minValue: 0,
    maxValue: 10000,
    dateRange: { start: null, end: null },
    tags: [],
    source: [],
    ...initialFilters
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>(initialSort);
  const [showFilters, setShowFilters] = useState(false);
  const [loadedChunks, setLoadedChunks] = useState<Set<number>>(new Set());
  const [memoryCache, setMemoryCache] = useState<Map<string, VirtualScrollVisitor>>(new Map());

  // Virtual scroll configuration
  const config: VirtualScrollConfig = {
    itemHeight: 80,
    containerHeight: 600,
    buffer: 5,
    chunkSize: 50,
    maxMemoryItems: 1000,
    preloadDistance: 200,
    ...virtualScrollConfig
  };

  // Filter and sort visitors
  const filteredAndSortedVisitors = useMemo(() => {
    setIsLoading(true);
    
    let filtered = visitors.filter(visitor => {
      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (
          !visitor.city.toLowerCase().includes(searchTerm) &&
          !visitor.country.toLowerCase().includes(searchTerm) &&
          !visitor.id.toLowerCase().includes(searchTerm) &&
          !visitor.source.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(visitor.status)) {
        return false;
      }

      // Device type filter
      if (filters.deviceType.length > 0 && !filters.deviceType.includes(visitor.deviceType)) {
        return false;
      }

      // Engagement range filter
      if (visitor.engagementScore < filters.minEngagement || visitor.engagementScore > filters.maxEngagement) {
        return false;
      }

      // Value range filter
      if (visitor.value < filters.minValue || visitor.value > filters.maxValue) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start && visitor.lastSeen < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && visitor.lastSeen > filters.dateRange.end) {
        return false;
      }

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => visitor.tags.includes(tag))) {
        return false;
      }

      // Source filter
      if (filters.source.length > 0 && !filters.source.includes(visitor.source)) {
        return false;
      }

      return true;
    });

    // Sort visitors
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    // Limit to max display items for performance
    if (filtered.length > maxDisplayItems) {
      filtered = filtered.slice(0, maxDisplayItems);
    }

    setIsLoading(false);
    return filtered;
  }, [visitors, filters, sortConfig, maxDisplayItems]);

  // Virtual scrolling calculations
  const virtualScrollData = useMemo(() => {
    if (!enableVirtualization) {
      return {
        totalHeight: filteredAndSortedVisitors.length * config.itemHeight,
        visibleItems: filteredAndSortedVisitors,
        startIndex: 0,
        endIndex: filteredAndSortedVisitors.length - 1,
        offsetY: 0
      };
    }

    const visibleCount = Math.ceil(config.containerHeight / config.itemHeight);
    const startIndex = Math.floor(scrollTop / config.itemHeight);
    const endIndex = Math.min(
      startIndex + visibleCount + config.buffer * 2,
      filteredAndSortedVisitors.length - 1
    );

    const visibleItems = filteredAndSortedVisitors.slice(
      Math.max(0, startIndex - config.buffer),
      endIndex + 1
    );

    const offsetY = Math.max(0, startIndex - config.buffer) * config.itemHeight;
    const totalHeight = filteredAndSortedVisitors.length * config.itemHeight;

    return {
      totalHeight,
      visibleItems,
      startIndex: Math.max(0, startIndex - config.buffer),
      endIndex,
      offsetY
    };
  }, [filteredAndSortedVisitors, scrollTop, config, enableVirtualization]);

  // Progressive loading for large datasets
  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (loadedChunks.has(chunkIndex)) return;
    
    const startIndex = chunkIndex * config.chunkSize;
    const endIndex = Math.min(startIndex + config.chunkSize, visitors.length);
    
    // Simulate async loading (in real implementation, this would fetch from API)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add to memory cache
    const newCache = new Map(memoryCache);
    for (let i = startIndex; i < endIndex; i++) {
      if (visitors[i]) {
        newCache.set(visitors[i].id, visitors[i]);
      }
    }
    
    // Manage memory cache size
    if (newCache.size > config.maxMemoryItems) {
      const keysToDelete = Array.from(newCache.keys()).slice(0, newCache.size - config.maxMemoryItems);
      keysToDelete.forEach(key => newCache.delete(key));
    }
    
    setMemoryCache(newCache);
    setLoadedChunks(prev => new Set(prev).add(chunkIndex));
  }, [loadedChunks, memoryCache, config.chunkSize, config.maxMemoryItems, visitors]);

  // Handle scroll with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    
    // Progressive loading
    if (enableVirtualization) {
      const scrollBottom = target.scrollTop + target.clientHeight;
      const shouldPreload = virtualScrollData.totalHeight - scrollBottom < config.preloadDistance;
      
      if (shouldPreload) {
        const currentChunk = Math.floor(target.scrollTop / (config.chunkSize * config.itemHeight));
        const nextChunk = currentChunk + 1;
        
        if (nextChunk * config.chunkSize < visitors.length) {
          loadChunk(nextChunk);
        }
      }
    }
  }, [enableVirtualization, virtualScrollData.totalHeight, config.preloadDistance, config.chunkSize, config.itemHeight, visitors.length, loadChunk]);

  // Handle visitor selection
  const handleVisitorSelect = useCallback((visitor: VirtualScrollVisitor, selected: boolean) => {
    const newSelected = new Set(selectedVisitors);
    if (selected) {
      newSelected.add(visitor.id);
    } else {
      newSelected.delete(visitor.id);
    }
    setSelectedVisitors(newSelected);
    
    if (onVisitorSelect) {
      const selectedVisitorObjects = filteredAndSortedVisitors.filter(v => newSelected.has(v.id));
      onVisitorSelect(selectedVisitorObjects);
    }
  }, [selectedVisitors, onVisitorSelect, filteredAndSortedVisitors]);

  // Handle sort change
  const handleSortChange = useCallback((field: keyof VirtualScrollVisitor) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Update filters
  const updateFilters = useCallback((updates: Partial<FilterCriteria>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Export selected visitors
  const exportSelectedVisitors = useCallback(() => {
    const selectedVisitorObjects = filteredAndSortedVisitors.filter(v => selectedVisitors.has(v.id));
    const exportData = {
      visitors: selectedVisitorObjects,
      filters,
      sortConfig,
      exportedAt: new Date().toISOString(),
      totalSelected: selectedVisitors.size
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredAndSortedVisitors, selectedVisitors, filters, sortConfig]);

  // Load initial chunks
  useEffect(() => {
    if (enableVirtualization) {
      loadChunk(0);
    }
  }, [enableVirtualization, loadChunk]);

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return Monitor;
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'converted': return 'bg-blue-500';
      case 'bounced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Visitor List ({filteredAndSortedVisitors.length.toLocaleString()} visitors)
          </CardTitle>
          <CardDescription>
            High-performance virtual scrolling with advanced filtering and sorting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              {enableSearch && (
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search visitors..."
                    value={filters.searchTerm}
                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>
              )}
              
              {enableFilters && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}
              
              {enableExport && selectedVisitors.size > 0 && (
                <Button
                  variant="outline"
                  onClick={exportSelectedVisitors}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export ({selectedVisitors.size})
                </Button>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="space-y-1">
                    {['active', 'idle', 'converted', 'bounced'].map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={status}
                          checked={filters.status.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({ status: [...filters.status, status] });
                            } else {
                              updateFilters({ status: filters.status.filter(s => s !== status) });
                            }
                          }}
                        />
                        <label htmlFor={status} className="text-sm capitalize">{status}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Type</label>
                  <div className="space-y-1">
                    {['desktop', 'mobile', 'tablet'].map(device => (
                      <div key={device} className="flex items-center space-x-2">
                        <Checkbox
                          id={device}
                          checked={filters.deviceType.includes(device)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({ deviceType: [...filters.deviceType, device] });
                            } else {
                              updateFilters({ deviceType: filters.deviceType.filter(d => d !== device) });
                            }
                          }}
                        />
                        <label htmlFor={device} className="text-sm capitalize">{device}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Engagement Score</label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minEngagement}
                      onChange={(e) => updateFilters({ minEngagement: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxEngagement}
                      onChange={(e) => updateFilters({ maxEngagement: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {virtualScrollData.visibleItems.length} of {filteredAndSortedVisitors.length} visitors
              </span>
              <span>
                Virtual scrolling: {enableVirtualization ? 'Enabled' : 'Disabled'}
              </span>
              {selectedVisitors.size > 0 && (
                <span>
                  {selectedVisitors.size} selected
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Scroll Container */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative overflow-auto"
            style={{ height: config.containerHeight }}
            onScroll={handleScroll}
          >
            {/* Total height spacer */}
            <div style={{ height: virtualScrollData.totalHeight }} />
            
            {/* Visible items */}
            <div
              ref={listRef}
              className="absolute top-0 left-0 right-0"
              style={{ transform: `translateY(${virtualScrollData.offsetY}px)` }}
            >
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading visitors...</span>
                </div>
              )}
              
              {virtualScrollData.visibleItems.map((visitor, index) => {
                const DeviceIcon = getDeviceIcon(visitor.deviceType);
                const isSelected = selectedVisitors.has(visitor.id);
                
                return (
                  <div
                    key={visitor.id}
                    className={`flex items-center gap-4 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    style={{ height: config.itemHeight }}
                    onClick={() => onVisitorClick?.(visitor)}
                  >
                    {/* Selection checkbox */}
                    {enableMultiSelect && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleVisitorSelect(visitor, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(visitor.status)}`} />
                    
                    {/* Visitor info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{visitor.city}, {visitor.country}</span>
                        <DeviceIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Score: {visitor.engagementScore}</span>
                        <span>Value: ${visitor.value}</span>
                        <span>Pages: {visitor.pageViews}</span>
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{visitor.conversionProbability}%</div>
                        <div className="text-gray-500">Conversion</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{Math.round(visitor.sessionDuration / 60)}m</div>
                        <div className="text-gray-500">Duration</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VirtualScrollVisitorList;