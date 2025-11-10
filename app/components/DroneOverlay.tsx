"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'environment-image'?: string;
        exposure?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        'animation-name'?: string;
        autoplay?: boolean;
      }, HTMLElement>;
    }
  }
}

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
    if (!targetDirection) {
      return { transform: 'translate(-50%, -50%)' };
    }

    // Immer zur Maus neigen, aber mehr wenn geflogen wird
    const tiltMultiplier = isFlying ? 1.0 : 0.4; // Etwas mehr Neigung auch wenn nicht geflogen wird
    
    // Neigung basierend auf der X-Richtung (links/rechts)
    const tiltX = targetDirection.x * 25 * tiltMultiplier; // Etwas mehr Neigung
    
    // Rotation basierend auf der Z-Richtung (vor/zurück)
    const tiltZ = -targetDirection.z * 20 * tiltMultiplier; // Etwas mehr Neigung

    return {
      transform: `translate(-50%, -50%) rotateX(${tiltZ}deg) rotateZ(${tiltX}deg)`,
      transition: 'transform 0.1s ease-out'
    };
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '70%',
        width: '180px',
        height: '180px',
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
