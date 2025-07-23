"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Terminal,
  Database,
  Users,
  Shield,
  Activity,
  Settings,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Zap,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { AdminThemeToggle } from './AdminThemeToggle';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'CONTROL_CENTER', icon: Terminal },
  { href: '/admin/users', label: 'USER_MATRIX', icon: Users },
  { href: '/admin/analytics', label: 'DATA_STREAM', icon: BarChart3 },
  { href: '/admin/security', label: 'SECURITY_GRID', icon: Shield },
  { href: '/admin/system', label: 'SYSTEM_CORE', icon: Database },
  { href: '/admin/incidents', label: 'THREAT_MONITOR', icon: AlertTriangle },
  { href: '/admin/messages', label: 'COMM_CHANNEL', icon: MessageSquare },
  { href: '/admin/ai', label: 'AI_NEXUS', icon: Zap },
  { href: '/admin/support', label: 'SUPPORT_LINK', icon: HelpCircle },
  { href: '/admin/settings', label: 'CONFIG_PANEL', icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="h-8 w-8 text-[hsl(var(--admin-primary))]" />
          <div>
            <h1 className="admin-title text-xl">MARKETSAGE</h1>
            <p className="admin-subtitle text-xs">ADMIN_INTERFACE.V3</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="admin-badge admin-badge-success">
            <Activity className="h-3 w-3 mr-1" />
            ONLINE
          </div>
          <AdminThemeToggle />
          <button className="admin-btn admin-btn-danger text-xs">
            <LogOut className="h-3 w-3 mr-1" />
            LOGOUT
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item text-center p-3 rounded-lg transition-all duration-300 ${
                isActive ? 'active' : ''
              }`}
            >
              <Icon className="h-5 w-5 mx-auto mb-2" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}