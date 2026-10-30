import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gateShape } from './gateShape';

/**
 * The Golden Journey: one fixed, full-window, click-through canvas behind the landing content.
 * The golden silk sits in the hero; as the visitor scrolls, three notes leave it, travel to the
 * Experience section and settle on a golden gate that forms around the centred concert card.
 *
 * The camera is orthographic with 1 world unit = 1 CSS pixel, so DOM anchors map straight into
 * the scene. Scroll only moves a progress number held in a ref; nothing here re-renders React.
 * Decorative only: no audio, no routing, no pointer targets.
 */

export interface JourneyLayout {
  /** Page coordinates (CSS px from the document's top-left) of the hero art box. */
  art: { x: number; y: number; w: number; h: number };
  /** Page coordinates and size of the centred concert card. */
  gate: { x: number; y: number; w: number; h: number };
  vw: number;
  vh: number;
  scrollY: number;
  /** Narrative progress from scroll, 0 (hero) to 1 (gate revealed). */
  progress: number;
  /** Pointer in client px, mouse/trackpad only. */
  pointer: { x: number; y: number; active: boolean };
  /** Bumps whenever art or gate geometry changes, so the gate can be rebuilt. */
  version: number;
  /** Set by the scene: request a frame in on-demand mode. */
  invalidate?: () => void;
}

type NoteKind = 'whole' | 'eighth' | 'double';

const GOLD = '#d9b77e';
const DEEP_GOLD = '#c39a5c';
const BLUSH = '#ebc4c0';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Frame-rate independent easing factor. */
const damp = (delta: number, speed: number) => 1 - Math.exp(-Math.min(delta, 1 / 30) * speed);

/** Each note's personality: where it rests in the hero (silk units), how it leaves and when it travels. */
const NOTES: Record<
  NoteKind,
  { home: [number, number]; leave: [number, number]; window: [number, number]; arc: number; bob: number; phase: number; depth: number }
> = {
  // Connection: a slow, wide arc, landing as the gate's keystone.
  whole: { home: [-2.35, 1.3], leave: [-0.35, 0.6], window: [0.45, 0.8], arc: 0.38, bob: 0.5, phase: 0, depth: 0.6 },
  // Energy: leaves first and travels fastest, with a light trail.
  eighth: { home: [0.4, -1.35], leave: [0.3, 0.9], window: [0.4, 0.66], arc: -0.14, bob: 0.95, phase: 1.7, depth: 1 },
  // Rhythm and togetherness: splits into two waves on the way and rejoins.
  double: { home: [1.75, 1.1], leave: [0.65, 0.45], window: [0.45, 0.73], arc: 0.22, bob: 0.7, phase: 3.1, depth: 0.8 },
};
const KINDS = Object.keys(NOTES) as NoteKind[];

/** Where each note settles on the gate (px, card-centre relative, y up). */
const gateSlot = (kind: NoteKind, L: JourneyLayout, size: number): [number, number] => {
  const { W, spring, ry, apex } = gateShape(L.gate, L.vw);
  if (kind === 'whole') return [0, apex + size * 0.45];
  const a = THREE.MathUtils.degToRad(50);
  const side = kind === 'eighth' ? -1 : 1;
  return [side * (W * Math.sin(a) + size * 0.2), spring + ry * Math.cos(a) + size * 0.35];
};

/** Silk scale: px per silk unit, fitted to the hero art box. */
const silkUnit = (L: JourneyLayout) => clamp(L.art.w / 7.8, 34, 80);

/** Page px → world (orthographic camera centred on the viewport). */
const toWorld = (L: JourneyLayout, x: number, y: number): [number, number] => [x - L.vw / 2, L.vh / 2 - (y - L.scrollY)];

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

interface SceneProps {
  layout: React.MutableRefObject<JourneyLayout>;
  /** Animate continuously (floating, ripples). False holds them still; scroll still drives the journey. */
  playing: boolean;
  /** Reduced motion: a still composition, notes resting in the hero and the gate already formed. */
  still: boolean;
}

const TRAIL = 30;

