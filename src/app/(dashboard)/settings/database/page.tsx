"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive,
  UploadCloud,
  FileDown,
  Clock,
  Gauge,
  BarChart3,
  Search,
  Loader2,
  XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DatabaseSettingsPage() {
  // General loading state
  const [loading, setLoading] = useState(false);
  
  // Database status state
  const [dbStatus, setDbStatus] = useState({
    status: "connected", // connected, disconnected, error
    version: "PostgreSQL 16.0",
    uptime: "7 days, 12 hours",
    lastBackup: "2025-05-05 23:00:00",
  });
  
  // Storage usage state
  const [storageStats, setStorageStats] = useState({
    used: "1.2 GB",
    allocated: "5 GB",
    usedPercentage: 42,
    tables: 42,
    indexes: 98,
    totalRows: "1.2M",
  });
  
  // Health metrics state
  const [healthMetrics, setHealthMetrics] = useState({
    connections: {
      current: 32,
      max: 100,
      percentage: 32,
    },
    queryPerformance: {
      avgTime: "86ms",
      percentage: 23,
    },
    cacheHitRatio: {
      value: "98.2%",
      percentage: 98,
    },
  });
  
  // Slow queries state
  const [slowQueries, setSlowQueries] = useState([
    {
      id: "1",
      query: "SELECT * FROM users WHERE email LIKE '%example.com'",
      duration: "4.2s",
      time: "5 hrs ago",
    },
    {
      id: "2",
      query: "SELECT COUNT(*) FROM analytics GROUP BY date",
      duration: "2.8s",
      time: "8 hrs ago",
    },
  ]);
  
  // Connection settings state
  const [connectionSettings, setConnectionSettings] = useState({
    host: "db",
    port: "5432",
    database: "marketsage",
    username: "marketsage",
    password: "••••••••••••",
    enableSSL: true,
  });
  
  // Backup settings state
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    frequency: "daily",
    time: "23:00",
    retention: "30",
    location: "local",
  });
  
  // Backups history state
  const [backupHistory, setBackupHistory] = useState([
    {
      id: "1",
      date: "2025-05-05 23:00:00",
      size: "1.2 GB",
      status: "completed",
    },
    {
      id: "2",
      date: "2025-05-04 23:00:00",
      size: "1.18 GB",
      status: "completed",
    },
    {
      id: "3",
      date: "2025-05-03 23:00:00",
      size: "1.15 GB",
      status: "completed",
    },
  ]);
  
  // Maintenance settings state
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    autoVacuum: true,
    autoAnalyze: true,
    maintenanceWindow: "daily",
  });
  
  // Operation states
  const [testingConnection, setTestingConnection] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [runningVacuum, setRunningVacuum] = useState(false);
  const [runningReindex, setRunningReindex] = useState(false);
  const [runningAnalyze, setRunningAnalyze] = useState(false);
  
  // Dialog states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  
  // Event handlers for connection settings
  const handleConnectionSettingChange = (field: string, value: any) => {
    setConnectionSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTestConnection = () => {
    setTestingConnection(true);
    // Simulate API call
    setTimeout(() => {
      setTestingConnection(false);
      toast.success("Database connection successful!");
    }, 2000);
  };
  
  const handleSaveConnection = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Connection settings saved successfully");
    }, 1500);
  };
  
  // Event handlers for backup settings
  const handleBackupSettingChange = (field: string, value: any) => {
    setBackupSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleBackupNow = () => {
    setBackingUp(true);
    // Simulate API call
    setTimeout(() => {
      setBackingUp(false);
      // Add new backup to history
      const newBackup = {
        id: String(Date.now()),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        size: "1.21 GB",
        status: "completed",
      };
      setBackupHistory(prev => [newBackup, ...prev]);
      toast.success("Database backup completed successfully");
    }, 3000);
  };
  
  const handleSaveBackupSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Backup settings saved successfully");
    }, 1500);
  };
  
  const handleDownloadBackup = (id: string) => {
    setDownloading(id);
    // Simulate download
    setTimeout(() => {
      setDownloading("");
      const backup = backupHistory.find(b => b.id === id);
      if (backup) {
        toast.success(`Started downloading backup from ${backup.date}`);
      }
    }, 1500);
  };
  
  // Event handlers for maintenance operations
  const handleRunVacuum = () => {
    setRunningVacuum(true);
    // Simulate operation
    setTimeout(() => {
      setRunningVacuum(false);
      toast.success("Vacuum operation completed successfully");
    }, 3000);
  };
  
  const handleRunReindex = () => {
    setRunningReindex(true);
    // Simulate operation
    setTimeout(() => {
      setRunningReindex(false);
      toast.success("Reindex operation completed successfully");
    }, 4000);
  };
  
  const handleRunAnalyze = () => {
    setRunningAnalyze(true);
    // Simulate operation
    setTimeout(() => {
      setRunningAnalyze(false);
      toast.success("Analyze operation completed successfully");
    }, 2500);
  };
  
  const handleResetDatabase = () => {
    setShowResetDialog(true);
  };
  
  const confirmResetDatabase = () => {
    setLoading(true);
    setShowResetDialog(false);
    // Simulate dangerous operation
    setTimeout(() => {
      setLoading(false);
      toast.success("Database has been reset to its initial state");
    }, 5000);
  };
  
  const handleSaveMaintenanceSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Maintenance settings saved successfully");
    }, 1500);
  };
  
  const handleRefreshStatus = () => {
    setRefreshingStatus(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshingStatus(false);
      // Could update database stats here
      toast.success("Database status refreshed");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Database Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage database connections and maintenance.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshStatus}
              disabled={refreshingStatus}
            >
              {refreshingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Stats
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Database Status</CardTitle>
                <CardDescription>Current database system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">PostgreSQL</span>
                  </div>
                  {dbStatus.status === "connected" ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : dbStatus.status === "error" ? (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      <XCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{dbStatus.version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>{dbStatus.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Backup:</span>
                    <span>{dbStatus.lastBackup}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Storage Usage</CardTitle>
                <CardDescription>Database storage statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Size:</span>
                    <span className="font-medium">{storageStats.used}</span>
                  </div>
                  <Progress value={storageStats.usedPercentage} className="h-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{storageStats.used} used</span>
                    <span>{storageStats.allocated} allocated</span>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tables:</span>
                    <span>{storageStats.tables}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Indexes:</span>
                    <span>{storageStats.indexes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Rows:</span>
                    <span>{storageStats.totalRows}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Health</CardTitle>
              <CardDescription>
                Performance metrics and health indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connections</span>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{healthMetrics.connections.current}</div>
                  <Progress value={healthMetrics.connections.percentage} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    {healthMetrics.connections.current} of {healthMetrics.connections.max} maximum connections
                  </div>
                </div>
                
                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Query Performance</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{healthMetrics.queryPerformance.avgTime}</div>
                  <Progress value={healthMetrics.queryPerformance.percentage} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Avg. query time: {healthMetrics.queryPerformance.avgTime}
                  </div>
                </div>
                
                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Hit Ratio</span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{healthMetrics.cacheHitRatio.value}</div>
                  <Progress value={healthMetrics.cacheHitRatio.percentage} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Buffer cache efficiency
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Recent Slow Queries</h4>
                  <Button variant="outline" size="sm">
                    <Search className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                </div>
                <div className="text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2 font-medium text-muted-foreground">Query</th>
                        <th className="pb-2 font-medium text-muted-foreground">Duration</th>
                        <th className="pb-2 font-medium text-muted-foreground">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slowQueries.map((query) => (
                        <tr key={query.id} className="border-b">
                          <td className="py-2">
                            <code className="text-xs bg-secondary/20 rounded px-1 py-0.5">
                              {query.query}
                            </code>
                          </td>
                          <td className="py-2">{query.duration}</td>
                          <td className="py-2 text-muted-foreground">{query.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Connection</CardTitle>
              <CardDescription>
                Configure your database connection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-type">Database Type</Label>
                <div className="flex">
                  <Input id="db-type" value="PostgreSQL" readOnly className="bg-secondary/10" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-host">Database Host</Label>
                <Input 
                  id="db-host" 
                  placeholder="localhost" 
                  value={connectionSettings.host} 
                  onChange={(e) => handleConnectionSettingChange('host', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input 
                    id="db-port" 
                    placeholder="5432" 
                    value={connectionSettings.port} 
                    onChange={(e) => handleConnectionSettingChange('port', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input 
                    id="db-name" 
                    placeholder="marketsage" 
                    value={connectionSettings.database} 
                    onChange={(e) => handleConnectionSettingChange('database', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-username">Username</Label>
                <Input 
                  id="db-username" 
                  placeholder="Enter username" 
                  value={connectionSettings.username} 
                  onChange={(e) => handleConnectionSettingChange('username', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-password">Password</Label>
                <Input 
                  id="db-password" 
                  type="password" 
                  placeholder="Enter password" 
                  value={connectionSettings.password} 
                  onChange={(e) => handleConnectionSettingChange('password', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-url">Connection URL</Label>
                <div className="flex">
                  <Input 
                    id="db-url" 
                    value={`postgresql://${connectionSettings.username}:********@${connectionSettings.host}:${connectionSettings.port}/${connectionSettings.database}`} 
                    readOnly 
                    className="bg-secondary/10" 
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This connection string is generated automatically from the settings above.
                </p>
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="db-ssl">Enable SSL</Label>
                  <p className="text-sm text-muted-foreground">
                    Use SSL for secure database connections
                  </p>
                </div>
                <Switch 
                  id="db-ssl" 
                  checked={connectionSettings.enableSSL} 
                  onCheckedChange={(checked) => handleConnectionSettingChange('enableSSL', checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : "Test Connection"}
              </Button>
              <Button 
                onClick={handleSaveConnection}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>
                Configure automatic database backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable scheduled automatic backups
                  </p>
                </div>
                <Switch 
                  id="auto-backup" 
                  checked={backupSettings.autoBackup} 
                  onCheckedChange={(checked) => handleBackupSettingChange('autoBackup', checked)}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={backupSettings.frequency}
                    onValueChange={(value) => handleBackupSettingChange('frequency', value)}
                    disabled={!backupSettings.autoBackup}
                  >
                    <SelectTrigger id="backup-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-time">Backup Time</Label>
                  <Select
                    value={backupSettings.time}
                    onValueChange={(value) => handleBackupSettingChange('time', value)}
                    disabled={!backupSettings.autoBackup}
                  >
                    <SelectTrigger id="backup-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00:00">12:00 AM</SelectItem>
                      <SelectItem value="03:00">3:00 AM</SelectItem>
                      <SelectItem value="06:00">6:00 AM</SelectItem>
                      <SelectItem value="23:00">11:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-retention">Backup Retention (Days)</Label>
                <Input 
                  id="backup-retention" 
                  placeholder="30" 
                  value={backupSettings.retention} 
                  onChange={(e) => handleBackupSettingChange('retention', e.target.value)}
                  disabled={!backupSettings.autoBackup}
                />
                <p className="text-xs text-muted-foreground">
                  Backups older than this number of days will be automatically deleted.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-location">Backup Storage Location</Label>
                <Select
                  value={backupSettings.location}
                  onValueChange={(value) => handleBackupSettingChange('location', value)}
                >
                  <SelectTrigger id="backup-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={handleBackupNow}
                disabled={backingUp}
              >
                {backingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Backing up...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Backup Now
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSaveBackupSettings}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Backup Settings"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                Recent database backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-2 font-medium text-muted-foreground">Date</th>
                        <th className="pb-2 font-medium text-muted-foreground">Size</th>
                        <th className="pb-2 font-medium text-muted-foreground">Status</th>
                        <th className="pb-2 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupHistory.map((backup) => (
                        <tr key={backup.id} className="border-b">
                          <td className="py-2">{backup.date}</td>
                          <td className="py-2">{backup.size}</td>
                          <td className="py-2">
                            {backup.status === "completed" ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : backup.status === "failed" ? (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                In Progress
                              </Badge>
                            )}
                          </td>
                          <td className="py-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadBackup(backup.id)}
                              disabled={downloading === backup.id || backup.status !== "completed"}
                            >
                              {downloading === backup.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>
                Perform database maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Vacuum Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove deleted rows and optimize database performance
                  </p>
                </div>
                <Button 
                  onClick={handleRunVacuum}
                  disabled={runningVacuum}
                >
                  {runningVacuum ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : "Run Vacuum"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Reindex Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Rebuild indexes to improve query performance
                  </p>
                </div>
                <Button 
                  onClick={handleRunReindex}
                  disabled={runningReindex}
                >
                  {runningReindex ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : "Run Reindex"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Analyze Tables</h4>
                  <p className="text-sm text-muted-foreground">
                    Update statistics used by the query planner
                  </p>
                </div>
                <Button 
                  onClick={handleRunAnalyze}
                  disabled={runningAnalyze}
                >
                  {runningAnalyze ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : "Run Analyze"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md bg-destructive/5">
                <div>
                  <h4 className="font-medium text-destructive">Reset Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Warning: This will delete all data and reset the database to its initial state
                  </p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={handleResetDatabase}
                  disabled={loading}
                >
                  Reset Database
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance</CardTitle>
              <CardDescription>
                Configure automatic maintenance tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-vacuum">Automatic Vacuum</Label>
                  <p className="text-sm text-muted-foreground">
                    Schedule regular vacuum operations
                  </p>
                </div>
                <Switch 
                  id="auto-vacuum" 
                  checked={maintenanceSettings.autoVacuum} 
                  onCheckedChange={(checked) => setMaintenanceSettings(prev => ({
                    ...prev,
                    autoVacuum: checked
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-analyze">Automatic Analyze</Label>
                  <p className="text-sm text-muted-foreground">
                    Schedule regular analyze operations
                  </p>
                </div>
                <Switch 
                  id="auto-analyze" 
                  checked={maintenanceSettings.autoAnalyze} 
                  onCheckedChange={(checked) => setMaintenanceSettings(prev => ({
                    ...prev,
                    autoAnalyze: checked
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance-window">Maintenance Window</Label>
                <Select
                  value={maintenanceSettings.maintenanceWindow}
                  onValueChange={(value) => setMaintenanceSettings(prev => ({
                    ...prev,
                    maintenanceWindow: value
                  }))}
                  disabled={!maintenanceSettings.autoVacuum && !maintenanceSettings.autoAnalyze}
                >
                  <SelectTrigger id="maintenance-window">
                    <SelectValue placeholder="Select maintenance window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (2:00 AM - 4:00 AM)</SelectItem>
                    <SelectItem value="weekend">Weekend Only (Saturday 1:00 AM - 5:00 AM)</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveMaintenanceSettings}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Maintenance Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reset Database Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Reset Database
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL data in your database and reset it to its initial state.
              This action cannot be undone.
              
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                All your contacts, campaigns, analytics, and other data will be permanently lost.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmResetDatabase} 
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : "Yes, Reset Database"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 