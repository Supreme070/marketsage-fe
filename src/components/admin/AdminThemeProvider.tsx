"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type AdminTheme = 'dark' | 'light';

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (context === undefined) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  const [theme, setThemeState] = useState<AdminTheme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage after component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme') as AdminTheme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme classes to document body
  useEffect(() => {
    if (!mounted) return;

    const body = document.body;
    
    // Remove existing admin theme classes
    body.classList.remove('admin-theme', 'admin-light');
    
    // Add base admin theme class
    body.classList.add('admin-theme');
    
    // Add light theme class if needed
    if (theme === 'light') {
      body.classList.add('admin-light');
    }

    // Also apply to admin-portal div if it exists
    const adminPortal = document.querySelector('.admin-portal');
    if (adminPortal) {
      adminPortal.classList.remove('admin-light');
      if (theme === 'light') {
        adminPortal.classList.add('admin-light');
      }
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('admin-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}