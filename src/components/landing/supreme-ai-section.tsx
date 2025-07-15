"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, TrendingDown } from "lucide-react";

export function SupremeAISection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("supreme-ai-section");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [mounted]);

  // 3D Neural Network Background
  useEffect(() => {
    if (!canvasRef.current || !mounted || !isVisible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 600;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Neural network nodes
    const nodes: any[] = [];
    const nodeCount = 15;
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 200 - 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: []
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      const connectionCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * nodes.length);
        if (targetIndex !== i) {
          node.connections.push(targetIndex);
        }
      }
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // 3D perspective effect
        const perspective = 1 + node.z / 200;
        node.projectedX = node.x;
        node.projectedY = node.y;
        node.scale = perspective;
      });

      // Draw connections
      ctx.strokeStyle = theme === "light" ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)";
      ctx.lineWidth = 1;
      
      nodes.forEach((node, i) => {
        node.connections.forEach((targetIndex: number) => {
          const target = nodes[targetIndex];
          if (!target) return;
          
          ctx.beginPath();
          ctx.moveTo(node.projectedX, node.projectedY);
          ctx.lineTo(target.projectedX, target.projectedY);
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach(node => {
        const gradient = ctx.createRadialGradient(
          node.projectedX, node.projectedY, 0,
          node.projectedX, node.projectedY, 5 * node.scale
        );
        
        gradient.addColorStop(0, theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)");
        gradient.addColorStop(1, theme === "light" ? "rgba(0,0,0,0.01)" : "rgba(255,255,255,0.01)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.projectedX, node.projectedY, 5 * node.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, mounted, isVisible]);

  if (!mounted) {
    return null;
  }

  const isLight = theme === "light";

  return (
    <section
      id="supreme-ai-section"
      className={`relative py-24 lg:py-32 overflow-hidden ${
        isLight ? "bg-gray-50" : "bg-gray-950"
      }`}
    >
      {/* 3D Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.5 }}
      />
      
      {/* Subtle background gradient */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 ${
          isLight 
            ? "bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30" 
            : "bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-900/30"
        }`} />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <Badge 
              variant="secondary" 
              className={`mb-4 ${
                isLight 
                  ? "bg-gray-100 text-gray-700 border-gray-200" 
                  : "bg-gray-900 text-gray-300 border-gray-800"
              }`}
            >
              SUPREME-AI V3
            </Badge>
            
            <h2 className={`text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
              isLight ? "text-gray-900" : "text-gray-100"
            }`}>
              Intelligence That Acts
            </h2>
            
            <p className={`text-lg lg:text-xl ${
              isLight ? "text-gray-600" : "text-gray-400"
            }`}>
              See how AI decisions happen in real-time
            </p>
          </div>

          {/* Main Demo Card with 3D effect */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            animate={isVisible ? { 
              opacity: 1, 
              y: 0, 
              rotateX: 0,
              transition: {
                duration: 0.8,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            } : {}}
            whileHover={{ 
              y: -5,
              rotateX: 2,
              transition: { duration: 0.3 }
            }}
            className="mb-16"
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d"
            }}
          >
            <Card className={`p-8 lg:p-10 border-2 transition-all duration-300 relative ${
              isLight 
                ? "bg-white/80 border-gray-200 shadow-2xl hover:shadow-3xl" 
                : "bg-gray-900/50 border-gray-800 backdrop-blur-md"
            }`}
            style={{
              transform: "translateZ(50px)",
              boxShadow: isLight 
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 25px -5px rgba(0, 0, 0, 0.05)"
                : "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px -5px rgba(255, 255, 255, 0.05)"
            }}>
              {/* Card Header */}
              <div className={`flex items-center justify-between pb-6 mb-6 border-b ${
                isLight ? "border-gray-200" : "border-gray-800"
              }`}>
                <h3 className={`text-xl font-semibold ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}>
                  Supreme-AI Decision Engine
                </h3>
                <div className={`flex items-center gap-2 text-sm ${
                  isLight ? "text-gray-500" : "text-gray-400"
                }`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              {/* Decision Content */}
              <div className="space-y-6">
                {/* Detection with 3D icon */}
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className={`p-2 rounded-lg relative ${
                      isLight ? "bg-gray-100" : "bg-gray-800/50"
                    }`}
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      transformStyle: "preserve-3d",
                      boxShadow: isLight 
                        ? "4px 4px 12px rgba(0,0,0,0.1), -2px -2px 8px rgba(255,255,255,0.8)"
                        : "4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.05)"
                    }}
                  >
                    <AlertCircle className={`h-5 w-5 ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`} />
                  </motion.div>
                  <div className="flex-1">
                    <p className={`font-medium mb-1 ${
                      isLight ? "text-gray-800" : "text-gray-200"
                    }`}>
                      Detected: Campaign underperforming
                    </p>
                    <div className={`text-sm space-y-1 ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`}>
                      <p>Open rate: 12% (target: 25%)</p>
                      <p>Cost per lead: ₦2,500 (target: ₦800)</p>
                    </div>
                  </div>
                </motion.div>

                {/* Analysis with 3D icon */}
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div 
                    className={`p-2 rounded-lg relative ${
                      isLight ? "bg-gray-100" : "bg-gray-800/50"
                    }`}
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      transformStyle: "preserve-3d",
                      boxShadow: isLight 
                        ? "4px 4px 12px rgba(0,0,0,0.1), -2px -2px 8px rgba(255,255,255,0.8)"
                        : "4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.05)"
                    }}
                  >
                    <TrendingDown className={`h-5 w-5 ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`} />
                  </motion.div>
                  <div className="flex-1">
                    <p className={`font-medium mb-1 ${
                      isLight ? "text-gray-700" : "text-gray-300"
                    }`}>
                      Analysis: Poor timing + wrong segment
                    </p>
                  </div>
                </motion.div>

                {/* Action with 3D icon */}
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div 
                    className={`p-2 rounded-lg relative ${
                      isLight ? "bg-gray-100" : "bg-gray-800/50"
                    }`}
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      transformStyle: "preserve-3d",
                      boxShadow: isLight 
                        ? "4px 4px 12px rgba(0,0,0,0.1), -2px -2px 8px rgba(255,255,255,0.8)"
                        : "4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.05)"
                    }}
                  >
                    <CheckCircle className={`h-5 w-5 ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`} />
                  </motion.div>
                  <div className="flex-1">
                    <p className={`font-medium mb-1 ${
                      isLight ? "text-gray-800" : "text-gray-200"
                    }`}>
                      Action: Pause campaign & redirect budget to WhatsApp
                    </p>
                    <p className={`text-sm ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`}>
                      WhatsApp showing 89% open rate for this segment
                    </p>
                  </div>
                </motion.div>

                {/* Impact with 3D depth */}
                <motion.div 
                  className={`p-4 rounded-lg relative ${
                    isLight ? "bg-gray-50 border border-gray-200" : "bg-gray-800/30 border border-gray-700"
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  style={{
                    boxShadow: isLight 
                      ? "inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.8)"
                      : "inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.02)"
                  }}
                >
                  <p className={`text-lg font-semibold ${
                    isLight ? "text-gray-900" : "text-gray-100"
                  }`}>
                    Impact: Save{" "}
                    <span className={isLight ? "text-green-700" : "text-green-400"}>
                      ₦450,000
                    </span>{" "}
                    this month
                  </p>
                </motion.div>

                {/* Action Buttons with 3D effect */}
                <motion.div 
                  className="flex gap-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 }}
                >
                  {["Approve", "View Details", "Modify"].map((label, index) => (
                    <motion.button
                      key={label}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        isLight 
                          ? "border-gray-300 bg-white hover:bg-gray-50 text-gray-700" 
                          : "border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300"
                      }`}
                      whileHover={{ 
                        y: -2,
                        boxShadow: isLight 
                          ? "0 4px 12px rgba(0,0,0,0.1)" 
                          : "0 4px 12px rgba(0,0,0,0.3)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      style={{
                        boxShadow: isLight 
                          ? "2px 2px 5px rgba(0,0,0,0.05), -1px -1px 3px rgba(255,255,255,0.8)"
                          : "2px 2px 5px rgba(0,0,0,0.2), -1px -1px 3px rgba(255,255,255,0.02)"
                      }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Stats with 3D cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            {[
              { value: "847 decisions/minute", label: "Processing capacity" },
              { value: "95% accuracy", label: "On predictions" },
              { value: "₦12M average", label: "Revenue recovered" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-xl relative ${
                  isLight ? "bg-white" : "bg-gray-900/50"
                }`}
                initial={{ opacity: 0, y: 20, rotateX: -15 }}
                animate={isVisible ? { 
                  opacity: 1, 
                  y: 0, 
                  rotateX: 0,
                  transition: { delay: 1 + index * 0.1 }
                } : {}}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                style={{
                  transformStyle: "preserve-3d",
                  boxShadow: isLight 
                    ? "0 10px 30px -10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : "0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
                }}
              >
                <p className={`text-2xl font-bold mb-1 ${
                  isLight ? "text-gray-900" : "text-gray-100"
                }`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${
                  isLight ? "text-gray-600" : "text-gray-400"
                }`}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}