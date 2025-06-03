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
  // Sort panels by row (y) then column (x) for proper rendering order
  const sortedPanels = [...panels].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  return (
    <div className="space-y-4">
      {/* Group panels by row */}
      {Array.from(new Set(sortedPanels.map(p => p.y))).sort((a, b) => a - b).map(row => {
        const rowPanels = sortedPanels.filter(p => p.y === row);
        
        return (
          <div key={row} className="grid grid-cols-12 gap-4">
            {rowPanels.map((panel) => (
              <div 
                key={panel.id} 
                className={`col-span-${Math.min(panel.w, 12)}`}
                style={{
                  minHeight: `${panel.h * 100}px`,
                }}
              >
                {panel.component}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
} 