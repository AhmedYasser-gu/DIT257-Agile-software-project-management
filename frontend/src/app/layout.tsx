import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import NavBar from "@/components/NavBar/NavBar";
import { ToastProvider } from "@/components/Toast/ToastContext";
import RealtimeToasts from "@/components/Toast/RealtimeToasts";
import "ol/ol.css";
import AppThemeProvider from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "No Leftovers",
  description: "Real-time food sharing for impact (SDG #2)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F5F5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}
          bg-background text-text dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <AppThemeProvider>
          <div className="min-h-dvh flex flex-col">
            <ConvexClientProvider>
              <ToastProvider>
                <RealtimeToasts />
                <NavBar />

                <main id="main" role="main" className="container flex-1 py-6 px-4 sm:px-6">
                  {children}
                </main>

                <footer
                  role="contentinfo"
                  className="border-t border-border py-6 text-xs text-subtext bg-card/50 px-4 sm:px-6"
                >
                  <div className="container">
                    © {new Date().getFullYear()} No Leftovers · SDG #2 Zero Hunger
                  </div>
                </footer>

                <div id="modal-root" />
              </ToastProvider>
            </ConvexClientProvider>
          </div>
        </AppThemeProvider>
      </body>
    </html>
  );
}
