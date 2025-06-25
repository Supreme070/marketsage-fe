/**
 * Demo Simulator Control Panel
 * 
 * React component for controlling the real-time demo simulation
 * during presentations and demos.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Play, Square, Zap, Users, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SimulatorConfig {
  duration: number;
  visitorsPerMinute: number;
  formSubmissionRate: number;
  alertFrequency: number;
  enableNotifications: boolean;
  enableAlerts: boolean;
  enableLiveVisitors: boolean;
}

interface SimulatorStatus {
  isRunning: boolean;
  config: SimulatorConfig;
}

export default function DemoSimulatorControl() {
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SimulatorConfig>({
    duration: 30,
    visitorsPerMinute: 8,
    formSubmissionRate: 12,
    alertFrequency: 6,
    enableNotifications: true,
    enableAlerts: true,
    enableLiveVisitors: true,
  });

  // Fetch current status
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/demo/simulator');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch simulator status:', error);
    }
  };

  const startSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/demo/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', config }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        toast.success('🎬 Demo simulation started!');
      } else {
        toast.error(data.error || 'Failed to start simulation');
      }
    } catch (error) {
      toast.error('Failed to start simulation');
      console.error('Start simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/demo/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        toast.success('🛑 Demo simulation stopped');
      } else {
        toast.error(data.error || 'Failed to stop simulation');
      }
    } catch (error) {
      toast.error('Failed to stop simulation');
      console.error('Stop simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: keyof SimulatorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-Time Demo Magic
              </CardTitle>
              <CardDescription>
                Control live simulation for engaging presentations
              </CardDescription>
            </div>
            <Badge variant={status?.isRunning ? "default" : "secondary"}>
              {status?.isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={startSimulation}
              disabled={loading || status?.isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Simulation
            </Button>
            <Button
              onClick={stopSimulation}
              disabled={loading || !status?.isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Configuration</CardTitle>
          <CardDescription>
            Customize the demo experience for your presentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={config.duration}
              onChange={(e) => updateConfig('duration', Number.parseInt(e.target.value))}
              min={5}
              max={120}
            />
          </div>

          {/* Visitors per minute */}
          <div className="space-y-2">
            <Label>Visitors per minute: {config.visitorsPerMinute}</Label>
            <Slider
              value={[config.visitorsPerMinute]}
              onValueChange={(value) => updateConfig('visitorsPerMinute', value[0])}
              min={1}
              max={20}
              step={1}
            />
          </div>

          {/* Form submission rate */}
          <div className="space-y-2">
            <Label>Form submission rate: {config.formSubmissionRate}%</Label>
            <Slider
              value={[config.formSubmissionRate]}
              onValueChange={(value) => updateConfig('formSubmissionRate', value[0])}
              min={5}
              max={30}
              step={1}
            />
          </div>

          {/* Alert frequency */}
          <div className="space-y-2">
            <Label>Alerts per hour: {config.alertFrequency}</Label>
            <Slider
              value={[config.alertFrequency]}
              onValueChange={(value) => updateConfig('alertFrequency', value[0])}
              min={1}
              max={15}
              step={1}
            />
          </div>

          {/* Feature toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label>Live Visitors</Label>
              </div>
              <Switch
                checked={config.enableLiveVisitors}
                onCheckedChange={(checked) => updateConfig('enableLiveVisitors', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <Label>Smart Alerts</Label>
              </div>
              <Switch
                checked={config.enableAlerts}
                onCheckedChange={(checked) => updateConfig('enableAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>Notifications</Label>
              </div>
              <Switch
                checked={config.enableNotifications}
                onCheckedChange={(checked) => updateConfig('enableNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Demo Scenarios</CardTitle>
          <CardDescription>
            Pre-configured scenarios for different presentation contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start"
              onClick={() => setConfig({
                duration: 15,
                visitorsPerMinute: 12,
                formSubmissionRate: 20,
                alertFrequency: 10,
                enableNotifications: true,
                enableAlerts: true,
                enableLiveVisitors: true,
              })}
            >
              <div className="font-semibold">High Activity</div>
              <div className="text-sm text-muted-foreground">
                Busy demo with lots of action
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start"
              onClick={() => setConfig({
                duration: 30,
                visitorsPerMinute: 6,
                formSubmissionRate: 10,
                alertFrequency: 4,
                enableNotifications: true,
                enableAlerts: true,
                enableLiveVisitors: true,
              })}
            >
              <div className="font-semibold">Balanced</div>
              <div className="text-sm text-muted-foreground">
                Steady, realistic activity
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-start"
              onClick={() => setConfig({
                duration: 45,
                visitorsPerMinute: 3,
                formSubmissionRate: 8,
                alertFrequency: 2,
                enableNotifications: false,
                enableAlerts: true,
                enableLiveVisitors: true,
              })}
            >
              <div className="font-semibold">Subtle</div>
              <div className="text-sm text-muted-foreground">
                Minimal but noticeable activity
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}