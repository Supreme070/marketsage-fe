"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<string>("dark");
  const [mounted, setMounted] = useState(false);
  
  // Component mount handling
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle scroll event to add/remove the glass effect
  useEffect(() => {
    if (!mounted) return; // Skip scroll handling until mounted
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial scroll position check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]); // Add mounted as a dependency

  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme || "dark");
    }
  }, [theme, mounted]);

  const isLight = currentTheme === "light";

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#solutions", hasDropdown: true },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Resources", href: "#resources", hasDropdown: true },
  ];

  // Solution options with href links to specific feature sections
  const solutionOptions = [
    { name: "Workflow Automation", href: "/solutions/workflow-automation", description: "Build sophisticated marketing journeys" },
    { name: "Omnichannel Messaging", href: "/solutions/omnichannel-messaging", description: "Email, SMS & WhatsApp campaigns" },
    { name: "Audience Segmentation", href: "/solutions/audience-segmentation", description: "Target the right customers" },
    { name: "Analytics & Reporting", href: "/solutions/analytics-reporting", description: "Track campaign performance" }
  ];

  // Resource options
  const resourceOptions = [
    { name: "Marketing Blog", href: "/resources/blog", description: "Tips & best practices" },
    { name: "Case Studies", href: "/resources/case-studies", description: "Customer success stories" },
    { name: "Documentation", href: "/resources/documentation", description: "Guides & tutorials" }
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? isLight 
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-200/70 shadow-md shadow-gray-100/80' 
          : 'glass-nav' 
        : 'bg-transparent'
    }`}>
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold brand-text-new">
              <span className="market">Market</span><span className="sage">Sage</span>
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, index) => (
            <div key={index} className="relative group">
              <Link 
                href={link.href} 
                className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                  isLight 
                    ? scrolled 
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-gray-700 hover:text-gray-900' 
                    : scrolled 
                      ? 'text-foreground/80 hover:text-foreground'
                      : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
                {link.hasDropdown && <ChevronDown className="h-4 w-4 opacity-70 group-hover:rotate-180 transition-transform duration-200" />}
              </Link>
              
              {link.hasDropdown && (
                <div className={`absolute top-full left-0 mt-1 w-64 p-2 hidden group-hover:block rounded-lg shadow-elevation ${
                  isLight 
                    ? 'bg-white border border-gray-200 shadow-lg shadow-gray-100/80' 
                    : 'bg-card border border-border'
                }`}>
                  {link.name === "Solutions" ? (
                    solutionOptions.map((option, idx) => (
                      <Link key={idx} href={option.href}>
                        <div className={`py-2 px-3 rounded-md transition-colors cursor-pointer ${
                          isLight 
                            ? 'hover:bg-gray-100' 
                            : 'hover:bg-muted'
                        }`}>
                          <div className="text-sm font-medium">{option.name}</div>
                          <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            {option.description}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    resourceOptions.map((option, idx) => (
                      <Link key={idx} href={option.href}>
                        <div className={`py-2 px-3 rounded-md transition-colors cursor-pointer ${
                          isLight 
                            ? 'hover:bg-gray-100' 
                            : 'hover:bg-muted'
                        }`}>
                          <div className="text-sm font-medium">{option.name}</div>
                          <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            {option.description}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
          
          <div className={`h-6 w-px ${
            isLight 
              ? 'bg-gray-300' 
              : 'bg-border/60'
          } mx-1`} />
          
          <ThemeToggle />
          
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium">
              Log in
            </Button>
          </Link>
          
          <Link href="/register">
            <Button variant="cta" size="sm" className="font-medium">
              Start Free Trial
            </Button>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            className={`p-2 rounded-lg transition-colors ${
              isLight 
                ? 'hover:bg-gray-100' 
                : 'hover:bg-muted'
            }`}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isLight 
              ? 'bg-white border-t border-gray-200' 
              : 'bg-background/95 backdrop-blur border-t border-border/40'
          }`}
        >
          <div 
            className="flex flex-col gap-1 p-4"
          >
            {navLinks.map((link, index) => (
              <div key={index} className="py-2">
                <Link
                  href={link.href}
                  className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                    isLight 
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => !link.hasDropdown && setIsMenuOpen(false)}
                >
                  <span className="font-medium">{link.name}</span>
                  {link.hasDropdown && <ChevronDown className="h-4 w-4" />}
                </Link>
                
                {link.hasDropdown && (
                  <div className={`mt-1 ml-4 pl-4 space-y-1 ${
                    isLight 
                      ? 'border-l border-gray-200' 
                      : 'border-l border-border/60'
                  }`}>
                    {link.name === "Solutions" ? (
                      solutionOptions.map((option, idx) => (
                        <Link key={idx} href={option.href}>
                          <div className={`py-2 px-3 text-sm rounded-lg transition-colors ${
                            isLight 
                              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                              : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                          }`}>
                            <div>{option.name}</div>
                            <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              {option.description}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      resourceOptions.map((option, idx) => (
                        <Link key={idx} href={option.href}>
                          <div className={`py-2 px-3 text-sm rounded-lg transition-colors ${
                            isLight 
                              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
                              : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                          }`}>
                            <div>{option.name}</div>
                            <div className={`text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              {option.description}
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div className={`h-px w-full my-2 ${
              isLight 
                ? 'bg-gray-200' 
                : 'bg-border/40'
            }`} />
            
            <div className="flex gap-4 pt-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button variant="cta" className="w-full font-medium">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .brand-text-new .market {
          color: #2DD4BF; /* Exact teal color requested */
          text-shadow: 0 0 8px rgba(45, 212, 191, 0.3);
          font-weight: 700;
        }
        .brand-text-new .sage {
          color: #FBBF24; /* Exact amber color requested */
          text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
          font-weight: 700;
        }
        
        /* Enhanced light mode styles */
        @media (prefers-color-scheme: light) {
          .brand-text-new .market {
            color: #23C5B2; /* Slightly more saturated teal */
            text-shadow: 0 0 10px rgba(35, 197, 178, 0.4);
          }
          .brand-text-new .sage {
            color: #F5BA16; /* Slightly more saturated amber */
            text-shadow: 0 0 10px rgba(245, 186, 22, 0.4);
          }
        }
        
        /* Better glass effect for light mode */
        .light .glass-nav {
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </header>
  );
} 