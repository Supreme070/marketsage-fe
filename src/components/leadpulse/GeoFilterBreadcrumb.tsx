import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Globe, MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface GeoFilterBreadcrumbProps {
  path: string[];
  onNavigate: (path: string[]) => void;
}

export default function GeoFilterBreadcrumb({
  path,
  onNavigate
}: GeoFilterBreadcrumbProps) {
  if (!path || path.length === 0) {
    return null;
  }
  
  // Handle navigation to a specific level
  const handleNavigate = (index: number) => {
    // If clicking the current level, do nothing
    if (index === path.length - 1) return;
    
    // Navigate to the specified level by truncating the path
    const newPath = path.slice(0, index + 1);
    onNavigate(newPath);
  };
  
  // Handle clearing the filter
  const handleClear = () => {
    onNavigate([]);
  };
  
  // Get appropriate icon for each level
  const getLevelIcon = (index: number) => {
    if (index === 0) return <Globe className="h-3.5 w-3.5" />;
    if (index === path.length - 1) return <MapPin className="h-3.5 w-3.5" />;
    return null;
  };
  
  // Format the display text for each path segment
  const formatPathSegment = (segment: string) => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div 
      className="flex items-center bg-muted/50 py-1 px-2 rounded-md text-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <span className="text-xs text-muted-foreground mr-2">Filter:</span>
      
      <div className="flex items-center flex-wrap">
        {path.map((segment, index) => (
          <React.Fragment key={segment}>
            {index > 0 && (
              <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground flex-shrink-0" />
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 text-xs py-0 px-1.5 ${
                index === path.length - 1 ? 'font-medium text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => handleNavigate(index)}
            >
              {getLevelIcon(index) && (
                <span className="mr-1">{getLevelIcon(index)}</span>
              )}
              {formatPathSegment(segment)}
            </Button>
          </React.Fragment>
        ))}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 ml-1"
        onClick={handleClear}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Clear filter</span>
      </Button>
    </motion.div>
  );
} 