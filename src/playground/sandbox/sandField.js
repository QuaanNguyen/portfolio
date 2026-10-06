export const CELL_PX = 4;
export const TALUS = 0.72;
const TALUS_DIAGONAL = TALUS * Math.SQRT2;
const SLUMP_EPSILON = 0.02;
const SLUMP_SHARE = 0.24;
const MAX_SETTLE_FRAMES = 30;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGradientNoise(random) {
  const size = 256;
  const permutation = new Uint8Array(size * 2);
  const base = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < size * 2; i++) permutation[i] = base[i & 255];
  const gradients = Array.from({ length: size }, () => {
    const angle = random() * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  });
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const corner = (ix, iy, fx, fy) => {
    const g = gradients[permutation[(ix & 255) + permutation[iy & 255]]];
    return g[0] * fx + g[1] * fy;
  };
  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fade(fx);
    const v = fade(fy);
    const a = corner(ix, iy, fx, fy);
    const b = corner(ix + 1, iy, fx - 1, fy);
    const c = corner(ix, iy + 1, fx, fy - 1);
    const d = corner(ix + 1, iy + 1, fx - 1, fy - 1);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 1.4;
  };
}

function fbm(noise, x, y, octaves) {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.03;
  }
  return sum / norm;
}

const MOUNDS = [
  { fx: 0.12, fy: 0.4, sigma: 30, amp: 8, stretch: 1.2 },
  { fx: 0.4, fy: 0.48, sigma: 22, amp: 6, stretch: 0.8 },
  { fx: 0.7, fy: 0.44, sigma: 26, amp: 7, stretch: 1.1 },
  { fx: 0.92, fy: 0.28, sigma: 32, amp: 9, stretch: 0.7 },
  { fx: 0.08, fy: 0.92, sigma: 24, amp: 6, stretch: 1 },
  { fx: 0.38, fy: 0.96, sigma: 18, amp: 5, stretch: 1.3 },
  { fx: 0.66, fy: 0.97, sigma: 18, amp: 5, stretch: 0.9 },
];

const PITS = [
  { fx: 0.16, fy: 0.22, radius: 13, depth: 5 },
  { fx: 0.84, fy: 0.14, radius: 12, depth: 5.5 },
  { fx: 0.3, fy: 0.56, radius: 10, depth: 4 },
  { fx: 0.95, fy: 0.52, radius: 11, depth: 4.5 },
];

const RIPPLE_ANGLE = Math.PI / 2 - 0.18;

function seedTerrain(field, random) {
  const { cols, rows, height, ground, originX, originY } = field;
  const noise = createGradientNoise(random);
  const rippleNoise = createGradientNoise(random);
  const toCellX = (fx) => (fx * field.viewportW - originX) / CELL_PX;
  const toCellY = (fy) => (fy * field.viewportH - originY) / CELL_PX;
  const mounds = MOUNDS.map((m) => ({ ...m, cx: toCellX(m.fx), cy: toCellY(m.fy) }));
  const pits = PITS.map((p) => ({ ...p, cx: toCellX(p.fx), cy: toCellY(p.fy) }));
  const rippleDirX = Math.cos(RIPPLE_ANGLE);
  const rippleDirY = Math.sin(RIPPLE_ANGLE);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const broad = fbm(noise, x / 150, y / 150, 3) * 7;
      ground[i] = broad;

      let feature = 0;
      for (const m of mounds) {
        const dx = (x - m.cx) * m.stretch;
        const dy = (y - m.cy) / m.stretch;
        feature += m.amp * Math.exp(-(dx * dx + dy * dy) / (2 * m.sigma * m.sigma));
      }
      for (const p of pits) {
        const r = Math.hypot(x - p.cx, y - p.cy) / p.radius;
        const bowl = -p.depth * Math.exp(-r * r * 1.6);
        const rim = p.depth * 0.62 * Math.exp(-((r - 1.25) * (r - 1.25)) / 0.12);
        feature += bowl + rim;
      }

      const warp = rippleNoise(x / 60, y / 60) * 9;
      const phase = (x * rippleDirX + y * rippleDirY + warp) / 5.2;
      const rippleStrength = 0.5 + 0.5 * rippleNoise(x / 90 + 13.1, y / 90 - 7.7);
      const ripples = Math.pow(Math.abs(Math.sin(phase * Math.PI)), 1.6) * 0.32 * rippleStrength;
      const micro = fbm(noise, x / 7 + 31.3, y / 7 - 17.9, 2) * 0.14;

      height[i] = broad + feature + ripples + micro;
    }
  }
}

