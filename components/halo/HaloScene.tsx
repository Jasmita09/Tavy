import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { HaloPreset } from './haloPresets';

/**
 * The Halo concept model: an open cuff with a glowing light window, built from code (no model file to
 * download). It renders on demand only, so an idle viewer costs no GPU time.
 */

/** Imperative view commands, used by the HTML buttons and keyboard shortcuts. */
export interface HaloViewApi {
  rotateBy(yaw: number, pitch: number): void;
  zoomBy(step: number): void;
  reset(): void;
}

export const ZOOM = { min: 3.6, max: 6.8, initial: 5.2 };
const INITIAL_VIEW = { yaw: -0.55, pitch: 0.38 };
const PITCH_LIMIT = 0.75;

// Proportions are illustrative only; the model is a concept, not a product drawing.
const INNER = 1;
const OUTER = 1.12;
const HEIGHT = 0.5;
const GAP = 0.32; // half-angle of the opening at the back, in radians

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** A rounded-rectangle cross-section in (radius, height), starting mid outer face so the seam is on a flat. */
function profile(inner: number, outer: number, height: number, r: number, segments = 6): THREE.Vector2[] {
  const corners: [number, number, number][] = [
    [outer - r, height / 2 - r, 0],
    [inner + r, height / 2 - r, Math.PI / 2],
    [inner + r, -height / 2 + r, Math.PI],
    [outer - r, -height / 2 + r, (3 * Math.PI) / 2],
  ];
  const points = [new THREE.Vector2(outer, 0)];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * (Math.PI / 2);
      points.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
  }
  points.push(new THREE.Vector2(outer, 0));
  return points;
}

/** The cuff: a lathed band that thickens smoothly toward the front, where the light window sits. */
function buildCuff() {
  const points = profile(INNER, OUTER, HEIGHT, 0.05);
  const band = new THREE.LatheGeometry(points, 180, Math.PI + GAP, Math.PI * 2 - GAP * 2);
  const pos = band.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const radius = Math.hypot(v.x, v.z);
    const angle = Math.atan2(v.x, v.z); // 0 at the front
    const bulge = Math.exp(-((angle / 0.6) ** 2));
    const outerness = (radius - INNER) / (OUTER - INNER);
    const scale = (radius + 0.1 * bulge * outerness) / radius;
    pos.setXYZ(i, v.x * scale, v.y * (1 + 0.22 * bulge), v.z * scale);
  }
  band.computeVertexNormals();

  // Close the two ends of the open cuff with the cross-section shape.
  const shape = new THREE.Shape(points);
  const caps = [Math.PI + GAP, Math.PI * 3 - GAP].map((phi) => {
    const cap = new THREE.ShapeGeometry(shape, 6);
    cap.rotateY(phi - Math.PI / 2);
    return cap;
  });
  return { band, caps };
}

