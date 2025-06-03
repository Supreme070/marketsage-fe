import Panel from './Panel';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { ReactNode } from 'react';

interface SingleStatPanelProps {
  title: string;
  value?: number | string;
  unit?: string;
  sparklineData?: Array<{ x: number | string; y: number }>;
  isLoading?: boolean;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export default function SingleStatPanel({
  title,
  value,
  unit,
  sparklineData,
  isLoading,
  icon,
  trend,
  trendValue,
}: SingleStatPanelProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <Panel title={title} className="bg-gray-900/70 border-gray-700/50">
      {isLoading ? (
        <Skeleton className="h-20 w-full bg-gray-800/50" />
      ) : (
        <div className="flex-1 flex flex-col justify-between h-full">
          {/* Main stat display */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-green-400 to-blue-500 bg-clip-text text-transparent">
                {value}
                {unit && <span className="text-lg text-gray-400 ml-1">{unit}</span>}
              </div>
              {trendValue && (
                <div className={`text-sm ${getTrendColor()} flex items-center gap-1 mt-1`}>
                  {trend === 'up' && '↗'}
                  {trend === 'down' && '↘'}
                  {trend === 'stable' && '→'}
                  {trendValue}
                </div>
              )}
            </div>
            {icon && (
              <div className="opacity-60 ml-4">
                {icon}
              </div>
            )}
          </div>
          
          {/* Optional sparkline */}
          {sparklineData && (
            <div className="w-full h-12 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'} 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
} 