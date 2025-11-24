"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Cylinder, Sphere, Environment, ContactShadows, Line, useGLTF, useTexture } from "@react-three/drei";
import DroneOverlay from '../components/DroneOverlay';
import IntroAnimation from '../components/IntroAnimation';
import CameraAnimation from '../components/CameraAnimation';
import BuildingInfo from '../components/BuildingInfo';

function IntroDroneModel({ 
  onPositionUpdate 
}: { 
  onPositionUpdate: (pos: THREE.Vector3) => void;
}) {
  const droneRef = useRef<THREE.Group>(null);
  const endPos = useRef(new THREE.Vector3(0, 0.6, 7)); // Endposition - Drohne ist bereits hier

  useEffect(() => {
    if (droneRef.current) {
      // Setze Drohne direkt an ihre Startposition
      droneRef.current.position.copy(endPos.current);
      // Update Position für Overlay
      onPositionUpdate(endPos.current.clone());
    }
  }, [onPositionUpdate]);

  return <DroneModel droneRef={droneRef} initialPosition={endPos.current} />;
}

function DroneModel({ droneRef, initialPosition }: { droneRef: React.RefObject<THREE.Group | null>; initialPosition: THREE.Vector3 }) {
  // Setze initiale Position der Drohne nur EINMAL beim Mount
  const hasSetPosition = useRef(false);
  
  useEffect(() => {
    if (!hasSetPosition.current && droneRef.current) {
      droneRef.current.position.copy(initialPosition);
      hasSetPosition.current = true;
    }
  }, []); // Nur einmal beim Mount

  return (
    <group ref={droneRef}>
      {/* Platzhalter für die Drohne - wird als Overlay gerendert */}
      <mesh>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function DroneControls({ onPositionUpdate, onDirectionUpdate, disableCameraFollow }: { 
  onPositionUpdate: (pos: THREE.Vector3, rot: THREE.Quaternion) => void;
  onDirectionUpdate: (dir: THREE.Vector3, flying: boolean) => void;
  disableCameraFollow?: boolean;
}) {
  const droneRef = useRef<THREE.Group>(null);
  const { size, camera } = useThree();
  const [targetDir, setTargetDir] = useState(new THREE.Vector3(0, 0, -1));
  const smoothedTargetDir = useRef(new THREE.Vector3(0, 0, -1));
  const [isFlying, setIsFlying] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastDirectionUpdate = useRef(0);

  // Prüfe ob mobile Gerät
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!droneRef.current) return;
      
      // Throttle: Nur alle 16ms aktualisieren (~60fps)
      const now = performance.now();
      if (now - lastDirectionUpdate.current < 16) return;
      lastDirectionUpdate.current = now;
  
      const centerX = size.width / 2;
      const centerY = size.height / 2;
  
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
  
      const direction = new THREE.Vector3(dx * 0.01, 0, dy * 0.01).normalize();
      setTargetDir(direction);
  
      if (isSpacePressed) {
        setIsFlying(true);
        onDirectionUpdate(direction, true);
      } else {
        setIsFlying(false);
        onDirectionUpdate(direction, false);
      }
    };
  
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // nur linke Maustaste
      e.preventDefault();
      setIsSpacePressed(true);
      setIsFlying(true);
      if (targetDir) {
        onDirectionUpdate(targetDir, true);
      }
    };
  
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      setIsSpacePressed(false);
      setIsFlying(false);
      if (targetDir) {
        onDirectionUpdate(targetDir, false);
      }
    };
  
    // Touch-Unterstützung (z. B. auf Smartphones)
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsSpacePressed(true);
      setIsFlying(true);
      if (targetDir) {
        onDirectionUpdate(targetDir, true);
      }
    };
  
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsSpacePressed(false);
      setIsFlying(false);
      if (targetDir) {
        onDirectionUpdate(targetDir, false);
      }
    };
    
    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      setIsSpacePressed(false);
      setIsFlying(false);
      if (targetDir) {
        onDirectionUpdate(targetDir, false);
      }
    };

    // Während der Finger aufliegt: Richtung kontinuierlich aktualisieren
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!droneRef.current) return;

      // WICHTIG: Nur wenn Finger noch auf Display ist (e.touches.length > 0)
      if (e.touches.length === 0) {
        setIsSpacePressed(false);
        setIsFlying(false);
        if (targetDir) {
          onDirectionUpdate(targetDir, false);
        }
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        setIsSpacePressed(false);
        setIsFlying(false);
        return;
      }

      // Throttle: Nur alle 16ms aktualisieren (~60fps)
      const now = performance.now();
      if (now - lastDirectionUpdate.current < 16) return;
      lastDirectionUpdate.current = now;

      const centerX = size.width / 2;
      const centerY = size.height / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;

      const direction = new THREE.Vector3(dx * 0.01, 0, dy * 0.01).normalize();
      setTargetDir(direction);

      // Nur fliegen wenn Finger noch gedrückt ist
      if (isSpacePressed && e.touches.length > 0) {
        setIsFlying(true);
        onDirectionUpdate(direction, true);
      } else {
        setIsSpacePressed(false);
        setIsFlying(false);
        onDirectionUpdate(direction, false);
      }
    };
  
    // Nur Maus-Events auf Desktop-Geräten
    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
    }
    
    // Nur Touch-Events auf mobilen Geräten
    if (isMobile) {
      window.addEventListener("touchstart", handleTouchStart, { passive: false });
      window.addEventListener("touchend", handleTouchEnd, { passive: false });
      window.addEventListener("touchcancel", handleTouchCancel, { passive: false });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
  
    return () => {
      if (!isMobile) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
      }
      if (isMobile) {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchcancel", handleTouchCancel);
        window.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [size, targetDir, isSpacePressed, isMobile]);
  
  useFrame((_, delta) => {
    if (!droneRef.current) return;

    const moveSpeed = 4 * delta;
    const rotationSpeed = 0.08; // Etwas langsamer für weniger Zittern
    const smoothingFactor = 0.15; // Dämpfung für die Zielrichtung

    // Geglättete Zielrichtung berechnen (reduziert Zittern)
    if (targetDir) {
      smoothedTargetDir.current.lerp(targetDir, smoothingFactor);
      
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          smoothedTargetDir.current,
          new THREE.Vector3(0, 1, 0)
        )
      );
      // Langsamere Rotation für realistischeres Verhalten
      droneRef.current.quaternion.slerp(targetQuat, rotationSpeed);
    }


    // Nur fliegen wenn Maustaste gedrückt ist UND nicht während Intro
    if (isFlying && smoothedTargetDir.current && !disableCameraFollow) {
      // Direkt zur geglätteten Zielrichtung fliegen (reduziert Zittern)
      const moveDirection = smoothedTargetDir.current.clone();
      moveDirection.y = 0; // Nur horizontale Bewegung
      
      const move = moveDirection.clone().multiplyScalar(moveSpeed);
      droneRef.current.position.add(move);
    }

    // Position und Rotation an Overlay weitergeben
    onPositionUpdate(droneRef.current.position, droneRef.current.quaternion);

    // Kamera-Follow nur wenn nicht während Intro
    if (!disableCameraFollow) {
      const camDistance = 8; // Näher an der Drohne
      const camHeight = 3; // Niedriger für Flug durch die Welt statt darüber
      
      const dronePos = droneRef.current.position.clone();
      const camOffset = new THREE.Vector3(0, camHeight, camDistance);
      const targetCamPos = dronePos.clone().add(camOffset);
      
      // Smooth Follow immer
      camera.position.lerp(targetCamPos, 0.05);
      const lookAtPos = dronePos.clone().add(new THREE.Vector3(0, 0.5, 0)); // Niedrigerer LookAt für Flug durch die Welt
      camera.lookAt(lookAtPos);
    }
  });

  return <DroneModel droneRef={droneRef} initialPosition={new THREE.Vector3(0, 0.6, 7)} />;
}

function Terrain() {
  return (
    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 1, 1]} />
      <meshStandardMaterial 
        color="#000000"
        roughness={0.2}
        metalness={0.7}
        emissive="#000000"
        emissiveIntensity={0}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

