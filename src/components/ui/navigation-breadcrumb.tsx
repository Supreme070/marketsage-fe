"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from './breadcrumb';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  '/dashboard': { path: '/dashboard', label: 'Dashboard', icon: <Home className="h-3 w-3" /> },
  
  // LeadPulse breadcrumbs
  '/leadpulse': { path: '/leadpulse', label: 'LeadPulse' },
  '/leadpulse/visitors': { path: '/leadpulse/visitors', label: 'Visitor Intelligence' },
  '/leadpulse/analytics': { path: '/leadpulse/analytics', label: 'Analytics Hub' },
  '/leadpulse/analytics/funnels': { path: '/leadpulse/analytics/funnels', label: 'Funnel Analytics' },
  '/leadpulse/analytics/realtime': { path: '/leadpulse/analytics/realtime', label: 'Real-time Analytics' },
  '/leadpulse/forms': { path: '/leadpulse/forms', label: 'Forms & Conversions' },
  '/leadpulse/forms/conversions': { path: '/leadpulse/forms/conversions', label: 'Conversion Tracking' },
  '/leadpulse/setup': { path: '/leadpulse/setup', label: 'Setup & Integration' },
  
  // AI Intelligence breadcrumbs
  '/ai-intelligence': { path: '/ai-intelligence', label: 'AI Intelligence' },
  '/ai-intelligence/chat': { path: '/ai-intelligence/chat', label: 'Supreme Chat' },
  '/ai-intelligence/customers': { path: '/ai-intelligence/customers', label: 'Customer Intelligence' },
  '/ai-intelligence/customers/predictive': { path: '/ai-intelligence/customers/predictive', label: 'Predictive Analytics' },
  '/ai-intelligence/campaigns': { path: '/ai-intelligence/campaigns', label: 'Campaign Intelligence' },
  '/ai-intelligence/business': { path: '/ai-intelligence/business', label: 'Business Intelligence' },
  '/ai-intelligence/business/decisions': { path: '/ai-intelligence/business/decisions', label: 'Decision Support' },
  '/ai-intelligence/operations': { path: '/ai-intelligence/operations', label: 'AI Operations' },
  '/ai-intelligence/operations/tasks': { path: '/ai-intelligence/operations/tasks', label: 'Task Management' },
  '/ai-intelligence/operations/approvals': { path: '/ai-intelligence/operations/approvals', label: 'Approvals' },
  '/ai-intelligence/operations/monitor': { path: '/ai-intelligence/operations/monitor', label: 'Monitoring' },
  
  // Other sections
  '/contacts': { path: '/contacts', label: 'Contacts' },
  '/campaigns': { path: '/campaigns', label: 'Campaigns' },
  '/workflows': { path: '/workflows', label: 'Automations' },
  '/settings': { path: '/settings', label: 'Settings' },
};

export function NavigationBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  
  // Don't show breadcrumb on root dashboard
  if (pathname === '/dashboard') return null;
  
  // Generate breadcrumb items
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems: BreadcrumbConfig[] = [];
  
  // Always start with Dashboard
  breadcrumbItems.push(breadcrumbConfig['/dashboard']);
  
  // Build path incrementally
  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const config = breadcrumbConfig[currentPath];
    if (config) {
      breadcrumbItems.push(config);
    }
  }
  
  // Remove duplicates and ensure we have at least 2 items
  if (breadcrumbItems.length < 2) return null;
  
  return (
    <Breadcrumb className={className}>
      {breadcrumbItems.map((item, index) => (
        <BreadcrumbItem key={item.path} className="flex items-center">
          {index < breadcrumbItems.length - 1 ? (
            <BreadcrumbLink asChild>
              <Link href={item.path} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </BreadcrumbLink>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              {item.icon}
              <span>{item.label}</span>
            </span>
          )}
          {index < breadcrumbItems.length - 1 && (
            <BreadcrumbSeparator>
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}