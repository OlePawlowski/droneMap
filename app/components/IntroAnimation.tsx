"use client";

import { useEffect, useRef, useState } from "react";

export default function IntroAnimation({ 
  onComplete 
}: { 
  onComplete: () => void 
}) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showLogo, setShowLogo] = useState(false); // Logo erst nach kurzer Verzögerung zeigen (nur mobil)
  const startTime = useRef(Date.now());
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    const checkDesktop = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      // Auf Desktop: Logo sofort zeigen, auf Mobile: nach Verzögerung
      if (desktop) {
        setShowLogo(true);
      }
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
  setShowLogo(true);
}, []);


  useEffect(() => {
    // Ladescreen sollte nur so lange sein, wie das Programm braucht zu laden
    // Hier verwenden wir eine kurze Mindestzeit (z.B. 2-3 Sekunden) für den Ladebalken
    const minLoadingDuration = 2000; // Mindestzeit für Ladebalken-Animation
    const fadeStartDuration = 2500; // Starte Fade-out nach 2.5s (früher, damit Logo sichtbar wird)
    const fadeDuration = 800; // Fade-out dauert 0.8s

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      
      // Lade-Progress (schneller, damit Overlay früher weg ist)
      const progress = Math.min(elapsed / minLoadingDuration, 1);
      setLoadingProgress(progress);

      // Starte Kamera-Animation nach kurzer Zeit (Overlay wird ausgeblendet, aber Kamera bleibt beim Logo)
      if (!hasCalledComplete.current && elapsed >= minLoadingDuration) {
        hasCalledComplete.current = true;
        onComplete();
      }

      // Fade out früher, damit Logo sichtbar wird
      if (elapsed > fadeStartDuration) {
        const fadeProgress = (elapsed - fadeStartDuration) / fadeDuration;
        const newOpacity = Math.max(0, 1 - fadeProgress);
        setOpacity(newOpacity);
        
        if (newOpacity <= 0) {
          setShowOverlay(false);
        }
      }
    };

    const interval = setInterval(animate, 16);

    return () => {
      clearInterval(interval);
    };
  }, [onComplete]);

  if (!showOverlay) return null;

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .loading-logo-container {
            width: 700px !important;
            height: 350px !important;
          }
          .loading-logo-img {
            height: 350px !important;
            max-width: 700px !important;
          }
          .loading-spinner-container {
            top: calc(50% + 180px) !important;
            width: 40px !important;
            height: 40px !important;
          }
          .loading-spinner-svg {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.95)',
          opacity: opacity,
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: opacity > 0.1 ? 'auto' : 'none',
        }}
      >
        {/* Logo - absolut vertikal zentriert, unabhängig vom Ladekreis */}
{/* Logo - absolut vertikal zentriert */}
<div 
  className="loading-logo-container"
  style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: opacity,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    // ⬇️ exakt wie dein vorheriges IMG
    width: isDesktop ? '700px' : '360px',
    height: isDesktop ? '350px' : '180px',
  }}
>
  {/* Wrapper für responsive scaling */}
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {/* Dein eingebettetes SVG */}
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1400 260"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        maxWidth: "100%",
        maxHeight: "100%",
        filter: "drop-shadow(0 0 20px rgba(255, 179, 68, 0.5))",
        visibility: showLogo || isDesktop ? "visible" : "hidden",
        opacity: showLogo || isDesktop ? 1 : 0,
        transition: "opacity 0.3s ease-in",
      }}
    >
      <defs>
        <style>{`
          .letter {
            font-family: 'Montserrat','Helvetica Neue',Arial,sans-serif;
            font-weight: 800;
            font-size: 150px;
            fill: none;
            stroke: #FFBC3D;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: draw 6.0s ease forwards;
          }
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>

      <g transform="translate(40,180)">
        <text x="0"    y="0" class="letter">S</text>
        <text x="110"  y="0" class="letter">T</text>
        <text x="210"  y="0" class="letter">A</text>
        <text x="320"  y="0" class="letter">T</text>
        <text x="420"  y="0" class="letter">I</text>
        <text x="480"  y="0" class="letter">K</text>
        <text x="600"  y="0" class="letter">B</text>
        <text x="720"  y="0" class="letter">Ü</text>
        <text x="840"  y="0" class="letter">R</text>
        <text x="955"  y="0" class="letter">O</text>
        <text x="1085" y="0" class="letter">2</text>
        <text x="1180" y="0" class="letter">4</text>
      </g>
    </svg>
  </div>
</div>

        {/* Ladekreis mit animiertem Rand - darunter, unabhängig positioniert */}
        <div 
          className="loading-spinner-container"
          style={{
            position: 'absolute',
            top: 'calc(50% + 60px)', // Mobile: Reduzierter Abstand unterhalb des zentrierten Logos
            left: '50%',
            transform: 'translateX(-50%)',
            width: '32px', // Mobile
            height: '32px', // Mobile
            opacity: opacity,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 0, // Explizit setzen
          }}
        >
          <svg className="loading-spinner-svg" width={isDesktop ? "40" : "32"} height={isDesktop ? "40" : "32"} style={{ transform: 'rotate(-90deg)' }}>
            {/* Hintergrund-Kreis */}
            <circle
              cx={isDesktop ? "20" : "16"}
              cy={isDesktop ? "20" : "16"}
              r={isDesktop ? "18" : "14"}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2.5"
            />
            {/* Animierter Rand-Kreis */}
            <circle
              cx={isDesktop ? "20" : "16"}
              cy={isDesktop ? "20" : "16"}
              r={isDesktop ? "18" : "14"}
              fill="none"
              stroke="#ffb344"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={isDesktop ? 2 * Math.PI * 18 : 2 * Math.PI * 14}
              strokeDashoffset={(isDesktop ? 2 * Math.PI * 18 : 2 * Math.PI * 14) * (1 - loadingProgress)}
              style={{
                filter: 'drop-shadow(0 0 10px rgba(255, 179, 68, 0.8))',
                transition: 'stroke-dashoffset 0.1s linear',
              }}
            />
          </svg>
        </div>
      </div>
    </>
  );
}

