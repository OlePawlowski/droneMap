"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

// DJI Drohne vorladen
useGLTF.preload('/dji_phantom4.glb');

function AnimateAllDroneModel({ droneRef }: { droneRef: React.RefObject<THREE.Group> }) {
  const { scene } = useGLTF('/dji_phantom4.glb');
  const allObjects = useRef<THREE.Object3D[]>([]);
  
  useEffect(() => {
    if (scene) {
      console.log('=== ALLE OBJEKTE ANIMIEREN ===');
      
      // Alle Objekte sammeln
      scene.traverse((child) => {
        if (child.type === 'Mesh' || child.type === 'Group') {
          allObjects.current.push(child);
          console.log('Objekt hinzugefügt:', child.name, child.type);
        }
      });
      
      console.log('Gesamt Objekte:', allObjects.current.length);
    }
  }, [scene]);
  
  // Alle Objekte rotieren lassen (zum Testen)
  useFrame((_, delta) => {
    allObjects.current.forEach((obj, index) => {
      if (obj) {
        // Nur jedes 4. Objekt rotieren (um Chaos zu vermeiden)
        if (index % 4 === 0) {
          obj.rotation.y += 2 * Math.PI * 2 * delta;
        }
      }
    });
  });
  
  return (
    <group ref={droneRef}>
      <primitive
        object={scene.clone()}
        scale={[1, 1, 1]}
        position={[0, 0, 0]}
      />
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

  return <AnimateAllDroneModel droneRef={droneRef} />;
}

function Building() {
  return (
    <mesh position={[5, 0.5, -5]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

export default function AnimateAllPage() {
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
