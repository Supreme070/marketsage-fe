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
    if (theme === 'system') {
      return `System mode (${resolvedTheme === 'dark' ? 'dark' : 'light'})`;
    }
    
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

  // Render a single icon based on the theme
  let icon;
  if (theme === 'light') {
    icon = <Sun className="h-[1.2rem] w-[1.2rem]" />;
  } else if (theme === 'dark') {
    icon = <Moon className="h-[1.2rem] w-[1.2rem]" />;
  } else if (theme === 'system') {
    if (resolvedTheme === 'dark') {
      // System theme in dark mode
      icon = (
        <div className="relative">
          <Moon className="h-[1.2rem] w-[1.2rem]" />
          <Computer className="absolute h-[0.6rem] w-[0.6rem] right-[-3px] bottom-[-3px] text-primary-500" />
        </div>
      );
    } else {
      // System theme in light mode
      icon = (
        <div className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem]" />
          <Computer className="absolute h-[0.6rem] w-[0.6rem] right-[-3px] bottom-[-3px] text-primary-500" />
        </div>
      );
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-9 w-9 text-gray-400 hover:text-foreground relative"
      title={getTooltipText()}
    >
      {icon}
      <span className="sr-only">{getTooltipText()}</span>
    </Button>
  );
}
