import { useEffect, useRef, type MutableRefObject } from 'react';

// Performance optimization for animations - checks device capability
export const getPerformanceProfile = () => {
  // Always return 'medium' for server-side rendering
  if (typeof window === 'undefined') return 'medium';
  
  try {
    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Check for connection speed
    const connection = (navigator as any).connection;
    const slow = connection && (connection.saveData || 
      /2g/.test(connection.effectiveType) || 
      connection.downlink < 0.5);
    
    // Determine performance profile
    if (isMobile && slow) return 'low';
    if (isMobile) return 'medium';
    return 'high';
  } catch (error) {
    // Safely fallback to medium profile if any browser API fails
    return 'medium';
  }
};

// Creates modified animation settings based on performance profile
export const getOptimizedSettings = (
  defaultDuration = 1,
  defaultStagger = 0.1
) => {
  const profile = getPerformanceProfile();
  
  switch (profile) {
    case 'low':
      return {
        duration: defaultDuration * 0.5,
        stagger: defaultStagger * 0.5,
        shouldAnimate3D: false,
        shouldUseParticles: false,
        shouldUseParallax: false,
      };
    case 'medium':
      return {
        duration: defaultDuration * 0.8,
        stagger: defaultStagger * 0.8,
        shouldAnimate3D: true,
        shouldUseParticles: typeof window !== 'undefined',
        shouldUseParallax: typeof window !== 'undefined',
      };
    case 'high':
    default:
      return {
        duration: defaultDuration,
        stagger: defaultStagger,
        shouldAnimate3D: true,
        shouldUseParticles: typeof window !== 'undefined',
        shouldUseParallax: typeof window !== 'undefined',
      };
  }
};

// Simplified smooth scrolling with native browser APIs
export const useSmoothScrolling = () => {
  const scrollerRef = useRef({
    scrollTo: (element: HTMLElement, options?: any) => {
      if (typeof window === 'undefined' || !element) return;
      
      const offset = options?.offset || 0;
      const duration = options?.duration || 1.0;
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset + offset;
      
      // Use the browser's built-in smooth scrolling
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
  
  return scrollerRef;
};

// Hook to animate elements when they come into view using Intersection Observer
export const useScrollAnimation = (
  ref: MutableRefObject<HTMLElement | null>,
  onInView: Function,
  threshold = 0.2
) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;
    
    const element = ref.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onInView();
            observer.unobserve(element);
          }
        });
      },
      { threshold }
    );
    
    observer.observe(element);
    
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [ref, onInView, threshold]);
}; 