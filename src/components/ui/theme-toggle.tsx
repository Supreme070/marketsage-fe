"use client";

import * as React from "react";
import { Moon, Sun, Computer } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Function to cycle through themes: light → dark → system → light...
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Show the tooltip text based on current theme
  const getTooltipText = () => {
    if (!mounted) return "Toggle theme";
    
    if (theme === 'light') return "Light mode";
    if (theme === 'dark') return "Dark mode";
    if (theme === 'system') return "System mode";
    
    return "Toggle theme";
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-gray-400 hover:text-foreground"
      >
        <div className="relative h-[1.2rem] w-[1.2rem]">
          <Sun className="absolute h-[1.2rem] w-[1.2rem]" />
        </div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 text-gray-400 hover:text-foreground relative"
      title={getTooltipText()}
    >
      <div className="relative h-[1.2rem] w-[1.2rem]">
        {/* Sun icon - visible when theme is light */}
        <Sun 
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            theme === 'light'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 rotate-90 opacity-0'
          }`} 
        />
        
        {/* Moon icon - visible when theme is dark */}
        <Moon 
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            theme === 'dark' 
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          }`} 
        />
        
        {/* Computer icon - visible when theme is system */}
        <Computer 
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            theme === 'system'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 rotate-45 opacity-0'
          }`} 
        />
      </div>
      <span className="sr-only">{getTooltipText()}</span>
    </Button>
  );
}