export function createSandField({ originX, originY, widthPx, heightPx, viewportW, viewportH, seed = 11 }) {
  const cols = Math.ceil(widthPx / CELL_PX);
  const rows = Math.ceil(heightPx / CELL_PX);
  const field = {
    cols,
    rows,
    originX,
    originY,
    viewportW,
    viewportH,
    height: new Float32Array(cols * rows),
    ground: new Float32Array(cols * rows),
    blocked: new Uint8Array(cols * rows),
    dirty: null,
    uploadRows: { y0: 0, y1: rows - 1 },
    framesSinceDisturb: 0,
    lastDisturbAt: 0,
    lastSettleMs: 0,
    lastSettleFrames: 0,
  };
  seedTerrain(field, mulberry32(seed));
  return field;
}

function markDirty(field, x0, y0, x1, y1) {
  const cx0 = Math.max(0, Math.floor(x0));
  const cy0 = Math.max(0, Math.floor(y0));
  const cx1 = Math.min(field.cols - 1, Math.ceil(x1));
  const cy1 = Math.min(field.rows - 1, Math.ceil(y1));
  if (cx0 > cx1 || cy0 > cy1) return;
  field.lastDisturbAt = performance.now();
  if (!field.dirty) {
    field.dirty = { x0: cx0, y0: cy0, x1: cx1, y1: cy1 };
  } else {
    field.dirty.x0 = Math.min(field.dirty.x0, cx0);
    field.dirty.y0 = Math.min(field.dirty.y0, cy0);
    field.dirty.x1 = Math.max(field.dirty.x1, cx1);
    field.dirty.y1 = Math.max(field.dirty.y1, cy1);
  }
  if (!field.uploadRows) {
    field.uploadRows = { y0: cy0, y1: cy1 };
  } else {
    field.uploadRows.y0 = Math.min(field.uploadRows.y0, cy0);
    field.uploadRows.y1 = Math.max(field.uploadRows.y1, cy1);
  }
  field.framesSinceDisturb = 0;
}

function splat(field, cx, cy, amount) {
  const { cols, rows, height } = field;
  const x = Math.min(cols - 1.001, Math.max(0, cx - 0.5));
  const y = Math.min(rows - 1.001, Math.max(0, cy - 0.5));
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const i = iy * cols + ix;
  height[i] += amount * (1 - fx) * (1 - fy);
  height[i + 1] += amount * fx * (1 - fy);
  height[i + cols] += amount * (1 - fx) * fy;
  height[i + cols + 1] += amount * fx * fy;
}

function sampleGrid(field, grid, cx, cy) {
  const { cols, rows } = field;
  const x = Math.min(cols - 1.001, Math.max(0, cx - 0.5));
  const y = Math.min(rows - 1.001, Math.max(0, cy - 0.5));
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const i = iy * cols + ix;
  const top = grid[i] * (1 - fx) + grid[i + 1] * fx;
  const bottom = grid[i + cols] * (1 - fx) + grid[i + cols + 1] * fx;
  return top * (1 - fy) + bottom * fy;
}

function toCells(field, rect) {
  return {
    cx: (rect.x - field.originX) / CELL_PX,
    cy: (rect.y - field.originY) / CELL_PX,
    hw: rect.w / 2 / CELL_PX,
    hh: rect.h / 2 / CELL_PX,
  };
}

