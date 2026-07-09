/**
 * SignatureScene.ts — "Bazodiac Signatur" als eigenständige, container-gebundene
 * three.js-Szene. Port von prototypes/signature/main.js aus
 * DYAI2025/bazodiac-signature-prototypes; die GLSL-Shader und die gesamte
 * Szenen-Mathematik sind unverändert übernommen (kein visuelles Risiko).
 *
 * Komposition (DNA der drei Einzel-Prototypen):
 *   1. Cymatischer Punkt-Kern — 5-Element-Stehwellen, GPU-Vertex-Shader
 *   2. WuXing-Pentagon + Zyklus-Bögen — Shēng/Kè mit wandernden Pulsen
 *   3. Boden-Echo-Ringgitter — subtil welligende Scheibe
 * Plus Match-Mode (Partner-Signatur + computeOverlay → Kohärenz-Bögen).
 *
 * Bewusste Abweichungen vom Prototyp:
 * - Kein DOM-Lookup, kein HUD, keine Buttons — React besitzt alle Controls
 *   und ruft die öffentliche API (applySignature/setCosmic/…).
 * - Kein fetch: Signaturen kommen fertig berechnet herein (Anti-Fabrication —
 *   der stille Fallback auf ein Beispielprofil existiert hier nicht).
 * - Größe folgt dem Container (ResizeObserver), nicht dem window.
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ELEMENT_META,
  ELEMENT_ORDER,
  THEME,
  computeOverlay,
  type SignatureEdge,
  type SignatureElement,
  type SignatureOverlay,
  type WuXingSignature,
} from "./signatureData";
import { configureRenderer, makeGlowSprite, makeStarfield } from "./gfx";

const TILT = (20 * Math.PI) / 180; // Pentagon-Wellenachsen um +20° aus der XZ-Ebene gekippt
const NODE_RADIUS = 7.5;
const SHELL_RADIUS = 5;
const POINT_COUNT = 36000;
const ARC_SEGMENTS = 40;

const ELEMENT_AXES = ELEMENT_ORDER.map((_, i) => {
  const a = (i * 72 * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(a) * Math.cos(TILT),
    Math.sin(TILT),
    Math.sin(a) * Math.cos(TILT),
  ).normalize();
});
const ELEMENT_COLORS = ELEMENT_ORDER.map((id) => new THREE.Color(ELEMENT_META[id].color));

// ─── Shader (byte-identisch zum Prototyp) ────────────────────────────────────
const VERT = /* glsl */ `
    uniform float uPhase;
    uniform float uTime;
    uniform float uHarmony;
    uniform float uStrength[5];
    uniform float uDelta[5];
    uniform vec3 uAxes[5];
    uniform vec3 uColors[5];
    uniform vec3 uTint;
    uniform float uPointSize;
    attribute float aSeed;
    varying vec3 vColor;
    varying float vAlpha;
    const float PI = 3.14159265359;
    void main() {
        vec3 n = normalize(position);
        float disp = 0.0;
        float wSum = 0.0;
        vec3 col = vec3(0.0);
        // low harmony → per-element phases drift apart; high harmony → one coherent field
        float drift = (1.0 - uHarmony) * 1.6;
        for (int e = 0; e < 5; e++) {
            float d = dot(n, uAxes[e]);
            float freq = 3.0 + 2.0 * float(e);                      // f_e = 3 + 2·index
            float phase = uPhase + drift * float(e) * (0.9 + 0.25 * sin(uTime * 0.13 + float(e) * 1.7));
            float wave = sin(d * freq * PI + phase);                // standing wave along element axis
            // delta = West/Bazi friction → high-frequency jitter riding on that wave
            float jitter = uDelta[e] * sin(d * freq * 6.5 * PI + uTime * 4.3 + aSeed * 6.2831) * 0.35;
            float contrib = uStrength[e] * (wave + jitter);
            float w = abs(contrib);
            disp += contrib;
            wSum += w;
            col += uColors[e] * (w + 0.015);
        }
        disp *= 0.8;
        col /= max(wSum + 0.075, 0.001);
        float glow = clamp(abs(disp) * 1.0, 0.0, 1.0);
        // gold/silver tint where displacement peaks
        vColor = mix(col, uTint, smoothstep(0.4, 1.0, glow)) * (0.68 + glow * 1.05);
        vAlpha = 0.5 + glow * 0.5;
        vec4 mvPosition = modelViewMatrix * vec4(position + n * disp, 1.0);
        gl_PointSize = uPointSize * (160.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;
const FRAG = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        float a = smoothstep(0.5, 0.06, d);
        gl_FragColor = vec4(vColor, a * vAlpha);
    }
`;

