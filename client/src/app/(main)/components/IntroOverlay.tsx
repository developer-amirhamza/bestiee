"use client";
import { useEffect, useRef, useState } from "react";

// Water-drop intro: a single droplet falls, splashes into ripples + a puddle,
// the puddle absorbs away, then the "bestiee." logo settles in — clean and
// dry. Mounts the instant the component renders (no waiting on window
// "load"), so it always covers the site before any content is visible.
//
// Reliability first: if GSAP fails to load (or reduced-motion is set), the
// logo just fades in on plain CSS and the intro still reveals on schedule.
//
// Brand: dark #1a1a18 · water teal #EDE6DC / #4FA99B · sand #c9b89a · coral #C9573F
//
// Shown once per browser, ever — not once per tab/session — so a returning
// visitor never sees it again after their first visit.
const INTRO_SEEN_KEY = "aidble_intro_seen";
const LOGO_AT_MS = 1500;     // when the logo starts fading in (matches splash choreography)
const LOGO_HOLD_MS = 1400;   // how long the logo sits before the curtain lifts
const REVEAL_MS = 650;       // curtain-lift slide-up duration
const GSAP_TIMEOUT_MS = 2500; // give up on GSAP after this → reveal via CSS fallback
const REDUCED_HOLD_MS = 1000;

