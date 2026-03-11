import React, { useEffect, useRef, useState, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

const AutoRotate = memo(({ children }: { children: React.ReactNode }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return <group ref={ref}>{children}</group>;
});

AutoRotate.displayName = 'AutoRotate';

const CharacterModel = memo(() => {
  const [object3d, setObject3d] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = new GLTFLoader();
    
    loader.load(
      "/Hero3d.glb",
      (gltf) => {
        if (!isMounted) {
          gltf.scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          return;
        }
        const object = gltf.scene;
        loadedRef.current = object;
        // Override GLB materials to match OBJ white lighting (remove orange glow)
        object.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.emissive = new THREE.Color(0x000000);
                mat.emissiveIntensity = 0;
                mat.roughness = 0.6;
                mat.metalness = 0.0;
              }
            });
          }
        });
        object.scale.setScalar(2.2);
        object.position.set(0, 0.05, 0);
        if (isMounted) {
          setObject3d(object);
          setLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      const obj = loadedRef.current;
      if (obj) {
        obj.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        loadedRef.current = null;
      }
    };
  }, []);

  if (loading || !object3d) {
    return (
      <AutoRotate>
        <mesh>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      </AutoRotate>
    );
  }

  return (
    <AutoRotate>
      <primitive object={object3d} />
    </AutoRotate>
  );
});

CharacterModel.displayName = 'CharacterModel';

const MiniModel3D = memo(({ heightClass = "h-56" }: { heightClass?: string }) => {
  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden bg-black/50`}>
      <Canvas 
        camera={{ position: [0, 0.8, 2.4], fov: 45 }} 
        style={{ width: "100%", height: "100%" }}
        gl={{ 
          antialias: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        {/* Optimized lighting - reduced from 3 to 2 lights */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 2]} intensity={1.3} />
        <CharacterModel />
      </Canvas>
    </div>
  );
});

MiniModel3D.displayName = 'MiniModel3D';

export default MiniModel3D;


