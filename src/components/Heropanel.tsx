// components/Heropanels/Heropanels.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import styles from "./Heropanels.module.css";

// ---------- Fonts ----------
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// ---------- Types ----------
type Track = {
  index: string;

  src: string;
  alt: string;
};

// ---------- Data ----------
const TRACKS: Track[] = [
  {
    index: "01",

    src: "/logo1.png",
    alt: "Designer reviewing wireframes on a large monitor",
  },
  {
    index: "02",

    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000",
    alt: "Data visualisation on a dark dashboard",
  },
  {
    index: "03",

    src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000",
    alt: "Typewriter with a page mid-sentence",
  },
  {
    index: "04",

    src: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000",
    alt: "Analog mixing console in a recording studio",
  },
  {
    index: "05",
    
    src: "/logo1.png",
    alt: "Server racks in a data centre",
  },
];

const INTERVAL_MS = 3400;

// ---------- Component ----------
export default function HeroPanels({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const direction = useRef<1 | -1>(1);

  // Detect mobile to adjust panel sizes
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1080px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Percentages (of container width) for inactive vs active panels
  const base = isMobile ? 18 : 12;
  const large = isMobile ? 46 : 60;

  // Autoplay with bounce
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setActive((prev) => {
        let next = prev + direction.current;
        if (next >= TRACKS.length - 1) {
          direction.current = -1;
          next = TRACKS.length - 1;
        } else if (next <= 0) {
          direction.current = 1;
          next = 0;
        }
        return next;
      });
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [paused]);

  // ---- Clamped centering math (the actual bug) ----
  // Total width of the strip's content, as a % of the container.
  const totalWidthPct = (TRACKS.length - 1) * base + large;
  // How much wider the strip is than its container — this is the only
  // range we're allowed to shift within.
  const maxShiftPct = Math.max(totalWidthPct - 100, 0);

  // Sum of the widths of every panel before the active one.
  const prevWidthsPct = active * base;
  // Where the active panel's center sits inside the strip's own content.
  const activeCenterPct = prevWidthsPct + large / 2;
  // Shift needed to bring that center to the container's center (50%).
  const idealShiftPct = activeCenterPct - 50;
  // Clamp so we never drag the strip past its real edges — this is what
  // keeps panel 0 and the last panel fully visible instead of overshooting
  // into empty space.
  const shiftPct = Math.min(Math.max(idealShiftPct, 0), maxShiftPct);

  return (
    <section
      className={`${styles.hero} ${fraunces.variable} ${manrope.variable} ${plexMono.variable} ${className ?? ""}`}
    >
      <div className={styles.strip} role="tablist" aria-label="Course tracks">
        <div
          className={styles.stripInner}
          style={{ transform: `translateX(-${shiftPct}%)` }}
        >
          {TRACKS.map((track, i) => {
            const isActive = i === active;
            return (
              <button
                key={track.index}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.panel} ${isActive ? styles.panelActive : ""}`}
                style={{
                  width: isActive ? `${large}%` : `${base}%`,
                }}
                onClick={() => {
                  setPaused(true);
                  setActive(i);
                }}
                onMouseEnter={() => {
                  setPaused(true);
                  setActive(i);
                }}
                onFocus={() => {
                  setPaused(true);
                  setActive(i);
                }}
                onMouseLeave={() => setPaused(false)}
                onBlur={() => setPaused(false)}
              >
                <Image
                  src={track.src}
                  alt={track.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className={styles.image}
                  priority={i === 0}
                />
                <span className={styles.index}>{track.index}</span>
                <div
                  className={`${styles.caption} ${isActive ? styles.captionVisible : ""}`}
                >

                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}