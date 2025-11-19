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
  const currentPolarRef = useRef<number>(45); // Aktueller Polar-Winkel für sanfte Transition (45deg = neutral)
  const currentAzimuthRef = useRef<number>(180); // Aktueller Azimuth-Winkel für sanfte Transition
  const animationFrameRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const currentTiltRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 }); // Aktuelle Drohnen-Neigung

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

  // camera-orbit basierend auf Flugrichtung setzen - nur während des Fliegens mit sanfter Transition
  useEffect(() => {
    if (scriptReady && modelViewerRef.current && isLoaded) {
      const modelViewer = modelViewerRef.current;
      
      // Stoppe vorherige Animation falls vorhanden
      if (animationFrameRef.current) {
        if (typeof animationFrameRef.current === 'number') {
          cancelAnimationFrame(animationFrameRef.current);
        } else {
          clearTimeout(animationFrameRef.current);
        }
      }
      
      try {
        let targetPolar: number;
        let targetAzimuth: number;
        let minPolar: number;
        let maxPolar: number;
        
        // Nur aktualisieren, wenn geflogen wird
        if (isFlying && targetDirection) {
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
          targetAzimuth = (azimuth + 180) % 360;
          
          // Polar-Winkel (vertikal) - kontinuierliche Interpolation basierend auf Flugrichtung
          // Vorne (z = -1): 47deg
          // Links/Rechts (z = 0): 45deg
          // Hinten (z = 1): 43deg
          // Kontinuierliche Interpolation in 0.1 Grad Schritten
          // Formel: polar = 45 - 2*z (z von -1 bis 1)
          // z = -1 → 45 - 2*(-1) = 47
          // z = 0 → 45 - 2*0 = 45
          // z = 1 → 45 - 2*1 = 43
          const zComponent = targetDirection.z; // -1 (vorne) bis 1 (hinten)
          targetPolar = 45 - (2 * zComponent);
          
          // Runde auf 0.1 Grad Schritte für noch smoothtere Übergänge
          targetPolar = Math.round(targetPolar * 10) / 10;
          minPolar = targetPolar;
          maxPolar = targetPolar;
        } else {
          // Standard-Kamera-Position - neutral, wenn nicht geflogen wird
          targetAzimuth = 180; // Drohne zeigt nach vorne
          targetPolar = 45; // Neutral (45deg)
          minPolar = 45;
          maxPolar = 45;
        }
        
        // Sanfte Rotation zur Zielposition (nur für Azimuth)
        const startAzimuth = currentAzimuthRef.current;
        const startPolar = currentPolarRef.current;
        const radius = 1.5;
        
        // Berechne kürzesten Weg für Azimuth (kann über 0/360 Grad gehen)
        let azimuthDiff = targetAzimuth - startAzimuth;
        if (azimuthDiff > 180) azimuthDiff -= 360;
        if (azimuthDiff < -180) azimuthDiff += 360;
        
        // Wenn sich die Richtung ändert, animiere die Rotation
        if (Math.abs(azimuthDiff) > 1) {
          const duration = 600; // 600ms für langsamere, sanftere Rotation
          const startTime = Date.now();
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Sanfte Ease-out Funktion
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpoliere Azimuth
            const currentAzimuth = startAzimuth + azimuthDiff * easeProgress;
            let normalizedAzimuth = currentAzimuth;
            if (normalizedAzimuth < 0) normalizedAzimuth += 360;
            if (normalizedAzimuth >= 360) normalizedAzimuth -= 360;
            
            // Polar und Azimuth interpoliert setzen
            const currentPolar = startPolar + (targetPolar - startPolar) * easeProgress;
            
            modelViewer.setAttribute('camera-orbit', `${normalizedAzimuth}deg ${currentPolar}deg ${radius}m`);
            modelViewer.setAttribute('min-camera-orbit', `auto ${minPolar}deg auto`);
            modelViewer.setAttribute('max-camera-orbit', `auto ${maxPolar}deg auto`);
            
            currentAzimuthRef.current = normalizedAzimuth;
            currentPolarRef.current = currentPolar;
            
            if (progress < 1) {
              animationFrameRef.current = requestAnimationFrame(animate);
            } else {
              // Finale Position setzen
              currentAzimuthRef.current = targetAzimuth;
              currentPolarRef.current = targetPolar;
              modelViewer.setAttribute('camera-orbit', `${targetAzimuth}deg ${targetPolar}deg ${radius}m`);
              animationFrameRef.current = null;
            }
          };
          
          animate();
        } else {
          // Keine große Änderung, direkt setzen
          modelViewer.setAttribute('camera-orbit', `${targetAzimuth}deg ${targetPolar}deg ${radius}m`);
          modelViewer.setAttribute('min-camera-orbit', `auto ${minPolar}deg auto`);
          modelViewer.setAttribute('max-camera-orbit', `auto ${maxPolar}deg auto`);
          currentAzimuthRef.current = targetAzimuth;
          currentPolarRef.current = targetPolar;
        }
        
        // Leichte Neigung der Drohne selbst in Flugrichtung (nur wenn geflogen wird)
        if (isFlying && modelViewer.scene && targetDirection) {
          const scene = modelViewer.scene;
          scene.traverse((object: any) => {
            if (object.isGroup || object.isMesh) {
              // Berechne leichte Neigung basierend auf Flugrichtung
              // Rechts (x positiv): nach rechts neigen (positive Z-Rotation)
              // Links (x negativ): nach links neigen (negative Z-Rotation)
              // Vorwärts (z negativ): nach vorne neigen (negative X-Rotation)
              // Rückwärts (z positiv): nach hinten neigen (positive X-Rotation)
              
              const sideTilt = targetDirection.x * 8; // Maximal 8 Grad seitliche Neigung
              const forwardTilt = -targetDirection.z * 8; // Maximal 8 Grad vorne/hinten Neigung
              
              // Berechne Y-Rotation für Flugrichtung
              const direction = new THREE.Vector3(
                targetDirection.x,
                0,
                targetDirection.z
              ).normalize();
              const defaultForward = new THREE.Vector3(0, 0, -1);
              const yRotationQuat = new THREE.Quaternion().setFromUnitVectors(defaultForward, direction);
              const yRotationEuler = new THREE.Euler().setFromQuaternion(yRotationQuat);
              
              // Setze Rotation: X für vorne/hinten, Y für Flugrichtung, Z für seitlich
              const tiltedRotation = new THREE.Euler(
                forwardTilt * (Math.PI / 180), // X-Rotation: vorne/hinten Neigung
                yRotationEuler.y, // Y-Rotation: Flugrichtung
                sideTilt * (Math.PI / 180) // Z-Rotation: seitliche Neigung
              );
              object.quaternion.setFromEuler(tiltedRotation);
            }
          });
        } else if (modelViewer.scene) {
          // Wenn nicht geflogen, setze Rotation zurück (keine Neigung)
          const scene = modelViewer.scene;
          scene.traverse((object: any) => {
            if (object.isGroup || object.isMesh) {
              const currentRotation = new THREE.Euler().setFromQuaternion(object.quaternion);
              const neutralRotation = new THREE.Euler(
                0, // Keine X-Neigung
                currentRotation.y, // Y bleibt für Ausrichtung
                0 // Keine Z-Neigung
              );
              object.quaternion.setFromEuler(neutralRotation);
            }
          });
        }
      } catch (error) {
        console.log('camera-orbit konnte nicht gesetzt werden:', error);
      }
    }
    
    // Cleanup: Stoppe Animation beim Unmount
    return () => {
      if (animationFrameRef.current) {
        if (typeof animationFrameRef.current === 'number') {
          cancelAnimationFrame(animationFrameRef.current);
        } else {
          clearTimeout(animationFrameRef.current);
        }
      }
    };
  }, [scriptReady, isLoaded, targetDirection, isFlying]);

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
        top: '70%', // Etwas höher positioniert
        width: isMobile ? '180px' : '240px', // Auf mobil kleiner
        height: isMobile ? '180px' : '240px', // Auf mobil kleiner
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
