export const MAX_CARDS = 3;

export const VERTEX_SOURCE = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export function fragmentSource(manualBilinear) {
  return `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uHeight;
uniform vec2 uGridSize;
uniform vec2 uGridOrigin;
uniform float uCellPx;
uniform vec2 uViewport;
uniform vec4 uCards[${MAX_CARDS}];
uniform float uCardLift[${MAX_CARDS}];
uniform int uCardCount;

out vec4 outColor;

const vec3 DEEP = vec3(0.553, 0.424, 0.278);
const vec3 SHADOW = vec3(0.722, 0.584, 0.416);
const vec3 MID = vec3(0.831, 0.722, 0.588);
const vec3 BASE = vec3(0.961, 0.902, 0.784);
const vec3 HIGHLIGHT = vec3(1.0, 0.894, 0.639);
const vec3 LIGHT = vec3(-0.689, -0.555, 0.466);

float heightAt(vec2 cell) {
${
    manualBilinear
      ? `  vec2 p = clamp(cell - 0.5, vec2(0.0), uGridSize - 1.001);
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  float a = texelFetch(uHeight, i, 0).r;
  float b = texelFetch(uHeight, i + ivec2(1, 0), 0).r;
  float c = texelFetch(uHeight, i + ivec2(0, 1), 0).r;
  float d = texelFetch(uHeight, i + ivec2(1, 1), 0).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);`
      : `  return texture(uHeight, cell / uGridSize).r;`
  }
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float tone(vec2 planePx) {
  vec2 cell = (planePx - uGridOrigin) / uCellPx;
  float h = heightAt(cell);
  float hx = heightAt(cell + vec2(1.0, 0.0)) - heightAt(cell - vec2(1.0, 0.0));
  float hy = heightAt(cell + vec2(0.0, 1.0)) - heightAt(cell - vec2(0.0, 1.0));
  vec3 n = normalize(vec3(-hx * 0.5, -hy * 0.5, 1.0));
  float lit = max(dot(n, LIGHT), 0.0) / LIGHT.z;

  vec2 toLight = normalize(LIGHT.xy);
  float tanElevation = LIGHT.z / length(LIGHT.xy);
  float visibility = 1.0;
  float dist = 0.0;
  for (int i = 1; i <= 14; i++) {
    dist += 0.6 + float(i) * 0.3;
    float occluder = heightAt(cell + toLight * dist);
    visibility = min(visibility, clamp(5.0 * (h + dist * tanElevation - occluder) / dist, 0.0, 1.0));
  }

  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    vec2 d = vec2(cos(a), sin(a));
    ring += heightAt(cell + d * 3.0) + heightAt(cell + d * 7.0);
  }
  float cavity = clamp((ring / 16.0 - h) * 0.09, -0.06, 0.22);

  float cardShade = 1.0;
  vec2 shadowDir = -toLight;
  for (int i = 0; i < ${MAX_CARDS}; i++) {
    if (i >= uCardCount) break;
    vec4 card = uCards[i];
    float lift = uCardLift[i];
    float d = sdBox(planePx - (card.xy + shadowDir * lift * 1.6), card.zw);
    float softness = 1.5 + lift * 0.9;
    cardShade = min(cardShade, mix(0.35, 1.0, smoothstep(-softness, softness, d)));
    float contact = sdBox(planePx - card.xy, card.zw);
    cardShade = min(cardShade, mix(0.7, 1.0, smoothstep(0.0, 5.0, contact)));
  }

  float mottle = (valueNoise(planePx / 140.0) - 0.5) * 0.06 + (valueNoise(planePx / 33.0) - 0.5) * 0.03;
  float t = 0.2 + 0.52 * lit * mix(0.25, 1.0, visibility);
  t = t - cavity + mottle;
  return clamp(t * cardShade, 0.0, 1.0);
}

vec3 ramp5(int index) {
  if (index <= 0) return DEEP;
  if (index == 1) return SHADOW;
  if (index == 2) return MID;
  if (index == 3) return BASE;
  return HIGHLIGHT;
}

float interleavedGradient(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 grain = vec2(floor(gl_FragCoord.x), floor(uViewport.y - gl_FragCoord.y));
  float t = tone(grain + 0.5);
  float threshold = interleavedGradient(grain);
  int index = int(floor(t * 4.0 + threshold - 0.25));
  float speck = hash12(grain * 1.37 + 11.0);
  if (speck < 0.022) index -= 2;
  else if (speck > 0.985) index += 1;
  vec3 color = ramp5(clamp(index, 0, 4));
  color *= 1.0 + (hash12(grain + 3.1) - 0.5) * 0.05;
  outColor = vec4(color, 1.0);
}`;
}
