/* ============================================================================
   Design of Man — scroll-driven laptop assembly
   ----------------------------------------------------------------------------
   The laptop is generated procedurally from primitives, so there is no 3D model
   to license, host or download. Scroll position drives three phases:

     A  0.00 – 0.58   components fly in from exploded positions and assemble
     B  0.58 – 0.74   the lid rotates open on its hinge
     C  0.74 – 1.00   the camera dollies into the screen, which fills the frame

   Degrades to a static composed frame when the visitor asks for reduced motion,
   and to nothing at all (the poster stays) when WebGL is unavailable.
   ========================================================================== */

import * as THREE from '../vendor/three.module.min.js';

const PALETTE = {
  oceanDeep: 0x16233b,
  oceanAbyss: 0x0c1424,
  gold: 0xc9a24b,
  goldSoft: 0xe0c173,
  sand: 0xe4d5b8,
  coral: 0xc15f3c,
  foam: 0xf7f2e9,
  shell: 0xb9bfc6,
  shellDark: 0x8d949c,
  deck: 0x2b2f36,
  key: 0x1a1d22,
  pcb: 0x14322a,
  copper: 0xb2734a,
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const invLerp = (v, a, b) => clamp((v - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* ---------------------------------------------------------------- geometry */

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** A flat slab: w along X, d along Z, thickness t along Y. */
function slab(w, d, t, r = 0.06, bevel = 0.012) {
  const b = Math.min(bevel, t / 2.5);
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, d, r), {
    depth: Math.max(t - b * 2, 0.001),
    bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({
  color, metalness: 0.55, roughness: 0.42, envMapIntensity: 1.15, ...opts,
});

/* A tiny softbox studio, PMREM-filtered into an environment map. Built by hand
   rather than importing RoomEnvironment so this file still runs unbundled off
   the vendored three.module build. Reflections are what make brushed aluminium
   read as metal rather than flat grey. */
function studioEnvironment(renderer) {
  const env = new THREE.Scene();
  const panel = (color, intensity, pos, rot, size) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshBasicMaterial({ color, toneMapped: false })
    );
    m.material.color.multiplyScalar(intensity);
    m.position.set(...pos); m.rotation.set(...rot);
    env.add(m);
  };
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(20, 14, 20),
    new THREE.MeshBasicMaterial({ color: 0x141d2c, side: THREE.BackSide, toneMapped: false })
  );
  env.add(shell);
  panel(0xffffff, 3.4, [0, 6.6, 0], [Math.PI / 2, 0, 0], [11, 11]);        // key softbox
  panel(0xc9a24b, 1.5, [-9.4, 1.2, 0], [0, Math.PI / 2, 0], [12, 9]);      // gold bounce
  panel(0x9fc4e8, 1.1, [9.4, 1.0, 0], [0, -Math.PI / 2, 0], [12, 9]);      // cool bounce
  panel(0xc15f3c, 0.7, [0, -1.5, -9.4], [0, 0, 0], [12, 7]);               // warm rim
  panel(0xffffff, 0.5, [0, 0, 9.4], [0, Math.PI, 0], [12, 8]);             // front fill

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  env.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return tex;
}

/* ------------------------------------------------------- screen texture */

function drawScreen(ctx, W, H) {
  const GOLD = '#C9A24B', LGOLD = '#E0C173', FOAM = '#F7F2E9', CORAL = '#C15F3C';

  // hero gradient, matching the live site
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, '#1B2C48'); g.addColorStop(0.5, '#132038'); g.addColorStop(1, '#0A1220');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'middle';

  /* ---- the Vitruvian blueprint mark, right side ---- */
  ctx.save();
  const cx = W * 0.755, cy = H * 0.56, R = H * 0.33;
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1, H * 0.0018);
  ctx.strokeStyle = 'rgba(201,162,75,.26)';
  ctx.strokeRect(-R, -R, R * 2, R * 2);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,162,75,.5)'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R);
  ctx.moveTo(-R, -R); ctx.lineTo(R, R); ctx.moveTo(R, -R); ctx.lineTo(-R, R);
  ctx.strokeStyle = 'rgba(247,242,233,.11)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.618, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,162,75,.2)'; ctx.stroke();
  const s = R / 43, P = (x, y) => [(x - 50) * s, (y - 52) * s];
  const limb = (a, b) => { ctx.moveTo(...P(...a)); ctx.lineTo(...P(...b)); };
  ctx.lineCap = 'round';
  ctx.beginPath(); limb([50, 39], [11, 46]); limb([50, 39], [89, 46]);
  ctx.strokeStyle = 'rgba(201,162,75,.3)'; ctx.lineWidth = H * 0.0028; ctx.stroke();
  ctx.beginPath();
  limb([50, 32], [50, 63]); limb([50, 39], [17, 24]); limb([50, 39], [83, 24]);
  limb([50, 63], [31, 88]); limb([50, 63], [69, 88]);
  ctx.strokeStyle = 'rgba(247,242,233,.6)'; ctx.lineWidth = H * 0.0045; ctx.stroke();
  const hd = P(50, 25);
  ctx.beginPath(); ctx.arc(hd[0], hd[1], 6.5 * s, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(224,193,115,.72)'; ctx.lineWidth = H * 0.0035; ctx.stroke();
  ctx.restore();

  // scrim so copy stays readable over the mark
  const sc = ctx.createLinearGradient(0, 0, W, 0);
  sc.addColorStop(0, 'rgba(6,20,32,.72)'); sc.addColorStop(0.38, 'rgba(6,20,32,.46)');
  sc.addColorStop(0.62, 'rgba(6,20,32,.16)'); sc.addColorStop(0.76, 'rgba(6,20,32,0)');
  ctx.fillStyle = sc; ctx.fillRect(0, 0, W, H);

  /* ---- browser chrome ---- */
  ctx.fillStyle = 'rgba(8,14,24,.92)'; ctx.fillRect(0, 0, W, H * 0.052);
  ['#e0655b', '#e0b23f', '#5fb85f'].forEach((c, i) => {
    ctx.beginPath(); ctx.arc(W * 0.022 + i * W * 0.018, H * 0.026, H * 0.0085, 0, 7);
    ctx.fillStyle = c; ctx.fill();
  });
  ctx.fillStyle = 'rgba(247,242,233,.09)';
  ctx.beginPath(); ctx.roundRect(W * 0.09, H * 0.011, W * 0.34, H * 0.03, H * 0.015); ctx.fill();
  ctx.fillStyle = 'rgba(247,242,233,.45)';
  ctx.font = `${Math.round(H * 0.018)}px ui-monospace, monospace`;
  ctx.fillText('designofman.com', W * 0.105, H * 0.027);

  /* ---- utility bar ---- */
  ctx.fillStyle = 'rgba(6,12,22,.85)'; ctx.fillRect(0, H * 0.052, W, H * 0.038);
  ctx.font = `${Math.round(H * 0.017)}px ui-monospace, monospace`;
  ctx.fillStyle = 'rgba(247,242,233,.55)';
  ctx.fillText('Website Creation & Management  ·  Serving Clients Worldwide', W * 0.045, H * 0.071);
  ctx.fillStyle = GOLD;
  ctx.fillText('Book a Free Consult', W * 0.80, H * 0.071);

  /* ---- nav ---- */
  ctx.fillStyle = FOAM;
  ctx.font = `italic 600 ${Math.round(H * 0.032)}px Georgia, serif`;
  ctx.fillText('Design of Man', W * 0.075, H * 0.132);
  ctx.beginPath(); ctx.arc(W * 0.055, H * 0.132, H * 0.016, 0, 7);
  ctx.strokeStyle = GOLD; ctx.lineWidth = H * 0.0022; ctx.stroke();
  // advance by measured width so labels can never collide
  ctx.font = `${Math.round(H * 0.021)}px system-ui, sans-serif`;
  {
    const items = ['Home', 'About Us', 'Services', 'Work', 'Blog', 'Pricing', 'FAQ'];
    const pad = W * 0.016;
    const total = items.reduce((a, t) => a + ctx.measureText(t).width + pad, -pad);
    let x = W * 0.78 - total;
    items.forEach((t, i) => {
      ctx.fillStyle = i === 0 ? FOAM : 'rgba(247,242,233,.66)';
      ctx.fillText(t, x, H * 0.132);
      if (i === 0) {
        ctx.strokeStyle = GOLD; ctx.lineWidth = H * 0.0022;
        ctx.beginPath();
        ctx.moveTo(x, H * 0.152); ctx.lineTo(x + ctx.measureText(t).width, H * 0.152); ctx.stroke();
      }
      x += ctx.measureText(t).width + pad;
    });
  }
  ctx.fillStyle = CORAL;
  ctx.beginPath(); ctx.roundRect(W * 0.80, H * 0.108, W * 0.145, H * 0.048, H * 0.024); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(H * 0.02)}px system-ui, sans-serif`;
  ctx.fillText('Book a Free Consult', W * 0.8725, H * 0.132);
  ctx.textAlign = 'left';

  /* ---- eyebrow ---- */
  ctx.strokeStyle = GOLD; ctx.lineWidth = H * 0.003;
  ctx.beginPath(); ctx.moveTo(W * 0.075, H * 0.235); ctx.lineTo(W * 0.105, H * 0.235); ctx.stroke();
  ctx.fillStyle = LGOLD;
  ctx.font = `500 ${Math.round(H * 0.019)}px ui-monospace, monospace`;
  ctx.fillText('WEBSITE CREATION & MANAGEMENT', W * 0.115, H * 0.236);

  /* ---- headline: the live one ---- */
  ctx.fillStyle = FOAM;
  ctx.font = `500 ${Math.round(H * 0.098)}px Georgia, serif`;
  ctx.fillText('Built by design,', W * 0.072, H * 0.335);
  ctx.fillStyle = GOLD;
  ctx.font = `italic 400 ${Math.round(H * 0.098)}px Georgia, serif`;
  ctx.fillText('not by accident.', W * 0.072, H * 0.445);

  /* ---- lede ---- */
  ctx.fillStyle = 'rgba(247,242,233,.78)';
  ctx.font = `${Math.round(H * 0.0235)}px system-ui, sans-serif`;
  ['We design, build, and maintain websites and web apps for',
   'businesses who want something dependable — clean to look at,',
   'simple to use, and cared for long after launch.'
  ].forEach((l, i) => ctx.fillText(l, W * 0.075, H * (0.535 + i * 0.036)));

  /* ---- buttons ---- */
  ctx.fillStyle = CORAL;
  ctx.beginPath(); ctx.roundRect(W * 0.075, H * 0.665, W * 0.185, H * 0.062, H * 0.031); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(H * 0.021)}px system-ui, sans-serif`;
  ctx.fillText('Book a Free Consult  →', W * 0.1675, H * 0.696);
  ctx.strokeStyle = 'rgba(247,242,233,.4)'; ctx.lineWidth = H * 0.002;
  ctx.beginPath(); ctx.roundRect(W * 0.275, H * 0.665, W * 0.145, H * 0.062, H * 0.031); ctx.stroke();
  ctx.fillStyle = 'rgba(247,242,233,.9)';
  ctx.fillText('See Our Services', W * 0.3475, H * 0.696);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(247,242,233,.5)';
  ctx.font = `${Math.round(H * 0.017)}px ui-monospace, monospace`;
  ctx.fillText('No pressure.  Free 30-minute call.', W * 0.075, H * 0.762);

  /* ---- stat band ---- */
  ctx.strokeStyle = 'rgba(247,242,233,.14)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.075, H * 0.845); ctx.lineTo(W * 0.66, H * 0.845); ctx.stroke();
  const stats = [['120', '+', 'SITES LAUNCHED'], ['99.9', '%', 'UPTIME DELIVERED'],
                 ['14', ' yrs', 'BUILDING THE WEB'], ['<1', ' day', 'SUPPORT RESPONSE']];
  stats.forEach(([n, suf, label], i) => {
    const x = W * 0.075 + i * W * 0.15;
    ctx.fillStyle = FOAM;
    ctx.font = `500 ${Math.round(H * 0.045)}px Georgia, serif`;
    ctx.fillText(n, x, H * 0.905);
    const nw = ctx.measureText(n).width;
    ctx.fillStyle = GOLD;
    ctx.font = `${Math.round(H * 0.026)}px Georgia, serif`;
    ctx.fillText(suf, x + nw + H * 0.006, H * 0.913);
    ctx.fillStyle = 'rgba(247,242,233,.5)';
    ctx.font = `${Math.round(H * 0.0155)}px ui-monospace, monospace`;
    ctx.fillText(label, x, H * 0.955);
  });
}

