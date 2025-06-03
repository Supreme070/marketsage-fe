'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Download, Brain, Users, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Contact } from '@/lib/smart-segmentation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SmartSegmentDetailProps {
  segmentId: string;
  onBack?: () => void;
}

interface SegmentDetails {
  id: string;
  name: string;
  description: string;
  rules: string;
  score: number;
  estimatedCount: number;
}

export default function SmartSegmentDetail({ segmentId, onBack }: SmartSegmentDetailProps) {
  const [segment, setSegment] = useState<SegmentDetails | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (segmentId) {
      fetchSegmentDetails();
      fetchSegmentContacts();
    }
  }, [segmentId]);

  const fetchSegmentDetails = async () => {
    try {
      setLoading(true);
      // First, get all segments and find the one we need
      const response = await fetch('/api/segments/smart');
      if (!response.ok) {
        throw new Error('Failed to fetch segment details');
      }
      const data = await response.json();
      const currentSegment = data.find((s: SegmentDetails) => s.id === segmentId);
      
      if (currentSegment) {
        setSegment(currentSegment);
      } else {
        throw new Error('Segment not found');
      }
    } catch (error) {
      console.error('Error fetching segment details:', error);
      toast.error('Failed to load segment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentContacts = async (page = 0) => {
    try {
      setLoadingContacts(true);
      const response = await fetch('/api/segments/smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segmentId,
          limit,
          offset: page * limit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch segment contacts');
      }

      const data = await response.json();
      
      if (page === 0) {
        setContacts(data.contacts);
      } else {
        setContacts(prev => [...prev, ...data.contacts]);
      }
      
      setCurrentPage(page);
      setHasMore(data.contacts.length >= limit);
    } catch (error) {
      console.error('Error fetching segment contacts:', error);
      toast.error('Failed to load segment contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleCreateList = async () => {
    toast.info('Creating list from segment...', {
      description: 'This feature is coming soon.',
    });
  };

  const handleExportContacts = async () => {
    toast.info('Exporting contacts...', {
      description: 'This feature is coming soon.',
    });
  };

  const loadMoreContacts = () => {
    fetchSegmentContacts(currentPage + 1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-6 w-1/3" />
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">Segment Not Found</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              The requested segment could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rules = JSON.parse(segment.rules);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Brain size={20} />
          <h2 className="text-xl font-bold">{segment.name}</h2>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{segment.name}</CardTitle>
              <CardDescription>{segment.description}</CardDescription>
            </div>
            <Badge className={`${segment.score >= 0.8 ? 'bg-green-500' : segment.score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              {segment.score >= 0.8 ? 'High' : segment.score >= 0.5 ? 'Medium' : 'Low'} Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Segment Definition</h4>
              <div className="bg-muted p-3 rounded-md text-sm">
                <div>
                  <span className="font-medium">Conditions:</span> {rules.operator}
                </div>
                <ul className="list-disc list-inside mt-1 pl-4 space-y-1">
                  {rules.conditions.map((condition: any, index: number) => (
                    <li key={index}>
                      {condition.field} {condition.operator} {condition.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={handleCreateList}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create List
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleExportContacts}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={18} />
              Contacts in Segment
            </CardTitle>
            <Badge variant="outline">{segment.estimatedCount} estimated</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingContacts && contacts.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No contacts found in this segment.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                      <TableCell>{contact.email || '—'}</TableCell>
                      <TableCell>{contact.company || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {hasMore && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreContacts} 
                    disabled={loadingContacts}
                  >
                    {loadingContacts && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 