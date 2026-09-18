import React, { useRef, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const MeshViewer: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const meshData = useStore(state => state.meshData);
  const heightExaggeration = useStore(state => state.heightExaggeration);
  const viewMode = useStore(state => state.viewMode);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    if (!meshData || !meshData.vertices || meshData.vertices.length === 0) {
      return geom;
    }

    const verts = meshData.vertices;
    const colors = meshData.colors;
    const faces = meshData.faces;
    const count = verts.length;

    const positions = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);

    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const z = verts[i][2] || 0;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const zRange = maxZ - minZ || 1;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (verts[i][0] || 0) * 16;
      positions[i * 3 + 1] = ((verts[i][2] || 0) - minZ) * 4;
      positions[i * 3 + 2] = (verts[i][1] || 0) * 16;

      const t = ((verts[i][2] || 0) - minZ) / zRange;
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

    if (faces && faces.length > 0) {
      const indices = new Uint32Array(faces.length * 3);
      for (let i = 0; i < faces.length; i++) {
        indices[i * 3] = faces[i][0];
        indices[i * 3 + 1] = faces[i][1];
        indices[i * 3 + 2] = faces[i][2];
      }
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, [meshData]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(1, heightExaggeration, 1);
    }
  });

  if (!meshData || !meshData.vertices?.length) return null;

  const isWireframe = viewMode === 'wireframe';

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        wireframe={isWireframe}
        side={THREE.DoubleSide}
        roughness={0.5}
        metalness={0.1}
      />
    </mesh>
  );
};

export default MeshViewer;
