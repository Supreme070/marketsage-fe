"use client";

import { Moon, Sun, Monitor } from 'lucide-react';
import { useAdminTheme } from './AdminThemeProvider';

export function AdminThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <button
      onClick={toggleTheme}
      className="admin-btn flex items-center gap-2 text-xs px-3 py-2 admin-glow-hover"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-3 w-3" />
          LIGHT_MODE
        </>
      ) : (
        <>
          <Moon className="h-3 w-3" />
          DARK_MODE
        </>
      )}
    </button>
  );
}