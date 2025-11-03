"use client";

import { useState, useEffect } from "react";
import type { CSSProperties } from "react";

interface BuildingInfo {
  position: { x: number; y: number; z: number };
  title: string;
  subtitle: string;
  description: string;
  distance: number;
  href?: string;
}

const BUILDINGS: BuildingInfo[] = [
  {
    position: { x: 0, y: 0, z: 3 }, // Gebäude 1 - sichtbare Position
    title: "Berlin Tempelhof",
    subtitle: "Das Wohnprojekt",
    description: "Neubau eines 11-Parteienhauses in Berlin Tempelhof mit moderner Bauweise und nachhaltigen Materialien. Das Projekt zeichnet sich durch innovative architektonische Lösungen und energieeffiziente Bauweise aus.",
    distance: 3, // Reichweite für Gebäude-Erkennung
    href: "/projekte#projekt-tempelhof"
  },
  {
    position: { x: -7.7, y: 0, z: -6 }, // Brücke über Hafen - tatsächliche Position
    title: "Hamburg Veddel",
    subtitle: "Infrastrukturprojekt",
    description: "Projekt DB-Gleisquerung Veddel in Hamburg. Innovatives Bauvorhaben zur Verbesserung der Verkehrsinfrastruktur mit modernen Brückenbau-Lösungen.",
    distance: 8, // Größere Reichweite für Hafenbereich
    href: "/projekte#projekt-veddel"
  },
  {
    position: { x: 9.39, y: 0, z: -9.2 }, // Gebäude 2 – Plaza-Position
    title: "Worms",
    subtitle: "Neubau eines Mehrfamilienhauses",
    description: "Modernes Mehrfamilienhaus in Worms mit klarer Architektur und effizienter Bauweise.",
    distance: 4,
    href: "/projekte#projekt-worms"
  }
];

export default function BuildingInfo({ dronePosition, alwaysShow }: { dronePosition: { x: number; y: number; z: number }; alwaysShow?: boolean }) {
  const [visibleInfo, setVisibleInfo] = useState<BuildingInfo | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
        break;
      }
    }
    
    // IMMER verstecken wenn nicht in Nähe (auch bei alwaysShow)
    if (!found) {
      setVisibleInfo(null);
    }
  }, [dronePosition, alwaysShow]);

  // Keine Info -> nichts anzeigen
  if (!visibleInfo) return null;
  
  const infoToShow = visibleInfo;

  // Wenn alwaysShow, dann rechts anzeigen
  const rightStyle: CSSProperties = {
    position: 'absolute',
    top: isMobile ? 'auto' : '50%',
    right: isMobile ? '12px' : '60px',
    bottom: isMobile ? '12px' : 'auto',
    transform: isMobile ? 'none' : 'translateY(-50%)',
    maxWidth: isMobile ? '80vw' : '400px',
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: isMobile ? '12px 14px' : '40px',
    borderRadius: isMobile ? '8px' : '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const bottomStyle: CSSProperties = {
    position: 'absolute',
    bottom: isMobile ? '12px' : '60px',
    left: isMobile ? '12px' : '60px',
    maxWidth: isMobile ? '80vw' : '600px',
    zIndex: 1000,
    animation: 'fadeInSlide 0.4s ease-out',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: isMobile ? '12px 14px' : '40px',
    borderRadius: isMobile ? '8px' : '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const containerStyle = alwaysShow ? rightStyle : bottomStyle;

  return (
    <div style={containerStyle}>
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
          style={{ fontSize: '14px', padding: '12px 24px' }}
        >
          <span>→</span>
          Mehr Infos
        </a>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            console.log('Zu allen Projekten');
          }}
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            textDecoration: 'underline',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.3px',
            fontWeight: '400',
            transition: 'color 0.2s'
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
        <div style={{ marginTop: '8px' }}>
          <a
            href={infoToShow.href || '#'}
            className="button"
            style={{ fontSize: '12px', padding: '8px 12px' }}
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
      `}</style>
    </div>
  );
}

