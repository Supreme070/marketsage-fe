import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme?: string;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: undefined,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  // Start with defaultTheme and update after mounting
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage after mounting
  useEffect(() => {
    setMounted(true);
    
    try {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        setTheme(storedTheme);
      }
    } catch (error) {
      // Ignore any localStorage errors
      console.error('Error accessing localStorage', error);
    }
  }, [storageKey]);

  // Update the theme when the state changes (only after mounting)
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const root = document.documentElement;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

      // Remove all previous theme classes
      root.classList.remove('light', 'dark');

      // Apply theme
      let newResolvedTheme: string;
      if (theme === 'system') {
        newResolvedTheme = systemTheme;
      } else {
        newResolvedTheme = theme;
      }
      
      // Update DOM
      root.classList.add(newResolvedTheme);
      root.dataset.theme = newResolvedTheme;
      setResolvedTheme(newResolvedTheme);

      // Save the theme preference to local storage
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Catch any errors that might happen during DOM or localStorage operations
      console.error('Error updating theme', error);
    }
  }, [theme, storageKey, mounted]);

  // Update the theme when system preference changes
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        if (theme === 'system') {
          const root = document.documentElement;
          const systemTheme = mediaQuery.matches ? 'dark' : 'light';
          root.classList.remove('light', 'dark');
          root.classList.add(systemTheme);
          root.dataset.theme = systemTheme;
          setResolvedTheme(systemTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      // Catch any errors that might happen during media query operations
      console.error('Error setting up media query listener', error);
      return () => {};
    }
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}; 