'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartSegmentList from '@/components/segments/SmartSegmentList';
import SmartSegmentDetail from '@/components/segments/SmartSegmentDetail';
import DashboardShell from '@/components/dashboard/dashboard-shell';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import { Sparkles } from 'lucide-react';

export default function SmartSegmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segmentId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState<string>(segmentId ? 'detail' : 'list');

  const handleSelectSegment = (id: string) => {
    router.push(`/dashboard/smart-segments?id=${id}`);
    setActiveTab('detail');
  };

  const handleBack = () => {
    router.push('/dashboard/smart-segments');
    setActiveTab('list');
  };

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Smart Segments" 
        description="AI-powered segments based on contact behavior and engagement patterns"
        icon={<Sparkles className="h-5 w-5 text-primary" />}
      />

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="hidden">
          <TabsTrigger value="list">All Segments</TabsTrigger>
          <TabsTrigger value="detail">Segment Details</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <SmartSegmentList onSelectSegment={handleSelectSegment} />
        </TabsContent>
        <TabsContent value="detail" className="space-y-4">
          {segmentId && (
            <SmartSegmentDetail 
              segmentId={segmentId} 
              onBack={handleBack}
            />
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
} 