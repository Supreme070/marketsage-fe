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
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
    ],
  },
  {
    title: "Content",
    href: "/content",
    icon: FolderTree,
    submenu: [
      {
        title: "Email Templates",
        href: "/email/templates",
        icon: FileText,
      },
      {
        title: "SMS Templates",
        href: "/sms/templates",
        icon: FileText,
      },
      {
        title: "WhatsApp Templates",
        href: "/whatsapp/templates",
        icon: FileText,
      },
    ],
  },
  {
    title: "Automations",
    href: "/workflows",
    icon: Zap,
  },
  {
    title: "Conversions",
    href: "/conversions",
    icon: LineChart,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Store,
  },
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
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

  return (
    <div className={cn("w-[250px] flex-shrink-0 h-screen bg-[#0F172A] text-white", className)}>
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 flex items-center h-16 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold brand-text">
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
                    "w-full justify-start font-medium text-sm rounded hover:bg-white/5",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:text-white"
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
                  <div className="ml-6 mt-1 space-y-1 border-l border-gray-800 pl-2">
                    {item.submenu.map((subItem) => (
                      <Button
                        key={subItem.href}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start font-normal text-xs py-1.5 h-auto",
                          pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                            ? "text-primary bg-transparent hover:bg-white/5"
                            : "text-gray-500 hover:text-white hover:bg-white/5"
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

        <div className="p-4 border-t border-gray-800">
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5" asChild>
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
