"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import {
  Terminal,
  Database,
  Users,
  Shield,
  Activity,
  Zap,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminDashboardPage() {
  const { permissions, staffRole } = useAdmin();
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 23.5,
    memory: 67.2,
    disk: 45.8,
    network: 12.4
  });

  const [activeSessions, setActiveSessions] = useState(1247);
  const [threats, setThreats] = useState(3);
  const [uptime, setUptime] = useState("99.97%");

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        cpu: prev.cpu + (Math.random() - 0.5) * 2,
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 3)),
        disk: prev.disk + (Math.random() - 0.5) * 0.5,
        network: Math.max(0, prev.network + (Math.random() - 0.5) * 5)
      }));
      
      setActiveSessions(prev => prev + Math.floor((Math.random() - 0.5) * 10));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">CONTROL_CENTER</h1>
          <p className="admin-subtitle">SYSTEM_STATUS.REALTIME_MONITORING</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-success">
            <Activity className="h-3 w-3 mr-1" />
            OPERATIONAL
          </div>
          <div className="admin-badge admin-badge-warning">
            UPTIME: {uptime}
          </div>
        </div>
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Cpu className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
            <div className="admin-pulse"></div>
          </div>
          <div className="admin-stat-value">{systemMetrics.cpu.toFixed(1)}%</div>
          <div className="admin-stat-label">CPU_UTILIZATION</div>
          <div className={`admin-stat-change ${systemMetrics.cpu > 80 ? 'negative' : 'positive'}`}>
            {systemMetrics.cpu > 80 ? 'HIGH_LOAD' : 'OPTIMAL'}
          </div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="h-6 w-6 text-[hsl(var(--admin-accent))]" />
            <Activity className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.memory.toFixed(1)}%</div>
          <div className="admin-stat-label">MEMORY_USAGE</div>
          <div className={`admin-stat-change ${systemMetrics.memory > 85 ? 'negative' : 'positive'}`}>
            {systemMetrics.memory > 85 ? 'CRITICAL' : 'STABLE'}
          </div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <TrendingUp className="h-4 w-4 text-[hsl(var(--admin-success))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.disk.toFixed(1)}%</div>
          <div className="admin-stat-label">DISK_USAGE</div>
          <div className="admin-stat-change positive">GROWING</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Network className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Zap className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{systemMetrics.network.toFixed(1)} GB/s</div>
          <div className="admin-stat-label">NETWORK_I/O</div>
          <div className="admin-stat-change positive">ACTIVE</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-[hsl(var(--admin-primary))]" />
            <Eye className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">ACTIVE_USERS</h3>
          <div className="text-3xl font-bold text-[hsl(var(--admin-text-primary))] mb-2">
            {activeSessions.toLocaleString()}
          </div>
          <p className="admin-subtitle">CONCURRENT_SESSIONS</p>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Shield className="h-8 w-8 text-[hsl(var(--admin-danger))]" />
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--admin-danger))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">SECURITY_ALERTS</h3>
          <div className="text-3xl font-bold text-[hsl(var(--admin-danger))] mb-2">
            {threats}
          </div>
          <p className="admin-subtitle">ACTIVE_THREATS</p>
        </div>

        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Server className="h-8 w-8 text-[hsl(var(--admin-success))]" />
            <CheckCircle className="h-5 w-5 text-[hsl(var(--admin-success))]" />
          </div>
          <h3 className="admin-title text-lg mb-2">SERVICES_ONLINE</h3>
          <div className="text-3xl font-bold text-[hsl(var(--admin-success))] mb-2">
            47/47
          </div>
          <p className="admin-subtitle">ALL_SYSTEMS_GO</p>
        </div>
      </div>

      {/* System Status Matrix */}
      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
          <h2 className="admin-title text-xl">SYSTEM_STATUS_MATRIX</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="admin-subtitle">DATABASE</span>
              <div className="admin-badge admin-badge-success">ONLINE</div>
            </div>
            <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
              Response: 23ms
            </div>
          </div>

          <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="admin-subtitle">API_GATEWAY</span>
              <div className="admin-badge admin-badge-success">ONLINE</div>
            </div>
            <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
              Requests: 1.2k/min
            </div>
          </div>

          <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="admin-subtitle">CACHE_LAYER</span>
              <div className="admin-badge admin-badge-warning">DEGRADED</div>
            </div>
            <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
              Hit rate: 87%
            </div>
          </div>

          <div className="p-4 border border-[hsl(var(--admin-border))] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="admin-subtitle">CDN</span>
              <div className="admin-badge admin-badge-success">ONLINE</div>
            </div>
            <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-2">
              Edge nodes: 12/12
            </div>
          </div>
        </div>
      </div>

      {/* System Info Footer */}
      {staffRole === 'SUPER_ADMIN' && (
        <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
          <div className="flex items-start gap-4">
            <Terminal className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
            <div>
              <h4 className="admin-title text-lg mb-2">SYSTEM_INFO</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="admin-subtitle">BUILD:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">v3.0.1-cyberpunk</div>
                </div>
                <div>
                  <span className="admin-subtitle">NODE:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">NODE-ALPHA-01</div>
                </div>
                <div>
                  <span className="admin-subtitle">CLUSTER:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">MARKETSAGE-PROD</div>
                </div>
                <div>
                  <span className="admin-subtitle">REGION:</span>
                  <div className="text-[hsl(var(--admin-text-primary))]">AF-WEST-1</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}