'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Brain, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { SegmentPreview } from '@/lib/smart-segmentation';

interface SmartSegmentListProps {
  onSelectSegment?: (segmentId: string) => void;
}

export default function SmartSegmentList({ onSelectSegment }: SmartSegmentListProps) {
  const [segments, setSegments] = useState<SegmentPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v2/segments/smart');
      if (!response.ok) {
        throw new Error('Failed to fetch smart segments');
      }
      const data = await response.json();
      setSegments(data);
    } catch (error) {
      console.error('Error fetching smart segments:', error);
      toast.error('Failed to load smart segments');
    } finally {
      setLoading(false);
    }
  };

  const refreshSegments = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/segments/smart?refresh=true');
      if (!response.ok) {
        throw new Error('Failed to refresh smart segments');
      }
      const data = await response.json();
      setSegments(data);
      toast.success('Smart segments refreshed');
    } catch (error) {
      console.error('Error refreshing smart segments:', error);
      toast.error('Failed to refresh smart segments');
    } finally {
      setRefreshing(false);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) {
      return <Badge className="bg-green-500">High Confidence</Badge>;
    } else if (score >= 0.5) {
      return <Badge className="bg-yellow-500">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-500">Low Confidence</Badge>;
    }
  };

  const handleSelectSegment = (segmentId: string) => {
    if (onSelectSegment) {
      onSelectSegment(segmentId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Smart Segments</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Brain size={20} />
          Smart Segments
        </h3>
        <Button variant="outline" size="sm" onClick={refreshSegments} disabled={refreshing}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {segments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No smart segments available.
          </CardContent>
        </Card>
      ) : (
        segments.map((segment) => (
          <Card 
            key={segment.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleSelectSegment(segment.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{segment.name}</CardTitle>
              <CardDescription>{segment.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getConfidenceBadge(segment.score)}
                  <span className="text-sm text-muted-foreground">
                    ~{segment.estimatedCount} contacts
                  </span>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users size={16} className="text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 