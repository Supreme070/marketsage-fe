import Panel from './Panel';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface TimeSeriesPanelProps {
  title: string;
  data: Array<{ x: string | number; y: number }>;
  isLoading?: boolean;
  yLabel?: string;
  stroke?: string;
  fillGradient?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-green-400 font-bold text-lg">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function TimeSeriesPanel({
  title,
  data,
  isLoading,
  yLabel,
  stroke = '#10b981',
  fillGradient = true,
}: TimeSeriesPanelProps) {
  return (
    <Panel title={title} className="bg-gray-900/70 border-gray-700/50">
      {isLoading ? (
        <Skeleton className="h-full w-full bg-gray-800/50" />
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            {fillGradient ? (
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={stroke} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="x" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#9ca3af' } : undefined} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="y" 
                  stroke={stroke} 
                  strokeWidth={2} 
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="x" 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#9ca3af' } : undefined} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke={stroke} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 6, fill: stroke }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
} 