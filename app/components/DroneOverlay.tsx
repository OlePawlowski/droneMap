"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import React from 'react';

interface DroneOverlayProps {
  dronePosition: { x: number; y: number; z: number };
  droneRotation: { x: number; y: number; z: number; w: number };
  targetDirection?: { x: number; y: number; z: number };
  isFlying?: boolean;
}

export default function DroneOverlay({ dronePosition, droneRotation, targetDirection, isFlying }: DroneOverlayProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [modelSrc, setModelSrc] = useState<string>("/last-try.glb");
  const [isMobile, setIsMobile] = useState(false);
  const ModelViewerTag = 'model-viewer' as any;

  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    // Google Model Viewer Script laden und auf Bereitschaft warten
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error('Model-Viewer Script konnte nicht geladen werden');
    document.head.appendChild(script);

    // Verifiziere, dass das Modell erreichbar ist; bei Fehler auf Fallback wechseln
    fetch('/last-try.glb', { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) throw new Error('last-try.glb nicht erreichbar');
        setModelSrc('/last-try.glb');
      })
      .catch(() => {
        // Fallback entfernt, da wir nur last-try verwenden
        console.error('last-try.glb konnte nicht geladen werden');
      });

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (scriptReady && modelViewerRef.current) {
      const modelViewer = modelViewerRef.current;
      
      const handleLoad = () => {
        setIsLoaded(true);
        
        // Tone Mapping auf AGX setzen
        try {
          // Warte kurz, damit der Renderer initialisiert ist
          setTimeout(() => {
            const scene = modelViewer.scene;
            if (scene && scene.renderer) {
              scene.renderer.toneMapping = THREE.AgXToneMapping;
              scene.renderer.toneMappingExposure = 1.0;
            } else if (modelViewer.renderer) {
              // Fallback: direkter Zugriff auf renderer
              modelViewer.renderer.toneMapping = THREE.AgXToneMapping;
              modelViewer.renderer.toneMappingExposure = 1.0;
            }
            
          }, 100);
        } catch (error) {
          console.log('Tone Mapping konnte nicht gesetzt werden:', error);
        }
        
        // Animationen manuell starten falls nötig
        if (modelViewer.availableAnimations && modelViewer.availableAnimations.length > 0) {
          modelViewer.availableAnimations.forEach((animationName: string) => {
            modelViewer.play({ animationName: animationName, repetitions: Infinity });
          });
        }
      };

      const handleError = (event: any) => {
        // Mehr Diagnoseinformationen erfassen
        const detail = (event && (event.detail || event.message)) || event || {};
        console.error('Fehler beim Laden:', detail);
        // Kein Fallback mehr, da wir nur last-try verwenden
      };

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, [scriptReady, modelSrc]);

  // camera-orbit basierend auf Flugrichtung setzen
  useEffect(() => {
    if (scriptReady && modelViewerRef.current && isLoaded) {
      const modelViewer = modelViewerRef.current;
      try {
        if (targetDirection) {
          // Berechne Azimuth-Winkel basierend auf Flugrichtung
          // targetDirection zeigt in die Flugrichtung
          const direction = new THREE.Vector3(
            targetDirection.x,
            0, // Y-Komponente ignorieren für horizontale Rotation
            targetDirection.z
          ).normalize();
          
          // Berechne Winkel in Grad
          // Atan2 gibt Winkel von -PI bis PI, wir konvertieren zu 0-360
          let azimuth = (Math.atan2(direction.x, -direction.z) * 180) / Math.PI;
          
          // Normalisiere auf 0-360 Grad
          if (azimuth < 0) {
            azimuth += 360;
          }
          
          // Drehe um 180 Grad, damit die Drohne in die richtige Richtung zeigt (nicht nach hinten)
          azimuth = (azimuth + 180) % 360;
          
          // Polar-Winkel (vertikal) - 90deg = genau von oben
          const polar = 45; // Von oben betrachten
          const radius = 1.5; // Größerer Abstand für mehr Platz
          
          // Setze camera-orbit
          // Format: "azimuth polar radius"
          modelViewer.setAttribute('camera-orbit', `${azimuth}deg ${polar}deg ${radius}m`);
        } else {
          // Standard-Kamera-Position - mit polar 45deg, richtig ausgerichtet
          // 180deg Azimuth = Drohne zeigt nach vorne (Standard-Ausrichtung)
          modelViewer.setAttribute('camera-orbit', '180deg 45deg 1.5m');
        }
      } catch (error) {
        console.log('camera-orbit konnte nicht gesetzt werden:', error);
      }
    }
  }, [scriptReady, isLoaded, targetDirection]);

  // 3D-Position zu 2D-Bildschirmkoordinaten konvertieren
  const getScreenPosition = () => {
    // Prüfen ob wir im Browser sind
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }
    
    // Vereinfachte Konvertierung - in einer echten App würde man die Kamera-Matrix verwenden
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Basis-Offset für die Drohne
    const offsetX = dronePosition.x * 50; // Skalierung anpassen
    const offsetY = -dronePosition.z * 50; // Z zu Y invertieren
    
    return {
      x: centerX + offsetX,
      y: centerY + offsetY,
    };
  };

  const screenPos = getScreenPosition();

  // Rotation basierend auf der Zielrichtung berechnen
  const getRotationStyle = () => {
    // Basis-Transform: immer zentriert, keine Rotation
    // rotateZ komplett entfernt - keine seitliche Neigung mehr
    return {
      transform: 'translate(-50%, -50%)',
      transition: 'transform 0.1s ease-out'
    };
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '75%',
        width: '240px',
        height: '240px',
        pointerEvents: 'none',
        zIndex: 1000,
        ...getRotationStyle(),
      }}
    >
      {scriptReady && (
      <ModelViewerTag
        ref={modelViewerRef}
        src={modelSrc}
        alt="3D Drohne"
        auto-rotate={false}
        camera-controls={false}
        shadow-intensity="0.6"
        environment-image="neutral"
        exposure="1.1"
        loading="eager"
        animation-name="*"
        autoplay
        skybox-image=""
        camera-target="0m 0.1m 0m"
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          filter: 'none',
        }}
      />)}
      {/* Loading-Hinweis entfernt */}
    </div>
  );
}

export {};