function scrapeFootprint(field, cx, cy, hw, hh, dirX, dirY, floorLevel) {
  const { cols, rows, height } = field;
  const x0 = Math.max(0, Math.ceil(cx - hw - 0.5));
  const x1 = Math.min(cols - 1, Math.floor(cx + hw - 0.5));
  const y0 = Math.max(0, Math.ceil(cy - hh - 0.5));
  const y1 = Math.min(rows - 1, Math.floor(cy + hh - 0.5));
  let moved = 0;
  for (let y = y0; y <= y1; y++) {
    const py = y + 0.5;
    for (let x = x0; x <= x1; x++) {
      const i = y * cols + x;
      const excess = height[i] - floorLevel;
      if (excess <= 0) continue;
      height[i] = floorLevel;
      const px = x + 0.5;
      const tx = dirX > 1e-6 ? (cx + hw - px) / dirX : dirX < -1e-6 ? (cx - hw - px) / dirX : Infinity;
      const ty = dirY > 1e-6 ? (cy + hh - py) / dirY : dirY < -1e-6 ? (cy - hh - py) / dirY : Infinity;
      const exit = Math.min(tx, ty);
      splat(field, px + dirX * (exit + 1.1), py + dirY * (exit + 1.1), excess * 0.6);
      splat(field, px + dirX * (exit + 2.8), py + dirY * (exit + 2.8), excess * 0.4);
      moved += excess;
    }
  }
  return moved;
}

export function plowRect(field, fromRect, toRect, depth) {
  const from = toCells(field, fromRect);
  const to = toCells(field, toRect);
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.02) return 0;
  const dirX = dx / distance;
  const dirY = dy / distance;
  const steps = Math.max(1, Math.ceil(distance / 0.7));
  let moved = 0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const cx = from.cx + dx * t;
    const cy = from.cy + dy * t;
    const floorLevel = sampleGrid(field, field.ground, cx, cy) - depth;
    moved += scrapeFootprint(field, cx, cy, to.hw, to.hh, dirX, dirY, floorLevel);
  }
  const pad = 6;
  markDirty(
    field,
    Math.min(from.cx, to.cx) - to.hw - pad,
    Math.min(from.cy, to.cy) - to.hh - pad,
    Math.max(from.cx, to.cx) + to.hw + pad,
    Math.max(from.cy, to.cy) + to.hh + pad
  );
  return moved;
}

export function fingerStroke(field, fromPx, toPx, radiusPx, depth) {
  const r = radiusPx / CELL_PX;
  const sample = toCells(field, { x: toPx.x, y: toPx.y, w: 0, h: 0 });
  let ring = 0;
  let count = 0;
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    ring += sampleGrid(field, field.height, sample.cx + Math.cos(angle) * (r + 3), sample.cy + Math.sin(angle) * (r + 3));
    count++;
  }
  const from = toCells(field, { x: fromPx.x, y: fromPx.y, w: radiusPx * 2, h: radiusPx * 2 });
  const to = toCells(field, { x: toPx.x, y: toPx.y, w: radiusPx * 2, h: radiusPx * 2 });
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.02) return 0;
  const floorLevel = ring / count - depth;
  const steps = Math.max(1, Math.ceil(distance / 0.6));
  let moved = 0;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    moved += scrapeFootprint(field, from.cx + dx * t, from.cy + dy * t, r, r, dx / distance, dy / distance, floorLevel);
  }
  markDirty(field, Math.min(from.cx, to.cx) - r - 5, Math.min(from.cy, to.cy) - r - 5, Math.max(from.cx, to.cx) + r + 5, Math.max(from.cy, to.cy) + r + 5);
  return moved;
}

