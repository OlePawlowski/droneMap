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
  const startTime = useRef(Date.now());
  const hasCalledComplete = useRef(false);

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
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opacity,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: opacity > 0.1 ? 'auto' : 'none',
      }}
    >
      {/* Logo */}
      <div style={{
        marginBottom: '40px',
        opacity: opacity,
      }}>
        <img 
          src="/logo-animated.svg" 
          alt="Logo" 
          style={{
            height: '120px',
            width: 'auto',
            filter: 'drop-shadow(0 0 20px rgba(255, 179, 68, 0.5))',
          }}
          onError={(e) => {
            // Fallback wenn Logo nicht gefunden wird
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Ladekreis mit animiertem Rand */}
      <div style={{
        width: '80px',
        height: '80px',
        opacity: opacity,
        position: 'relative',
      }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          {/* Hintergrund-Kreis */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="4"
          />
          {/* Animierter Rand-Kreis */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="#ffb344"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 35}
            strokeDashoffset={2 * Math.PI * 35 * (1 - loadingProgress)}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255, 179, 68, 0.8))',
              transition: 'stroke-dashoffset 0.1s linear',
            }}
          />
        </svg>
      </div>
    </div>
  );
}

