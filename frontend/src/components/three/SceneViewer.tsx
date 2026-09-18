import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Bounds } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import PointCloudViewer from './PointCloudViewer';
import MeshViewer from './MeshViewer';
import FlythroughPlayer from './FlythroughPlayer';
import CameraPath from './CameraPath';

interface SceneViewerProps {
  children?: React.ReactNode;
  showFlythrough?: boolean;
}

const SceneViewer: React.FC<SceneViewerProps> = ({ children, showFlythrough = false }) => {
  const viewMode = useStore(state => state.viewMode);
  const flythroughPlaying = useStore(state => state.flythroughPlaying);

  return (
    <div className="w-full h-full relative bg-slate-100">
      <Canvas camera={{ position: [6, 10, 14], fov: 48 }} gl={{ preserveDrawingBuffer: true }}>
        {/* Crisp Light Studio Background */}
        <color attach="background" args={['#f8fafc']} />
        <fog attach="fog" args={['#f8fafc', 25, 80]} />
        
        {/* High-Key Studio Lighting */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[15, 25, 15]} intensity={1.6} castShadow />
        <directionalLight position={[-15, 15, -15]} intensity={0.8} />
        <hemisphereLight args={['#ffffff', '#cbd5e1', 0.8]} />
        
        {/* Clean Contrast Light Grid */}
        <Grid 
          args={[30, 30]} 
          sectionColor="#0284c7" 
          cellColor="#cbd5e1" 
          sectionSize={3} 
          cellSize={1} 
          fadeDistance={50} 
          position={[0, -0.01, 0]}
        />
        <axesHelper args={[5]} />
        
        <OrbitControls 
          makeDefault 
          dampingFactor={0.08} 
          enabled={!flythroughPlaying} 
          maxPolarAngle={Math.PI / 2.05} // prevent going underneath the ground
        />
        
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.25}>
            {viewMode === 'pointcloud' ? (
              <PointCloudViewer />
            ) : (
              <MeshViewer />
            )}
          </Bounds>

          {showFlythrough && (
            <>
              <FlythroughPlayer />
              <CameraPath />
            </>
          )}

          {children}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SceneViewer;
