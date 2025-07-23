"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface SubscriptionAudit {
  id: string;
  organizationName: string;
  userEmail: string;
  tier: string;
  status: string;
  startDate: string;
  expiresAt: string | null;
  monthlyRevenue: number;
  totalRevenue: number;
  lastPayment?: string;
  usageStats: {
    emails: number;
    sms: number;
    whatsapp: number;
    leadPulseVisits: number;
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
}

interface RevenueAnalytics {
  mrr: number;
  arr: number;
  churnRate: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  totalActiveSubscriptions: number;
  averageRevenuePerUser: number;
  tierDistribution: Record<string, number>;
  paymentFailures: number;
  upcomingRenewals: number;
}

export function SubscriptionAuditDashboard() {
  const [audits, setAudits] = useState<SubscriptionAudit[]>([]);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionAudit | null>(null);
  const [verificationAction, setVerificationAction] = useState<string>("");
  const [verificationReason, setVerificationReason] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [auditsRes, analyticsRes, issuesRes] = await Promise.all([
        fetch("/api/admin/subscriptions/audit"),
        fetch("/api/admin/subscriptions/analytics"),
        fetch("/api/admin/subscriptions/verify")
      ]);

      const [auditsData, analyticsData, issuesData] = await Promise.all([
        auditsRes.json(),
        analyticsRes.json(),
        issuesRes.json()
      ]);

      setAudits(auditsData);
      setAnalytics(analyticsData);
      setIssues(issuesData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubscription = async () => {
    if (!selectedSubscription || !verificationAction || !verificationReason) return;

    try {
      const response = await fetch("/api/admin/subscriptions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.id,
          action: verificationAction,
          reason: verificationReason
        })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setSelectedSubscription(null);
        setVerificationAction("");
        setVerificationReason("");
      }
    } catch (error) {
      console.error("Failed to verify subscription:", error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-red-500";
      case "MEDIUM": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "ENTERPRISE": return "bg-purple-500";
      case "PROFESSIONAL": return "bg-blue-500";
      case "STARTER": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{analytics.mrr.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ARR: ₦{analytics.arr.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalActiveSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                ARPU: ₦{Math.round(analytics.averageRevenuePerUser).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.churnRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                New: {analytics.newSubscriptions} | Canceled: {analytics.canceledSubscriptions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{issues.length}</div>
              <p className="text-xs text-muted-foreground">
                Renewals: {analytics.upcomingRenewals} | Failures: {analytics.paymentFailures}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.tierDistribution).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTierColor(tier)}>{tier}</Badge>
                    <span>{count} subscribers</span>
                  </div>
                  <Progress 
                    value={(count / analytics.totalActiveSubscriptions) * 100} 
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Alert */}
      {issues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Subscription Issues Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issues.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <span className="font-medium">{issue.type}</span>
                    <p className="text-sm text-gray-600">{issue.description}</p>
                  </div>
                  <Badge className={issue.severity === "HIGH" ? "bg-red-500" : issue.severity === "MEDIUM" ? "bg-yellow-500" : "bg-blue-500"}>
                    {issue.severity}
                  </Badge>
                </div>
              ))}
              {issues.length > 5 && (
                <p className="text-sm text-gray-500">+{issues.length - 5} more issues</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Audit</CardTitle>
          <CardDescription>
            Comprehensive view of all active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{audit.organizationName}</div>
                      <div className="text-sm text-gray-500">{audit.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(audit.tier)}>
                      {audit.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={audit.status === "ACTIVE" ? "default" : "secondary"}>
                      {audit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">₦{audit.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">₦{audit.monthlyRevenue.toLocaleString()}/mo</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {audit.expiresAt ? format(new Date(audit.expiresAt), "MMM dd, yyyy") : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(audit.riskLevel)}>
                        {audit.riskLevel}
                      </Badge>
                      {audit.flags.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {audit.flags.length} flags
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSubscription(audit)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Subscription Details</DialogTitle>
                          <DialogDescription>
                            {audit.organizationName} - {audit.userEmail}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Subscription Info</h4>
                            <div className="space-y-1 text-sm">
                              <div>Tier: <Badge className={getTierColor(audit.tier)}>{audit.tier}</Badge></div>
                              <div>Status: {audit.status}</div>
                              <div>Started: {format(new Date(audit.startDate), "MMM dd, yyyy")}</div>
                              <div>Expires: {audit.expiresAt ? format(new Date(audit.expiresAt), "MMM dd, yyyy") : "Never"}</div>
                              <div>Total Revenue: ₦{audit.totalRevenue.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Usage Stats</h4>
                            <div className="space-y-1 text-sm">
                              <div>Emails: {audit.usageStats.emails.toLocaleString()}</div>
                              <div>SMS: {audit.usageStats.sms.toLocaleString()}</div>
                              <div>WhatsApp: {audit.usageStats.whatsapp.toLocaleString()}</div>
                              <div>LeadPulse: {audit.usageStats.leadPulseVisits.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        {audit.flags.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Flags</h4>
                            <div className="flex flex-wrap gap-1">
                              {audit.flags.map((flag, index) => (
                                <Badge key={index} variant="outline">{flag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <h4 className="font-medium">Admin Actions</h4>
                          <Select value={verificationAction} onValueChange={setVerificationAction}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APPROVE">Approve</SelectItem>
                              <SelectItem value="SUSPEND">Suspend</SelectItem>
                              <SelectItem value="DOWNGRADE">Downgrade to Free</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Textarea
                            placeholder="Reason for action..."
                            value={verificationReason}
                            onChange={(e) => setVerificationReason(e.target.value)}
                          />
                        </div>

                        <DialogFooter>
                          <Button
                            onClick={handleVerifySubscription}
                            disabled={!verificationAction || !verificationReason}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Execute Action
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}