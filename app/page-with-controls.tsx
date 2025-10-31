"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Box, Cylinder, Sphere } from "@react-three/drei";

function DroneModel({ droneRef, rpm, spinning }: { 
  droneRef: React.RefObject<THREE.Group>, 
  rpm: number, 
  spinning: boolean 
}) {
  const rotorRefs = useRef<(THREE.Group | null)[]>([]);
  
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
  
  return (
    <group ref={droneRef}>
      {/* Body - central pod */}
      <Sphere args={[0.5, 32, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial metalness={0.6} roughness={0.4} />
      </Sphere>
      
      {/* Arms */}
      <Box args={[1.8, 0.12, 0.12]} position={[0.9, 0, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.3} roughness={0.6} />
      </Box>
      <Box args={[1.8, 0.12, 0.12]} position={[0, 0, 0.9]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.3} roughness={0.6} />
      </Box>
      <Box args={[1.8, 0.12, 0.12]} position={[-0.9, 0, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.3} roughness={0.6} />
      </Box>
      <Box args={[1.8, 0.12, 0.12]} position={[0, 0, -0.9]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.3} roughness={0.6} />
      </Box>
      
      {/* Propeller holders */}
      <Box args={[0.16, 0.08, 0.16]} position={[1.1, 0, 0]}>
        <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
      </Box>
      <Box args={[0.16, 0.08, 0.16]} position={[0, 0, 1.1]}>
        <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
      </Box>
      <Box args={[0.16, 0.08, 0.16]} position={[-1.1, 0, 0]}>
        <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
      </Box>
      <Box args={[0.16, 0.08, 0.16]} position={[0, 0, -1.1]}>
        <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
      </Box>
      
      {/* Rotors - korrekt platziert und animiert */}
      <group ref={(el) => (rotorRefs.current[0] = el)} position={[1.1, 0.06, 0]}>
        {/* Hub */}
        <Cylinder args={[0.06, 0.06, 0.12, 12]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
        </Cylinder>
        {/* Blades */}
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[1] = el)} position={[0, 0.06, 1.1]}>
        <Cylinder args={[0.06, 0.06, 0.12, 12]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
        </Cylinder>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[2] = el)} position={[-1.1, 0.06, 0]}>
        <Cylinder args={[0.06, 0.06, 0.12, 12]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
        </Cylinder>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
      </group>
      
      <group ref={(el) => (rotorRefs.current[3] = el)} position={[0, 0.06, -1.1]}>
        <Cylinder args={[0.06, 0.06, 0.12, 12]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.5} />
        </Cylinder>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
        <Box args={[0.9, 0.02, 0.12]} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.8} />
        </Box>
      </group>
    </group>
  );
}

function DroneControls() {
  const droneRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  const [targetDir, setTargetDir] = useState(new THREE.Vector3(0, 0, -1));
  const [isFlying, setIsFlying] = useState(false);
  const [rpm, setRpm] = useState(2000);
  const [spinning, setSpinning] = useState(true);

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

  return <DroneModel droneRef={droneRef} rpm={rpm} spinning={spinning} />;
}

function Building() {
  return (
    <mesh position={[5, 0.5, -5]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
}

export default function HomeWithControls() {
  const [rpm, setRpm] = useState(2000);
  const [spinning, setSpinning] = useState(true);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Kontrollen */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        color: "#fff",
        fontFamily: "sans-serif",
        zIndex: 10,
        background: "rgba(0,0,0,0.5)",
        padding: "10px",
        borderRadius: "8px"
      }}>
        <button 
          onClick={() => setSpinning(!spinning)}
          style={{
            background: "#ffffff33",
            color: "white",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "8px",
            border: "none"
          }}
        >
          {spinning ? 'Pause Rotors' : 'Resume Rotors'}
        </button>
        <label style={{ marginLeft: "8px" }}>
          RPM: 
          <input 
            type="range" 
            min="100" 
            max="8000" 
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            style={{ marginLeft: "8px" }}
          />
          <span style={{ marginLeft: "8px" }}>{rpm}</span>
        </label>
      </div>

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
