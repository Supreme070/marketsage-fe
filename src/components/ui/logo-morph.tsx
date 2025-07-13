"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";

interface LogoMorphProps {
  scrolled: boolean;
}

export function LogoMorph({ scrolled }: LogoMorphProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const timeRef = useRef(0);
  const { theme } = useTheme();
  
  const isLight = theme === "light";
  
  // Force re-render when scrolled changes
  useEffect(() => {
    if (scrolled && canvasRef.current && mounted) {
      // Trigger canvas initialization
      const event = new Event('resize');
      window.dispatchEvent(event);
    }
  }, [scrolled, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Canvas animation for the three dots when scrolled
  useEffect(() => {
    if (!scrolled || !canvasRef.current || !mounted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 120 * dpr;
      canvas.height = 44 * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      // Data flow particles between dots
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: 20 + Math.random() * 80,
          y: 22,
          targetX: 20 + Math.random() * 80,
          size: 1 + Math.random() * 2,
          speed: 0.02 + Math.random() * 0.03,
          opacity: 0.3 + Math.random() * 0.7,
          color: ["#3B82F6", "#8B5CF6", "#F59E0B"][Math.floor(Math.random() * 3)],
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, 120, 44);
      timeRef.current += 0.016;

      const dotPositions = [
        { x: 25, y: 22, color: "#3B82F6" },
        { x: 60, y: 22, color: "#8B5CF6" },
        { x: 95, y: 22, color: "#F59E0B" }
      ];

      // Draw connection lines with gradient
      ctx.save();
      const gradient = ctx.createLinearGradient(25, 22, 95, 22);
      gradient.addColorStop(0, "#3B82F6");
      gradient.addColorStop(0.5, "#8B5CF6");
      gradient.addColorStop(1, "#F59E0B");
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -timeRef.current * 30;
      
      ctx.beginPath();
      ctx.moveTo(33, 22);
      ctx.lineTo(52, 22);
      ctx.moveTo(68, 22);
      ctx.lineTo(87, 22);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Move particles along the connection lines
        particle.x += (particle.targetX - particle.x) * particle.speed;
        
        if (Math.abs(particle.x - particle.targetX) < 1) {
          // Reset particle position
          if (particle.targetX < 60) {
            particle.x = 25;
            particle.targetX = 60;
          } else if (particle.targetX < 95) {
            particle.x = 60;
            particle.targetX = 95;
          } else {
            particle.x = 25;
            particle.targetX = 60;
          }
        }

        // Draw particle with glow
        ctx.save();
        const particleGlow = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        particleGlow.addColorStop(0, particle.color + "40");
        particleGlow.addColorStop(1, particle.color + "00");
        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * (0.5 + Math.sin(timeRef.current * 2 + particle.phase) * 0.5);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw the three dots with unique animations
      dotPositions.forEach((dot, index) => {
        ctx.save();

        if (index === 0) {
          // SEEING - Heartbeat pulse
          const pulseScale = 1 + Math.sin(timeRef.current * 4) * 0.2;
          
          // Outer pulse ring
          ctx.globalAlpha = 0.3 * (1 - (Math.sin(timeRef.current * 4) + 1) / 2);
          ctx.strokeStyle = dot.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 10 * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
          
          // Main dot with heartbeat
          ctx.globalAlpha = 1;
          const dotGradient = ctx.createRadialGradient(
            dot.x - 2, dot.y - 2, 0,
            dot.x, dot.y, 6
          );
          dotGradient.addColorStop(0, isLight ? "#60A5FA" : "#93C5FD");
          dotGradient.addColorStop(1, dot.color);
          
          ctx.fillStyle = dotGradient;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 6 + Math.sin(timeRef.current * 4) * 1, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (index === 1) {
          // THINKING - Rolling circle
          const rollAngle = timeRef.current * 3;
          
          // Thinking orbit
          ctx.strokeStyle = dot.color + "30";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 12, 0, Math.PI * 2);
          ctx.stroke();
          
          // Rolling dots around the main dot
          for (let i = 0; i < 3; i++) {
            const angle = rollAngle + (i * Math.PI * 2 / 3);
            const orbitX = dot.x + Math.cos(angle) * 10;
            const orbitY = dot.y + Math.sin(angle) * 10;
            
            ctx.fillStyle = dot.color;
            ctx.globalAlpha = 0.4 + i * 0.2;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Center dot
          ctx.globalAlpha = 1;
          const dotGradient = ctx.createRadialGradient(
            dot.x - 2, dot.y - 2, 0,
            dot.x, dot.y, 6
          );
          dotGradient.addColorStop(0, isLight ? "#C084FC" : "#E9D5FF");
          dotGradient.addColorStop(1, dot.color);
          
          ctx.fillStyle = dotGradient;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
          ctx.fill();
          
        } else {
          // ACTING - Radiating glow
          const radiateScale = 1 + (Math.sin(timeRef.current * 2) + 1) * 0.5;
          
          // Multiple radiating rings
          for (let i = 0; i < 3; i++) {
            const ringScale = radiateScale + i * 0.3;
            ctx.globalAlpha = 0.3 * (1 - i / 3) * (1 - (radiateScale - 1));
            
            const ringGradient = ctx.createRadialGradient(
              dot.x, dot.y, 5,
              dot.x, dot.y, 12 * ringScale
            );
            ringGradient.addColorStop(0, dot.color);
            ringGradient.addColorStop(1, dot.color + "00");
            
            ctx.fillStyle = ringGradient;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 12 * ringScale, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Main dot
          ctx.globalAlpha = 1;
          const dotGradient = ctx.createRadialGradient(
            dot.x - 2, dot.y - 2, 0,
            dot.x, dot.y, 6
          );
          dotGradient.addColorStop(0, isLight ? "#FCD34D" : "#FEF3C7");
          dotGradient.addColorStop(1, dot.color);
          
          ctx.fillStyle = dotGradient;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 6 + Math.sin(timeRef.current * 3) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scrolled, isLight, mounted]);

  if (!mounted) {
    return (
      <Link href="/" className="flex items-center justify-center w-full">
        <span className="text-3xl font-light tracking-tighter brand-text-new">
          <span className="market">MΛRKET</span>
          <span className="sage">SΛGE</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center">
      <motion.div
        animate={{
          height: scrolled ? 44 : 36
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {!scrolled ? (
            <motion.span
              key="full-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-light tracking-tighter brand-text-new"
            >
              <span className="market">MΛRKET</span>
              <span className="sage">SΛGE</span>
            </motion.span>
          ) : (
            <motion.div
              key="dots-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="relative w-[120px] h-[44px] flex items-center justify-center"
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ width: "120px", height: "44px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}