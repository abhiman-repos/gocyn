"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Ad } from "../../app/types/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const API                = process.env.APP_URL;
const DEFAULT_AUTO_CLOSE = 8;       // seconds — fallback when admin sets 0
const FETCH_INTERVAL     = 60_000;  // re-fetch active ads every 60 s
const SESSION_KEY        = "ads_dismissed_ids"; // sessionStorage key

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Read the dismissed-ID set from sessionStorage (safe for SSR). */
function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Persist the dismissed-ID set to sessionStorage. */
function writeDismissed(ids: Set<string>): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...ids]));
  } catch {
    // sessionStorage full or blocked — fail silently
  }
}

/** Convert admin width/height strings to safe CSS values. */
function resolveContainerDims(width?: string, height?: string) {
  const w = width?.trim();
  const h = height?.trim();
  const cssWidth  = w && w !== "auto" ? `min(${w}, 95vw)` : "min(480px, 95vw)";
  const cssHeight = h && h !== "auto" ? h : "360px";
  return { cssWidth, cssHeight };
}

/** Derive button style from admin settings. */
function resolveButtonStyle(ad: Ad): React.CSSProperties {
  const sizeMap = {
    small:  { fontSize: "13px", padding: "8px 20px"  },
    large:  { fontSize: "17px", padding: "14px 36px" },
    medium: { fontSize: "15px", padding: "11px 28px" },
  };
  const { fontSize, padding } = sizeMap[ad.buttonSize as keyof typeof sizeMap] ?? sizeMap.medium;
  return {
    background:   ad.buttonBg    || "#0f172a",
    color:        ad.buttonColor || "#ffffff",
    borderRadius: ad.buttonBorderRadius || "8px",
    fontSize,
    padding,
    fontWeight:   600,
    display:      "inline-block",
    textDecoration: "none",
    lineHeight:   1.2,
    cursor:       "pointer",
    boxShadow:    "0 4px 24px rgba(0,0,0,0.35)",
    transition:   "transform 0.15s ease, box-shadow 0.15s ease",
  };
}

// ─── Allowed paths ─────────────────────────────────────────────────────────────
const ALLOWED_PATHS   = ["/", "/home", "/courses", "/explore"];
const BLOCKED_SEGMENTS = ["/instructors", "/admin", "/dashboard"];

function useIsAllowedPath(): boolean {
  const pathname = usePathname();
  if (!pathname) return false;
  const blocked = BLOCKED_SEGMENTS.some(seg => pathname.includes(seg));
  if (blocked) return false;
  return ALLOWED_PATHS.includes(pathname) || pathname.startsWith("/user");
}

// ─── Circular progress ring (SVG) ────────────────────────────────────────────
interface TimerRingProps {
  seconds:    number;
  totalSeconds: number;
}
function TimerRing({ seconds, totalSeconds }: TimerRingProps) {
  const r = 10;
  const circ = 2 * Math.PI * r;
  const progress = totalSeconds > 0 ? seconds / totalSeconds : 1;
  const dash = circ * progress;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
      <circle
        cx="14" cy="14" r={r}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.2s linear" }}
      />
      <text
        x="14" y="14"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 9,
          fontWeight: 700,
          fill: "#ffffff",
          transform: "rotate(90deg)",
          transformOrigin: "14px 14px",
          fontFamily: "inherit",
        }}
      >
        {seconds}
      </text>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdModal() {
  const isAllowed = useIsAllowedPath();

  // All active ads from server
  const [ads, setAds] = useState<Ad[]>([]);
  // IDs closed/expired this session — persisted to sessionStorage
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(readDismissed);

  // UI state
  const [isOpen,        setIsOpen]        = useState(false);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [isVisible,     setIsVisible]     = useState(false); // for CSS fade-in

  // Track the ad that is currently being timed so the countdown
  // effect restarts cleanly when the ad changes.
  const currentAdIdRef = useRef<string | null>(null);
  const trackedViewIds = useRef(new Set<string>());

  // ── Derived: ads not yet dismissed ─────────────────────────────────────────
  const pendingAds = ads.filter(ad => !dismissedIds.has(ad._id ?? ad._id));
  const currentAd  = pendingAds[currentIndex] ?? null;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  /** Mark an ad as dismissed (persisted for this session). */
  const dismissAd = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      writeDismissed(next);
      return next;
    });
  }, []);

  /**
   * Close the current ad.
   * If there are more pending ads → advance to the next one.
   * If this was the last one → close the modal for the session.
   */
