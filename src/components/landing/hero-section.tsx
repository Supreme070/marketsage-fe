"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { DashboardPreview } from "./dashboard-preview";

// Animated word switcher component
function AnimatedWord({ isLight }: { isLight: boolean }) {
  const [currentWord, setCurrentWord] = useState(0); // 0: Thinks, 1: Acts, 2: Works

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prev => (prev + 1) % 3);
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[210px] h-[1em] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {currentWord === 0 && (
          <motion.span
            key="thinks"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`absolute font-light tracking-tighter text-transparent bg-clip-text ${
              isLight ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{
              textShadow: "0 0 20px rgba(251, 191, 36, 0.5)"
            }}
          >
            Thinks
          </motion.span>
        )}
        {currentWord === 1 && (
          <motion.span
            key="acts"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`absolute font-light tracking-tighter text-transparent bg-clip-text ${
              isLight ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gradient-to-r from-teal-400 to-cyan-500'
            }`}
            style={{
              textShadow: "0 0 20px rgba(45, 212, 191, 0.5)"
            }}
          >
            Λcts
          </motion.span>
        )}
        {currentWord === 2 && (
          <motion.span
            key="works"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`absolute font-light tracking-tighter text-transparent bg-clip-text ${
              isLight ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-400 to-pink-500'
            }`}
            style={{
              textShadow: "0 0 20px rgba(147, 51, 234, 0.5)"
            }}
          >
            Works
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HeroSection() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }

  const isLight = theme === "light";

  return (
    <section className={`relative min-h-screen flex items-start pt-5 overflow-hidden ${
      isLight ? 'bg-white' : 'bg-gradient-to-b from-[#0F172A] via-slate-900 to-[#0F172A]'
    }`}>
      {/* Border frame */}
      <div className={`absolute inset-1 sm:inset-2 lg:inset-x-10 lg:inset-y-0 border rounded-t-3xl ${
        isLight ? 'border-gray-200/60 shadow-inner' : 'border-white/10'
      }`} />
      {/* Background pattern - more subtle */}
      <div className={`absolute inset-0 ${
        isLight ? 'opacity-[0.02]' : 'opacity-[0.05]'
      }`}>
        <div className={`h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]`} />
      </div>
      
      {/* Light mode glass effect overlay */}
      {isLight && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-50/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-50/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-50/20 to-purple-50/20 rounded-full blur-3xl" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background/20" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <Badge className={`backdrop-blur-md px-6 py-2 text-sm font-bold tracking-wider ${
              isLight 
                ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border-amber-400 shadow-lg' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Sparkles className="h-4 w-4 mr-2" />
              ΛUTONOMOUS MΛRKETING INTELLIGENCE PLΛTFORM
            </Badge>
          </motion.div>

          {/* Main headline with glowing effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter"
          >
            <span className="font-light">Marketing That</span>
            
            {/* Animated word card inline */}
            <div className="relative inline-flex">
              {!isLight && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-teal-500/20 blur-xl" />
              )}
              <div className={`relative backdrop-blur-md rounded-xl px-6 py-2 border ${
                isLight 
                  ? 'bg-white border-gray-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]' 
                  : 'bg-black/20 border-white/10'
              }`}>
                <AnimatedWord isLight={isLight} />
              </div>
            </div>
          </motion.div>

          {/* Subheading - plain text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-lg md:text-xl mb-8 ${
              isLight ? 'text-gray-600' : 'text-muted-foreground'
            }`}
          >
            Real-time intelligence that sees, thinks, and acts autonomously
          </motion.div>


          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div className={`absolute inset-0 rounded-xl blur-lg transition-opacity ${
                isLight 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 opacity-40 group-hover:opacity-60' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 opacity-50 group-hover:opacity-75'
              }`} />
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-5 text-base font-semibold border-0 shadow-2xl transition-all duration-300 hover:shadow-amber-500/25"
                asChild
              >
                <Link href="/register" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Experience Autonomous Marketing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className={`backdrop-blur-md border-2 px-6 py-5 text-base font-semibold transition-all duration-300 ${
                  isLight 
                    ? 'bg-gradient-to-br from-white/60 to-white/40 border-gray-300/50 hover:from-white/80 hover:to-white/60 text-gray-800 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/50' 
                    : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:from-white/20 hover:to-white/10 text-white/90 hover:text-white hover:border-white/30'
                }`}
                asChild
              >
                <Link href="#demo" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Watch AI in Action
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Real Dashboard Preview - See MarketSage in Action */}
          <DashboardPreview />

        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