export default function IntroOverlay() {
  // Defaults to visible so the cover is part of the very first paint (SSR
  // HTML included) — nothing behind it, not even a blank flash, can show
  // before we've had a chance to decide whether to keep it up.
  const [show, setShow] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [gsapOn, setGsapOn] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<any>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = useRef(false);
  // Avoids a stale-closure read of `gsapOn` state inside the bail timeout.
  const gsapOnRef = useRef(false);

  useEffect(() => {
    // Dev: show on every load. Production: once per browser, ever.
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev) {
      let seen = false;
      try {
        seen = localStorage.getItem(INTRO_SEEN_KEY) === "1";
      } catch {
        seen = true;
      }
      if (seen) {
        // Already played on a previous visit — drop the cover immediately,
        // no animation, no re-blocking scroll.
        done.current = true;
        setShow(false);
        return;
      }
    }

    if (!isDev) {
      try {
        localStorage.setItem(INTRO_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Logo fade only, no splash — hold briefly then reveal.
      timers.current.push(setTimeout(() => triggerReveal(), REDUCED_HOLD_MS));
    } else {
      // Bail out to a plain CSS logo fade if GSAP never loads in time.
      const bail = setTimeout(() => {
        if (!gsapOnRef.current) triggerReveal();
      }, GSAP_TIMEOUT_MS);

      (async () => {
        try {
          const gsap = (await import("gsap")).default;
          if (done.current) return;
          const root = rootRef.current;
          if (!root) return;

          clearTimeout(bail);
          gsapOnRef.current = true;
          setGsapOn(true);

          const tl = gsap.timeline({ defaults: { ease: "none" } });
          const q = (sel: string) => root.querySelectorAll(sel);

          // 0.0s — droplet falls from above the panel
          tl.fromTo(
            q("#bi-drop"),
            { y: -260, opacity: 0 },
            { y: 176, opacity: 1, duration: 0.4, ease: "power2.in" },
            0
          );
          // 0.4s — impact: droplet vanishes, splash arcs out, ripples expand
          tl.set(q("#bi-drop"), { opacity: 0 }, 0.4);

          const arcs = [
            [-70, -95],
            [-32, -120],
            [6, -130],
            [38, -112],
            [72, -88],
          ];
          Array.from(q("#bi-splash circle")).forEach((c, i) => {
            tl.to(c, { opacity: 1, duration: 0.05 }, 0.4)
              .to(c, { x: arcs[i][0], y: arcs[i][1], duration: 0.28, ease: "power2.out" }, 0.4)
              .to(c, { x: arcs[i][0] * 1.35, y: -6, opacity: 0, duration: 0.27, ease: "power2.in" }, 0.68);
          });

          tl.fromTo(
            q("#bi-ripple1"),
            { scale: 0.2, opacity: 0.8, transformOrigin: "50% 50%" },
            { scale: 1.25, opacity: 0, duration: 0.55, ease: "power2.out" },
            0.42
          );
          tl.fromTo(
            q("#bi-ripple2"),
            { scale: 0.2, opacity: 0.6, transformOrigin: "50% 50%" },
            { scale: 1.3, opacity: 0, duration: 0.6, ease: "power2.out" },
            0.55
          );

          // Puddle appears on impact, then absorbs away until dry.
          tl.fromTo(
            q("#bi-puddle"),
            { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
            { scale: 1, opacity: 0.55, duration: 0.18, ease: "power2.out" },
            0.42
          );
          tl.to(q("#bi-puddle"), { scaleX: 0.06, scaleY: 0.3, opacity: 0, duration: 0.5, ease: "power2.in" }, 0.9);

          // Logo appears, clean and dry — then hold, then lift.
          tl.fromTo(
            q(".intro-logo"),
            { opacity: 0, y: 14, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" },
            LOGO_AT_MS / 1000
          );
          tl.call(() => triggerReveal(), undefined, LOGO_AT_MS / 1000 + 0.5 + LOGO_HOLD_MS / 1000);

          tlRef.current = tl;
        } catch {
          clearTimeout(bail);
          if (!done.current) triggerReveal();
        }
      })();
    }

    return () => {
      done.current = true;
      document.body.style.overflow = prevOverflow;
      timers.current.forEach(clearTimeout);
      try {
        tlRef.current?.kill?.();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerReveal = () => {
    if (done.current) return;
    setRevealing(true);
    timers.current.push(
      setTimeout(() => {
        done.current = true;
        document.body.style.overflow = "";
        setShow(false);
      }, REVEAL_MS)
    );
  };

  if (!show) return null;

  return (
    <div ref={rootRef} aria-hidden="true">
      <style>{introStyles}</style>
      <div
        className={`intro-panel ${gsapOn ? "" : "intro-css-fallback"} ${revealing ? "intro-reveal" : ""}`}
        onClick={triggerReveal}
      >
        {/* Droplet + splash + ripples + puddle */}
        <svg className="intro-stage" viewBox="0 0 400 400" aria-hidden="true">
          <path
            id="bi-drop"
            d="M200 0 C200 10 188 16 188 24 a12 12 0 0 0 24 0 C212 16 200 10 200 0 Z"
            fill="#4FA99B"
            style={{ transform: "translate(0,-40px)", transformBox: "fill-box", transformOrigin: "center" }}
          />
          <ellipse id="bi-ripple1" cx="200" cy="208" rx="70" ry="18" fill="none" stroke="#4FA99B" strokeWidth={3} opacity={0} />
          <ellipse id="bi-ripple2" cx="200" cy="208" rx="100" ry="26" fill="none" stroke="#4FA99B" strokeWidth={2} opacity={0} />
          <ellipse id="bi-puddle" cx="200" cy="208" rx="44" ry="11" fill="#4FA99B" opacity={0} />
          <g id="bi-splash">
            <circle cx="200" cy="204" r="5" fill="#4FA99B" opacity={0} />
            <circle cx="200" cy="204" r="4" fill="#4FA99B" opacity={0} />
            <circle cx="200" cy="204" r="6" fill="#4FA99B" opacity={0} />
            <circle cx="200" cy="204" r="4" fill="#4FA99B" opacity={0} />
            <circle cx="200" cy="204" r="5" fill="#4FA99B" opacity={0} />
          </g>
        </svg>

        {/* Logo settles in, clean and dry */}
        <div className="intro-logo">
          <div className="intro-word-row">
            <span className="intro-wordmark">bestiee</span>
            <span className="intro-dot" />
          </div>
          <span className="intro-underline" />
          <span className="intro-tagline">soft · dry · confident</span>
        </div>

        <button
          type="button"
          className="intro-skip"
          aria-label="Skip intro animation"
          onClick={(e) => {
            e.stopPropagation();
            triggerReveal();
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

const introStyles = `
.intro-panel{
  position:fixed; inset:0; z-index:9999; overflow:hidden;
  background:radial-gradient(120% 90% at 50% 10%, #24322e 0%, #1a1a18 55%, #141412 100%);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; will-change:transform; transform:translateY(0);
}
.intro-panel.intro-reveal{
  transform:translateY(-100%);
  transition:transform ${REVEAL_MS}ms cubic-bezier(.4,0,.2,1);
}

/* ── Droplet stage ── */
.intro-stage{
  position:absolute; left:50%; top:50%;
  width:min(70vw,340px); height:min(70vw,340px);
  transform:translate(-50%,-50%);
  filter:drop-shadow(0 0 8px rgba(79,169,155,.35));
}

/* ── Logo ── */
.intro-logo{
  position:absolute; display:flex; flex-direction:column; align-items:center; gap:8px;
  opacity:0;
}
.intro-underline{ display:block; width:120px; height:3px; background:#c9b89a; border-radius:2px; transform:scaleX(0); transform-origin:left; }
.intro-tagline{ color:#c9b89a; font-size:14px; letter-spacing:.5px; opacity:0; }

/* CSS fallback logo animation — used only when GSAP couldn't load. */
.intro-css-fallback .intro-stage{ display:none; }
.intro-css-fallback .intro-logo{ animation:logo-in .5s ease 0.1s forwards; }
.intro-css-fallback .intro-underline{ animation:underline .5s ease .3s forwards; }
.intro-css-fallback .intro-tagline{ animation:fade-in .4s ease .5s forwards; }
@keyframes logo-in{ from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} }
@keyframes underline{ from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes fade-in{ from{opacity:0} to{opacity:1} }

.intro-word-row{ display:flex; align-items:flex-start; gap:6px; }
.intro-wordmark{
  font-family:var(--font-serif,Georgia),serif;
  font-size:64px; font-weight:700; color:#C9573F; letter-spacing:-1px; line-height:1;
}
.intro-dot{ width:11px; height:11px; border-radius:50%; background:#EDE6DC; margin-top:8px; }

.intro-skip{
  position:absolute; bottom:28px; right:28px; z-index:2;
  background:rgba(255,255,255,.08); color:#e5e5e5;
  border:1px solid rgba(255,255,255,.2); border-radius:999px;
  padding:8px 18px; font-size:13px; font-weight:600; cursor:pointer;
}
.intro-skip:hover{ background:rgba(255,255,255,.16); }
.intro-skip:focus-visible{ outline:3px solid #EDE6DC; outline-offset:2px; }

@media (max-width:640px){ .intro-wordmark{ font-size:48px; } }

/* Reduced motion: no droplet — just the logo, quickly. */
@media (prefers-reduced-motion: reduce){
  .intro-stage{ display:none !important; }
  .intro-logo{ animation:logo-in .3s ease 0s forwards !important; opacity:0; }
  .intro-underline{ animation:underline .3s ease .1s forwards !important; }
  .intro-tagline{ animation:fade-in .3s ease .2s forwards !important; }
}
`;
