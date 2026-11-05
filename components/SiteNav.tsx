"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

const links = [
  { href: "/", label: "Observatory" },
  { href: "/history", label: "History" },
  { href: "/compare", label: "Compare" },
  { href: "/rankings", label: "Rankings" },
  { href: "/methodology", label: "Methodology" },
];

export default function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation">
      {links.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          {label}{href === "/methodology" && <ArrowUpRight size={12} />}
        </Link>
      ))}
    </nav>
  );
}
