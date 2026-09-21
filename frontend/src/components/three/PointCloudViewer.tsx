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

    const verts = pointCloudData.vertices;
    const vertices = verts;
    const colors = pointCloudData.colors;
    const count = verts.length;

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

    const hasColors = colors && colors.length === count;

    for (let i = 0; i < count; i++) {
      // Direct orthographic mapping: X=East/West, Y=Elevation (Up), Z=North/South
      positions[i * 3] = verts[i][0] || 0;
      positions[i * 3 + 1] = verts[i][2] || 0;
      positions[i * 3 + 2] = -(verts[i][1] || 0);

      // Step 7 & 8: Default to true source satellite image RGB
      if (hasColors && colors[i]) {
        colorArr[i * 3] = colors[i][0];
        colorArr[i * 3 + 1] = colors[i][1];
        colorArr[i * 3 + 2] = colors[i][2];
      } else {
        const t = ((verts[i][2] || 0) - minZ) / zRange;
        if (t < 0.25) {
          colorArr[i * 3] = 0.1; colorArr[i * 3 + 1] = 0.5; colorArr[i * 3 + 2] = 0.9;
        } else if (t < 0.5) {
          colorArr[i * 3] = 0.2; colorArr[i * 3 + 1] = 0.8; colorArr[i * 3 + 2] = 0.4;
        } else if (t < 0.75) {
          colorArr[i * 3] = 0.9; colorArr[i * 3 + 1] = 0.7; colorArr[i * 3 + 2] = 0.1;
        } else {
          colorArr[i * 3] = 0.9; colorArr[i * 3 + 1] = 0.2; colorArr[i * 3 + 2] = 0.1;
        }
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
