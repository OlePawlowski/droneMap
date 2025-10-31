"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Box, Cylinder, useGLTF, useAnimations } from "@react-three/drei";

// Last-try Drohne vorladen
useGLTF.preload('/last-try.glb');

function DebugLastTryDrone({ droneRef }: { droneRef: React.RefObject<THREE.Group | null> }) {
  const { scene, animations } = useGLTF('/last-try.glb');
  const { actions, mixer } = useAnimations(animations, droneRef);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    if (scene) {
      console.log('=== LAST-TRY DEBUG ANALYSE ===');
      console.log('Scene:', scene);
      console.log('Animations:', animations);
      
      // Bounding Box berechnen
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('📦 Bounding Box Min:', box.min.x, box.min.y, box.min.z);
      console.log('📦 Bounding Box Max:', box.max.x, box.max.y, box.max.z);
      console.log('📏 Größe X:', size.x);
      console.log('📏 Größe Y:', size.y);
      console.log('📏 Größe Z:', size.z);
      console.log('📍 Center X:', center.x);
      console.log('📍 Center Y:', center.y);
      console.log('📍 Center Z:', center.z);
      
      // Alle Objekte analysieren
      const objects: any[] = [];
      scene.traverse((child) => {
        objects.push({
          name: child.name,
          type: child.type,
          position: child.position,
          scale: child.scale,
          rotation: child.rotation,
          visible: child.visible,
          material: (() => {
            if (!(child as THREE.Mesh).isMesh || !(child as THREE.Mesh).material) return 'none';
            const mat = (child as THREE.Mesh).material;
            if (Array.isArray(mat)) {
              return mat[0]?.type || 'array';
            }
            return mat.type;
          })()
        });
      });
      
      console.log('🔍 Alle Objekte:', objects);
      
      // Materialien analysieren
      const materials = new Set();
      scene.traverse((child: any) => {
        if (child.material) {
          materials.add(child.material.type);
        }
      });
      
      console.log('🎨 Materialien:', Array.from(materials));
      
      setDebugInfo({
        boundingBox: { size, center },
        objectCount: objects.length,
        materials: Array.from(materials),
        hasAnimations: animations && animations.length > 0
      });
      
      // Animationen starten
      if (actions && Object.keys(actions).length > 0) {
        console.log('🎬 Starte Animationen:', Object.keys(actions));
        Object.values(actions).forEach((action) => {
          if (action) {
            action.reset().fadeIn(0.5).play();
            action.setLoop(THREE.LoopRepeat, Infinity);
          }
        });
      }
    }
  }, [scene, animations, actions]);
  
  // Animation-Mixer in jedem Frame aktualisieren
  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });
  
  return (
    <group ref={droneRef}>
      {/* Last-try Drohne - stark vergrößert */}
      <primitive
        object={scene.clone()}
        scale={[20, 20, 20]}
        position={[0, 0, 0]}
      />
      
      {/* Debug Info anzeigen */}
      {debugInfo && (
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}
    </group>
  );
}

function DroneControls() {
  const droneRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const [targetDir, setTargetDir] = useState(new THREE.Vector3(0, 0, -1));
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      handleMouseMove(e);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!droneRef.current || !isMouseDown) return;

      const centerX = size.width / 2;
      const centerY = size.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      const direction = new THREE.Vector3(
        dx * 0.01,
        0,
        dy * 0.01
      ).normalize();

      setTargetDir(direction);
      setIsFlying(true);
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      setIsFlying(false);
    };

    const handleMouseLeave = () => {
      isMouseDown = false;
      setIsFlying(false);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [size]);

  useFrame((_, delta) => {
    if (!droneRef.current) return;

    const moveSpeed = 3 * delta;

    if (isFlying && targetDir) {
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          targetDir,
          new THREE.Vector3(0, 1, 0)
        )
      );
      
      droneRef.current.quaternion.slerp(targetQuat, 0.05);

      const move = targetDir.clone().multiplyScalar(moveSpeed);
      droneRef.current.position.add(move);
    }

    const camDistance = 15;
    const camHeight = 8;
    
    const dronePos = droneRef.current.position.clone();
    const camOffset = new THREE.Vector3(0, camHeight, camDistance);
    const targetCamPos = dronePos.clone().add(camOffset);
    
    camera.position.lerp(targetCamPos, 0.05);
    
    const lookAtPos = dronePos.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtPos);
  });

  return <DebugLastTryDrone droneRef={droneRef} />;
}

function Building() {
  return (
    <mesh position={[5, 0.5, -5]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

export default function DebugLastTryPage() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ position: [-2, 5, 4], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <group position={[0, 2, 0]}>
          <DroneControls />
        </group>
        <Building />
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  );
}
