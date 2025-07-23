"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart4,
  Users,
  Mail,
  MessageSquare,
  ListTree,
  Settings,
  User,
  Store,
  MessageCircle,
  FolderTree,
  Zap,
  LineChart,
  Tag,
  HelpCircle,
  FileText,
  AlertCircle,
  MailQuestion,
  BrainCircuit,
  Brain,
  Beaker,
  MapPin,
  Eye,
  Route,
  CheckCircle,
  Crown,
  Cpu,
  ThumbsUp,
  Gift,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Hash,
  Sparkles,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { NavigationTooltip, navigationHelp } from "@/components/ui/navigation-tooltip";

// Define UserRole enum to avoid importing from auth lib on client
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN", 
  IT_ADMIN = "IT_ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  submenu?: NavItem[];
  roles?: UserRole[]; // Roles that can access this item (undefined = all roles)
}

const sidebarNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart4,
  },
  {
    title: "AI Intelligence",
    href: "/ai-intelligence",
    icon: BrainCircuit,
    submenu: [
      {
        title: "AI Overview",
        href: "/ai-intelligence",
        icon: Brain,
      },
      {
        title: "Supreme Chat",
        href: "/ai-intelligence/chat",
        icon: MessageCircle,
      },
      {
        title: "Customer Intelligence",
        href: "/ai-intelligence/customers",
        icon: Users,
      },
      {
        title: "Campaign Intelligence",
        href: "/ai-intelligence/campaigns",
        icon: Target,
      },
      {
        title: "Business Intelligence",
        href: "/ai-intelligence/business",
        icon: TrendingUp,
      },
      {
        title: "AI Operations",
        href: "/ai-intelligence/operations",
        icon: Settings,
        roles: [UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
    submenu: [
      {
        title: "All Contacts",
        href: "/contacts",
        icon: Users,
      },
      {
        title: "High-Value Customers",
        href: "/customers/high-value",
        icon: Crown,
      },
      {
        title: "Lists",
        href: "/list",
        icon: ListTree,
      },
      {
        title: "Segments",
        href: "/segments",
        icon: Tag,
      },
    ],
  },
  {
    title: "LeadPulse",
    href: "/leadpulse",
    icon: Eye,
    submenu: [
      {
        title: "Overview Dashboard",
        href: "/leadpulse",
        icon: BarChart4,
      },
      {
        title: "Visitor Intelligence",
        href: "/leadpulse/visitors",
        icon: Users,
      },
      {
        title: "Analytics Hub",
        href: "/leadpulse/analytics", 
        icon: LineChart,
      },
      {
        title: "Forms & Conversions",
        href: "/leadpulse/forms",
        icon: Target,
      },
      {
        title: "Setup & Integration",
        href: "/leadpulse/setup",
        icon: Settings,
      },
    ],
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Mail,
    submenu: [
      {
        title: "Email Campaigns",
        href: "/email/campaigns",
        icon: Mail,
      },
      {
        title: "SMS Campaigns",
        href: "/sms/campaigns",
        icon: MessageSquare,
      },
      {
        title: "WhatsApp Campaigns",
        href: "/whatsapp/campaigns",
        icon: MessageCircle,
      },
      {
        title: "Social Media",
        href: "/social-media",
        icon: Share2,
      },
      {
        title: "Messaging Analytics",
        href: "/analytics/messaging",
        icon: BarChart4,
      },
    ],
  },
  {
    title: "Automations",
    href: "/workflows",
    icon: Zap,
  },
  {
    title: "Support",
    href: "/support",
    icon: HelpCircle,
    submenu: [
      {
        title: "Help Center",
        href: "/support",
        icon: HelpCircle,
      },
      {
        title: "Error Codes",
        href: "/support/error-codes",
        icon: AlertCircle,
      },
      {
        title: "Contact Support",
        href: "/support/contact",
        icon: MailQuestion,
      },
      {
        title: "Integrations",
        href: "/integrations",
        icon: Store,
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    submenu: [
      {
        title: "General",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "SMS Settings",
        href: "/settings/sms",
        icon: MessageSquare,
      },
      {
        title: "WhatsApp Settings",
        href: "/settings/whatsapp",
        icon: MessageCircle,
      },
      {
        title: "Messaging Settings",
        href: "/settings/messaging",
        icon: Zap,
      },
      {
        title: "Provider Optimization",
        href: "/analytics/provider-optimization",
        icon: Target,
        roles: [UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN],
      },
    ],
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";
  const userRole = session?.user?.role as UserRole;

  // Filter navigation items based on user role
  const filterNavItemsByRole = (items: NavItem[]): NavItem[] => {
    if (!userRole) return items;
    
    return items.filter(item => {
      // If no roles specified, item is available to all
      if (!item.roles) return true;
      
      // Check if user's role is in the allowed roles
      const hasAccess = item.roles.includes(userRole);
      
      if (hasAccess && item.submenu) {
        // Recursively filter submenu items
        item.submenu = filterNavItemsByRole(item.submenu);
      }
      
      return hasAccess;
    });
  };

  const filteredNavItems = filterNavItemsByRole(sidebarNavItems);

  return (
    <div className={cn(
      "w-[250px] flex-shrink-0 h-screen border-r transition-colors",
      isLight ? "bg-white border-gray-200" : "bg-background border-gray-800/60",
      className
    )}>
      <div className="h-full flex flex-col">
        <div className={cn(
          "px-4 py-4 flex items-center h-16 border-b",
          isLight ? "border-gray-200" : "border-gray-800/60"
        )}>
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold brand-text-new">
              <span className="market">Market</span><span className="sage">Sage</span>
            </span>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-2">
          <div className="px-2 space-y-1">
            {filteredNavItems.map((item) => {
              const helpData = navigationHelp[item.href as keyof typeof navigationHelp];
              const navButton = (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start font-medium text-sm rounded",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-primary/10 text-primary"
                      : isLight 
                        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
                        : "text-gray-400 hover:text-foreground hover:bg-muted/70"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );

              return (
                <div key={item.href} className="mb-1">
                  {helpData ? (
                    <NavigationTooltip
                      title={helpData.title}
                      description={helpData.description}
                      features={helpData.features}
                    >
                      {navButton}
                    </NavigationTooltip>
                  ) : (
                    navButton
                  )}

                  {item.submenu && (pathname === item.href || pathname.startsWith(item.href + "/") ||
                    item.submenu.some(subItem => pathname.startsWith(subItem.href))) && (
                    <div className={cn(
                      "ml-6 mt-1 space-y-1 border-l pl-2",
                      isLight ? "border-gray-200" : "border-gray-800"
                    )}>
                      {item.submenu.map((subItem) => (
                        <Button
                          key={subItem.href}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start font-normal text-xs py-1.5 h-auto",
                            pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                              ? "text-primary bg-transparent hover:bg-muted/50"
                              : isLight
                                ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                : "text-gray-500 hover:text-foreground hover:bg-muted/50"
                          )}
                          asChild
                        >
                          <Link href={subItem.href}>
                            <subItem.icon className="mr-2 h-3.5 w-3.5" />
                            {subItem.title}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
              </div>
            );
            })}
          </div>
        </ScrollArea>

        <div className={cn(
          "p-4 border-t",
          isLight ? "border-gray-200" : "border-gray-800/60"
        )}>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full justify-start",
              isLight ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100" : "text-gray-400 hover:text-foreground hover:bg-muted/70"
            )} 
            asChild
          >
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
