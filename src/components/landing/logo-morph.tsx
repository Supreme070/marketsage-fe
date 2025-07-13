"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useTheme } from "next-themes";

interface LogoMorphProps {
  scrolled: boolean;
}

export function LogoMorph({ scrolled }: LogoMorphProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<any[]>([]);
  const timeRef = useRef(0);
  
  const isLight = theme === "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Canvas animation for the three dots when scrolled
  useEffect(() => {
    if (!scrolled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 120 * dpr;
      canvas.height = 40 * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      // Data flow particles between dots
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
          x: 20 + Math.random() * 80,
          y: 20,
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
      ctx.clearRect(0, 0, 120, 40);
      timeRef.current += 0.016;

      const dotPositions = [
        { x: 20, y: 20, color: "#3B82F6", label: "See" },
        { x: 60, y: 20, color: "#8B5CF6", label: "Think" },
        { x: 100, y: 20, color: "#F59E0B", label: "Act" }
      ];

      // Draw connection lines with gradient
      ctx.save();
      const gradient = ctx.createLinearGradient(20, 20, 100, 20);
      gradient.addColorStop(0, "#3B82F6");
      gradient.addColorStop(0.5, "#8B5CF6");
      gradient.addColorStop(1, "#F59E0B");
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([2, 4]);
      ctx.lineDashOffset = -timeRef.current * 30;
      
      ctx.beginPath();
      ctx.moveTo(30, 20);
      ctx.lineTo(50, 20);
      ctx.moveTo(70, 20);
      ctx.lineTo(90, 20);
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
            particle.x = 20;
            particle.targetX = 60;
          } else if (particle.targetX < 100) {
            particle.x = 60;
            particle.targetX = 100;
          } else {
            particle.x = 20;
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
          ctx.arc(dot.x, dot.y, 8 * pulseScale, 0, Math.PI * 2);
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
          ctx.arc(dot.x, dot.y, 5 + Math.sin(timeRef.current * 4) * 1, 0, Math.PI * 2);
          ctx.fill();
          
        } else if (index === 1) {
          // THINKING - Rolling circle
          const rollAngle = timeRef.current * 3;
          
          // Thinking orbit
          ctx.strokeStyle = dot.color + "30";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 10, 0, Math.PI * 2);
          ctx.stroke();
          
          // Rolling dots around the main dot
          for (let i = 0; i < 3; i++) {
            const angle = rollAngle + (i * Math.PI * 2 / 3);
            const orbitX = dot.x + Math.cos(angle) * 8;
            const orbitY = dot.y + Math.sin(angle) * 8;
            
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
          ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
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
              dot.x, dot.y, 10 * ringScale
            );
            ringGradient.addColorStop(0, dot.color);
            ringGradient.addColorStop(1, dot.color + "00");
            
            ctx.fillStyle = ringGradient;
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 10 * ringScale, 0, Math.PI * 2);
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
          ctx.arc(dot.x, dot.y, 5 + Math.sin(timeRef.current * 3) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw subtle labels
      ctx.save();
      ctx.font = "9px Inter";
      ctx.textAlign = "center";
      ctx.fillStyle = isLight ? "#6B7280" : "#9CA3AF";
      ctx.globalAlpha = 0.6;
      
      dotPositions.forEach((dot) => {
        ctx.fillText(dot.label, dot.x, dot.y + 15);
      });
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scrolled, isLight]);

  if (!mounted) return null;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!scrolled ? (
          // Full logo text
          <motion.div
            key="full-logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-2"
          >
            <span className={`text-xl font-bold tracking-tight ${
              isLight ? "text-gray-900" : "text-white"
            }`}>
              <span className="relative">
                M
                <motion.span
                  className="absolute inset-0 text-blue-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                >
                  M
                </motion.span>
              </span>
              arket
              <span className="relative">
                S
                <motion.span
                  className="absolute inset-0 text-purple-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                >
                  S
                </motion.span>
              </span>
              age
            </span>
          </motion.div>
        ) : (
          // Three dots animation
          <motion.div
            key="dots-logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="relative w-[120px] h-[40px]"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ width: "120px", height: "40px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}