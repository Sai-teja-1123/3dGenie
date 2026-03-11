import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const RADIUS = 3;
const MIN_PHI = 0.25;
const MAX_PHI = Math.PI - 0.35;
const DRAG_SENSITIVITY = 0.009;
const DAMPING = 0.94;
const VELOCITY_THRESHOLD = 0.00015;
const RETURN_DURATION_MS = 380; // smooth return to front when cursor leaves

function sphericalToCartesian(theta: number, phi: number, r: number): [number, number, number] {
  const x = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.cos(theta);
  return [x, y, z];
}

// Orbit camera around the model: drag to orbit (sideways only). Hit plane stays in front of camera so it never gets stuck.
const OrbitCameraController = memo(({ onPointerEnter, onPointerLeave, onFirstInteraction, onDraggingChange, onPointerPosition }: { onPointerEnter?: () => void; onPointerLeave?: () => void; onFirstInteraction?: () => void; onDraggingChange?: (dragging: boolean) => void; onPointerPosition?: (x: number, y: number, active: boolean) => void }) => {
  const { camera, invalidate } = useThree();
  const planeRef = useRef<THREE.Mesh>(null);
  const thetaRef = useRef(0);
  const phiRef = useRef(Math.PI / 2);
  const velThetaRef = useRef(0);
  const velPhiRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number; theta: number; phi: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const _dir = useRef(new THREE.Vector3());
  const hasFiredFirstRef = useRef(false);

  const updateCamera = useCallback(() => {
    const [x, y, z] = sphericalToCartesian(thetaRef.current, phiRef.current, RADIUS);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    // Keep hit plane in front of camera so it's always the first hit (prevents "stuck" after rotating)
    const plane = planeRef.current;
    if (plane) {
      camera.getWorldDirection(_dir.current);
      plane.position.copy(camera.position).add(_dir.current.multiplyScalar(2));
      plane.lookAt(camera.position);
    }
  }, [camera]);

  useEffect(() => {
    updateCamera();
  }, [updateCamera]);

  const handlePointerDown = (e: THREE.Event) => {
    e.stopPropagation();
    if (!hasFiredFirstRef.current) {
      hasFiredFirstRef.current = true;
      onFirstInteraction?.();
    }
    const ev = e as unknown as React.PointerEvent;
    isDraggingRef.current = true;
    onDraggingChange?.(true);
    onPointerPosition?.(ev.clientX, ev.clientY, true);
    startRef.current = {
      x: ev.clientX,
      y: ev.clientY,
      theta: thetaRef.current,
      phi: phiRef.current,
    };
    velThetaRef.current = 0;
    velPhiRef.current = 0;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: THREE.Event) => {
    const ev = e as unknown as React.PointerEvent;
    onPointerPosition?.(ev.clientX, ev.clientY, true);
    if (!isDraggingRef.current || !startRef.current) return;
    const dx = ev.clientX - startRef.current.x;
    thetaRef.current = startRef.current.theta + dx * DRAG_SENSITIVITY;
    velThetaRef.current = dx * DRAG_SENSITIVITY * 0.3;
    velPhiRef.current = 0;
    updateCamera();
    invalidate();
  };

  const endDrag = (e: THREE.Event) => {
    const ev = e as unknown as React.PointerEvent;
    isDraggingRef.current = false;
    onDraggingChange?.(false);
    onPointerPosition?.(0, 0, false);
    startRef.current = null;
    try {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    } catch {
      // ignore
    }
    document.body.style.cursor = '';

    const tick = () => {
      let vT = velThetaRef.current;
      if (Math.abs(vT) < VELOCITY_THRESHOLD) {
        rafRef.current = null;
        return;
      }
      thetaRef.current += vT;
      velThetaRef.current *= DAMPING;
      updateCamera();
      invalidate();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Animate camera back to front (theta = 0) when cursor leaves
  const startReturnToZero = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const startTheta = thetaRef.current;
    // Shortest path to 0 (normalize to [-PI, PI])
    let delta = -startTheta;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    if (Math.abs(delta) < 0.001) return;
    const startTime = performance.now();
    // easeOutQuart: smooth deceleration at end so return feels fluid
    const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / RETURN_DURATION_MS, 1);
      thetaRef.current = startTheta + delta * easeOutQuart(t);
      updateCamera();
      invalidate();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [updateCamera, invalidate]);

  const handlePointerLeave = (e: THREE.Event) => {
    const ev = e as unknown as React.PointerEvent;
    isDraggingRef.current = false;
    onDraggingChange?.(false);
    onPointerPosition?.(0, 0, false);
    startRef.current = null;
    try {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    } catch {
      // ignore
    }
    document.body.style.cursor = '';
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onPointerLeave?.();
    startReturnToZero();
  };

  return (
    <mesh
      ref={planeRef}
      position={[0, 0, 2]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerEnter={() => onPointerEnter?.()}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
});
OrbitCameraController.displayName = 'OrbitCameraController';

// Wrapper: model stays fixed; -90° Y so character faces camera (GLB default faces right)
const ModelWrapper = memo(({ children }: { children: React.ReactNode }) => {
  return <group rotation={[0, -Math.PI / 2, 0]}>{children}</group>;
});
ModelWrapper.displayName = 'ModelWrapper';

// Intro + idle breathing: scale animation with frameloop="demand"
const INTRO_DURATION_MS = 600;
const IDLE_DELAY_MS = 3200;
const BREATHE_DURATION_MS = 2400;
const BREATHE_SCALE = 1.018;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

const ModelEffects = memo(({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    let rafId: number;
    const start = performance.now();

    const run = () => {
      const elapsed = performance.now() - start;

      // Intro: 0.96 -> 1 over INTRO_DURATION_MS
      if (elapsed < INTRO_DURATION_MS) {
        const t = easeOutCubic(elapsed / INTRO_DURATION_MS);
        group.scale.setScalar(0.96 + 0.04 * t);
        invalidate();
        rafId = requestAnimationFrame(run);
        return;
      }
      group.scale.setScalar(1);

      // After idle delay: gentle breathe 1 -> 1.02 -> 1, twice then stop
      const afterIntro = elapsed - INTRO_DURATION_MS;
      if (afterIntro < IDLE_DELAY_MS) {
        invalidate();
        rafId = requestAnimationFrame(run);
        return;
      }

      const breatheStart = afterIntro - IDLE_DELAY_MS;
      const cycle = BREATHE_DURATION_MS / 2;
      if (breatheStart >= BREATHE_DURATION_MS * 2) {
        group.scale.setScalar(1);
        return; // stop loop after 2 breathe cycles
      }
      if (breatheStart >= 0) {
        const inCycle = breatheStart % cycle;
        const t = inCycle / cycle;
        const s = t < 0.5
          ? 1 + (BREATHE_SCALE - 1) * easeOutCubic(t * 2)
          : BREATHE_SCALE - (BREATHE_SCALE - 1) * easeOutCubic((t - 0.5) * 2);
        group.scale.setScalar(s);
        invalidate();
      }

      rafId = requestAnimationFrame(run);
    };

    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
  }, [invalidate]);

  return <group ref={groupRef}>{children}</group>;
});
ModelEffects.displayName = 'ModelEffects';

const HeroLighting = memo(({ isHovered }: { isHovered: boolean }) => {
  const { invalidate } = useThree();
  const ambient = isHovered ? 0.5 : 0.42;
  const key = isHovered ? 1.1 : 0.9;
  const fill = isHovered ? 0.6 : 0.5;
  const rim = isHovered ? 0.35 : 0.28;
  useEffect(() => {
    invalidate();
  }, [isHovered, invalidate]);
  return (
    <>
      <ambientLight intensity={ambient} color="#ffffff" />
      <hemisphereLight args={['#ffeedd', '#8866bb', 0.3]} />
      <directionalLight position={[5, 5, 3]} intensity={key} color="#fff5e8" />
      <directionalLight position={[-3, 2, 3]} intensity={fill} color="#eef0ff" />
      <directionalLight position={[0, 2.5, -4]} intensity={rim} color="#f0f0ff" />
      <directionalLight position={[0, 7, 0]} intensity={0.5} color="#ffffff" />
    </>
  );
});
HeroLighting.displayName = 'HeroLighting';

// Smooth scale-up on hover for tactile feedback (lerp over 150ms)
const HOVER_SCALE_TARGET = 1.025;
const HOVER_LERP_MS = 150;

const HoverScale = memo(({ children, isHovered }: { children: React.ReactNode; isHovered: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const currentScaleRef = useRef(1);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const target = isHovered ? HOVER_SCALE_TARGET : 1;
    const start = currentScaleRef.current;
    const startTime = performance.now();
    let rafId: number;
    const tick = () => {
      const t = Math.min((performance.now() - startTime) / HOVER_LERP_MS, 1);
      const s = start + (target - start) * (1 - (1 - t) ** 3); // easeOutCubic
      currentScaleRef.current = s;
      group.scale.setScalar(s);
      invalidate();
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isHovered, invalidate]);

  return <group ref={groupRef}>{children}</group>;
});
HoverScale.displayName = 'HoverScale';

// Scale model up on small viewports (mobile) so it doesn't look tiny
const MOBILE_BREAKPOINT = 768;
const MOBILE_SCALE = 1.45;

const ResponsiveScale = memo(({ children }: { children: React.ReactNode }) => {
  const { size, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const s = size.width < MOBILE_BREAKPOINT ? MOBILE_SCALE : 1;
    g.scale.setScalar(s);
    invalidate();
  }, [size.width, invalidate]);
  return <group ref={groupRef}>{children}</group>;
});
ResponsiveScale.displayName = 'ResponsiveScale';

