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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  RefreshCw, 
  UploadCloud, 
  Loader2, 
  AlertTriangle,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function SystemSettingsPage() {
  // Loading state
  const [loading, setLoading] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [testEmailInProgress, setTestEmailInProgress] = useState(false);
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteTitle: "MarketSage",
    siteDescription: "All-in-one marketing automation platform for Nigerian businesses",
    defaultTimezone: "Africa/Lagos",
    defaultLanguage: "en",
    maintenanceMode: false
  });
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    emailProvider: "smtp",
    smtpHost: "smtp.example.com",
    smtpPort: "587",
    smtpSecurity: "tls",
    smtpUsername: "user@example.com",
    smtpPassword: "••••••••",
    defaultFromEmail: "info@marketsage.com",
    defaultFromName: "MarketSage Team"
  });
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    strongPasswords: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    ipWhitelist: ""
  });
  
  // Maintenance settings state
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    automaticBackups: true,
    backupFrequency: "daily",
    backupRetention: "30"
  });

  // Handler functions
  const handleGeneralSettingsChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmailSettingsChange = (field: string, value: any) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecuritySettingsChange = (field: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMaintenanceSettingsChange = (field: string, value: any) => {
    setMaintenanceSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveGeneralSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("General settings saved successfully");
      
      // Show maintenance mode warning if enabled
      if (generalSettings.maintenanceMode) {
        setShowMaintenanceDialog(true);
      }
    }, 1000);
  };

  const handleSaveEmailSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Email settings saved successfully");
    }, 1000);
  };

  const handleSaveSecuritySettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Security settings saved successfully");
    }, 1000);
  };

  const handleSaveMaintenanceSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Maintenance settings saved successfully");
    }, 1000);
  };

  const handleSendTestEmail = () => {
    setTestEmailInProgress(true);
    
    // Simulate API call
    setTimeout(() => {
      setTestEmailInProgress(false);
      toast.success("Test email sent successfully");
    }, 2000);
  };

  const handleDatabaseBackup = () => {
    setBackupInProgress(true);
    
    // Simulate long-running backup process
    setTimeout(() => {
      setBackupInProgress(false);
      toast.success("Database backup completed successfully", {
        description: "Backup file: marketsage_20250513_145623.sql.gz (12.4 MB)"
      });
    }, 3000);
  };

  const handleClearCache = () => {
    setShowClearCacheDialog(true);
  };

  const confirmClearCache = () => {
    setLoading(true);
    setShowClearCacheDialog(false);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success("Cache cleared successfully");
    }, 2000);
  };

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
                <Input 
                  id="siteTitle" 
                  placeholder="Enter site title" 
                  value={generalSettings.siteTitle}
                  onChange={(e) => handleGeneralSettingsChange('siteTitle', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea 
                  id="siteDescription" 
                  placeholder="Enter a brief description of your site" 
                  value={generalSettings.siteDescription}
                  onChange={(e) => handleGeneralSettingsChange('siteDescription', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultTimezone">Default Timezone</Label>
                <Select 
                  value={generalSettings.defaultTimezone}
                  onValueChange={(value) => handleGeneralSettingsChange('defaultTimezone', value)}
                >
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
                <Select 
                  value={generalSettings.defaultLanguage}
                  onValueChange={(value) => handleGeneralSettingsChange('defaultLanguage', value)}
                >
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
                <Switch 
                  id="maintenanceMode" 
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => handleGeneralSettingsChange('maintenanceMode', checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveGeneralSettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Settings"}
              </Button>
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
                <Select
                  value={emailSettings.emailProvider}
                  onValueChange={(value) => handleEmailSettingsChange('emailProvider', value)}
                >
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
                <Input 
                  id="smtpHost" 
                  placeholder="Enter SMTP host" 
                  value={emailSettings.smtpHost}
                  onChange={(e) => handleEmailSettingsChange('smtpHost', e.target.value)}
                  disabled={emailSettings.emailProvider !== 'smtp'}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input 
                    id="smtpPort" 
                    placeholder="Enter SMTP port" 
                    value={emailSettings.smtpPort}
                    onChange={(e) => handleEmailSettingsChange('smtpPort', e.target.value)}
                    disabled={emailSettings.emailProvider !== 'smtp'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpSecurity">Security</Label>
                  <Select
                    value={emailSettings.smtpSecurity}
                    onValueChange={(value) => handleEmailSettingsChange('smtpSecurity', value)}
                    disabled={emailSettings.emailProvider !== 'smtp'}
                  >
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
                <Input 
                  id="smtpUsername" 
                  placeholder="Enter SMTP username" 
                  value={emailSettings.smtpUsername}
                  onChange={(e) => handleEmailSettingsChange('smtpUsername', e.target.value)}
                  disabled={emailSettings.emailProvider !== 'smtp'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input 
                  id="smtpPassword" 
                  type="password" 
                  placeholder="Enter SMTP password" 
                  value={emailSettings.smtpPassword}
                  onChange={(e) => handleEmailSettingsChange('smtpPassword', e.target.value)}
                  disabled={emailSettings.emailProvider !== 'smtp'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultFromEmail">Default From Email</Label>
                <Input 
                  id="defaultFromEmail" 
                  placeholder="Enter default from email" 
                  value={emailSettings.defaultFromEmail}
                  onChange={(e) => handleEmailSettingsChange('defaultFromEmail', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultFromName">Default From Name</Label>
                <Input 
                  id="defaultFromName" 
                  placeholder="Enter default from name" 
                  value={emailSettings.defaultFromName}
                  onChange={(e) => handleEmailSettingsChange('defaultFromName', e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={handleSendTestEmail}
                  disabled={testEmailInProgress}
                >
                  {testEmailInProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveEmailSettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Email Settings"}
              </Button>
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
                <Switch 
                  id="twoFactorAuth" 
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSecuritySettingsChange('twoFactorAuth', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="strongPasswords">Strong Passwords</Label>
                  <p className="text-sm text-muted-foreground">
                    Require strong passwords with at least 8 characters, numbers, and special characters
                  </p>
                </div>
                <Switch 
                  id="strongPasswords" 
                  checked={securitySettings.strongPasswords}
                  onCheckedChange={(checked) => handleSecuritySettingsChange('strongPasswords', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                <Input 
                  id="sessionTimeout" 
                  placeholder="Enter session timeout" 
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecuritySettingsChange('sessionTimeout', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input 
                  id="maxLoginAttempts" 
                  placeholder="Enter max login attempts" 
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => handleSecuritySettingsChange('maxLoginAttempts', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <Textarea 
                  id="ipWhitelist" 
                  placeholder="Enter IP addresses (one per line)" 
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => handleSecuritySettingsChange('ipWhitelist', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to allow all IP addresses. Enter one IP address per line.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSecuritySettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Security Settings"}
              </Button>
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
                  <Button 
                    variant="outline"
                    onClick={handleDatabaseBackup}
                    disabled={backupInProgress}
                  >
                    {backupInProgress ? (
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
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Clear Cache</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear system cache to refresh data
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleClearCache}
                    disabled={loading}
                  >
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
                  <Switch 
                    id="automaticBackups" 
                    checked={maintenanceSettings.automaticBackups}
                    onCheckedChange={(checked) => handleMaintenanceSettingsChange('automaticBackups', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={maintenanceSettings.backupFrequency}
                    onValueChange={(value) => handleMaintenanceSettingsChange('backupFrequency', value)}
                    disabled={!maintenanceSettings.automaticBackups}
                  >
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
                  <Input 
                    id="backupRetention" 
                    placeholder="Enter backup retention" 
                    value={maintenanceSettings.backupRetention}
                    onChange={(e) => handleMaintenanceSettingsChange('backupRetention', e.target.value)}
                    disabled={!maintenanceSettings.automaticBackups}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveMaintenanceSettings} disabled={loading}>
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

      {/* Maintenance Mode Warning Dialog */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Maintenance Mode Enabled
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your site is now in maintenance mode. All users except administrators will see a maintenance page when they visit the site.
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                Remember to disable maintenance mode when you're done with your updates.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>
              <Check className="h-4 w-4 mr-2" />
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cache Confirmation Dialog */}
      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear System Cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all cached data which might cause the system to run slower temporarily while the cache rebuilds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCache} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : "Yes, Clear Cache"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 