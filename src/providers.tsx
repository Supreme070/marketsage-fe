"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/context/notification-context";

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
        <NotificationProvider>
          <Toaster position="top-right" closeButton richColors />
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
