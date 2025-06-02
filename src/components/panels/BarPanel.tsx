import Panel from './Panel';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';

interface BarPanelProps {
  title: string;
  data: Array<Record<string, any>>;
  dataKey: string; // y-axis key
  name?: string; // legend name
  xKey: string; // x-axis key
  color?: string;
  isLoading?: boolean;
  gradient?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-purple-400 font-bold text-lg">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function BarPanel({
  title,
  data,
  dataKey,
  xKey,
  name,
  color = '#8b5cf6',
  isLoading,
  gradient = true,
}: BarPanelProps) {
  // Generate gradient colors for each bar
  const gradientColors = [
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
  ];

  return (
    <Panel title={title} className="bg-gray-900/70 border-gray-700/50">
      {isLoading ? (
        <Skeleton className="h-full w-full bg-gray-800/50" />
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {gradient && gradientColors.map((color, index) => (
                  <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.3}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey={xKey} 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#374151' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} name={name || dataKey} radius={[8, 8, 0, 0]}>
                {gradient ? (
                  data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#barGradient${index % gradientColors.length})`} />
                  ))
                ) : (
                  <Cell fill={color} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
} 