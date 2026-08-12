/* ============================================================================
   Design of Man — hero mark in 3D
   ----------------------------------------------------------------------------
   The same Vitruvian blueprint, rebuilt as real geometry: the square, circle
   and figure sit on separate depth planes, so the mark has parallax and
   specular highlights instead of being flat strokes.

   Mounts into #ocean (the existing hero canvas) and replaces the 2D version.
   ========================================================================== */
import * as THREE from 'three';

const GOLD = 0xc9a24b, LGOLD = 0xe0c173, PAPER = 0xf7f2e9, TERRA = 0xc15f3c;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* logo space (0..100, circle r=43 at 50,52) → world units */
const P = (x, y) => new THREE.Vector3((x - 50) / 43, -(y - 52) / 43, 0);

function tube(a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r, r, len, 10, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const cap = new THREE.SphereGeometry(r, 10, 8);
  const g = new THREE.Group();
  g.add(mesh);
  const c1 = new THREE.Mesh(cap, material); c1.position.copy(a); g.add(c1);
  const c2 = new THREE.Mesh(cap, material); c2.position.copy(b); g.add(c2);
  return g;
}

function ring(radius, tubeR, material, segments = 128) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tubeR, 8, segments), material);
}

export function createHero3D(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0, 6.2);

  const rig = new THREE.Group();          // holds everything, gets the parallax
  scene.add(rig);

  /* ---- lighting: low key, strong rim, so thin geometry still catches light ---- */
  scene.add(new THREE.HemisphereLight(0x9fb6d8, 0x0a1220, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(LGOLD, 2.6); rim.position.set(-4, 1.5, -2); scene.add(rim);
  const warm = new THREE.PointLight(TERRA, 8, 14, 2); warm.position.set(2.5, -2, 3); scene.add(warm);

  /* ---- materials ---- */
  const matGold = new THREE.MeshStandardMaterial({
    color: GOLD, metalness: 1, roughness: 0.26,
    emissive: GOLD, emissiveIntensity: 0.1, transparent: true, opacity: 0,
  });
  const matGoldSoft = new THREE.MeshStandardMaterial({
    color: GOLD, metalness: 1, roughness: 0.4, transparent: true, opacity: 0,
  });
  const matPaper = new THREE.MeshStandardMaterial({
    color: PAPER, metalness: 0.35, roughness: 0.32,
    emissive: PAPER, emissiveIntensity: 0.05, transparent: true, opacity: 0,
  });
  const matHead = new THREE.MeshStandardMaterial({
    color: LGOLD, metalness: 1, roughness: 0.22,
    emissive: LGOLD, emissiveIntensity: 0.22, transparent: true, opacity: 0,
  });
  const matHand = new THREE.MeshStandardMaterial({
    color: TERRA, metalness: 0.6, roughness: 0.35,
    emissive: TERRA, emissiveIntensity: 0.3, transparent: true, opacity: 0,
  });

  /* ---- layers, each on its own depth plane ---- */
  const layers = [];
  function layer(z) { const g = new THREE.Group(); g.position.z = z; rig.add(g); layers.push(g); return g; }

  const lSquare = layer(-0.42);
  const lCircle = layer(-0.16);
  const lCross  = layer(-0.30);
  const lRing   = layer(0.10);
  const lFigure = layer(0.02);
  const lHand   = layer(0.20);

  // square — four bars, behind everything
  const S = 1.0;
  [[-S, -S, S, -S], [S, -S, S, S], [S, S, -S, S], [-S, S, -S, -S]].forEach(([x1, y1, x2, y2]) => {
    lSquare.add(tube(new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0), 0.008, matGoldSoft));
  });

  // main circle
  lCircle.add(ring(1.0, 0.011, matGold));

  // construction: axes + diagonals
  const d = 1.0;
  [[-d, 0, d, 0], [0, -d, 0, d], [-d, -d, d, d], [d, -d, -d, d]].forEach(([x1, y1, x2, y2]) => {
    lCross.add(tube(new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0), 0.005, matGoldSoft));
  });

  // golden-ratio ring, floating in front
  lRing.add(ring(0.618, 0.007, matGoldSoft, 96));

  // the figure
  const limbs = [
    [P(50, 32), P(50, 63)],                     // torso
    [P(50, 39), P(17, 24)], [P(50, 39), P(83, 24)], // arms raised
    [P(50, 63), P(31, 88)], [P(50, 63), P(69, 88)], // legs
  ];
  limbs.forEach(([a, b]) => lFigure.add(tube(a, b, 0.013, matPaper)));

  // the second, horizontal pair of arms — the Vitruvian signature
  [[P(50, 39), P(11, 46)], [P(50, 39), P(89, 46)]].forEach(([a, b]) => {
    lFigure.add(tube(a, b, 0.010, matGoldSoft));
  });

  // head — a ring, not a disc
  const head = ring(6.5 / 43, 0.016, matHead, 64);
  head.position.copy(P(50, 25));
  lFigure.add(head);

  // compass hand + pivot
  const hand = new THREE.Group();
  hand.add(tube(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), 0.006, matGoldSoft));
  const tick = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 12), matHand);
  tick.position.set(1, 0, 0); hand.add(tick);
  lHand.add(hand);
  const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 12), matHead);
  lHand.add(pivot);

  /* ---- drifting construction nodes for depth ---- */
  const nodeGeo = new THREE.SphereGeometry(0.012, 8, 6);
  const nodes = [];
  for (let i = 0; i < 14; i++) {
    const n = new THREE.Mesh(nodeGeo, matGoldSoft);
    n.position.set((Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 2.8, (Math.random() - 0.5) * 2.2);
    n.userData.sp = 0.15 + Math.random() * 0.3;
    n.userData.ph = Math.random() * 7;
    rig.add(n); nodes.push(n);
  }

  /* ---- pointer parallax ---- */
  let mx = 0, my = 0, px = 0, py = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / Math.max(window.innerWidth, 1)) - 0.5;
    my = (e.clientY / Math.max(window.innerHeight, 1)) - 0.5;
  }, { passive: true });

  /* ---- fit: keep the mark to the right of the headline column ---- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = w < 760;
    // frame vertically on the square (2 units) with margin
    const need = 3.05;   // more air: the square must sit clear of the copy
    const distV = (need / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const distH = (need / 2) / (Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
    camera.position.z = Math.max(distV, distH);
    // push the mark right on wide screens so it clears the copy
    rig.position.x = narrow ? 0 : camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect * 0.47;
    rig.position.y = narrow ? -0.15 : 0;
    rig.scale.setScalar(narrow ? 0.62 : 1);
    camera.updateProjectionMatrix();
  }

  /* ---- build-in, then idle ---- */
  const MATS = [matGold, matGoldSoft, matPaper, matHead, matHand];
  
  const STAGE = [
    [matGoldSoft, 0.15, 1.6, 0.26],
    [matGold, 0.35, 1.9, 0.52],
    [matPaper, 1.2, 2.5, 0.60],
    [matHead, 1.9, 2.7, 0.85],
    [matHand, 2.3, 3.0, 0.85],
  ];

  let t = 0, last = performance.now(), running = false;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; t += dt;
    const T = reduced ? 99 : t;

    STAGE.forEach(([m, a, b, target]) => {
      m.opacity = target * easeOut(clamp((T - a) / (b - a)));
    });

    px += (mx - px) * Math.min(1, dt * 3.2);
    py += (my - py) * Math.min(1, dt * 3.2);

    if (!reduced) {
      rig.rotation.y = Math.sin(t * 0.16) * 0.20 + px * 0.5;
      rig.rotation.x = Math.sin(t * 0.11) * 0.07 + py * 0.32;
      // layers drift at different rates — this is what reads as depth
      lSquare.rotation.z = Math.sin(t * 0.07) * 0.02;
      lRing.rotation.z = -t * 0.06;
      lCross.rotation.z = Math.sin(t * 0.05) * 0.015;
      hand.rotation.z = -t * 0.30;
      nodes.forEach((n) => {
        n.position.y += Math.sin(t * n.userData.sp + n.userData.ph) * dt * 0.06;
        n.position.x += dt * 0.02;
        if (n.position.x > 2.4) n.position.x = -2.4;
      });
    } else {
      rig.rotation.set(0.04, -0.22, 0);
      hand.rotation.z = -0.7;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      else if (!e.isIntersecting) running = false;
    });
  }, { rootMargin: '120px' });
  io.observe(canvas);

  if (reduced) { t = 99; running = true; last = performance.now(); requestAnimationFrame(frame); running = false;
                 STAGE.forEach(([m, , , target]) => { m.opacity = target; });
                 rig.rotation.set(0.04, -0.22, 0); renderer.render(scene, camera); }

  return { renderer, resize };
}
