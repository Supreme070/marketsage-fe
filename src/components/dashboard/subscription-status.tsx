"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { AlertCircle, Crown, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionStatus {
  tier: string;
  expiresAt: string | null;
  gracePeriodEndsAt: string | null;
  usage: {
    emails: { used: number; limit: number };
    sms: { used: number; limit: number };
    whatsapp: { used: number; limit: number };
    leadPulseVisits: { used: number; limit: number };
  };
}

export function SubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscriptions/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading subscription status...</div>;
  }

  if (!status) {
    return null;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "ENTERPRISE":
        return "bg-purple-500";
      case "PROFESSIONAL":
        return "bg-blue-500";
      case "STARTER":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const daysUntilExpiry = status.expiresAt
    ? differenceInDays(new Date(status.expiresAt), new Date())
    : null;

  const isInGracePeriod = status.gracePeriodEndsAt
    ? new Date() > new Date(status.expiresAt!) && new Date() < new Date(status.gracePeriodEndsAt)
    : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Your current plan and usage
            </CardDescription>
          </div>
          <Badge className={getTierColor(status.tier)}>
            {status.tier}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expiry Warning */}
        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            isInGracePeriod ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {isInGracePeriod
                ? `Grace period ends in ${differenceInDays(new Date(status.gracePeriodEndsAt!), new Date())} days`
                : `Subscription expires in ${daysUntilExpiry} days`}
            </span>
          </div>
        )}

        {/* Usage Metrics */}
        <div className="space-y-3">
          {/* Email Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Email Messages</span>
              <span>
                {status.usage.emails.limit === -1
                  ? "Unlimited"
                  : `${status.usage.emails.used} / ${status.usage.emails.limit}`}
              </span>
            </div>
            {status.usage.emails.limit !== -1 && (
              <Progress value={getUsagePercentage(status.usage.emails.used, status.usage.emails.limit)} />
            )}
          </div>

          {/* SMS Usage */}
          {status.usage.sms.limit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>SMS Credits</span>
                <span>
                  {status.usage.sms.limit === -1
                    ? "Unlimited"
                    : `${status.usage.sms.used} / ${status.usage.sms.limit}`}
                </span>
              </div>
              {status.usage.sms.limit !== -1 && (
                <Progress value={getUsagePercentage(status.usage.sms.used, status.usage.sms.limit)} />
              )}
            </div>
          )}

          {/* WhatsApp Usage */}
          {status.usage.whatsapp.limit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>WhatsApp Messages</span>
                <span>
                  {status.usage.whatsapp.limit === -1
                    ? "Unlimited"
                    : `${status.usage.whatsapp.used} / ${status.usage.whatsapp.limit}`}
                </span>
              </div>
              {status.usage.whatsapp.limit !== -1 && (
                <Progress value={getUsagePercentage(status.usage.whatsapp.used, status.usage.whatsapp.limit)} />
              )}
            </div>
          )}

          {/* LeadPulse Usage */}
          {status.usage.leadPulseVisits.limit > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>LeadPulse Visitors</span>
                <span>
                  {status.usage.leadPulseVisits.limit === -1
                    ? "Unlimited"
                    : `${status.usage.leadPulseVisits.used} / ${status.usage.leadPulseVisits.limit}`}
                </span>
              </div>
              {status.usage.leadPulseVisits.limit !== -1 && (
                <Progress value={getUsagePercentage(status.usage.leadPulseVisits.used, status.usage.leadPulseVisits.limit)} />
              )}
            </div>
          )}
        </div>

        {/* Upgrade Button */}
        {status.tier !== "ENTERPRISE" && (
          <Button 
            className="w-full" 
            onClick={() => router.push("/pricing")}
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}