interface ShellUniforms {
  uPhase: { value: number };
  uTime: { value: number };
  uHarmony: { value: number };
  uStrength: { value: number[] };
  uDelta: { value: number[] };
  uAxes: { value: THREE.Vector3[] };
  uColors: { value: THREE.Color[] };
  uTint: { value: THREE.Color };
  uPointSize: { value: number };
}

interface Shell {
  points: THREE.Points;
  uniforms: ShellUniforms;
  material: THREE.ShaderMaterial;
}

interface PentagonNode {
  el: SignatureElement;
  pos: THREE.Vector3;
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  halo: THREE.Sprite;
  phase: number;
}

interface Pentagon {
  group: THREE.Group;
  nodes: PentagonNode[];
}

interface ArcRecord {
  line: THREE.Line;
  curve: THREE.QuadraticBezierCurve3;
  type?: SignatureEdge["type"];
  edge?: SignatureEdge;
  pulses: { sprite: THREE.Sprite; t: number }[];
}

function makeShellGeometry(): THREE.BufferGeometry {
  const positions = new Float32Array(POINT_COUNT * 3);
  const seeds = new Float32Array(POINT_COUNT);
  for (let i = 0; i < POINT_COUNT; i++) {
    // Fibonacci-Sphäre + radiale Dicke
    const phi = Math.acos(-1 + (2 * i) / POINT_COUNT);
    const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi;
    const r = SHELL_RADIUS + (Math.random() - 0.5) * 0.35;
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    positions[i * 3 + 2] = Math.cos(phi) * r;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geo;
}

function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const rawMat = (o as THREE.Mesh).material;
    const mats = Array.isArray(rawMat) ? rawMat : rawMat ? [rawMat] : [];
    mats.forEach((m) => {
      const mapped = m as THREE.Material & { map?: THREE.Texture };
      if (mapped.map) mapped.map.dispose();
      m.dispose();
    });
  });
}

export class SignatureScene {
  private container: HTMLElement;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver;
  private rafId: number | null = null;
  private autoRotateResumeTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  private coreLight: THREE.PointLight;
  private groundGrid: THREE.PolarGridHelper;
  private myShell: Shell;

  private signature: WuXingSignature | null = null;
  private myPentagon: Pentagon | null = null;
  private myArcs: ArcRecord[] = [];

  private cosmicCurrent = 0.5;
  private timelapse = 1; // 1×..12× Wellenphasen-Evolution
  private wavePhase = 0;

  // Match-Mode
  private partnerSignature: WuXingSignature | null = null;
  private partnerShell: Shell | null = null;
  private partnerPentagon: Pentagon | null = null;
  private overlay: SignatureOverlay | null = null;
  private overlayGroup: THREE.Group | null = null;
  private overlayArcs: ArcRecord[] = [];
  private onOverlay: ((overlay: SignatureOverlay | null) => void) | null = null;

  private readonly tmpVecA = new THREE.Vector3();
  private readonly tmpVecC = new THREE.Vector3();

