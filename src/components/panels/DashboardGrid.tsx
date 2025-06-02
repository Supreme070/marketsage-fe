import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Import react-grid-layout dynamically for SSR compatibility
const ResponsiveGridLayout = dynamic(
  async () => {
    const RGL = await import('react-grid-layout');
    return RGL.Responsive;
  },
  { 
    ssr: false,
    loading: () => <div className="p-4 text-center text-muted-foreground">Loading grid...</div>
  }
);

export interface DashboardPanelConfig {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  component: ReactNode;
}

interface DashboardGridProps {
  panels: DashboardPanelConfig[];
}

export default function DashboardGrid({ panels }: DashboardGridProps) {
  return (
    <ResponsiveGridLayout
      className="layout"
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 }}
      rowHeight={90}
      isDraggable={true}
      isResizable={true}
    >
      {panels.map((p) => (
        <div key={p.id} data-grid={{ x: p.x, y: p.y, w: p.w, h: p.h }}>
          {p.component}
        </div>
      ))}
    </ResponsiveGridLayout>
  );
} 