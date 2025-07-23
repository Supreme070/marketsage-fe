"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SubscriptionAuditDashboard } from "@/components/admin/SubscriptionAuditDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";

// Staff email domains and whitelist
const ADMIN_DOMAINS = ['marketsage.africa'];
const ADMIN_EMAILS = [
  'admin@marketsage.africa',
  'support@marketsage.africa',
];

export default function AdminBillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("subscriptions");

  useEffect(() => {
    if (status === "loading") return;
    
    // If not authenticated, redirect to admin login
    if (!session) {
      router.replace("/admin");
      return;
    }

    // Check if user is MarketSage staff
    const userEmail = session.user?.email;
    const userRole = (session.user as any)?.role;
    
    const isStaff = userEmail && (
      ADMIN_EMAILS.includes(userEmail) ||
      ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
      ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
    );

    if (!isStaff) {
      router.replace("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no session, show redirect message
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const userEmail = session.user?.email;
  const userRole = (session.user as any)?.role;
  
  const isStaff = userEmail && (
    ADMIN_EMAILS.includes(userEmail) ||
    ADMIN_DOMAINS.some(domain => userEmail.endsWith(`@${domain}`)) ||
    ['ADMIN', 'SUPER_ADMIN', 'IT_ADMIN'].includes(userRole)
  );

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing Center</h1>
            <p className="text-sm text-muted-foreground">
              Subscription management, payments, and financial analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Financial Management
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Data
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
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦2.4M</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+89</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.7%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-0.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.1%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.5%</span> improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            {/* Use existing subscription audit dashboard */}
            <SubscriptionAuditDashboard />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>
                  Generate, manage, and track customer invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Management</h3>
                  <p className="text-gray-600 mb-4">
                    Complete invoice management system coming soon
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm">Generate Invoice</Button>
                    <Button variant="outline" size="sm">Export Data</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>
                  Monitor payment transactions, failures, and disputes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Center</h3>
                  <p className="text-gray-600 mb-4">
                    Comprehensive payment management system in development
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm">Process Refund</Button>
                    <Button variant="outline" size="sm">View Disputes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Detailed financial insights and forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced revenue analytics dashboard coming soon
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm">Export Report</Button>
                    <Button variant="outline" size="sm">Schedule Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common billing management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <DollarSign className="h-5 w-5 mb-2" />
                <span className="text-sm">Process Refund</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <Calendar className="h-5 w-5 mb-2" />
                <span className="text-sm">Extend Subscription</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 mb-2" />
                <span className="text-sm">Flag Account</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <FileText className="h-5 w-5 mb-2" />
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Notice */}
        {userRole === 'SUPER_ADMIN' && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Development Status</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Billing Center foundation complete with subscription audit. Additional features 
                  (invoices, payments, analytics) are being developed according to the roadmap.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}