'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Float, PresentationControls } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  return (
    <PresentationControls
      global={false}
      cursor={true}
      snap={true}
      speed={1}
      zoom={1}
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 6, Math.PI / 6]}
      azimuth={[-Math.PI / 6, Math.PI / 6]}
    >
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
        <primitive 
          object={scene} 
          ref={modelRef} 
          scale={scale} 
          position={[-0.2, -1, 0]}
          rotation={[0, -Math.PI / 6, 0]}
        />
      </Float>
    </PresentationControls>
  );
}

export default function Clock3D() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const modelUrl = isDark ? '/black_clock.glb' : '/white_clock.glb';

  return (
    <div className="w-full h-[500px] md:h-[700px] relative">
      <Canvas
        camera={{ position: [0, -1.5, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={isDark ? 0.5 : 0.8} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={isDark ? 0.8 : 1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Environment preset={isDark ? "city" : "studio"} />
        
        <Model url={modelUrl} scale={isDark ? 9 : 9 } />
      </Canvas>
    </div>
  );
}

// Preload models
useGLTF.preload('/white_clock.glb');
useGLTF.preload('/black_clock.glb');
