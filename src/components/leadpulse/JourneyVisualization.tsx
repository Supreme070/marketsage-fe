'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  MousePointer, 
  FileText, 
  Eye, 
  ShoppingCart, 
  Mail, 
  PieChart,
  CheckCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface Touchpoint {
  id: string;
  timestamp: string;
  type: 'pageview' | 'click' | 'form_view' | 'form_start' | 'form_submit' | 'conversion';
  url: string;
  title?: string;
  duration?: number;  // seconds
  formId?: string;
  formName?: string;
  conversionValue?: number;
}

interface VisitorPath {
  visitorId: string;
  touchpoints: Touchpoint[];
  probability: number;  // conversion probability
  predictedValue: number;  // predicted value
  status: 'active' | 'converted' | 'lost';
}

interface Props {
  data?: VisitorPath[];
  selectedVisitorId?: string;
  isLoading?: boolean;
}

// Add variants for animations
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function JourneyVisualization({
  data = [],
  selectedVisitorId,
  isLoading = false
}: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('flow');
  
  // Debug logging to see what data we're getting
  console.log('JourneyVisualization Debug:', {
    data,
    selectedVisitorId,
    dataLength: data.length,
    firstItem: data[0],
    isLoading
  });
  
  // Get the selected visitor path
  const selectedPath = selectedVisitorId 
    ? data.find(path => path.visitorId === selectedVisitorId) 
    : data[0];
    
  console.log('Selected path:', selectedPath);
  
  // Function to get icon based on touchpoint type
  const getTouchpointIcon = (type: string) => {
    switch(type) {
      case 'pageview': return <Eye className="h-4 w-4" />;
      case 'click': return <MousePointer className="h-4 w-4" />;
      case 'form_view': return <FileText className="h-4 w-4" />;
      case 'form_start': return <FileText className="h-4 w-4" />;
      case 'form_submit': return <CheckCircle className="h-4 w-4" />;
      case 'conversion': return <ShoppingCart className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };
  
  // Function to get color based on touchpoint type
  const getTouchpointColor = (type: string) => {
    switch(type) {
      case 'pageview': return 'bg-blue-100 text-blue-800';
      case 'click': return 'bg-green-100 text-green-800';
      case 'form_view': return 'bg-yellow-100 text-yellow-800';
      case 'form_start': return 'bg-yellow-100 text-yellow-800';
      case 'form_submit': return 'bg-orange-100 text-orange-800';
      case 'conversion': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to render journey as a timeline list
  const renderJourneyList = (touchpoints: Touchpoint[]) => {
    if (!touchpoints || touchpoints.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          No journey data available
        </div>
      );
    }

    // Sort by timestamp
    const sortedTouchpoints = [...touchpoints].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <motion.div 
        className="space-y-4 py-2"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {sortedTouchpoints.map((touchpoint, index) => (
          <motion.div 
            key={touchpoint.id} 
            className="flex items-start"
            variants={slideUp}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-shrink-0 w-12 text-center">
              <div className="text-xs text-muted-foreground">
                {new Date(touchpoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(touchpoint.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            <div className="flex-shrink-0 mx-4 h-full">
              <div className="relative flex items-center justify-center">
                <motion.div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getTouchpointColor(touchpoint.type)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    delay: index * 0.1,
                    duration: 0.5
                  }}
                >
                  {getTouchpointIcon(touchpoint.type)}
                </motion.div>
                {index < sortedTouchpoints.length - 1 && (
                  <motion.div 
                    className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-200"
                    initial={{ height: 0 }}
                    animate={{ height: 32 }}
                    transition={{ 
                      delay: index * 0.1 + 0.3,
                      duration: 0.3
                    }}
                  ></motion.div>
                )}
              </div>
            </div>
            
            <motion.div 
              className="flex-grow bg-muted rounded-lg p-3 mb-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                  {touchpoint.type.replace('_', ' ')}
                </Badge>
                {touchpoint.duration && (
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(touchpoint.duration / 60)}m {touchpoint.duration % 60}s
                  </span>
                )}
              </div>
              
              <h4 className="font-medium mt-1 line-clamp-1">
                {touchpoint.title || 'Untitled Page'}
              </h4>
              
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {touchpoint.url}
              </div>
              
              {touchpoint.formId && (
                <div className="mt-1 text-xs">
                  <span className="font-medium">Form: </span>
                  {touchpoint.formName || touchpoint.formId}
                </div>
              )}
              
              {touchpoint.conversionValue && (
                <div className="mt-1 text-xs font-medium text-green-600">
                  Value: ${touchpoint.conversionValue.toFixed(2)}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    );
  };
  
  // Function to render journey as a flow diagram
  const renderJourneyFlow = (touchpoints: Touchpoint[]) => {
    if (!touchpoints || touchpoints.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          No journey data available
        </div>
      );
    }

    // Sort by timestamp
    const sortedTouchpoints = [...touchpoints].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return (
      <div className="overflow-x-auto py-4">
        <motion.div 
          className="flex items-center min-w-max"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {sortedTouchpoints.map((touchpoint, index) => (
            <React.Fragment key={touchpoint.id}>
              <motion.div 
                className="flex flex-col items-center w-48"
                variants={fadeIn}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${getTouchpointColor(touchpoint.type)}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    delay: index * 0.15,
                    duration: 0.5
                  }}
                >
                  {getTouchpointIcon(touchpoint.type)}
                </motion.div>
                <motion.div 
                  className="text-center max-w-full px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.3 }}
                >
                  <div className="text-xs font-medium truncate capitalize">
                    {touchpoint.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {new Date(touchpoint.timestamp).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="text-xs truncate mt-1 font-medium">
                    {touchpoint.title || 'Untitled Page'}
                  </div>
                </motion.div>
              </motion.div>
              
              {index < sortedTouchpoints.length - 1 && (
                <motion.div 
                  className="flex-shrink-0 flex items-center justify-center w-8"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 32 }}
                  transition={{ 
                    delay: index * 0.15 + 0.25,
                    duration: 0.3
                  }}
                >
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Visitor Journey</CardTitle>
            <CardDescription>
              Visualize the touchpoints in your visitor's journey
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Timeline
            </Button>
            <Button 
              variant={viewMode === 'flow' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('flow')}
            >
              Flow
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="animate-pulse"
            >
              Loading journey data...
            </motion.div>
          </div>
        ) : (
          <>
            {/* Path summary */}
            {selectedPath && (
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="bg-muted rounded-lg p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Touchpoints
                  </div>
                  <div className="text-2xl font-bold">
                    {selectedPath.touchpoints.length}
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-muted rounded-lg p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Conversion Probability
                  </div>
                  <div className="text-2xl font-bold">
                    {(selectedPath.probability * 100).toFixed(1)}%
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-muted rounded-lg p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Predicted Value
                  </div>
                  <div className="text-2xl font-bold">
                    ${selectedPath.predictedValue.toFixed(2)}
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-muted rounded-lg p-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Status
                  </div>
                  <div className="flex items-center">
                    <Badge className={
                      selectedPath.status === 'converted' ? 'bg-green-500' :
                      selectedPath.status === 'lost' ? 'bg-red-500' :
                      'bg-blue-500'
                    }>
                      {selectedPath.status.charAt(0).toUpperCase() + selectedPath.status.slice(1)}
                    </Badge>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Journey visualization */}
            {viewMode === 'list' ? (
              selectedPath ? renderJourneyList(selectedPath.touchpoints) : (
                <motion.div 
                  className="flex items-center justify-center h-40 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  No visitor selected
                </motion.div>
              )
            ) : (
              selectedPath ? renderJourneyFlow(selectedPath.touchpoints) : (
                <motion.div 
                  className="flex items-center justify-center h-40 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  No visitor selected
                </motion.div>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 