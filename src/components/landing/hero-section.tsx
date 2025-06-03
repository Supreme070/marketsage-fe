"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart, PieChart, ArrowUpRight, Users, Zap, ArrowRight, Mail, MessageSquare, MessageCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/ui/particles";
import { useSmoothScrolling, getOptimizedSettings } from "@/lib/animation";

export function HeroSection() {
  // Animation and performance settings
  const [settings, setSettings] = useState({
    duration: 1,
    stagger: 0.1,
    shouldAnimate3D: false,
    shouldUseParticles: false,
    shouldUseParallax: false,
  });
  
  const scrollRef = useSmoothScrolling();
  
  // Refs for animation targets
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Animation visibility states with useInView
  const subheadingInView = useInView(subheadingRef, { once: true });
  const buttonsInView = useInView(buttonsRef, { once: true });
  const imageInView = useInView(imageRef, { once: true });
  
  // State management
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState("");
  const fullText = "Build sophisticated marketing workflows ";
  const highlightedText = { without: "without", code: "code" };
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isHighlightGlowing, setIsHighlightGlowing] = useState(false);
  const [nodeAnimations, setNodeAnimations] = useState({
    email: false,
    sms: false,
    segment: false,
    conversion: false,
    connections: false,
    completed: false,
    dataFlow: false,
    pulses: false
  });

  // Component mount handling - initialize after hydration
  useEffect(() => {
    // Initialize performance settings after mount
    setSettings(getOptimizedSettings());
    setIsLoaded(true);
    setMounted(true);
    
    // Initialize animations when component mounts
    // Animate headline with typewriter effect
    const typingSpeed = 40; // ms per character
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
        
        // Start the glow effect animation
        setTimeout(() => {
          setIsHighlightGlowing(true);
        }, 500);
        
        // Trigger workflow animations sequentially with improved timing
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, segment: true })), 400);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, connections: true })), 900);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, email: true })), 1200);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, sms: true })), 1600);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, conversion: true })), 2000);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, dataFlow: true })), 2500);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, pulses: true })), 2800);
        setTimeout(() => setNodeAnimations(prev => ({ ...prev, completed: true })), 3000);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";
  
  // Parallax scrolling effect - only after hydration
  useEffect(() => {
    if (!mounted || !sectionRef.current || !settings.shouldUseParallax) return;
    
    const handleScroll = () => {
      if (!imageRef.current) return;
      const scrollPosition = window.scrollY;
      const parallaxFactor = 0.15; // Adjust for more/less parallax effect
      
      // Apply parallax to the image
      imageRef.current.style.transform = `translateY(${scrollPosition * parallaxFactor}px)`;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [settings.shouldUseParallax, mounted]);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden py-16 md:py-20 lg:py-24 ${
        isLight 
          ? 'bg-gradient-to-b from-white to-slate-50' 
          : 'bg-gradient-to-b from-background to-background/95'
      }`}
    >
      {/* Particle background - only render after hydration */}
      {mounted && settings.shouldUseParticles && (
        <Particles 
          quantity={100}
          mouseForce={40}
          className="z-0"
        />
      )}
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="mx-auto max-w-2xl text-center lg:text-left">
            {/* Animated heading with typewriter effect and colored highlights */}
            <h1 
              ref={headingRef}
              className={`mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {typedText}
              {isTypingComplete && (
                <>
                  <motion.span 
                    className="without-text font-bold"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: isHighlightGlowing ? [0.7, 1, 0.7] : 0.7 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                  >
                    {highlightedText.without}
                  </motion.span>
                  {" "}
                  <motion.span 
                    className="code-text font-bold"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: isHighlightGlowing ? [0.7, 1, 0.7] : 0.7 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", delay: 0.5 }}
                  >
                    {highlightedText.code}
                  </motion.span>
                </>
              )}
              <span className={`inline-block w-[2px] h-8 ml-1 align-middle ${isTypingComplete ? 'opacity-0' : 'animate-blink'}`}
                style={{ 
                  backgroundColor: isLight ? '#0f172a' : '#ffffff',
                }}
              />
            </h1>
            
            {/* Subheading with fade-in animation */}
            <motion.p 
              ref={subheadingRef}
              className={`mb-8 text-lg sm:text-xl ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={isTypingComplete && subheadingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              MarketSage helps Nigerian businesses automate their marketing and grow revenue
              with multi-channel campaigns, AI-powered insights, and drag-and-drop workflows.
            </motion.p>
            
            {/* CTA buttons with staggered animation */}
            <motion.div 
              ref={buttonsRef}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-14"
              initial={{ opacity: 0, y: 20 }}
              animate={isTypingComplete && buttonsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto font-medium relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      Start Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary-600 group-hover:opacity-90 transition-opacity" />
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href="/demo">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className={`w-full sm:w-auto font-medium ${
                      isLight ? 'border-slate-300' : 'border-slate-700'
                    } hover:bg-primary/10`}
                  >
                    View Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Interactive workflow builder visualization */}
          <motion.div 
            ref={imageRef}
            className={`relative mx-auto max-w-full w-full rounded-xl p-2 ${
              isLight 
                ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-200' 
                : 'bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-black/20 border border-slate-800'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isTypingComplete ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.17, 0.67, 0.83, 0.67] }}
          >
            <div className={`relative rounded-lg overflow-hidden ${
              isLight ? 'bg-gray-50' : 'bg-slate-800/50'
            }`}>
              {/* Workflow canvas */}
              <div className="aspect-[16/9]">
                <div className="absolute inset-0 p-4 grid grid-cols-12 grid-rows-6 gap-4">
                  {/* Start node */}
                  <motion.div 
                    className="col-span-2 row-span-1 col-start-2 row-start-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-500 p-2 shadow-md cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: "rgba(34, 197, 94, 0.3)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <motion.div 
                      className="w-3 h-3 bg-green-500 rounded-full mr-2"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        repeatType: "reverse", 
                        duration: 1.5
                      }}
                    />
                    <span className="text-sm font-medium">Start</span>
                  </motion.div>
                  
                  {/* Connecting line - animated */}
                  <div className="absolute left-[calc(2/12*100%+4rem)] top-[calc(3/6*100%+1rem)] w-[calc(2/12*100%)] h-0.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500" 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  </div>
                  
                  {/* Decision node */}
                  <motion.div 
                    className="col-span-2 row-span-2 col-start-4 row-start-2 rounded-lg bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center text-blue-500 p-3 shadow-md cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: nodeAnimations.segment ? 1 : 0, 
                      y: nodeAnimations.segment ? 0 : 20 
                    }}
                    transition={{ duration: 0.6 }}
                    whileHover={{ 
                      scale: 1.03, 
                      backgroundColor: "rgba(59, 130, 246, 0.3)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <motion.div
                      animate={nodeAnimations.segment ? {
                        rotate: [0, 10, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{
                        duration: 0.8,
                        delay: 0.4,
                        ease: "easeInOut"
                      }}
                    >
                      <Users className="w-5 h-5 mb-2" />
                    </motion.div>
                    <span className="text-sm font-medium text-center">Segment Customers</span>
                    <motion.div 
                      className="mt-2 w-full h-1 bg-blue-500/20 rounded-full overflow-hidden"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                    >
                      <motion.div 
                        className="h-full bg-blue-500 rounded-full" 
                        initial={{ width: "0%" }}
                        animate={{ width: nodeAnimations.segment ? "75%" : "0%" }}
                        transition={{ delay: 1.1, duration: 1.2 }}
                      />
                    </motion.div>
                  </motion.div>
                  
                  {/* Connecting lines - animated */}
                  <div className="absolute left-[calc(6/12*100%-1rem)] top-[calc(2/6*100%+2rem)] w-0.5 h-[calc(1/6*100%)] overflow-hidden">
                    <motion.div 
                      className="w-full bg-gradient-to-b from-blue-500 to-primary" 
                      initial={{ height: "0%" }}
                      animate={{ height: nodeAnimations.email ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="absolute left-[calc(6/12*100%-1rem)] top-[calc(4/6*100%)] w-0.5 h-[calc(1/6*100%)] overflow-hidden">
                    <motion.div 
                      className="w-full bg-gradient-to-b from-blue-500 to-amber-500" 
                      initial={{ height: "0%" }}
                      animate={{ height: nodeAnimations.sms ? "100%" : "0%" }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  {/* Email node */}
                  <motion.div 
                    className="col-span-2 row-span-1 col-start-6 row-start-1 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary p-2 shadow-md cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: nodeAnimations.email ? 1 : 0, 
                      x: nodeAnimations.email ? 0 : -20 
                    }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: "rgba(99, 102, 241, 0.3)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <motion.div
                      animate={nodeAnimations.email ? { 
                        y: [0, -3, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{
                        duration: 0.6,
                        delay: 0.2,
                        repeat: 1,
                        repeatType: "reverse"
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                    </motion.div>
                    <span className="text-sm font-medium">Send Email</span>
                  </motion.div>
                  
                  {/* SMS node */}
                  <motion.div 
                    className="col-span-2 row-span-1 col-start-6 row-start-5 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 p-2 shadow-md cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: nodeAnimations.sms ? 1 : 0, 
                      x: nodeAnimations.sms ? 0 : -20 
                    }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: "rgba(245, 158, 11, 0.3)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <motion.div
                      animate={nodeAnimations.sms ? { 
                        y: [0, -3, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{
                        duration: 0.6,
                        delay: 0.2,
                        repeat: 1,
                        repeatType: "reverse"
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                    </motion.div>
                    <span className="text-sm font-medium">Send SMS</span>
                  </motion.div>
                  
                  {/* Connecting lines to conversion tracking */}
                  <div className="absolute left-[calc(8/12*100%+1rem)] top-[calc(1/6*100%+1rem)] w-[calc(1/12*100%)] h-0.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-purple-500" 
                      initial={{ width: "0%" }}
                      animate={{ width: nodeAnimations.email && nodeAnimations.conversion ? "100%" : "0%" }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                  <div className="absolute left-[calc(8/12*100%+1rem)] top-[calc(5/6*100%+1rem)] w-[calc(1/12*100%)] h-0.5 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-500 to-purple-500" 
                      initial={{ width: "0%" }}
                      animate={{ width: nodeAnimations.sms && nodeAnimations.conversion ? "100%" : "0%" }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                  
                  {/* Conversion tracking node */}
                  <motion.div 
                    className="col-span-3 row-span-3 col-start-9 row-start-2 rounded-lg bg-purple-500/20 border border-purple-500/30 flex flex-col items-center justify-center text-purple-500 p-4 shadow-md cursor-pointer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: nodeAnimations.conversion ? 1 : 0, 
                      scale: nodeAnimations.conversion ? 1 : 0.9 
                    }}
                    transition={{ duration: 0.7 }}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "rgba(168, 85, 247, 0.3)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                    }}
                  >
                    <motion.div
                      animate={nodeAnimations.conversion ? {
                        rotateZ: [0, 10, 0, -10, 0],
                        transition: { duration: 2, delay: 0.5 }
                      } : {}}
                    >
                      <BarChart3 className="w-6 h-6 mb-3" />
                    </motion.div>
                    <span className="text-sm font-medium mb-2">Track Conversions</span>
                    
                    {/* Mini chart - with animation */}
                    <div className="w-full h-16 relative mt-2 px-2">
                      <AnimatePresence>
                        {nodeAnimations.conversion && (
                          <>
                            <motion.div 
                              className="absolute bottom-0 left-0 w-2 bg-green-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 32 }}
                              transition={{ delay: 0.5, duration: 0.6 }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-[calc(1/6*100%)] w-2 bg-blue-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 40 }}
                              transition={{ delay: 0.6, duration: 0.6 }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-[calc(2/6*100%)] w-2 bg-green-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 24 }}
                              transition={{ delay: 0.7, duration: 0.6 }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-[calc(3/6*100%)] w-2 bg-blue-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 56 }}
                              transition={{ delay: 0.8, duration: 0.6 }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-[calc(4/6*100%)] w-2 bg-green-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 48 }}
                              transition={{ delay: 0.9, duration: 0.6 }}
                            />
                            <motion.div 
                              className="absolute bottom-0 left-[calc(5/6*100%)] w-2 bg-blue-500/60 rounded-t-sm"
                              initial={{ height: 0 }}
                              animate={{ height: 28 }}
                              transition={{ delay: 1.0, duration: 0.6 }}
                            />
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
                
                {/* Animated data points flowing through connections */}
                {nodeAnimations.dataFlow && (
                  <>
                    {/* Start to Segment flow */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-300"
                      initial={{ left: "calc(2/12*100%+4rem)", top: "calc(3/6*100%+1rem)", opacity: 0 }}
                      animate={{ 
                        left: "calc(4/12*100%)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.5, 
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-300"
                      initial={{ left: "calc(2/12*100%+4rem)", top: "calc(3/6*100%+1rem)", opacity: 0 }}
                      animate={{ 
                        left: "calc(4/12*100%)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.5, 
                        repeatDelay: 3,
                        delay: 1.5,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Segment to Email flow */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50"
                      initial={{ left: "calc(6/12*100%-1rem)", top: "calc(2/6*100%+2rem)", opacity: 0 }}
                      animate={{ 
                        top: "calc(1/6*100%+1rem)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.2, 
                        repeatDelay: 2.5, 
                        delay: 1,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50"
                      initial={{ left: "calc(6/12*100%-1rem)", top: "calc(2/6*100%+2rem)", opacity: 0 }}
                      animate={{ 
                        top: "calc(1/6*100%+1rem)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.2, 
                        repeatDelay: 2.5, 
                        delay: 2.2,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Segment to SMS flow */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-300"
                      initial={{ left: "calc(6/12*100%-1rem)", top: "calc(4/6*100%+1rem)", opacity: 0 }}
                      animate={{ 
                        top: "calc(5/6*100%+1rem)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.2, 
                        repeatDelay: 3.5, 
                        delay: 1.5,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Email to Conversion flow */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-purple-400 shadow-sm shadow-purple-300"
                      initial={{ left: "calc(8/12*100%+1rem)", top: "calc(1/6*100%+1rem)", opacity: 0 }}
                      animate={{ 
                        left: "calc(9/12*100%+1rem)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.3, 
                        repeatDelay: 4, 
                        delay: 1.7,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* SMS to Conversion flow */}
                    <motion.div 
                      className="absolute h-2 w-2 rounded-full bg-purple-400 shadow-sm shadow-purple-300"
                      initial={{ left: "calc(8/12*100%+1rem)", top: "calc(5/6*100%+1rem)", opacity: 0 }}
                      animate={{ 
                        left: "calc(9/12*100%+1rem)", 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 0.8]
                      }}
                      transition={{ 
                        repeat: Number.POSITIVE_INFINITY, 
                        duration: 1.3, 
                        repeatDelay: 4, 
                        delay: 2.8,
                        ease: "easeInOut"
                      }}
                    />
                  </>
                )}
                
                {/* Pulse effects at connection points */}
                {nodeAnimations.pulses && (
                  <>
                    <motion.div 
                      className="absolute left-[calc(4/12*100%+1rem)] top-[calc(3/6*100%)] h-3 w-3 rounded-full bg-blue-400/50"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute left-[calc(6/12*100%)] top-[calc(1/6*100%+1rem)] h-3 w-3 rounded-full bg-primary/50"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />
                    <motion.div 
                      className="absolute left-[calc(6/12*100%)] top-[calc(5/6*100%+1rem)] h-3 w-3 rounded-full bg-amber-400/50"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 1
                      }}
                    />
                    <motion.div 
                      className="absolute left-[calc(9/12*100%+1rem)] top-[calc(3/6*100%)] h-3 w-3 rounded-full bg-purple-400/50"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.7, 0, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: 1.5
                      }}
                    />
                  </>
                )}
                
                {/* Floating indicators */}
                <div className="absolute top-6 right-6 flex gap-2">
                  <motion.div 
                    className="flex items-center bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    <span>Active</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.7, duration: 0.6 }}
                  >
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse" />
                    <span>Real-time</span>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Workflow info bar */}
            <motion.div 
              className={`flex items-center justify-between p-3 text-sm ${
                isLight ? 'border-t border-slate-200' : 'border-t border-slate-800'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isTypingComplete ? 1 : 0 }}
              transition={{ delay: 2.0, duration: 0.6 }}
            >
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Users className="h-4 w-4" />
                  <span>12,480 customers</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Mail className="h-4 w-4" />
                  <span>72% open rate</span>
                </div>
              </div>
              <div className={`flex items-center gap-1 ${isLight ? 'text-primary-700' : 'text-primary-300'} group cursor-pointer`}>
                <span className="font-medium">Edit Workflow</span>
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Add CSS for the glowing effect */}
      <style jsx global>{`
        .without-text {
          color: #2DD4BF;
          text-shadow: 0 0 8px rgba(45, 212, 191, 0.3);
        }
        .code-text {
          color: #FBBF24;
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
        }
        .glow-teal {
          text-shadow: 0 0 8px rgba(20, 184, 166, 0.3),
                     0 0 16px rgba(20, 184, 166, 0.2);
        }
        .glow-amber {
          text-shadow: 0 0 8px rgba(245, 158, 11, 0.3),
                     0 0 16px rgba(245, 158, 11, 0.2);
        }
      `}</style>
    </section>
  );
} 