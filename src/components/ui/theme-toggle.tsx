"use client";

import * as React from "react";
import { Moon, Sun, Computer } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
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

  // Determine which icon to show
  const getIcon = () => {
    if (!mounted) return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    
    if (theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')) {
      return <Moon className="h-[1.2rem] w-[1.2rem]" />;
    } else if (theme === 'light' || (theme === 'system' && resolvedTheme === 'light')) {
      return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    } else if (theme === 'system') {
      return <Computer className="h-[1.2rem] w-[1.2rem]" />;
    }
    
    // Fallback
    return <Sun className="h-[1.2rem] w-[1.2rem]" />;
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
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 text-gray-400 hover:text-foreground"
      title={getTooltipText()}
    >
      {getIcon()}
      <span className="sr-only">{getTooltipText()}</span>
    </Button>
  );
}
