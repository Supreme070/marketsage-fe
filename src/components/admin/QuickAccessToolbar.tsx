"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlobalSearch } from "./GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Search,
  Activity,
  DollarSign,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStats {
  incidents: {
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  onlineUsers: number;
  mrr: {
    amount: number;
    percentageChange: number;
    previousAmount: number;
  };
}

export function QuickAccessToolbar() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<QuickStats>({
    incidents: { count: 0, severity: 'low' },
    onlineUsers: 0,
    mrr: { amount: 0, percentageChange: 0, previousAmount: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/quick-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  // Set up real-time updates using polling (can be replaced with WebSocket)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/quick-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to update quick stats:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [session]);

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getMRRTrend = () => {
    const change = stats.mrr.percentageChange;
    if (change > 0) {
      return { icon: TrendingUp, color: 'text-green-600', text: `+${change.toFixed(1)}%` };
    } else if (change < 0) {
      return { icon: TrendingUp, color: 'text-red-600', text: `${change.toFixed(1)}%` };
    }
    return { icon: Activity, color: 'text-gray-600', text: '0%' };
  };

  if (!session) return null;

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-600" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-900">MarketSage Admin</h1>
            </div>
          </div>

          {/* Global Search - Desktop */}
          <div className="hidden lg:block flex-1 max-w-lg mx-8">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search users, campaigns, tickets...</span>
              <kbd className="ml-auto px-2 py-0.5 text-xs bg-white rounded border border-gray-300">⌘K</kbd>
            </button>
          </div>

          {/* Quick Stats - Desktop */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {/* Incidents Counter */}
            <a
              href="/admin/incidents"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              title="View incidents"
            >
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 leading-none">Incidents</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge 
                    className={cn(
                      "text-xs px-1.5 py-0 h-5",
                      getIncidentColor(stats.incidents.severity)
                    )}
                  >
                    {isLoading ? '...' : stats.incidents.count}
                  </Badge>
                </div>
              </div>
            </a>

            {/* Online Users */}
            <a
              href="/admin/users?filter=online"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              title="View online users"
            >
              <Users className="h-5 w-5 text-gray-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 leading-none">Online</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-gray-900">
                    {isLoading ? '...' : stats.onlineUsers.toLocaleString()}
                  </span>
                </div>
              </div>
            </a>

            {/* MRR Display */}
            <a
              href="/admin/analytics?tab=revenue"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              title="View revenue analytics"
            >
              <DollarSign className="h-5 w-5 text-gray-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 leading-none">MRR</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {isLoading ? '...' : `₦${stats.mrr.amount.toLocaleString('en-NG')}`}
                  </span>
                  {!isLoading && stats.mrr.percentageChange !== 0 && (() => {
                    const trend = getMRRTrend();
                    const IconComponent = trend.icon;
                    return (
                      <div className={cn("flex items-center gap-0.5", trend.color)}>
                        <IconComponent className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {trend.text}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Search"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Mobile Stats Summary */}
            <div className="flex items-center gap-1">
              {stats.incidents.count > 0 && (
                <Badge 
                  className={cn(
                    "text-xs px-2 py-0.5",
                    getIncidentColor(stats.incidents.severity)
                  )}
                >
                  {stats.incidents.count}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {stats.onlineUsers}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mobile Stats Bar */}
        <div className="md:hidden border-t border-gray-100 px-4 py-2 flex items-center justify-around text-xs">
          <a href="/admin/incidents" className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{stats.incidents.count} incidents</span>
          </a>
          <a href="/admin/users?filter=online" className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{stats.onlineUsers} online</span>
          </a>
          <a href="/admin/analytics?tab=revenue" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">₦{(stats.mrr.amount / 1000).toFixed(0)}k MRR</span>
          </a>
        </div>
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <GlobalSearch onClose={() => setShowSearch(false)} />
      )}
    </>
  );
}