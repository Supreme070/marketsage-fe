import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, StepForward, StepBack, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface TimelineSliderProps {
  startTime: Date;
  endTime: Date;
  onTimeChange: (time: Date) => void;
  isPlaying?: boolean;
  onPlayToggle?: () => void;
}

export default function TimelineSlider({
  startTime,
  endTime,
  onTimeChange,
  isPlaying = false,
  onPlayToggle
}: TimelineSliderProps) {
  const [currentValue, setCurrentValue] = useState(100); // 100 means current time
  const [currentTime, setCurrentTime] = useState<Date>(endTime);
  const [liveMode, setLiveMode] = useState(true); // Track if we're in live mode
  const totalDuration = endTime.getTime() - startTime.getTime();
  
  // Update end time in live mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (liveMode) {
      interval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        onTimeChange(now);
      }, 10000); // Update every 10 seconds in live mode for realistic visitor data updates
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveMode, onTimeChange]);
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setCurrentValue(newValue);
    setLiveMode(newValue === 100); // Live mode when slider is at 100
    
    // Calculate the corresponding time
    const timeOffset = (newValue / 100) * totalDuration;
    const newTime = new Date(startTime.getTime() + timeOffset);
    setCurrentTime(newTime);
    onTimeChange(newTime);
  };
  
  // Autoplay effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentValue < 100) {
      interval = setInterval(() => {
        const newValue = Math.min(currentValue + 1, 100);
        setCurrentValue(newValue);
        setLiveMode(newValue === 100);
        
        const timeOffset = (newValue / 100) * totalDuration;
        const newTime = new Date(startTime.getTime() + timeOffset);
        setCurrentTime(newTime);
        onTimeChange(newTime);
        
        if (newValue === 100) {
          // Stop when we reach the end
          onPlayToggle?.();
        }
      }, 500); // update every 500ms
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentValue, totalDuration, startTime, onTimeChange, onPlayToggle]);
  
  // Step backward (15% of the timeline)
  const handleStepBack = () => {
    const newValue = Math.max(currentValue - 15, 0);
    setCurrentValue(newValue);
    setLiveMode(false);
    
    const timeOffset = (newValue / 100) * totalDuration;
    const newTime = new Date(startTime.getTime() + timeOffset);
    setCurrentTime(newTime);
    onTimeChange(newTime);
  };
  
  // Step forward (15% of the timeline)
  const handleStepForward = () => {
    const newValue = Math.min(currentValue + 15, 100);
    setCurrentValue(newValue);
    setLiveMode(newValue === 100);
    
    const timeOffset = (newValue / 100) * totalDuration;
    const newTime = new Date(startTime.getTime() + timeOffset);
    setCurrentTime(newTime);
    onTimeChange(newTime);
  };
  
  // Format the displayed time
  const formatTimeDisplay = (time: Date) => {
    if (liveMode) {
      return 'Live';
    }
    
    const now = new Date();
    const isToday = time.toDateString() === now.toDateString();
    
    if (isToday) {
      return formatDistanceToNow(time, { addSuffix: true });
    }
    return format(time, "MMM d, h:mm a");
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Clock className={`h-4 w-4 mr-1 ${liveMode ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
          <motion.span
            key={currentTime.getTime()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm font-medium ${liveMode ? 'text-green-500' : ''}`}
          >
            {formatTimeDisplay(currentTime)}
          </motion.span>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleStepBack}
            disabled={currentValue <= 0}
          >
            <StepBack className="h-4 w-4" />
            <span className="sr-only">Step Back</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onPlayToggle}
            disabled={liveMode}
          >
            {isPlaying ? (
              <PauseCircle className="h-5 w-5" />
            ) : (
              <PlayCircle className="h-5 w-5" />
            )}
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleStepForward}
            disabled={currentValue >= 100}
          >
            <StepForward className="h-4 w-4" />
            <span className="sr-only">Step Forward</span>
          </Button>
        </div>
      </div>
      
      <div className="px-1">
        <Slider
          defaultValue={[100]}
          value={[currentValue]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleSliderChange}
          className={liveMode ? 'slider-live' : ''}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{format(startTime, "MMM d, h:mm a")}</span>
          <span>{liveMode ? 'Now' : format(endTime, "MMM d, h:mm a")}</span>
        </div>
      </div>
    </div>
  );
} 