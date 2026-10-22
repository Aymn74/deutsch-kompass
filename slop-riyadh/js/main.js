// main.js — renderer, atmosphere, cameras, input, HUD, minimap and the street atlas.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as G from './geo.js';
import { U, makeGroundMaterial, makeSky, poolMat } from './materials.js';
import { City } from './city.js';
import { buildLandmarks, buildMetro } from './landmarks.js';
import { Traffic } from './traffic.js';
import { Player } from './player.js';

const $ = (id) => document.getElementById(id);
const status = (t, p) => { $('loading-status').textContent = t; if (p !== undefined) $('loading-progress').style.width = (p * 100).toFixed(0) + '%'; };
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

// ---------- renderer & scene ----------
const touch = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: !touch, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 50000);
scene.fog = new THREE.Fog(0xd3cbb9, 600, 11000);

const sky = makeSky();
scene.add(sky);
const envScene = new THREE.Scene();
const envSky = new THREE.Mesh(sky.geometry, sky.material);
envSky.scale.setScalar(100);
envScene.add(envSky);
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;

const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(touch ? 1024 : 4096, touch ? 1024 : 4096);
Object.assign(sun.shadow.camera, { left: -260, right: 260, top: 260, bottom: -260, near: 10, far: 2600 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.7;
sun.shadow.radius = 3;
scene.add(sun, sun.target);

// ground and the arterial carriageways (they run on into the desert)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000).rotateX(-Math.PI / 2), makeGroundMaterial());
ground.receiveShadow = true;
scene.add(ground);
{
  const asphalt = makeGroundMaterial({ asphalt: true });
  const geos = [];
  for (const r of G.ROADS_U) {
    const a = G.toWorld(r.c, (G.EXT.v0 + G.EXT.v1) / 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, G.EXT.v1 - G.EXT.v0).rotateX(-Math.PI / 2), asphalt);
    m.position.set(a.x, 0.03, a.z); m.rotation.y = G.TH; m.receiveShadow = true; scene.add(m);
  }
  for (const r of G.ROADS_V) {
    const a = G.toWorld((G.EXT.u0 + G.EXT.u1) / 2, r.c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(G.EXT.u1 - G.EXT.u0, r.w).rotateX(-Math.PI / 2), asphalt);
    m.position.set(a.x, 0.035, a.z); m.rotation.y = G.TH; m.receiveShadow = true; scene.add(m);
  }
}

// ---------- atmosphere presets ----------
const PRESETS = {
  noon: { ar: 'الظهيرة', sunEl: 70, sunAz: 165, sun: '#fff2df', sunI: 3.1, hs: '#c3d5e6', hg: '#b8956a', hi: 0.95, top: '#5b8fca', horizon: '#dcd6c4', bottom: '#c9b08a', glow: '#fff1d0', fog: '#d6cdb9', near: 700, far: 12000, night: 0, exp: 0.9, stars: 0, bloom: 0.08, env: 1.0 },
  maghrib: { ar: 'المغرب', sunEl: 4.5, sunAz: 258, sun: '#ffa65e', sunI: 2.6, hs: '#7d8db2', hg: '#a2774f', hi: 0.75, top: '#2d4d88', horizon: '#f2a25a', bottom: '#8a6a4c', glow: '#ff9545', fog: '#d4956a', near: 500, far: 9500, night: 0.45, exp: 1.05, stars: 0, bloom: 0.38, env: 0.6 },
  night: { ar: 'الليل', sunEl: 38, sunAz: 115, sun: '#9fb4e0', sunI: 0.25, hs: '#1e2840', hg: '#2c2117', hi: 0.28, top: '#030712', horizon: '#2a2232', bottom: '#1a140f', glow: '#5b3a22', fog: '#1f1b22', near: 400, far: 9000, night: 1, exp: 1.1, stars: 1, bloom: 0.62, env: 0.25 },
  haboob: { ar: 'عاصفة رملية', sunEl: 42, sunAz: 205, sun: '#ffc78a', sunI: 0.95, hs: '#d39a5a', hg: '#9a6a3c', hi: 1.15, top: '#b67b44', horizon: '#c98c50', bottom: '#a8733f', glow: '#e0a060', fog: '#c3854b', near: 15, far: 750, night: 0.3, exp: 1.0, stars: 0, bloom: 0.22, env: 0.5, dust: 1 }
};
let preset = PRESETS.maghrib, presetId = 'maghrib';
const sunDir = new THREE.Vector3();
function applyPreset(id) {
  presetId = id; preset = PRESETS[id];
  const el = THREE.MathUtils.degToRad(preset.sunEl), az = THREE.MathUtils.degToRad(preset.sunAz);
  sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.color.set(preset.sun); sun.intensity = preset.sunI;
  hemi.color.set(preset.hs); hemi.groundColor.set(preset.hg); hemi.intensity = preset.hi;
  const su = sky.material.uniforms;
  su.top.value.set(preset.top); su.horizon.value.set(preset.horizon); su.bottom.value.set(preset.bottom);
  su.glow.value.set(preset.glow); su.sunCol.value.set(id === 'night' ? '#e8ecf5' : preset.sun);
  su.sunDir.value.copy(sunDir); su.stars.value = preset.stars; su.sunSize.value = id === 'night' ? 0.99985 : 0.9996;
  scene.fog.color.set(preset.fog); scene.fog.near = preset.near; scene.fog.far = preset.far;
  U.uNight.value = preset.night; U.uDust.value = preset.dust || 0;
  renderer.toneMappingExposure = preset.exp;
  if (bloom) bloom.strength = preset.bloom;
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
  scene.environment = envRT.texture;
  scene.environmentIntensity = preset.env;
  dust.visible = !!preset.dust;
  poolMat.visible = preset.night > 0.05;
  document.querySelectorAll('.time-btn').forEach((b) => b.classList.toggle('active', b.dataset.time === id));
}

// haboob dust
const dust = (() => {
  const n = 5000, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 300; pos[i * 3 + 1] = Math.random() * 120; pos[i * 3 + 2] = (Math.random() - 0.5) * 300; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#d79a5c', size: 0.9, transparent: true, opacity: 0.55, depthWrite: false }));
  p.frustumCulled = false;
  scene.add(p);
  return p;
})();

// ---------- post ----------
let composer = null, bloom = null;
if (!touch) {
  // multisampled HDR target keeps edges clean through the post chain
  const rt = new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.4, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // grade: a touch of contrast and warmth, gentle vignette
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, 1.1);
        c = (c - 0.5) * 1.06 + 0.5;
        vec2 q = vUv - 0.5;
        c *= 1.0 - dot(q, q) * 0.42;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`
  }));
}

// ---------- world ----------
const city = new City(scene);
const traffic = new Traffic(scene);
const player = new Player(scene);
let metro = null;

// pedestrians: a light crowd on the pavements near the player
const peds = (() => {
  const N = 220;
  // two figures with painted parts: a man in thobe and shemagh, a woman in abaya
  const paint = (g, c) => { g = g.index ? g.toNonIndexed() : g; g.deleteAttribute('uv'); const n = g.attributes.position.count, a = new Float32Array(n * 3); const col = new THREE.Color(c); for (let i = 0; i < n; i++) col.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const man = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.19, 0.29, 1.42, 12).translate(0, 0.71, 0), '#ffffff'),
    paint(new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.5, 0.85).translate(0, 1.42, 0), '#ffffff'),
    paint(new THREE.CylinderGeometry(0.055, 0.07, 0.62, 6).translate(0, 1.12, 0.24), '#ffffff'),
    paint(new THREE.CylinderGeometry(0.055, 0.07, 0.62, 6).translate(0, 1.12, -0.24), '#ffffff'),
    paint(new THREE.SphereGeometry(0.11, 10, 8).translate(0.02, 1.64, 0), '#9c7153'),
    paint(new THREE.ConeGeometry(0.2, 0.46, 12, 1, true).translate(-0.02, 1.56, 0), '#c8343a'),
    paint(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.68, 0), '#e9e5e0'),
    paint(new THREE.TorusGeometry(0.115, 0.02, 5, 14).rotateX(Math.PI / 2).translate(0, 1.73, 0), '#151515')
  ]);
  const woman = mergeGeometries([
    paint(new THREE.CylinderGeometry(0.17, 0.34, 1.5, 12).translate(0, 0.75, 0), '#ffffff'),
    paint(new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 0.85).translate(0, 1.48, 0), '#ffffff'),
    paint(new THREE.SphereGeometry(0.115, 10, 8).scale(1, 1.15, 1).translate(0, 1.63, 0), '#ffffff')
  ]);
  const pmat = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true });
  const body = new THREE.InstancedMesh(man, pmat, N);
  const head = new THREE.InstancedMesh(woman, pmat, N);
  body.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  head.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  body.frustumCulled = head.frustumCulled = false;
  body.castShadow = true;
  scene.add(body, head);
  const list = Array.from({ length: N }, () => ({ ok: false }));
  const m = new THREE.Matrix4(), zero = new THREE.Matrix4();
  const white = new THREE.Color('#f3f1ec'), black = new THREE.Color('#15151a'), skin = new THREE.Color('#b98a66'), scarf = new THREE.Color('#d9d2cc');
  function respawn(p, fx, fz) {
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 320;
      const g = G.toGrid(fx + Math.cos(a) * r, fz + Math.sin(a) * r);
      const c = G.cellAt(g.u, g.v);
      if (c.type !== 'block' || !['commercial', 'tower', 'old', 'plaza', 'apt', 'mosque', 'park'].includes(c.info.kind)) continue;
      const rc = c.rect;
      p.rect = { u0: rc.u0 + 1.6, u1: rc.u1 - 1.6, v0: rc.v0 + 1.6, v1: rc.v1 - 1.6 };
      p.per = 2 * (p.rect.u1 - p.rect.u0 + p.rect.v1 - p.rect.v0);
      p.s = Math.random() * p.per; p.dir = Math.random() < 0.5 ? 1 : -1; p.v = 1.0 + Math.random() * 0.6;
      p.abaya = Math.random() < 0.35;
      p.ok = true;
      return;
    }
    p.ok = false;
  }
  function at(p) {
    const r = p.rect, w = r.u1 - r.u0, h = r.v1 - r.v0;
    let s = ((p.s % p.per) + p.per) % p.per;
    if (s < w) return [r.u0 + s, r.v0, 0];
    s -= w; if (s < h) return [r.u1, r.v0 + s, 1];
    s -= h; if (s < w) return [r.u1 - s, r.v1, 2];
    s -= w; return [r.u0, r.v1 - s, 3];
  }
  return {
    update(dt, fx, fz, show) {
      body.visible = head.visible = show;
      if (!show) return;
      list.forEach((p, i) => {
        if (!p.ok || (p.wx - fx) ** 2 + (p.wz - fz) ** 2 > 420 * 420) respawn(p, fx, fz);
        if (!p.ok) { m.makeScale(0, 0, 0); body.setMatrixAt(i, m); head.setMatrixAt(i, m); return; }
        p.s += p.v * p.dir * dt;
        const [u, v, side] = at(p);
        const w = G.toWorld(u, v);
        p.wx = w.x; p.wz = w.z;
        const yaw = G.TH + side * Math.PI / 2 + (p.dir < 0 ? Math.PI : 0);
        m.makeRotationY(yaw); m.setPosition(w.x, 0.22 + Math.abs(Math.sin(p.s * 3.5)) * 0.03, w.z);
        (p.abaya ? head : body).setMatrixAt(i, m);
        zero.makeScale(0, 0, 0); (p.abaya ? body : head).setMatrixAt(i, zero);
        body.setColorAt(i, i % 7 ? white : scarf);
        head.setColorAt(i, black);
      });
      body.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
      body.instanceColor.needsUpdate = head.instanceColor.needsUpdate = true;
    }
  };
})();

// ---------- cameras ----------
const P = G.PLACES;
const at = (k, dx = 0, dz = 0) => new THREE.Vector3(P[k].x + dx, 0, P[k].z + dz);
const SCENIC = [
  { id: 'skybridge', ar: 'من جسر برج المملكة', pos: () => { const v = at('kingdom'); v.y = 316; return v; }, look: () => { const v = at('faisaliah'); v.y = 150; return v; }, drift: 0.02 },
  { id: 'kingdomOrbit', ar: 'حول برج المملكة', orbit: { c: 'kingdom', r: 520, h: 240, ty: 170, s: 0.035 } },
  { id: 'faisaliah', ar: 'كرة الفيصلية', orbit: { c: 'faisaliah', r: 260, h: 210, ty: 200, s: -0.05 } },
  { id: 'kfr', ar: 'طريق الملك فهد', pos: () => { const w = G.toWorld(G.ROAD_KFR.c, -3600); return new THREE.Vector3(w.x, 70, w.z); }, look: () => { const w = G.toWorld(G.ROAD_KFR.c, 1200); return new THREE.Vector3(w.x, 120, w.z); }, drift: 0 },
  { id: 'kafd', ar: 'أفق المركز المالي', orbit: { c: 'kafd', r: 1100, h: 320, ty: 180, s: 0.025 } },
  { id: 'masmak', ar: 'ساحة المصمك', pos: () => at('masmak', -60, 90).setY(14), look: () => at('masmak').setY(10), drift: 0.01 },
  { id: 'diriyah', ar: 'الدرعية ووادي حنيفة', orbit: { c: 'turaif', r: 700, h: 160, ty: 10, s: 0.02 } },
  { id: 'skyline', ar: 'أفق الرياض', pos: () => { const w = G.toWorld(3600, -8200); return new THREE.Vector3(w.x, 420, w.z); }, look: () => at('kingdom').setY(120), drift: 0 }
];
const FOLLOW = [
  { id: 'chase', ar: 'مطاردة' },
  { id: 'pov', ar: 'منظور السائق' },
  { id: 'top', ar: 'علوي' }
];
const CAMS = [...FOLLOW, ...SCENIC, { id: 'drone', ar: 'المخرج الآلي' }];
let camId = 'chase', camT = 0, directorIdx = 0, directorT = 0;
const orbitCtl = { yaw: 0, pitch: 0.18, zoom: 1 };
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function scenicPose(s, t, out, look) {
  if (s.orbit) {
    const o = s.orbit, c = at(o.c), a = t * o.s + 0.8;
    out.set(c.x + Math.cos(a) * o.r, o.h, c.z + Math.sin(a) * o.r);
    look.copy(c).setY(o.ty);
  } else {
    out.copy(s.pos()); look.copy(s.look());
    if (s.drift) { out.x += Math.sin(t * s.drift * 6) * 30; out.z += Math.cos(t * s.drift * 6) * 30; }
  }
}
function updateCamera(dt) {
  camT += dt;
  const p = player.pos;
  const fwd = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  let id = camId;
  if (id === 'drone') {
    directorT += dt;
    if (directorT > 11) { directorT = 0; directorIdx = (directorIdx + 1) % SCENIC.length; }
    id = SCENIC[directorIdx].id;
  }
  const s = SCENIC.find((x) => x.id === id);
  if (s) {
    scenicPose(s, camT, camPos, camLook);
    camera.position.copy(camPos); camera.lookAt(camLook);
    return;
  }
  const h = player.height;
  if (id === 'pov') {
    const eye = player.mode === 'car' ? 1.55 : player.mode === 'heli' ? player.alt + 2.2 : 1.7 + player.alt;
    const fx = player.mode === 'car' ? 0.4 : player.mode === 'heli' ? 1.8 : 0.25;
    camera.position.set(p.x + fwd.x * fx, eye, p.z + fwd.z * fx);
    const yaw = player.yaw + orbitCtl.yaw;
    camera.lookAt(p.x + Math.cos(yaw) * 50, eye - 50 * Math.sin(orbitCtl.pitch - 0.12), p.z - Math.sin(yaw) * 50);
    return;
  }
  let dist, up, look;
  if (id === 'top') { dist = 60 * orbitCtl.zoom; up = 140 * orbitCtl.zoom; look = 0; }
  else {
    dist = (player.mode === 'person' ? 5.5 : player.mode === 'car' ? 11 : 30) * orbitCtl.zoom;
    up = 0; look = player.mode === 'person' ? 1.5 : player.mode === 'car' ? 1.6 : 2.5;
  }
  const yaw = player.yaw + orbitCtl.yaw + Math.PI;
  const pitch = id === 'top' ? 1.1 : orbitCtl.pitch + (player.mode === 'heli' ? 0.12 : 0);
  const base = player.mode === 'heli' ? player.alt : player.mode === 'person' ? player.alt : 0;
  const target = new THREE.Vector3(p.x, base + look, p.z);
  const want = new THREE.Vector3(
    p.x + Math.cos(yaw) * Math.cos(pitch) * dist,
    base + look + Math.sin(pitch) * dist + up,
    p.z - Math.sin(yaw) * Math.cos(pitch) * dist
  );
  want.y = Math.max(want.y, 0.6);
  const k = 1 - Math.exp(-dt * (player.mode === 'car' ? 7 : 5));
  camPos.lerp(want, camPos.distanceTo(want) > 300 ? 1 : k);
  if (player.mode === 'heli') camPos.y += (want.y - camPos.y) * Math.min(1, k * 3);
  camLook.lerp(target, camLook.distanceTo(target) > 300 ? 1 : Math.min(1, k * 1.6));
  camera.position.copy(camPos);
  camera.lookAt(camLook);
}
function setCamera(id) {
  camId = id;
  camT = 0; directorT = 0;
  if (id === 'chase' || id === 'top') orbitCtl.yaw = 0;
  $('hud-active-camera').textContent = CAMS.find((c) => c.id === id).ar;
  document.querySelectorAll('.cam-btn').forEach((b) => b.classList.toggle('active', b.dataset.camera === id));
}

// ---------- input ----------
const keys = {};
const input = { up: false, down: false, left: false, right: false, boost: false, jump: false, descend: false, ax: 0, ay: 0, az: 0 };
const typing = () => document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
addEventListener('keydown', (e) => {
  if (typing()) return;
  keys[e.code] = true;
  const k = e.code;
  if (k === 'Digit1') setMode('person');
  if (k === 'Digit2') setMode('car');
  if (k === 'Digit3') setMode('heli');
  if (k === 'KeyV') { const i = CAMS.findIndex((c) => c.id === camId); setCamera(CAMS[(i + 1) % CAMS.length].id); }
  if (k === 'KeyC') setCamera(camId === 'pov' ? 'chase' : 'pov');
  if (k === 'KeyM') { e.preventDefault(); toggleMap(); }
  if (k === 'KeyH') toggleHud();
  if (k === 'KeyT') { const ids = Object.keys(PRESETS); applyPreset(ids[(ids.indexOf(presetId) + 1) % ids.length]); }
  if (k === 'Escape' && !$('fullmap-modal').hidden) toggleMap(false);
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(k)) e.preventDefault();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function readKeys() {
  input.up = keys.KeyW || keys.ArrowUp; input.down = keys.KeyS || keys.ArrowDown;
  input.left = keys.KeyA || keys.ArrowLeft; input.right = keys.KeyD || keys.ArrowRight;
  input.boost = keys.ShiftLeft || keys.ShiftRight || touchBoost;
  input.jump = keys.Space || touchUp; input.descend = keys.KeyQ || keys.ControlLeft || touchDown;
}
// orbit with the mouse
{
  const el = renderer.domElement;
  let drag = null;
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    orbitCtl.yaw -= (e.clientX - drag.x) * 0.005;
    orbitCtl.pitch = THREE.MathUtils.clamp(orbitCtl.pitch + (e.clientY - drag.y) * 0.004, -0.3, 1.35);
    drag = { x: e.clientX, y: e.clientY };
  });
  el.addEventListener('pointerup', () => { drag = null; });
  el.addEventListener('wheel', (e) => { orbitCtl.zoom = THREE.MathUtils.clamp(orbitCtl.zoom * Math.exp(e.deltaY * 0.001), 0.35, 6); e.preventDefault(); }, { passive: false });
}
// touch: joystick on the left, drag elsewhere to look
let touchUp = false, touchDown = false, touchBoost = false;
if (touch) {
  $('touch-controls').hidden = false;
  const stick = $('touch-stick'), knob = $('touch-stick-knob');
  let sid = null, c0 = null;
  stick.addEventListener('pointerdown', (e) => { sid = e.pointerId; const r = stick.getBoundingClientRect(); c0 = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; stick.setPointerCapture(sid); move(e); });
  const move = (e) => {
    if (e.pointerId !== sid) return;
    let dx = (e.clientX - c0.x) / c0.r, dy = (e.clientY - c0.y) / c0.r;
    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
    input.ax = -dx; input.ay = -dy;
  };
  stick.addEventListener('pointermove', move);
  const end = (e) => { if (e.pointerId !== sid) return; sid = null; input.ax = input.ay = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  const el = renderer.domElement;
  const pts = new Map();
  el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
  el.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d0 = Math.hypot(a.x - b.x, a.y - b.y);
      p.x = e.clientX; p.y = e.clientY;
      const [c, d] = [...pts.values()];
      orbitCtl.zoom = THREE.MathUtils.clamp(orbitCtl.zoom * d0 / Math.max(1, Math.hypot(c.x - d.x, c.y - d.y)), 0.35, 6);
      return;
    }
    orbitCtl.yaw -= (e.clientX - p.x) * 0.006;
    orbitCtl.pitch = THREE.MathUtils.clamp(orbitCtl.pitch + (e.clientY - p.y) * 0.005, -0.3, 1.35);
    p.x = e.clientX; p.y = e.clientY;
  });
  const up = (e) => pts.delete(e.pointerId);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  document.querySelectorAll('.touch-action').forEach((b) => {
    const set = (v) => { const a = b.dataset.touchAction; if (a === 'up') touchUp = v; if (a === 'down') touchDown = v; if (a === 'boost') touchBoost = v; b.setAttribute('aria-pressed', v); };
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); set(true); });
    b.addEventListener('pointerup', () => set(false)); b.addEventListener('pointerleave', () => set(false)); b.addEventListener('pointercancel', () => set(false));
  });
}

// ---------- modes, teleports ----------
const HINTS = {
  person: 'W A S D للمشي · Shift للركض · Space للقفز · اسحب للتدوير',
  car: 'W للتسارع · S للفرملة · A D للتوجيه · Shift تيربو · C منظور السائق',
  heli: 'W A S D للطيران · Space صعود · Q هبوط · Shift سرعة'
};
function setMode(m) {
  player.setMode(m);
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  $('hud-active-mode').textContent = player.modeInfo.label;
  $('hud-controls-hint').textContent = touch ? '' : HINTS[m];
  document.querySelectorAll('.touch-action[data-touch-action="down"]').forEach((b) => (b.hidden = m !== 'heli'));
  const upLabel = document.querySelector('[data-touch-label="up"]'); if (upLabel) upLabel.textContent = m === 'heli' ? 'صعود' : 'قفز';
}
const TELEPORTS = [
  { id: 'kingdom', ar: 'برج المملكة', sub: 'طريق الملك فهد · العليا', u: G.ROAD_KFR.c + 9.5, v: -420, dir: 'v+' },
  { id: 'faisaliah', ar: 'برج الفيصلية', sub: 'طريق الملك فهد · العليا', u: G.ROAD_KFR.c - 9.5, v: -2050, dir: 'v-' },
  { id: 'tahlia', ar: 'شارع التحلية', sub: 'السليمانية', u: 900, v: -1646 - 10, dir: 'u+' },
  { id: 'kafd', ar: 'المركز المالي (كافد)', sub: 'الطريق الدائري الشمالي', u: G.ROAD_KFR.c + 12, v: 6200, dir: 'v+' },
  { id: 'rafal', ar: 'برج رافال', sub: 'طريق الملك فهد · الصحافة', u: G.ROAD_KFR.c + 12, v: 9500, dir: 'v+' },
  { id: 'masmak', ar: 'قصر المصمك', sub: 'الديرة · وسط الرياض', place: 'masmak', off: [-40, 110] },
  { id: 'museum', ar: 'المتحف الوطني', sub: 'المربع', place: 'museum', off: [0, -160] },
  { id: 'turaif', ar: 'حي الطريف', sub: 'الدرعية · وادي حنيفة', place: 'turaif', off: [420, 0] }
];
function teleport(t) {
  if (t.place) { const p = P[t.place]; player.teleport(p.x + t.off[0], p.z + t.off[1]); }
  else {
    const w = G.toWorld(t.u, t.v);
    const yaw = t.dir === 'v+' ? G.TH + Math.PI / 2 : t.dir === 'v-' ? G.TH - Math.PI / 2 : t.dir === 'u+' ? G.TH : G.TH + Math.PI;
    player.teleport(w.x, w.z, yaw);
  }
  camPos.set(player.pos.x, 2000, player.pos.z); // snaps the follow camera
  if (!SCENIC.find((s) => s.id === camId) && camId !== 'drone') setCamera(camId);
}

// ---------- HUD wiring ----------
function buildMenus() {
  const tp = $('teleport-list');
  for (const t of TELEPORTS) {
    const b = document.createElement('button');
    b.className = 'pop-item'; b.type = 'button';
    b.innerHTML = `<span class="pop-name">${t.ar}</span><span class="pop-sub">${t.sub}</span>`;
    b.onclick = () => { teleport(t); $('teleport-popover').hidePopover?.(); };
    tp.appendChild(b);
  }
  const cl = $('camera-list');
  const addGroup = (title, items) => {
    const h = document.createElement('div'); h.className = 'pop-title'; h.textContent = title; cl.appendChild(h);
    for (const c of items) {
      const b = document.createElement('button');
      b.className = 'pop-item cam-btn'; b.type = 'button'; b.dataset.camera = c.id;
      b.innerHTML = `<span class="pop-name">${c.ar}</span>`;
      b.onclick = () => { setCamera(c.id); $('camera-popover').hidePopover?.(); };
      cl.appendChild(b);
    }
  };
  addGroup('متابعة', FOLLOW);
  addGroup('مشاهد', [...SCENIC, { id: 'drone', ar: 'المخرج الآلي' }]);
  document.querySelectorAll('.time-btn').forEach((b) => (b.onclick = () => applyPreset(b.dataset.time)));
  document.querySelectorAll('.mode-btn').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  $('cam-prev').onclick = () => { const i = CAMS.findIndex((c) => c.id === camId); setCamera(CAMS[(i - 1 + CAMS.length) % CAMS.length].id); };
  $('cam-next').onclick = () => { const i = CAMS.findIndex((c) => c.id === camId); setCamera(CAMS[(i + 1) % CAMS.length].id); };
  $('btn-open-map').onclick = () => toggleMap(true);
  $('minimap-card').onclick = () => toggleMap(true);
  $('fullmap-close').onclick = () => toggleMap(false);
  $('btn-toggle-hud').onclick = toggleHud;
}
function toggleHud() {
  const hidden = document.body.classList.toggle('hud-hidden');
  $('btn-toggle-hud').setAttribute('aria-pressed', hidden);
}

// ---------- minimap ----------
const mm = $('minimap-canvas'), mctx = mm.getContext('2d');
const ROAD_COL = { freeway: '#e9c46a', major: '#f4efe6', minor: '#cfc6b6' };
function drawRoadsOn(ctx, toScreen, scale, x0, z0, x1, z1) {
  // arterials: grid lines clipped to the extent
  for (const [list, axis] of [[G.ROADS_U, 'u'], [G.ROADS_V, 'v']]) for (const r of list) {
    const a = axis === 'u' ? G.toWorld(r.c, G.EXT.v0) : G.toWorld(G.EXT.u0, r.c);
    const b = axis === 'u' ? G.toWorld(r.c, G.EXT.v1) : G.toWorld(G.EXT.u1, r.c);
    const A = toScreen(a.x, a.z), B = toScreen(b.x, b.z);
    ctx.strokeStyle = ROAD_COL[r.kind];
    ctx.lineWidth = Math.max(r.kind === 'freeway' ? 2.6 : 1.6, r.w * scale);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
  }
}
const KIND_FILL = { villa: '#3b3833', apt: '#454039', commercial: '#4c4538', tower: '#4f5761', old: '#5a4632', mosque: '#3f5a46', park: '#3d5a2c', plaza: '#57524a', vacant: '#4a3f30', wadi: '#3a4a26' };
function drawBlocks(ctx, toScreen, cx, cz, R) {
  const g = G.toGrid(cx, cz);
  G.blocksIn(g.u - R, g.u + R, g.v - R, g.v + R, (sb, ku, kv, r, info) => {
    const f = KIND_FILL[info.kind]; if (!f) return;
    const c = [G.toWorld(r.u0, r.v0), G.toWorld(r.u1, r.v0), G.toWorld(r.u1, r.v1), G.toWorld(r.u0, r.v1)].map((w) => toScreen(w.x, w.z));
    ctx.fillStyle = f;
    ctx.beginPath(); ctx.moveTo(c[0][0], c[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(c[i][0], c[i][1]); ctx.closePath(); ctx.fill();
  });
}
function drawWadi(ctx, toScreen, scale) {
  ctx.strokeStyle = 'rgba(92,120,60,0.85)'; ctx.lineWidth = Math.max(3, 460 * scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); G.WADI.forEach((w, i) => { const s = toScreen(w.x, w.z); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke();
  ctx.lineCap = 'butt';
}
let mmTimer = 0;
function drawMinimap() {
  const dpr = Math.min(2, devicePixelRatio);
  const size = mm.clientWidth;
  if (mm.width !== size * dpr) { mm.width = mm.height = size * dpr; }
  const ctx = mctx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#2a2622'; ctx.fillRect(0, 0, size, size);
  const R = player.mode === 'heli' ? 1400 : 520;
  const scale = (size / 2) / R;
  const p = player.pos;
  const rot = player.yaw - Math.PI / 2; // heading up
  const toScreen = (x, z) => {
    const dx = x - p.x, dz = z - p.z;
    const c = Math.cos(rot), s = Math.sin(rot);
    return [size / 2 + (dx * c - dz * s) * scale, size / 2 + (dx * s + dz * c) * scale];
  };
  drawBlocks(ctx, toScreen, p.x, p.z, R * 1.2);
  drawWadi(ctx, toScreen, scale);
  drawRoadsOn(ctx, toScreen, scale);
  for (const [k, pl] of Object.entries(P)) {
    const s = toScreen(pl.x, pl.z);
    if (s[0] < -10 || s[0] > size + 10 || s[1] < -10 || s[1] > size + 10) continue;
    ctx.fillStyle = '#1f9d63'; ctx.beginPath(); ctx.arc(s[0], s[1], 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save(); ctx.translate(size / 2, size / 2);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#0d5ea8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  $('radar-north').style.transform = `rotate(${(-rot) * 180 / Math.PI}deg) translateY(-${size / 2 - 12}px) rotate(${rot * 180 / Math.PI}deg)`;
}

// ---------- the full street atlas ----------
const fm = $('fullmap-canvas'), fctx = fm.getContext('2d');
const view = { x: 0, z: 0, s: 0.06 }; // pixels per metre
function toggleMap(open) {
  const modal = $('fullmap-modal');
  const show = open === undefined ? modal.hidden : open;
  modal.hidden = !show;
  if (show) { view.x = player.pos.x; view.z = player.pos.z; view.s = 0.06; drawAtlas(); if (!touch) setTimeout(() => $('fullmap-search').focus({ preventScroll: true }), 0); }
}
function drawAtlas() {
  const dpr = Math.min(2, devicePixelRatio);
  const W = fm.clientWidth, H = fm.clientHeight;
  if (fm.width !== W * dpr || fm.height !== H * dpr) { fm.width = W * dpr; fm.height = H * dpr; }
  const ctx = fctx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#c9b38e'; ctx.fillRect(0, 0, W, H);
  const toScreen = (x, z) => [W / 2 + (x - view.x) * view.s, H / 2 + (z - view.z) * view.s];
  const mw = G.MASK_WORLD; const a = toScreen(mw.x0, mw.z0), b = toScreen(mw.x1, mw.z1);
  ctx.fillStyle = '#3a3631'; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  if (view.s > 0.12) drawBlocks(ctx, toScreen, view.x, view.z, Math.max(W, H) / view.s * 0.75);
  drawWadi(ctx, toScreen, view.s);
  drawRoadsOn(ctx, toScreen, view.s);
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  if (view.s > 0.035) {
    ctx.font = '500 12px "IBM Plex Sans Arabic", sans-serif';
    for (const d of G.DISTRICTS) { const s = toScreen(d.x, d.z); ctx.fillStyle = 'rgba(255,248,235,0.55)'; ctx.fillText(d.ar, s[0], s[1]); }
  }
  ctx.font = '600 13px "IBM Plex Sans Arabic", sans-serif';
  for (const pl of Object.values(P)) {
    const s = toScreen(pl.x, pl.z);
    ctx.fillStyle = '#1f9d63'; ctx.beginPath(); ctx.arc(s[0], s[1], 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(20,16,12,0.85)'; ctx.lineWidth = 3.5;
    ctx.strokeText(pl.ar, s[0], s[1] - 10); ctx.fillText(pl.ar, s[0], s[1] - 10);
  }
  if (view.s > 0.09) {
    ctx.font = '600 11px "IBM Plex Sans Arabic", sans-serif'; ctx.fillStyle = '#20180e';
    for (const r of G.ROADS_U) { const w = G.toWorld(r.c, G.toGrid(view.x, view.z).v + 200 / view.s); const s = toScreen(w.x, w.z); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(-Math.PI / 2 + G.TH); ctx.fillText(r.ar, 0, 4); ctx.restore(); }
    for (const r of G.ROADS_V) { const w = G.toWorld(G.toGrid(view.x, view.z).u - 260 / view.s, r.c); const s = toScreen(w.x, w.z); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(G.TH); ctx.fillText(r.ar, 0, 4); ctx.restore(); }
  }
  // player
  const s = toScreen(player.pos.x, player.pos.z);
  ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(-player.yaw + Math.PI / 2);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0d5ea8'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 9); ctx.lineTo(0, 4); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (pin) { const q = toScreen(pin.x, pin.z); ctx.fillStyle = '#c0242b'; ctx.beginPath(); ctx.arc(q[0], q[1], 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
  const ll = G.toLatLon(view.x, view.z);
  $('fullmap-coords').textContent = `${ll.lat.toFixed(4)}° N · ${ll.lon.toFixed(4)}° E · ${(1 / view.s).toFixed(1)} م/بكسل`;
}
let pin = null;
{
  let drag = null, moved = 0;
  fm.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; moved = 0; fm.setPointerCapture(e.pointerId); });
  fm.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy);
    view.x -= dx / view.s; view.z -= dy / view.s; drag = { x: e.clientX, y: e.clientY }; drawAtlas();
  });
  fm.addEventListener('pointerup', (e) => {
    if (drag && moved < 6) {
      const r = fm.getBoundingClientRect();
      pin = { x: view.x + (e.clientX - r.left - r.width / 2) / view.s, z: view.z + (e.clientY - r.top - r.height / 2) / view.s };
      const d = G.districtAt(pin.x, pin.z), rd = G.roadAt(pin.x, pin.z);
      $('fullmap-pin-label').textContent = (rd ? rd.ar + ' · ' : '') + d.ar;
      $('fullmap-go').disabled = false;
      drawAtlas();
    }
    drag = null;
  });
  fm.addEventListener('wheel', (e) => {
    const r = fm.getBoundingClientRect();
    const mx = (e.clientX - r.left - r.width / 2) / view.s + view.x, mz = (e.clientY - r.top - r.height / 2) / view.s + view.z;
    view.s = THREE.MathUtils.clamp(view.s * Math.exp(-e.deltaY * 0.0015), 0.012, 1.6);
    view.x = mx - (e.clientX - r.left - r.width / 2) / view.s; view.z = mz - (e.clientY - r.top - r.height / 2) / view.s;
    drawAtlas(); e.preventDefault();
  }, { passive: false });
  $('fullmap-zoom-in').onclick = () => { view.s = Math.min(1.6, view.s * 1.5); drawAtlas(); };
  $('fullmap-zoom-out').onclick = () => { view.s = Math.max(0.012, view.s / 1.5); drawAtlas(); };
  $('fullmap-locate').onclick = () => { view.x = player.pos.x; view.z = player.pos.z; drawAtlas(); };
  $('fullmap-go').onclick = () => { if (!pin) return; player.teleport(pin.x, pin.z); camPos.set(pin.x, 2000, pin.z); toggleMap(false); };
  const search = $('fullmap-search'), results = $('fullmap-results');
  const entries = [
    ...Object.values(P).map((p) => ({ ar: p.ar, en: p.en, x: p.x, z: p.z, kind: 'معلم' })),
    ...G.DISTRICTS.map((d) => ({ ar: 'حي ' + d.ar, en: d.en, x: d.x, z: d.z, kind: 'حي' })),
    ...G.ROADS_U.map((r) => { const w = G.toWorld(r.c, G.toGrid(0, 0).v); return { ar: r.ar, en: r.name, x: w.x, z: w.z, kind: 'طريق' }; }),
    ...G.ROADS_V.map((r) => { const w = G.toWorld(G.toGrid(0, 0).u, r.c); return { ar: r.ar, en: r.name, x: w.x, z: w.z, kind: 'طريق' }; })
  ];
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;
    for (const e of entries.filter((e) => e.ar.includes(q) || e.en.toLowerCase().includes(q)).slice(0, 7)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pop-item';
      b.innerHTML = `<span class="pop-name">${e.ar}</span><span class="pop-sub">${e.kind} · ${e.en}</span>`;
      b.onclick = () => { view.x = e.x; view.z = e.z; view.s = Math.max(view.s, 0.15); pin = { x: e.x, z: e.z }; $('fullmap-pin-label').textContent = e.ar; $('fullmap-go').disabled = false; results.innerHTML = ''; drawAtlas(); };
      results.appendChild(b);
    }
  });
}

// ---------- HUD readouts ----------
const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
let hudTimer = 0, lastLoc = '';
function updateHud(dt, fps) {
  hudTimer -= dt;
  if (hudTimer > 0) return;
  hudTimer = 0.2;
  const kmh = Math.round(Math.abs(player.speed) * 3.6);
  $('hud-speed').textContent = toArabicDigits(kmh);
  $('hud-speed-meter').style.width = Math.min(100, kmh / (player.mode === 'heli' ? 340 : player.mode === 'car' ? 190 : 30) * 100) + '%';
  $('hud-altitude').textContent = toArabicDigits(Math.round(player.mode === 'heli' ? player.alt : 612));
  $('hud-alt-label').textContent = player.mode === 'heli' ? 'الارتفاع' : 'فوق سطح البحر';
  const d = G.districtAt(player.pos.x, player.pos.z);
  const r = G.roadAt(player.pos.x, player.pos.z);
  const key = (r ? r.name : '') + d.en;
  if (key !== lastLoc) {
    lastLoc = key;
    $('sign-ar').textContent = r ? r.ar : 'حي ' + d.ar;
    $('sign-en').textContent = r ? r.name : d.en;
    $('sign-district').textContent = r ? 'حي ' + d.ar : 'الرياض';
  }
  $('hud-fps').textContent = toArabicDigits(Math.round(fps));
  $('hud-fps').className = fps > 45 ? 'fps-ok' : fps > 28 ? 'fps-mid' : 'fps-low';
  const ll = G.toLatLon(player.pos.x, player.pos.z);
  $('hud-coords').textContent = `${ll.lat.toFixed(4)}°N ${ll.lon.toFixed(4)}°E`;
}

// ---------- main loop ----------
const clock = new THREE.Clock();
let fpsAvg = 60, slowT = 0, detailR = touch ? 1500 : 2200;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  fpsAvg += (1 / Math.max(dt, 1e-3) - fpsAvg) * 0.05;
  U.uTime.value += dt;
  readKeys();
  player.update(dt, input, traffic);
  updateCamera(dt);
  const scenic = !!SCENIC.find((s) => s.id === camId || (camId === 'drone' && SCENIC[directorIdx].id === s.id));
  const focus = scenic ? camera.position : player.pos;
  const R = scenic ? detailR : player.mode === 'heli' ? Math.min(3000, detailR + player.alt) : detailR;
  city.update({ x: focus.x, z: focus.z }, R, 14000, 5);
  traffic.update(dt, focus, player.mode === 'car' ? player.pos : null);
  peds.update(dt, focus.x, focus.z, !scenic || camPos.y < 60);
  metro?.update(dt);
  // shadow camera follows what we are looking at
  const sc = new THREE.Vector3(camLook.x, 0, camLook.z);
  sun.target.position.copy(sc);
  sun.position.copy(sc).addScaledVector(sunDir, 1200);
  const sh = player.mode === 'heli' && !scenic ? Math.min(900, 260 + player.alt) : scenic ? 700 : 260;
  if (sun.shadow.camera.right !== sh) { Object.assign(sun.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh }); sun.shadow.camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
  if (dust.visible) {
    dust.position.set(camera.position.x, Math.max(0, camera.position.y - 40), camera.position.z);
    dust.rotation.y += dt * 0.15;
  }
  // headlights in the dark
  player.models.car.userData.spot.intensity = player.mode === 'car' ? U.uNight.value * 260 : 0;
  if (composer) composer.render(); else renderer.render(scene, camera);
  mmTimer -= dt;
  if (mmTimer <= 0 && !document.body.classList.contains('hud-hidden')) { mmTimer = 0.1; drawMinimap(); }
  if (!$('fullmap-modal').hidden) drawAtlas();
  updateHud(dt, fpsAvg);
  // adaptive detail
  if (fpsAvg < 26) { slowT += dt; if (slowT > 4 && detailR > 1200) { detailR -= 300; slowT = 0; } } else slowT = 0;
  requestAnimationFrame(frame);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer?.setSize(innerWidth, innerHeight);
});

// ---------- boot ----------
async function boot() {
  try {
    status('تجهيز الأجواء والسماء…', 0.05);
    applyPreset('maghrib');
    await nextFrame();
    status('بناء المعالم: برج المملكة، الفيصلية، المصمك…', 0.15);
    buildLandmarks(scene);
    metro = buildMetro(scene);
    await nextFrame();
    buildMenus();
    setMode('car');
    teleport(TELEPORTS[0]);
    setCamera('chase');
    updateCamera(1);
    // stream the first rings of the city before showing it
    for (let i = 0; i < 400; i++) {
      const left = city.update(player.pos, detailR, 14000, 40);
      status(`بناء الأحياء والشوارع… ${toArabicDigits(city.stats.detail + city.stats.coarse)} قطعة`, 0.2 + 0.75 * Math.min(1, i / Math.max(1, i + left)));
      await nextFrame();
      if (left === 0) break;
    }
    traffic.update(0.016, player.pos, null);
    status('جاهز', 1);
    renderer.compile(scene, camera);
    $('loading-overlay').classList.add('done');
    setTimeout(() => $('loading-overlay').remove(), 700);
    clock.getDelta();
    frame();
  } catch (err) {
    console.error(err);
    status('تعذّر تشغيل المشهد: ' + err.message + ' — يحتاج المتصفح إلى دعم WebGL2.');
    $('loading-overlay').classList.add('error');
  }
}
boot();
window.__riyadh = { scene, camera, player, city, traffic, applyPreset, setCamera, setMode, teleport: (i) => teleport(TELEPORTS[i]), renderer };
