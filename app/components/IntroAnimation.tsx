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
            width: '360px', // Mobile: Noch größere Breite für größeres Logo
            height: '180px', // Mobile: Noch größere Höhe für größeres Logo
            marginTop: 0, // Explizit setzen
          }}
        >
          <img 
            src="/logo-animated-cropped.svg" 
            alt="Logo"
            className="loading-logo-img"
            style={{
              height: '180px', // Mobile: Noch größeres Logo
              width: 'auto',
              maxWidth: '360px', // Mobile: Noch größeres Logo
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 20px rgba(255, 179, 68, 0.5))',
              display: 'block', // Verhindert Layout-Sprünge
              visibility: showLogo || isDesktop ? 'visible' : 'hidden', // Logo erst nach Verzögerung zeigen (nur mobil)
              opacity: showLogo || isDesktop ? 1 : 0, // Sanftes Einblenden (nur mobil)
              transition: 'opacity 0.3s ease-in',
            }}
            onError={(e) => {
              // Fallback wenn Logo nicht gefunden wird
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
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

