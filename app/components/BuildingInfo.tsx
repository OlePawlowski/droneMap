"use client";

import { useState, useEffect } from "react";

interface BuildingInfo {
  position: { x: number; y: number; z: number };
  title: string;
  subtitle: string;
  description: string;
  distance: number;
}

const BUILDINGS: BuildingInfo[] = [
  {
    position: { x: 0, y: 0, z: 3 }, // Gebäude 1 - sichtbare Position
    title: "Berlin Tempelhof",
    subtitle: "Das Wohnprojekt",
    description: "Neubau eines 11-Parteienhauses in Berlin Tempelhof mit moderner Bauweise und nachhaltigen Materialien. Das Projekt zeichnet sich durch innovative architektonische Lösungen und energieeffiziente Bauweise aus.",
    distance: 3 // Reichweite für Gebäude-Erkennung
  },
  {
    position: { x: -7.7, y: 0, z: -6 }, // Brücke über Hafen - tatsächliche Position
    title: "Hamburg Veddel",
    subtitle: "Das Infrastrukturprojekt",
    description: "Projekt DB-Gleisquerung Veddel in Hamburg. Innovatives Bauvorhaben zur Verbesserung der Verkehrsinfrastruktur mit modernen Brückenbau-Lösungen.",
    distance: 8 // Größere Reichweite für Hafenbereich
  }
];

export default function BuildingInfo({ dronePosition, alwaysShow }: { dronePosition: { x: number; y: number; z: number }; alwaysShow?: boolean }) {
  const [visibleInfo, setVisibleInfo] = useState<BuildingInfo | null>(null);

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
  const containerStyle = alwaysShow ? {
    position: 'absolute',
    top: '50%',
    right: '60px',
    transform: 'translateY(-50%)',
    maxWidth: '400px',
    zIndex: 1000,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: '40px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  } : {
    position: 'absolute',
    bottom: '60px',
    left: '60px',
    maxWidth: '600px',
    zIndex: 1000,
    animation: 'fadeInSlide 0.4s ease-out',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    padding: '40px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  return (
    <div style={containerStyle}>
      {/* Titel-Bereich */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          fontWeight: '400',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          letterSpacing: '0.5px',
          marginBottom: '4px',
          textTransform: 'uppercase'
        }}>
          {infoToShow.title}
        </div>
        <div style={{
          color: 'white',
          fontSize: '42px',
          fontWeight: '200',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          letterSpacing: '-1.5px',
          lineHeight: '1.1'
        }}>
          {infoToShow.subtitle}
        </div>
      </div>

      {/* Beschreibung */}
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

      {/* Button-Bereich */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <button
          onClick={() => {
            console.log('Mehr Infos für', infoToShow.title);
          }}
          style={{
            background: '#0e1516',
            color: '#ffb344',
            border: '1px solid #2a1f14',
            padding: '14px 28px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ffb344';
            e.currentTarget.style.background = 'rgba(255, 179, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a1f14';
            e.currentTarget.style.background = '#0e1516';
          }}
        >
          <span>→</span>
          Mehr Infos
        </button>

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