function Journey({ layout, playing, still }: SceneProps) {
  const { invalidate } = useThree();
  const clock = useRef(0);
  const progress = useRef(still ? 0 : layout.current.progress);
  const builtVersion = useRef(-1);

  const mats = useMemo(
    () => ({
      gold: new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.22, clearcoat: 0.6 }),
      deep: new THREE.MeshPhysicalMaterial({ color: DEEP_GOLD, metalness: 1, roughness: 0.26 }),
      beam: new THREE.MeshPhysicalMaterial({ color: DEEP_GOLD, metalness: 1, roughness: 0.26, transparent: true }),
      ring: new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.6 }),
      ripples: [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false })),
      arch: new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.2, clearcoat: 0.8, transparent: true }),
      archInner: new THREE.MeshPhysicalMaterial({ color: BLUSH, metalness: 0.4, roughness: 0.3, transparent: true }),
      silk: new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.24, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
      silkAccent: new THREE.MeshPhysicalMaterial({ color: BLUSH, metalness: 0.35, roughness: 0.32, clearcoat: 0.5 }),
      trail: new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    }),
    [],
  );

  // Shared note geometry (silk units, as in Sprint 1)
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 110; i++) {
      const t = i / 110;
      pts.push(new THREE.Vector3(-3.6 + t * 7.2, Math.sin(t * Math.PI * 3.2) * (0.37 + Math.sin(t * Math.PI) * 0.18), Math.cos(t * Math.PI * 2.2) * 0.55));
    }
    const curve = new THREE.CatmullRomCurve3(pts);

    // Eighth-note light trail: a tapered strip whose vertex alpha fades toward the tail
    const trail = new THREE.BufferGeometry();
    trail.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 2 * 3), 3));
    const colors = new Float32Array(TRAIL * 2 * 4);
    const c = new THREE.Color(GOLD);
    for (let i = 0; i < TRAIL; i++) {
      const a = Math.pow(i / (TRAIL - 1), 1.6) * 0.55;
      for (let s = 0; s < 2; s++) colors.set([c.r, c.g, c.b, a], (i * 2 + s) * 4);
    }
    trail.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    const index: number[] = [];
    for (let i = 0; i < TRAIL - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    trail.setIndex(index);

    return {
      head: new THREE.SphereGeometry(0.29, 32, 20),
      stem: new THREE.CylinderGeometry(0.045, 0.045, 1.25, 16),
      flag: new THREE.TorusGeometry(0.32, 0.045, 10, 32, Math.PI),
      beam: new THREE.BoxGeometry(0.9, 0.1, 0.1),
      wholeRing: new THREE.TorusGeometry(0.5, 0.016, 8, 64),
      ripple: new THREE.TorusGeometry(0.5, 0.012, 6, 64),
      finial: new THREE.SphereGeometry(1, 20, 14),
      silk: new THREE.TubeGeometry(curve, 260, 0.095, 16, false),
      silkAccent: new THREE.TubeGeometry(curve, 200, 0.026, 8, false),
      trail,
    };
  }, []);
  const trailHistory = useRef<Array<[number, number]>>([]);

  // Refs to everything the frame loop moves
  const silkGroup = useRef<THREE.Group>(null);
  const notes = useRef<Record<NoteKind, THREE.Group | null>>({ whole: null, eighth: null, double: null });
  const beamHalves = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const gateGroup = useRef<THREE.Group>(null);
  const archMeshes = useRef<THREE.Mesh[]>([]);
  const finials = useRef<(THREE.Mesh | null)[]>([]);
  const offsets = useRef<Record<NoteKind, THREE.Vector2>>({ whole: new THREE.Vector2(), eighth: new THREE.Vector2(), double: new THREE.Vector2() });

  useEffect(
    () => () => {
      const { ripples: rippleMats, ...rest } = mats;
      [...Object.values(rest), ...rippleMats].forEach((m) => m.dispose());
      Object.values(geo).forEach((g) => g.dispose());
      archMeshes.current.forEach((m) => m.geometry.dispose());
    },
    [mats, geo],
  );

  // Let the DOM side request frames (scroll while paused, resize, reduced motion)
  useEffect(() => {
    const L = layout.current;
    L.invalidate = invalidate;
    invalidate();
    return () => {
      L.invalidate = undefined;
    };
  }, [layout, invalidate]);
  useEffect(() => invalidate(), [playing, still, invalidate]);

  /** Rebuild the gate when the card size or viewport changes: two half-arches per line, so it rises from both columns. */
  const rebuildGate = (L: JourneyLayout) => {
    const g = gateGroup.current;
    if (!g) return;
    archMeshes.current.forEach((m) => {
      m.geometry.dispose();
      g.remove(m);
    });
    archMeshes.current = [];
    const { W, spring, ry, base } = gateShape(L.gate, L.vw);
    const lines = [
      { inset: 0, radius: 2.4, mat: mats.arch },
      { inset: 11, radius: 1, mat: mats.archInner },
    ];
    for (const line of lines) {
      for (const side of [-1, 1]) {
        const w = W - line.inset;
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(side * w, mix(base + line.inset, spring, i / 16), 0));
        for (let i = 1; i <= 40; i++) {
          const a = (i / 40) * (Math.PI / 2);
          pts.push(new THREE.Vector3(side * w * Math.cos(a), spring + (ry - line.inset) * Math.sin(a), 0));
        }
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 140, line.radius, 8, false), line.mat);
        g.add(mesh);
        archMeshes.current.push(mesh);
      }
    }
    finials.current.forEach((f, i) => {
      if (!f) return;
      f.position.set((i === 0 ? -1 : 1) * W, base, 0);
      f.scale.setScalar(4.5);
    });
  };

  useFrame((_, delta) => {
    const L = layout.current;
    if (L.vw === 0) return;
    if (builtVersion.current !== L.version) {
      rebuildGate(L);
      builtVersion.current = L.version;
    }
    if (playing) clock.current += Math.min(delta, 1 / 20);
    const t = clock.current;

    // Narrative progress, eased so wheel steps glide; anchors stay pinned to the page exactly.
    const target = still ? 0 : L.progress;
    progress.current += (target - progress.current) * (still ? 1 : damp(delta, 7));
    if (Math.abs(target - progress.current) < 1e-4) progress.current = target;
    const P = progress.current;
    let settling = P !== target;

    // Golden silk, anchored to the hero art box
    const u = silkUnit(L);
    const [ax, ay] = toWorld(L, L.art.x + L.art.w / 2, L.art.y + L.art.h / 2);
    const s = silkGroup.current;
    if (s) {
      s.position.set(ax, ay + Math.sin(t * 0.34) * 4, 0);
      s.scale.setScalar(u);
      s.rotation.y = Math.sin(t * 0.19) * 0.13 + P * 0.25;
    }

    // Pointer: client px → world
    const pw = L.pointer.active && playing ? toWorld(L, L.pointer.x, L.pointer.y + L.scrollY) : null;

    // Gate, anchored to the centred concert card; it rises from both columns and meets at the apex
    const [gx, gy] = toWorld(L, L.gate.x + L.gate.w / 2, L.gate.y + L.gate.h / 2);
    const form = still ? 1 : smooth(0.68, 0.95, P);
    if (gateGroup.current) {
      gateGroup.current.position.set(gx, gy, -40);
      archMeshes.current.forEach((m) => {
        const geom = m.geometry as THREE.TubeGeometry;
        const count = geom.index ? geom.index.count : 0;
        geom.setDrawRange(0, Math.floor((count * form) / 6) * 6);
      });
      mats.arch.opacity = smooth(0, 0.25, form);
      mats.archInner.opacity = smooth(0.35, 1, form) * 0.75;
      finials.current.forEach((f) => f && (f.visible = form > 0.02));
    }

    const gateNote = gateShape(L.gate, L.vw).noteSize;
    for (const kind of KINDS) {
      const g = notes.current[kind];
      if (!g) continue;
      const n = NOTES[kind];
      const homeX = L.art.x + L.art.w / 2 + n.home[0] * u;
      const homeY = L.art.y + L.art.h / 2 - n.home[1] * u;
      const lift = smooth(0.2, 0.45, P);
      const sep = lift * u * 0.9;
      const ax0 = homeX + n.leave[0] * sep;
      // Once lifted off the silk, a note stays within the window instead of scrolling away with the hero.
      const top = L.scrollY + 110 + n.depth * 40;
      const ay0 = mix(homeY, Math.max(homeY, top), lift) + n.leave[1] * sep;

      const tt = easeInOutCubic(clamp((P - n.window[0]) / (n.window[1] - n.window[0])));
      const size = mix(u * 0.8, gateNote, tt);
      const [sx, sy] = gateSlot(kind, L, size);
      // Gather: circle the gate before settling
      const orbitR = 70 * (1 - smooth(0.7, 0.95, P));
      const ang = P * 6 + n.phase;
      const bx = L.gate.x + L.gate.w / 2 + sx + Math.cos(ang) * orbitR;
      const by = L.gate.y + L.gate.h / 2 - sy + Math.sin(ang) * orbitR;

      // Quadratic arc from the hero to the gate
      const dx = bx - ax0;
      const dy = by - ay0;
      const cx = (ax0 + bx) / 2 - dy * n.arc;
      const cy = (ay0 + by) / 2 + dx * n.arc;
      const pageX = (1 - tt) * (1 - tt) * ax0 + 2 * (1 - tt) * tt * cx + tt * tt * bx;
      const pageY = (1 - tt) * (1 - tt) * ay0 + 2 * (1 - tt) * tt * cy + tt * tt * by;
      let [wx, wy] = toWorld(L, pageX, pageY);

      // Life: floating, a gentle lean toward the pointer, and a nudge away from it up close
      const bob = Math.sin(t * n.bob + n.phase) * 6;
      const off = offsets.current[kind];
      let tx = 0;
      let ty = 0;
      if (pw) {
        tx = (pw[0] / L.vw) * 18 * n.depth;
        ty = (pw[1] / L.vh) * 12 * n.depth;
        const ddx = wx - pw[0];
        const ddy = wy - pw[1];
        const d = Math.hypot(ddx, ddy);
        if (d < 150 && d > 0.01) {
          const push = Math.pow(1 - d / 150, 2) * 18;
          tx += (ddx / d) * push;
          ty += (ddy / d) * push;
        }
      }
      // Paused: hold the current lean rather than drifting back
      if (playing) {
        const k = damp(delta, 5);
        off.x += (tx - off.x) * k;
        off.y += (ty - off.y) * k;
      }
      wx += off.x;
      wy += off.y + bob;

      g.position.set(wx, wy, 20 * n.depth);
      g.scale.setScalar(size);
      g.rotation.y = Math.sin(t * 0.37 + n.phase) * 0.22 + Math.sin(tt * Math.PI) * 0.6;
      g.rotation.z = Math.sin(t * 0.25 + n.phase) * 0.08;

      if (kind === 'whole') {
        // Soft expanding ripples
        ripples.current.forEach((r, i) => {
          if (!r) return;
          const ph = still ? 0.35 : (t * 0.28 + i / 3) % 1;
          r.scale.setScalar(1 + ph * 2.2);
          (r.material as THREE.MeshBasicMaterial).opacity = still ? (i === 0 ? 0.25 : 0) : 0.32 * (1 - ph) * smooth(0, 0.15, ph);
        });
      } else if (kind === 'double') {
        // Part into two wave paths mid-flight, then rejoin
        const split = still ? 0 : Math.sin(Math.PI * tt);
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;
        const amp = (split * 46 + Math.sin(tt * Math.PI * 4) * 14 * split) / size;
        const [l, r] = beamHalves.current;
        // page y points down, world y up
        l?.position.set(px * amp, -py * amp, 0);
        r?.position.set(-px * amp, py * amp, 0);
        mats.beam.opacity = 1 - smooth(0.05, 0.35, split);
      } else {
        // Trail kept in page space, so it shows travel through the page, not the page scrolling
        const h = trailHistory.current;
        const head: [number, number] = [pageX + off.x, pageY - off.y - bob];
        const prev = h[h.length - 1];
        h.push(head);
        // Once the note stops, let the tail catch up quickly instead of one point per frame
        if (prev && Math.hypot(prev[0] - head[0], prev[1] - head[1]) < 0.5) h.splice(0, Math.min(3, h.length - 1));
        while (h.length > TRAIL) h.shift();
        const pos = geo.trail.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < TRAIL; i++) {
          const j = Math.max(0, h.length - TRAIL + i);
          const [hx, hy] = h[j];
          const [nx, ny] = h[Math.min(h.length - 1, j + 1)];
          const [qx, qy] = toWorld(L, hx, hy);
          const [rx, ry] = toWorld(L, nx, ny);
          let ex = rx - qx;
          let ey = ry - qy;
          const el = Math.hypot(ex, ey) || 1;
          ex /= el;
          ey /= el;
          const half = (i / (TRAIL - 1)) * size * 0.09;
          pos.setXYZ(i * 2, qx - ey * half, qy + ex * half, 0);
          pos.setXYZ(i * 2 + 1, qx + ey * half, qy - ex * half, 0);
        }
        pos.needsUpdate = true;
        const first = h[0];
        const last = h[h.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 0.5) settling = true;
      }
    }

    if (!playing && settling) invalidate();
  });

  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.5} color="#fff4e2" />
      <directionalLight position={[2.5, 5, 5]} intensity={2.4} color="#fff1d2" />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color={BLUSH} />

      {/* Golden silk */}
      <group ref={silkGroup}>
        <group rotation={[0.16, -0.13, -0.12]}>
          <mesh geometry={geo.silk} material={mats.silk} />
          <mesh geometry={geo.silkAccent} material={mats.silkAccent} position={[0, -0.13, -0.14]} />
        </group>
      </group>

      {/* Golden gate (arch lines are added in rebuildGate) */}
      <group ref={gateGroup}>
        {[0, 1].map((i) => (
          <mesh
            key={i}
            ref={(m) => {
              finials.current[i] = m;
            }}
            geometry={geo.finial}
            material={mats.gold}
            visible={false}
          />
        ))}
      </group>

      {/* Eighth-note trail */}
      <mesh geometry={geo.trail} material={mats.trail} frustumCulled={false} />

      {/* Whole note: connection */}
      <group
        ref={(g) => {
          notes.current.whole = g;
        }}
      >
        <mesh geometry={geo.head} material={mats.gold} rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]} />
        <mesh geometry={geo.wholeRing} material={mats.ring} rotation={[Math.PI / 2, 0, 0]} />
        {mats.ripples.map((m, i) => (
          <mesh
            key={i}
            ref={(r) => {
              ripples.current[i] = r;
            }}
            geometry={geo.ripple}
            material={m}
          />
        ))}
      </group>

      {/* Eighth note: energy */}
      <group
        ref={(g) => {
          notes.current.eighth = g;
        }}
      >
        <mesh geometry={geo.head} material={mats.gold} rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]} />
        <mesh geometry={geo.stem} material={mats.deep} position={[0.28, 0.65, 0]} />
        <mesh geometry={geo.flag} material={mats.deep} position={[0.52, 1.12, 0]} rotation={[0, 0, -0.58]} />
      </group>

      {/* Beamed notes: rhythm and togetherness, in two halves that can part and rejoin */}
      <group
        ref={(g) => {
          notes.current.double = g;
        }}
      >
        <group position={[-0.55, -0.6, 0]}>
          <group
            ref={(g) => {
              beamHalves.current[0] = g;
            }}
          >
            <mesh geometry={geo.head} material={mats.gold} rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]} />
            <mesh geometry={geo.stem} material={mats.deep} position={[0.28, 0.65, 0]} />
          </group>
          <group
            ref={(g) => {
              beamHalves.current[1] = g;
            }}
          >
            <mesh geometry={geo.head} material={mats.gold} position={[0.82, 0.05, 0]} rotation={[0, 0, -0.3]} scale={[1.18, 0.86, 0.86]} />
            <mesh geometry={geo.stem} material={mats.deep} position={[1.1, 0.68, 0]} />
          </group>
          <mesh geometry={geo.beam} material={mats.beam} position={[0.69, 1.27, 0]} rotation={[0, 0, -0.06]} />
        </group>
      </group>
    </>
  );
}

interface GoldenSceneProps extends SceneProps {
  /** False while the journey is out of view: the canvas renders nothing at all. */
  visible: boolean;
  onContextLost: () => void;
}

export default function GoldenScene({ onContextLost, visible, ...props }: GoldenSceneProps) {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  return (
    <Canvas
      orthographic
      frameloop={!visible ? 'never' : props.playing ? 'always' : 'demand'}
      dpr={[1, maxDpr]}
      gl={{ antialias: !coarse, alpha: true, powerPreference: 'default' }}
      camera={{ position: [0, 0, 600], zoom: 1, near: 1, far: 2000 }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onContextLost, { once: true })}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Journey {...props} />
    </Canvas>
  );
}
