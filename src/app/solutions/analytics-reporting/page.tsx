"use client";

import { BarChart3, LineChart, PieChart, BarChart4, BarChartHorizontal, Activity, PlusSquare, TrendingUp, Eye, Goal } from "lucide-react";
import { SolutionHero } from "@/components/solutions/solution-hero";
import { SolutionFeatures } from "@/components/solutions/solution-features";
import { SolutionCTA } from "@/components/solutions/solution-cta";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function AnalyticsReportingPage() {
  // Define primary color for this solution
  const primaryColor = "#8B5CF6"; // Purple
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Define features for this solution
  const features = [
    {
      title: "Real-time Dashboards",
      description: "Monitor campaign performance as it happens with live updating dashboards and metrics.",
      icon: <Activity className="h-6 w-6" />,
    },
    {
      title: "Multi-channel Metrics",
      description: "Track performance across email, SMS, WhatsApp, and web channels in a unified view.",
      icon: <PlusSquare className="h-6 w-6" />,
    },
    {
      title: "Conversion Tracking",
      description: "Measure conversion rates and attribute results to specific campaigns, channels, and content.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      title: "A/B Testing",
      description: "Compare multiple versions of your campaigns to identify what works best for your audience.",
      icon: <PieChart className="h-6 w-6" />,
    },
    {
      title: "Custom Reports",
      description: "Build personalized reports with the metrics that matter most to your business goals.",
      icon: <BarChart4 className="h-6 w-6" />,
    },
    {
      title: "Goal Tracking",
      description: "Set and monitor progress toward key performance indicators and business objectives.",
      icon: <Goal className="h-6 w-6" />,
    },
  ];

  return (
    <>
      <SolutionHero
        title="Analytics & Reporting"
        description="Make data-driven decisions with comprehensive analytics that track campaign performance across all channels in real-time."
        icon={<BarChart3 className="h-8 w-8" />}
        color={primaryColor}
      />
      
      <SolutionFeatures
        title="Gain Actionable Insights from Your Data"
        description="Transform raw data into meaningful insights that help you optimize campaigns and drive better results."
        features={features}
        color={primaryColor}
      />
      
      {/* Key metrics section */}
      <section className={`py-20 ${isDark ? 'bg-background' : 'bg-slate-50'}`}>
        <div className="container px-4 mx-auto">
          <h2 className={`text-2xl md:text-3xl font-bold mb-12 text-center ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Key Metrics You Can Track
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Email Metrics */}
            <MetricCard 
              title="Email Analytics" 
              icon={<Mail className="h-6 w-6" />}
              metrics={["Open rates", "Click-through rates", "Bounce rates", "Unsubscribe rates"]}
              color={primaryColor}
              index={0}
            />
            
            {/* Message Metrics */}
            <MetricCard 
              title="Messaging Analytics" 
              icon={<MessageSquare className="h-6 w-6" />}
              metrics={["Delivery rates", "Response rates", "Conversion rates", "Cost per message"]}
              color={primaryColor}
              index={1}
            />
            
            {/* Conversion Metrics */}
            <MetricCard 
              title="Conversion Analytics" 
              icon={<TrendingUp className="h-6 w-6" />}
              metrics={["Revenue generated", "ROI by campaign", "Conversion paths", "Attribution models"]}
              color={primaryColor}
              index={2}
            />
            
            {/* Audience Metrics */}
            <MetricCard 
              title="Audience Analytics" 
              icon={<Users className="h-6 w-6" />}
              metrics={["Growth rate", "Engagement scores", "Segment performance", "Customer lifetime value"]}
              color={primaryColor}
              index={3}
            />
            
            {/* Content Metrics */}
            <MetricCard 
              title="Content Analytics" 
              icon={<FileText className="h-6 w-6" />}
              metrics={["Content engagement", "A/B test results", "Best performing assets", "Content attribution"]}
              color={primaryColor}
              index={4}
            />
            
            {/* Campaign Metrics */}
            <MetricCard 
              title="Campaign Analytics" 
              icon={<BarChart3 className="h-6 w-6" />}
              metrics={["Campaign comparison", "Channel performance", "Time-based analysis", "Funnel visualization"]}
              color={primaryColor}
              index={5}
            />
          </div>
        </div>
      </section>
      
      {/* Dashboard preview */}
      <section className="py-20 bg-background">
        <div className="container px-4 mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center text-white">
            Interactive Dashboards
          </h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto rounded-xl overflow-hidden border border-slate-800 shadow-xl"
          >
            <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-500/20 p-2 rounded-md">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Campaign Performance Dashboard</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-md hover:bg-slate-800 cursor-pointer">
                  <Eye className="h-4 w-4 text-slate-400" />
                </div>
                <div className="p-1.5 rounded-md hover:bg-slate-800 cursor-pointer">
                  <Download className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
            
            {/* Dashboard mockup content */}
            <div className="p-6 grid grid-cols-12 gap-6 bg-gradient-to-br from-slate-900 to-slate-950">
              {/* Summary stats */}
              <div className="col-span-12 grid grid-cols-4 gap-4">
                <StatCard title="Open Rate" value="24.8%" trend="+2.1%" isUp={true} />
                <StatCard title="Click Rate" value="3.6%" trend="+0.5%" isUp={true} />
                <StatCard title="Conversion" value="2.4%" trend="-0.3%" isUp={false} />
                <StatCard title="Revenue" value="₦1.2M" trend="+15.3%" isUp={true} />
              </div>
              
              {/* Main chart */}
              <div className="col-span-8 bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-medium text-slate-300">Performance Trend</h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div>
                      <span>Opens</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                      <span>Clicks</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                      <span>Conversions</span>
                    </div>
                  </div>
                </div>
                
                {/* Chart placeholder */}
                <div className="h-64 w-full relative">
                  <div className="absolute inset-0 flex items-end">
                    {[35, 42, 38, 50, 60, 55, 65, 70, 58, 55, 60, 68].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full px-1">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-purple-600/80 to-purple-400/50 rounded-t-sm"
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Line chart overlay */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <motion.path 
                      d="M0,160 C40,120 80,140 120,80 C160,20 200,60 240,40 C280,20 320,40 360,20"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2 }}
                    />
                    <motion.path 
                      d="M0,180 C40,160 80,170 120,150 C160,130 200,140 240,120 C280,100 320,110 360,90"
                      stroke="#10b981"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                  </svg>
                </div>
                
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
              
              {/* Side charts */}
              <div className="col-span-4 space-y-4">
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 h-1/2">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Channel Distribution</h4>
                  <div className="h-32 flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <motion.div 
                        className="absolute inset-0 rounded-full border-8 border-purple-500/70"
                        style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      ></motion.div>
                      <motion.div 
                        className="absolute inset-0 rounded-full border-8 border-blue-500/70" 
                        style={{ borderLeftColor: 'transparent', borderTopColor: 'transparent' }}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 h-1/2">
                  <h4 className="text-sm font-medium text-slate-300 mb-4">Conversion by Region</h4>
                  <div className="space-y-3">
                    <ProgressBar label="Lagos" value={68} color="bg-purple-500" />
                    <ProgressBar label="Abuja" value={45} color="bg-blue-500" />
                    <ProgressBar label="PH" value={32} color="bg-green-500" />
                    <ProgressBar label="Other" value={24} color="bg-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      <SolutionCTA
        title="Ready to Gain Deeper Insights?"
        description="Start making data-driven decisions with our comprehensive analytics platform and watch your marketing ROI grow."
        color={primaryColor}
      />
    </>
  );
}

// Component for metric category cards
function MetricCard({ title, icon, metrics, color, index }: { 
  title: string; 
  icon: React.ReactNode; 
  metrics: string[];
  color: string;
  index: number;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`rounded-xl p-6 ${
        isDark 
          ? 'bg-slate-900 border border-slate-800' 
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      
      <ul className={`space-y-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {metrics.map((metric, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>{metric}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// Component for stat cards in dashboard
function StatCard({ title, value, trend, isUp }: { 
  title: string; 
  value: string;
  trend: string;
  isUp: boolean;
}) {
  return (
    <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/50">
      <h5 className="text-xs text-slate-400 mb-1">{title}</h5>
      <div className="flex items-end justify-between">
        <span className="text-xl font-semibold text-white">{value}</span>
        <span className={`text-xs ${isUp ? 'text-green-500' : 'text-red-500'} flex items-center`}>
          {isUp ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {trend}
        </span>
      </div>
    </div>
  );
}

// Component for progress bars
function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </div>
  );
}

// Missing icons
function Mail(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
}

function MessageSquare(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}

function Users(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function FileText(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
}

function Download(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
}

function TrendingDown(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
} 