import { Inter, Oswald } from "next/font/google";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-oswald",
});
export const metadata = {
  title: "GDP — Global Economic Observatory",
  description:
    "Explore 125+ years of global economic power. An interactive atlas of GDP, prosperity, and change.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const saved=localStorage.getItem('gdp-theme');document.documentElement.dataset.theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch{document.documentElement.dataset.theme='dark'}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${oswald.variable}`}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="nav-shell">
            <Link href="/" className="brand">
              <Globe2 size={27} />
              <strong>
                GDP<span>.</span>
              </strong>
              <span className="brand-caption">
                GLOBAL ECONOMIC
                <br />
                OBSERVATORY
              </span>
            </Link>
            <SiteNav />
            <div className="header-actions">
              <ThemeToggle />
              <span className="nav-note">
                <i /> OPEN DATA. OPEN PERSPECTIVES.
              </span>
            </div>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <Link href="/" className="footer-logo">
            GDP<span>.</span>
          </Link>
          <p>
            A longer view of a changing world.
            <br />
            <small>Independent visualization · Public economic data</small>
          </p>
          <Link href="/methodology">Sources & methodology ↗</Link>
          <a href="https://github.com/ariefzzz5421/GDP">GitHub ↗</a>
        </footer>
      </body>
    </html>
  );
}
