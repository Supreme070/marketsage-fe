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
        <div className="flex-1 flex flex-col justify-center items-center gap-2">
          {icon && <div className="text-gray-400 opacity-50">{icon}</div>}
          <div className="text-center">
            <span className="text-4xl font-bold bg-gradient-to-br from-green-400 to-blue-500 bg-clip-text text-transparent">
              {value}
            </span>
            {unit && <span className="text-xl text-gray-400 ml-1">{unit}</span>}
          </div>
          {trendValue && (
            <div className={`text-sm ${getTrendColor()} flex items-center gap-1`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trendValue}
            </div>
          )}
          {sparklineData && (
            <div className="w-full h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#10b981" 
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