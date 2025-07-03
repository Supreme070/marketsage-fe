"use client";

/**
 * AI Feedback Collection Interface
 * ===============================
 * 
 * Frontend interface for collecting user feedback on AI decisions and recommendations.
 * Connects to /api/ai/feedback API endpoints.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Send,
  Filter,
  Search,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  User,
  Bot,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AIFeedback {
  id: string;
  actionId: string;
  actionType: string;
  actionDescription: string;
  feedbackType: 'positive' | 'negative' | 'neutral';
  rating: number; // 1-5 stars
  comments?: string;
  userId: string;
  userName: string;
  timestamp: Date;
  category: string;
  tags: string[];
  helpfulnessScore?: number;
}

interface FeedbackAnalytics {
  totalFeedback: number;
  positiveRate: number;
  negativeRate: number;
  averageRating: number;
  topCategories: { category: string; count: number; sentiment: number }[];
  recentTrends: { date: string; positive: number; negative: number }[];
  improvementAreas: string[];
}

interface PendingAction {
  id: string;
  type: string;
  description: string;
  aiConfidence: number;
  timestamp: Date;
  status: 'pending_feedback' | 'collecting' | 'reviewed';
  customerName?: string;
  expectedOutcome?: string;
}

export default function AIFeedbackInterface() {
  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFeedbackData();
    const interval = setInterval(loadFeedbackData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      
      const [feedbackResponse, pendingResponse, analyticsResponse] = await Promise.all([
        fetch('/api/ai/feedback?action=list'),
        fetch('/api/ai/feedback?action=pending-actions'),
        fetch('/api/ai/feedback?action=analytics')
      ]);

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.data || []);
      }

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingActions(pendingData.data || []);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      }

    } catch (error) {
      console.error('Failed to load feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (actionId: string, feedbackType: 'positive' | 'negative' | 'neutral', rating: number, comments?: string) => {
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId,
          feedbackType,
          rating,
          comments,
          category: 'general' // Could be made dynamic
        })
      });

      if (response.ok) {
        await loadFeedbackData(); // Refresh data
      }

    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const QuickFeedbackCard = ({ action }: { action: PendingAction }) => {
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (feedbackType: 'positive' | 'negative' | 'neutral') => {
      setSubmitting(true);
      await submitFeedback(action.id, feedbackType, rating, comments);
      setSubmitting(false);
      setRating(0);
      setComments('');
    };

    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{action.type}</CardTitle>
              <CardDescription className="mt-1">{action.description}</CardDescription>
              {action.customerName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Customer: {action.customerName}
                </div>
              )}
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-xs">
                {(action.aiConfidence * 100).toFixed(0)}% confident
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(action.timestamp))} ago
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Star Rating */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Rate this recommendation:</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label className="text-sm">Additional feedback (optional):</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your thoughts on this AI recommendation..."
                className="mt-1 min-h-[60px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSubmit('positive')}
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSubmit('negative')}
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Not Helpful
              </Button>
              <Button
                size="sm"
                onClick={() => handleSubmit('neutral')}
                disabled={submitting || rating === 0}
              >
                <Send className="w-4 h-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'positive': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case 'neutral': return <MessageSquare className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading AI feedback data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            AI Feedback Collection
          </h1>
          <p className="text-muted-foreground">
            Help improve AI recommendations through your feedback and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadFeedbackData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
                  <div className="text-sm text-muted-foreground">Total Feedback</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{(analytics.positiveRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Positive Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg. Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{pendingActions.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Feedback ({pendingActions.length})</TabsTrigger>
          <TabsTrigger value="history">Feedback History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          <TabsTrigger value="improvements">AI Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actions Awaiting Your Feedback
              </CardTitle>
              <CardDescription>
                Recent AI recommendations that would benefit from your input
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground">No pending AI actions require feedback at this time.</p>
                  </div>
                ) : (
                  pendingActions.map((action) => (
                    <QuickFeedbackCard key={action.id} action={action} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="campaigns">Campaigns</option>
              <option value="segmentation">Segmentation</option>
              <option value="predictions">Predictions</option>
              <option value="recommendations">Recommendations</option>
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feedback History</CardTitle>
              <CardDescription>
                Complete history of feedback provided for AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {getFeedbackIcon(item.feedbackType)}
                      <div className="flex-1">
                        <div className="font-medium">{item.actionDescription}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.actionType} • {item.category}
                        </div>
                        {item.comments && (
                          <div className="text-sm bg-gray-50 p-2 rounded mt-2 italic">
                            "{item.comments}"
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>By {item.userName}</span>
                          <span>{formatDistanceToNow(new Date(item.timestamp))} ago</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${item.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant={item.feedbackType === 'positive' ? 'default' : item.feedbackType === 'negative' ? 'destructive' : 'secondary'}>
                      {item.feedbackType}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Feedback Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{category.count}</span>
                          <div className={`text-xs px-2 py-1 rounded ${
                            category.sentiment > 0.7 ? 'bg-green-100 text-green-800' :
                            category.sentiment > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(category.sentiment * 100).toFixed(0)}% positive
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Improvement Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Model Improvements
              </CardTitle>
              <CardDescription>
                How your feedback is being used to improve AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Campaign Timing Optimization</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Based on your feedback, we've improved email send time predictions by 23%
                      </p>
                      <div className="text-xs text-green-600 mt-2">Implemented 3 days ago</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Segmentation Accuracy</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Customer segmentation models now incorporate feedback-based behavioral indicators
                      </p>
                      <div className="text-xs text-blue-600 mt-2">Training in progress</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-800">Churn Prediction Enhancement</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Negative feedback patterns now help identify at-risk customers 18% earlier
                      </p>
                      <div className="text-xs text-purple-600 mt-2">Deployed last week</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}