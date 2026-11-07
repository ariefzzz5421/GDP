"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/", label: "Observatory", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/rankings", label: "Rankings", icon: BarChart3 },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const mobileQuery = window.matchMedia("(max-width: 600px)");
    const onResize = () => {
      if (!mobileQuery.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    mobileQuery.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mobileQuery.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <>
      <nav className="site-nav-desktop" aria-label="Main navigation">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
            {label}{href === "/methodology" && <ArrowUpRight size={12} />}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label={open ? "Close page navigation" : "Open page navigation"}
        aria-controls="mobile-route-drawer"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="mobile-nav-overlay">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close page navigation"
            onClick={() => setOpen(false)}
          />
          <nav id="mobile-route-drawer" className="mobile-route-drawer" aria-label="Mobile page navigation">
            <div className="mobile-nav-heading">
              <strong>EXPLORE GDP</strong>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="mobile-nav-links">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{label}</span>
                  {pathname === href && <span className="mobile-nav-active">CURRENT</span>}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
