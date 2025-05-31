import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useContentAnalysis } from '@/hooks/useSupremeAI';
import { Activity, FileText } from 'lucide-react';

export default function SupremeContentPanel({ userId }: { userId: string }) {
  const { analyze, loading, lastAnalysis, supremeScore } = useContentAnalysis(userId);
  const [content, setContent] = useState('');

  const handleAnalyze = async () => {
    if (content.trim()) {
      await analyze(content);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          Content Intelligence
        </CardTitle>
        <CardDescription>Run Supreme-AI analysis on your marketing content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Paste or type your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px]"
        />
        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? <Activity className="h-4 w-4 animate-spin mr-2" /> : null}
          Analyze Content
        </Button>

        {lastAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supreme Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">{supremeScore}/100</div>
                  <div className="text-sm text-muted-foreground">Overall Quality</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sentiment</span>
                  <Badge variant="secondary">{(lastAnalysis.sentiment * 100).toFixed(1)}%</Badge>
                </div>
                <Progress value={lastAnalysis.readability} />
                <div className="flex justify-between text-sm">
                  <span>Engagement</span>
                  <Badge variant="secondary">{lastAnalysis.engagement.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 