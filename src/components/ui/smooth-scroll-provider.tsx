"use client";

import type React from 'react';
import { useEffect } from 'react';
import { useSmoothScrolling } from '@/lib/animation';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  // Initialize smooth scrolling
  const scrollerRef = useSmoothScrolling();
  
  // Handle hash navigation with smooth scrolling
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      // Get the href attribute
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      
      // Prevent default behavior
      e.preventDefault();
      
      // Get the target element
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      // Scroll to the target element if it exists
      if (targetElement && scrollerRef.current) {
        scrollerRef.current.scrollTo(targetElement, {
          offset: -100, // offset to account for fixed header
        });
      }
    };
    
    // Add event listener to handle anchor clicks
    document.addEventListener('click', handleAnchorClick);
    
    // Handle initial hash if present
    const handleInitialHash = () => {
      const hash = window.location.hash;
      
      if (hash && scrollerRef.current) {
        const targetId = hash.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // Wait a bit to make sure everything is loaded
          setTimeout(() => {
            scrollerRef.current?.scrollTo(targetElement, {
              offset: -100,
            });
          }, 500);
        }
      }
    };
    
    // Handle initial hash navigation after a short delay
    handleInitialHash();
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [scrollerRef]);
  
  return <>{children}</>;
} 