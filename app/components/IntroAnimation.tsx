"use client";

import { useEffect, useRef, useState } from "react";

export default function IntroAnimation({ 
  onComplete 
}: { 
  onComplete: () => void 
}) {
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [showLogo, setShowLogo] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const duration = 3500; // 3.5 Sekunden Logo anzeigen

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation abgeschlossen
        setShowLogo(false);
        onComplete();
      }
    };

    const interval = setInterval(animate, 16);
    const fadeOutStart = setTimeout(() => {
      setLogoOpacity(0);
    }, duration - 500); // Fade out in letztem halben Sekunde

    return () => {
      clearInterval(interval);
      clearTimeout(fadeOutStart);
    };
  }, [onComplete]);

  useEffect(() => {
    const duration = 3500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = elapsed / duration;
      setLoadingProgress(progress);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  if (!showLogo) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        opacity: logoOpacity,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      <img
        src="/statikbüro-logo.png"
        alt="Statikbüro Logo"
        style={{
          maxWidth: '400px',
          width: '80%',
          height: 'auto',
          filter: 'drop-shadow(0 0 30px rgba(255, 179, 68, 0.3))',
          animation: 'pulse 2s ease-in-out infinite',
          marginBottom: '40px'
        }}
      />
      
      {/* Moderner Ladebalken */}
      <div style={{
        width: '300px',
        height: '4px',
        backgroundColor: '#1a1a1a',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${loadingProgress * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ffb344 0%, #ffd700 50%, #ffb344 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
          boxShadow: '0 0 10px rgba(255, 179, 68, 0.5)',
          transition: 'width 0.1s linear'
        }} />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

