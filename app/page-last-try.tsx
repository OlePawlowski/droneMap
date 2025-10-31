"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Box, Cylinder, Sphere, useGLTF } from "@react-three/drei";

// Last-try Drohne vorladen
useGLTF.preload('/last-try.glb');

function DroneModel({ droneRef }: { droneRef: React.RefObject<THREE.Group> }) {
  const { scene, animations } = useGLTF('/last-try.glb');
  const rotorRefs = useRef<(THREE.Group | null)[]>([]);
  const [rpm, setRpm] = useState(2000);
  const [spinning, setSpinning] = useState(true);
  
  // Rotor-Animation basierend auf der Demo
  useFrame((_, delta) => {
    if (spinning) {
      // rpm -> deg per sec = rpm * 360 / 60
      const degPerSec = rpm * 360 / 60;
      const radPerSec = degPerSec * (Math.PI / 180);
      
      rotorRefs.current.forEach((rotor, idx) => {
        if (rotor) {
          // alternate spin directions for realism
          const dir = (idx % 2 === 0) ? 1 : -1;
          rotor.rotation.y += dir * radPerSec * delta;
        }
      });
    }
  });
  
  // Analysiere die Drohne und finde Rotoren
  useEffect(() => {
    if (scene) {
      console.log('=== LAST-TRY DROHNE ANALYSE ===');
      console.log('Scene:', scene);
      console.log('Animations:', animations);
      
      // Alle Objekte durchgehen und nach Rotoren suchen
      scene.traverse((child) => {
        console.log('Objekt:', child.name, 'Typ:', child.type, 'Position:', child.position);
        
        // Nach Rotor-ähnlichen Namen suchen
        if (child.name.toLowerCase().includes('rotor') || 
            child.name.toLowerCase().includes('propeller') ||
            child.name.toLowerCase().includes('blade') ||
            child.name.toLowerCase().includes('motor') ||
            child.name.toLowerCase().includes('prop')) {
          console.log('🎯 ROTOR GEFUNDEN:', child.name, child);
          rotorRefs.current.push(child);
        }
      });
      
      console.log('Gefundene Rotoren:', rotorRefs.current);
    }
  }, [scene, animations]);
  
  return (
    <group ref={droneRef}>
      {/* Last-try Drohne */}
      <primitive
        object={scene.clone()}
        scale={[5, 5, 5]}
        position={[0, 0, 0]}
      />
      
      {/* Fallback: Zusätzliche Rotoren falls keine gefunden wurden */}
      {rotorRefs.current.length === 0 && (
        <>
          <group ref={(el) => (rotorRefs.current[0] = el)} position={[0.5, 0.1, 0.5]}>
            <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#333333" />
            </Cylinder>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
          </group>
          
          <group ref={(el) => (rotorRefs.current[1] = el)} position={[-0.5, 0.1, 0.5]}>
            <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#333333" />
            </Cylinder>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
          </group>
          
          <group ref={(el) => (rotorRefs.current[2] = el)} position={[0.5, 0.1, -0.5]}>
            <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#333333" />
            </Cylinder>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
          </group>
          
          <group ref={(el) => (rotorRefs.current[3] = el)} position={[-0.5, 0.1, -0.5]}>
            <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#333333" />
            </Cylinder>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
            <Box args={[0.3, 0.002, 0.06]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial color="#666666" transparent opacity={0.8} />
            </Box>
          </group>
        </>
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

    const camDistance = 12;
    const camHeight = 6;
    
    const dronePos = droneRef.current.position.clone();
    const camOffset = new THREE.Vector3(0, camHeight, camDistance);
    const targetCamPos = dronePos.clone().add(camOffset);
    
    camera.position.lerp(targetCamPos, 0.05);
    
    const lookAtPos = dronePos.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtPos);
  });

  return <DroneModel droneRef={droneRef} />;
}

function Building() {
  return (
    <mesh position={[5, 0.5, -5]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ position: [-2, 5, 4], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <group position={[0, 3, 0]}>
          <DroneControls />
        </group>
        <Building />
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  );
}