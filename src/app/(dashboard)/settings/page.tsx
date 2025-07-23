"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Loader2, 
  Shield, 
  Eye, 
  Users, 
  Lock, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Zap, 
  Database, 
  Server, 
  Settings as SettingsIcon,
  Crown,
  Building,
  UserCheck,
  History,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Mail,
  Smartphone,
  Slack,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Plus,
  Minus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  Award,
  Coffee,
  Brain
} from "lucide-react";

// Define a proper interface for preferences
interface UserPreferences {
  theme: string;
  compactMode: boolean;
  notifications: {
    email: boolean;
    marketing: boolean;
    browser: boolean;
  };
  timezone: string;
  language: string;
  [key: string]: any; // To allow for future preference additions
}

// Enterprise Features Interfaces
interface ComplianceFramework {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'configuring';
  coverage: number;
  lastAudit: string;
  controls: number;
  findings: number;
}

interface AuditTrail {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  risk: 'low' | 'medium' | 'high';
}

interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  users: number;
  storage: number;
  apiCalls: number;
  features: string[];
  limits: {
    users: number;
    storage: number;
    apiCalls: number;
  };
}

interface SecurityConfig {
  twoFactorAuth: {
    enabled: boolean;
    enforced: boolean;
    methods: string[];
  };
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expiration: number;
  };
  ipWhitelist: string[];
  allowedDomains: string[];
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    id: "",
    name: "",
    email: "",
    company: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
    compactMode: false,
    notifications: {
      email: true,
      marketing: false,
      browser: true,
    },
    timezone: "Africa/Lagos",
    language: "en"
  });

  // Enterprise Features State
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [tenantConfigs, setTenantConfigs] = useState<TenantConfig[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    twoFactorAuth: {
      enabled: false,
      enforced: false,
      methods: []
    },
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
      expiration: 90
    },
    ipWhitelist: [],
    allowedDomains: [],
    encryptionLevel: 'standard'
  });
  const [isEnterpriseLoading, setIsEnterpriseLoading] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchUserProfile(session.user.id);
      fetchUserPreferences(session.user.id);
      fetchEnterpriseData();
    }
  }, [status, session?.user?.id]);

  // Enterprise Data Fetching Functions
  const fetchEnterpriseData = async () => {
    setIsEnterpriseLoading(true);
    try {
      await Promise.all([
        fetchComplianceFrameworks(),
        fetchAuditTrails(),
        fetchTenantConfigs(),
        fetchSecurityConfig()
      ]);
    } catch (error) {
      console.error('Failed to fetch enterprise data:', error);
    } finally {
      setIsEnterpriseLoading(false);
    }
  };

  const fetchComplianceFrameworks = async () => {
    try {
      // Mock data for demonstration - in real app, this would be an API call
      const mockFrameworks: ComplianceFramework[] = [
        {
          id: '1',
          name: 'GDPR Compliance',
          status: 'active',
          coverage: 95,
          lastAudit: '2024-01-15',
          controls: 23,
          findings: 2
        },
        {
          id: '2',
          name: 'SOC 2 Type II',
          status: 'active',
          coverage: 88,
          lastAudit: '2024-01-10',
          controls: 31,
          findings: 4
        },
        {
          id: '3',
          name: 'ISO 27001',
          status: 'configuring',
          coverage: 67,
          lastAudit: '2024-01-05',
          controls: 114,
          findings: 12
        }
      ];
      setComplianceFrameworks(mockFrameworks);
    } catch (error) {
      console.error('Failed to fetch compliance frameworks:', error);
    }
  };

  const fetchAuditTrails = async () => {
    try {
      // Mock data for demonstration
      const mockAuditTrails: AuditTrail[] = [
        {
          id: '1',
          timestamp: '2024-01-16T10:30:00Z',
          user: 'admin@company.com',
          action: 'LOGIN',
          resource: 'AUTH_SERVICE',
          details: 'Successful login',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          risk: 'low'
        },
        {
          id: '2',
          timestamp: '2024-01-16T10:25:00Z',
          user: 'user@company.com',
          action: 'UPDATE_CAMPAIGN',
          resource: 'CAMPAIGN_001',
          details: 'Modified campaign targeting',
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          risk: 'medium'
        },
        {
          id: '3',
          timestamp: '2024-01-16T10:20:00Z',
          user: 'system@marketsage.com',
          action: 'DELETE_USER',
          resource: 'USER_456',
          details: 'User account deactivated',
          ipAddress: '10.0.0.1',
          userAgent: 'System/1.0',
          risk: 'high'
        }
      ];
      setAuditTrails(mockAuditTrails);
    } catch (error) {
      console.error('Failed to fetch audit trails:', error);
    }
  };

  const fetchTenantConfigs = async () => {
    try {
      // Mock data for demonstration
      const mockTenants: TenantConfig[] = [
        {
          id: '1',
          name: 'Main Organization',
          domain: 'company.com',
          status: 'active',
          users: 45,
          storage: 2400,
          apiCalls: 15000,
          features: ['Advanced Analytics', 'AI Intelligence', 'API Access'],
          limits: {
            users: 100,
            storage: 5000,
            apiCalls: 50000
          }
        },
        {
          id: '2',
          name: 'Marketing Department',
          domain: 'marketing.company.com',
          status: 'active',
          users: 12,
          storage: 800,
          apiCalls: 3500,
          features: ['Basic Analytics', 'Campaign Management'],
          limits: {
            users: 25,
            storage: 1000,
            apiCalls: 10000
          }
        }
      ];
      setTenantConfigs(mockTenants);
    } catch (error) {
      console.error('Failed to fetch tenant configs:', error);
    }
  };

  const fetchSecurityConfig = async () => {
    try {
      // Mock data for demonstration
      const mockSecurityConfig: SecurityConfig = {
        twoFactorAuth: {
          enabled: true,
          enforced: false,
          methods: ['TOTP', 'SMS']
        },
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: true,
          expiration: 90
        },
        ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
        allowedDomains: ['company.com', 'marketing.company.com'],
        encryptionLevel: 'enhanced'
      };
      setSecurityConfig(mockSecurityConfig);
    } catch (error) {
      console.error('Failed to fetch security config:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied to profile');
        } else if (response.status === 404) {
          toast.error('User profile not found');
        } else {
          toast.error('Failed to load profile information');
        }
        console.error('Failed to fetch profile:', response.status, response.statusText);
        return;
      }
      
      const userData = await response.json();
      
      setUserProfile({
        id: userData.id,
        name: userData.name || "",
        email: userData.email || "",
        company: userData.company || "",
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile information - network error');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      setPreferencesLoading(true);
      const response = await fetch(`/api/users/${userId}/preferences`);
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied to preferences');
        } else if (response.status === 404) {
          toast.error('User preferences not found');
        } else {
          toast.error('Failed to load preferences');
        }
        console.error('Failed to fetch preferences:', response.status, response.statusText);
        return;
      }
      
      const preferencesData = await response.json();
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences - network error');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userProfile.name,
          email: userProfile.email,
          company: userProfile.company,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      
      // Update session with new data
      await update({
        ...session,
        user: {
          ...session.user,
          name: updatedUser.name,
          email: updatedUser.email,
        }
      });
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }
      
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceUpdate = async (key: string, value: any) => {
    // First update local state for immediate feedback
    setPreferences(prev => {
      const newPreferences = { ...prev };
      
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (parent === 'notifications') {
          newPreferences.notifications = {
            ...newPreferences.notifications,
            [child]: value
          };
        } else {
          // Handle other nested preferences if needed
          (newPreferences as any)[parent] = {
            ...(newPreferences as any)[parent],
            [child]: value
          };
        }
      } else {
        (newPreferences as any)[key] = value;
      }
      
      return newPreferences;
    });
    
    // Then save to the server
    if (!session?.user?.id) return;
    
    try {
      // Get the updated preferences from state
      let updatedPreferences;
      
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        updatedPreferences = {
          ...preferences,
          [parent]: parent === 'notifications' 
            ? { 
                ...preferences.notifications,
                [child]: value 
              }
            : { 
                ...(preferences as any)[parent],
                [child]: value 
              }
        };
      } else {
        updatedPreferences = {
          ...preferences,
          [key]: value
        };
      }
      
      const response = await fetch(`/api/users/${session.user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }
      
      toast.success(`${key.includes('.') ? key.split('.')[1] : key} setting updated`);
      
      // If it's a theme change, apply it
      if (key === 'theme') {
        document.documentElement.setAttribute('data-theme', value);
      }
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error(error.message || 'Failed to update preference');
      
      // Revert the local state if server update failed
      fetchUserPreferences(session.user.id);
    }
  };

  if (status === "loading" || profileLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="timezone">Timezone & Language</TabsTrigger>
          <TabsTrigger value="enterprise-security" className="flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Security
          </TabsTrigger>
          <TabsTrigger value="enterprise-compliance" className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="enterprise-audit" className="flex items-center">
            <History className="h-4 w-4 mr-1" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="enterprise-tenants" className="flex items-center">
            <Building className="h-4 w-4 mr-1" />
            Tenants
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter your name" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter your email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    placeholder="Enter your company name"
                    value={userProfile.company}
                    onChange={(e) => setUserProfile({...userProfile, company: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <form onSubmit={handlePasswordChange}>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    placeholder="Enter your current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    placeholder="Enter your new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirm your new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize your interface preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Loading preferences...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={preferences.theme}
                      onValueChange={(value) => handlePreferenceUpdate('theme', value)}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compactMode">Compact mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Show more content on each page
                      </p>
                    </div>
                    <Switch 
                      id="compactMode" 
                      checked={preferences.compactMode}
                      onCheckedChange={(checked) => handlePreferenceUpdate('compactMode', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control when and how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Loading notification settings...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications
                      </p>
                    </div>
                    <Switch 
                      id="emailNotifications" 
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) => handlePreferenceUpdate('notifications.email', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketingEmails">Marketing emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive emails about new features and updates
                      </p>
                    </div>
                    <Switch 
                      id="marketingEmails" 
                      checked={preferences.notifications.marketing}
                      onCheckedChange={(checked) => handlePreferenceUpdate('notifications.marketing', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browserNotifications">Browser notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch 
                      id="browserNotifications" 
                      checked={preferences.notifications.browser}
                      onCheckedChange={(checked) => handlePreferenceUpdate('notifications.browser', checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timezone" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timezone & Language</CardTitle>
              <CardDescription>
                Set your timezone and preferred language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2">Loading regional settings...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={preferences.timezone}
                      onValueChange={(value) => handlePreferenceUpdate('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                        <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={preferences.language}
                      onValueChange={(value) => handlePreferenceUpdate('language', value)}
                    >
                      <SelectTrigger id="language">
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enterprise Security Tab */}
        <TabsContent value="enterprise-security" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                Enterprise Security Configuration
              </h3>
              <p className="text-sm text-gray-600">
                Advanced security controls and access management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enhanced Security
              </Badge>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Enforce multi-factor authentication for enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable 2FA</Label>
                    <p className="text-sm text-gray-600">Allow users to enable two-factor authentication</p>
                  </div>
                  <Switch 
                    checked={securityConfig.twoFactorAuth.enabled}
                    onCheckedChange={(checked) => {
                      setSecurityConfig(prev => ({
                        ...prev,
                        twoFactorAuth: { ...prev.twoFactorAuth, enabled: checked }
                      }));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enforce 2FA</Label>
                    <p className="text-sm text-gray-600">Require all users to use two-factor authentication</p>
                  </div>
                  <Switch 
                    checked={securityConfig.twoFactorAuth.enforced}
                    onCheckedChange={(checked) => {
                      setSecurityConfig(prev => ({
                        ...prev,
                        twoFactorAuth: { ...prev.twoFactorAuth, enforced: checked }
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {['TOTP', 'SMS', 'Email', 'Hardware Key'].map(method => (
                      <Badge 
                        key={method}
                        variant={securityConfig.twoFactorAuth.methods.includes(method) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSecurityConfig(prev => ({
                            ...prev,
                            twoFactorAuth: {
                              ...prev.twoFactorAuth,
                              methods: prev.twoFactorAuth.methods.includes(method)
                                ? prev.twoFactorAuth.methods.filter(m => m !== method)
                                : [...prev.twoFactorAuth.methods, method]
                            }
                          }));
                        }}
                      >
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password Policy
                </CardTitle>
                <CardDescription>
                  Configure password requirements and security rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Length</Label>
                    <Input
                      type="number"
                      value={securityConfig.passwordPolicy.minLength}
                      onChange={(e) => {
                        setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, minLength: Number.parseInt(e.target.value) }
                        }));
                      }}
                      min="6"
                      max="32"
                    />
                  </div>
                  <div>
                    <Label>Password Expiration (days)</Label>
                    <Input
                      type="number"
                      value={securityConfig.passwordPolicy.expiration}
                      onChange={(e) => {
                        setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, expiration: Number.parseInt(e.target.value) }
                        }));
                      }}
                      min="30"
                      max="365"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch 
                      checked={securityConfig.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) => {
                        setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireUppercase: checked }
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch 
                      checked={securityConfig.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => {
                        setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireNumbers: checked }
                        }));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Symbols</Label>
                    <Switch 
                      checked={securityConfig.passwordPolicy.requireSymbols}
                      onCheckedChange={(checked) => {
                        setSecurityConfig(prev => ({
                          ...prev,
                          passwordPolicy: { ...prev.passwordPolicy, requireSymbols: checked }
                        }));
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session & Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Session & Access Control
                </CardTitle>
                <CardDescription>
                  Configure session timeouts and access restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={securityConfig.sessionTimeout}
                    onChange={(e) => {
                      setSecurityConfig(prev => ({
                        ...prev,
                        sessionTimeout: Number.parseInt(e.target.value)
                      }));
                    }}
                    min="5"
                    max="480"
                  />
                </div>
                <div>
                  <Label>Encryption Level</Label>
                  <Select 
                    value={securityConfig.encryptionLevel}
                    onValueChange={(value: 'standard' | 'enhanced' | 'maximum') => {
                      setSecurityConfig(prev => ({
                        ...prev,
                        encryptionLevel: value
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (AES-256)</SelectItem>
                      <SelectItem value="enhanced">Enhanced (AES-256 + HSM)</SelectItem>
                      <SelectItem value="maximum">Maximum (AES-256 + HSM + ZKP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enterprise Compliance Tab */}
        <TabsContent value="enterprise-compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-500" />
                Compliance Monitoring
              </h3>
              <p className="text-sm text-gray-600">
                Monitor and manage compliance with various regulatory frameworks
              </p>
            </div>
            <Button className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Compliance Status
            </Button>
          </div>

          <div className="grid gap-6">
            {complianceFrameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        framework.status === 'active' ? 'bg-green-500' :
                        framework.status === 'configuring' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                      {framework.name}
                    </CardTitle>
                    <Badge variant={framework.status === 'active' ? 'default' : 'secondary'}>
                      {framework.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Last audit: {new Date(framework.lastAudit).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Compliance Coverage</Label>
                        <span className="text-sm font-bold">{framework.coverage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${framework.coverage}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{framework.controls}</div>
                        <div className="text-xs text-gray-500">Controls</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{framework.controls - framework.findings}</div>
                        <div className="text-xs text-gray-500">Passed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{framework.findings}</div>
                        <div className="text-xs text-gray-500">Findings</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Enterprise Audit Tab */}
        <TabsContent value="enterprise-audit" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <History className="h-5 w-5 mr-2 text-purple-500" />
                Audit Trail
              </h3>
              <p className="text-sm text-gray-600">
                View and search system audit logs and user activities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Search Logs
              </Button>
              <Button variant="outline" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrails.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        audit.risk === 'high' ? 'bg-red-500' :
                        audit.risk === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <div className="font-medium">{audit.action}</div>
                        <div className="text-sm text-gray-600">{audit.user} • {audit.resource}</div>
                        <div className="text-xs text-gray-500">{audit.details}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{new Date(audit.timestamp).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{audit.ipAddress}</div>
                      <Badge variant={audit.risk === 'high' ? 'destructive' : audit.risk === 'medium' ? 'secondary' : 'outline'}>
                        {audit.risk} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enterprise Tenants Tab */}
        <TabsContent value="enterprise-tenants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2 text-green-500" />
                Multi-Tenant Management
              </h3>
              <p className="text-sm text-gray-600">
                Manage multiple tenant organizations and their configurations
              </p>
            </div>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>

          <div className="grid gap-6">
            {tenantConfigs.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        tenant.status === 'active' ? 'bg-green-500' :
                        tenant.status === 'suspended' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      {tenant.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {tenant.domain} • {tenant.users} users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Users</Label>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold">{tenant.users}</div>
                          <div className="text-sm text-gray-500">/ {tenant.limits.users}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(tenant.users / tenant.limits.users) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Storage (GB)</Label>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold">{tenant.storage}</div>
                          <div className="text-sm text-gray-500">/ {tenant.limits.storage}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(tenant.storage / tenant.limits.storage) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">API Calls</Label>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold">{tenant.apiCalls.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">/ {tenant.limits.apiCalls.toLocaleString()}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${(tenant.apiCalls / tenant.limits.apiCalls) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500 mb-2 block">Enabled Features</Label>
                      <div className="flex flex-wrap gap-2">
                        {tenant.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 