function drawGlow(canvas: HTMLCanvasElement, from: THREE.Color, to: THREE.Color) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, `#${from.getHexString()}`);
  gradient.addColorStop(1, `#${to.getHexString()}`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function shadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** Procedural studio reflections, so the satin metal reads as metal without downloading an HDR. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

interface SceneProps {
  preset: HaloPreset;
  reducedMotion: boolean;
  apiRef: React.MutableRefObject<HaloViewApi | null>;
  onZoomLimits: (atMin: boolean, atMax: boolean) => void;
}

function HaloModel({ preset, reducedMotion, apiRef, onZoomLimits }: SceneProps) {
  const { gl, camera, invalidate } = useThree();
  const group = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const rimLight = useRef<THREE.DirectionalLight>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  const initialPreset = useRef(preset).current;

  // Current and target view; pointer input only moves the targets, and the frame loop eases toward them.
  const view = useRef({
    yaw: INITIAL_VIEW.yaw, pitch: INITIAL_VIEW.pitch, dist: ZOOM.initial, px: 0, py: 0,
    tYaw: INITIAL_VIEW.yaw, tPitch: INITIAL_VIEW.pitch, tDist: ZOOM.initial, tpx: 0, tpy: 0,
  });

  const { band, caps } = useMemo(buildCuff, []);
  const windowGeometry = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.15, 0.34, 8, 32);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 1, 0.35);
    return g;
  }, []);
  const bezelGeometry = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.168, 0.36, 8, 32);
    g.rotateZ(Math.PI / 2);
    g.scale(1, 1, 0.3);
    return g;
  }, []);
  const shadow = useMemo(shadowTexture, []);

  const glow = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { canvas, texture, from: new THREE.Color(preset.glow[0]), to: new THREE.Color(preset.glow[1]) };
    // Created once; preset changes are eased in by the frame loop.
  }, []);

  const targets = useMemo(
    () => ({
      key: new THREE.Color(preset.key),
      rim: new THREE.Color(preset.rim),
      from: new THREE.Color(preset.glow[0]),
      to: new THREE.Color(preset.glow[1]),
    }),
    [preset],
  );

  useEffect(() => {
    drawGlow(glow.canvas, glow.from, glow.to);
    glow.texture.needsUpdate = true;
  }, [glow]);

  useEffect(() => invalidate(), [preset, reducedMotion, invalidate]);

  // Free GPU memory for everything created here when the viewer unmounts.
  useEffect(
    () => () => {
      [band, ...caps, windowGeometry, bezelGeometry].forEach((g) => g.dispose());
      shadow.dispose();
      glow.texture.dispose();
    },
    [band, caps, windowGeometry, bezelGeometry, shadow, glow],
  );

  // Pointer input: drag to rotate, pinch or Ctrl/⌘+wheel (trackpad pinch) to zoom, hover parallax on desktop.
  useEffect(() => {
    const el = gl.domElement;
    const v = view.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; zoom: number } | null = null;
    let limits = '';
    const hoverParallax = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion;

    const reportZoom = () => {
      const next = `${v.tDist <= ZOOM.min + 0.01}|${v.tDist >= ZOOM.max - 0.01}`;
      if (next === limits) return;
      limits = next;
      onZoomLimits(v.tDist <= ZOOM.min + 0.01, v.tDist >= ZOOM.max - 0.01);
    };
    const setZoom = (dist: number) => {
      v.tDist = clamp(dist, ZOOM.min, ZOOM.max);
      reportZoom();
    };
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) pinch = { distance: spread(), zoom: v.tDist };
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) {
        if (hoverParallax && e.pointerType === 'mouse') {
          const rect = el.getBoundingClientRect();
          v.tpx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          v.tpy = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
          invalidate();
        }
        return;
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        v.tYaw += (e.clientX - prev.x) * 0.0085;
        v.tPitch = clamp(v.tPitch + (e.clientY - prev.y) * 0.006, -PITCH_LIMIT, PITCH_LIMIT);
      } else if (pointers.size === 2 && pinch) {
        setZoom((pinch.zoom * pinch.distance) / Math.max(1, spread()));
      }
      invalidate();
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) el.style.cursor = 'grab';
    };
    const onLeave = () => {
      v.tpx = 0;
      v.tpy = 0;
      invalidate();
    };
    const onWheel = (e: WheelEvent) => {
      // A plain wheel keeps scrolling the page; only pinch-style (Ctrl/⌘) wheels zoom the model.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(v.tDist * (1 + clamp(e.deltaY, -50, 50) * 0.004));
      invalidate();
    };

    el.style.touchAction = 'pan-y'; // vertical swipes still scroll the page on phones
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('wheel', onWheel, { passive: false });

    apiRef.current = {
      rotateBy(yaw, pitch) {
        v.tYaw += yaw;
        v.tPitch = clamp(v.tPitch + pitch, -PITCH_LIMIT, PITCH_LIMIT);
        invalidate();
      },
      zoomBy(step) {
        setZoom(v.tDist - step);
        invalidate();
      },
      reset() {
        // Unwind full turns first, so Reset never spins the model round several times.
        const turns = Math.round((v.yaw - INITIAL_VIEW.yaw) / (Math.PI * 2));
        v.yaw -= turns * Math.PI * 2;
        v.tYaw = INITIAL_VIEW.yaw;
        v.tPitch = INITIAL_VIEW.pitch;
        setZoom(ZOOM.initial);
        invalidate();
      },
    };

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('wheel', onWheel);
      apiRef.current = null;
    };
  }, [gl, invalidate, apiRef, onZoomLimits, reducedMotion]);

  useFrame((state, delta) => {
    const v = view.current;
    // Damped easing; Reduce Motion jumps straight to the target. Delta is capped because on-demand
    // rendering can report a long gap after the viewer has been idle.
    const k = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 1 / 30) * 7);
    const settling =
      Math.abs(v.tYaw - v.yaw) + Math.abs(v.tPitch - v.pitch) + Math.abs(v.tDist - v.dist) + Math.abs(v.tpx - v.px) + Math.abs(v.tpy - v.py) > 1e-4;
    // Ease while far away, then land exactly on the target so the view comes to a clean rest.
    const step = settling ? k : 1;
    v.yaw += (v.tYaw - v.yaw) * step;
    v.pitch += (v.tPitch - v.pitch) * step;
    v.dist += (v.tDist - v.dist) * step;
    v.px += (v.tpx - v.px) * step;
    v.py += (v.tpy - v.py) * step;
    group.current?.rotation.set(v.pitch, v.yaw, 0);
    camera.position.set(v.px * 0.3, 0.12 + v.py * 0.18, v.dist);
    camera.lookAt(0, 0, 0);

    // Preset colours ease the same way and also land exactly, so every light settles together.
    // Returns whether the colour changed this frame.
    const ease = (color: THREE.Color | undefined, target: THREE.Color) => {
      if (!color || color.equals(target)) return false;
      const gap = Math.abs(color.r - target.r) + Math.abs(color.g - target.g) + Math.abs(color.b - target.b);
      if (gap < 0.004) color.copy(target);
      else color.lerp(target, k);
      return true;
    };
    const lightsChanged = [
      ease(keyLight.current?.color, targets.key),
      ease(rimLight.current?.color, targets.rim),
    ].includes(true);
    const glowChanged = [ease(glow.from, targets.from), ease(glow.to, targets.to)].includes(true);
    if (glowChanged) {
      // The light window's small gradient canvas is redrawn only while it changes.
      drawGlow(glow.canvas, glow.from, glow.to);
      glow.texture.needsUpdate = true;
    }
    glowLight.current?.color.copy(glow.to).lerp(glow.from, 0.5);
    const colorsMoving = lightsChanged || glowChanged;

    if (settling || colorsMoving) state.invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.25} color="#1e2550" />
      {/* Initial colours only; later preset changes are eased in by the frame loop */}
      <directionalLight ref={keyLight} position={[3, 4, 5]} intensity={2.2} color={initialPreset.key} />
      <directionalLight ref={rimLight} position={[-3.5, 2, -4]} intensity={3.2} color={initialPreset.rim} />
      <directionalLight position={[3, -1, -3]} intensity={1.2} color="#9fb4ff" />

      <group ref={group}>
        {/* Slightly oval, like a wrist */}
        <group scale={[1, 1, 0.82]}>
          <mesh geometry={band}>
            <meshPhysicalMaterial color="#cfc9c1" metalness={1} roughness={0.34} clearcoat={0.35} clearcoatRoughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          {caps.map((cap, i) => (
            <mesh key={i} geometry={cap}>
              <meshPhysicalMaterial color="#cfc9c1" metalness={1} roughness={0.34} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {/* Light window and its darker bezel on the front of the cuff */}
          <mesh geometry={bezelGeometry} position={[0, 0, 1.17]}>
            <meshPhysicalMaterial color="#8a8790" metalness={1} roughness={0.5} />
          </mesh>
          <mesh geometry={windowGeometry} position={[0, 0, 1.19]}>
            {/* Not tone-mapped, so the gradient shows its true colours instead of blowing out to white */}
            <meshPhysicalMaterial
              color="#141414"
              emissive="#ffffff"
              emissiveMap={glow.texture}
              emissiveIntensity={0.95}
              roughness={0.25}
              clearcoat={1}
              toneMapped={false}
            />
          </mesh>
          <pointLight ref={glowLight} position={[0, 0, 1.6]} intensity={1.6} distance={3} decay={2} />
        </group>
      </group>

      {/* Soft contact shadow; a texture, not a shadow map, so it costs nothing per frame */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 2.8]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

interface HaloSceneProps extends SceneProps {
  /** The GPU context was lost (e.g. mobile memory pressure): show the still image instead. */
  onContextLost: () => void;
}

export default function HaloScene({ onContextLost, ...props }: HaloSceneProps) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  // Adaptive quality: phones get a lower pixel ratio cap and no MSAA.
  const maxDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, maxDpr]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 32, position: [0, 0.12, ZOOM.initial], near: 0.1, far: 40 }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true })}
      aria-hidden="true"
    >
      <StudioEnvironment />
      <HaloModel {...props} />
    </Canvas>
  );
}
