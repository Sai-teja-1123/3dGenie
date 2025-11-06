import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

function AutoRotate({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return <group ref={ref}>{children}</group>;
}

function CharacterModel() {
  const [object3d, setObject3d] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const texture = useTexture("/tripo_image_116fd530-8f07-4d68-8c46-278b55d2d11f_0.jpg");

  useEffect(() => {
    const loader = new OBJLoader();
    loader.load(
      "/tripo_convert_116fd530-8f07-4d68-8c46-278b55d2d11f.obj",
      (object) => {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({ map: texture });
          }
        });
        object.scale.setScalar(2.2);
        object.position.set(0, 0.05, 0);
        setObject3d(object);
        setLoading(false);
      },
      undefined,
      () => setLoading(false)
    );
  }, [texture]);

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
}

<<<<<<< HEAD
const MiniModel3D = ({ heightClass = "h-56" }: { heightClass?: string }) => {
  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden bg-black/50`}>
      <Canvas camera={{ position: [0, 0.8, 2.4], fov: 45 }} style={{ width: "100%", height: "100%" }}>
=======
const MiniModel3D = () => {
  return (
    <div className="w-full h-56 rounded-xl overflow-hidden bg-black/50">
      <Canvas camera={{ position: [0, 0.7, 2.0], fov: 45 }} style={{ width: "100%", height: "100%" }}>
>>>>>>> 8fbf66df8942473647be6535d2d82aec5565e4dd
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <directionalLight position={[-2, 2, 1]} intensity={0.8} color="#ffdcb2" />
        <CharacterModel />
      </Canvas>
    </div>
  );
};

export default MiniModel3D;



