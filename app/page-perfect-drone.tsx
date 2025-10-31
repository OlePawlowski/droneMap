"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Box, Cylinder, Sphere } from "@react-three/drei";

function PerfectDroneModel({ droneRef }: { droneRef: React.RefObject<THREE.Group> }) {
  const rotorRefs = useRef<(THREE.Group | null)[]>([]);
  
  // Rotor-Animation
  useFrame((_, delta) => {
    rotorRefs.current.forEach((rotor) => {
      if (rotor) {
        // Rotoren rotieren lassen (720 Grad pro Sekunde = 2 Umdrehungen pro Sekunde)
        rotor.rotation.y += 2 * Math.PI * 2 * delta;
      }
    });
  });
  
  return (
    <group ref={droneRef}>
      {/* Hauptkörper - Professionelles Design */}
      <Box args={[0.8, 0.12, 0.6]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      
      {/* Mittelteil - Batterie/Kamera Bereich */}
      <Box args={[0.5, 0.08, 0.3]} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#2c2c2c" />
      </Box>
      
      {/* Arme - X-Form wie bei echten Drohnen */}
      <Box args={[0.02, 0.02, 0.9]} position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      <Box args={[0.02, 0.02, 0.9]} position={[-0.45, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      <Box args={[0.9, 0.02, 0.02]} position={[0, 0, 0.45]} rotation={[0, 0, Math.PI / 4]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      <Box args={[0.9, 0.02, 0.02]} position={[0, 0, -0.45]} rotation={[0, 0, -Math.PI / 4]}>
        <meshStandardMaterial color="#1a1a1a" />
      </Box>
      
      {/* Rotoren - Perfekt platziert an den Enden der Arme */}
      <group ref={(el) => (rotorRefs.current[0] = el)} position={[0.32, 0.1, 0.32]}>
        {/* Rotormotor */}
        <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        {/* Rotorblätter */}
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[1] = el)} position={[-0.32, 0.1, 0.32]}>
        <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[2] = el)} position={[0.32, 0.1, -0.32]}>
        <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[3] = el)} position={[-0.32, 0.1, -0.32]}>
        <Cylinder args={[0.05, 0.05, 0.08]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#333333" />
        </Cylinder>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
        <Box args={[0.2, 0.002, 0.04]} position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#666666" transparent opacity={0.9} />
        </Box>
      </group>
      
      {/* Kamera/Gimbal */}
      <Sphere args={[0.04]} position={[0, -0.08, 0]}>
        <meshStandardMaterial color="#e74c3c" />
      </Sphere>
      
      {/* LED-Lichter */}
      <Sphere args={[0.01]} position={[0.1, 0, 0.1]}>
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" />
      </Sphere>
      <Sphere args={[0.01]} position={[-0.1, 0, 0.1]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" />
      </Sphere>
      <Sphere args={[0.01]} position={[0.1, 0, -0.1]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" />
      </Sphere>
      <Sphere args={[0.01]} position={[-0.1, 0, -0.1]}>
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" />
      </Sphere>
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

  return <PerfectDroneModel droneRef={droneRef} />;
}

function Building() {
  return (
    <mesh position={[5, 0.5, -5]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

export default function PerfectDronePage() {
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
