"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  Brain,
  RefreshCw,
  Settings,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  MessageSquare,
  Calendar,
  Zap,
  BarChart3,
  PlayCircle,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StaticDashboardGrid, { type DashboardPanelConfig } from '@/components/panels/StaticDashboardGrid';
import SingleStatPanel from '@/components/panels/SingleStatPanel';
import TimeSeriesPanel from '@/components/panels/TimeSeriesPanel';
import PiePanel from '@/components/panels/PiePanel';
import BarPanel from '@/components/panels/BarPanel';
import Panel from '@/components/panels/Panel';

export default function ChurnPredictionDashboard() {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '180d' | '12m'>('90d');
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [schedulingCampaign, setSchedulingCampaign] = useState(false);
  const router = useRouter();

  const refreshData = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success('Churn predictions refreshed');
  };

  // Handle generate new prediction
  const handleGeneratePrediction = async () => {
    setGeneratingPrediction(true);
    
    try {
      // Simulate API call for generating new prediction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('New churn prediction generated successfully');
      toast.info('Found 3 new high-risk customers requiring immediate attention');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate churn prediction');
    } finally {
      setGeneratingPrediction(false);
    }
  };

  // Handle schedule re-engagement campaign
  const handleScheduleReengagement = async () => {
    setSchedulingCampaign(true);
    
    try {
      // Simulate campaign setup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to workflows page with re-engagement template
      router.push("/workflows/new-workflow?template=advanced-re-engagement");
      toast.success('Redirecting to re-engagement campaign setup...');
    } catch (error) {
      console.error(error);
      toast.error('Failed to schedule re-engagement campaign');
    } finally {
      setSchedulingCampaign(false);
    }
  };

  // Mock time series data for churn trends
  const churnRateTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(8.5 + Math.random() * 4 + Math.sin(idx * 0.2) * 2),
  }));

  const retentionTrendData = Array.from({ length: 30 }).map((_, idx) => ({
    x: `Day ${idx + 1}`,
    y: Math.round(75 + Math.random() * 8 + Math.cos(idx * 0.15) * 4),
  }));

  // Sparkline data for stat panels
  const churnRateSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(8.5 - idx * 0.2 + Math.random() * 1),
  }));

  const atRiskSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(247 + idx * 8 + Math.random() * 15),
  }));

  const revenueRiskSparkline = Array.from({ length: 10 }).map((_, idx) => ({
    x: idx,
    y: Math.round(182000 + idx * 5000 + Math.random() * 10000),
  }));

  // High Risk Customers Panel
  const HighRiskCustomersPanel = () => (
    <Panel title="High Risk Customers">
      <div className="space-y-3 flex-1">
        {[
          { 
            name: 'TechCorp Nigeria', 
            email: 'contact@techcorp.ng',
            churnScore: 89, 
            revenue: '₦2.4M',
            lastActivity: '45 days ago',
            factors: ['No email opens', 'Missed payments']
          },
          { 
            name: 'Lagos Retail Ltd', 
            email: 'admin@lagosretail.com',
            churnScore: 76, 
            revenue: '₦1.8M',
            lastActivity: '28 days ago',
            factors: ['Declining engagement', 'Support tickets']
          },
          { 
            name: 'Abuja Solutions', 
            email: 'info@abujasol.ng',
            churnScore: 72, 
            revenue: '₦950K',
            lastActivity: '21 days ago',
            factors: ['Payment delays', 'Low usage']
          },
          { 
            name: 'Port Harcourt Biz', 
            email: 'hello@phbiz.com',
            churnScore: 68, 
            revenue: '₦760K',
            lastActivity: '18 days ago',
            factors: ['Feature complaints', 'Competitor interest']
          }
        ].map((customer, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-white">{customer.name}</span>
                <div className="text-xs text-gray-400">{customer.email}</div>
              </div>
              <Badge 
                variant="destructive" 
                className="bg-red-500/20 text-red-400 border-red-500/30"
              >
                {customer.churnScore}% risk
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400">{customer.revenue} revenue</span>
              <span className="text-xs text-gray-400">{customer.lastActivity}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {customer.factors.map((factor, idx) => (
                <Badge key={idx} variant="outline" className="text-xs text-red-400 border-red-400/30">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Churn Risk Factors Panel
  const ChurnRiskFactorsPanel = () => (
    <Panel title="Key Churn Risk Factors">
      <div className="space-y-4 flex-1">
        {[
          { factor: 'Low Engagement Score', impact: 92, trend: 'up' },
          { factor: 'Payment Issues', impact: 87, trend: 'up' },
          { factor: 'Support Ticket Volume', impact: 78, trend: 'stable' },
          { factor: 'Feature Usage Decline', impact: 71, trend: 'down' },
          { factor: 'Login Frequency Drop', impact: 65, trend: 'up' },
          { factor: 'Competitor Activity', impact: 58, trend: 'up' }
        ].map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">{item.factor}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{item.impact}%</span>
                <div className={`text-xs ${item.trend === 'up' ? 'text-red-400' : item.trend === 'down' ? 'text-green-400' : 'text-gray-400'}`}>
                  {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  item.impact >= 80 ? 'bg-red-500' :
                  item.impact >= 60 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${item.impact}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Retention Strategies Panel
  const RetentionStrategiesPanel = () => (
    <Panel title="AI Retention Strategies">
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Predicted Success Rate</div>
            <div className="text-xl font-bold text-green-400">78%</div>
            <div className="text-xs text-gray-400">with AI interventions</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <div className="text-xs text-gray-400 mb-1">Revenue at Risk</div>
            <div className="text-xl font-bold text-red-400">₦12.8M</div>
            <div className="text-xs text-gray-400">next 90 days</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            {
              strategy: 'Personalized Win-Back Campaign',
              success: 85,
              impact: '₦3.2M revenue saved',
              timeframe: '14 days'
            },
            {
              strategy: 'Premium Feature Access',
              success: 72,
              impact: '₦2.1M revenue saved',
              timeframe: '7 days'
            },
            {
              strategy: 'Dedicated Account Manager',
              success: 68,
              impact: '₦1.8M revenue saved',
              timeframe: '30 days'
            }
          ].map((strategy, index) => (
            <div key={index} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{strategy.strategy}</span>
                <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                  {strategy.success}% success
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-400">{strategy.impact}</span>
                <span className="text-gray-400">{strategy.timeframe}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );

  // Customer Segments at Risk Panel
  const SegmentsAtRiskPanel = () => (
    <Panel title="Segments at Risk">
      <div className="space-y-3 flex-1">
        {[
          { segment: 'Enterprise Customers', count: 23, avgValue: '₦2.1M', risk: 'high' },
          { segment: 'SME Businesses', count: 67, avgValue: '₦450K', risk: 'medium' },
          { segment: 'Startups', count: 134, avgValue: '₦85K', risk: 'low' },
          { segment: 'Freelancers', count: 89, avgValue: '₦25K', risk: 'medium' }
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div>
              <span className="text-sm font-medium text-white">{item.segment}</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">{item.count} customers</span>
                <Badge variant="outline" className="text-xs">
                  {item.avgValue} avg value
                </Badge>
              </div>
            </div>
            <Badge 
              variant={item.risk === 'high' ? 'destructive' : item.risk === 'medium' ? 'secondary' : 'default'}
              className={`text-xs ${
                item.risk === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                item.risk === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-green-500/20 text-green-400 border-green-500/30'
              }`}
            >
              {item.risk.toUpperCase()} RISK
            </Badge>
          </div>
        ))}
      </div>
    </Panel>
  );

  // Quick Actions Panel
  const QuickActionsPanel = () => (
    <Panel title="Quick Actions">
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-1 gap-3">
          <Button 
            className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400" 
            onClick={handleGeneratePrediction} 
            disabled={generatingPrediction}
          >
            {generatingPrediction ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate New Prediction
              </>
            )}
          </Button>
          
          <Button 
            className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400" 
            onClick={handleScheduleReengagement}
            disabled={schedulingCampaign}
          >
            {schedulingCampaign ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Re-engagement Campaign
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Export High-Risk Contacts
          </Button>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Last Prediction Run</div>
          <div className="text-sm text-white">2 hours ago</div>
          <div className="text-xs text-gray-400">Next automated run: 6 hours</div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
          <div className="text-xs text-gray-400 mb-2">Campaign Status</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-white">3 Active Campaigns</span>
          </div>
          <div className="text-xs text-gray-400">Win-back emails sending to 89 customers</div>
        </div>

        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Urgent Actions Needed</span>
          </div>
          <div className="text-xs text-gray-300">
            • 23 customers need immediate attention<br/>
            • 8 high-value accounts at critical risk<br/>
            • 3 enterprise clients require manual outreach
          </div>
        </div>
      </div>
    </Panel>
  );

  // Critical Alerts Panel
  const CriticalAlertsPanel = () => (
    <Panel title="Critical Alerts">
      <div className="space-y-3 flex-1">
        {[
          {
            alert: 'Enterprise Account: TechCorp Nigeria',
            severity: 'critical',
            message: '₦2.4M account shows 89% churn probability',
            action: 'Immediate executive intervention required',
            time: '2 hours ago'
          },
          {
            alert: 'Payment Issues Detected',
            severity: 'high',
            message: '12 customers with failed payment attempts',
            action: 'Contact billing department urgently',
            time: '4 hours ago'
          },
          {
            alert: 'Competitor Migration Risk',
            severity: 'medium',
            message: '6 customers researching alternatives',
            action: 'Deploy retention offers immediately',
            time: '6 hours ago'
          }
        ].map((alert, index) => (
          <div key={index} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{alert.alert}</span>
              <Badge 
                variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'secondary' : 'outline'}
                className={`text-xs ${
                  alert.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  alert.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}
              >
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-gray-300 mb-2">{alert.message}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400">{alert.action}</span>
              <span className="text-xs text-gray-400">{alert.time}</span>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          className="w-full text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <PlayCircle className="mr-2 h-3 w-3" />
          Execute Emergency Retention Protocol
        </Button>
      </div>
    </Panel>
  );

  // Custom Churn Timeline Panel
  const ChurnTimelinePanel = () => (
    <Panel title="Predicted Churn Timeline">
      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-4 gap-4">
          {[
            { 
              period: 'Next 30 Days', 
              count: 47, 
              severity: 'critical',
              description: 'Immediate risk',
              percentage: 19
            },
            { 
              period: 'Next 60 Days', 
              count: 89, 
              severity: 'high',
              description: 'Short-term risk',
              percentage: 36
            },
            { 
              period: 'Next 90 Days', 
              count: 134, 
              severity: 'medium',
              description: 'Medium-term risk',
              percentage: 54
            },
            { 
              period: 'Next 180 Days', 
              count: 198, 
              severity: 'low',
              description: 'Long-term risk',
              percentage: 80
            }
          ].map((item, index) => (
            <div key={index} className="relative">
              {/* Timeline connector */}
              {index < 3 && (
                <div className="absolute top-8 left-full w-4 h-0.5 bg-gray-600 z-0"></div>
              )}
              
              {/* Timeline node */}
              <div className="relative bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                <div className={`absolute -top-2 left-4 w-4 h-4 rounded-full border-2 ${
                  item.severity === 'critical' ? 'bg-red-500 border-red-400' :
                  item.severity === 'high' ? 'bg-amber-500 border-amber-400' :
                  item.severity === 'medium' ? 'bg-blue-500 border-blue-400' :
                  'bg-green-500 border-green-400'
                }`}></div>
                
                <div className="text-xs font-medium text-gray-400 mb-1">{item.period}</div>
                <div className="text-2xl font-bold text-white mb-1">{item.count}</div>
                <div className="text-xs text-gray-300 mb-2">{item.description}</div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.severity === 'critical' ? 'bg-red-500' :
                      item.severity === 'high' ? 'bg-amber-500' :
                      item.severity === 'medium' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-400">{item.percentage}% cumulative</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
            <div className="text-xs text-red-400 mb-1">Critical (30 days)</div>
            <div className="text-lg font-bold text-red-400">47 customers</div>
            <div className="text-xs text-gray-400">₦5.2M revenue at risk</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
            <div className="text-xs text-amber-400 mb-1">Short-term (60 days)</div>
            <div className="text-lg font-bold text-amber-400">89 customers</div>
            <div className="text-xs text-gray-400">₦8.7M revenue at risk</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
            <div className="text-xs text-blue-400 mb-1">Total (180 days)</div>
            <div className="text-lg font-bold text-blue-400">198 customers</div>
            <div className="text-xs text-gray-400">₦18.3M revenue at risk</div>
          </div>
        </div>
        
        {/* Action Recommendations */}
        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-400 mb-1">Recommended Action</div>
              <div className="text-xs text-gray-300">Focus immediate retention efforts on 47 critical customers</div>
            </div>
            <Button 
              size="sm" 
              className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400"
            >
              <Target className="mr-1 h-3 w-3" />
              Target Now
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );

  // Define dashboard panels
  const dashboardPanels: DashboardPanelConfig[] = [
    // Top Row - Key Churn Metrics
    {
      id: 'churn_rate',
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Predicted Churn Rate"
          value="8.3"
          unit="%"
          isLoading={false}
          trendValue="-1.2% vs last month"
          trend="down"
          sparklineData={churnRateSparkline}
          icon={<TrendingDown className="h-5 w-5 text-red-400" />}
        />
      ),
    },
    {
      id: 'at_risk_customers',
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Customers at Risk"
          value="247"
          unit=""
          isLoading={false}
          trendValue="+23 new risks identified"
          trend="up"
          sparklineData={atRiskSparkline}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        />
      ),
    },
    {
      id: 'revenue_at_risk',
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Revenue at Risk"
          value="₦12.8"
          unit="M"
          isLoading={false}
          trendValue="+₦2.1M vs last quarter"
          trend="up"
          sparklineData={revenueRiskSparkline}
          icon={<Target className="h-5 w-5 text-purple-400" />}
        />
      ),
    },
    {
      id: 'retention_rate',
      x: 9,
      y: 0,
      w: 3,
      h: 2,
      component: (
        <SingleStatPanel
          title="Retention Rate"
          value="76.4"
          unit="%"
          isLoading={false}
          trendValue="+3.2% improvement target"
          trend="up"
          sparklineData={[]}
          icon={<Shield className="h-5 w-5 text-green-400" />}
        />
      ),
    },

    // Second Row - Actions and High Risk Customers
    {
      id: 'quick_actions',
      x: 0,
      y: 2,
      w: 4,
      h: 4,
      component: <QuickActionsPanel />,
    },
    {
      id: 'high_risk_customers',
      x: 4,
      y: 2,
      w: 4,
      h: 4,
      component: <HighRiskCustomersPanel />,
    },
    {
      id: 'critical_alerts',
      x: 8,
      y: 2,
      w: 4,
      h: 4,
      component: <CriticalAlertsPanel />,
    },

    // Third Row - Trend Analysis
    {
      id: 'churn_trend',
      x: 0,
      y: 6,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Churn Rate Prediction Trend"
          data={churnRateTrendData}
          yLabel="Churn Rate %"
          stroke="#ef4444"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'churn_factors',
      x: 8,
      y: 6,
      w: 4,
      h: 4,
      component: <ChurnRiskFactorsPanel />,
    },

    // Fourth Row - Retention Analysis
    {
      id: 'retention_trend',
      x: 0,
      y: 10,
      w: 8,
      h: 4,
      component: (
        <TimeSeriesPanel
          title="Customer Retention Trend"
          data={retentionTrendData}
          yLabel="Retention %"
          stroke="#10b981"
          fillGradient={true}
        />
      ),
    },
    {
      id: 'retention_strategies',
      x: 8,
      y: 10,
      w: 4,
      h: 4,
      component: <RetentionStrategiesPanel />,
    },

    // Fifth Row - Detailed Analysis
    {
      id: 'churn_by_segment',
      x: 0,
      y: 14,
      w: 4,
      h: 4,
      component: (
        <PiePanel
          title="Churn Risk by Customer Segment"
          data={[
            { name: 'Enterprise', value: 23 },
            { name: 'SME', value: 67 },
            { name: 'Startups', value: 134 },
            { name: 'Freelancers', value: 89 },
          ]}
          isLoading={false}
        />
      ),
    },
    {
      id: 'retention_by_channel',
      x: 4,
      y: 14,
      w: 4,
      h: 4,
      component: (
        <BarPanel
          title="Retention Rate by Acquisition Channel"
          data={[
            { name: 'Organic Search', value: 82.5 },
            { name: 'Email Marketing', value: 76.8 },
            { name: 'Social Media', value: 71.2 },
            { name: 'Paid Advertising', value: 68.9 },
            { name: 'Referrals', value: 88.3 },
          ]}
          dataKey="value"
          xKey="name"
          isLoading={false}
        />
      ),
    },
    {
      id: 'segments_at_risk',
      x: 8,
      y: 14,
      w: 4,
      h: 4,
      component: <SegmentsAtRiskPanel />,
    },

    // Sixth Row - Timeline and Additional Insights
    {
      id: 'churn_timeline',
      x: 0,
      y: 18,
      w: 12,
      h: 6,
      component: <ChurnTimelinePanel />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Grafana-style controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-amber-500/20 rounded-lg border border-red-500/20">
              <Brain className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Churn Prediction & Prevention
                <Badge variant="secondary" className="bg-gradient-to-r from-red-500/10 to-amber-500/10 text-red-400 border-red-500/20">
                  AI-Powered
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">Predict customer churn and implement retention strategies</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
            {(['30d', '90d', '180d', '12m'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={`h-7 px-3 text-xs ${
                  timeRange === range 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grafana-style Dashboard Grid */}
      <StaticDashboardGrid panels={dashboardPanels} />
    </div>
  );
} 