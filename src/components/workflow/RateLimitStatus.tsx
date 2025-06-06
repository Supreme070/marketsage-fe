'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Mail, MessageSquare, Zap } from 'lucide-react';

interface RateLimitInfo {
  type: string;
  limit: number;
  remaining: number;
  resetTime: number;
  percentage: number;
}

interface RateLimitStatusProps {
  userId?: string;
  showDetails?: boolean;
}

export function RateLimitStatus({ userId, showDetails = true }: RateLimitStatusProps) {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRateLimits();
    const interval = setInterval(fetchRateLimits, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  const fetchRateLimits = async () => {
    try {
      const response = await fetch('/api/rate-limits/status');
      if (response.ok) {
        const data = await response.json();
        setRateLimits(data.rateLimits || []);
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'workflow': return <Zap className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (percentage: number): "destructive" | "default" | "secondary" | "outline" => {
    if (percentage > 80) return 'destructive';
    if (percentage > 60) return 'secondary';
    return 'default';
  };

  const formatTimeRemaining = (resetTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showDetails) {
    // Compact view - just show warning if any limits are close
    const warnings = rateLimits.filter(limit => limit.percentage > 80);
    if (warnings.length === 0) return null;

    return (
      <div className="flex items-center space-x-2 text-sm text-orange-600">
        <Clock className="w-4 h-4" />
        <span>Rate limits: {warnings.length} near limit</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rateLimits.map((limit) => (
          <div key={limit.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getIcon(limit.type)}
                <span className="text-sm font-medium capitalize">{limit.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(limit.percentage)} className="text-xs">
                  {limit.remaining}/{limit.limit}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatTimeRemaining(limit.resetTime)}
                </span>
              </div>
            </div>
            <Progress 
              value={limit.percentage} 
              className="h-2"
              // @ts-ignore
              indicatorClassName={
                limit.percentage > 80 ? 'bg-red-500' : 
                limit.percentage > 60 ? 'bg-yellow-500' : 
                'bg-green-500'
              }
            />
          </div>
        ))}
        
        {rateLimits.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No rate limit data available
          </div>
        )}
      </CardContent>
    </Card>
  );
} 