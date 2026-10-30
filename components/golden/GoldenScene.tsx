import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Golden Overture: a champagne-gold ribbon and three musical notes for the landing hero.
 * Adapted from the Golden Overture Sprint 1 starter (TAVY_Golden_Overture_Sprint1.zip).
 * Decorative only: no audio, no routing, no saved state. Every note can also be chosen with the
 * HTML buttons in GoldenHero, so nothing here requires a pointer.
 */

export type NoteKind = 'whole' | 'eighth' | 'double';

const GOLD = '#d9b77e';
const DEEP_GOLD = '#c39a5c';
const BLUSH = '#ebc4c0';

/** Damping speed for every eased value (higher is snappier). */
const EASE = 5;

interface SceneProps {
  /** Animate continuously; false holds the current pose (paused, off-screen or reduced motion). */
  playing: boolean;
  reducedMotion: boolean;
  active: NoteKind | null;
  onSelect: (kind: NoteKind) => void;
  /** 0 at the top of the hero, 1 once it has scrolled away. Read every frame, so it never re-renders. */
  progressRef: React.MutableRefObject<number>;
}

/** Procedural studio reflections so the gold reads as polished metal without downloading an HDR. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.9;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Frame-rate independent easing factor. */
const damp = (delta: number, reduced: boolean) => (reduced ? 1 : 1 - Math.exp(-Math.min(delta, 1 / 30) * EASE));

