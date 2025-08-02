"use client";

/**
 * Model Training Management Interface
 * ==================================
 * 
 * Frontend interface for managing ML model training operations.
 * Connects to /api/ml/training API endpoints.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain,
  Cpu,
  BarChart3,
  TrendingUp,
  Zap,
  Play,
  Pause,
  Square,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Target,
  Database,
  Activity,
  LineChart,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TrainingJob {
  id: string;
  modelType: 'churn_prediction' | 'clv_prediction' | 'customer_segmentation' | 'behavioral_scoring';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  datasetSize: number;
  accuracy?: number;
  metrics?: {
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
    mse?: number;
    r2Score?: number;
  };
  hyperparameters: Record<string, any>;
  logs: string[];
  error?: string;
}

interface ModelMetrics {
  modelType: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
  trainingDataSize: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  predictionCount: number;
  isActive: boolean;
}

interface TrainingSchedule {
  id: string;
  modelType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: Date;
  isEnabled: boolean;
  autoRetrain: boolean;
  accuracyThreshold: number;
}

export default function ModelTrainingInterface() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [schedules, setSchedules] = useState<TrainingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTrainingData();
    const interval = setInterval(loadTrainingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      
      const [jobsResponse, modelsResponse, schedulesResponse] = await Promise.all([
        fetch('/api/v2/ml/training?action=list-jobs'),
        fetch('/api/v2/ml/training?action=model-metrics'),
        fetch('/api/v2/ml/training?action=schedules')
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data || []);
      }

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        setModels(modelsData.data || []);
      }

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.data || []);
      }

    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTraining = async (modelType: string, hyperparameters = {}) => {
    try {
      const response = await fetch('/api/v2/ml/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-training',
          modelType,
          hyperparameters
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Training started:', result);
        await loadTrainingData();
      }

    } catch (error) {
      console.error('Failed to start training:', error);
    }
  };

  const stopTraining = async (jobId: string) => {
    try {
      const response = await fetch('/api/v2/ml/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop-training',
          jobId
        })
      });

      if (response.ok) {
        await loadTrainingData();
      }

    } catch (error) {
      console.error('Failed to stop training:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <Square className="w-4 h-4 text-gray-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running': return 'border-blue-500 bg-blue-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      case 'cancelled': return 'border-gray-500 bg-gray-50';
      case 'pending': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'churn_prediction': return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'clv_prediction': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'customer_segmentation': return <Users className="w-5 h-5 text-blue-500" />;
      case 'behavioral_scoring': return <Target className="w-5 h-5 text-purple-500" />;
      default: return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatModelType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">Loading model training data...</p>
          </div>
        </div>
      </div>
    );
  }

  const runningJobs = jobs.filter(job => job.status === 'running');
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            Model Training Center
          </h1>
          <p className="text-muted-foreground">
            Manage ML model training, schedules, and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadTrainingData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{runningJobs.length}</div>
                <div className="text-sm text-muted-foreground">Active Training</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{models.filter(m => m.isActive).length}</div>
                <div className="text-sm text-muted-foreground">Active Models</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length}</div>
                <div className="text-sm text-muted-foreground">Completed Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {models.length > 0 ? (models.reduce((acc, m) => acc + m.accuracy, 0) / models.length * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Jobs Alert */}
      {runningJobs.length > 0 && (
        <Alert className="border-blue-500 bg-blue-50">
          <Activity className="h-4 w-4 text-blue-500" />
          <AlertTitle>Training in Progress</AlertTitle>
          <AlertDescription>
            {runningJobs.length} model{runningJobs.length > 1 ? 's are' : ' is'} currently training. 
            Monitor progress in the Active Jobs tab.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs ({runningJobs.length})</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="schedules">Training Schedules</TabsTrigger>
          <TabsTrigger value="new-training">Start Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Training Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Training Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentJobs.length === 0 ? (
                    <div className="text-center py-4">
                      <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No recent training jobs</p>
                    </div>
                  ) : (
                    recentJobs.map((job) => (
                      <div key={job.id} className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor(job.status)}`}>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <div className="font-medium">{formatModelType(job.modelType)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(job.startedAt))} ago
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                            {job.status}
                          </Badge>
                          {job.accuracy && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {(job.accuracy * 100).toFixed(1)}% accuracy
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Model Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {models.map((model) => (
                    <div key={`${model.modelType}-${model.version}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getModelIcon(model.modelType)}
                        <div>
                          <div className="font-medium">{formatModelType(model.modelType)}</div>
                          <div className="text-sm text-muted-foreground">
                            v{model.version} • {model.predictionCount.toLocaleString()} predictions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{(model.accuracy * 100).toFixed(1)}%</div>
                        <Badge variant={model.performanceTrend === 'improving' ? 'default' : model.performanceTrend === 'declining' ? 'destructive' : 'secondary'}>
                          {model.performanceTrend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Training Jobs</CardTitle>
              <CardDescription>
                Monitor and manage currently running training operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runningJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Training</h3>
                    <p className="text-muted-foreground">All models are up to date. Start new training from the Start Training tab.</p>
                  </div>
                ) : (
                  runningJobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{formatModelType(job.modelType)}</h4>
                          <p className="text-sm text-muted-foreground">
                            Started {formatDistanceToNow(new Date(job.startedAt))} ago • {job.datasetSize.toLocaleString()} records
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {job.progress}% complete
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => stopTraining(job.id)}>
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </div>
                      </div>
                      
                      <Progress value={job.progress} className="mb-3" />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium">{job.status}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <div className="font-medium">{job.progress}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dataset:</span>
                          <div className="font-medium">{job.datasetSize.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ETA:</span>
                          <div className="font-medium">
                            {job.progress > 0 ? 
                              `${Math.round((100 - job.progress) * (Date.now() - new Date(job.startedAt).getTime()) / job.progress / 60000)} min` : 
                              'Calculating...'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <Card key={`${model.modelType}-${model.version}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModelIcon(model.modelType)}
                      {formatModelType(model.modelType)}
                    </div>
                    <Badge variant={model.isActive ? "default" : "secondary"}>
                      {model.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Version {model.version} • Last trained {formatDistanceToNow(new Date(model.lastTrained))} ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accuracy</span>
                      <span className="font-bold text-lg">{(model.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Training Data</span>
                      <span className="font-medium">{model.trainingDataSize.toLocaleString()} records</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Predictions Made</span>
                      <span className="font-medium">{model.predictionCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance Trend</span>
                      <Badge variant={model.performanceTrend === 'improving' ? 'default' : model.performanceTrend === 'declining' ? 'destructive' : 'secondary'}>
                        {model.performanceTrend}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => startTraining(model.modelType)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Retrain Model
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Training Schedules</CardTitle>
              <CardDescription>
                Configure automatic retraining schedules for your models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getModelIcon(schedule.modelType)}
                      <div>
                        <div className="font-medium">{formatModelType(schedule.modelType)}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.frequency} retraining • Next: {formatDistanceToNow(new Date(schedule.nextRun))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.isEnabled ? "default" : "secondary"}>
                        {schedule.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'churn_prediction', title: 'Churn Prediction', desc: 'Predict customer churn probability' },
              { type: 'clv_prediction', title: 'Customer Lifetime Value', desc: 'Forecast customer lifetime value' },
              { type: 'customer_segmentation', title: 'Customer Segmentation', desc: 'Segment customers by behavior' },
              { type: 'behavioral_scoring', title: 'Behavioral Scoring', desc: 'Score customer engagement' }
            ].map((model) => (
              <Card key={model.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getModelIcon(model.type)}
                    {model.title}
                  </CardTitle>
                  <CardDescription>{model.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${model.type}-sample-size`}>Sample Size</Label>
                        <Input id={`${model.type}-sample-size`} defaultValue="10000" />
                      </div>
                      <div>
                        <Label htmlFor={`${model.type}-test-split`}>Test Split</Label>
                        <Input id={`${model.type}-test-split`} defaultValue="0.2" />
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => startTraining(model.type)}
                      disabled={runningJobs.some(job => job.modelType === model.type)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Training
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}