export function pressRect(field, rect, depth) {
  const { cols, rows, height } = field;
  const { cx, cy, hw, hh } = toCells(field, rect);
  const x0 = Math.max(0, Math.ceil(cx - hw - 0.5));
  const x1 = Math.min(cols - 1, Math.floor(cx + hw - 0.5));
  const y0 = Math.max(0, Math.ceil(cy - hh - 0.5));
  const y1 = Math.min(rows - 1, Math.floor(cy + hh - 0.5));
  let displaced = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      height[y * cols + x] -= depth;
      displaced += depth;
    }
  }
  const band = 6;
  const ring = [];
  for (let y = y0 - band; y <= y1 + band; y++) {
    for (let x = x0 - band; x <= x1 + band; x++) {
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      const edge = Math.max(x0 - x, x - x1, y0 - y, y - y1);
      ring.push([y * cols + x, band + 1 - edge]);
    }
  }
  const weightSum = ring.reduce((sum, [, w]) => sum + w, 0);
  for (const [i, w] of ring) height[i] += (displaced * w) / weightSum;
  markDirty(field, x0 - band - 2, y0 - band - 2, x1 + band + 2, y1 + band + 2);
}

export function setObstacles(field, rects) {
  const { cols, rows, blocked } = field;
  blocked.fill(0);
  for (const rect of rects) {
    const { cx, cy, hw, hh } = toCells(field, rect);
    const x0 = Math.max(0, Math.ceil(cx - hw - 0.5));
    const x1 = Math.min(cols - 1, Math.floor(cx + hw - 0.5));
    const y0 = Math.max(0, Math.ceil(cy - hh - 0.5));
    const y1 = Math.min(rows - 1, Math.floor(cy + hh - 0.5));
    for (let y = y0; y <= y1; y++) blocked.fill(1, y * cols + x0, y * cols + x1 + 1);
  }
}

const NEIGHBORS = [
  [1, 0, TALUS],
  [-1, 0, TALUS],
  [0, 1, TALUS],
  [0, -1, TALUS],
  [1, 1, TALUS_DIAGONAL],
  [-1, 1, TALUS_DIAGONAL],
  [1, -1, TALUS_DIAGONAL],
  [-1, -1, TALUS_DIAGONAL],
];

function slumpPass(field, reverse) {
  const { cols, rows, height, blocked, dirty } = field;
  const x0 = Math.max(1, dirty.x0 - 1);
  const y0 = Math.max(1, dirty.y0 - 1);
  const x1 = Math.min(cols - 2, dirty.x1 + 1);
  const y1 = Math.min(rows - 2, dirty.y1 + 1);
  let nx0 = Infinity;
  let ny0 = Infinity;
  let nx1 = -Infinity;
  let ny1 = -Infinity;
  let moved = 0;
  for (let yy = y0; yy <= y1; yy++) {
    const y = reverse ? y1 - (yy - y0) : yy;
    for (let xx = x0; xx <= x1; xx++) {
      const x = reverse ? x1 - (xx - x0) : xx;
      const i = y * cols + x;
      let h = height[i];
      for (let n = 0; n < 8; n++) {
        const [ox, oy, limit] = NEIGHBORS[n];
        const j = i + oy * cols + ox;
        if (blocked[j] && !blocked[i]) continue;
        const excess = h - height[j] - limit;
        if (excess <= SLUMP_EPSILON) continue;
        const amount = excess * SLUMP_SHARE;
        h -= amount;
        height[j] += amount;
        moved += amount;
        if (x - 1 < nx0) nx0 = x - 1;
        if (x + 1 > nx1) nx1 = x + 1;
        if (y - 1 < ny0) ny0 = y - 1;
        if (y + 1 > ny1) ny1 = y + 1;
      }
      height[i] = h;
    }
  }
  if (moved > 0) {
    field.dirty = { x0: nx0, y0: ny0, x1: nx1, y1: ny1 };
    if (!field.uploadRows) field.uploadRows = { y0: ny0, y1: ny1 };
    else {
      field.uploadRows.y0 = Math.min(field.uploadRows.y0, Math.max(0, ny0));
      field.uploadRows.y1 = Math.max(field.uploadRows.y1, Math.min(rows - 1, ny1));
    }
  } else {
    field.dirty = null;
  }
  return moved;
}

