import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface GalleryItem3DProps {
  title: string;
  description: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  style?: string;
}

function AnimeCharacter({ color = '#8b5cf6', style }: { color?: string; style?: string }) {
  // Different 3D shapes to represent different anime character styles
  
  if (style === 'warrior') {
    // Sword-like shape for warriors
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  } else if (style === 'mage') {
    // Staff-like shape for mages
    return (
      <group>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <coneGeometry args={[0.15, 0.2, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  } else if (style === 'ninja') {
    // Compact agile shape for ninjas
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.15, 0.1, 16, 100]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <boxGeometry args={[0.2, 0.4, 0.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  } else {
    // Default generic character shape
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }
}

interface CharacterModelProps {
  color?: string;
  style?: string;
}

function CharacterModel({ color, style }: CharacterModelProps) {
  return <AnimeCharacter color={color} style={style} />;
}

const GalleryItem3D: React.FC<GalleryItem3DProps> = ({ 
  title, 
  description, 
  position,
  rotation,
  color,
  style
}) => {
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
      {/* 3D Canvas */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, -5, -5]} intensity={1.0} />
          <Suspense fallback={null}>
            <group position={position} rotation={rotation}>
              <CharacterModel color={color} style={style} />
            </group>
            <OrbitControls enablePan={false} enableZoom={false} autoRotate />
          </Suspense>
        </Canvas>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
          <h3 className="text-lg font-bold text-primary mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/20 text-xs font-semibold text-primary">
            3D Model
          </span>
        </div>
      </div>
    </div>
  );
};

export default GalleryItem3D;
