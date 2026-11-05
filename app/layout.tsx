import { Inter, Oswald } from "next/font/google";
import Link from "next/link";
import { Globe2, ArrowUpRight } from "lucide-react";
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
    <html lang="en">
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
            <nav aria-label="Main navigation">
              <Link href="/">Observatory</Link>
              <Link href="/history">History</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/rankings">Rankings</Link>
              <Link href="/methodology">
                Methodology <ArrowUpRight size={12} />
              </Link>
            </nav>
            <span className="nav-note">
              <i /> OPEN DATA. OPEN PERSPECTIVES.
            </span>
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
