"use client";

import { useEffect, useState } from "react";

export default function InstructionsOverlay({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const duration = 3500; // 3.5 Sekunden anzeigen
    const fadeOutStart = 2500; // Fade-out startet nach 2.5 Sekunden

    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, fadeOutStart);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity,
        transition: 'opacity 1s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Visual Control Indicators */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        {/* Click Indicator */}
        <div style={{
          background: 'rgba(255, 179, 68, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '2px solid #ffb344',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: '#ffb344',
            borderRadius: '50%',
            boxShadow: '0 0 20px rgba(255, 179, 68, 0.6)',
          }}></div>
          
          {/* Drop Shadow */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            width: '50px',
            height: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '50%',
            filter: 'blur(5px)',
          }}></div>
        </div>

        {/* Instructional Text */}
        <div style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '0.5px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
        }}>
          Klicken & Halten
        </div>

        {/* Arrow Crosshair Indicator */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          marginTop: '20px',
        }}>
          {/* Center Dot */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            background: '#ffb344',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(255, 179, 68, 0.8)',
          }}></div>
          
          {/* Up Arrow */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '32px',
            animation: 'moveUp 1.5s ease-in-out infinite'
          }}>↑</div>
          
          {/* Down Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '32px',
            animation: 'moveDown 1.5s ease-in-out infinite'
          }}>↓</div>
          
          {/* Left Arrow */}
          <div style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '32px',
            animation: 'moveLeft 1.5s ease-in-out infinite'
          }}>←</div>
          
          {/* Right Arrow */}
          <div style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '32px',
            animation: 'moveRight 1.5s ease-in-out infinite'
          }}>→</div>
        </div>

        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '13px',
          fontWeight: '400',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '0.3px',
        }}>
          Bewege die Maus in die gewünschte Richtung
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 179, 68, 0.7);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(255, 179, 68, 0);
          }
        }
        @keyframes moveLeft {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-8px); }
        }
        @keyframes moveRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes moveUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes moveDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}