function ModernCity() {
  // 3D-Logo laden
  const { scene } = useGLTF('/logo.glb');
  const logoRef = useRef<THREE.Group>(null);
  const logoMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  
  const logoRefMemo = useMemo(() => {
    const cloned = scene.clone();
    
    // Logo noch kleiner machen
    cloned.scale.setScalar(0.35);
    
    // Logo auf Boden positionieren (bei Gebäude-1-Position)
    cloned.position.set(0, 0, 6);
    
    // Logo horizontal ausrichten
    cloned.rotation.x = -Math.PI / 2;
    
    // Logo um Y-Achse neigen (über Z-Achse), damit linke Seite angehoben wird
    cloned.rotation.y = -(5.5 * Math.PI / 180); // 5.5 Grad neigen (linke Seite höher)
    
    // Materialien wie die Gebäude einfärben (Gold/Orange) und für Animation speichern
    logoMaterialsRef.current = [];
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange wie die Gebäude
              mat.metalness = 0.5;
              mat.roughness = 0.3;
              mat.emissive = new THREE.Color(0x1a1a0a);
              mat.emissiveIntensity = 0.05;
              mat.envMapIntensity = 1.0;
              mat.needsUpdate = true;
              logoMaterialsRef.current.push(mat);
            }
          });
        } else {
          const mat = child.material;
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange wie die Gebäude
            mat.metalness = 0.5;
            mat.roughness = 0.3;
            mat.emissive = new THREE.Color(0x1a1a0a);
            mat.emissiveIntensity = 0.05;
            mat.envMapIntensity = 1.0;
            mat.needsUpdate = true;
            logoMaterialsRef.current.push(mat);
          }
        }
      }
    });
    
    return cloned;
  }, [scene]);
  
  // Logo-Effekt: Sanftes Pulsieren und Leuchten
  useFrame(() => {
    const time = Date.now() * 0.001;
    const pulse = 0.1 + Math.sin(time * 1.5) * 0.05; // Sanftes Pulsieren
    
    logoMaterialsRef.current.forEach((mat) => {
      mat.emissiveIntensity = pulse;
    });
    
    // Leichtes Schwebeeffekt
    if (logoRef.current) {
      logoRef.current.position.y = 0 + Math.sin(time * 0.8) * 0.02;
    }
  });
  
  return (
    <group>
      {/* 3D-Logo mit Ref für Animation */}
      <primitive ref={logoRef} object={logoRefMemo} />
      
      {/* Ladebalken unter dem Logo */}
      <LoadingBar position={[0, -0.12, 6]} />
      
      {/* Sanftes Punktlicht über dem Logo */}
      <pointLight
        position={[0, 4, 6]}
        color="#ffb344"
        intensity={2.5}
        distance={12}
        decay={2}
      />
    </group>
  );
}

function LoadingBar({ position }: { position: [number, number, number] }) {
  const progressRef = useRef(0);
  const barRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  
  useFrame(() => {
    // Lade-Progress basierend auf verstrichener Zeit
    const elapsed = Date.now() - startTime.current;
    const totalDuration = 4000; // 4 Sekunden für vollständiges Laden
    progressRef.current = Math.min(elapsed / totalDuration, 1);
    
    if (barRef.current) {
      const material = barRef.current.material as THREE.MeshStandardMaterial;
      // Pulsierendes Leuchten während des Ladens
      const pulse = 0.4 + Math.sin(Date.now() * 0.008) * 0.15;
      material.emissiveIntensity = pulse;
    }
  });
  
  const barWidth = 3.5; // Etwas schmaler, passend zum Logo
  const barHeight = 0.08;
  
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Hintergrund des Ladebalkens */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshStandardMaterial 
          color="#0a0a0a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ladebalken selbst */}
      <mesh ref={barRef} position={[-barWidth / 2 + (barWidth * progressRef.current) / 2, 0.015, 0]}>
        <planeGeometry args={[barWidth * progressRef.current, barHeight * 0.9]} />
        <meshStandardMaterial 
          color="#ffb344"
          emissive="#ffb344"
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
    </group>
  );
}

