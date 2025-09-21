import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import NavBar from "@/components/NavBar/NavBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "No Leftovers",
  description: "Real-time food sharing for impact (SDG #2)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning avoids errors from extensions that inject attributes */}
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-text`}
      >
        <ConvexClientProvider>
          <NavBar />
          <main className="container py-6">{children}</main>
          <footer className="container border-t border-border py-6 text-xs text-subtext">
            © {new Date().getFullYear()} No Leftovers · SDG #2 Zero Hunger
          </footer>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
