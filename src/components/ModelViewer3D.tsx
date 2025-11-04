import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

// Component for rotating the model
function RotatingModel({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3; // Rotate 0.3 radians per second
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// Component for the anime character model
function AnimeCharacter() {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load the texture
  const texture = useTexture('/tripo_image_116fd530-8f07-4d68-8c46-278b55d2d11f_0.jpg');

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      '/tripo_convert_116fd530-8f07-4d68-8c46-278b55d2d11f.obj',
      (object) => {
        // Apply the texture to all meshes
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({ 
              map: texture,
              roughness: 0.6,
              metalness: 0.0,
              emissive: new THREE.Color(0x111111),
              emissiveIntensity: 0.1,
              side: THREE.DoubleSide,
              flatShading: false
            });
          }
        });
        
        // Scale the model to fit full screen
        object.scale.setScalar(3.5);
        object.position.set(0, 0.1, 0);
        
        setModel(object);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading OBJ:', error);
        setLoading(false);
      }
    );
  }, [texture]);

  if (loading) {
    return (
      <RotatingModel>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[3.5, 32, 32]} />
          <meshStandardMaterial color="#8b5cf6" wireframe emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </RotatingModel>
    );
  }

  if (!model) {
    return (
      <RotatingModel>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[7.0, 7.0, 7.0]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </RotatingModel>
    );
  }

  return (
    <RotatingModel>
      <primitive object={model} ref={meshRef} />
    </RotatingModel>
  );
}

// Main 3D viewer component
const ModelViewer3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.84 // Increased by 20% for brighter appearance
        }}
      >
        <ambientLight intensity={0.48} />
        <directionalLight position={[5, 5, 5]} intensity={0.84} color="#ffffff" />
        <directionalLight position={[-3, 2, 3]} intensity={1.8} color="#ffddaa" />
        <pointLight position={[0, 3, 2]} intensity={1.8} color="#ff6b6b" />
        <pointLight position={[2, 1, 1]} intensity={1.44} color="#4ecdc4" />
        <pointLight position={[-2, 1, 1]} intensity={1.32} color="#ff9f43" />
        <pointLight position={[0, -2, 1]} intensity={1.2} color="#ff6348" />
        {/* Additional red lighting for face/hands */}
        <pointLight position={[1, 2, 1]} intensity={0.96} color="#8B0000" />
        <pointLight position={[-1, 2, 1]} intensity={0.96} color="#8B0000" />
        <AnimeCharacter />
      </Canvas>
    </div>
  );
};

export default ModelViewer3D;
