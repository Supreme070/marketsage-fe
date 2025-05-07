import { Metadata } from "next";
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
  Search
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const metadata: Metadata = {
  title: "Database Settings | MarketSage",
  description: "Manage database connections and maintenance",
};

export default function DatabaseSettingsPage() {
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
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Version:</span>
                    <span>PostgreSQL 16.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span>7 days, 12 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Backup:</span>
                    <span>2025-05-05 23:00:00</span>
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
                    <span className="font-medium">1.2 GB</span>
                  </div>
                  <Progress value={42} className="h-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>1.2 GB used</span>
                    <span>5 GB allocated</span>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tables:</span>
                    <span>42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Indexes:</span>
                    <span>98</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Rows:</span>
                    <span>1.2M</span>
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
                  <div className="text-2xl font-bold">32</div>
                  <Progress value={32} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    32 of 100 maximum connections
                  </div>
                </div>
                
                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Query Performance</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">86ms</div>
                  <Progress value={23} className="h-1" />
                  <div className="text-xs text-muted-foreground">
                    Avg. query time: 86ms
                  </div>
                </div>
                
                <div className="bg-secondary/10 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Hit Ratio</span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">98.2%</div>
                  <Progress value={98} className="h-1" />
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
                      <tr className="border-b">
                        <td className="py-2">
                          <code className="text-xs bg-secondary/20 rounded px-1 py-0.5">
                            SELECT * FROM users WHERE email LIKE '%example.com'
                          </code>
                        </td>
                        <td className="py-2">4.2s</td>
                        <td className="py-2 text-muted-foreground">5 hrs ago</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">
                          <code className="text-xs bg-secondary/20 rounded px-1 py-0.5">
                            SELECT COUNT(*) FROM analytics GROUP BY date
                          </code>
                        </td>
                        <td className="py-2">2.8s</td>
                        <td className="py-2 text-muted-foreground">8 hrs ago</td>
                      </tr>
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
                <Input id="db-host" placeholder="localhost" defaultValue="db" />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input id="db-port" placeholder="5432" defaultValue="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input id="db-name" placeholder="marketsage" defaultValue="marketsage" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-username">Username</Label>
                <Input id="db-username" placeholder="Enter username" defaultValue="marketsage" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-password">Password</Label>
                <Input id="db-password" type="password" placeholder="Enter password" defaultValue="••••••••••••" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="db-url">Connection URL</Label>
                <div className="flex">
                  <Input 
                    id="db-url" 
                    value="postgresql://marketsage:marketsage_password@db:5432/marketsage" 
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
                <Switch id="db-ssl" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                Test Connection
              </Button>
              <Button>Save Changes</Button>
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
                <Switch id="auto-backup" defaultChecked />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <select id="backup-frequency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-time">Backup Time</Label>
                  <select id="backup-time" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="00:00">12:00 AM</option>
                    <option value="03:00">3:00 AM</option>
                    <option value="06:00">6:00 AM</option>
                    <option value="23:00" selected>11:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-retention">Backup Retention (Days)</Label>
                <Input id="backup-retention" placeholder="30" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  Backups older than this number of days will be automatically deleted.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backup-location">Backup Storage Location</Label>
                <select id="backup-location" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <UploadCloud className="mr-2 h-4 w-4" />
                Backup Now
              </Button>
              <Button>Save Backup Settings</Button>
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
                      <tr className="border-b">
                        <td className="py-2">2025-05-05 23:00:00</td>
                        <td className="py-2">1.2 GB</td>
                        <td className="py-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Button variant="ghost" size="sm">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">2025-05-04 23:00:00</td>
                        <td className="py-2">1.18 GB</td>
                        <td className="py-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Button variant="ghost" size="sm">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">2025-05-03 23:00:00</td>
                        <td className="py-2">1.15 GB</td>
                        <td className="py-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Button variant="ghost" size="sm">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
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
                <Button>
                  Run Vacuum
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Reindex Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Rebuild indexes to improve query performance
                  </p>
                </div>
                <Button>
                  Run Reindex
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Analyze Tables</h4>
                  <p className="text-sm text-muted-foreground">
                    Update statistics used by the query planner
                  </p>
                </div>
                <Button>
                  Run Analyze
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md bg-destructive/5">
                <div>
                  <h4 className="font-medium text-destructive">Reset Database</h4>
                  <p className="text-sm text-muted-foreground">
                    Warning: This will delete all data and reset the database to its initial state
                  </p>
                </div>
                <Button variant="destructive">
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
                <Switch id="auto-vacuum" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-analyze">Automatic Analyze</Label>
                  <p className="text-sm text-muted-foreground">
                    Schedule regular analyze operations
                  </p>
                </div>
                <Switch id="auto-analyze" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance-window">Maintenance Window</Label>
                <select id="maintenance-window" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <option value="daily">Daily (2:00 AM - 4:00 AM)</option>
                  <option value="weekend">Weekend Only (Saturday 1:00 AM - 5:00 AM)</option>
                  <option value="custom">Custom Schedule</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Maintenance Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 