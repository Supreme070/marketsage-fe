'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import ChatBot with no SSR to prevent hydration errors
const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false });

export default function ChatBotWrapper() {
  const [showPulse, setShowPulse] = useState(false);
  
  // Add a pulsing animation effect that starts after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPulse(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <ChatBot 
      buttonText="Chat" 
      showInitially={true}
      customButtonClassName={`
        group relative overflow-hidden bg-gradient-to-r from-teal-500 to-amber-500
        hover:from-amber-500 hover:to-teal-500 transition-all duration-500
        shadow-lg hover:shadow-teal-500/25 ${showPulse ? 'animate-pulse-subtle' : ''}
      `}
      customIconClassName="
        h-5 w-5 mr-2 text-white group-hover:rotate-12 transition-transform duration-300
      "
      dialogTitleGradient="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent"
      pulseColors={{
        primary: 'bg-teal-500',
        secondary: 'bg-amber-500',
        tertiary: 'bg-teal-300'
      }}
    />
  );
} 