const PALETTE_HEX = (n) => '#' + n.toString(16).padStart(6, '0');

function makeScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1280;
  const ctx = c.getContext('2d');
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) { this.rect(x, y, w, h); return this; };
  }
  drawScreen(ctx, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ------------------------------------------------------------------ build */

export function createLaptopScene(root) {
  const canvas = root.querySelector('[data-laptop-canvas]');
  const captionEls = [...root.querySelectorAll('[data-caption]')];
  const progressBar = root.querySelector('[data-progress-fill]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    root.setAttribute('data-webgl', 'unsupported');
    return null;
  }
  if (!renderer.getContext()) { root.setAttribute('data-webgl', 'unsupported'); return null; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const rig = new THREE.Group();
  scene.add(rig);

  /* -------- lighting -------- */
  scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x0b1220, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 7, 5);
  scene.add(key);
  const rimGold = new THREE.DirectionalLight(PALETTE.gold, 1.5);
  rimGold.position.set(-6, 2.5, -3);
  scene.add(rimGold);
  const rimCoral = new THREE.DirectionalLight(PALETTE.coral, 0.9);
  rimCoral.position.set(5, -1.5, -4);
  scene.add(rimCoral);
  const fill = new THREE.PointLight(0xbfd4ff, 12, 22, 2);
  fill.position.set(0, 3, 6);
  scene.add(fill);

  /* -------- dimensions -------- */
  const W = 6.4;          // width  (X)
  const D = 4.4;          // depth  (Z)
  const BASE_T = 0.38;    // base thickness

  const parts = [];
  /**
   * @param mesh      THREE.Object3D
   * @param from      exploded offset {x,y,z}
   * @param range     [start,end] within phase A
   * @param spin      exploded rotation offset
   */
  function addPart(mesh, parent, from, range, spin = { x: 0, y: 0, z: 0 }) {
    parent.add(mesh);
    parts.push({
      mesh,
      home: mesh.position.clone(),
      homeRot: mesh.rotation.clone(),
      from: new THREE.Vector3(from.x, from.y, from.z),
      spin,
      range,
    });
    return mesh;
  }

  /* -------- base assembly -------- */
  const baseGroup = new THREE.Group();
  rig.add(baseGroup);

  // bottom shell
  const bottom = new THREE.Mesh(slab(W, D, BASE_T * 0.55, 0.28), mat(PALETTE.shellDark, { metalness: 0.85, roughness: 0.34 }));
  bottom.position.y = -BASE_T * 0.32;
  addPart(bottom, baseGroup, { x: 0, y: -2.6, z: 0.4 }, [0.00, 0.20], { x: 0.25, y: 0.4, z: 0 });

  // rubber feet
  for (const [fx, fz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.1, 0.05, 16),
      mat(0x0d0f12, { metalness: 0.1, roughness: 0.9 })
    );
    foot.position.set(fx * (W / 2 - 0.55), -BASE_T * 0.55, fz * (D / 2 - 0.5));
    addPart(foot, baseGroup, { x: 0, y: -1.9, z: 0 }, [0.02, 0.18]);
  }

  /* ---- battery: six terraced cells, controller board and a coin cell ---- */
  const cellSpec = [
    [-2.10, 0.62, 1.42, 1.90], [-0.70, 0.62, 1.42, 1.90], [0.70, 0.62, 1.42, 1.90],
    [2.10, 0.62, 1.42, 1.90], [-1.40, 1.90, 1.42, 1.05], [1.40, 1.90, 1.42, 1.05],
  ];
  cellSpec.forEach(([x, z, cw, cd], i) => {
    const cell = new THREE.Mesh(slab(cw, cd, 0.15, 0.05),
      mat(0x23272d, { metalness: 0.22, roughness: 0.72 }));
    cell.position.set(x, -0.02, z - 0.55);
    addPart(cell, baseGroup, { x: x * 1.5, y: -1.8, z: 1.7 },
            [0.09 + i * 0.018, 0.30 + i * 0.018], { x: 0.45, z: 0.25 });
    // cell tab
    const tab = new THREE.Mesh(slab(cw * 0.42, 0.07, 0.03, 0.01),
      mat(0xcbb47a, { metalness: 1, roughness: 0.3 }));
    tab.position.set(x, 0.07, z - 0.55 - cd / 2 - 0.03);
    addPart(tab, baseGroup, { x: x * 1.5, y: -1.5, z: 1.9 }, [0.11 + i * 0.018, 0.32 + i * 0.018]);
  });

  const bms = new THREE.Mesh(slab(1.5, 0.34, 0.05, 0.02), mat(0x1a3a2c, { metalness: 0.25, roughness: 0.7 }));
  bms.position.set(0, 0.06, 0.06);
  addPart(bms, baseGroup, { x: 0, y: 1.7, z: 2.2 }, [0.22, 0.42], { x: 0.5 });

  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20),
    mat(0xc9ced4, { metalness: 1, roughness: 0.24 }));
  coin.position.set(-2.15, 0.09, -0.55);
  addPart(coin, baseGroup, { x: -2.4, y: 1.8, z: -1.5 }, [0.28, 0.46], { x: 0.9 });

  /* ---- logic board, with an etched PCB texture ---- */
  const pcbTex = (() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 320;
    const g = c.getContext('2d');
    g.fillStyle = '#14322a'; g.fillRect(0, 0, 1024, 320);
    // copper traces
    g.strokeStyle = 'rgba(184,142,74,.55)'; g.lineWidth = 2;
    for (let i = 0; i < 90; i++) {
      const y = 12 + Math.random() * 296;
      g.beginPath(); g.moveTo(Math.random() * 300, y);
      let x = 60 + Math.random() * 300, cy = y;
      for (let k = 0; k < 4; k++) {
        x += 60 + Math.random() * 140;
        cy += (Math.random() - 0.5) * 46;
        g.lineTo(x, cy);
      }
      g.stroke();
    }
    // ground pour hatch
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1;
    for (let x = -320; x < 1024; x += 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 320, 320); g.stroke(); }
    // pads
    g.fillStyle = 'rgba(214,180,110,.8)';
    for (let i = 0; i < 220; i++) g.fillRect(Math.random() * 1010, Math.random() * 312, 5, 3);
    // silkscreen
    g.fillStyle = 'rgba(240,240,235,.5)';
    g.font = '13px ui-monospace, monospace';
    g.fillText('DOM-1  MAIN LOGIC BOARD', 26, 30);
    g.fillText('REV 2.4', 900, 300);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  })();

  const board = new THREE.Mesh(slab(4.5, 1.35, 0.07, 0.05),
    mat(0xffffff, { map: pcbTex, metalness: 0.15, roughness: 0.72 }));
  board.position.set(0, 0.02, -1.28);
  addPart(board, baseGroup, { x: 0, y: 2.1, z: -2.2 }, [0.16, 0.40], { x: -0.6, y: 0.5 });

  /* ---- packages on the board ---- */
  const chipSpecs = [
    [-1.15, 0.72, 0.58, PALETTE.gold], [0.42, 0.5, 0.42, 0x2f3944],
    [1.52, 0.34, 0.34, 0x2f3944], [-1.98, 0.3, 0.3, 0x2f3944],
    [0.98, 0.26, 0.26, 0x2f3944], [1.95, 0.22, 0.3, 0x2f3944],
  ];
  chipSpecs.forEach(([cx, cw, cd, col], i) => {
    const chip = new THREE.Mesh(slab(cw, cd, 0.06, 0.02),
      mat(col, { metalness: col === PALETTE.gold ? 0.95 : 0.4,
                 roughness: col === PALETTE.gold ? 0.25 : 0.6 }));
    chip.position.set(cx, 0.09, -1.28);
    addPart(chip, baseGroup, { x: cx * 0.8, y: 2.7, z: -2.6 }, [0.22 + i * 0.018, 0.44 + i * 0.018], { y: 0.8 });
  });

  // surface-mount capacitors and inductors, instanced
  {
    const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.09, 10);
    const caps = new THREE.InstancedMesh(capGeo, mat(0x2b2f36, { metalness: 0.5, roughness: 0.5 }), 46);
    const cm = new THREE.Matrix4();
    for (let i = 0; i < 46; i++) {
      cm.makeTranslation(-2.05 + (i % 23) * 0.185, 0, (i < 23 ? -0.42 : 0.42));
      caps.setMatrixAt(i, cm);
    }
    caps.instanceMatrix.needsUpdate = true;
    caps.position.set(0, 0.10, -1.28);
    addPart(caps, baseGroup, { x: 0, y: 2.9, z: -3.0 }, [0.26, 0.47]);

    const indGeo = slab(0.16, 0.16, 0.09, 0.02, 0.008);
    const inds = new THREE.InstancedMesh(indGeo, mat(0x1b1e23, { metalness: 0.4, roughness: 0.65 }), 8);
    const im = new THREE.Matrix4();
    for (let i = 0; i < 8; i++) { im.makeTranslation(-1.85 + i * 0.24, 0, 0.05); inds.setMatrixAt(i, im); }
    inds.instanceMatrix.needsUpdate = true;
    inds.position.set(0, 0.10, -1.28);
    addPart(inds, baseGroup, { x: -1.5, y: 2.6, z: -2.8 }, [0.24, 0.45]);
  }

  // thermal pads over the VRM
  for (const px of [-0.55, 0.62]) {
    const pad = new THREE.Mesh(slab(0.42, 0.24, 0.03, 0.01),
      mat(0x8fa8c6, { metalness: 0.1, roughness: 0.95 }));
    pad.position.set(px, 0.13, -1.28);
    addPart(pad, baseGroup, { x: px * 2, y: 2.4, z: -2.4 }, [0.30, 0.48]);
  }

  /* ---- storage: M.2 SSD with heatspreader, plus a 2.5" drive bay ---- */
  const m2 = new THREE.Mesh(slab(1.5, 0.42, 0.05, 0.03), mat(0x232a31, { metalness: 0.55, roughness: 0.5 }));
  m2.position.set(-1.55, 0.09, -0.92);
  addPart(m2, baseGroup, { x: -2.4, y: 2.4, z: -1.8 }, [0.28, 0.47], { y: 0.7 });

  const spreader = new THREE.Mesh(slab(1.56, 0.48, 0.04, 0.03),
    mat(0xb6bcc3, { metalness: 1, roughness: 0.28 }));
  spreader.position.set(-1.55, 0.145, -0.92);
  addPart(spreader, baseGroup, { x: -2.6, y: 2.8, z: -1.6 }, [0.32, 0.50], { y: -0.6 });

  const bay = new THREE.Mesh(slab(1.7, 1.15, 0.16, 0.04),
    mat(0x3a4048, { metalness: 0.85, roughness: 0.4 }));
  bay.position.set(2.05, 0.03, -0.30);
  addPart(bay, baseGroup, { x: 2.8, y: 2.2, z: -1.2 }, [0.20, 0.42], { y: -0.8, x: 0.3 });
  const bayLabel = new THREE.Mesh(slab(1.2, 0.7, 0.01, 0.02),
    mat(0xd8dde2, { metalness: 0.1, roughness: 0.85 }));
  bayLabel.position.set(2.05, 0.115, -0.30);
  addPart(bayLabel, baseGroup, { x: 2.9, y: 2.4, z: -1.0 }, [0.23, 0.44]);

  /* ---- wireless module and its antenna runs ---- */
  const wifi = new THREE.Mesh(slab(0.46, 0.32, 0.04, 0.02), mat(0x2b3a44, { metalness: 0.5, roughness: 0.5 }));
  wifi.position.set(-2.05, 0.09, -0.92);
  addPart(wifi, baseGroup, { x: -2.8, y: 2.2, z: -1.4 }, [0.30, 0.49], { y: 0.9 });

  const antMat = mat(0x14161a, { metalness: 0.3, roughness: 0.8 });
  [[-1, -0.1], [1, 0.1]].forEach(([dir, jitter], i) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.05, 0.11, -0.92),
      new THREE.Vector3(-1.2 * dir, 0.12, -1.55 + jitter),
      new THREE.Vector3(1.6 * dir, 0.12, -1.9),
      new THREE.Vector3(2.7 * dir, 0.12, -1.98),
    ]);
    const ant = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.018, 6, false), antMat);
    addPart(ant, baseGroup, { x: dir * 1.4, y: 1.8, z: -2.2 }, [0.34 + i * 0.02, 0.52 + i * 0.02]);
  });

  /* ---- I/O daughterboard on the right, with its flex ---- */
  const daughter = new THREE.Mesh(slab(1.1, 0.5, 0.05, 0.03),
    mat(0xffffff, { map: pcbTex, metalness: 0.15, roughness: 0.72 }));
  daughter.position.set(2.45, 0.05, -1.72);
  addPart(daughter, baseGroup, { x: 3.0, y: 2.0, z: -2.2 }, [0.24, 0.44], { y: -0.7 });

  const dFlex = new THREE.Mesh(slab(0.9, 0.26, 0.012, 0.02), mat(0xb98a4a, { metalness: 0.35, roughness: 0.6 }));
  dFlex.position.set(1.62, 0.08, -1.72);
  addPart(dFlex, baseGroup, { x: 2.2, y: 1.6, z: -2.0 }, [0.30, 0.50], { x: 0.5 });

  // audio jack module
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 14),
    mat(0x1a1d22, { metalness: 0.6, roughness: 0.5 }));
  jack.rotation.z = Math.PI / 2;
  jack.position.set(-2.95, 0.03, 0.9);
  addPart(jack, baseGroup, { x: -2.0, y: 1.4, z: 0.6 }, [0.32, 0.50], { z: 0.7 });

  // heat pipe
  const pipe = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 3.0, 6, 12), mat(PALETTE.copper, { metalness: 1, roughness: 0.28 }));
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(0, 0.12, -1.72);
  addPart(pipe, baseGroup, { x: 0, y: 2.4, z: -2.4 }, [0.26, 0.46], { x: 0.8 });

  // fans
  for (const fx of [-1, 1]) {
    const fan = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.13, 26), mat(0x30353c, { metalness: 0.6, roughness: 0.5 }));
    fan.add(housing);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 16), mat(PALETTE.shell, { metalness: 0.9, roughness: 0.3 }));
    hub.position.y = 0.02; fan.add(hub);
    for (let i = 0; i < 11; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.07), mat(0x454b53, { metalness: 0.5, roughness: 0.6 }));
      blade.position.set(Math.cos(i / 11 * Math.PI * 2) * 0.28, 0.03, Math.sin(i / 11 * Math.PI * 2) * 0.28);
      blade.rotation.y = -i / 11 * Math.PI * 2;
      blade.rotation.z = 0.35;
      fan.add(blade);
    }
    fan.userData.spinner = true;
    fan.position.set(fx * 1.95, 0.06, -1.72);
    addPart(fan, baseGroup, { x: fx * 2.4, y: 1.9, z: -2.1 }, [0.30, 0.50], { x: 0.9, z: fx * 0.6 });
  }

  // speaker grilles — perforations drawn into an alpha map
  const grilleTex = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 256);
    g.fillStyle = '#000';
    for (let y = 6; y < 250; y += 9) {
      for (let x = 8; x < 58; x += 9) {
        g.beginPath(); g.arc(x + ((y / 9) % 2 ? 4.5 : 0), y, 2.4, 0, 7); g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })();

  for (const sx of [-1, 1]) {
    const sp = new THREE.Mesh(slab(0.62, 2.5, 0.1, 0.08),
      mat(0x24282e, { metalness: 0.3, roughness: 0.8, alphaMap: grilleTex, transparent: true }));
    sp.position.set(sx * 2.72, 0.02, 0.35);
    addPart(sp, baseGroup, { x: sx * 2.8, y: -0.9, z: 0.9 }, [0.34, 0.52], { z: sx * 0.7 });
  }

  // top case (keyboard deck)
  const topCase = new THREE.Mesh(slab(W, D, 0.12, 0.28), mat(PALETTE.shell, { metalness: 0.88, roughness: 0.3 }));
  topCase.position.y = 0.19;
  addPart(topCase, baseGroup, { x: 0, y: 2.6, z: 0.9 }, [0.50, 0.68], { x: -0.35, z: 0.2 });

  // rear exhaust vents in the bottom shell
  {
    const ventGeo = slab(0.06, 0.34, 0.04, 0.02, 0.008);
    const vents = new THREE.InstancedMesh(ventGeo, mat(0x0a0c10, { metalness: 0.2, roughness: 0.9 }), 34);
    const vm = new THREE.Matrix4();
    for (let i = 0; i < 34; i++) {
      vm.makeTranslation(-2.55 + i * 0.155, 0, 0);
      vents.setMatrixAt(i, vm);
    }
    vents.instanceMatrix.needsUpdate = true;
    vents.position.set(0, -0.16, -D / 2 + 0.22);
    addPart(vents, baseGroup, { x: 0, y: -1.4, z: -1.6 }, [0.06, 0.24]);
  }

  // heatsink fin stacks either side of the heat pipe
  for (const fx of [-1, 1]) {
    const finGeo = slab(0.02, 0.42, 0.2, 0.006, 0.004);
    const fins = new THREE.InstancedMesh(finGeo, mat(0xd9dee4, { metalness: 1, roughness: 0.22 }), 22);
    const fm = new THREE.Matrix4();
    for (let i = 0; i < 22; i++) { fm.makeTranslation(i * 0.032, 0, 0); fins.setMatrixAt(i, fm); }
    fins.instanceMatrix.needsUpdate = true;
    fins.position.set(fx * 2.62 - (fx > 0 ? 0.34 : 0), 0.13, -1.72);
    addPart(fins, baseGroup, { x: fx * 2.6, y: 1.6, z: -2.0 }, [0.28, 0.48], { z: fx * 0.5 });
  }

  // CPU die + thermal interface, under the pipe
  const die = new THREE.Mesh(slab(0.34, 0.34, 0.05, 0.01), mat(0xc8ccd2, { metalness: 1, roughness: 0.18 }));
  die.position.set(0, 0.09, -1.72);
  addPart(die, baseGroup, { x: 0, y: 2.9, z: -2.6 }, [0.24, 0.42], { y: 0.9 });

  // RAM sticks and an SSD module
  for (let i = 0; i < 2; i++) {
    const ram = new THREE.Mesh(slab(1.05, 0.2, 0.05, 0.02), mat(0x1c2b33, { metalness: 0.5, roughness: 0.55 }));
    ram.position.set(1.28, 0.09, -1.55 + i * 0.26);
    addPart(ram, baseGroup, { x: 2.2, y: 2.5, z: -2.4 }, [0.26 + i * 0.02, 0.45 + i * 0.02], { y: -0.7 });
  }

  // flex ribbon from board to trackpad
  const ribbon = new THREE.Mesh(slab(0.5, 1.5, 0.012, 0.02), mat(0xb98a4a, { metalness: 0.35, roughness: 0.6 }));
  ribbon.position.set(0, 0.07, -0.15);
  addPart(ribbon, baseGroup, { x: 0, y: 1.6, z: 1.4 }, [0.34, 0.52], { x: 0.6 });

  // side ports
  const portMat = mat(0x0b0d11, { metalness: 0.3, roughness: 0.85 });
  for (const [sx, zOff] of [[-1, -1.1], [-1, -0.45], [-1, 0.2], [1, -1.1], [1, -0.45]]) {
    const port = new THREE.Mesh(slab(0.1, 0.3, 0.09, 0.035), portMat);
    port.position.set(sx * (W / 2 - 0.03), 0.02, zOff);
    addPart(port, baseGroup, { x: sx * 1.8, y: 0.9, z: 0 }, [0.36, 0.54]);
  }

  // case screws around the underside
  {
    const screwGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12);
    const screws = new THREE.InstancedMesh(screwGeo, mat(0x6f767e, { metalness: 1, roughness: 0.3 }), 10);
    const sm = new THREE.Matrix4();
    const pts = [[-2.9, -1.9], [0, -2.0], [2.9, -1.9], [-2.9, 0], [2.9, 0],
                 [-2.9, 1.9], [0, 2.0], [2.9, 1.9], [-1.5, 2.0], [1.5, 2.0]];
    pts.forEach((p, i) => { sm.makeTranslation(p[0], 0, p[1]); screws.setMatrixAt(i, sm); });
    screws.instanceMatrix.needsUpdate = true;
    screws.position.set(0, -0.22, 0);
    addPart(screws, baseGroup, { x: 0, y: -1.6, z: 0 }, [0.04, 0.22]);
  }

  // keyboard well — a recessed tray the keys drop into
  const well = new THREE.Mesh(slab(5.15, 2.35, 0.05, 0.08), mat(0x14171c, { metalness: 0.3, roughness: 0.8 }));
  well.position.set(0, 0.245, -0.72);
  addPart(well, baseGroup, { x: 0, y: 2.4, z: -0.7 }, [0.52, 0.70], { x: -0.4 });

  // keyboard backlight — emissive plane under the keys
  const backlight = new THREE.Mesh(
    new THREE.PlaneGeometry(5.0, 2.2),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, toneMapped: false })
  );
  backlight.rotation.x = -Math.PI / 2;
  backlight.position.set(0, 0.262, -0.72);
  baseGroup.add(backlight);

  /* keys — a real layout: staggered rows, wide modifiers, short function row.
     One InstancedMesh, each instance scaled from a unit key. */
  const U = 0.30, KGAP = 0.052, KD = 0.30;
  const ROWS = [
    { h: 0.62, k: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { h: 1, k: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] },
    { h: 1, k: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
    { h: 1, k: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25] },
    { h: 1, k: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75] },
    { h: 1, k: [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1, 1] },
  ];
  const keyCount = ROWS.reduce((n, r) => n + r.k.length, 0);
  const keyGeo = slab(1, 1, 0.055, 0.16, 0.035);
  const keyMesh = new THREE.InstancedMesh(
    keyGeo, mat(PALETTE.key, { metalness: 0.25, roughness: 0.68 }), keyCount);
  {
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const totalD = ROWS.reduce((d, r) => d + r.h * KD, 0) + (ROWS.length - 1) * KGAP;
    let z = -totalD / 2;
    let i = 0;
    for (const row of ROWS) {
      const rowW = row.k.reduce((a, u) => a + u * U, 0) + (row.k.length - 1) * KGAP;
      let x = -rowW / 2;
      for (const u of row.k) {
        const kw = u * U;
        pos.set(x + kw / 2, 0, z + (row.h * KD) / 2);
        scl.set(kw, 1, row.h * KD);
        m4.compose(pos, q, scl);
        keyMesh.setMatrixAt(i++, m4);
        x += kw + KGAP;
      }
      z += row.h * KD + KGAP;
    }
    keyMesh.instanceMatrix.needsUpdate = true;
  }
  keyMesh.position.set(0, 0.30, -0.72);
  addPart(keyMesh, baseGroup, { x: 0, y: 3.1, z: -0.7 }, [0.56, 0.74], { x: -0.5 });

  // power button, distinct from the key field
  const power = new THREE.Mesh(slab(0.3, 0.19, 0.055, 0.05),
    mat(0x2a2f36, { metalness: 0.8, roughness: 0.35 }));
  power.position.set(2.28, 0.30, -1.72);
  addPart(power, baseGroup, { x: 2.4, y: 2.8, z: -0.9 }, [0.58, 0.75]);

  // battery connector and its short cable run
  const conn = new THREE.Mesh(slab(0.34, 0.16, 0.07, 0.02), mat(0xd8c48a, { metalness: 1, roughness: 0.3 }));
  conn.position.set(0.9, 0.08, -0.36);
  addPart(conn, baseGroup, { x: 1.6, y: 1.9, z: 1.1 }, [0.30, 0.48], { y: 0.6 });

  // chassis stiffening ribs across the well floor
  {
    const ribGeo = slab(0.05, 1.9, 0.06, 0.015, 0.006);
    const ribs = new THREE.InstancedMesh(ribGeo, mat(0x767d85, { metalness: 1, roughness: 0.4 }), 5);
    const rm = new THREE.Matrix4();
    for (let i = 0; i < 5; i++) { rm.makeTranslation(-2.2 + i * 1.1, 0, 0); ribs.setMatrixAt(i, rm); }
    ribs.instanceMatrix.needsUpdate = true;
    ribs.position.set(0, -0.05, 0.9);
    addPart(ribs, baseGroup, { x: 0, y: -1.2, z: 1.4 }, [0.08, 0.26]);
  }

  // trackpad
  const trackpad = new THREE.Mesh(slab(2.1, 1.32, 0.035, 0.08), mat(0x9aa1a9, { metalness: 0.7, roughness: 0.25 }));
  trackpad.position.set(0, 0.26, 1.42);
  addPart(trackpad, baseGroup, { x: 0, y: 2.0, z: 2.3 }, [0.58, 0.76], { x: 0.7 });

  /* -------- lid --------
     Authored lying in XZ (like every other slab) then stood upright by rotating
     the inner group +90deg about X. After that rotation a child's +Y face points
     at +Z, i.e. at the camera — so screen, bezel and back stack along Y here. */
  const LH = D * 0.97;
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.24, -D / 2 + 0.06);
  rig.add(hinge);

  // hinge barrels
  for (const hx of [-1.85, 1.85]) {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 1.5, 20),
      mat(0x6f767e, { metalness: 1, roughness: 0.32 })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(hx, 0, 0);
    addPart(barrel, hinge, { x: hx * 1.4, y: 1.5, z: -0.9 }, [0.58, 0.72], { z: 0.8 });
  }

  const lid = new THREE.Group();
  hinge.add(lid);

  const lidInner = new THREE.Group();
  lidInner.rotation.x = Math.PI / 2;
  lid.add(lidInner);

  const lidBack = new THREE.Mesh(slab(W, LH, 0.13, 0.26), mat(PALETTE.shellDark, { metalness: 0.9, roughness: 0.3 }));
  lidBack.position.set(0, 0, -LH / 2);
  lidInner.add(lidBack);

  const bezel = new THREE.Mesh(slab(W - 0.1, LH - 0.1, 0.05, 0.22), mat(0x0a0c10, { metalness: 0.3, roughness: 0.6 }));
  bezel.position.set(0, 0.07, -LH / 2);
  lidInner.add(bezel);

  const screenTex = makeScreenTexture();
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true, opacity: 0 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.44, LH - 0.5), screenMat);
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, 0.105, -LH / 2);
  lidInner.add(screen);

  // webcam housing + lens + indicator LED, in the top bezel
  const camHousing = new THREE.Mesh(new THREE.CircleGeometry(0.062, 20),
    new THREE.MeshStandardMaterial({ color: 0x05070a, metalness: 0.4, roughness: 0.35 }));
  camHousing.rotation.x = -Math.PI / 2;
  camHousing.position.set(0, 0.108, -LH + 0.115);
  lidInner.add(camHousing);

  const camLens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x1d3550, metalness: 1, roughness: 0.1,
      emissive: 0x1a3a5c, emissiveIntensity: 0.4 }));
  camLens.rotation.x = -Math.PI / 2;
  camLens.position.set(0, 0.112, -LH + 0.115);
  lidInner.add(camLens);

  const led = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12),
    new THREE.MeshBasicMaterial({ color: 0x6ad48a, toneMapped: false, transparent: true, opacity: 0 }));
  led.rotation.x = -Math.PI / 2;
  led.position.set(0.16, 0.112, -LH + 0.115);
  lidInner.add(led);

  // glossy glass layer over the display
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.16, LH - 0.16),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0f16, metalness: 0, roughness: 0.06,
      transmission: 0, clearcoat: 1, clearcoatRoughness: 0.04,
      transparent: true, opacity: 0.16 })
  );
  glass.rotation.x = -Math.PI / 2;
  glass.position.set(0, 0.122, -LH / 2);
  lidInner.add(glass);

  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshStandardMaterial({
    color: PALETTE.foam, metalness: 0.2, roughness: 0.35, emissive: PALETTE.goldSoft, emissiveIntensity: 0.15,
  }));
  logo.rotation.x = Math.PI / 2;
  logo.position.set(0, -0.075, -LH / 2);
  lidInner.add(logo);

  // the lid flies in as one piece, then the hinge opens it
  parts.push({
    mesh: lid,
    home: lid.position.clone(),
    homeRot: lid.rotation.clone(),
    from: new THREE.Vector3(0, 2.3, -1.2),
    spin: { x: -0.5, y: 0.25, z: 0 },
    range: [0.62, 0.82],
  });

  const LID_CLOSED = Math.PI * 0.5;   // folded flat over the keyboard
  const LID_OPEN = -0.2;              // upright, tilted back a touch
  hinge.rotation.x = LID_CLOSED;

  /* -------- ground shadow blob -------- */
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(5.4, 48),
    new THREE.MeshBasicMaterial({ color: 0x0a1120, transparent: true, opacity: 0.28 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.42;
  rig.add(shadow);

  /* -------- camera keyframes -------- */
  // p=1 distance is derived from the screen height (3.77u) and fov, so the
  // display lands flush in frame instead of overshooting past its edges.
  const CAM = [
    { p: 0.00, pos: [1.6, 5.4, 13.2], look: [0, 0.6, -0.2], fov: 40 },
    { p: 0.26, pos: [-4.6, 3.4, 9.0], look: [-0.4, 0.2, -0.9], fov: 36 },
    // close pass over the board while the internals are landing — without this
    // the fins, RAM, die and screws are too small to read
    { p: 0.44, pos: [-2.4, 1.55, 4.35], look: [-0.2, 0.05, -1.5], fov: 34 },
    { p: 0.62, pos: [0.4, 3.6, 9.6], look: [0, 0.5, -0.8], fov: 37 },
    { p: 0.86, pos: [0.0, 2.5, 7.6], look: [0, 1.9, -2.0], fov: 33 },
    { p: 1.00, pos: [0.0, 2.35, 4.95], look: [0, 2.352, -2.461], fov: 31 },
  ];
  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  const lA = new THREE.Vector3(), lB = new THREE.Vector3();

  function applyCamera(p) {
    let i = 0;
    while (i < CAM.length - 2 && p > CAM[i + 1].p) i++;
    const a = CAM[i], b = CAM[i + 1];
    const t = easeInOut(invLerp(p, a.p, b.p));
    vA.fromArray(a.pos); vB.fromArray(b.pos);
    lA.fromArray(a.look); lB.fromArray(b.look);
    camera.position.lerpVectors(vA, vB, t);
    const look = lA.clone().lerp(lB, t);
    camera.lookAt(look);
    let fov = a.fov + (b.fov - a.fov) * t;
    // Widen vertically on narrow viewports so the horizontal framing (and the
    // final screen fill) stays constant instead of cropping on mobile.
    const TARGET_ASPECT = 1.6;
    if (camera.aspect < TARGET_ASPECT) {
      fov = THREE.MathUtils.radToDeg(
        2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * (TARGET_ASPECT / camera.aspect))
      );
    }
    camera.fov = Math.min(fov, 78);
    camera.updateProjectionMatrix();
  }

  /* -------- per-frame update -------- */
  const tmp = new THREE.Vector3();
  let fanSpin = 0;

  function update(p, dt) {
    // assembly
    for (const part of parts) {
      const t = easeOut(invLerp(p, part.range[0], part.range[1]));
      tmp.copy(part.home).add(part.from.clone().multiplyScalar(1 - t));
      part.mesh.position.copy(tmp);
      part.mesh.rotation.set(
        part.homeRot.x + part.spin.x * (1 - t),
        part.homeRot.y + (part.spin.y || 0) * (1 - t),
        part.homeRot.z + (part.spin.z || 0) * (1 - t)
      );
      if (part.mesh.material && part.mesh !== screen) {
        const m = part.mesh.material;
        if (m.transparent !== undefined) { m.transparent = t < 1; m.opacity = 0.15 + 0.85 * t; }
      }
    }

    // lid opening
    const open = easeInOut(invLerp(p, 0.68, 0.88));
    hinge.rotation.x = LID_CLOSED + (LID_OPEN - LID_CLOSED) * open;

    // screen wakes up, keyboard backlight comes on just before it
    screenMat.opacity = easeOut(invLerp(p, 0.76, 0.90));
    backlight.material.opacity = 0.5 * easeOut(invLerp(p, 0.66, 0.80));
    led.material.opacity = easeOut(invLerp(p, 0.84, 0.94));

    // rig presentation turn
    rig.rotation.y = (1 - easeInOut(clamp(p / 0.62))) * -0.42;
    shadow.material.opacity = 0.28 * easeOut(invLerp(p, 0.0, 0.25));

    // idle fan spin, only while visible
    fanSpin += dt * 6;
    rig.traverse((o) => { if (o.userData.spinner) o.rotation.y = fanSpin; });

    applyCamera(p);

    // captions
    const step = p < 0.20 ? 0 : p < 0.52 ? 1 : p < 0.72 ? 2 : p < 0.88 ? 3 : 4;
    captionEls.forEach((el, i) => el.setAttribute('data-active', String(i === step)));
    if (progressBar) progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  /* -------- sizing -------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* -------- scroll loop -------- */
  let target = 0, current = 0, running = false, last = performance.now();

  function computeTarget() {
    const rect = root.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    target = total <= 0 ? 0 : clamp(-rect.top / total);
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.12);
    last = now;
    // Exponential smoothing: frame-rate independent, and still responsive on
    // low-FPS devices where a linear dt*k factor lags badly.
    current += (target - current) * (1 - Math.exp(-9 * dt));
    if (Math.abs(target - current) < 0.0002) current = target;
    update(current, dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !running && !reduced) {
        running = true; last = performance.now(); requestAnimationFrame(frame);
      } else if (!e.isIntersecting) {
        running = false;
      }
    });
  }, { rootMargin: '200px 0px' });

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', computeTarget, { passive: true });
  computeTarget();

  if (reduced) {
    // One composed frame, no scrubbing: assembled, open, screen lit.
    update(1, 0);
    renderer.render(scene, camera);
    root.setAttribute('data-reduced', 'true');
  } else {
    current = target;
    io.observe(root);
    update(current, 0);
    renderer.render(scene, camera);
  }

  root.setAttribute('data-ready', 'true');
  return { update, resize, renderer };
}
