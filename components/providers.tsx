"use client";

import { SessionProvider } from "next-auth/react";
import ThemeProvider from "./ThemeProvider";
import React from "react";

interface ProvidersProps {
  children: React.ReactNode;
  session?: any; // optional session from server
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
