import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';

const FlythroughPlayer: React.FC = () => {
  const { camera } = useThree();
  const cameraPath = useStore(state => state.cameraPath);
  const flythroughPlaying = useStore(state => state.flythroughPlaying);
  const setFlythroughProgress = useStore(state => state.setFlythroughProgress);
  const flythroughProgress = useStore(state => state.flythroughProgress);
  
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const targetCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  useEffect(() => {
    if (cameraPath && cameraPath.length > 1) {
      const points = cameraPath.map(k => new THREE.Vector3(...k.position));
      const targets = cameraPath.map(k => new THREE.Vector3(...k.target));
      
      curveRef.current = new THREE.CatmullRomCurve3(points);
      targetCurveRef.current = new THREE.CatmullRomCurve3(targets);
    } else {
      curveRef.current = null;
      targetCurveRef.current = null;
    }
  }, [cameraPath]);

  useFrame((state, delta) => {
    if (flythroughPlaying && curveRef.current && targetCurveRef.current) {
      let nextProgress = flythroughProgress + delta * 0.1; // adjust speed here
      if (nextProgress > 1) nextProgress = 0;
      
      setFlythroughProgress(nextProgress);
      
      const pos = curveRef.current.getPointAt(nextProgress);
      const target = targetCurveRef.current.getPointAt(nextProgress);
      
      camera.position.copy(pos);
      camera.lookAt(target);
    }
  });

  return null;
};

export default FlythroughPlayer;