// Mouse parallax: model tilts subtly toward cursor. Smoothed, disabled when dragging or when user prefers reduced motion.
const PARALLAX_MAX_Y_RAD = 0.14;
const PARALLAX_MAX_X_RAD = 0.1;
const PARALLAX_LERP = 0.07;

type PointerPosRef = React.MutableRefObject<{ clientX: number; clientY: number; active: boolean }>;

const MouseParallax = memo(({ children, isDragging, lastPointerRef }: { children: React.ReactNode; isDragging: boolean; lastPointerRef: PointerPosRef }) => {
  const { gl, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const reduceMotion = useRef(false);
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      lastPointerRef.current = { clientX: e.clientX, clientY: e.clientY, active: true };
      invalidateRef.current();
    };
    const onLeave = () => {
      lastPointerRef.current = { clientX: 0, clientY: 0, active: false };
      invalidateRef.current();
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, lastPointerRef]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || reduceMotion.current) return;
    const { clientX, clientY, active } = lastPointerRef.current;
    if (!active) {
      targetX.current = 0;
      targetY.current = 0;
    } else {
      const r = gl.domElement.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        targetX.current = (clientX - r.left) / r.width * 2 - 1;
        targetY.current = 1 - (clientY - r.top) / r.height * 2;
      }
    }
    const tx = targetX.current * PARALLAX_MAX_Y_RAD;
    const ty = targetY.current * PARALLAX_MAX_X_RAD;
    currentX.current += (ty - currentX.current) * PARALLAX_LERP;
    currentY.current += (tx - currentY.current) * PARALLAX_LERP;
    group.rotation.x = currentX.current;
    group.rotation.y = currentY.current;
    invalidate();
  });

  return <group ref={groupRef}>{children}</group>;
});
MouseParallax.displayName = 'MouseParallax';

