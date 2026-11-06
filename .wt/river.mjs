// The shared drawing: a bundle of fine lines that flow side by side like silk, swelling and
// narrowing with whatever width they're given. The fabric itself sways, and light runs along it.
const n1 = (n) => String(Math.round(n * 10) / 10);

const SWAY_SECONDS = 15;
const PARTICLE_GAP = 310;
const PULSE_LENGTH = 150;
const PULSE_GAP = 1500;
// Three evenly spaced moments of a wave, enough to read as a wave travelling along the lines.
const PHASES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

// A smooth curve through every point (Catmull-Rom, written as cubic Beziers).
export function smoothPath(points) {
  let d = `M${n1(points[0][0])} ${n1(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${n1(c1[0])} ${n1(c1[1])} ${n1(c2[0])} ${n1(c2[1])} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d;
}

// How far along smoothPath(points) each point sits, measured on the same curves, so anything timed
// to something travelling the path arrives together with it.
export function distancesAlong(points) {
  const distances = [0];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    let length = 0;
    let prev = p1;
    for (let s = 1; s <= 16; s++) {
      const t = s / 16;
      const u = 1 - t;
      const pt = [0, 1].map((k) => u * u * u * p1[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p2[k]);
      length += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
      prev = pt;
    }
    distances.push(distances[i] + length);
  }
  return distances;
}

// Knots sit on a grid shared by the whole scene, so slices of one river meet exactly at their seams.
function knots(from, to, step) {
  const xs = [];
  for (let x = Math.floor(from / step) * step; x <= Math.ceil(to / step) * step; x += step) xs.push(x);
  return xs;
}

// Each line keeps roughly its place across the width but drifts over its neighbours, which is what
// makes the bundle read as fabric rather than as parallel strokes.
function lineAt(i, place, x, phase, { center, halfWidth }) {
  const drift = 0.17 * Math.sin(x / 71 + i * 0.83 + phase) + 0.07 * Math.sin(x / 29 + i * 2.1 - 2 * phase);
  return [x, center(x, phase) + (place + drift) * halfWidth(x)];
}

export function riverLines({ count, from, to, step, ...shape }) {
  const xs = knots(from, to, step);
  return Array.from({ length: count }, (_, i) => {
    const place = count === 1 ? 0 : -1 + (2 * i) / (count - 1);
    return { ds: PHASES.map((phase) => smoothPath(xs.map((x) => lineAt(i, place, x, phase, shape)))), place };
  });
}

// The soft body of the river: the area between its two edges, swaying with the lines.
function bandPaths({ from, to, step, center, halfWidth }) {
  const xs = knots(from, to, step);
  return PHASES.map((phase) => {
    const top = xs.map((x) => [x, center(x, phase) - halfWidth(x)]);
    const bottom = xs.map((x) => [x, center(x, phase) + halfWidth(x)]).reverse();
    return `${smoothPath(top)}L${n1(bottom[0][0])} ${n1(bottom[0][1])}${smoothPath(bottom).replace(/^M[^C]*/, '')}Z`;
  });
}

const swaying = (ds) =>
  `<animate attributeName="d" dur="${SWAY_SECONDS}s" repeatCount="indefinite" values="${ds.join(';')};${ds[0]}"/>`;

// Constant motion, so linear easing, slow enough to feel like a current and not a loading bar.
export function riverStyle(theme) {
  const { particle, pulse } = theme.river;
  return `.pa{fill:none;stroke:${particle};stroke-linecap:round;stroke-dasharray:.01 ${PARTICLE_GAP};animation:pa 9s linear infinite}
.pu{fill:none;stroke:${pulse};stroke-linecap:round;stroke-dasharray:${PULSE_LENGTH} ${PULSE_GAP};animation:pu 12s linear infinite}
@keyframes pa{to{stroke-dashoffset:-${PARTICLE_GAP}}}
@keyframes pu{to{stroke-dashoffset:-${PULSE_LENGTH + PULSE_GAP}}}
@media (prefers-reduced-motion:reduce){.pa,.pu{animation:none}}`;
}

export function riverDefs(lines, width, theme, band) {
  const { stops, bandOpacity } = theme.river;
  const stop = (opacity) => stops.map(([at, color]) => `<stop offset="${at}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('');
  const paths = lines.map((line, i) => `<path id="l${i}" d="${line.ds[0]}">${swaying(line.ds)}</path>`).join('');
  const bandDs = bandPaths(band);
  return [
    `<linearGradient id="silk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${width}" y2="0">${stop(1)}</linearGradient>`,
    `<linearGradient id="body" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${width}" y2="0">${stop(bandOpacity)}</linearGradient>`,
    `<path id="band" d="${bandDs[0]}">${swaying(bandDs)}</path>`,
    paths,
  ].join('');
}

export function riverBody(lines, theme, { pulses = false } = {}) {
  const middle = (line) => 1 - Math.abs(line.place);
  const silk = lines
    .map((line, i) => {
      const opacity = theme.river.edge + (theme.river.core - theme.river.edge) * middle(line) ** 1.4;
      return `<use href="#l${i}" fill="none" stroke="url(#silk)" stroke-width=".9" stroke-opacity="${n1(opacity * 10) / 10}"/>`;
    })
    .join('');
  // Pulses start nearly together with the middle lines leading, so they arrive as one curved wavefront.
  const wave = pulses
    ? lines
        .map((line, i) => `<use href="#l${i}" class="pu" stroke-width="1.1" stroke-opacity="${n1((0.25 + 0.6 * middle(line)) * 10) / 10}" style="animation-delay:${n1(-3 - 0.9 * middle(line))}s"/>`)
        .join('')
    : '';
  // On every other line, at slightly different speeds, so the current never looks mechanical.
  const particles = lines
    .filter((_, i) => i % 2 === 0)
    .map((line) => {
      const i = lines.indexOf(line);
      return `<use href="#l${i}" class="pa" stroke-width="1.6" style="animation-duration:${n1(7.5 + ((i * 37) % 11) * 0.42)}s;animation-delay:${n1(-((i * 53) % 29) * 0.31)}s"/>`;
    })
    .join('');
  return `<use href="#band" fill="url(#body)"/>${silk}${wave}${particles}`;
}
