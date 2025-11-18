"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Box, Cylinder, Sphere, Environment, ContactShadows, Line, useGLTF, useTexture } from "@react-three/drei";
import DroneOverlay from './components/DroneOverlay';
import IntroAnimation from './components/IntroAnimation';
import CameraAnimation from './components/CameraAnimation';
import BuildingInfo from './components/BuildingInfo';

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


    // Nur fliegen wenn Maustaste gedrückt ist
    if (isFlying && smoothedTargetDir.current) {
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
      const camDistance = 12;
      const camHeight = 7;
      
      const dronePos = droneRef.current.position.clone();
      const camOffset = new THREE.Vector3(0, camHeight, camDistance);
      const targetCamPos = dronePos.clone().add(camOffset);
      
      // Smooth Follow immer
      camera.position.lerp(targetCamPos, 0.05);
      const lookAtPos = dronePos.clone().add(new THREE.Vector3(0, 1, 0));
      camera.lookAt(lookAtPos);
    }
  });

  return <DroneModel droneRef={droneRef} initialPosition={new THREE.Vector3(0, 2, 7)} />;
}

function Terrain() {
  return (
    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 1, 1]} />
      <meshStandardMaterial 
        color="#2a2a2a"
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  );
}

function ModernCity() {
  // Statikbüro-Logo angepasst - rechts, hinten und größer
  return (
    <group>
      {/* Logo rechts, hinten und größer - um -90 Grad gedreht */}
      <mesh position={[9, 0.1, 6]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <planeGeometry args={[7, 5]} />
        <meshBasicMaterial 
          map={useTexture('/statikbüro-logo.png')}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

function ContainersArea() {
  // Container-Kästen wiederhergestellt, aber weiter nach hinten verschoben
  // Container-Kästen mit ursprünglicher Größe, aber mehr Blöcke
  const container = (x: number, z: number, w = 1.6, h = 0.6, d = 0.8, c = "#2f3638") => (
    <group position={[x, h / 2, z]}> 
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, h * 0.51, 0]}> {/* Deckleisten */}
        <boxGeometry args={[w * 0.98, 0.04, d * 0.98]} />
        <meshStandardMaterial color="#384044" roughness={0.75} metalness={0.1} />
      </mesh>
      <mesh position={[0, -h * 0.51, 0]}> {/* Bodenleisten */}
        <boxGeometry args={[w * 0.98, 0.04, d * 0.98]} />
        <meshStandardMaterial color="#384044" roughness={0.75} metalness={0.1} />
      </mesh>
      {/* Vertikale Rillen */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[w * (-0.5 + (i + 1) / 7), 0, 0]}> 
          <boxGeometry args={[0.02, h * 0.9, d * 1.02]} />
          <meshStandardMaterial color="#31383b" roughness={0.8} metalness={0.1} />
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
    new THREE.Vector3(0, 0.03, 8),      // Gebäude 1
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
    scene.fog = new THREE.FogExp2('#0b1414', 0.035);
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
  const roadMaterial = { color: "#4a4a4a", metalness: 0.8, roughness: 0.2 };
  const glowRoadMaterial = { color: "#ffb344", metalness: 0.1, roughness: 0.0, emissive: "#ffb344", emissiveIntensity: 0.4 };
  
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
    <group position={[0, 0, 8]} rotation={[0, -Math.PI * 0.5, 0]} scale={[2.5, 2.5, 2.5]}>
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
  const baseColor = '#2f3337';
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

  // Großer Hafen mit Wasser quer durch die Map (z: -12 bis 12)
  const harborPos = new THREE.Vector3(-8, 0.011, 0);
  return (
    <group position={[harborPos.x, 0, harborPos.z]}>
      {/* Platzhalter-Sockel unter dem Hafen */}
      <mesh position={[0, harborPos.y - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[27, 26]} />
        <meshStandardMaterial color="#2f3337" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Wasserfläche durch die ganze Map (von -12 bis 12) */}
      <mesh position={[0, harborPos.y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.4, 24]} />
        <meshStandardMaterial color="#0c1c22" roughness={0.18} metalness={0.55} />
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
    new THREE.Vector3(0, 0.031, 8),       // Gebäude 1
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
      {/* Platzfläche - verschoben zu z = +8 und in die Mitte */}
      <mesh position={[0, 0.015, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.8, 48]} />
        <meshStandardMaterial color="#2f3337" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Markierungsring - verschoben zu z = +8 und in die Mitte */}
      <mesh position={[0, 0.017, 8]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.6, 64]} />
        <meshStandardMaterial color="#ffb344" emissive="#5a3b00" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function ArchitecturalGrid() {
  return (
    <gridHelper 
      args={[100, 100, '#ffb344', '#1a2a2a']} 
      position={[0, 0.01, 0]}
    />
  );
}

export default function Home() {
  // Drohne startet bei y=2 und z=7
  const droneStartPos = new THREE.Vector3(0, 2, 7);
  const [dronePosition, setDronePosition] = useState(droneStartPos.clone());
  const [droneRotation, setDroneRotation] = useState(new THREE.Quaternion());
  const lastStateUpdateRef = useRef(0);
  const [targetDirection, setTargetDirection] = useState(new THREE.Vector3(0, 0, -1));
  const [isFlying, setIsFlying] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [startCameraAnimation, setStartCameraAnimation] = useState(false);
  const [cameraPositionSet, setCameraPositionSet] = useState(false);
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

  // Zeige die Anleitung NACH dem Intro für ~2.6s
  useEffect(() => {
    if (!introCompleted) return;
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 2600);
    return () => clearTimeout(t);
  }, [introCompleted]);

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
    setStartCameraAnimation(true);
    // Warte bis Animation fast fertig ist, dann markiere als completed
    setTimeout(() => {
      setIntroCompleted(true);
      // Warte einen zusätzlichen Frame, damit Kamera-Position gesetzt ist
      setTimeout(() => {
        setCameraPositionSet(true);
      }, 100);
    }, 3000); // 3 Sekunden - etwas mehr als die Animation (2.5s)
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
      {!introCompleted && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}
      {/* Kurzes Onboarding-Overlay (2.6s) */}
      {showHint && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none', padding: 16, paddingBottom: isMobile ? 12 : 16, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.55)', color: 'white', padding: '12px 14px', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
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
        camera={{ position: [0, 30, 20], fov: 60 }} 
        style={{ background: '#0a0a0a' }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isMobile ? 0.95 : 1.0,
          powerPreference: 'high-performance',
        }}
        onCreated={({ camera }) => { 
          if (camera instanceof THREE.PerspectiveCamera) {
            camRef.current = camera;
          }
          // Setze initiale Kamera-Position (weit weg, aber nicht so weit und schaut auf Drohnen-Höhe y=2)
          camera.position.set(0, 30, 20);
          camera.lookAt(0, 2, 0);
        }}
      >
        {startCameraAnimation && !introCompleted && (
          <CameraAnimation startAnimation={startCameraAnimation} droneStartPos={[droneStartPos.x, droneStartPos.y, droneStartPos.z]} />
        )}
        <SceneFog />
        {/* Verbesserte Beleuchtung für bessere Kulisse-Sichtbarkeit */}
        <ambientLight intensity={0.25} />
        <hemisphereLight args={[0xffffff, 0x444466, 0.4]} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          color="#ffffff"
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Zusätzliche Beleuchtung von der Seite für bessere Ausleuchtung */}
        <directionalLight 
          position={[-10, 15, 5]} 
          intensity={0.8} 
          color="#ffffff"
        />
        {/* Zusätzliche Beleuchtung von hinten */}
        <directionalLight 
          position={[0, 10, -15]} 
          intensity={0.6} 
          color="#ffffff"
        />
        <Environment files="/hdr/warehouse.hdr" background={false} blur={0.5} />
        
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
        <BuildingModel />
        <OptionalBuilding2 />
        <OptionalBridge />
        <ContainersArea />
        <PathNetworkAnimated />
        <BoatModel />
        
        <group>
          <DroneControls 
            onPositionUpdate={handlePositionUpdate} 
            onDirectionUpdate={handleDirectionUpdate}
            disableCameraFollow={!cameraPositionSet}
          />
        </group>
      </Canvas>
      
      {/* Drohne als Overlay */}
      <DroneOverlay 
        dronePosition={{ x: dronePosition.x, y: dronePosition.y, z: dronePosition.z }}
        droneRotation={{ x: droneRotation.x, y: droneRotation.y, z: droneRotation.z, w: droneRotation.w }}
        targetDirection={{ x: targetDirection.x, y: targetDirection.y, z: targetDirection.z }}
        isFlying={isFlying}
      />
      
      {/* Gebäude-Informationen - erst nach Intro */}
      {introCompleted && (
        <BuildingInfo dronePosition={{ x: dronePosition.x, y: dronePosition.y, z: dronePosition.z }} />
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
    </div>
  );
}