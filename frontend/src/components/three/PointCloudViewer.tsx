import React, { useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const PointCloudViewer: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const pointCloudData = useStore(state => state.pointCloudData);
  const heightExaggeration = useStore(state => state.heightExaggeration);
  const pointSize = useStore(state => state.pointSize);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    if (!pointCloudData || !pointCloudData.vertices || pointCloudData.vertices.length === 0) {
      return geom;
    }

    const vertices = pointCloudData.vertices;
    const colors = pointCloudData.colors;
    const count = vertices.length;

    // Convert vertices to Float32Array
    const positions = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);

    // Find min/max Z for height coloring
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const z = vertices[i][2] || 0;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const zRange = maxZ - minZ || 1;

    for (let i = 0; i < count; i++) {
      // Scale coordinates from [-0.5, 0.5] to [-6, 6] so it fills the scene
      positions[i * 3] = (vertices[i][0] || 0) * 16;
      positions[i * 3 + 1] = ((vertices[i][2] || 0) - minZ) * 4; // Height above ground
      positions[i * 3 + 2] = (vertices[i][1] || 0) * 16;

      const t = ((vertices[i][2] || 0) - minZ) / zRange;
      // Vibrant Hypsometric Colormap: Blue -> Cyan -> Green -> Yellow -> Red
      if (t < 0.2) {
        colorArr[i * 3] = 0.05;
        colorArr[i * 3 + 1] = 0.4;
        colorArr[i * 3 + 2] = 0.95;
      } else if (t < 0.4) {
        colorArr[i * 3] = 0.0;
        colorArr[i * 3 + 1] = 0.8;
        colorArr[i * 3 + 2] = 0.8;
      } else if (t < 0.6) {
        colorArr[i * 3] = 0.1;
        colorArr[i * 3 + 1] = 0.85;
        colorArr[i * 3 + 2] = 0.3;
      } else if (t < 0.8) {
        colorArr[i * 3] = 0.95;
        colorArr[i * 3 + 1] = 0.75;
        colorArr[i * 3 + 2] = 0.05;
      } else {
        colorArr[i * 3] = 0.95;
        colorArr[i * 3 + 1] = 0.2;
        colorArr[i * 3 + 2] = 0.15;
      }
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    geom.computeBoundingSphere();
    return geom;
  }, [pointCloudData]);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.scale.set(1, heightExaggeration, 1);
    }
  });

  if (!pointCloudData || !pointCloudData.vertices?.length) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={(pointSize || 2) * 0.07}
        vertexColors
        sizeAttenuation={true}
        transparent
        opacity={0.95}
      />
    </points>
  );
};

export default PointCloudViewer;
