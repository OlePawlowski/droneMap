"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CameraAnimation({ 
  startAnimation,
  droneStartPos,
  onComplete,
  onPhaseChange,
  onShowDrone
}: { 
  startAnimation: boolean;
  droneStartPos: [number, number, number];
  onComplete?: () => void;
  onPhaseChange?: (phase: 'logo' | 'drone') => void;
  onShowDrone?: () => void;
}) {
  const startTime = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const hasStarted = useRef(false);
  const phase = useRef<'logo' | 'drone'>('logo'); // Zwei Phasen: Logo und Drohne
  const droneShown = useRef(false); // Track ob Drohne bereits angezeigt wurde
  
  // Logo-Position in der Szene (aus ModernCity Komponente)
  const logoPos = useRef(new THREE.Vector3(8.0, 0.1, 5.0));
  
  // Startposition: Kamera aus Vogelperspektive genau über dem Logo
  const startPos = useRef(new THREE.Vector3(
    logoPos.current.x,      // Genau über dem Logo (x)
    logoPos.current.y + 8,  // 8 Einheiten über dem Logo
    logoPos.current.z       // Genau über dem Logo (z)
  ));
  
  // Logo-View-Position ist gleich Startposition (Kamera bleibt beim Logo während Laden)
  const logoViewPos = useRef(startPos.current.clone());
  
  const droneStartPosition = useRef(new THREE.Vector3(droneStartPos[0], droneStartPos[1], droneStartPos[2]));
  
  // Zwischenposition für professionelle Kamerafahrt (zeigt die Welt)
  const midPos = useRef(new THREE.Vector3(
    (logoPos.current.x + droneStartPos[0]) / 2 + 5,  // Etwas zur Seite für besseren Blick
    15,  // Höher für Überblick über die Welt
    (logoPos.current.z + droneStartPos[2]) / 2 + 8  // Weiter hinten
  ));
  
  // Endposition: Kamera mit Offset zur Drohnen-Startposition (hinter der Drohne, niedriger für Flug durch die Welt)
  const endPos = useRef(new THREE.Vector3(
    droneStartPos[0] + 0,
    droneStartPos[1] + 3,
    droneStartPos[2] + 8
  ));

  useEffect(() => {
    if (startAnimation && !hasStarted.current) {
      hasStarted.current = true;
      isAnimating.current = true;
      phase.current = 'logo';
      startTime.current = Date.now();
      droneShown.current = false; // Reset für neue Animation
      
      // Update endPos based on droneStartPos
      // Kamera endet hinter der Drohne (niedriger für Flug durch die Welt)
      endPos.current.set(
        droneStartPos[0] + 0,
        droneStartPos[1] + 3,
        droneStartPos[2] + 8
      );
      droneStartPosition.current.set(droneStartPos[0], droneStartPos[1], droneStartPos[2]);
      
      // Update midPos für professionelle Kamerafahrt
      midPos.current.set(
        (logoPos.current.x + droneStartPos[0]) / 2 + 5,
        15,
        (logoPos.current.z + droneStartPos[2]) / 2 + 8
      );
      
      // Logo-View-Position berechnen - Vogelperspektive genau über dem Logo
      logoViewPos.current.set(
        logoPos.current.x,      // Genau über dem Logo (x)
        logoPos.current.y + 8,  // 8 Einheiten über dem Logo
        logoPos.current.z       // Genau über dem Logo (z)
      );
      
      // Setze Startposition sofort, damit kein Sprung entsteht
      startPos.current.set(
        logoPos.current.x,
        logoPos.current.y + 8,
        logoPos.current.z
      );
    }
  }, [startAnimation, droneStartPos]);

  useFrame(({ camera }) => {
    if (!startAnimation || !isAnimating.current || startTime.current === null) {
      return;
    }

    const elapsed = Date.now() - startTime.current;
    
    if (phase.current === 'logo') {
      // Phase 1: Kamera bleibt beim Logo und schaut darauf (während Laden)
      // Kamera ist bereits korrekt positioniert im onCreated - KEINE Änderungen!
      // Einfach nichts tun, Kamera bleibt wie sie ist
      
      // Warte 2 Sekunden beim Logo, dann starte Phase 2
      if (elapsed >= 2000) {
        phase.current = 'drone';
        startTime.current = Date.now(); // Reset timer für Phase 2
        if (onPhaseChange) {
          onPhaseChange('drone');
        }
        // Zeige Drohne sofort zu Beginn der Bewegung zur Drohne
        if (!droneShown.current && onShowDrone) {
          droneShown.current = true;
          onShowDrone();
        }
      }
      return; // Früh zurückkehren, keine Kamera-Updates in Logo-Phase
    } else {
      // Phase 2: Entspannte, smooth Kamerafahrt vom Logo zur Drohne (4 Sekunden)
      const droneDuration = 4000;
      const droneProgress = Math.min(elapsed / droneDuration, 1);
      
      // Smooth Easing (easeInOut)
      const easeProgress = droneProgress < 0.5
        ? 2 * droneProgress * droneProgress
        : -1 + (4 - 2 * droneProgress) * droneProgress;
      
      // Direkte, smooth Bewegung vom Logo zur Drohne
      const targetPos = new THREE.Vector3().lerpVectors(startPos.current, endPos.current, easeProgress);
      camera.position.copy(targetPos);
      
      // Smooth Rotation: Von Logo zu Drohne schauen (niedrigerer LookAt für Flug durch die Welt)
      const logoLookTarget = logoPos.current.clone();
      const droneLookTarget = droneStartPosition.current.clone().add(new THREE.Vector3(0, 0.5, 0));
      const lookTarget = new THREE.Vector3().lerpVectors(logoLookTarget, droneLookTarget, easeProgress);
      camera.lookAt(lookTarget);
      
      // Drohne sollte bereits zu Beginn der Phase angezeigt werden (wird in Phase-Übergang gesetzt)
      
      if (droneProgress >= 1) {
        // Animation komplett abgeschlossen - setze exakte Position wie beim normalen Drohnen-Flug
        camera.position.copy(endPos.current);
        const lookAtPos = droneStartPosition.current.clone().add(new THREE.Vector3(0, 0.5, 0)); // Niedrigerer LookAt für Flug durch die Welt
        camera.lookAt(lookAtPos);
        
        isAnimating.current = false;
        startTime.current = null;
        
        // Rufe Callback auf, wenn vorhanden
        if (onComplete) {
          onComplete();
        }
      }
    }
  });

  return null;
}
