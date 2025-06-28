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
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  submenu?: NavItem[];
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
        title: "Overview",
        href: "/ai-intelligence",
        icon: Brain,
      },
      {
        title: "AI Chat",
        href: "/ai-chat",
        icon: MessageCircle,
      },
      {
        title: "Automation Monitor",
        href: "/ai-intelligence/automation-monitor",
        icon: Zap,
      },
      {
        title: "Performance Monitor",
        href: "/ai-intelligence/performance-monitor",
        icon: BarChart4,
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
        title: "Main Dashboard",
        href: "/leadpulse",
        icon: BarChart4,
      },
      {
        title: "Analytics",
        href: "/leadpulse/analytics",
        icon: LineChart,
      },
      {
        title: "Lead Management",
        href: "/leadpulse/lead-management",
        icon: Users,
      },
      {
        title: "Setup",
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
        title: "Templates",
        href: "/templates",
        icon: FileText,
      },
      {
        title: "A/B Testing",
        href: "/campaigns/ab-testing",
        icon: Beaker,
      },
      {
        title: "Geo-Targeting",
        href: "/geo-targeting",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Automations",
    href: "/workflows",
    icon: Zap,
  },
  {
    title: "Task Management",
    href: "/tasks",
    icon: CheckCircle,
  },
  {
    title: "Conversions",
    href: "/conversions",
    icon: LineChart,
    submenu: [
      {
        title: "Conversion Tracking",
        href: "/conversions",
        icon: LineChart,
      },
      {
        title: "Predictive Analytics",
        href: "/dashboard/predictive-analytics",
        icon: BrainCircuit,
      },
      {
        title: "Decision Support",
        href: "/dashboard/decision-support",
        icon: BrainCircuit,
      },
    ],
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
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
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
            {sidebarNavItems.map((item) => (
              <div key={item.href} className="mb-1">
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
            ))}
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
