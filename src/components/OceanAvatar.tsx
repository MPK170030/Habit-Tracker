import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// One emoji per depth level
const LEVEL_EMOJI = ['🐚', '🐟', '🦑', '🐙', '🦈', '🐋', '🔱'];

const CONFIGS = [
  { color: '#22d3ee', emissive: '#164e63', particles: 18,  distort: 0.22, scale: 0.52 },
  { color: '#38bdf8', emissive: '#075985', particles: 28,  distort: 0.28, scale: 0.56 },
  { color: '#60a5fa', emissive: '#1e3a8a', particles: 42,  distort: 0.36, scale: 0.60 },
  { color: '#818cf8', emissive: '#312e81', particles: 58,  distort: 0.43, scale: 0.64 },
  { color: '#a78bfa', emissive: '#4c1d95', particles: 76,  distort: 0.50, scale: 0.68 },
  { color: '#c084fc', emissive: '#581c87', particles: 98,  distort: 0.57, scale: 0.72 },
  { color: '#f472b6', emissive: '#831843', particles: 130, distort: 0.66, scale: 0.80 },
];

// ─── Emoji canvas texture ──────────────────────────────────────────────────────

function useEmojiTexture(emoji: string) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.font         = `${Math.round(size * 0.68)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + 4);
    return new THREE.CanvasTexture(canvas);
  }, [emoji]);
}

// ─── Single icon scene ────────────────────────────────────────────────────────

function Icon({ level }: { level: number }) {
  const cfg   = CONFIGS[Math.min(level - 1, CONFIGS.length - 1)];
  const emoji = LEVEL_EMOJI[Math.min(level - 1, LEVEL_EMOJI.length - 1)];
  const tex   = useEmojiTexture(emoji);
  const orbRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (orbRef.current) {
      // subtle slow-spin to show 3D depth
      orbRef.current.rotation.y = clock.elapsedTime * 0.25;
    }
  });

  return (
    <Float speed={1.4} floatIntensity={0.55} rotationIntensity={0.2}>
      <group>
        {/* Glowing orb — pushed back so distortion doesn't bleed onto emoji */}
        <mesh ref={orbRef} scale={cfg.scale} position={[0, 0, -0.3]}>
          <sphereGeometry args={[1, 48, 48]} />
          <MeshDistortMaterial
            color={cfg.color}
            emissive={cfg.emissive}
            emissiveIntensity={1.6}
            distort={cfg.distort}
            speed={2.5}
            roughness={0}
            metalness={0.05}
            transparent
            opacity={0.22}
          />
        </mesh>

        {/* Emoji — depthTest off so it always renders on top */}
        <mesh position={[0, 0, 0]} renderOrder={1}>
          <planeGeometry args={[cfg.scale * 1.7, cfg.scale * 1.7]} />
          <meshBasicMaterial map={tex} transparent depthTest={false} depthWrite={false} />
        </mesh>

        {/* Thin glow ring */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[cfg.scale * 1.02, cfg.scale * 1.14, 48]} />
          <meshBasicMaterial color={cfg.color} transparent opacity={0.30} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function OceanAvatar({ level }: { level: number }) {
  const cfg = CONFIGS[Math.min(level - 1, CONFIGS.length - 1)];

  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 48 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 0, 2.5]}  intensity={5}   color={cfg.color} />
      <pointLight position={[-1, 1, 1.5]} intensity={1.5} color={cfg.emissive} />

      <Sparkles
        count={cfg.particles}
        scale={4.2}
        size={1.0}
        speed={0.12}
        opacity={0.55}
        color={cfg.color}
      />

      <Icon level={level} />
    </Canvas>
  );
}

export default OceanAvatar;
