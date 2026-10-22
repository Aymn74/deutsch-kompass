// materials.js — procedural facade shader for every instanced box, plus ground, sky and vegetation.
import * as THREE from 'three';
import { MASK_WORLD } from './geo.js';

// Shared, animated uniforms
export const U = {
  uNight: { value: 0 },
  uTime: { value: 0 },
  uFocus: { value: new THREE.Vector2() },
  uDetailR: { value: 2200 },
  uDust: { value: 0 }
};

// Box styles (instance attribute aStyle)
export const ST = {
  villa: 0, wall: 1, shop: 2, apt: 3, glass: 4, stone: 5, mud: 6, slab: 7, plain: 8, mosque: 9,
  lamp: 10, green: 11, paint: 12, median: 13, led: 14, sign: 15
};

const HEAD = /* glsl */`
uniform float uNight; uniform float uTime; uniform vec2 uFocus; uniform float uDetailR; uniform float uDust;
varying vec3 vWP; varying vec3 vWN; varying float vStyle; varying float vSeed;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
`;

export function makeBuildingMaterial({ coarse = false, always = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, metalness: 0.0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aStyle; attribute float aSeed;
${HEAD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  float dFocus = distance(instanceMatrix[3].xz, uFocus);
  ${always ? '' : coarse ? 'if (dFocus < uDetailR) transformed = vec3(0.0);' : 'if (dFocus >= uDetailR) transformed = vec3(0.0);'}
#endif`)
      .replace('#include <project_vertex>', `#include <project_vertex>
  vec4 rwp = vec4(transformed, 1.0);
  vec3 rn = objectNormal;
#ifdef USE_INSTANCING
  rwp = instanceMatrix * rwp; rn = mat3(instanceMatrix) * rn;
#endif
  rwp = modelMatrix * rwp;
  vWP = rwp.xyz; vWN = normalize(mat3(modelMatrix) * rn);
  vStyle = aStyle; vSeed = aSeed;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
${HEAD}
float gGlass; vec3 gEmis;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  gGlass = 0.0; gEmis = vec3(0.0);
  {
  float st = floor(vStyle + 0.5);
  vec3 n = normalize(vWN);
  bool side = abs(n.y) < 0.5;
  vec2 tg = normalize(vec2(-n.z, n.x));
  float t = dot(vWP.xz, tg);
  float y = vWP.y;
  vec3 warm = vec3(1.0, 0.72, 0.42);
  if (st == 10.0) { gEmis = vec3(1.0, 0.86, 0.62) * 4.0 * uNight; diffuseColor.rgb = vec3(0.9); }
  else if (st == 11.0) { gEmis = vec3(0.15, 1.0, 0.35) * 3.0 * uNight; diffuseColor.rgb = vec3(0.6, 0.9, 0.7); }
  else if (st == 14.0) {
    vec3 led = 0.5 + 0.5 * cos(6.2831 * (uTime * 0.05 + vSeed + vec3(0.0, 0.33, 0.67)));
    gEmis = led * (0.02 + 2.2 * uNight); diffuseColor.rgb = mix(vec3(0.85), led, uNight);
  }
  else if (st == 15.0) { gEmis = diffuseColor.rgb * (0.25 + 2.4 * uNight); }
  else if (st == 12.0) { diffuseColor.rgb *= 1.0; gEmis = diffuseColor.rgb * 0.05; }
  else if (st == 7.0 || st == 13.0 || st == 1.0 && !side) {
    // paving, medians, courtyard tops: subtle tile grain
    float g = h21(floor(vWP.xz * 0.9));
    diffuseColor.rgb *= 0.93 + 0.1 * g;
  }
  else if (side && st != 1.0 && st != 8.0) {
    float fh = 3.5, cw = 3.2, wx = 0.42, wy = 0.45, lit = 0.3;
    if (st == 0.0) { fh = 3.7; cw = 3.6; wx = 0.34; wy = 0.42; lit = 0.32; }
    else if (st == 2.0) { fh = 4.0; cw = 2.8; wx = 0.5; wy = 0.46; lit = 0.6; }
    else if (st == 3.0) { fh = 3.2; cw = 3.0; wx = 0.4; wy = 0.48; lit = 0.36; }
    else if (st == 5.0) { fh = 3.7; cw = 2.4; wx = 0.55; wy = 0.6; lit = 0.4; }
    else if (st == 6.0) { fh = 3.1; cw = 2.6; wx = 0.18; wy = 0.22; lit = 0.35; }
    else if (st == 9.0) { fh = 9.0; cw = 4.2; wx = 0.32; wy = 0.55; lit = 0.8; }
    if (st == 4.0) {
      // curtain wall: tinted glass, thin mullions, floor spandrels
      vec2 c = vec2(t / 1.6, y / 3.9);
      vec2 f = fract(c); vec2 id = floor(c);
      float aaG = clamp(1.6 - 2.2 * max(fwidth(c.x), fwidth(c.y)), 0.0, 1.0);
      float mull = mix(0.2, step(0.93, f.x) + step(0.86, f.y), aaG);
      vec3 glassCol = diffuseColor.rgb * 0.55 + vec3(0.02, 0.05, 0.07);
      diffuseColor.rgb = mix(glassCol, diffuseColor.rgb * 1.15 + 0.1, clamp(mull, 0.0, 1.0));
      gGlass = 1.0 - clamp(mull, 0.0, 1.0) * 0.7;
      float floorLit = step(h21(vec2(floor(id.x / 6.0), id.y) + vSeed * 31.0), 0.4);
      vec3 tint = mix(vec3(1.0, 0.82, 0.6), vec3(0.75, 0.85, 1.0), h21(id.yy + vSeed));
      gEmis = tint * floorLit * (0.35 + 0.4 * h21(id + vSeed)) * (1.0 - clamp(mull, 0.0, 1.0)) * uNight * 0.42;
    } else {
      vec2 c = vec2(t / cw, (y - 0.3) / fh);
      vec2 f = fract(c); vec2 id = floor(c);
      float win = step(abs(f.x - 0.5), wx * 0.5) * step(abs(f.y - 0.52), wy * 0.5);
      // fade the window grid to its average when cells get smaller than a few pixels
      float aa = clamp(1.4 - 1.6 * max(fwidth(c.x), fwidth(c.y)), 0.0, 1.0);
      win = mix(wx * wy * 0.8, win, aa);
      if (st == 0.0 && y < 3.4) win = 0.0;           // compound wall hides the ground floor
      if (st == 9.0) { win *= step(f.y, 0.52 + wy * 0.5 - 0.08 * (1.0 - pow(abs(f.x - 0.5) / (wx * 0.5), 2.0))); }
      float rnd = h21(id + vSeed * 17.0);
      vec3 glassCol = mix(vec3(0.16, 0.2, 0.24), vec3(0.35, 0.42, 0.46), rnd);
      if (st == 6.0) glassCol = vec3(0.12, 0.09, 0.07);
      if (st == 2.0 && y < 4.6) {
        // shopfronts and the sign band above them
        float shop = step(y, 3.3);
        float band = step(3.5, y) * step(y, 4.5);
        float bay = floor(t / 7.0);
        vec3 sc = 0.55 + 0.45 * cos(6.2831 * (h21(vec2(bay, vSeed)) + vec3(0.0, 0.33, 0.67)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.22, 0.25), shop * step(0.06, fract(t / 7.0)));
        diffuseColor.rgb = mix(diffuseColor.rgb, sc, band * step(0.08, fract(t / 7.0)) * step(fract(t / 7.0), 0.92));
        gEmis += shop * warm * 0.9 * uNight * step(0.06, fract(t / 7.0));
        gEmis += band * sc * (0.15 + 2.2 * uNight) * step(0.08, fract(t / 7.0)) * step(fract(t / 7.0), 0.92);
        gGlass = shop * 0.6;
        win = 0.0;
      }
      diffuseColor.rgb = mix(diffuseColor.rgb, glassCol, win);
      gGlass = max(gGlass, win * 0.55);
      float on = step(rnd, lit) * win;
      gEmis += on * mix(warm, vec3(0.9, 0.95, 1.0), step(0.7, h21(id.yx + vSeed))) * (0.3 + 0.35 * rnd) * uNight;
    }
    diffuseColor.rgb *= 0.72 + 0.28 * smoothstep(0.0, 7.0, y);
  } else if (!side) {
    diffuseColor.rgb *= 0.9;
  }
  }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
  metalnessFactor = mix(metalnessFactor, 0.85, gGlass);
  roughnessFactor = mix(roughnessFactor, 0.12, gGlass);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += gEmis;`);
  };
  m.customProgramCacheKey = () => 'bld' + (always ? 'A' : coarse ? 'C' : 'D');
  return m;
}

// Plain lit material that glows at night (for landmarks)
export function nightGlow(color, dayI = 0, nightI = 2.5, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.4, ...opts });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uNight; uniform float uTime;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * (${dayI.toFixed(2)} + ${nightI.toFixed(2)} * uNight);`);
  };
  m.customProgramCacheKey = () => 'glow' + dayI + nightI;
  return m;
}

// ---------- ground: sun-bleached asphalt inside the city, sand and gravel outside ----------
export function makeGroundMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.97 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, { uMask: { value: new THREE.Vector4(MASK_WORLD.x0, MASK_WORLD.z0, MASK_WORLD.x1, MASK_WORLD.z1) } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGP; uniform vec4 uMask;
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5), b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5),
        c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5), d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 p = vGP.xz;
    float inside = step(uMask.x, p.x) * step(p.x, uMask.z) * step(uMask.y, p.y) * step(p.y, uMask.w);
    float grain = n2(p * 0.35) * 0.5 + n2(p * 2.1) * 0.5;
    vec3 asphalt = mix(vec3(0.30, 0.295, 0.29), vec3(0.37, 0.355, 0.34), grain);
    float dune = n2(p * 0.0021) * 0.6 + n2(p * 0.011) * 0.3 + n2(p * 0.09) * 0.1;
    vec3 sand = mix(vec3(0.74, 0.60, 0.42), vec3(0.86, 0.72, 0.52), dune);
    sand = mix(sand, vec3(0.62, 0.52, 0.40), smoothstep(0.62, 0.8, n2(p * 0.004 + 9.0)) * 0.6);
    diffuseColor.rgb = mix(sand, asphalt, inside);
  }`);
  };
  return m;
}

