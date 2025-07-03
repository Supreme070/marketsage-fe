/**
 * Demo Mode Toggle Component
 * 
 * Allows users to toggle between demo mode (for marketing presentations)
 * and production mode, with scenario selection for different demo types.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Presentation, Database, Settings, Eye, EyeOff } from 'lucide-react';
import { 
  enableDemoMode, 
  disableDemoMode, 
  isDemoModeActive,
  getCurrentDataSource 
} from '@/lib/leadpulse/unifiedDataProvider';
import { getDemoConfig, setDemoConfig } from '@/lib/leadpulse/demoDataProvider';

interface DemoModeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

const DEMO_SCENARIOS = [
  {
    key: 'standard' as const,
    label: 'Standard Demo',
    description: '10 visitors, normal activity',
    icon: '📊'
  },
  {
    key: 'busy_day' as const,
    label: 'Busy Day',
    description: '25 visitors, high engagement',
    icon: '🔥'
  },
  {
    key: 'quiet_day' as const,
    label: 'Quiet Day',
    description: '3 visitors, low activity',
    icon: '😴'
  },
  {
    key: 'conversion_event' as const,
    label: 'Conversion Event',
    description: '15 visitors, high conversion',
    icon: '💰'
  }
];

export default function DemoModeToggle({ 
  className = '', 
  showLabel = true,
  variant = 'outline'
}: DemoModeToggleProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('standard');
  const [dataSource, setDataSource] = useState<string>('fallback');

  // Update state when component mounts or demo config changes
  useEffect(() => {
    const updateState = async () => {
      const demoActive = isDemoModeActive();
      const config = getDemoConfig();
      const source = await getCurrentDataSource();
      
      setIsDemoMode(demoActive);
      setCurrentScenario(config.scenario);
      setDataSource(source);
    };

    updateState();
    
    // Listen for storage changes (demo config updates)
    const handleStorageChange = () => {
      updateState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleDemo = () => {
    if (isDemoMode) {
      disableDemoMode();
      setIsDemoMode(false);
    } else {
      enableDemoMode(currentScenario as any);
      setIsDemoMode(true);
    }
    
    // Refresh page data
    window.location.reload();
  };

  const handleScenarioChange = (scenario: string) => {
    setCurrentScenario(scenario);
    
    if (isDemoMode) {
      enableDemoMode(scenario as any);
      // Refresh page data
      window.location.reload();
    }
  };

  const currentScenarioData = DEMO_SCENARIOS.find(s => s.key === currentScenario);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Data Source Indicator */}
      <Badge 
        variant={isDemoMode ? 'default' : 'secondary'}
        className={`text-xs ${isDemoMode ? 'bg-blue-500' : 'bg-gray-500'}`}
      >
        {isDemoMode ? (
          <>
            <Presentation className="w-3 h-3 mr-1" />
            Demo
          </>
        ) : (
          <>
            <Database className="w-3 h-3 mr-1" />
            {dataSource === 'fallback' ? 'Demo' : 'Live'}
          </>
        )}
      </Badge>

      {/* Demo Toggle Button */}
      <Button
        variant={variant}
        size="sm"
        onClick={handleToggleDemo}
        className="flex items-center gap-2"
      >
        {isDemoMode ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {showLabel && (
          <span>{isDemoMode ? 'Exit Demo' : 'Demo Mode'}</span>
        )}
      </Button>

      {/* Scenario Selector (only when in demo mode) */}
      {isDemoMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {currentScenarioData?.icon} {currentScenarioData?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Demo Scenarios</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEMO_SCENARIOS.map((scenario) => (
              <DropdownMenuItem
                key={scenario.key}
                onClick={() => handleScenarioChange(scenario.key)}
                className={`flex items-center gap-3 ${
                  currentScenario === scenario.key ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-lg">{scenario.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{scenario.label}</span>
                  <span className="text-xs text-gray-500">{scenario.description}</span>
                </div>
                {currentScenario === scenario.key && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}