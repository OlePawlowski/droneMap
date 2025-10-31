// Debug-Script um die DJI-Drohne zu analysieren
import { useGLTF } from '@react-three/drei';

function DebugDrone() {
  const { scene } = useGLTF('/dji_drone.glb');
  
  console.log('=== DJI Drohne Analyse ===');
  console.log('Scene:', scene);
  
  // Alle Objekte durchgehen und Namen ausgeben
  scene.traverse((child) => {
    console.log('Objekt:', child.name, 'Typ:', child.type, 'Position:', child.position);
  });
  
  return null;
}

export default DebugDrone;
