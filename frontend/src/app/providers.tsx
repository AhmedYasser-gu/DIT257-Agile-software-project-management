"use client";
import { ThemeProvider } from "next-themes";
export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"     // or "system" if you prefer
      enableSystem={false}     // set true if you want system
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