// Wraps scene with hover state for lighting feedback
const HeroScene = memo(({ modelUrl, onFirstInteraction }: { modelUrl?: string | null; onFirstInteraction?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const pointerPosRef = useRef({ clientX: 0, clientY: 0, active: false });
  return (
    <>
      <OrbitCameraController
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onFirstInteraction={onFirstInteraction}
        onDraggingChange={setIsDragging}
        onPointerPosition={(x, y, active) => {
          pointerPosRef.current = { clientX: x, clientY: y, active };
        }}
      />
      <HeroLighting isHovered={isHovered} />
      <ResponsiveScale>
        <MouseParallax isDragging={isDragging} lastPointerRef={pointerPosRef}>
          <HoverScale isHovered={isHovered}>
            <AnimeCharacter modelUrl={modelUrl} />
          </HoverScale>
        </MouseParallax>
      </ResponsiveScale>
    </>
  );
});
HeroScene.displayName = 'HeroScene';

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
      // Use Hero3d.glb (~29MB) - override materials to match OBJ white lighting (remove orange glow)
      const loader = new GLTFLoader();
      loader.load(
        '/Hero3d.glb',
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
          // Override GLB materials to match OBJ white lighting (remove orange glow)
          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                    mat.emissive = new THREE.Color(0x1a0a2e);
                    mat.emissiveIntensity = 0.08;
                    mat.roughness = 0.55;
                    mat.metalness = 0.05;
                    mat.envMapIntensity = 0.6;
                  }
                });
              }
            }
          });
          object.scale.setScalar(2.5);
          object.position.set(0, -0.1, 0);
          if (isMounted) {
            setModel(object);
            setLoading(false);
          }
        },
        undefined,
        (error) => {
          console.error('Error loading default GLB:', error);
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
        
        object.scale.setScalar(2.5);
        object.position.set(0, -0.1, 0);
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
      <ModelEffects>
        <ModelWrapper>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[3.5, 32, 32]} />
            <meshStandardMaterial color="#8b5cf6" wireframe emissive="#8b5cf6" emissiveIntensity={0.3} />
          </mesh>
        </ModelWrapper>
      </ModelEffects>
    );
  }

  if (error) {
    return (
      <ModelEffects>
        <ModelWrapper>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[7.0, 7.0, 7.0]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
          </mesh>
        </ModelWrapper>
      </ModelEffects>
    );
  }

  if (!model) {
    return (
      <ModelEffects>
        <ModelWrapper>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[7.0, 7.0, 7.0]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
          </mesh>
        </ModelWrapper>
      </ModelEffects>
    );
  }

  return (
    <ModelEffects>
      <ModelWrapper>
        <primitive object={model} ref={meshRef} />
      </ModelWrapper>
    </ModelEffects>
  );
});

AnimeCharacter.displayName = 'AnimeCharacter';

// Main 3D viewer component
interface ModelViewer3DProps {
  modelUrl?: string | null;
  onFirstInteraction?: () => void;
}

const ModelViewer3D: React.FC<ModelViewer3DProps> = memo(({ modelUrl, onFirstInteraction }) => {
  const dpr: [number, number] = [1, 1.5];

  return (
    <div className="w-full h-full touch-none select-none" style={{ transform: 'translateZ(0)', isolation: 'isolate', cursor: 'grab', touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
        }}
        dpr={dpr}
        frameloop="demand"
        performance={{ min: 1 }}
      >
        <HeroScene modelUrl={modelUrl} onFirstInteraction={onFirstInteraction} />
      </Canvas>
    </div>
  );
});

ModelViewer3D.displayName = 'ModelViewer3D';

export default ModelViewer3D;