export function settleStep(field, { passes = 12, instant = false, disturbing = false } = {}) {
  if (!field.dirty) return false;
  field.framesSinceDisturb += 1;
  const passCount = instant ? 400 : passes;
  for (let p = 0; p < passCount && field.dirty; p++) slumpPass(field, p % 2 === 1);
  if (!disturbing && field.framesSinceDisturb > MAX_SETTLE_FRAMES) field.dirty = null;
  if (!field.dirty) {
    field.lastSettleMs = performance.now() - field.lastDisturbAt;
    field.lastSettleFrames = field.framesSinceDisturb;
  }
  return true;
}

function resample(points, spacingPx) {
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacingPx));
    for (let s = 1; s <= steps; s++) {
      result.push({ x: from.x + ((to.x - from.x) * s) / steps, y: from.y + ((to.y - from.y) * s) / steps });
    }
  }
  return result;
}

export function engraveStrokes(field, strokes, radiusPx, depth) {
  const { cols, rows, height } = field;
  const r = radiusPx / CELL_PX;
  const reach = Math.ceil(r + 1);
  const distance = new Map();
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -Infinity;
  let by1 = -Infinity;

  for (const stroke of strokes) {
    const points = resample(stroke, 3).map((p) => ({ x: (p.x - field.originX) / CELL_PX, y: (p.y - field.originY) / CELL_PX }));
    for (let s = 1; s < points.length; s++) {
      const a = points[s - 1];
      const b = points[s];
      const sx = b.x - a.x;
      const sy = b.y - a.y;
      const lengthSq = sx * sx + sy * sy || 1e-6;
      const x0 = Math.max(0, Math.floor(Math.min(a.x, b.x) - reach));
      const x1 = Math.min(cols - 1, Math.ceil(Math.max(a.x, b.x) + reach));
      const y0 = Math.max(0, Math.floor(Math.min(a.y, b.y) - reach));
      const y1 = Math.min(rows - 1, Math.ceil(Math.max(a.y, b.y) + reach));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5;
          const py = y + 0.5;
          const t = Math.min(1, Math.max(0, ((px - a.x) * sx + (py - a.y) * sy) / lengthSq));
          const dx = px - (a.x + sx * t);
          const dy = py - (a.y + sy * t);
          const d = Math.hypot(dx, dy);
          if (d >= r) continue;
          const i = y * cols + x;
          const previous = distance.get(i);
          if (previous && previous.d <= d) continue;
          const nx = d > 1e-4 ? dx / d : -sy / Math.sqrt(lengthSq);
          const ny = d > 1e-4 ? dy / d : sx / Math.sqrt(lengthSq);
          distance.set(i, { d, nx, ny, x: px, y: py });
          bx0 = Math.min(bx0, x);
          by0 = Math.min(by0, y);
          bx1 = Math.max(bx1, x);
          by1 = Math.max(by1, y);
        }
      }
    }
  }

  for (const [i, { d, nx, ny, x, y }] of distance) {
    const removed = depth * Math.sqrt(1 - (d / r) ** 2);
    height[i] -= removed;
    const throwDistance = r - d + 1.4;
    splat(field, x + nx * throwDistance, y + ny * throwDistance, removed * 0.65);
    splat(field, x + nx * (throwDistance + 1.2), y + ny * (throwDistance + 1.2), removed * 0.35);
  }
  markDirty(field, bx0 - reach - 3, by0 - reach - 3, bx1 + reach + 3, by1 + reach + 3);
}

export function replayFingerStrokes(field, strokes, radiusPx, depth) {
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) fingerStroke(field, stroke[i - 1], stroke[i], radiusPx, depth);
  }
}

export function settleFully(field, maxPasses = 800) {
  for (let p = 0; p < maxPasses && field.dirty; p++) slumpPass(field, p % 2 === 1);
  field.dirty = null;
  field.uploadRows = { y0: 0, y1: field.rows - 1 };
}

export function markWholeField(field) {
  markDirty(field, 0, 0, field.cols - 1, field.rows - 1);
}