function MarkerTower() {
  // Großer Tower als Marker zum Finden der richtigen Stelle
  return (
    <group position={[-2.5, 0, 2]}>
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 10, 2]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* Leuchtende Spitze */}
      <mesh position={[0, 10.5, 0]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial 
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={1.0}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

function PlaceholderBuildings() {
  // Platzhaltergebäude für leere Bereiche - komplexeres Design, kleiner, weniger orange
  const buildings = useMemo(() => {
    const buildingList: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    // Bereiche, die bereits belegt sind (mit größerem Puffer)
    const occupiedAreas: Array<{ x: number; z: number; radius: number }> = [
      { x: 8.0, z: 7, radius: 3 },        // Gebäude 1 (mit größerem Puffer, weniger eingekesselt)
      { x: 9.39, z: -9.2, radius: 4 },  // Gebäude 2 (mit Puffer)
      { x: 0, z: 6, radius: 2.5 },    // Logo (mit moderatem Puffer - Mittelwert)
      { x: -8, z: 0, radius: 6 },       // Hafen/Brücke (mit Puffer)
      { x: -8, z: 6, radius: 3 },       // Boot (mit Puffer)
      { x: 8.0, z: 7, radius: 3 },        // Plaza (mit größerem Puffer, bei Gebäude 1)
    ];
    
    // Container-Bereiche
    for (let x = -2; x <= 2; x += 2) {
      for (let z = -2; z <= -0.8; z += 1.2) {
        occupiedAreas.push({ x, z, radius: 1.5 });
      }
    }
    
    // Prüfe ob Position frei ist
    const isPositionFree = (x: number, z: number, radius: number) => {
      // Keine Gebäude auf dem Wasser (Hafen-Bereich)
      const waterArea = { x: -8, z: 0, width: 8.4, depth: 24 };
      const isOnWater = Math.abs(x - waterArea.x) < waterArea.width / 2 && 
                        Math.abs(z - waterArea.z) < waterArea.depth / 2;
      if (isOnWater) return false;
      
      return !occupiedAreas.some(area => {
        const dist = Math.sqrt((x - area.x) ** 2 + (z - area.z) ** 2);
        // Für Gebäude vor Gebäude 1 (z > 9, x um 8.0): lockerer Puffer
        if (z > 9 && Math.abs(x - 8.0) < 5) {
          return dist < (area.radius + radius + 0.3); // Sehr kleiner Puffer für diesen Bereich
        }
        return dist < (area.radius + radius + 1); // Extra Puffer für andere Bereiche
      });
    };
    
    // Zusätzliche Gebäude hinter Gebäude 1 (bei z < 8, also hinter dem Gebäude)
    const buildingsBehindBuilding1: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed2 = 54321; // Anderer Seed für hinter-Gebäude-1
    const random2 = () => {
      seed2 = (seed2 * 9301 + 49297) % 233280;
      return seed2 / 233280;
    };
    
    // Generiere Gebäude hinter Gebäude 1 (z < 8, x zwischen -4 und 4) - reduzierte Dichte
    for (let z = 2; z <= 6; z += 2.0) {
      for (let x = -3; x <= 3; x += 2.0) {
        const offsetX = (random2() - 0.5) * 0.1; // Reduzierter Offset für ordentlichere Anordnung
        const offsetZ = (random2() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo und Gebäude-1 explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        const tooCloseToBuilding1 = Math.sqrt((posX - 8.0) ** 2 + (posZ - 7) ** 2) < 3.0; // Größerer Abstand
        
        // Liegende Gebäude: breiter/flacher statt hoch
        const baseWidth = 0.8 + random2() * 1.2;
        const baseDepth = 0.8 + random2() * 1.2;
        const baseHeight = 0.4 + random2() * 0.8; // Viel niedriger
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo && !tooCloseToBuilding1) {
          const numParts = random2() > 0.5 ? 2 : (random2() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random2() * 0.6);
            const partDepth = baseDepth * (0.7 + random2() * 0.6);
            const partHeight = baseHeight * (0.8 + random2() * 0.4);
            const partOffsetX = (random2() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random2() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBehindBuilding1.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Generiere Gebäude in einem Grid
    const gridSize = 2.5; // Abstand
    const mapSize = 12; // Größe der Karte
    
    // Seed-basierter Zufallsgenerator für konsistente Werte
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    for (let x = -mapSize; x <= mapSize; x += gridSize) {
      for (let z = -mapSize; z <= mapSize; z += gridSize) {
        // Keine zufälligen Offsets für strukturiertere Anordnung
        const posX = x;
        const posZ = z;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Liegende Gebäude: breiter/flacher statt hoch
        const baseWidth = 0.7 + random() * 1.0;
        const baseDepth = 0.7 + random() * 1.0;
        const baseHeight = 0.4 + random() * 0.9; // Viel niedriger
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          // Komplexeres Design: mehrere Teile pro Gebäude
          const numParts = random() > 0.5 ? 2 : (random() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random() * 0.6);
            const partDepth = baseDepth * (0.7 + random() * 0.6);
            const partHeight = baseHeight * (0.8 + random() * 0.4);
            const partOffsetX = (random() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingList.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude in der Mitte hinten (mehr Dichte)
    const buildingsCenterBack: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed3 = 98765; // Anderer Seed für Mitte hinten
    const random3 = () => {
      seed3 = (seed3 * 9301 + 49297) % 233280;
      return seed3 / 233280;
    };
    
    // Generiere mehr Gebäude in der Mitte hinten (z zwischen 0 und 6, x zwischen -2 und 2)
    for (let z = 0; z <= 6; z += 1.2) {
      for (let x = -2; x <= 2; x += 1.2) {
        const offsetX = (random3() - 0.5) * 0.1; // Reduzierter Offset
        const offsetZ = (random3() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random3() * 1.0;
        const baseDepth = 0.7 + random3() * 1.0;
        const baseHeight = 0.4 + random3() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          const numParts = random3() > 0.5 ? 2 : (random3() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random3() * 0.6);
            const partDepth = baseDepth * (0.7 + random3() * 0.6);
            const partHeight = baseHeight * (0.8 + random3() * 0.4);
            const partOffsetX = (random3() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random3() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsCenterBack.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude zwischen Gebäude 1 (z=8) und Mitte (z=0)
    const buildingsBetweenBuilding1AndCenter: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed4 = 11111; // Anderer Seed für zwischen Gebäude 1 und Mitte
    const random4 = () => {
      seed4 = (seed4 * 9301 + 49297) % 233280;
      return seed4 / 233280;
    };
    
    // Generiere Gebäude zwischen Gebäude 1 (z=8) und Mitte (z=0) - größerer Bereich nach links
    // Reduziert zwischen Logo (z=6) und Gebäude-1 (z=7)
    for (let z = 0.5; z <= 7.5; z += 1.0) {
      for (let x = -7; x <= 4; x += 1.0) {
        // Überspringe den Bereich zwischen Logo (z=6) und Gebäude-1 (z=7) - weniger Dichte
        const isBetweenLogoAndBuilding1 = z >= 5.8 && z <= 7.2 && x >= 0 && x <= 8;
        if (isBetweenLogoAndBuilding1 && random4() > 0.3) continue; // 70% weniger Gebäude in diesem Bereich
        
        // Keine Offsets für strukturiertere Anordnung
        const posX = x;
        const posZ = z;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Gebäude-1 vermeiden
        const tooCloseToBuilding1 = Math.sqrt((posX - 8.0) ** 2 + (posZ - 7) ** 2) < 2.5;
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random4() * 1.0;
        const baseDepth = 0.7 + random4() * 1.0;
        const baseHeight = 0.4 + random4() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo && !tooCloseToBuilding1) {
          const numParts = 1; // Einfacher für Struktur
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth;
            const partDepth = baseDepth;
            const partHeight = baseHeight;
            const partOffsetX = 0;
            const partOffsetZ = 0;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBetweenBuilding1AndCenter.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude links von der Mitte
    const buildingsLeftOfCenter: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed5 = 22222; // Anderer Seed für links von Mitte
    const random5 = () => {
      seed5 = (seed5 * 9301 + 49297) % 233280;
      return seed5 / 233280;
    };
    
    // Generiere Gebäude links von der Mitte (x < 0, z um 0)
    for (let z = -2; z <= 2; z += 1.0) {
      for (let x = -6; x <= -1; x += 1.0) {
        const offsetX = (random5() - 0.5) * 0.1; // Reduzierter Offset
        const offsetZ = (random5() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random5() * 1.0;
        const baseDepth = 0.7 + random5() * 1.0;
        const baseHeight = 0.4 + random5() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          const numParts = random5() > 0.5 ? 2 : (random5() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random5() * 0.6);
            const partDepth = baseDepth * (0.7 + random5() * 0.6);
            const partHeight = baseHeight * (0.8 + random5() * 0.4);
            const partOffsetX = (random5() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random5() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsLeftOfCenter.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude zwischen Gebäude 1 und Hälfte auf der linken Seite
    const buildingsLeftBetweenBuilding1AndHalf: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed6 = 33333; // Anderer Seed für links zwischen Gebäude 1 und Hälfte
    const random6 = () => {
      seed6 = (seed6 * 9301 + 49297) % 233280;
      return seed6 / 233280;
    };
    
    // Generiere Gebäude zwischen Gebäude 1 (z=8) und Hälfte (z=4) auf der linken Seite (x < 0)
    // Reduziert zwischen Logo (z=6) und Gebäude-1 (z=7)
    for (let z = 4; z <= 7; z += 1.0) {
      for (let x = -6; x <= -1; x += 1.0) {
        // Reduziere Dichte zwischen Logo und Gebäude-1
        const isBetweenLogoAndBuilding1 = z >= 5.8 && z <= 7.2;
        if (isBetweenLogoAndBuilding1 && random6() > 0.4) continue; // 60% weniger Gebäude in diesem Bereich
        
        const offsetX = (random6() - 0.5) * 0.1; // Reduzierter Offset
        const offsetZ = (random6() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random6() * 1.0;
        const baseDepth = 0.7 + random6() * 1.0;
        const baseHeight = 0.4 + random6() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          const numParts = random6() > 0.5 ? 2 : (random6() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random6() * 0.6);
            const partDepth = baseDepth * (0.7 + random6() * 0.6);
            const partHeight = baseHeight * (0.8 + random6() * 0.4);
            const partOffsetX = (random6() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random6() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsLeftBetweenBuilding1AndHalf.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude zwischen Wasser und horizontaler Mitte
    const buildingsBetweenWaterAndCenter: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed7 = 44444; // Anderer Seed für zwischen Wasser und Mitte
    const random7 = () => {
      seed7 = (seed7 * 9301 + 49297) % 233280;
      return seed7 / 233280;
    };
    
    // Generiere Gebäude zwischen Wasser (x=-8) und horizontaler Mitte (x=0)
    for (let x = -7; x <= -1; x += 1.0) {
      for (let z = -3; z <= 3; z += 1.0) {
        const offsetX = (random7() - 0.5) * 0.1; // Reduzierter Offset
        const offsetZ = (random7() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random7() * 1.0;
        const baseDepth = 0.7 + random7() * 1.0;
        const baseHeight = 0.4 + random7() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          const numParts = random7() > 0.5 ? 2 : (random7() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random7() * 0.6);
            const partDepth = baseDepth * (0.7 + random7() * 0.6);
            const partHeight = baseHeight * (0.8 + random7() * 0.4);
            const partOffsetX = (random7() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random7() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBetweenWaterAndCenter.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude vor Gebäude 1 (bei x=8.0, z zwischen 9 und 10 - weiter vorne)
    const buildingsBeforeBuilding1: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed8 = 55555; // Anderer Seed für vor Gebäude 1
    const random8 = () => {
      seed8 = (seed8 * 9301 + 49297) % 233280;
      return seed8 / 233280;
    };
    
    // Generiere Gebäude vor Gebäude 1 (bei x weiter nach links, z zwischen 9.5 und 10.5)
    // Zwei zusätzliche Gebäude davor (eines links von Gebäude 1, kleiner)
    const additionalBuildings = [
      { x: 6.0, z: 9.8 },  // Links von Gebäude 1 (kleiner)
      { x: 8.5, z: 10.2 }
    ];
    
    additionalBuildings.forEach((pos, index) => {
      const offsetX = (random8() - 0.5) * 0.2;
      const offsetZ = (random8() - 0.5) * 0.2;
      const posX = pos.x + offsetX;
      const posZ = pos.z + offsetZ;
      
      // Links von Gebäude 1 (index 0): kleiner
      const isLeftOfBuilding1 = index === 0;
      const baseWidth = isLeftOfBuilding1 ? (0.3 + random8() * 0.4) : (0.5 + random8() * 0.7);
      const baseDepth = isLeftOfBuilding1 ? (0.3 + random8() * 0.4) : (0.5 + random8() * 0.7);
      const baseHeight = isLeftOfBuilding1 ? (0.2 + random8() * 0.4) : (0.3 + random8() * 0.6);
      const radius = Math.max(baseWidth, baseDepth) / 2;
      
      // Logo vermeiden - strenger
      const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
      
      if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
        const numParts = random8() > 0.5 ? 2 : (random8() > 0.3 ? 3 : 1);
        const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
        
        for (let p = 0; p < numParts; p++) {
          const partWidth = baseWidth * (0.7 + random8() * 0.6);
          const partDepth = baseDepth * (0.7 + random8() * 0.6);
          const partHeight = baseHeight * (0.8 + random8() * 0.4);
          const partOffsetX = (random8() - 0.5) * baseWidth * 0.5;
          const partOffsetZ = (random8() - 0.5) * baseDepth * 0.5;
          
          parts.push({
            width: partWidth,
            depth: partDepth,
            height: partHeight,
            offsetX: partOffsetX,
            offsetZ: partOffsetZ
          });
        }
        
        buildingsBeforeBuilding1.push({ x: posX, z: posZ, parts });
      }
    });
    
    // Weitere Gebäude vor Gebäude 1 (bei x weiter nach links, z zwischen 9.5 und 11 - weiter vorne, weniger dicht)
    // Reduzierte Dichte - größere Schrittweiten
    for (let z = 9.5; z <= 11.0; z += 1.8) {
      for (let x = 5.0; x <= 10.0; x += 1.8) {
        const offsetX = (random8() - 0.5) * 0.1; // Reduzierter Offset für ordentlichere Anordnung
        const offsetZ = (random8() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Liegende Gebäude - kleiner
        const baseWidth = 0.4 + random8() * 0.6;
        const baseDepth = 0.4 + random8() * 0.6;
        const baseHeight = 0.25 + random8() * 0.5;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        // Prüfe explizit, dass es nicht zu nah an Gebäude 1 oder Logo ist
        const tooCloseToBuilding1 = Math.sqrt((posX - 8.0) ** 2 + (posZ - 7) ** 2) < 2.5; // Größerer Abstand
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5; // Logo vermeiden
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToBuilding1 && !tooCloseToLogo) {
          const numParts = random8() > 0.5 ? 2 : (random8() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random8() * 0.6);
            const partDepth = baseDepth * (0.7 + random8() * 0.6);
            const partHeight = baseHeight * (0.8 + random8() * 0.4);
            const partOffsetX = (random8() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random8() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBeforeBuilding1.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude links von Gebäude 1
    const buildingsLeftOfBuilding1: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed9 = 66666; // Anderer Seed für links von Gebäude 1
    const random9 = () => {
      seed9 = (seed9 * 9301 + 49297) % 233280;
      return seed9 / 233280;
    };
    
    // Generiere Gebäude links von Gebäude 1 (x < 0, z um 8) - reduzierte Dichte
    for (let z = 6; z <= 10; z += 1.5) {
      for (let x = -6; x <= -1; x += 1.5) {
        const offsetX = (random9() - 0.5) * 0.1; // Reduzierter Offset
        const offsetZ = (random9() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Logo und Gebäude-1 explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        const tooCloseToBuilding1 = Math.sqrt((posX - 8.0) ** 2 + (posZ - 7) ** 2) < 3.0; // Größerer Abstand
        
        // Liegende Gebäude
        const baseWidth = 0.7 + random9() * 1.0;
        const baseDepth = 0.7 + random9() * 1.0;
        const baseHeight = 0.4 + random9() * 0.8;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo && !tooCloseToBuilding1) {
          const numParts = random9() > 0.5 ? 2 : (random9() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random9() * 0.6);
            const partDepth = baseDepth * (0.7 + random9() * 0.6);
            const partHeight = baseHeight * (0.8 + random9() * 0.4);
            const partOffsetX = (random9() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random9() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsLeftOfBuilding1.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Füge Gebäude hinter Gebäude 1 hinzu
    buildingList.push(...buildingsBehindBuilding1);
    // Füge Gebäude in der Mitte hinten hinzu
    buildingList.push(...buildingsCenterBack);
    // Füge Gebäude zwischen Gebäude 1 und Mitte hinzu
    buildingList.push(...buildingsBetweenBuilding1AndCenter);
    // Füge Gebäude links von der Mitte hinzu
    buildingList.push(...buildingsLeftOfCenter);
    // Füge Gebäude zwischen Gebäude 1 und Hälfte auf der linken Seite hinzu
    buildingList.push(...buildingsLeftBetweenBuilding1AndHalf);
    // Füge Gebäude zwischen Wasser und horizontaler Mitte hinzu
    buildingList.push(...buildingsBetweenWaterAndCenter);
    // Zusätzliche Gebäude bei [-2.5, 0, 2] (Marker-Position)
    const buildingsAtMarkerPosition: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed10 = 77777; // Anderer Seed für Marker-Position
    const random10 = () => {
      seed10 = (seed10 * 9301 + 49297) % 233280;
      return seed10 / 233280;
    };
    
    // Generiere Gebäude um die Marker-Position [-2.5, 0, 2] - weniger Gebäude
    for (let z = 0; z <= 4; z += 2.5) {
      for (let x = -3.5; x <= -1.5; x += 2.5) {
        const offsetX = (random10() - 0.5) * 0.3;
        const offsetZ = (random10() - 0.5) * 0.3;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        // Sehr flache, liegende Gebäude
        const baseWidth = 0.7 + random10() * 1.0;
        const baseDepth = 0.7 + random10() * 1.0;
        const baseHeight = 0.2 + random10() * 0.4; // Viel niedriger
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        // Prüfe nur Wasser, nicht andere Objekte (kleinerer Puffer für diesen Bereich)
        const waterArea = { x: -8, z: 0, width: 8.4, depth: 24 };
        const isOnWater = Math.abs(posX - waterArea.x) < waterArea.width / 2 && 
                          Math.abs(posZ - waterArea.z) < waterArea.depth / 2;
        
        // Prüfe nur kritische Kollisionen (Logo und Gebäude 1)
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        const tooCloseToBuilding1 = Math.sqrt((posX - 8.0) ** 2 + (posZ - 7) ** 2) < 3;
        const tooCloseToDroneStart = Math.sqrt((posX - 0) ** 2 + (posZ - 7) ** 2) < 1.5; // Drohnen-Startposition vermeiden
        
        if (!isOnWater && !tooCloseToLogo && !tooCloseToBuilding1 && !tooCloseToDroneStart) {
          const numParts = random10() > 0.5 ? 2 : (random10() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random10() * 0.6);
            const partDepth = baseDepth * (0.7 + random10() * 0.6);
            const partHeight = baseHeight * (0.8 + random10() * 0.4);
            const partOffsetX = (random10() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random10() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsAtMarkerPosition.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Gebäude vor dem Logo (zwischen Logo z=6 und Drohnen-Start z=7)
    const buildingsBeforeLogo: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed12 = 99999;
    const random12 = () => {
      seed12 = (seed12 * 9301 + 49297) % 233280;
      return seed12 / 233280;
    };
    
    // Generiere Gebäude vor dem Logo (z zwischen 6.3 und 6.9, weiter vom Logo entfernt)
    for (let z = 6.3; z <= 6.9; z += 0.4) {
      for (let x = -5; x <= 5; x += 0.8) {
        const offsetX = (random12() - 0.5) * 0.1; // Reduzierter Offset für ordentlichere Anordnung
        const offsetZ = (random12() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        const baseWidth = 0.5 + random12() * 0.9;
        const baseDepth = 0.5 + random12() * 0.9;
        const baseHeight = 0.3 + random12() * 0.6;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        // Logo und Drohnen-Start explizit vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5; // Logo vermeiden
        const tooCloseToDroneStart = Math.sqrt((posX - 0) ** 2 + (posZ - 7) ** 2) < 1.5; // Drohnen-Start vermeiden
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo && !tooCloseToDroneStart) {
          const numParts = random12() > 0.5 ? 2 : (random12() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random12() * 0.6);
            const partDepth = baseDepth * (0.7 + random12() * 0.6);
            const partHeight = baseHeight * (0.8 + random12() * 0.4);
            const partOffsetX = (random12() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random12() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBeforeLogo.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zusätzliche Gebäude weiter vor dem Logo (z zwischen 7.2 und 8.5)
    for (let z = 7.2; z <= 8.5; z += 0.5) {
      for (let x = -5; x <= 5; x += 0.9) {
        const offsetX = (random12() - 0.5) * 0.1;
        const offsetZ = (random12() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        const baseWidth = 0.5 + random12() * 0.9;
        const baseDepth = 0.5 + random12() * 0.9;
        const baseHeight = 0.3 + random12() * 0.6;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        // Logo und Drohnen-Start vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        const tooCloseToDroneStart = Math.sqrt((posX - 0) ** 2 + (posZ - 7) ** 2) < 1.5;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo && !tooCloseToDroneStart) {
          const numParts = random12() > 0.5 ? 2 : (random12() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random12() * 0.6);
            const partDepth = baseDepth * (0.7 + random12() * 0.6);
            const partHeight = baseHeight * (0.8 + random12() * 0.4);
            const partOffsetX = (random12() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random12() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBeforeLogo.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Gebäude hinter dem Logo (z zwischen 3.5 und 5.5)
    for (let z = 3.5; z <= 5.5; z += 0.4) {
      for (let x = -5; x <= 5; x += 0.8) {
        const offsetX = (random12() - 0.5) * 0.1;
        const offsetZ = (random12() - 0.5) * 0.1;
        const posX = x + offsetX;
        const posZ = z + offsetZ;
        
        const baseWidth = 0.5 + random12() * 0.9;
        const baseDepth = 0.5 + random12() * 0.9;
        const baseHeight = 0.3 + random12() * 0.6;
        const radius = Math.max(baseWidth, baseDepth) / 2;
        
        // Logo vermeiden
        const tooCloseToLogo = Math.sqrt((posX - 0) ** 2 + (posZ - 6) ** 2) < 2.5;
        
        if (isPositionFree(posX, posZ, radius) && !tooCloseToLogo) {
          const numParts = random12() > 0.5 ? 2 : (random12() > 0.3 ? 3 : 1);
          const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
          
          for (let p = 0; p < numParts; p++) {
            const partWidth = baseWidth * (0.7 + random12() * 0.6);
            const partDepth = baseDepth * (0.7 + random12() * 0.6);
            const partHeight = baseHeight * (0.8 + random12() * 0.4);
            const partOffsetX = (random12() - 0.5) * baseWidth * 0.5;
            const partOffsetZ = (random12() - 0.5) * baseDepth * 0.5;
            
            parts.push({
              width: partWidth,
              depth: partDepth,
              height: partHeight,
              offsetX: partOffsetX,
              offsetZ: partOffsetZ
            });
          }
          
          buildingsBeforeLogo.push({ x: posX, z: posZ, parts });
        }
      }
    }
    
    // Zwei kleine Gebäude weiter rechts (zur Mitte)
    const smallBuildingsRight: Array<{ 
      x: number; 
      z: number; 
      parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }>;
    }> = [];
    
    let seed11 = 88888;
    const random11 = () => {
      seed11 = (seed11 * 9301 + 49297) % 233280;
      return seed11 / 233280;
    };
    
    // Zwei kleine Gebäude bei x=0 bis 1, z=1 bis 3
    const positions = [
      { x: 0.5, z: 1.5 },
      { x: 0, z: 2.5 }
    ];
    
    positions.forEach((pos) => {
      const baseWidth = 0.7 + random11() * 0.8;
      const baseDepth = 0.7 + random11() * 0.8;
      const baseHeight = 0.3 + random11() * 0.5;
      
      const waterArea = { x: -8, z: 0, width: 8.4, depth: 24 };
      const isOnWater = Math.abs(pos.x - waterArea.x) < waterArea.width / 2 && 
                        Math.abs(pos.z - waterArea.z) < waterArea.depth / 2;
      const tooCloseToLogo = Math.sqrt((pos.x - 0) ** 2 + (pos.z - 6) ** 2) < 2.5;
      const tooCloseToBuilding1 = Math.sqrt((pos.x - 8.0) ** 2 + (pos.z - 7) ** 2) < 3;
      const tooCloseToDroneStart = Math.sqrt((pos.x - 0) ** 2 + (pos.z - 7) ** 2) < 1.5; // Drohnen-Startposition vermeiden
      
      if (!isOnWater && !tooCloseToLogo && !tooCloseToBuilding1 && !tooCloseToDroneStart) {
        const numParts = 2; // Komplexere kleine Gebäude mit 2 Teilen
        const parts: Array<{ width: number; depth: number; height: number; offsetX: number; offsetZ: number }> = [];
        
        for (let p = 0; p < numParts; p++) {
          const partWidth = baseWidth * (0.7 + random11() * 0.6);
          const partDepth = baseDepth * (0.7 + random11() * 0.6);
          const partHeight = baseHeight * (0.8 + random11() * 0.4);
          const partOffsetX = (random11() - 0.5) * baseWidth * 0.5;
          const partOffsetZ = (random11() - 0.5) * baseDepth * 0.5;
          
          parts.push({
            width: partWidth,
            depth: partDepth,
            height: partHeight,
            offsetX: partOffsetX,
            offsetZ: partOffsetZ
          });
        }
        
        smallBuildingsRight.push({ x: pos.x, z: pos.z, parts });
      }
    });
    
    // Füge Gebäude vor dem Logo hinzu
    buildingList.push(...buildingsBeforeLogo);
    // Füge Gebäude vor Gebäude 1 hinzu
    buildingList.push(...buildingsBeforeBuilding1);
    // Füge Gebäude links von Gebäude 1 hinzu
    buildingList.push(...buildingsLeftOfBuilding1);
    // Füge Gebäude bei Marker-Position hinzu
    buildingList.push(...buildingsAtMarkerPosition);
    // Füge zwei kleine Gebäude weiter rechts hinzu
    buildingList.push(...smallBuildingsRight);
    
    // Filtere Gebäude unter der Brücke und außerhalb der Karte heraus, verschiebe Gebäude hinten rechts neben dem Hafen nach vorne
    const filteredBuildings = buildingList.map((building) => {
      let x = building.x;
      let z = building.z;
      
      // Entferne Gebäude außerhalb der Kartenwelt
      const mapSize = 12;
      if (Math.abs(x) > mapSize || Math.abs(z) > mapSize) {
        return null;
      }
      
      // Hafen ist bei x=-8, z=0
      // Wasser erstreckt sich von z=-12 bis z=12, Breite 8.4
      // Entferne nur Gebäude auf dem Wasser (unter der Brücke)
      // Wasser-Bereich: x von -8-4.2=-12.2 bis -8+4.2=-3.8, z von -12 bis 12
      // Verwende genauere Grenzen, damit Gebäude rechts vom Wasser nicht entfernt werden
      const isOnWater = x >= -12.2 && x <= -3.8 && z >= -12 && z <= 12;
      if (isOnWater) {
        return null;
      }
      
      // Verschiebe Gebäude hinten rechts neben dem Hafen nach vorne (wenn z < -10)
      // Hafen ist bei x=-8, rechts davon wäre x > -8
      if (x > -8 && z < -10) {
        // Verschiebe sie etwas weiter nach vorne (z wird größer)
        z = -4; // Verschiebe sie auf z=-4 statt z < -10 (6 Einheiten nach vorne)
      }
      
      return { ...building, x, z };
    }).filter((building): building is typeof buildingList[0] => building !== null);
    
    return filteredBuildings;
  }, []);
  
  return (
    <group>
      {buildings.map((building, i) => (
        <group key={i} position={[building.x, 0, building.z]}>
          {building.parts.map((part, pIdx) => (
            <mesh 
              key={pIdx}
              position={[part.offsetX, part.height / 2, part.offsetZ]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[part.width, part.height, part.depth]} />
              <meshStandardMaterial 
                color="#000000"
                roughness={0.6}
                metalness={0.3}
                emissive="#000000"
                emissiveIntensity={0}
                envMapIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function ContainersArea() {
  // Container-Kästen wiederhergestellt, aber weiter nach hinten verschoben
  // Container-Kästen mit ursprünglicher Größe, aber mehr Blöcke
  const container = (x: number, z: number, w = 1.6, h = 0.6, d = 0.8, c = "#000000") => (
    <group position={[x, h / 2, z]}> 
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, h * 0.51, 0]}> {/* Deckleisten - orange wie Hauptgebäude */}
        <boxGeometry args={[w * 0.98, 0.04, d * 0.98]} />
        <meshStandardMaterial 
          color="#cc8a2a" 
          roughness={0.3}
          metalness={0.5}
          emissive="#1a1a0a"
          emissiveIntensity={0.05}
          envMapIntensity={1.0}
        />
      </mesh>
      <mesh position={[0, -h * 0.51, 0]}> {/* Bodenleisten */}
        <boxGeometry args={[w * 0.98, 0.04, d * 0.98]} />
        <meshStandardMaterial color="#2a4a4a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Vertikale Rillen mit Orange-Akzenten */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[w * (-0.5 + (i + 1) / 7), 0, 0]}> 
          <boxGeometry args={[0.02, h * 0.9, d * 1.02]} />
          <meshStandardMaterial 
            color="#000000" 
            emissive="#ffb344"
            emissiveIntensity={i % 2 === 0 ? 0.15 : 0}
            roughness={0.7} 
            metalness={0.3} 
          />
        </mesh>
      ))}
    </group>
  );
  
  return (
    <group>
      {/* Container-Kästen weiter nach vorne verschoben */}
      {container(-2, -2)}
      {container(0, -2, 1.6, 0.6, 1.6)}
      {container(2, -2)}
      {container(-2, -0.8)}
      {container(0, -0.8)}
      {container(2, -0.8)}
    </group>
  );
}

function PathNetworkAnimated() {
  // Orangefarbene Linien, animiert als Lauflicht - gerade Linie von Gebäude 1 zu Gebäude 2
  const color = '#ffb344';
  const basePoints: THREE.Vector3[] = [
    new THREE.Vector3(8.0, 0.03, 7),      // Gebäude 1
    new THREE.Vector3(9.39, 0.03, -9.2), // Gebäude 2
  ];
  const runway: THREE.Vector3[] = [
    new THREE.Vector3(9.39, 0.03, -6), // Von Gebäude 2 zum Hafen
    new THREE.Vector3(-8, 0.03, -6),   // Hafen-Bereich
  ];

  const dash = useRef(0);
  useFrame((_, delta) => {
    dash.current = (dash.current + delta * 1.2) % 1; // animierte Dash-Offset
  });
  
  return (
    <group>
      <Line points={basePoints} color={color} lineWidth={2} dashed dashScale={20} dashOffset={dash.current}>
        <meshBasicMaterial transparent opacity={0.9} />
      </Line>
      <Line points={runway} color={color} lineWidth={2} dashed dashScale={6} dashOffset={dash.current}>
        <meshBasicMaterial transparent opacity={0.9} />
      </Line>
      {/* Weg-Pins */}
      {basePoints.map((p, i) => (
        <mesh key={i} position={[p.x, 0.035, p.z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    // Elegantes schwarzes Fog
    scene.fog = new THREE.FogExp2('#000000', 0.04); // Elegantes schwarzes Fog
    return () => { scene.fog = null as any; };
  }, [scene]);
  return null;
}

function BoatModel() {
  const { scene } = useGLTF('/boat.glb');
  
  const boatRef = useMemo(() => {
    const cloned = scene.clone();
    // Boot auf Wasserhöhe positionieren - kleiner und weiter hinten
    cloned.position.set(-8, 0.1, 6);
    cloned.rotation.y = Math.PI / 4; // Leicht schräg für natürlicheren Look
    cloned.scale.setScalar(0.1); // Nochmal halbiert für bessere Proportionen
    
    // Elegante Grau-Materialien mit schönen Reflexionen
    cloned.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Elegante Grau-Materialien
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: any) => {
            mat.color.setHex(0x6b6b6b); // Elegantes Grau
            mat.metalness = 0.7;
            mat.roughness = 0.2;
            mat.emissive = new THREE.Color(0x1a1a1a);
            mat.emissiveIntensity = 0.02;
            mat.envMapIntensity = 1.5;
            mat.needsUpdate = true;
          });
        } else {
          child.material.color.setHex(0x6b6b6b); // Elegantes Grau
          child.material.metalness = 0.7;
          child.material.roughness = 0.2;
          child.material.emissive = new THREE.Color(0x1a1a1a);
          child.material.emissiveIntensity = 0.02;
          child.material.envMapIntensity = 1.5;
          child.material.needsUpdate = true;
        }
      }
    });
    
    return cloned;
  }, [scene]);

  return <primitive object={boatRef} />;
}

function RoadSystem() {
  const roadMaterial = { color: "#000000", metalness: 0.2, roughness: 0.8 };
  const glowRoadMaterial = { color: "#ffb344", metalness: 0.1, roughness: 0.0, emissive: "#ffb344", emissiveIntensity: 0.7 };
  
  return (
    <group>
      {/* Hauptstraßen - horizontale Linien */}
      <mesh position={[0, 0.02, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.5]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      
      {/* Hauptstraßen - vertikale Linien */}
      <mesh position={[-12, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[-8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[-4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      <mesh position={[12, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 24]} />
        <meshStandardMaterial {...roadMaterial} />
      </mesh>
      
      {/* Leuchtende Pfade - wie in der Konkurrenz */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.2]} />
        <meshStandardMaterial {...glowRoadMaterial} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 24]} />
        <meshStandardMaterial {...glowRoadMaterial} />
      </mesh>
    </group>
  );
}

function BuildingModel() {
  const { scene } = useGLTF('/ganz-neue-gebäude-1.glb');
  
  const root = useMemo(() => {
    const cloned = scene.clone();
    // Auf Boden absetzen: Bounding-Box bestimmen und minY auf 0 setzen
    const bbox = new THREE.Box3().setFromObject(cloned);
    if (isFinite(bbox.min.y)) {
      const liftY = -bbox.min.y;
      cloned.position.y += liftY;
    }
    
    // Gold/Orange-Materialien für Gebäude 1
    cloned.traverse((child: any) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Gold/Orange-Materialien für Gebäude 1
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.metalness = 0.5;
                  mat.roughness = 0.3;
                  mat.emissive = new THREE.Color(0x1a1a0a);
                  mat.emissiveIntensity = 0.05;
                  mat.envMapIntensity = 1.0;
                }
                mat.needsUpdate = true;
              }
            });
          } else {
            const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.metalness = 0.5;
                mat.roughness = 0.3;
                mat.emissive = new THREE.Color(0x1a1a0a);
                mat.emissiveIntensity = 0.05;
                mat.envMapIntensity = 1.0;
              }
              mat.needsUpdate = true;
            }
          }
        }
      }
    });
    return cloned;
  }, [scene]);

  return (
    <group position={[8.0, 0, 7]} rotation={[0, Math.PI * 0.5, 0]} scale={[2.5, 2.5, 2.5]}>
      <primitive object={root} />
    </group>
  );
}

function OptionalBuilding2() {
  // Versuche '/gebäude-2.glb' zu laden, wenn vorhanden
  // Hooks müssen immer aufgerufen werden
  const gltf = useGLTF('/gebäude-2-neu.glb');
  const { scene } = gltf;
  
  // Verwende useMemo immer
  const root = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone();
    const bbox = new THREE.Box3().setFromObject(cloned);
    if (isFinite(bbox.min.y)) {
      const liftY = -bbox.min.y;
      cloned.position.y += liftY;
    }
    // Gold/Orange-Materialien für Gebäude 2
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Gold/Orange-Materialien für Gebäude 2
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.metalness = 0.5;
                  mat.roughness = 0.3;
                  mat.emissive = new THREE.Color(0x1a1a0a);
                  mat.emissiveIntensity = 0.05;
                  mat.envMapIntensity = 1.0;
                }
                mat.needsUpdate = true;
              }
            });
          } else {
            const mat = mesh.material;
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.metalness = 0.5;
                mat.roughness = 0.3;
                mat.emissive = new THREE.Color(0x1a1a0a);
                mat.emissiveIntensity = 0.05;
                mat.envMapIntensity = 1.0;
              }
              mat.needsUpdate = true;
            }
          }
        }
      }
    });
    return cloned;
  }, [scene]);
  
  if (!root) return null;

  // Professionelle Platzierung: Basis/Plaza, Zuweg, leichte Ausrichtung
  const baseColor = '#000000';
  const accent = '#ffb344';
  // Statische Position vorne rechts am Raster-Rechteck: x=+12, z=-12
  const pos = new THREE.Vector3(9.39, 0, -9.2);

  return (
    <group>
      {/* Plaza-Basis unter Gebäude-2 */}
      <mesh position={[pos.x, 0.015, pos.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 72]} />
        <meshStandardMaterial color={baseColor} roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[pos.x, 0.017, pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.9, 4.0, 96]} />
        <meshStandardMaterial color={accent} emissive="#5a3b00" emissiveIntensity={0.2} />
      </mesh>
      {/* Gebäude-2 */}
      <group position={[pos.x, 0, pos.z]} rotation={[0, 0, 0]} scale={[2.3, 2.3, 2.3]}>
        <primitive object={root} />
      </group>
      {/* Zuweg (animierte Linie) von Mitte zur Plaza - entfernt */}
      {/* <PathTo target={pos} /> */}
    </group>
  );
}

function OptionalBridge() {
  // Versuche den ersten verfügbaren Pfad zu laden
  // Hooks müssen immer aufgerufen werden - verwende den ersten Pfad
  const gltf = useGLTF('/brücke-über-hafen.glb');
  const { scene } = gltf;
  
  // Verwende useMemo immer
  const root = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone();
    const bbox = new THREE.Box3().setFromObject(cloned);
    if (isFinite(bbox.min.y)) {
      const liftY = -bbox.min.y;
      cloned.position.y += liftY;
    }
    // Gold/Orange-Materialien für Gebäude 2
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Gold/Orange-Materialien für Brücke
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.metalness = 0.5;
                  mat.roughness = 0.3;
                  mat.emissive = new THREE.Color(0x1a1a0a);
                  mat.emissiveIntensity = 0.05;
                  mat.envMapIntensity = 1.0;
                }
                mat.needsUpdate = true;
              }
            });
          } else {
            const mat = mesh.material;
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.color.setHex(0xcc8a2a); // Gedämpftes Gold/Orange
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.metalness = 0.5;
                mat.roughness = 0.3;
                mat.emissive = new THREE.Color(0x1a1a0a);
                mat.emissiveIntensity = 0.05;
                mat.envMapIntensity = 1.0;
              }
              mat.needsUpdate = true;
            }
          }
        }
      }
    });
    return cloned;
  }, [scene]);

  if (!root) return null;

  // Großer Hafen mit Wasser quer durch die Map (z: -12 bis 12)
  const harborPos = new THREE.Vector3(-8, 0.011, 0);
  return (
    <group position={[harborPos.x, 0, harborPos.z]}>
      {/* Platzhalter-Sockel unter dem Hafen */}
      <mesh position={[0, harborPos.y - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[27, 26]} />
        <meshStandardMaterial 
          color="#000000" 
          roughness={0.2} 
          metalness={0.7}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Wasserfläche durch die ganze Map (von -12 bis 12) */}
      <mesh position={[0, harborPos.y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.4, 24]} />
        <meshStandardMaterial 
          color="#1a2a3a" 
          roughness={0.05} 
          metalness={0.95}
          emissive="#2a3a4a"
          emissiveIntensity={0.1}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Brücke über den Hafen – verdreifacht und lokal um 90° drehen */}
      <group position={[0.3, 0, -6]} rotation={[0, Math.PI / 2, 0]} scale={[5.9, 5.9, 5.9]}>
        <primitive object={root} />
      </group>
    </group>
  );
}


function _PathTo({ target }: { target: THREE.Vector3 }) {
  const color = '#ffb344';
  const start = new THREE.Vector3(0, 0.031, 8); // von Gebäude 1 (neue Position) zur Ziel-Plaza
  const points: THREE.Vector3[] = [
    start,
    new THREE.Vector3((start.x + target.x) / 2, 0.031, (start.z + target.z) / 2 + 0.4),
    new THREE.Vector3(target.x - 1.5, 0.031, target.z - 0.6),
    new THREE.Vector3(target.x, 0.031, target.z),
  ];
  const dash = useRef(0);
  useFrame((_, delta) => {
    dash.current = (dash.current + delta * 1.2) % 1;
  });
  return (
    <group>
      <Line points={points} color={color} lineWidth={2} dashed dashScale={20} dashOffset={dash.current}>
        <meshBasicMaterial transparent opacity={0.85} />
      </Line>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, 0.035, p.z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function BuildingPath() {
  const color = '#ffb344';
  const points: THREE.Vector3[] = [
    new THREE.Vector3(-2, 0.031, -1.4), // Container-Bereich
    new THREE.Vector3(0, 0.031, 3),      // Zwischen Container und Gebäude 1
    new THREE.Vector3(8.0, 0.031, 7),       // Gebäude 1
    // Entfernt: Linie zu Gebäude 2 (wird von PathNetworkAnimated abgedeckt)
  ];
  const dash = useRef(0);
  useFrame((_, delta) => {
    dash.current = (dash.current + delta * 1.2) % 1;
  });
  return (
    <group>
      <Line points={points} color={color} lineWidth={2} dashed dashScale={20} dashOffset={dash.current}>
        <meshBasicMaterial transparent opacity={0.9} />
      </Line>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x, 0.035, p.z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function PlazaArea() {
  // Dezente Plaza um das Hauptgebäude
  return (
    <group>
      {/* Platzfläche - bei Gebäude 1 (z = 7) */}
      <mesh position={[8.0, 0.015, 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.8, 48]} />
        <meshStandardMaterial 
          color="#000000" 
          roughness={0.2} 
          metalness={0.7}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Markierungsring - bei Gebäude 1 (z = 7) mit Orange-Glühen */}
      <mesh position={[8.0, 0.017, 7]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.6, 64]} />
        <meshStandardMaterial 
          color="#ffb344" 
          emissive="#ffb344" 
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function ArchitecturalGrid() {
  return (
    <group>
      {/* Eleganter, dunkler Boden - glänzend und orange */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#000000"
          roughness={0.2}
          metalness={0.7}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={0.5}
        />
      </mesh>
      {/* Sehr subtiles Grid - fast unsichtbar, elegant */}
    <gridHelper 
        args={[100, 50, 'rgba(255, 179, 68, 0.03)', 'rgba(0, 0, 0, 0.02)']} 
      position={[0, 0.01, 0]}
    />
    </group>
  );
}

export default function EmbedPage() {
  // Drohne startet bei y=0.6 und z=7 (niedriger für Flug durch die Welt)
  const droneStartPos = new THREE.Vector3(0, 0.6, 7);
  const [dronePosition, setDronePosition] = useState(droneStartPos.clone());
  const [droneRotation, setDroneRotation] = useState(new THREE.Quaternion());
  const lastStateUpdateRef = useRef(0);
  const [targetDirection, setTargetDirection] = useState(new THREE.Vector3(0, 0, -1));
  const [isFlying, setIsFlying] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [startCameraAnimation, setStartCameraAnimation] = useState(true); // Starte sofort beim Intro
  const [cameraPositionSet, setCameraPositionSet] = useState(false);
  const [showDrone, setShowDrone] = useState(false); // Drohne erst zeigen, wenn sie einfliegen soll
  const [introDroneAnimation, setIntroDroneAnimation] = useState(true); // Intro-Animation aktiv
  const [cameraPhase, setCameraPhase] = useState<'logo' | 'drone'>('logo'); // Kamera-Phase verfolgen
  const [droneFlyInStarted, setDroneFlyInStarted] = useState(false); // Drohnen-Einflug gestartet
  const [droneAnimationComplete, setDroneAnimationComplete] = useState(false); // Drohnen-Animation abgeschlossen
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  // Zeige die Anleitung NACH dem Intro UND nach der Drohnen-Animation für 4.5 Sekunden
  useEffect(() => {
    if (!introCompleted || !droneAnimationComplete) return;
    // Warte kurz nach der Drohnen-Animation, dann zeige Anleitung
    const showTimer = setTimeout(() => {
      setShowHint(true);
    }, 200); // Kleine Verzögerung nach Drohnen-Animation
    // Verstecke Anleitung nach 4.5 Sekunden
    const hideTimer = setTimeout(() => {
      setShowHint(false);
    }, 4700); // 200ms Verzögerung + 4.5 Sekunden Anzeige
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [introCompleted, droneAnimationComplete]);

  // Starte Drohnen-Einflug unabhängig von Kamera-Animation (nach 2 Sekunden)
  useEffect(() => {
    if (!droneFlyInStarted) {
      const timer = setTimeout(() => {
        setShowDrone(true);
        setDroneFlyInStarted(true);
      }, 2000); // Starte nach 2 Sekunden (gleichzeitig mit Kamera-Phase 2)
      return () => clearTimeout(timer);
    }
  }, [droneFlyInStarted]);

  const handlePositionUpdate = (pos: THREE.Vector3, rot: THREE.Quaternion) => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - lastStateUpdateRef.current > 100) { // ~10 Hz
      lastStateUpdateRef.current = now;
      setDronePosition(pos.clone());
      setDroneRotation(rot.clone());
    }
  };

  const handleDirectionUpdate = (dir: THREE.Vector3, flying: boolean) => {
    setTargetDirection(dir.clone());
    setIsFlying(flying);
  };

  const handleIntroComplete = () => {
    // Intro-Overlay wird ausgeblendet, Kamera-Animation läuft bereits
    // Die Kamera bewegt sich jetzt von Logo zur Drohne
  };

  const handleCameraAnimationComplete = () => {
    // Kamera-Animation ist fertig - alles ist bereit
      setIntroCompleted(true);
    setIntroDroneAnimation(false);
    setStartCameraAnimation(false);
      setTimeout(() => {
        setCameraPositionSet(true);
      }, 100);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: isMobile ? "90svh" : "100vh",
        position: "relative",
        userSelect: 'none',
        WebkitUserSelect: 'none' as any,
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {introDroneAnimation && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
      {/* Steuerungs-Anleitung - erscheint nach Drohnen-Animation von unten */}
      {showHint && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none', padding: 16, paddingBottom: isMobile ? 12 : 16, zIndex: 20 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            background: 'rgba(0,0,0,0.55)', 
            color: 'white', 
            padding: '12px 14px', 
            borderRadius: 10, 
            boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
            animation: 'slideUpFromBottomHint 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            transform: 'translateY(100px)',
            opacity: 0
          }}>
            {/* Richtungskreuz */}
            <div style={{ position: 'relative', width: 40, height: 40, opacity: 0.9 }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 6, height: 14, borderRadius: 3, background: '#ffb344', boxShadow: '0 0 12px #ffb344' }} />
              <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 6, height: 14, borderRadius: 3, background: '#ffb344', boxShadow: '0 0 12px #ffb344' }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', width: 14, height: 6, borderRadius: 3, background: '#ffb344', boxShadow: '0 0 12px #ffb344' }} />
              <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', width: 14, height: 6, borderRadius: 3, background: '#ffb344', boxShadow: '0 0 12px #ffb344' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,179,68,0.9)', boxShadow: '0 0 10px #ffb344' }} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 280 }}>
              {isMobile ? 'Zum Fliegen Finger halten und ziehen. Ziehen ändert die Richtung.' : 'Zum Fliegen linke Maustaste halten und ziehen. Ziehen ändert die Richtung.'}
            </div>
          </div>
        </div>
      )}
      
      <Canvas 
        shadows={!isMobile}
        camera={{ position: [0, 9, 19], fov: 60 }} 
        style={{ background: '#000000' }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isMobile ? 1.2 : 1.4,
          powerPreference: 'high-performance',
        }}
        onCreated={({ camera }) => { 
          if (camera instanceof THREE.PerspectiveCamera) {
            camRef.current = camera;
          }
          // Setze initiale Kamera-Position: von oben beim Logo
          // Die Kamera wird dann von CameraAnimation gesteuert
          const logoPos = new THREE.Vector3(0, 0.1, 6); // Logo bei Gebäude-1-Position
          camera.position.set(logoPos.x, logoPos.y + 8, logoPos.z); // Von oben über dem Logo
          camera.lookAt(logoPos); // Schaut auf das Logo
        }}
      >
        <SceneFog />
        {/* Kamera-Animation während Intro */}
        {startCameraAnimation && (
          <CameraAnimation 
            startAnimation={startCameraAnimation}
            droneStartPos={[droneStartPos.x, droneStartPos.y, droneStartPos.z]}
            onComplete={handleCameraAnimationComplete}
            onPhaseChange={(phase) => {
              setCameraPhase(phase);
            }}
          />
        )}
        {/* Starke Beleuchtung - Schwarz und Orange */}
        <ambientLight intensity={0.7} color="#ffe5cc" />
        <hemisphereLight args={[0xffe5cc, 0x000000, 0.7]} />
        {/* Hauptlicht - sehr stark für gute Sichtbarkeit */}
        <directionalLight 
          position={[10, 25, 10]} 
          intensity={5.0} 
          castShadow 
          color="#ffe5cc"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        {/* Fülllicht von links */}
        <directionalLight 
          position={[-10, 18, 5]} 
          intensity={2.5} 
          color="#ffe5cc"
        />
        {/* Akzentlicht von hinten */}
        <directionalLight 
          position={[0, 12, -15]} 
          intensity={2.0}
          color="#ffe5cc"
        />
        {/* Zusätzliches Fülllicht von rechts */}
        <directionalLight 
          position={[10, 15, -5]} 
          intensity={1.5} 
          color="#ffe5cc"
        />
        {/* Orange Punktlichte für wichtige Bereiche */}
        <pointLight 
          position={[0, 15, 0]} 
          intensity={1.5} 
          color="#ffb344"
          distance={50}
          decay={2}
        />
        {/* Orange Punktlicht über Gebäude 1 */}
        <pointLight 
          position={[0, 12, 8]} 
          intensity={2.0} 
          color="#ffb344"
          distance={20}
          decay={2}
        />
        {/* Orange Punktlicht über Logo */}
        <pointLight 
          position={[0, 8, 6]} 
          intensity={2.5} 
          color="#ffb344"
          distance={15}
          decay={2}
        />
        <Environment files="/hdr/warehouse.hdr" background={false} blur={0.3} environmentIntensity={0.3} />
        
        <Terrain />
        <ContactShadows 
          position={[0, -0.11, 0]}
          opacity={0.45}
          scale={40}
          blur={isMobile ? 2.0 : 2.6}
          far={20}
          resolution={isMobile ? 512 : 1024}
          frames={1}
        />
        <ArchitecturalGrid />
        <RoadSystem />
        <ModernCity />
        <PlazaArea />
        <BuildingPath />
        <PlaceholderBuildings />
        {/* <MarkerTower /> */}
        <BuildingModel />
        <OptionalBuilding2 />
        <OptionalBridge />
        <ContainersArea />
        <PathNetworkAnimated />
        <BoatModel />
        
        <group>
          {introDroneAnimation && showDrone ? (
            <IntroDroneModel
              onPositionUpdate={(pos) => {
                // Update Position für Overlay
                const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
                if (now - lastStateUpdateRef.current > 100) {
                  lastStateUpdateRef.current = now;
                  setDronePosition(pos.clone());
                  setDroneRotation(new THREE.Quaternion());
                }
              }}
            />
          ) : !introDroneAnimation ? (
          <DroneControls 
            onPositionUpdate={handlePositionUpdate} 
            onDirectionUpdate={handleDirectionUpdate}
            disableCameraFollow={!cameraPositionSet}
          />
          ) : null}
        </group>
      </Canvas>
      
      {/* Drohne als Overlay - sichtbar wenn Kamera-Animation fertig ist, startet bei top: 120% */}
      {introCompleted && (
      <DroneOverlay 
        dronePosition={{ x: dronePosition.x, y: dronePosition.y, z: dronePosition.z }}
        droneRotation={{ x: droneRotation.x, y: droneRotation.y, z: droneRotation.z, w: droneRotation.w }}
        targetDirection={{ x: targetDirection.x, y: targetDirection.y, z: targetDirection.z }}
        isFlying={isFlying}
        onAnimationComplete={() => setDroneAnimationComplete(true)}
      />
      )}
      
      {/* Gebäude-Informationen - erst nach Intro UND nach Drohnen-Animation */}
      {introCompleted && droneAnimationComplete && (
        <BuildingInfo 
          dronePosition={{ x: dronePosition.x, y: dronePosition.y, z: dronePosition.z }} 
          showAfterDrone={true}
        />
      )}
      
      {/* UI-Menü und Kamera-Bookmarks entfernt */}
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ 
          width: '30px', 
          height: '30px', 
          borderRadius: '50%', 
          border: '2px solid #ffb344',
          boxShadow: '0 0 15px #ffb344',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '15px', 
            height: '15px', 
            borderRadius: '50%', 
            backgroundColor: '#ffb344',
            boxShadow: '0 0 10px #ffb344'
          }}></div>
        </div>
      </div>
      
      {/* "Zurück zur Übersicht" entfernt */}
      
      <div style={{
        position: 'absolute',
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000
      }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{
            width: '20px',
            height: '2px',
            backgroundColor: 'white',
            marginBottom: '5px',
            opacity: 0.6
          }}></div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideUpFromBottomHint {
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