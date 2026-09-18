import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';

const CameraPath: React.FC = () => {
  const cameraPath = useStore(state => state.cameraPath);

  const points = useMemo(() => {
    if (!cameraPath || cameraPath.length < 2) return [];
    const curve = new THREE.CatmullRomCurve3(cameraPath.map(p => new THREE.Vector3(...p.position)));
    return curve.getPoints(50);
  }, [cameraPath]);

  if (points.length === 0) return null;

  return (
    <group>
      <Line points={points} color="#06b6d4" lineWidth={2} dashed={false} />
      {cameraPath.map((kf, i) => (
        <mesh key={i} position={kf.position}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      ))}
    </group>
  );
};

export default CameraPath;
