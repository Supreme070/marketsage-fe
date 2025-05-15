"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);

  // Handle intersection observer to detect when section is in view
  useEffect(() => {
    setIsLoaded(true);
    setMounted(true);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  return (
    <section 
      ref={sectionRef} 
      className={`py-24 relative overflow-hidden ${
        isLight 
          ? 'bg-gradient-to-br from-primary-50 to-primary-100' 
          : 'bg-gradient-to-br from-primary-600 to-primary-800'
      }`}
    >
      {/* Background decorative elements */}
      <div className={`absolute inset-0 bg-hero-pattern ${isLight ? 'opacity-30' : 'opacity-10'}`}></div>
      <div className={`absolute top-0 left-1/4 w-64 h-64 rounded-full ${isLight ? 'bg-primary/20' : 'bg-white'} blur-3xl ${isLight ? 'opacity-50' : 'opacity-10'}`}></div>
      <div className={`absolute bottom-0 right-1/4 w-80 h-80 rounded-full ${isLight ? 'bg-accent/20' : 'bg-accent'} blur-3xl ${isLight ? 'opacity-50' : 'opacity-10'}`}></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
            {/* Text content */}
            <div 
              className={`w-full lg:w-1/2 text-center lg:text-left transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-heading ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Grow Your Nigerian Business with MarketSage
              </h2>
              <p className={`text-lg mb-8 ${isLight ? 'text-gray-700' : 'text-white/90'}`}>
                Join hundreds of Nigerian businesses that have transformed their marketing results with our platform. Get started today with a 30-day free trial - no credit card required.
              </p>
              
              <ul className="mb-8 space-y-3">
                {[
                  "All channels: Email, SMS & WhatsApp",
                  "Local support team based in Lagos",
                  "Nigerian payment options available",
                  "Data centers for optimal performance"
                ].map((feature, index) => (
                  <li key={index} className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white'}`}>
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLight ? 'bg-primary/10' : 'bg-white/20'
                    }`}>
                      <Check className={`h-3.5 w-3.5 ${isLight ? 'text-primary-600' : 'text-white'}`} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" variant="cta" className="font-medium">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button 
                    size="lg" 
                    variant={isLight ? "outline" : "ghost"} 
                    className={isLight ? "" : "text-white border border-white/20 hover:bg-white/10"}
                  >
                    Schedule Demo
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Form */}
            <div 
              className={`w-full lg:w-1/2 transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className={`p-8 rounded-xl ${
                isLight 
                  ? 'bg-white shadow-lg border border-gray-100' 
                  : 'glass-card bg-white/10 backdrop-blur-md'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>Get in Touch</h3>
                <p className={`mb-6 ${isLight ? 'text-gray-700' : 'text-white/90'}`}>
                  Fill out our dedicated demo request form to get a personalized demonstration of MarketSage tailored to your business needs.
                </p>
                
                <div className="space-y-4 mb-6">
                  {[
                    "30-minute personalized demo",
                    "Custom implementation guidance",
                    "Pricing options for your business",
                    "24/7 support from our Lagos-based team"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isLight ? 'bg-primary/10' : 'bg-white/20'
                      }`}>
                        <Check className={`h-3 w-3 ${isLight ? 'text-primary-600' : 'text-white'}`} />
                      </span>
                      <span className={isLight ? 'text-gray-700' : 'text-white/90'}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link href="/demo" className="block w-full">
                  <Button type="button" size="lg" className="w-full bg-accent hover:bg-accent-600 text-accent-foreground font-medium">
                    Request Demo <Mail className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                
                <p className={`text-xs text-center mt-4 ${isLight ? 'text-gray-500' : 'text-white/70'}`}>
                  No credit card required. No commitment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 