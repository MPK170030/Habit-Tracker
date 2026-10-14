import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// ─── Shader ───────────────────────────────────────────────────────────────────

const causticsShader = {
  uniforms: {
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color('#006994') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3  uColor;
    varying vec2  vUv;

    void main() {
      vec2 p    = vUv * 8.0;
      vec2 i    = p;
      float c     = 1.0;
      float inten = 0.13;

      for (int n = 0; n < 5; n++) {
        float t = uTime * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y),
                     sin(t - i.y) + cos(t + i.x));
        // max prevents 1/0 at UV corners where p ≈ (0,0)
        c += 1.0 / max(length(vec2(p.x / (sin(i.x + t) / inten),
                                   p.y / (cos(i.y + t) / inten))), 0.8);
      }

      c /= float(5);
      c  = 1.17 - pow(c, 1.4);

      vec3 waterColor = mix(uColor, vec3(1.0), clamp(pow(abs(c), 8.0), 0.0, 1.0));
      gl_FragColor = vec4(waterColor, 1.0);
    }
  `,
};

// ─── Background plane ─────────────────────────────────────────────────────────

function ShaderBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime * 0.5;
  });

  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[50, 30]} />
      <shaderMaterial ref={matRef} args={[causticsShader]} />
    </mesh>
  );
}

// ─── Bubbles (scaled for the 20×15 world space) ───────────────────────────────

const BUBBLES = Array.from({ length: 22 }, () => ({
  x:      (Math.random() - 0.5) * 16,
  y:      Math.random() * 14 - 7,
  speed:  0.6 + Math.random() * 1.1,
  size:   0.06 + Math.random() * 0.10,
  wobble: Math.random() * Math.PI * 2,
  z:      (Math.random() - 0.5) * 1.5,
}));

function Bubbles() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    BUBBLES.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      const raw = b.y + (t * b.speed) % 14;
      m.position.y = raw > 7 ? raw - 14 : raw;
      m.position.x = b.x + Math.sin(t * 0.4 + b.wobble) * 0.3;
    });
  });

  return (
    <>
      {BUBBLES.map((b, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.size, 6, 6]} />
          <meshBasicMaterial color="#cffafe" transparent opacity={0.22} />
        </mesh>
      ))}
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CausticsBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', width: '100vw', height: '100vh' }}>
      <Canvas style={{ width: '100%', height: '100%' }}>
        <ShaderBackground />
        <Bubbles />
      </Canvas>
    </div>
  );
}

export default CausticsBackground;
