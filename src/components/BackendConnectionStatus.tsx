/**
 * Backend Connection Status Component
 * ==================================
 *
 * Displays real-time backend connection status and queued request information
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  apiErrorHandler,
  type BackendHealthStatus,
} from "@/lib/api-error-handler";

export function BackendConnectionStatus() {
  const [healthStatus, setHealthStatus] = useState<BackendHealthStatus>({
    isHealthy: true,
    lastChecked: Date.now(),
    consecutiveFailures: 0,
  });

  const [queueStatus, setQueueStatus] = useState<{
    count: number;
    oldestRequest?: number;
  }>({
    count: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Update status every 5 seconds
    const interval = setInterval(() => {
      const health = apiErrorHandler.getHealthStatus();
      const queue = apiErrorHandler.getQueueStatus();

      setHealthStatus(health);
      setQueueStatus(queue);
    }, 5000);

    // Initial load
    setHealthStatus(apiErrorHandler.getHealthStatus());
    setQueueStatus(apiErrorHandler.getQueueStatus());

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Force a health check by making a test request
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3006"}/api/v2/health`,
      );
    } catch (error) {
      console.warn("Manual health check failed:", error);
    }

    // Update status immediately
    setHealthStatus(apiErrorHandler.getHealthStatus());
    setQueueStatus(apiErrorHandler.getQueueStatus());

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleClearQueue = () => {
    apiErrorHandler.clearQueue();
    setQueueStatus({ count: 0 });
  };

  const getStatusColor = () => {
    if (healthStatus.isHealthy) return "bg-green-500";
    if (healthStatus.consecutiveFailures >= 3) return "bg-red-500";
    return "bg-yellow-500";
  };

  const getStatusText = () => {
    if (healthStatus.isHealthy) return "Connected";
    if (healthStatus.consecutiveFailures >= 3) return "Disconnected";
    return "Unstable";
  };

  const getStatusIcon = () => {
    if (healthStatus.isHealthy) return <CheckCircle className="h-4 w-4" />;
    if (healthStatus.consecutiveFailures >= 3)
      return <XCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatLastChecked = () => {
    const diff = Date.now() - healthStatus.lastChecked;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const formatOldestRequest = () => {
    if (!queueStatus.oldestRequest) return null;

    const diff = Date.now() - queueStatus.oldestRequest;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">Backend Service</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm">{getStatusText()}</span>
            </div>
            <Badge variant={healthStatus.isHealthy ? "default" : "destructive"}>
              {healthStatus.isHealthy ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Last Checked */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last checked:</span>
            <span>{formatLastChecked()}</span>
          </div>

          {/* Consecutive Failures */}
          {healthStatus.consecutiveFailures > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Failed attempts:</span>
              <span className="text-red-600">
                {healthStatus.consecutiveFailures}
              </span>
            </div>
          )}

          {/* Queued Requests */}
          {queueStatus.count > 0 && (
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Queued Actions</span>
                </div>
                <Badge variant="secondary">{queueStatus.count}</Badge>
              </div>

              {queueStatus.oldestRequest && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Oldest:</span>
                  <span>{formatOldestRequest()}</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                className="w-full text-xs"
              >
                Clear Queue
              </Button>
            </div>
          )}

          {/* Status Messages */}
          {!healthStatus.isHealthy && (
            <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border">
              <p>
                Working offline. Changes will sync when connection is restored.
              </p>
            </div>
          )}

          {healthStatus.isHealthy && queueStatus.count > 0 && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border">
              <p>Connection restored. Syncing queued changes...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BackendConnectionStatus;
