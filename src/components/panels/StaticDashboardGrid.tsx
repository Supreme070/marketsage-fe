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

  // Calculate responsive grid column class
  const getGridColClass = (width: number) => {
    const clampedWidth = Math.min(Math.max(width, 1), 12);
    switch (clampedWidth) {
      case 1: return 'col-span-1';
      case 2: return 'col-span-2';
      case 3: return 'col-span-3';
      case 4: return 'col-span-4';
      case 5: return 'col-span-5';
      case 6: return 'col-span-6';
      case 7: return 'col-span-7';
      case 8: return 'col-span-8';
      case 9: return 'col-span-9';
      case 10: return 'col-span-10';
      case 11: return 'col-span-11';
      case 12: return 'col-span-12';
      default: return 'col-span-12';
    }
  };

  // Calculate minimum height with proper scaling for charts
  const getMinHeight = (height: number) => {
    // Ensure charts have adequate minimum height
    const calculatedHeight = height * 120; // Increased from 100px to 120px
    const minimumHeight = 280; // Minimum height for chart components
    return Math.max(calculatedHeight, minimumHeight);
  };

  return (
    <div className="space-y-4">
      {/* Group panels by row */}
      {Array.from(new Set(sortedPanels.map(p => p.y))).sort((a, b) => a - b).map(row => {
        const rowPanels = sortedPanels.filter(p => p.y === row);
        
        return (
          <div key={row} className="grid grid-cols-12 gap-4 auto-rows-min">
            {rowPanels.map((panel) => (
              <div 
                key={panel.id} 
                className={`${getGridColClass(panel.w)} flex flex-col`}
                style={{
                  minHeight: `${getMinHeight(panel.h)}px`,
                }}
              >
                <div className="flex-1 h-full">
                  {panel.component}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
} 