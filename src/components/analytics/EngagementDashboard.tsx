'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, TooltipProps 
} from 'recharts';
import { 
  Calendar, Clock, Filter, MailOpen, MousePointerClick, 
  RefreshCw, BarChart2, PieChart as PieChartIcon, Activity, 
  Loader2
} from 'lucide-react';

// Type for chart data value
type ValueType = string | number | Array<string | number>;

// Simulated data - in a real app, this would come from the API
const mockData = {
  emailStats: {
    sent: 5462,
    delivered: 5240,
    opened: 2150,
    clicked: 863,
    bounced: 222,
    unsubscribed: 45,
    openRate: 0.41,
    clickRate: 0.40,
    bounceRate: 0.04,
    unsubscribeRate: 0.008,
  },
  opensByHour: [
    { hour: '00', count: 26 }, { hour: '01', count: 14 }, { hour: '02', count: 8 }, 
    { hour: '03', count: 5 }, { hour: '04', count: 7 }, { hour: '05', count: 12 }, 
    { hour: '06', count: 42 }, { hour: '07', count: 98 }, { hour: '08', count: 178 }, 
    { hour: '09', count: 276 }, { hour: '10', count: 301 }, { hour: '11', count: 286 }, 
    { hour: '12', count: 212 }, { hour: '13', count: 176 }, { hour: '14', count: 154 }, 
    { hour: '15', count: 129 }, { hour: '16', count: 106 }, { hour: '17', count: 86 }, 
    { hour: '18', count: 75 }, { hour: '19', count: 68 }, { hour: '20', count: 62 }, 
    { hour: '21', count: 52 }, { hour: '22', count: 43 }, { hour: '23', count: 34 },
  ],
  opensByDay: [
    { day: 'Sun', count: 201 },
    { day: 'Mon', count: 352 },
    { day: 'Tue', count: 412 },
    { day: 'Wed', count: 386 },
    { day: 'Thu', count: 354 },
    { day: 'Fri', count: 289 },
    { day: 'Sat', count: 156 },
  ],
  deliveryStatus: [
    { name: 'Delivered', value: 5240 },
    { name: 'Bounced', value: 222 },
  ],
  engagementStatus: [
    { name: 'Opened', value: 2150 },
    { name: 'Not Opened', value: 3090 },
  ],
  clickStatus: [
    { name: 'Clicked', value: 863 },
    { name: 'Not Clicked', value: 1287 },
  ],
  topCampaigns: [
    { name: 'Summer Sale Promo', openRate: 0.58, clickRate: 0.46 },
    { name: 'New Product Launch', openRate: 0.52, clickRate: 0.44 },
    { name: 'Customer Survey', openRate: 0.48, clickRate: 0.26 },
    { name: 'Monthly Newsletter', openRate: 0.45, clickRate: 0.32 },
    { name: 'Holiday Special', openRate: 0.42, clickRate: 0.38 },
  ],
  clicksByLink: [
    { linkName: 'Product Page', clicks: 342 },
    { linkName: 'Pricing Page', clicks: 186 },
    { linkName: 'Blog Article', clicks: 154 },
    { linkName: 'Special Offer', clicks: 124 },
    { linkName: 'Contact Us', clicks: 57 },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EngagementDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [entityType, setEntityType] = useState('email');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(mockData);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    // Simulate API call to fetch data
    const timer = setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRefreshing(false);
      toast.success('Dashboard data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <Skeleton className="h-80 w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('default', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Custom formatters for tooltips
  const formatOpens = (value: ValueType) => [`${value} opens`, 'Count'];
  const formatClicks = (value: ValueType) => [`${value} clicks`, 'Count'];
  const formatCount = (value: ValueType) => [`${formatNumber(Number(value))}`, 'Count'];
  const formatRates = (value: ValueType) => [formatPercent(Number(value)), ''];
  const formatLabel = (label: string) => `Hour ${label}:00 - ${label}:59`;

  const ChartSelector = () => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Bar
        </Button>
        <Button
          variant={chartType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('line')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Line
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Engagement Analytics</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.emailStats.sent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MailOpen className="h-4 w-4" />
              Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(data.emailStats.openRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.emailStats.opened)} of {formatNumber(data.emailStats.delivered)} emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(data.emailStats.clickRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.emailStats.clicked)} of {formatNumber(data.emailStats.opened)} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(data.emailStats.bounceRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.emailStats.bounced)} of {formatNumber(data.emailStats.sent)} emails
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hourly" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="hourly" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Opens by Hour
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Opens by Day
            </TabsTrigger>
          </TabsList>
          <ChartSelector />
        </div>

        <TabsContent value="hourly" className="p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 pt-4">
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'bar' ? (
                  <BarChart data={data.opensByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }} />
                    <YAxis label={{ value: 'Opens', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={formatOpens}
                      labelFormatter={formatLabel}
                    />
                    <Bar dataKey="count" name="Opens" fill="#8884d8" />
                  </BarChart>
                ) : (
                  <LineChart data={data.opensByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }} />
                    <YAxis label={{ value: 'Opens', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={formatOpens}
                      labelFormatter={formatLabel}
                    />
                    <Line type="monotone" dataKey="count" name="Opens" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 pt-4">
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'bar' ? (
                  <BarChart data={data.opensByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Day of Week', position: 'insideBottom', offset: -10 }} />
                    <YAxis label={{ value: 'Opens', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={formatOpens} />
                    <Bar dataKey="count" name="Opens" fill="#82ca9d" />
                  </BarChart>
                ) : (
                  <LineChart data={data.opensByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Day of Week', position: 'insideBottom', offset: -10 }} />
                    <YAxis label={{ value: 'Opens', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={formatOpens} />
                    <Line type="monotone" dataKey="count" name="Opens" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Engagement Breakdown
            </CardTitle>
            <CardDescription>Distribution of email engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.engagementStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.engagementStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatCount} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" />
              Click Performance
            </CardTitle>
            <CardDescription>Top clicked links</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.clicksByLink}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 50,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="linkName" type="category" width={100} />
                <Tooltip formatter={formatClicks} />
                <Bar dataKey="clicks" name="Clicks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Campaigns</CardTitle>
          <CardDescription>Campaigns with the highest engagement rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data.topCampaigns}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={70} />
              <YAxis label={{ value: 'Rate', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={formatRates} />
              <Legend />
              <Bar dataKey="openRate" name="Open Rate" fill="#8884d8" />
              <Bar dataKey="clickRate" name="Click Rate" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
} 