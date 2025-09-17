"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminAuditDashboard } from "@/lib/api/hooks/useAdminAudit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Shield, 
  Activity, 
  FileText, 
  Users, 
  Server,
  Download,
  Filter,
  Search,
  Clock,
  User,
  Database,
  Lock,
  Key,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuditStream } from "@/hooks/useAuditStream";
import { AuditLogDetailsModal } from "@/components/admin/AuditLogDetailsModal";

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: any;
  metadata?: any;
  timestamp: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface AuditStats {
  totalEvents: number;
  todayEvents: number;
  activeUsers: number;
  systemChanges: number;
  recentActivities: AuditLog[];
  topResources: { resource: string; count: number }[];
  topUsers: { userId: string; email: string; count: number }[];
}

const actionIcons: Record<string, any> = {
  CREATE: CheckCircle,
  UPDATE: RefreshCw,
  DELETE: XCircle,
  VIEW: Info,
  LOGIN: Key,
  LOGOUT: Lock,
  PERMISSION_CHANGE: Shield,
  SYSTEM_UPDATE: Server,
  CONFIG_CHANGE: Settings,
};

const actionColors: Record<string, string> = {
  CREATE: "text-green-600 bg-green-50",
  UPDATE: "text-blue-600 bg-blue-50",
  DELETE: "text-red-600 bg-red-50",
  VIEW: "text-gray-600 bg-gray-50",
  LOGIN: "text-purple-600 bg-purple-50",
  LOGOUT: "text-orange-600 bg-orange-50",
  PERMISSION_CHANGE: "text-yellow-600 bg-yellow-50",
  SYSTEM_UPDATE: "text-indigo-600 bg-indigo-50",
  CONFIG_CHANGE: "text-pink-600 bg-pink-50",
};

export default function AuditTrailPage() {
  const router = useRouter();
  const { permissions } = useAdmin();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  const { 
    stats, 
    statsLoading, 
    statsError, 
    logs, 
    logsLoading, 
    logsError, 
    pagination: logsPagination,
    refreshAll, 
    refreshLogs, 
    exportLogs, 
    exporting 
  } = useAdminAuditDashboard();
  
  // Real-time audit stream
  const { isConnected, lastEvent } = useAuditStream(streamEnabled && activeTab === "overview");

  // Check permissions
  useEffect(() => {
    if (!permissions.canViewAudit) {
      router.push("/admin/dashboard");
    }
  }, [permissions, router]);

  // Fetch logs when filters or pagination change
  useEffect(() => {
    if (activeTab !== "overview") {
      refreshLogs(filters, { ...pagination, type: activeTab });
    }
  }, [activeTab, filters, pagination.page]);

  // Handle real-time updates
  useEffect(() => {
    if (lastEvent?.type === "audit_log" && lastEvent.data) {
      // Update logs if viewing relevant tab
      if (activeTab !== "overview") {
        refreshLogs(filters, { ...pagination, type: activeTab });
      }
    }
  }, [lastEvent, activeTab, filters, pagination]);

  const handleExport = async () => {
    try {
      await exportLogs(filters, activeTab);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "overview") {
      refreshAll();
    } else {
      refreshLogs(filters, { ...pagination, type: activeTab });
    }
    setRefreshing(false);
  };

  const renderActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const renderActionBadge = (action: string) => {
    const colorClass = actionColors[action] || "text-gray-600 bg-gray-50";
    return (
      <Badge variant="secondary" className={cn("flex items-center gap-1", colorClass)}>
        {renderActionIcon(action)}
        {action}
      </Badge>
    );
  };

  const renderChanges = (changes: any) => {
    if (!changes) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
        <p className="font-medium mb-1">Changes:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {changes.before && (
            <div>
              <p className="font-medium text-gray-600">Before:</p>
              <pre className="text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(changes.before, null, 2)}
              </pre>
            </div>
          )}
          {changes.after && (
            <div>
              <p className="font-medium text-gray-600">After:</p>
              <pre className="text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(changes.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!permissions.canViewAudit) {
    return null;
  }

  if (statsLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Audit Trail</h2>
          <p className="text-gray-600">Fetching audit data...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Audit Trail Error</h2>
          <p className="text-gray-600 mb-4">{statsError}</p>
          <Button onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Audit Trail
          </h1>
          <p className="text-gray-600 mt-2">
            Track all administrative actions, system changes, and access history
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Real-time indicator */}
          {activeTab === "overview" && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className="text-sm text-gray-600">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayEvents.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-gray-500 mt-1">Unique admins</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemChanges}</div>
              <p className="text-xs text-gray-500 mt-1">Configuration updates</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="admin-actions">Admin Actions</TabsTrigger>
          <TabsTrigger value="system-changes">System Changes</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          <TabsTrigger value="data-changes">Data Changes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentActivities.map((log) => (
                    <div key={log.id} className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {renderActionBadge(log.action)}
                        <div>
                          <p className="text-sm font-medium">
                            {log.resource} {log.action.toLowerCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.userEmail} • {format(new Date(log.timestamp), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Resources</CardTitle>
                <CardDescription>Resources with the most activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topResources.map((item, index) => (
                    <div key={item.resource} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <span className="font-medium capitalize">{item.resource}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.count} events</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Admins</CardTitle>
                <CardDescription>Administrators with the most actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.topUsers.map((user, index) => (
                    <div key={user.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.email}</p>
                          <p className="text-xs text-gray-500">ID: {user.userId}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{user.count} actions</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other Tabs - Shared Log Table Component */}
        {["admin-actions", "system-changes", "access-logs", "data-changes"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {tabValue === "admin-actions" && "Administrative Actions"}
                      {tabValue === "system-changes" && "System Changes"}
                      {tabValue === "access-logs" && "Access Logs"}
                      {tabValue === "data-changes" && "Data Changes"}
                    </CardTitle>
                    <CardDescription>
                      {tabValue === "admin-actions" && "All administrative actions performed by staff"}
                      {tabValue === "system-changes" && "System configuration and setting changes"}
                      {tabValue === "access-logs" && "Login, logout, and session activities"}
                      {tabValue === "data-changes" && "User data and entity modifications"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Search</Label>
                      <Input
                        placeholder="Search logs..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Action</Label>
                      <Select
                        value={filters.action}
                        onValueChange={(value) => setFilters({ ...filters, action: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All actions</SelectItem>
                          <SelectItem value="CREATE">Create</SelectItem>
                          <SelectItem value="UPDATE">Update</SelectItem>
                          <SelectItem value="DELETE">Delete</SelectItem>
                          <SelectItem value="VIEW">View</SelectItem>
                          <SelectItem value="LOGIN">Login</SelectItem>
                          <SelectItem value="LOGOUT">Logout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date From</Label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Date To</Label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Resource
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logsLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Loading audit logs...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            No audit logs found
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">{log.userEmail || "System"}</p>
                                {log.ipAddress && (
                                  <p className="text-xs text-gray-500">IP: {log.ipAddress}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {renderActionBadge(log.action)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium capitalize">{log.resource}</p>
                                {log.resourceId && (
                                  <p className="text-xs text-gray-500">ID: {log.resourceId}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setDetailsModalOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {!logsLoading && logs.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing {(logsPagination.page - 1) * logsPagination.limit + 1} to{" "}
                      {Math.min(logsPagination.page * logsPagination.limit, logsPagination.total)} of{" "}
                      {logsPagination.total} results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page * pagination.limit >= logsPagination.total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Details Modal */}
      <AuditLogDetailsModal
        log={selectedLog}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}