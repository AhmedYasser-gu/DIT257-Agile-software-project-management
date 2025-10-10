import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import NavBar from "@/components/NavBar/NavBar";
import { ToastProvider } from "@/components/Toast/ToastContext";
import "ol/ol.css"; 
import AppThemeProvider from "./providers";
import LanguageProvider from "@/components/LanguageProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


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


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}
            bg-background text-text dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <AppThemeProvider>
          <LanguageProvider>
            {/* Sticky-footer wrapper */}
            <div className="min-h-dvh flex flex-col">
              <ConvexClientProvider>
                <ToastProvider>
                  <NavBar />

                  {/* Main grows to fill remaining height between header & footer */}
                  <main
                    id="main"
                    role="main"
                    className="container flex-1 py-6 px-4 sm:px-6"
                  >
                    {children}
                  </main>

                  {/* Footer */}
                  <footer
                    role="contentinfo"
                    className=" border-t border-border py-6 text-xs text-subtext bg-card/50
                              px-4 sm:px-6"
                  >
                    <div className="container">
                      © {new Date().getFullYear()} No Leftovers · SDG #2 Zero
                      Hunger
                    </div>
                  </footer>

                  {/* modal root for confirmations */}
                  <div id="modal-root" />
                </ToastProvider>
              </ConvexClientProvider>
            </div>
          </LanguageProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}