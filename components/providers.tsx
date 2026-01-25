"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import React from "react";
import { BillingInitializer } from "./billing-initializer";

interface ProvidersProps {
  children: React.ReactNode;
  session?: any; // optional session from server
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <SessionProvider session={session}>
        {children}
        <BillingInitializer />
      </SessionProvider>
    </ThemeProvider>
  );
}
