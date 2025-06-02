import type { ReactNode } from 'react';

export interface DashboardPanelConfig {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  component: ReactNode;
}

interface StaticDashboardGridProps {
  panels: DashboardPanelConfig[];
}

export default function StaticDashboardGrid({ panels }: StaticDashboardGridProps) {
  // Create a responsive CSS Grid layout as fallback
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {panels.map((panel) => (
        <div 
          key={panel.id} 
          className="min-h-[200px] col-span-1"
          style={{
            // Map grid positions to CSS grid spans
            gridColumn: `span ${Math.min(panel.w, 4)}`,
            gridRow: `span ${panel.h}`,
          }}
        >
          {panel.component}
        </div>
      ))}
    </div>
  );
} 