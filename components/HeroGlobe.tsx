"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Globe2 } from "lucide-react";

const GlobeCanvas = dynamic(() => import("@/components/GlobeCanvas"), { ssr: false });

export default function HeroGlobe() {
  const shell = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = shell.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "120px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="orb" ref={shell}>
      {visible ? <GlobeCanvas /> : <Globe2 className="globe-fallback" strokeWidth={0.6} aria-hidden="true" />}
    </div>
  );
}