  /** Wirft, wenn WebGL nicht verfügbar ist — der Aufrufer zeigt dann den ehrlichen Fallback. */
  constructor(container: HTMLElement, options?: { onOverlay?: (overlay: SignatureOverlay | null) => void }) {
    this.container = container;
    this.onOverlay = options?.onOverlay ?? null;

    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.011);

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 17);

    this.renderer = configureRenderer(new THREE.WebGLRenderer({ antialias: true }));
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 50;
    // Auto-Rotation pausieren, solange der Nutzer interagiert; nach Idle fortsetzen
    this.controls.addEventListener("start", () => {
      this.controls.autoRotate = false;
      if (this.autoRotateResumeTimer) clearTimeout(this.autoRotateResumeTimer);
    });
    this.controls.addEventListener("end", () => {
      if (this.autoRotateResumeTimer) clearTimeout(this.autoRotateResumeTimer);
      this.autoRotateResumeTimer = setTimeout(() => { this.controls.autoRotate = true; }, 8000);
    });

    this.scene.add(makeStarfield(1600, 90));
    this.scene.add(new THREE.AmbientLight(0x404060, 1.4));
    this.coreLight = new THREE.PointLight(0xd4af37, 70, 40);
    this.scene.add(this.coreLight);

    this.myShell = this.makeCymaticShell(false);
    this.scene.add(this.myShell.points);

    this.groundGrid = new THREE.PolarGridHelper(14, 10, 6, 64, THEME.gold, THEME.obsidian);
    this.groundGrid.position.y = -4;
    const gridMat = this.groundGrid.material as THREE.Material & { opacity: number };
    gridMat.transparent = true;
    gridMat.opacity = 0.08;
    gridMat.depthWrite = false;
    this.scene.add(this.groundGrid);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  // ─── Öffentliche API ──────────────────────────────────────────────────────

  applySignature(sig: WuXingSignature): void {
    if (this.disposed) return;
    this.signature = sig;
    this.applyUniforms(sig, this.myShell.uniforms);
    if (!this.myPentagon) {
      this.myPentagon = this.buildPentagon(sig.elements, false);
      this.myArcs = this.buildCycleArcs(sig, this.myPentagon.nodes, this.myPentagon.group);
    } else {
      this.applyPentagon(sig, this.myPentagon, false);
      this.applyArcs(sig, this.myArcs, this.myPentagon.nodes);
    }
    this.refreshOverlay();
  }

  /** 0..1 — treibt Animationstempo, Bodenwellen und Kernlicht. */
  setCosmic(v: number): void {
    this.cosmicCurrent = Math.min(1, Math.max(0, v));
  }

  /** 1..12 — Zeitraffer-Multiplikator der Wellenphase. */
  setTimelapse(mult: number): void {
    this.timelapse = Math.min(12, Math.max(1, mult));
  }

  enableMatch(partnerSig: WuXingSignature): void {
    if (this.disposed) return;
    this.disableMatch();
    this.partnerSignature = partnerSig;

    // gegenläufig rotierende Partner-Schale, Silber-Blau-Palette, 180° gedreht
    this.partnerShell = this.makeCymaticShell(true);
    this.partnerShell.points.rotation.y = Math.PI;
    this.applyUniforms(partnerSig, this.partnerShell.uniforms);
    this.scene.add(this.partnerShell.points);

    // Partner-Pentagon nach unten gespiegelt (y = -strength × 3)
    this.partnerPentagon = this.buildPentagon(partnerSig.elements, true);
    this.applyPentagon(partnerSig, this.partnerPentagon, true);

    // Overlay-Verbindungsbögen (einer pro Element)
    this.overlayGroup = new THREE.Group();
    this.overlayArcs = ELEMENT_ORDER.map(() => {
      const rec = this.makeArc(THEME.harmony, 0.4);
      this.overlayGroup!.add(rec.line);
      return rec;
    });
    this.scene.add(this.overlayGroup);

    this.refreshOverlay();
  }

  disableMatch(): void {
    this.overlay = null;
    if (this.partnerShell) {
      this.scene.remove(this.partnerShell.points);
      this.partnerShell.points.geometry.dispose();
      this.partnerShell.material.dispose();
      this.partnerShell = null;
    }
    if (this.partnerPentagon) {
      this.scene.remove(this.partnerPentagon.group);
      disposeObject3D(this.partnerPentagon.group);
      this.partnerPentagon = null;
    }
    if (this.overlayGroup) {
      this.scene.remove(this.overlayGroup);
      disposeObject3D(this.overlayGroup);
      this.overlayGroup = null;
      this.overlayArcs = [];
    }
    this.partnerSignature = null;
    this.onOverlay?.(null);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.autoRotateResumeTimer) clearTimeout(this.autoRotateResumeTimer);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.disableMatch();
    disposeObject3D(this.scene);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // ─── Aufbau ───────────────────────────────────────────────────────────────

  private makeCymaticShell(cool: boolean): Shell {
    const uniforms: ShellUniforms = {
      uPhase: { value: 0 },
      uTime: { value: 0 },
      uHarmony: { value: 0.6 },
      uStrength: { value: [0.5, 0.5, 0.5, 0.5, 0.5] },
      uDelta: { value: [0, 0, 0, 0, 0] },
      uAxes: { value: ELEMENT_AXES },
      uColors: {
        value: cool
          // Partner-Palette: gleiche Element-Farbtöne Richtung Silber-Blau gekühlt
          ? ELEMENT_COLORS.map((c) => c.clone().lerp(new THREE.Color(0x9db8dd), 0.55))
          : ELEMENT_COLORS,
      },
      uTint: { value: cool ? new THREE.Color(0xa8c4e8) : new THREE.Color(THEME.gold) },
      uPointSize: { value: cool ? 0.36 : 0.42 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(makeShellGeometry(), material);
    return { points, uniforms, material };
  }

  private nodePosition(el: SignatureElement, mirror: boolean, target: THREE.Vector3): THREE.Vector3 {
    const rad = (el.angle * Math.PI) / 180;
    return target.set(
      Math.cos(rad) * NODE_RADIUS,
      (mirror ? -1 : 1) * el.strength * 3, // MATHEMATICS.md §5.2
      Math.sin(rad) * NODE_RADIUS,
    );
  }

  private buildPentagon(sigElements: SignatureElement[], mirror: boolean): Pentagon {
    const group = new THREE.Group();
    const nodes = sigElements.map((el) => {
      const pos = this.nodePosition(el, mirror, new THREE.Vector3());
      // Basisradius 0.33 → applyPentagon skaliert auf 0.18 + strength × 0.3
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.33, 24, 24),
        new THREE.MeshStandardMaterial({
          color: el.color, emissive: el.color, emissiveIntensity: 0.7,
          roughness: 0.25, metalness: 0.5,
        }),
      );
      mesh.scale.setScalar((0.18 + el.strength * 0.3) / 0.33);
      mesh.position.copy(pos);
      group.add(mesh);

      const glow = makeGlowSprite(el.color, 1.1 + el.strength * 2.2);
      glow.position.copy(pos);
      group.add(glow);

      // Friction-Halo: pulsierendes Rot für Elemente mit West/Bazi-Delta > 0.3 (§4.3)
      const halo = makeGlowSprite(THEME.friction, 2.2);
      halo.position.copy(pos);
      halo.material.opacity = 0;
      group.add(halo);

      return { el, pos, mesh, glow, halo, phase: Math.random() * Math.PI * 2 };
    });
    this.scene.add(group);
    return { group, nodes };
  }

  private makeArc(color: number, opacity: number): ArcRecord {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    return { line, curve: new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()), pulses: [] };
  }

  private writeArcGeometry(rec: ArcRecord): void {
    const attr = rec.line.geometry.attributes.position as THREE.BufferAttribute;
    for (let s = 0; s <= ARC_SEGMENTS; s++) {
      rec.curve.getPoint(s / ARC_SEGMENTS, this.tmpVecC);
      attr.setXYZ(s, this.tmpVecC.x, this.tmpVecC.y, this.tmpVecC.z);
    }
    attr.needsUpdate = true;
  }

  /** Shēng-Bogen: Kontrollpunkt radial nach außen + oben; Kè-Bogen: fast gerade. */
  private setCycleArcCurve(rec: ArcRecord, a: THREE.Vector3, b: THREE.Vector3): void {
    rec.curve.v0.copy(a);
    rec.curve.v2.copy(b);
    this.tmpVecA.addVectors(a, b).multiplyScalar(0.5);
    if (rec.type === "generates") {
      rec.curve.v1.set(this.tmpVecA.x * 1.5, Math.max(a.y, b.y) + 1.6, this.tmpVecA.z * 1.5);
    } else {
      rec.curve.v1.set(this.tmpVecA.x * 1.08, this.tmpVecA.y + 0.25, this.tmpVecA.z * 1.08);
    }
    this.writeArcGeometry(rec);
  }

  private buildCycleArcs(sig: WuXingSignature, nodes: PentagonNode[], group: THREE.Group): ArcRecord[] {
    const byId = Object.fromEntries(nodes.map((n) => [n.el.id, n]));
    const arcs: ArcRecord[] = [];
    sig.edges.forEach((edge) => {
      if (edge.type === "friction") return; // als Node-Halos gerendert
      const a = byId[edge.from], b = byId[edge.to];
      if (!a || !b) return;
      const isGen = edge.type === "generates";
      const rec = this.makeArc(edge.color, isGen ? 0.25 + edge.strength * 0.45 : Math.min(1, edge.strength * 0.7));
      rec.type = edge.type;
      rec.edge = edge;
      if (isGen) {
        // 3 wandernde Puls-Sprites pro Generierungs-Kante, Tempo ∝ Fluss = min(sA, sB)
        for (let p = 0; p < 3; p++) {
          const sprite = makeGlowSprite(THEME.generate, 0.4);
          group.add(sprite);
          rec.pulses.push({ sprite, t: p / 3 });
        }
      }
      this.setCycleArcCurve(rec, a.pos, b.pos);
      group.add(rec.line);
      arcs.push(rec);
    });
    return arcs;
  }

  // ─── Signatur → Szene ─────────────────────────────────────────────────────

  private applyUniforms(sig: WuXingSignature, uniforms: ShellUniforms): void {
    for (let i = 0; i < ELEMENT_ORDER.length; i++) {
      const el = sig.elements[i];
      uniforms.uStrength.value[i] = el.strength;
      uniforms.uDelta.value[i] = el.delta;
    }
    uniforms.uHarmony.value = sig.harmony;
  }

  private applyPentagon(sig: WuXingSignature, pentagon: Pentagon, mirror: boolean): void {
    pentagon.nodes.forEach((node, i) => {
      const el = sig.elements[i];
      node.el = el;
      this.nodePosition(el, mirror, node.pos);
      node.mesh.position.copy(node.pos);
      node.glow.position.copy(node.pos);
      node.halo.position.copy(node.pos);
      node.mesh.scale.setScalar((0.18 + el.strength * 0.3) / 0.33);
      node.glow.scale.setScalar(1.1 + el.strength * 2.2);
    });
  }

  private applyArcs(sig: WuXingSignature, arcs: ArcRecord[], nodes: PentagonNode[]): void {
    const byId = Object.fromEntries(nodes.map((n) => [n.el.id, n]));
    // Kantenstärken aus der re-fusionierten Signatur auffrischen
    const edgeKey = (e: SignatureEdge) => `${e.type}:${e.from}:${e.to}`;
    const edgeMap: Record<string, SignatureEdge> = {};
    sig.edges.forEach((e) => { edgeMap[edgeKey(e)] = e; });
    arcs.forEach((rec) => {
      if (!rec.edge) return;
      const fresh = edgeMap[edgeKey(rec.edge)];
      if (fresh) {
        rec.edge = fresh;
        (rec.line.material as THREE.LineBasicMaterial).opacity = rec.type === "generates"
          ? 0.25 + fresh.strength * 0.45
          : Math.min(1, fresh.strength * 0.7);
      }
      const a = byId[rec.edge.from], b = byId[rec.edge.to];
      if (a && b) this.setCycleArcCurve(rec, a.pos, b.pos);
    });
  }

  private setOverlayArcCurve(rec: ArcRecord, a: THREE.Vector3, b: THREE.Vector3): void {
    rec.curve.v0.copy(a);
    rec.curve.v2.copy(b);
    this.tmpVecA.addVectors(a, b).multiplyScalar(0.5);
    rec.curve.v1.set(this.tmpVecA.x * 1.35, this.tmpVecA.y, this.tmpVecA.z * 1.35);
    this.writeArcGeometry(rec);
  }

  private refreshOverlay(): void {
    if (!this.partnerSignature || !this.signature) return;
    this.overlay = computeOverlay(this.signature, this.partnerSignature);
    // vertikale Verbindungsbögen pro Element: mein Node ↔ Partner-Node
    if (this.overlayGroup && this.overlay && this.myPentagon && this.partnerPentagon) {
      const greenC = new THREE.Color(THEME.harmony);
      const redC = new THREE.Color(THEME.friction);
      this.overlay.perElement.forEach((pe, i) => {
        const idx = ELEMENT_ORDER.indexOf(pe.id) >= 0 ? ELEMENT_ORDER.indexOf(pe.id) : i;
        const rec = this.overlayArcs[idx];
        const myNode = this.myPentagon!.nodes[idx];
        const pNode = this.partnerPentagon!.nodes[idx];
        if (!rec || !myNode || !pNode) return;
        const t = Math.max(0, Math.min(1, pe.frictionOverlay * 1.5 + (1 - pe.resonance) * 0.5));
        const mat = rec.line.material as THREE.LineBasicMaterial;
        mat.color.copy(greenC).lerp(redC, t);
        mat.opacity = 0.12 + Math.max(0, Math.min(1, pe.resonance)) * 0.6;
        this.setOverlayArcCurve(rec, myNode.pos, pNode.pos);
      });
    }
    this.onOverlay?.(this.overlay);
  }

  // ─── Animation (keine Allokationen pro Frame) ─────────────────────────────

  private animate(): void {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;

    this.wavePhase += dt * (0.3 + this.cosmicCurrent * 1.2) * this.timelapse;

    this.myShell.uniforms.uPhase.value = this.wavePhase;
    this.myShell.uniforms.uTime.value = time;
    this.myShell.points.rotation.y += dt * 0.04;

    if (this.partnerShell) {
      this.partnerShell.uniforms.uPhase.value = this.wavePhase;
      this.partnerShell.uniforms.uTime.value = time;
      this.partnerShell.points.rotation.y -= dt * 0.04; // gegenläufig
    }

    if (this.myPentagon) {
      this.animatePentagon(this.myPentagon, time);
      this.myArcs.forEach((rec) => {
        if (!rec.edge) return;
        for (let p = 0; p < rec.pulses.length; p++) {
          const pulse = rec.pulses[p];
          pulse.t += dt * (0.06 + rec.edge.strength * 0.3) * (0.5 + this.cosmicCurrent);
          if (pulse.t > 1) pulse.t -= 1;
          rec.curve.getPoint(pulse.t, this.tmpVecC);
          pulse.sprite.position.copy(this.tmpVecC);
          pulse.sprite.material.opacity = 0.35 + Math.sin(pulse.t * Math.PI) * 0.55;
        }
      });
    }

    if (this.partnerPentagon) {
      this.animatePentagon(this.partnerPentagon, time);
    }

    // Boden-Echo: sanfte Skalierungs-/Opazitätswelle, getrieben vom Cosmic State
    const ripple = Math.sin(time * 0.6);
    const gridMat = this.groundGrid.material as THREE.Material & { opacity: number };
    gridMat.opacity = 0.05 + 0.05 * this.cosmicCurrent * (0.5 + 0.5 * ripple);
    const gScale = 1 + 0.02 * this.cosmicCurrent * ripple;
    this.groundGrid.scale.set(gScale, 1, gScale);

    this.coreLight.intensity = 45 + this.cosmicCurrent * 55;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private animatePentagon(pentagon: Pentagon, time: number): void {
    pentagon.nodes.forEach((node) => {
      const pulse = 1 + Math.sin(time * 1.6 + node.phase) * 0.1;
      node.glow.scale.setScalar((1.1 + node.el.strength * 2.2) * pulse);
      // Friction-Halo: pulsierendes Rot, wo delta > 0.3
      node.halo.material.opacity = node.el.delta > 0.3
        ? node.el.delta * (0.25 + 0.35 * Math.abs(Math.sin(time * 2.2 + node.phase)))
        : 0;
    });
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
