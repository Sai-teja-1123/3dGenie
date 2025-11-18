import React, { useRef, useEffect, useState, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

// Component for rotating the model
const RotatingModel = memo(({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3; // Rotate 0.3 radians per second
    }
  });

  return <group ref={groupRef}>{children}</group>;
});

RotatingModel.displayName = 'RotatingModel';

// Component for the anime character model
const AnimeCharacter = memo(({ modelUrl }: { modelUrl?: string | null }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadedTextures: THREE.Texture[] = [];
    const loadedMaterials: THREE.Material[] = [];
    
    const textureLoader = new THREE.TextureLoader();
    
    const loadDefaultModel = () => {
      const loader = new OBJLoader();
      loader.load(
        '/tripo_convert_116fd530-8f07-4d68-8c46-278b55d2d11f.obj',
        (object) => {
          if (!isMounted) {
            object.traverse((child: THREE.Object3D) => {
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

          textureLoader.load(
            '/tripo_image_116fd530-8f07-4d68-8c46-278b55d2d11f_0.jpg',
            (texture) => {
              if (!isMounted) {
                texture.dispose();
                return;
              }
              
              loadedTextures.push(texture);
              
              object.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                  const material = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.6,
                    metalness: 0.0,
                    emissive: new THREE.Color(0x111111),
                    emissiveIntensity: 0.1,
                    side: THREE.DoubleSide,
                    flatShading: false
                  });
                  loadedMaterials.push(material);
                  child.material = material;
                }
              });
              object.scale.setScalar(3.5);
              object.position.set(0, 0.1, 0);
              
              if (isMounted) {
                setModel(object);
                setLoading(false);
              }
            },
            undefined,
            (error) => {
              console.error('Error loading texture:', error);
              if (isMounted) {
                setLoading(false);
              }
            }
          );
        },
        undefined,
        (error) => {
          console.error('Error loading default OBJ:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      );
    };

    setLoading(true);
    setError(null);
    
    // If no model URL, use default model
    if (!modelUrl) {
      loadDefaultModel();
      return () => {
        isMounted = false;
        loadedTextures.forEach(tex => tex.dispose());
        loadedMaterials.forEach(mat => mat.dispose());
      };
    }

    // Load model from URL - support both OBJ and GLB
    const isGLB = modelUrl.toLowerCase().endsWith('.glb');
    const loader = isGLB ? new GLTFLoader() : new OBJLoader();
    
    loader.load(
      modelUrl,
      (loaded) => {
        if (!isMounted) return;
        
        // Handle GLB format (GLTFLoader returns { scene, animations, etc })
        const object = isGLB ? (loaded as any).scene : loaded as THREE.Group;
        
        // Try to find texture file (same name but .jpg/.png)
        const baseUrl = modelUrl.substring(0, modelUrl.lastIndexOf('/'));
        const baseName = modelUrl.substring(modelUrl.lastIndexOf('/') + 1).replace(/\.(obj|glb)$/i, '');
        
        object.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            // GLB files usually have materials embedded, but we can try to enhance them
            if (isGLB && child.material) {
              // Keep existing material but enhance it
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.roughness = 0.6;
                child.material.metalness = 0.0;
                child.material.emissive = new THREE.Color(0x111111);
                child.material.emissiveIntensity = 0.1;
              }
            } else {
              // For OBJ files, try to load texture
              const textureUrl = `${baseUrl}/${baseName}_0.jpg`;
              
              textureLoader.load(
                textureUrl,
                (texture) => {
                  if (!isMounted) {
                    texture.dispose();
                    return;
                  }
                  
                  loadedTextures.push(texture);
                  const material = new THREE.MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.6,
                    metalness: 0.0,
                    emissive: new THREE.Color(0x111111),
                    emissiveIntensity: 0.1,
                    side: THREE.DoubleSide,
                    flatShading: false
                  });
                  loadedMaterials.push(material);
                  child.material = material;
                },
                undefined,
                () => {
                  if (!isMounted) return;
                  
                  // If texture fails, use default material
                  const material = new THREE.MeshStandardMaterial({ 
                    color: 0x8b5cf6,
                    roughness: 0.6,
                    metalness: 0.0,
                    emissive: new THREE.Color(0x111111),
                    emissiveIntensity: 0.1,
                    side: THREE.DoubleSide
                  });
                  loadedMaterials.push(material);
                  child.material = material;
                }
              );
            }
          }
        });
        
        // Scale the model to fit
        object.scale.setScalar(3.5);
        object.position.set(0, 0.1, 0);
        
        if (isMounted) {
          setModel(object);
          setLoading(false);
        }
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        if (isMounted) {
          setError('Failed to load 3D model');
          setLoading(false);
        }
      }
    );

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Dispose all loaded textures
      loadedTextures.forEach(texture => {
        texture.dispose();
      });
      
      // Dispose all loaded materials
      loadedMaterials.forEach(material => {
        material.dispose();
      });
      
      // Dispose model if it exists
      if (model) {
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [modelUrl]);

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

  if (error) {
    return (
      <RotatingModel>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[7.0, 7.0, 7.0]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
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
});

AnimeCharacter.displayName = 'AnimeCharacter';

// Main 3D viewer component
interface ModelViewer3DProps {
  modelUrl?: string | null;
}

const ModelViewer3D: React.FC<ModelViewer3DProps> = memo(({ modelUrl }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.84,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        {/* Optimized lighting - reduced from 8 to 4 lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, 2, 3]} intensity={1.0} color="#ffddaa" />
        <pointLight position={[2, 2, 2]} intensity={1.5} color="#ff6b6b" />
        <AnimeCharacter modelUrl={modelUrl} />
      </Canvas>
    </div>
  );
});

ModelViewer3D.displayName = 'ModelViewer3D';

export default ModelViewer3D;
