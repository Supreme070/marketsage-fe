'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  Settings,
  Zap,
  Brain,
  Database,
  Network,
  Mail,
  Phone,
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Timer,
  Target,
  Activity,
  Info,
  Lightbulb,
  Workflow
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DelegationPermission {
  id: string;
  name: string;
  description: string;
  category: 'data_access' | 'system_modification' | 'external_integration' | 'communication' | 'analysis' | 'automation';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scope: {
    resources: string[];
    operations: string[];
    constraints: string[];
  };
  prerequisites: string[];
  examples: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface DelegationGrant {
  id: string;
  userId: string;
  organizationId: string;
  permissionId: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions: {
    timeWindow?: {
      start: string;
      end: string;
      timezone: string;
    };
    usageLimit?: {
      maxOperations: number;
      currentUsage: number;
      resetPeriod: 'hourly' | 'daily' | 'weekly' | 'monthly';
    };
    approvalRequired?: boolean;
    notificationSettings?: {
      onUse: boolean;
      onExpiry: boolean;
      onLimit: boolean;
    };
  };
  restrictions: {
    ipWhitelist?: string[];
    userAgentPattern?: string;
    contextRequired?: string[];
  };
  metadata: {
    reason: string;
    grantedBy: string;
    lastUsed?: Date;
    usageHistory: any[];
  };
  status: 'active' | 'expired' | 'revoked' | 'suspended';
}

interface DelegationRequest {
  id: string;
  userId: string;
  organizationId: string;
  permissionIds: string[];
  requestedAt: Date;
  reason: string;
  conditions: any;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  autoApprovalEligible: boolean;
}

const AIDelegationInterface: React.FC = () => {
  const [permissions, setPermissions] = useState<DelegationPermission[]>([]);
  const [grants, setGrants] = useState<DelegationGrant[]>([]);
  const [requests, setRequests] = useState<DelegationRequest[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('permissions');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [requestReason, setRequestReason] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<DelegationPermission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v2/ai/delegation');
      if (!response.ok) throw new Error('Failed to fetch delegation data');
      
      const result = await response.json();
      if (result.success) {
        setPermissions(result.data.permissions || []);
        setGrants(result.data.grants || []);
        setRequests(result.data.requests || []);
        setStatistics(result.data.statistics || {});
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching delegation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delegation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_access': return <Database className="h-4 w-4" />;
      case 'system_modification': return <Settings className="h-4 w-4" />;
      case 'external_integration': return <Network className="h-4 w-4" />;
      case 'communication': return <Mail className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'automation': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-blue-600 bg-blue-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-gray-600 bg-gray-50';
      case 'revoked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || permission.category === categoryFilter;
    const matchesRisk = riskFilter === 'all' || permission.riskLevel === riskFilter;
    
    return matchesSearch && matchesCategory && matchesRisk;
  });

  const handleRequestPermissions = async () => {
    if (selectedPermissions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one permission",
        variant: "destructive",
      });
      return;
    }

    if (!requestReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the request",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/v2/ai/delegation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'request_permissions',
          permissionIds: selectedPermissions,
          reason: requestReason,
          conditions: {
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            notificationSettings: {
              onUse: true,
              onExpiry: true,
              onLimit: true
            }
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to request permissions');

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Permission request submitted successfully",
        });
        setIsRequestModalOpen(false);
        setSelectedPermissions([]);
        setRequestReason('');
        await fetchData();
      } else {
        throw new Error(result.error || 'Failed to request permissions');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        title: "Error",
        description: "Failed to submit permission request",
        variant: "destructive",
      });
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    try {
      const response = await fetch(`/api/v2/ai/delegation?grantId=${grantId}&reason=Manual revocation`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to revoke grant');

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Grant revoked successfully",
        });
        await fetchData();
      } else {
        throw new Error(result.error || 'Failed to revoke grant');
      }
    } catch (error) {
      console.error('Error revoking grant:', error);
      toast({
        title: "Error",
        description: "Failed to revoke grant",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading delegation interface...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            AI Delegation Interface
          </h1>
          <p className="text-gray-600">Grant AI specific permissions for autonomous task execution</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Permissions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Grants</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.grants?.active || 0}</div>
            <p className="text-xs text-gray-600">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.requests?.pending || 0}</div>
            <p className="text-xs text-gray-600">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.usage?.total || 0}</div>
            <p className="text-xs text-gray-600">Permission uses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.usage?.total > 0 
                ? Math.round((statistics.usage?.successful || 0) / statistics.usage.total * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">Successful operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">Available Permissions</TabsTrigger>
          <TabsTrigger value="grants">My Grants</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="min-w-[140px]">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="data_access">Data Access</SelectItem>
                      <SelectItem value="system_modification">System Modification</SelectItem>
                      <SelectItem value="external_integration">External Integration</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[140px]">
                  <Label htmlFor="risk">Risk Level</Label>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Risk Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPermissions.map((permission) => (
              <Card key={permission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(permission.category)}
                      <CardTitle className="text-base">{permission.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRiskColor(permission.riskLevel)}>
                        {permission.riskLevel}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPermission(permission);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{permission.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Category:</span>
                      <span className="text-sm capitalize">{permission.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Operations:</span>
                      <div className="flex gap-1">
                        {permission.scope.operations.slice(0, 3).map(op => (
                          <Badge key={op} variant="secondary" className="text-xs">
                            {op}
                          </Badge>
                        ))}
                        {permission.scope.operations.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{permission.scope.operations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id));
                          }
                        }}
                      />
                      <Label htmlFor={permission.id} className="text-sm">
                        Select for request
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPermissions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No permissions found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="grants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Active Grants</CardTitle>
              <CardDescription>Permissions currently granted to AI</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {grants.map((grant) => {
                    const permission = permissions.find(p => p.id === grant.permissionId);
                    return (
                      <Card key={grant.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {permission && getCategoryIcon(permission.category)}
                              <h3 className="font-semibold">{permission?.name || 'Unknown Permission'}</h3>
                              <Badge variant="outline" className={getStatusColor(grant.status)}>
                                {grant.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-gray-600">Granted:</span>
                                <span>{formatDate(grant.grantedAt)}</span>
                              </div>
                              {grant.expiresAt && (
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600">Expires:</span>
                                  <span>{formatDate(grant.expiresAt)}</span>
                                </div>
                              )}
                              {grant.conditions.usageLimit && (
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600">Usage:</span>
                                  <span>
                                    {grant.conditions.usageLimit.currentUsage} / {grant.conditions.usageLimit.maxOperations}
                                  </span>
                                </div>
                              )}
                              {grant.metadata.lastUsed && (
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-600">Last Used:</span>
                                  <span>{formatDate(grant.metadata.lastUsed)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeGrant(grant.id)}
                              disabled={grant.status !== 'active'}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Permission Requests</CardTitle>
              <CardDescription>History of permission requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4" />
                            <h3 className="font-semibold">Request #{request.id.slice(-8)}</h3>
                            <Badge variant="outline" className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            {request.autoApprovalEligible && (
                              <Badge variant="secondary">
                                Auto-approved
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">Requested:</span>
                              <span>{formatDate(request.requestedAt)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">Permissions:</span>
                              <span>{request.permissionIds.length} permissions</span>
                            </div>
                            <div className="flex items-start gap-4">
                              <span className="text-gray-600">Reason:</span>
                              <span className="flex-1">{request.reason}</span>
                            </div>
                            {request.reviewedBy && (
                              <div className="flex items-center gap-4">
                                <span className="text-gray-600">Reviewed by:</span>
                                <span>{request.reviewedBy}</span>
                              </div>
                            )}
                            {request.reviewNotes && (
                              <div className="flex items-start gap-4">
                                <span className="text-gray-600">Notes:</span>
                                <span className="flex-1">{request.reviewNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request AI Permissions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need these permissions..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div>
              <Label>Selected Permissions ({selectedPermissions.length})</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {selectedPermissions.map(permissionId => {
                  const permission = permissions.find(p => p.id === permissionId);
                  return permission ? (
                    <div key={permissionId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(permission.category)}
                        <span className="font-medium">{permission.name}</span>
                        <Badge variant="outline" className={getRiskColor(permission.riskLevel)}>
                          {permission.riskLevel}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId))}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPermissions}
              disabled={selectedPermissions.length === 0 || !requestReason.trim()}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPermission && getCategoryIcon(selectedPermission.category)}
              {selectedPermission?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPermission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="capitalize">{selectedPermission.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <Badge variant="outline" className={getRiskColor(selectedPermission.riskLevel)}>
                    {selectedPermission.riskLevel}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p>{selectedPermission.description}</p>
              </div>
              
              <div>
                <Label>Operations</Label>
                <div className="flex gap-2 flex-wrap">
                  {selectedPermission.scope.operations.map(op => (
                    <Badge key={op} variant="secondary">{op}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Resources</Label>
                <div className="flex gap-2 flex-wrap">
                  {selectedPermission.scope.resources.map(resource => (
                    <Badge key={resource} variant="outline">{resource}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Constraints</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedPermission.scope.constraints.map(constraint => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Label>Examples</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedPermission.examples.map(example => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Label>Prerequisites</Label>
                <ul className="list-disc pl-5 space-y-1">
                  {selectedPermission.prerequisites.map(prerequisite => (
                    <li key={prerequisite}>{prerequisite}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIDelegationInterface;