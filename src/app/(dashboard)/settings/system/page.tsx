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
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, RefreshCw, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "System Settings | MarketSage",
  description: "Configure system-wide settings and defaults",
};

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">System Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure system-wide settings and defaults.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General System Settings</CardTitle>
              <CardDescription>
                Configure basic system settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input id="siteTitle" placeholder="Enter site title" defaultValue="MarketSage" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea 
                  id="siteDescription" 
                  placeholder="Enter a brief description of your site" 
                  defaultValue="All-in-one marketing automation platform for Nigerian businesses"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Timezone</Label>
                <Select defaultValue="Africa/Lagos">
                  <SelectTrigger id="defaultTimezone">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                    <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="defaultLanguage">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="yo">Yoruba</SelectItem>
                    <SelectItem value="ha">Hausa</SelectItem>
                    <SelectItem value="ig">Igbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable maintenance mode to prevent users from accessing the system
                  </p>
                </div>
                <Switch id="maintenanceMode" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email delivery settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailProvider">Email Provider</Label>
                <Select defaultValue="smtp">
                  <SelectTrigger id="emailProvider">
                    <SelectValue placeholder="Select an email provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="amazon-ses">Amazon SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" placeholder="Enter SMTP host" defaultValue="smtp.example.com" />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" placeholder="Enter SMTP port" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpSecurity">Security</Label>
                  <Select defaultValue="tls">
                    <SelectTrigger id="smtpSecurity">
                      <SelectValue placeholder="Select security type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input id="smtpUsername" placeholder="Enter SMTP username" defaultValue="user@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input id="smtpPassword" type="password" placeholder="Enter SMTP password" defaultValue="••••••••" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultFromEmail">Default From Email</Label>
                <Input id="defaultFromEmail" placeholder="Enter default from email" defaultValue="info@marketsage.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultFromName">Default From Name</Label>
                <Input id="defaultFromName" placeholder="Enter default from name" defaultValue="MarketSage Team" />
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" className="mr-2">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Email Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require two-factor authentication for all users
                  </p>
                </div>
                <Switch id="twoFactorAuth" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="strongPasswords">Strong Passwords</Label>
                  <p className="text-sm text-muted-foreground">
                    Require strong passwords with at least 8 characters, numbers, and special characters
                  </p>
                </div>
                <Switch id="strongPasswords" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                <Input id="sessionTimeout" placeholder="Enter session timeout" defaultValue="30" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" placeholder="Enter max login attempts" defaultValue="5" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <Textarea 
                  id="ipWhitelist" 
                  placeholder="Enter IP addresses (one per line)" 
                  defaultValue=""
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to allow all IP addresses. Enter one IP address per line.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Security Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>
                System maintenance and backup options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Database Backup</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a backup of your database
                    </p>
                  </div>
                  <Button variant="outline">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Backup Now
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Clear Cache</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear system cache to refresh data
                    </p>
                  </div>
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Cache
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="automaticBackups">Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Schedule automatic database backups
                    </p>
                  </div>
                  <Switch id="automaticBackups" defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger id="backupFrequency">
                      <SelectValue placeholder="Select backup frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (Days)</Label>
                  <Input id="backupRetention" placeholder="Enter backup retention" defaultValue="30" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Maintenance Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 