// components/Heropanels/Heropanels.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import { ChevronLeft, ChevronRight } from "lucide-react"; // 🟢 Icons import kiye
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

  // Detect mobile screen properly (specifically < 640px)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Percentages:
  const base = isMobile ? 3 : 5;    // Mobile par 3%, Desktop par 5%
  const large = isMobile ? 94 : 88; 

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

  // Clamped centering math
  const totalWidthPct = (TRACKS.length - 1) * base + large;
  const maxShiftPct = Math.max(totalWidthPct - 100, 0);

  const prevWidthsPct = active * base;
  const activeCenterPct = prevWidthsPct + large / 2;
  const idealShiftPct = activeCenterPct - 50;
  const shiftPct = Math.min(Math.max(idealShiftPct, 0), maxShiftPct);

  // 🟢 Arrow Navigation Functions
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(true); // Click karne par autoplay pause ho jayega
    setActive((prev) => (prev === 0 ? TRACKS.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(true);
    setActive((prev) => (prev === TRACKS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      className={`relative overflow-hidden ${styles.hero} ${fraunces.variable} ${manrope.variable} ${plexMono.variable} ${className ?? ""}`}
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
                onTouchStart={() => {
                  setPaused(true);
                  setActive(i);
                }}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setPaused(true);
                    setActive(i);
                  }
                }}
                onMouseLeave={() => setPaused(false)}
                onBlur={() => setPaused(false)}
              >
                <Image
                  src={track.src}
                  alt={track.alt}
                  fill
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 40vw"
                  className={styles.image}
                  priority={i === 0}
                />
                <span className={styles.index}>{track.index}</span>
                <div
                  className={`${styles.caption} ${isActive ? styles.captionVisible : ""}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 🟢 Left Arrow Button */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 999999,
          background: 'rgba(0, 0, 0, 0.4)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Previous Slide"
      >
        <ChevronLeft size={28} />
      </button>

      {/* 🟢 Right Arrow Button */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 999999,
          background: 'rgba(0, 0, 0, 0.4)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
        aria-label="Next Slide"
      >
        <ChevronRight size={28} />
      </button>

    </section>
  );
}