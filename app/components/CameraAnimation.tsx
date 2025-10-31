"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CameraAnimation({ 
  startAnimation,
  droneStartPos 
}: { 
  startAnimation: boolean;
  droneStartPos: [number, number, number];
}) {
  const startTime = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const hasStarted = useRef(false);
  const startPos = useRef(new THREE.Vector3(0, 30, 20));
  const droneStartPosition = useRef(new THREE.Vector3(droneStartPos[0], droneStartPos[1], droneStartPos[2]));
  
  // Endposition berechnen: Kamera mit Offset zur Drohnen-Startposition
  // Offset: (0, 7, 12) von der Drohne aus - genau wie in der DroneControls
  // ABER: Die Drohne ist bei y=2, also: (0, 2+7, 0+12) = (0, 9, 12)
  const endPos = useRef(new THREE.Vector3(
    droneStartPos[0] + 0,
    droneStartPos[1] + 7,
    droneStartPos[2] + 12
  ));

  useEffect(() => {
    if (startAnimation && !hasStarted.current) {
      hasStarted.current = true;
      isAnimating.current = true;
      startTime.current = Date.now();
      
      // Update endPos based on droneStartPos
      // EXAKT die gleiche Position wie die Kamera nach der Animation sein soll
      endPos.current.set(
        droneStartPos[0] + 0,
        droneStartPos[1] + 7,
        droneStartPos[2] + 12
      );
      droneStartPosition.current.set(droneStartPos[0], droneStartPos[1], droneStartPos[2]);
    }
  }, [startAnimation, droneStartPos]);

  useFrame(({ camera }) => {
    if (!startAnimation || !isAnimating.current || startTime.current === null) {
      return;
    }

    const elapsed = Date.now() - startTime.current;
    const duration = 2500; // 2.5 Sekunden Kamera-Animation
    const progress = Math.min(elapsed / duration, 1);

    // Smooth Easing (easeInOut)
    const easeProgress = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;

    // Interpoliere zwischen Start- und Endposition
    camera.position.lerpVectors(startPos.current, endPos.current, easeProgress);
    
    // Kamera schaut immer auf die Drohnen-Startposition mit Offset (wie in DroneControls)
    const lookAtTarget = droneStartPosition.current.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtTarget);
    
    if (progress >= 1) {
      // Animation abgeschlossen - setze Kamera auf Endposition
      // WICHTIG: Position muss exakt mit der normalen Kamera-Follow-Logik übereinstimmen
      camera.position.copy(endPos.current);
      
      // LookAt auf Drohnen-Position mit Offset für LookAt (wie in DroneControls)
      const lookAtTarget = droneStartPosition.current.clone().add(new THREE.Vector3(0, 1, 0));
      camera.lookAt(lookAtTarget);
      
      isAnimating.current = false;
      startTime.current = null;
      
      return;
    }
  });

  return null;
}
