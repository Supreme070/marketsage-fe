import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  children: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}

/**
 * Generic wrapper mimicking Grafana panel chrome.
 */
export default function Panel({ title, children, toolbar, className }: PanelProps) {
  return (
    <Card className={`h-full flex flex-col bg-gray-900/50 border-gray-800 backdrop-blur-sm ${className ?? ''}`}>
      <CardHeader className="pb-2 flex-row justify-between items-start border-b border-gray-800/50">
        <CardTitle className="text-sm font-semibold truncate leading-none text-gray-100">
          {title}
        </CardTitle>
        {toolbar && <div className="flex gap-2 items-center">{toolbar}</div>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {children}
      </CardContent>
    </Card>
  );
} 