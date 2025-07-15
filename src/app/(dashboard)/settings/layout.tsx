import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Database, type LucideIcon, Mail, Server, Settings, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Settings | MarketSage",
  description: "Manage your MarketSage settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

interface SidebarNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
    description: "Manage your account settings and preferences",
  },
  {
    title: "Users",
    href: "/settings/users",
    icon: Users,
    description: "Manage user accounts and permissions",
  },
  {
    title: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Manage your subscription and payment details",
  },
  {
    title: "System",
    href: "/settings/system",
    icon: Server,
    description: "Configure system settings and defaults",
  },
  {
    title: "API",
    href: "/settings/api",
    icon: Shield,
    description: "Manage API keys and webhooks",
  },
  {
    title: "Database",
    href: "/settings/database",
    icon: Database,
    description: "Database connection and maintenance",
  },
  {
    title: "Email Test",
    href: "/settings/email-test",
    icon: Mail,
    description: "Test email configuration and send test emails",
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
        <aside className="lg:w-1/5">
          <nav className="flex flex-col space-y-1">
            {sidebarNavItems.map((item) => (
              <SettingsNavItem key={item.href} item={item} />
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function SettingsNavItem({ item }: { item: SidebarNavItem }) {
  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "justify-start",
        // We'll add active state styling if needed
      )}
    >
      <Link href={item.href} className="flex items-center">
        <item.icon className="mr-2 h-4 w-4" />
        <span>{item.title}</span>
      </Link>
    </Button>
  );
} 