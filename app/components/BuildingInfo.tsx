"use client";

import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface BuildingInfo {
  position: { x: number; y: number; z: number };
  title: string;
  subtitle: string;
  description: string;
  distance: number;
  href?: string;
}

const BASE_URL = "https://statikbüro24.de/projekte.html";

const BUILDINGS: BuildingInfo[] = [
  {
    position: { x: 8.0, y: 0, z: 7 }, // Gebäude 1 - aktuelle Position
    title: "Berlin Tempelhof",
    subtitle: "Das Wohnprojekt",
    description: "Neubau eines 11-Parteienhauses in Berlin Tempelhof mit moderner Bauweise und nachhaltigen Materialien. Das Projekt zeichnet sich durch innovative architektonische Lösungen und energieeffiziente Bauweise aus.",
    distance: 3, // Reichweite für Gebäude-Erkennung
    href: `${BASE_URL}#projekt-tempelhof`
  },
  {
    position: { x: -7.7, y: 0, z: -6 }, // Brücke über Hafen - tatsächliche Position
    title: "Hamburg Veddel",
    subtitle: "Infrastrukturprojekt",
    description: "Projekt DB-Gleisquerung Veddel in Hamburg. Innovatives Bauvorhaben zur Verbesserung der Verkehrsinfrastruktur mit modernen Brückenbau-Lösungen.",
    distance: 8, // Größere Reichweite für Hafenbereich
    href: `${BASE_URL}#projekt-veddel`
  },
  {
    position: { x: 9.39, y: 0, z: -9.2 }, // Gebäude 2 – Plaza-Position
    title: "Worms",
    subtitle: "Neubau eines Mehrfamilienhauses",
    description: "Modernes Mehrfamilienhaus in Worms mit klarer Architektur und effizienter Bauweise.",
    distance: 4,
    href: `${BASE_URL}#projekt-worms`
  }
];

export default function BuildingInfo({ dronePosition, alwaysShow, showAfterDrone }: { dronePosition: { x: number; y: number; z: number }; alwaysShow?: boolean; showAfterDrone?: boolean }) {
  const [visibleInfo, setVisibleInfo] = useState<BuildingInfo | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Wenn showAfterDrone gesetzt ist, warte bis die Drohnen-Animation fertig ist
  useEffect(() => {
    if (showAfterDrone) {
      // Warte 1.2 Sekunden (Drohnen-Animation) + kleine Verzögerung
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, 1400); // 1.2s Animation + 0.2s Verzögerung
      return () => clearTimeout(timer);
    } else {
      setShouldShow(true);
    }
  }, [showAfterDrone]);

  useEffect(() => {
    let found = false;
    
    for (const building of BUILDINGS) {
      const dx = dronePosition.x - building.position.x;
      const dy = dronePosition.y - building.position.y;
      const dz = dronePosition.z - building.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < building.distance) {
        setVisibleInfo(building);
        found = true;
        // Lösche Timeout wenn wieder in Nähe
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        break;
      }
    }
    
    // Verstecke erst nach 10 Sekunden Verzögerung (längere Anzeigedauer)
    if (!found && visibleInfo) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => {
        setVisibleInfo(null);
        hideTimeoutRef.current = null;
      }, 10000); // 10 Sekunden Verzögerung bevor ausgeblendet wird
    } else if (!found && !visibleInfo) {
      // Wenn keine Info angezeigt wird, setze direkt auf null
      setVisibleInfo(null);
    }
  }, [dronePosition, alwaysShow, visibleInfo]);

  // Keine Info oder noch nicht anzeigen -> nichts anzeigen
  if (!visibleInfo || !shouldShow) return null;
  
  const infoToShow = visibleInfo;

  // Wenn alwaysShow, dann rechts anzeigen (Desktop) oder unten (Mobile)
  const rightStyle: CSSProperties = {
    position: 'absolute',
    top: isMobile ? 'auto' : '50%',
    right: isMobile ? '12px' : '60px',
    bottom: isMobile ? '12px' : 'auto',
    left: isMobile ? '12px' : 'auto',
    transform: isMobile ? 'none' : 'translateY(-50%)',
    maxWidth: isMobile ? 'calc(100vw - 24px)' : '400px',
    zIndex: 10000,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: isMobile ? '12px 14px' : '40px',
    borderRadius: isMobile ? '8px' : '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    pointerEvents: 'auto',
    touchAction: 'auto'
  };

  const bottomStyle: CSSProperties = {
    position: 'absolute',
    top: isMobile ? 'auto' : 'auto',
    bottom: isMobile ? '12px' : '60px',
    left: isMobile ? '12px' : '60px',
    right: isMobile ? '12px' : 'auto',
    maxWidth: isMobile ? 'calc(100vw - 24px)' : '600px',
    zIndex: 10000,
    animation: 'slideUpFromBottom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: isMobile ? '12px 14px' : '40px',
    borderRadius: isMobile ? '8px' : '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    pointerEvents: 'auto',
    touchAction: 'auto'
  };

  const containerStyle = alwaysShow ? rightStyle : bottomStyle;

  // Touch-Events stoppen, damit sie nicht zur Drohnensteuerung weitergegeben werden
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      style={containerStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Titel-Bereich */}
      <div style={{ marginBottom: isMobile ? '8px' : '24px' }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '11px' : '14px',
          fontWeight: '400',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '0.5px',
          marginBottom: isMobile ? '2px' : '4px',
          textTransform: 'uppercase'
        }}>
          {infoToShow.title}
        </div>
        <div style={{
          color: 'white',
          fontSize: isMobile ? '20px' : '42px',
          fontWeight: '200',
          fontFamily: 'neueMachina, "Neue Machina", "Helvetica Neue", Helvetica, Arial, sans-serif',
          letterSpacing: isMobile ? '-0.3px' : '-1.5px',
          lineHeight: isMobile ? '1.2' : '1.1',
          overflow: 'hidden',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}>
          {infoToShow.subtitle}
        </div>
      </div>

      {/* Beschreibung */}
      {!isMobile && (
        <div style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '16px',
          lineHeight: '1.75',
          fontWeight: '300',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          marginBottom: '32px',
          maxWidth: alwaysShow ? '320px' : '500px',
          letterSpacing: '0.2px'
        }}>
          {infoToShow.description}
        </div>
      )}

      {/* Button-Bereich */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
        <a
          href={infoToShow.href || '#'}
          className="button"
          style={{ 
            fontSize: '14px', 
            padding: '12px 24px',
            pointerEvents: 'auto',
            touchAction: 'auto',
            position: 'relative',
            zIndex: 10001
          }}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          <span>→</span>
          Mehr Infos
        </a>

        <a
          href={BASE_URL}
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            textDecoration: 'underline',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.3px',
            fontWeight: '400',
            transition: 'color 0.2s',
            pointerEvents: 'auto',
            touchAction: 'auto',
            position: 'relative',
            zIndex: 10001
          }}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffb344';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          }}
        >
          zu allen Projekten
        </a>
      </div>
      )}

      {isMobile && (
        <div style={{ marginTop: '8px', pointerEvents: 'auto', touchAction: 'auto' }}>
          <a
            href={infoToShow.href || '#'}
            className="button"
            style={{ 
              fontSize: '12px', 
              padding: '8px 12px',
              pointerEvents: 'auto',
              touchAction: 'auto',
              position: 'relative',
              zIndex: 10001
            }}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
          >
            Mehr Infos
          </a>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUpFromBottom {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

