"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { getPerformanceProfile } from '@/lib/animation';
import dynamic from 'next/dynamic';

// Custom hook to track mouse position
const useMousePosition = () => {
  const [position, setPosition] = useState({ x: null as number | null, y: null as number | null });
  
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', updatePosition);
    
    return () => {
      window.removeEventListener('mousemove', updatePosition);
    };
  }, []);
  
  return position;
};

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  mouseForce?: number;
  particleSize?: number;
  speedFactor?: number;
}

// Create a wrapper component that will only render on the client side
const ParticlesCanvas = ({
  className = "",
  quantity = 50,
  mouseForce = 30,
  particleSize = 1.5,
  speedFactor = 0.5,
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mousePos = useMousePosition();
  const animationRef = useRef<number>(0);
  const performanceProfile = getPerformanceProfile();
  
  // Adjust settings based on device capability
  const adjustedQuantity = performanceProfile === 'low' ? Math.floor(quantity * 0.3) :
                           performanceProfile === 'medium' ? Math.floor(quantity * 0.7) :
                           quantity;
  
  // Create particles on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update canvas size
    const updateSize = () => {
      if (!canvasRef.current) return;
      const newWidth = canvasRef.current.offsetWidth;
      const newHeight = canvasRef.current.offsetHeight;
      
      canvasRef.current.width = newWidth;
      canvasRef.current.height = newHeight;
      
      setDimensions({ width: newWidth, height: newHeight });
    };
    
    // Initialize canvas size
    updateSize();
    
    // Handle resize
    window.addEventListener('resize', updateSize);
    
    // Initialize particles
    const baseColors = theme === 'dark' 
      ? ['#14b8a6', '#0891b2', '#0e7490'] // Teal colors for dark mode
      : ['#0d9488', '#0ea5e9', '#6366f1']; // Colors for light mode
    
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < adjustedQuantity; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * particleSize + 0.5,
        speedX: (Math.random() - 0.5) * speedFactor,
        speedY: (Math.random() - 0.5) * speedFactor,
        color: baseColors[Math.floor(Math.random() * baseColors.length)],
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
    
    setParticles(newParticles);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, adjustedQuantity, particleSize, speedFactor]);
  
  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between particles that are close enough
      ctx.lineWidth = 0.1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(130, 130, 150, ${0.15 * (1 - distance / 100)})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      
      // Draw and update particles
      const updatedParticles = [...particles];
      
      updatedParticles.forEach((particle, index) => {
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }
        
        // Apply mouse influence if mouse is moving
        if (mousePos.x !== null && mousePos.y !== null) {
          const dx = mousePos.x - particle.x;
          const dy = mousePos.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouseForce * 3) {
            const forceFactor = (mouseForce * 3 - distance) / (mouseForce * 3);
            particle.speedX -= (dx / distance) * forceFactor * 0.1;
            particle.speedY -= (dy / distance) * forceFactor * 0.1;
          }
        }
        
        // Apply slight friction
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;
        
        updatedParticles[index] = particle;
      });
      
      setParticles(updatedParticles);
      animationRef.current = requestAnimationFrame(draw);
    };
    
    animationRef.current = requestAnimationFrame(draw);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, dimensions, mousePos.x, mousePos.y, mouseForce]);
  
  if (performanceProfile === 'low') {
    // For low performance devices, return a simpler gradient instead
    return (
      <div 
        className={`absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/10 to-secondary/5 ${className}`}
        aria-hidden="true"
      />
    );
  }
  
  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

// Dynamically import the ParticlesCanvas component with SSR disabled
const ClientOnlyParticles = dynamic(() => Promise.resolve(ParticlesCanvas), { ssr: false });

// Main export component that wraps the client-only implementation
export function Particles(props: ParticlesProps) {
  // For SSR, return a simple placeholder div that matches the structure
  // This ensures the HTML structure is consistent between server and client
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During SSR or before hydration, return a simple placeholder
  if (!isMounted) {
    return (
      <div 
        className={`absolute inset-0 pointer-events-none ${props.className || ""}`}
        aria-hidden="true"
      />
    );
  }
  
  // After hydration, render the dynamic client component
  return <ClientOnlyParticles {...props} />;
} 