// ---------- sky dome ----------
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0.9995 },
      glow: { value: new THREE.Color() }, stars: { value: 0 }, uTime: U.uTime
    },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top, horizon, bottom, sunCol, glow; uniform vec3 sunDir; uniform float sunSize, stars, uTime; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        vec3 d = normalize(vD);
        float e = d.y;
        vec3 c = e > 0.0 ? mix(horizon, top, pow(clamp(e,0.0,1.0), 0.55)) : mix(horizon, bottom, clamp(-e*6.0,0.0,1.0));
        float s = dot(d, normalize(sunDir));
        c += glow * pow(max(s,0.0), 6.0) * 0.6 + glow * exp(-abs(e)*9.0) * 0.25;
        c += sunCol * smoothstep(sunSize, sunSize + 0.0003, s) * 6.0;
        c += sunCol * pow(max(s,0.0), 300.0) * 1.2;
        if (stars > 0.0 && e > 0.02) { vec3 q = floor(d * 420.0); float r = h(q); c += vec3(step(0.9975, r) * stars * (0.6 + 0.4*sin(uTime*2.0 + r*90.0))); }
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  mesh.scale.setScalar(30000);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

// ---------- vegetation ----------
// Date palm with unit height: trunk to y=0.88, a drooping crown of fronds around y=0.9
export function palmGeometries() {
  const trunk = new THREE.CylinderGeometry(0.022, 0.034, 0.9, 7, 6);
  trunk.translate(0, 0.45, 0);
  // ring bumps on the trunk
  const pa = trunk.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const y = pa.getY(i), k = 1 + 0.12 * Math.abs(Math.sin(y * 70));
    pa.setX(i, pa.getX(i) * k); pa.setZ(i, pa.getZ(i) * k);
  }
  trunk.computeVertexNormals();
  const pos = [], nor = [], idx = [];
  const fronds = 14;
  for (let f = 0; f < fronds; f++) {
    const a = (f / fronds) * Math.PI * 2 + (f % 2) * 0.2;
    const lift = f % 2 ? 0.55 : 0.25;
    const len = 0.42 + (f % 3) * 0.04;
    const seg = 6, base = pos.length / 3;
    for (let s = 0; s <= seg; s++) {
      const t = s / seg;
      const r = t * len;
      const y = 0.9 + Math.sin(t * Math.PI * 0.9) * 0.12 * lift * 2 - t * t * 0.22;
      const w = 0.07 * Math.sin(Math.min(1, t * 1.15) * Math.PI) + 0.006;
      const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
      const px = -Math.sin(a) * w, pz = Math.cos(a) * w;
      pos.push(cx - px, y, cz - pz, cx + px, y - w * 0.4, cz + pz);
      nor.push(0, 1, 0, 0, 1, 0);
      if (s < seg) { const b = base + s * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
  }
  const crown = new THREE.BufferGeometry();
  crown.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  crown.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  crown.setIndex(idx);
  crown.computeVertexNormals();
  return { trunk, crown };
}
export const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5f45, roughness: 0.95 });
export const palmCrownMat = new THREE.MeshStandardMaterial({ color: 0x4f6a2c, roughness: 0.8, side: THREE.DoubleSide });