const advanceOrClose = useCallback((adId: string) => {
  dismissAd(adId);
  // Reset to first ad so we never point outside the pending list
  setCurrentIndex(0);
}, [dismissAd]);

  // ── Fetch ads ───────────────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/ads/active/?placement=modal`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Ad[] = await res.json();
      setAds(data);
    } catch (err) {
      console.error("[AdModal] fetch error:", err);
    }
  }, []);

  const trackAdEvent = useCallback((adId: string, kind: "view" | "click") => {
    void fetch(`${API}/api/admin/ads/${adId}/events/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }), keepalive: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAllowed) return;
    fetchAds();
    const id = setInterval(fetchAds, FETCH_INTERVAL);
    return () => clearInterval(id);
  }, [isAllowed, fetchAds]);

  // ── Open when pending ads arrive ────────────────────────────────────────────
  useEffect(() => {
    if (!isAllowed || pendingAds.length === 0 || isOpen) return;
    const t = setTimeout(() => {
      setCurrentIndex(0);
      setIsOpen(true);
      setTimeout(() => setIsVisible(true), 30); // trigger CSS transition
    }, 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllowed, pendingAds.length]);

  // ── Countdown ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !currentAd) return;
    const adId         = currentAd._id ?? currentAd._id;
    const totalSeconds = currentAd.autoCloseSeconds || DEFAULT_AUTO_CLOSE;

    // Reset timer display immediately when ad changes
    setTimeLeft(totalSeconds);
    currentAdIdRef.current = adId;

    const startedAt = Date.now();
    const totalMs   = totalSeconds * 1000;

    const tick = () => {
      // Guard: if the displayed ad changed, stop this interval
      if (currentAdIdRef.current !== adId) return;
      const elapsed   = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        advanceOrClose(adId);
      }
    };

    tick();
    const intervalId = setInterval(tick, 200);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentAd?._id ?? currentAd?._id]);

  useEffect(() => {
    if (!isOpen || !currentAd) return;
    const id = currentAd._id;
    if (!trackedViewIds.current.has(id)) {
      trackedViewIds.current.add(id);
      trackAdEvent(id, "view");
    }
  }, [isOpen, currentAd?._id, trackAdEvent]);

  // ── Body scroll lock ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Keyboard: Esc closes current ad ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && currentAd) {
        advanceOrClose(currentAd._id ?? currentAd._id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, currentAd, advanceOrClose]);

  // ── Close modal when there are no more pending ads ───────────────────────────
useEffect(() => {
  if (isOpen && pendingAds.length === 0) {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsOpen(false), 300);
    return () => clearTimeout(timeout);
  }
}, [isOpen, pendingAds.length]);

  // ── Early exit ──────────────────────────────────────────────────────────────
  if (!isOpen || !currentAd) return null;

  const adId = currentAd._id ?? currentAd._id;
  const totalSeconds = currentAd.autoCloseSeconds || DEFAULT_AUTO_CLOSE;
  const { cssWidth, cssHeight } = resolveContainerDims(currentAd.width, currentAd.height);
  const btnStyle = resolveButtonStyle(currentAd);
  const btnPaddingBottom = currentAd.buttonSize === "large" ? "24px" : "16px";

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => advanceOrClose(adId)}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          999,
          background:      "rgba(0,0,0,0.55)",
          backdropFilter:  "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity:         isVisible ? 1 : 0,
          transition:      "opacity 0.3s ease",
        }}
      />

      {/* ── Ad card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={currentAd.buttonText ? `Advertisement: ${currentAd.buttonText}` : "Advertisement"}
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          1000,
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          padding:         "1rem",
          pointerEvents:   "none",
        }}
      >
        <div
          style={{
            position:      "relative",
            width:         cssWidth,
            height:        cssHeight,
            maxHeight:     "90vh",
            overflow:      "hidden",
            borderRadius:  "16px",
            boxShadow:     "0 32px 80px rgba(0, 0, 0, 0)",
            pointerEvents: "auto",
            opacity:       isVisible ? 1 : 0,
            transform:     isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(16px)",
            transition:    "opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* ── Timer badge — top left ── */}
          <div
            style={{
              position:       "absolute",
              top:            12,
              left:           12,
              zIndex:         20,
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              padding:        "4px 10px 4px 6px",
              borderRadius:   "99px",
              background:     "rgba(0,0,0,0.52)",
              backdropFilter: "blur(6px)",
              color:          "#fff",
              fontSize:       12,
              fontWeight:     600,
              letterSpacing:  "0.02em",
              userSelect:     "none",
            }}
          >
            <TimerRing seconds={timeLeft} totalSeconds={totalSeconds} />
          </div>

          {/* ── Close button — top right ── */}
          <button
            onClick={() => advanceOrClose(adId)}
            aria-label={pendingAds.length > 1 ? "Close and show next ad" : "Close advertisement"}
            style={{
              position:       "absolute",
              top:            12,
              right:          12,
              zIndex:         20,
              width:          32,
              height:         32,
              borderRadius:   "50%",
              border:         "none",
              background:     "rgba(255,255,255,0.88)",
              color:          "#374151",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       16,
              fontWeight:     700,
              lineHeight:     1,
              boxShadow:      "0 2px 8px rgba(0,0,0,0.2)",
              transition:     "background 0.15s, color 0.15s, transform 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
              (e.currentTarget as HTMLButtonElement).style.color = "#111827";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.88)";
              (e.currentTarget as HTMLButtonElement).style.color = "#374151";
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            ✕
          </button>

          {/* ── Clickable image ── */}
          <a
            href={currentAd.buttonLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={currentAd.buttonText || "View advertisement"}
            style={{ display: "block", width: "100%", height: "100%", position: "relative" }}
            onClick={e => { if (!currentAd.buttonLink) e.preventDefault(); else trackAdEvent(adId, "click"); }}
          >
            <Image
              src={currentAd.image}
              alt={currentAd.buttonText ? `Ad: ${currentAd.buttonText}` : "Advertisement"}
              fill
              sizes="(max-width: 640px) 95vw, 800px"
              className="object-cover"
              priority
              unoptimized
            />
            {/* Hover tint when image is clickable */}
            {currentAd.buttonLink && (
              <div
                style={{
                  position:   "absolute",
                  inset:      0,
                  background: "rgba(0,0,0,0)",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
              />
            )}
          </a>

          {/* ── CTA button — bottom center ── */}
          {currentAd.buttonText && (
            <div
              style={{
                position:       "absolute",
                bottom:         0,
                left:           0,
                right:          0,
                zIndex:         20,
                display:        "flex",
                justifyContent: "center",
                paddingBottom:  btnPaddingBottom,
                // Subtle gradient so button is always legible on any image
                background:     "linear-gradient(to top, rgba(255, 255, 255, 0) 0%, transparent 100%)",
                paddingTop:     "32px",
              }}
            >
              <a
                href={currentAd.buttonLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={btnStyle}
                onClick={e => { if (!currentAd.buttonLink) e.preventDefault(); else trackAdEvent(adId, "click"); }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.05)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(255, 255, 255, 0)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 24px rgba(253, 253, 253, 0.01)";
                }}
              >
                {currentAd.buttonText}
              </a>
            </div>
          )}

          {/* ── Pagination dots — bottom center (above CTA) ── */}
          {pendingAds.length > 1 && (
            <div
              style={{
                position:       "absolute",
                bottom:         currentAd.buttonText ? (currentAd.buttonSize === "large" ? 72 : 60) : 12,
                left:           0,
                right:          0,
                zIndex:         25,
                display:        "flex",
                justifyContent: "center",
                gap:            6,
              }}
            >
              {pendingAds.map((ad, idx) => (
                <button
                  key={ad._id ?? ad._id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`View ad ${idx + 1} of ${pendingAds.length}`}
                  style={{
                    width:        idx === currentIndex ? 18 : 6,
                    height:       6,
                    borderRadius: 99,
                    border:       "none",
                    padding:      0,
                    cursor:       "pointer",
                    background:   idx === currentIndex ? "#fefefe00" : "rgba(255, 255, 255, 0)",
                    transition:   "width 0.25s ease, background 0.25s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
