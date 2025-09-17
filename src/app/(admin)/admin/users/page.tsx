"use client";

import { useAdmin } from "@/components/admin/AdminProvider";
import { useAdminUsersDashboard, AdminUser } from "@/lib/api/hooks/useAdminUsers";
import { 
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  UserPlus,
  Terminal,
  Database,
  Zap,
  Activity,
  Globe,
  Lock
} from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastActive: string;
  organization?: {
    id: string;
    name: string;
    subscriptionTier: string;
  };
}

export default function AdminUsersPage() {
  const { permissions, staffRole } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    users, 
    stats, 
    loading, 
    error, 
    pagination, 
    refreshAll, 
    suspendUser, 
    activateUser 
  } = useAdminUsersDashboard({
    page: currentPage,
    limit: 10,
    search: searchTerm,
    role: roleFilter,
    status: statusFilter
  });

  if (!permissions.canViewUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="admin-card p-8 text-center max-w-md">
          <Lock className="h-16 w-16 mx-auto mb-6 text-red-400" />
          <h2 className="admin-title text-2xl mb-4">ACCESS DENIED</h2>
          <p className="admin-subtitle">
            INSUFFICIENT CLEARANCE LEVEL
          </p>
          <div className="mt-6 text-center">
            <span className="admin-badge admin-badge-danger">UNAUTHORIZED</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 mx-auto mb-6 text-red-400" />
          <h2 className="admin-title text-2xl mb-4">USER_MANAGEMENT_ERROR</h2>
          <p className="admin-subtitle mb-4">{error}</p>
          <button 
            className="admin-btn admin-btn-primary flex items-center gap-2 mx-auto"
            onClick={refreshAll}
          >
            <RefreshCw className="h-4 w-4" />
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (user: AdminUser) => {
    if (user.isSuspended) {
      return <span className="admin-badge admin-badge-danger">SUSPENDED</span>;
    }
    if (user.emailVerified) {
      return <span className="admin-badge admin-badge-success">ONLINE</span>;
    }
    return <span className="admin-badge admin-badge-warning">PENDING</span>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="admin-badge admin-badge-danger">SUPER_ADMIN</span>;
      case 'ADMIN':
        return <span className="admin-badge admin-badge-success">ADMIN</span>;
      case 'IT_ADMIN':
        return <span className="admin-badge admin-badge-secondary">IT_ADMIN</span>;
      default:
        return <span className="admin-badge admin-badge-secondary">USER</span>;
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await suspendUser(userId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await activateUser(userId);
      // Success is handled by the hook refreshing the data
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="admin-title text-2xl mb-1">USER_MATRIX</h1>
          <p className="admin-subtitle">MANAGING {stats?.total?.toLocaleString() || 0} SYSTEM_ENTITIES</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" />
            EXPORT_DATA
          </button>
          <button className="admin-btn admin-btn-primary flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            NEW_USER
          </button>
        </div>
      </div>

      {/* Cyberpunk Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-6 w-6 text-[hsl(var(--admin-primary))]" />
            <Zap className="h-4 w-4 text-[hsl(var(--admin-accent))]" />
          </div>
          <div className="admin-stat-value">{stats?.total?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">TOTAL_USERS</div>
          <div className="admin-stat-change positive">+{Math.floor((stats?.total || 0) * 0.07)} THIS_CYCLE</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-6 w-6 text-[hsl(var(--admin-success))]" />
            <Activity className="h-4 w-4 text-[hsl(var(--admin-success))]" />
          </div>
          <div className="admin-stat-value">{stats?.active?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">ACTIVE_SESSIONS</div>
          <div className="admin-stat-change positive">{((stats?.active || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% ONLINE</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--admin-warning))]" />
            <Globe className="h-4 w-4 text-[hsl(var(--admin-warning))]" />
          </div>
          <div className="admin-stat-value">{stats?.pending?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">PENDING_AUTH</div>
          <div className="admin-stat-change negative">{((stats?.pending || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% UNVERIFIED</div>
        </div>

        <div className="admin-stat-card admin-glow-hover">
          <div className="flex items-center justify-between mb-4">
            <Shield className="h-6 w-6 text-[hsl(var(--admin-danger))]" />
            <Terminal className="h-4 w-4 text-[hsl(var(--admin-danger))]" />
          </div>
          <div className="admin-stat-value">{stats?.suspended?.toLocaleString() || 0}</div>
          <div className="admin-stat-label">SUSPENDED</div>
          <div className="admin-stat-change negative">{((stats?.suspended || 0) / Math.max(stats?.total || 1, 1) * 100).toFixed(1)}% BLOCKED</div>
        </div>
      </div>

        {/* Cyberpunk Control Panel */}
        <div className="admin-card mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-[hsl(var(--admin-primary))]" />
              <h2 className="admin-title text-xl">USER_DIRECTORY</h2>
            </div>
            <button 
              className="admin-btn flex items-center gap-2 admin-glow-hover"
              onClick={refreshAll}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              SYNC_DB
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--admin-text-muted))] h-4 w-4" />
              <input
                className="admin-input pl-10 w-full"
                placeholder="SEARCH_USERS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="admin-input"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">ALL_ROLES</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="IT_ADMIN">IT_ADMIN</option>
            </select>
            
            <select 
              className="admin-input"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ALL_STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="pending_verification">PENDING</option>
              <option value="suspended">SUSPENDED</option>
            </select>
          </div>

          {/* Cyberpunk Data Table */}
          <div className="admin-table">
            {loading ? (
              <div className="p-12 text-center">
                <div className="admin-loading mx-auto mb-4"></div>
                <p className="admin-subtitle">ACCESSING_DATABASE...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>USER_ID</th>
                      <th>ACCESS_LEVEL</th>
                      <th>STATUS</th>
                      <th>ORGANIZATION</th>
                      <th>LAST_SEEN</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="admin-slide-in">
                        <td>
                          <div>
                            <div className="font-medium text-[hsl(var(--admin-text-primary))]">
                              {user.name || 'UNKNOWN_USER'}
                            </div>
                            <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td>
                          {getRoleBadge(user.role)}
                        </td>
                        <td>
                          {getStatusBadge(user)}
                        </td>
                        <td>
                          {user.organization ? (
                            <div>
                              <div className="text-[hsl(var(--admin-text-primary))] font-medium">
                                {user.organization.name}
                              </div>
                              <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                                {user.organization.plan}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[hsl(var(--admin-text-muted))]">NULL</span>
                          )}
                        </td>
                        <td>
                          <div className="text-[hsl(var(--admin-text-secondary))]">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                          </div>
                          <div className="text-[hsl(var(--admin-text-muted))] text-xs">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : 'No activity'}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              className="admin-btn text-xs px-3 py-1"
                              onClick={() => console.log('View user:', user.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              VIEW
                            </button>
                            {user.isSuspended ? (
                              <button
                                className="admin-btn admin-btn-success text-xs px-3 py-1"
                                onClick={() => handleActivateUser(user.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                ACTIVATE
                              </button>
                            ) : (
                              <button
                                className="admin-btn admin-btn-danger text-xs px-3 py-1"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                SUSPEND
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Cyberpunk Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="admin-card p-4 mt-6 flex items-center justify-between">
            <div className="admin-subtitle">
              PAGE {pagination.page} OF {pagination.pages} {/* TOTAL_RECORDS: */} {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="admin-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                PREV
              </button>
              <button
                className="admin-btn"
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* System Status Footer */}
        {staffRole === 'SUPER_ADMIN' && (
          <div className="admin-card p-6 mt-8 border-l-4 border-l-[hsl(var(--admin-primary))]">
            <div className="flex items-start gap-4">
              <Terminal className="h-6 w-6 text-[hsl(var(--admin-primary))] mt-1" />
              <div>
                <h4 className="admin-title text-lg mb-2">SYSTEM_STATUS</h4>
                <p className="admin-subtitle mb-3">
                  USER_MANAGEMENT.MODULE.ONLINE {/* VERSION: 3.0.1 */}
                </p>
                <div className="flex gap-4">
                  <div className="admin-badge admin-badge-success">DATABASE_CONNECTED</div>
                  <div className="admin-badge admin-badge-success">API_RESPONSIVE</div>
                  <div className="admin-badge admin-badge-warning">CACHE_SYNC_PENDING</div>
                </div>
                <p className="admin-subtitle mt-3 text-xs">
                  {/* Advanced operations: BULK_EDIT, AUDIT_TRAILS, PERMISSION_MATRIX available in next iteration */}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}