function Ribbon({ playing, reducedMotion, progressRef, clock }: SceneProps & { clock: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const { main, accent } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 110; i++) {
      const t = i / 110;
      pts.push(
        new THREE.Vector3(
          -3.6 + t * 7.2,
          Math.sin(t * Math.PI * 3.2) * (0.37 + Math.sin(t * Math.PI) * 0.18),
          Math.cos(t * Math.PI * 2.2) * 0.55,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return {
      main: new THREE.TubeGeometry(curve, 260, 0.095, 16, false),
      accent: new THREE.TubeGeometry(curve, 200, 0.026, 8, false),
    };
  }, []);
  useEffect(() => () => {
    main.dispose();
    accent.dispose();
  }, [main, accent]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = damp(delta, reducedMotion);
    const p = progressRef.current;
    const t = clock.current;
    const sway = playing ? Math.sin(t * 0.19) * 0.13 : 0;
    const bob = playing ? Math.sin(t * 0.34) * 0.055 : 0;
    g.rotation.y += (sway + p * 0.22 - g.rotation.y) * k;
    g.position.y += (bob - p * 0.25 - g.position.y) * k;
    const s = 1 - p * 0.12;
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * k);
  });

  return (
    <group ref={group}>
      <group rotation={[0.16, -0.13, -0.12]}>
        <mesh geometry={main}>
          <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.24} clearcoat={0.7} clearcoatRoughness={0.18} />
        </mesh>
        {/* A thinner blush strand that trails behind the gold */}
        <mesh geometry={accent} position={[0, -0.13, -0.14]}>
          <meshPhysicalMaterial color={BLUSH} metalness={0.35} roughness={0.32} clearcoat={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function MusicalNote({
  kind,
  position,
  playing,
  reducedMotion,
  active,
  onSelect,
  progressRef,
  clock,
}: Omit<SceneProps, 'active'> & {
  kind: NoteKind;
  position: [number, number, number];
  active: boolean;
  clock: React.MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const { invalidate } = useThree();
  const phase = kind === 'whole' ? -0.2 : kind === 'eighth' ? 0.2 : 0.5;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = damp(delta, reducedMotion);
    const t = clock.current;
    const floatY = playing ? Math.sin(t * (0.52 + phase) + position[0]) * 0.085 : 0;
    const turn = playing ? Math.sin(t * 0.37 + position[0]) * 0.2 : 0;
    const tilt = playing ? Math.sin(t * 0.25 + position[0]) * 0.08 : 0;
    const scale = (0.8 + progressRef.current * 0.2) * (active ? 1.14 : hovered.current ? 1.07 : 1);
    g.position.y += (position[1] + floatY - g.position.y) * k;
    g.rotation.y += (turn + (active ? 0.35 : 0) - g.rotation.y) * k;
    g.rotation.z += (tilt - g.rotation.z) * k;
    g.scale.setScalar(g.scale.x + (scale - g.scale.x) * k);
    // In on-demand mode, keep drawing until the eased values settle.
    if (!playing && Math.abs(g.scale.x - scale) > 0.001) invalidate();
  });

  const gold = <meshPhysicalMaterial color={GOLD} metalness={1} roughness={0.22} clearcoat={0.6} />;
  const deep = <meshPhysicalMaterial color={DEEP_GOLD} metalness={1} roughness={0.26} />;

  return (
    <group ref={group} position={position} scale={0.8}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = true;
          document.body.style.cursor = 'pointer';
          invalidate();
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = '';
          invalidate();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(kind);
        }}
      >
        <mesh rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]}>
          <sphereGeometry args={[0.29, 32, 20]} />
          {gold}
        </mesh>
        {kind !== 'whole' && (
          <mesh position={[0.28, 0.65, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 1.25, 16]} />
            {deep}
          </mesh>
        )}
        {kind === 'eighth' && (
          <mesh position={[0.52, 1.12, 0]} rotation={[0, 0, -0.58]}>
            <torusGeometry args={[0.32, 0.045, 10, 32, Math.PI]} />
            {deep}
          </mesh>
        )}
        {kind === 'double' && (
          <group>
            <mesh position={[0.82, 0.05, 0]} rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]}>
              <sphereGeometry args={[0.29, 32, 20]} />
              {gold}
            </mesh>
            <mesh position={[1.1, 0.68, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 1.25, 16]} />
              {deep}
            </mesh>
            <mesh position={[0.69, 1.27, 0]} rotation={[0, 0, -0.06]}>
              <boxGeometry args={[0.9, 0.1, 0.1]} />
              {deep}
            </mesh>
          </group>
        )}
        {kind === 'whole' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.016, 8, 64]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.6} />
          </mesh>
        )}
        {/* Selection halo */}
        <mesh rotation={[Math.PI / 2, 0, 0]} visible={active}>
          <torusGeometry args={[0.74, 0.014, 8, 64]} />
          <meshBasicMaterial color={BLUSH} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Scene(props: SceneProps) {
  const { playing, reducedMotion } = props;
  const clock = useRef(0);
  const parallax = useRef<THREE.Group>(null);
  const { camera, size, invalidate } = useThree();
  const finePointer = useMemo(() => window.matchMedia('(pointer: fine)').matches, []);

  // Fit about 7.8 units of width (the turned ribbon plus the notes) at the canvas's aspect ratio.
  useEffect(() => {
    const halfFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2);
    const fit = 7.8 / (2 * Math.tan(halfFov) * (size.width / size.height));
    camera.position.z = THREE.MathUtils.clamp(fit, 6.8, 11.5);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);

  // Re-draw when the selection or play state changes in on-demand mode.
  useEffect(() => invalidate(), [props.active, playing, invalidate]);

  useFrame((state, delta) => {
    if (playing) clock.current += Math.min(delta, 1 / 20);
    const g = parallax.current;
    if (!g) return;
    // Gentle tilt toward the pointer while it is over the scene (mouse and trackpad only).
    const follow = playing && finePointer;
    const tx = follow ? state.pointer.y * -0.08 : 0;
    const ty = follow ? state.pointer.x * 0.14 : 0;
    const k = damp(delta, reducedMotion);
    g.rotation.x += (tx - g.rotation.x) * k;
    g.rotation.y += (ty - g.rotation.y) * k;
  });

  useEffect(() => () => {
    document.body.style.cursor = '';
  }, []);

  const noteProps = { ...props, clock };
  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.5} color="#fff4e2" />
      <directionalLight position={[2.5, 5, 5]} intensity={2.4} color="#fff1d2" />
      {/* Blush rim from behind keeps the gold from going flat on the ivory page */}
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color={BLUSH} />
      <group ref={parallax}>
        <Ribbon {...noteProps} />
        <MusicalNote {...noteProps} kind="whole" position={[-2.35, 1.3, 0.8]} active={props.active === 'whole'} />
        <MusicalNote {...noteProps} kind="eighth" position={[0.4, -1.35, 1.2]} active={props.active === 'eighth'} />
        <MusicalNote {...noteProps} kind="double" position={[1.75, 1.1, -0.2]} active={props.active === 'double'} />
      </group>
    </>
  );
}

interface GoldenSceneProps extends SceneProps {
  /** False while the hero is scrolled out of view: the canvas then renders nothing at all. */
  visible: boolean;
  onContextLost: () => void;
}

export default function GoldenScene({ onContextLost, visible, ...props }: GoldenSceneProps) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const maxDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  return (
    <Canvas
      frameloop={!visible ? 'never' : props.playing ? 'always' : 'demand'}
      dpr={[1, maxDpr]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: 'default' }}
      camera={{ position: [0, 0, 8.7], fov: 42 }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true })}
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <Scene {...props} />
    </Canvas>
  );
}
