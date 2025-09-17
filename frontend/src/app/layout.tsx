import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavLink from "@/components/NavLink/NavLink";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "No Leftovers",
  description: "Real-time food sharing for impact (SDG #2)",
};

function Nav() {
  const links: { href: string; label: string; exact?: boolean }[] = [
    { href: "/", label: "Home", exact: true },
    { href: "/explore", label: "Explore" },
    { href: "/donate", label: "Post Donation" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/login", label: "Login" },
  ];

  return (
    <header className="border-b border-border bg-card">
      <nav className="container flex h-14 items-center gap-4">
        <NavLink href="/" exact className="font-semibold hover:no-underline">
          No Leftovers
        </NavLink>
        <div className="ml-auto flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning avoids errors from extensions that inject attributes */}
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-text`}
      >
        <ConvexClientProvider>
          <Nav />
          <main className="container py-6">{children}</main>
          <footer className="container border-t border-border py-6 text-xs text-subtext">
            © {new Date().getFullYear()} No Leftovers · SDG #2 Zero Hunger
          </footer>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
