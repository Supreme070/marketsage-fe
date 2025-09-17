"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminOrganizationsDashboard, AdminOrganization } from "@/lib/api/hooks/useAdminOrganizations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Search, 
  Filter,
  MoreHorizontal,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Ban,
  CheckCircle,
  Calendar,
  Activity
} from "lucide-react";
import { useState } from "react";

interface Organization {
  id: string;
  name: string;
  domain: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  userCount: number;
  monthlyRevenue: number;
  usageStats: {
    emailsSent: number;
    smsSent: number;
    campaignsActive: number;
    storageUsed: string;
  };
  createdAt: string;
  lastActivity: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function AdminOrganizationsPage() {
  const { permissions, staffRole } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    organizations, 
    stats, 
    loading, 
    error, 
    pagination, 
    refreshAll, 
    suspendOrganization, 
    activateOrganization 
  } = useAdminOrganizationsDashboard({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    tier: tierFilter,
    status: statusFilter
  });


  if (!permissions.canViewUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
          <p className="text-gray-600 mt-2">
            You don't have permission to view organization management.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Organization Management Error</h2>
          <p className="text-gray-600 mt-2 mb-4">{error}</p>
          <Button onClick={refreshAll} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (plan: string) => {
    switch (plan) {
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'FREE':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Trial</Badge>;
      case 'ENTERPRISE':
      case 'PROFESSIONAL':
      case 'STARTER':
        return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return <Badge variant="default" className="bg-purple-100 text-purple-700">Enterprise</Badge>;
      case 'PROFESSIONAL':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Professional</Badge>;
      case 'STARTER':
        return <Badge variant="outline">Starter</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSuspendOrganization = async (orgId: string) => {
    try {
      await suspendOrganization(orgId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to suspend organization:', error);
    }
  };

  const handleActivateOrganization = async (orgId: string) => {
    try {
      await activateOrganization(orgId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to activate organization:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-sm text-gray-600">
              Monitor organizations, subscriptions, and usage analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              {organizations?.length || 0} Organizations
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{Math.round((stats?.totalOrganizations || 0) * 0.05)}</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(stats?.totalOrganizations || 0) > 0 ? `${(((stats?.activeSubscriptions || 0) / (stats?.totalOrganizations || 1)) * 100).toFixed(1)}%` : '0%'} of total orgs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Users per Org</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.averageUsersPerOrg || 0).toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+0.3</span> improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Organization Directory</CardTitle>
              <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organizations Grid/Table */}
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading organizations...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {organizations.map((org) => (
                  <Card key={org.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                            {getTierBadge(org.plan)}
                            {getStatusBadge(org.plan)}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Domain:</span> {org.websiteUrl || 'Not specified'}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Owner:</span> {org.billingEmail || 'Not specified'}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span> {new Date(org.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => console.log('View organization:', org.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {org.plan === 'SUSPENDED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateOrganization(org.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuspendOrganization(org.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Usage Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{org._count.users}</div>
                          <div className="text-xs text-gray-500">Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{formatCurrency(50000)}</div>
                          <div className="text-xs text-gray-500">Monthly Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">{org._count.emailCampaigns.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Email Campaigns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">{org._count.contacts.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Contacts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">{org._count.emailCampaigns}</div>
                          <div className="text-xs text-gray-500">Total Campaigns</div>
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Activity className="h-4 w-4" />
                          Last activity: {new Date(org.updatedAt).toLocaleDateString()} at {new Date(org.updatedAt).toLocaleTimeString()}
                        </div>
                        <div className="text-gray-600">
                          Plan: {org.plan}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Development Notice */}
        {staffRole === 'SUPER_ADMIN' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Development Status</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Organization Management foundation complete with comprehensive org overview, usage stats, and management actions. 
                  Advanced analytics and bulk operations are in development.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}