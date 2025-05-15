"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
        forcedTheme={undefined}
        storageKey="marketsage-theme"
      >
        <Toaster position="top-right" closeButton richColors />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
