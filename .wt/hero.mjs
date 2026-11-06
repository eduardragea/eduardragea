// The banner: the real contribution calendar, one droplet per active day, sized by how much
// happened that day. A stream of light flows through them in date order, absorbs each one, and
// they well back up behind it.
import { svg } from './theme.mjs';
import { distancesAlong, smoothPath } from './river.mjs';
import { text } from './text.mjs';

const W = 846;
const H = 186;
const PITCH = 14.4;
const TOP = 40;
const LOOP = 28;
const RUN = 23;
const ABSORBED = 5; // seconds a day stays gone before it wells back up
const REGROW = 0.9;
const RADII = [0, 2.7, 3.5, 4.4, 5.4];
const RIPPLE_SECONDS = 7;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Long and fine at the tail, short and full at the head, all ending at the same point.
const BODY = [
  { length: 420, opacity: 0.22, width: 1.3 },
  { length: 250, opacity: 0.4, width: 2.2 },
  { length: 130, opacity: 0.7, width: 3.4 },
  { length: 55, opacity: 1, width: 4.8 },
];

const n2 = (n) => String(Math.round(n * 100) / 100);
const pct = (n) => `${Math.round(n * 100000) / 1000}%`;
const EASE_OUT = 'cubic-bezier(.23,1,.32,1)';

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, amount) => {
  const [ra, rb] = [hexToRgb(a), hexToRgb(b)];
  return `#${ra.map((v, i) => Math.round(v + (rb[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
};

// The colour of the river at this point of the year.
function hueAt(position, stops) {
  const next = stops.findIndex(([at]) => at >= position);
  if (next <= 0) return stops[0][1];
  const [a, ca] = stops[next - 1];
  const [b, cb] = stops[next];
  return mix(ca, cb, (position - a) / (b - a));
}

// Date order, up one week and down the next, through active days only. Skipping the quiet days is
// what gives the stream its uneven, organic line.
export function route(days, cols) {
  return Array.from({ length: cols }, (_, col) => {
    const week = days.filter((d) => d.col === col && d.count > 0).sort((a, b) => a.row - b.row);
    return col % 2 === 0 ? week : [...week].reverse();
  }).flat();
}

export const droplet = (level) => RADII[level];

function monthLabels(days, x, theme) {
  return days
    .filter((d) => d.date.endsWith('-01'))
    .map((d) => (x(d.col) > W - 40 ? '' : text(MONTHS[Number(d.date.slice(5, 7)) - 1], { fill: theme.faint, size: 10.5, x: x(d.col) - 5, y: TOP - 15 })))
    .join('');
}

export function heroSVG({ cols, days, total }, theme) {
  const left = (W - (cols - 1) * PITCH) / 2;
  const x = (col) => left + col * PITCH;
  const y = (row) => TOP + row * PITCH;
  const mid = y(3);

  const path = route(days, cols);
  // The stream wanders a little around each droplet, so straight runs still read as liquid.
  const wander = (d) => 2.6 * Math.sin(d.row * 1.15 + d.col * 0.7);
  const points = [[-30, mid], ...path.map((d) => [x(d.col) + wander(d), y(d.row)]), [W + 30, mid]];
  const d = smoothPath(points);
  const distances = distancesAlong(points);
  const length = distances.at(-1);
  const speed = length / RUN;
  const arrival = new Map(path.map((day, i) => [day.date, distances[i + 1] / speed]));

  // A negative delay starts every animation mid-cycle, so the first frame is already the full picture.
  const delay = (t) => `animation-delay:${n2(t - LOOP)}s`;

  const empties = days.filter((day) => day.count === 0).map((day) => `M${n2(x(day.col))} ${n2(y(day.row))}h.01`).join('');
  const weeks = Array.from({ length: cols }, (_, col) => {
    const drops = days
      .filter((day) => day.col === col && day.count > 0)
      .map((day) => {
        const color = mix(hueAt(col / (cols - 1), theme.river.stops), theme.levelTo[day.level][0], theme.levelTo[day.level][1]);
        const [cx, cy] = [x(col), y(day.row)];
        return `<use href="#o${day.level}" fill="${color}" x="${n2(cx)}" y="${n2(cy)}" class="o" style="transform-origin:${n2(cx)}px ${n2(cy)}px;${delay(arrival.get(day.date))}"/>`;
      })
      .join('');
    // Each week rises and falls a little after the one before: a slow swell across the whole year.
    return drops ? `<g class="w" style="animation-delay:${n2(-(col * RIPPLE_SECONDS) / 26)}s">${drops}</g>` : '';
  }).join('');

  const body = BODY.map((layer, i) => `<path class="s s${i}" d="${d}" stroke="url(#silk)" stroke-width="${layer.width}" stroke-opacity="${layer.opacity}"/>`).join('');
  const head = `<path class="s h" d="${d}" stroke="${theme.river.particle}" stroke-width="6.5"/>`;

  const dashStyle = (name, len) => `.${name}{stroke-dasharray:${len} 99999;stroke-dashoffset:${len};animation-name:${name}}`;
  const dashKeyframes = (name, len) => {
    const end = pct((length + len) / speed / LOOP);
    return `@keyframes ${name}{0%{stroke-dashoffset:${len}}${end},100%{stroke-dashoffset:${n2(-length)}}}`;
  };
  const style = `<style>
.o{animation:eat ${LOOP}s linear infinite}
.w{animation:swell ${RIPPLE_SECONDS}s cubic-bezier(.45,0,.55,1) infinite alternate}
.s{fill:none;stroke-linecap:round;animation-duration:${LOOP}s;animation-timing-function:linear;animation-iteration-count:infinite}
${BODY.map((layer, i) => dashStyle(`s${i}`, layer.length)).join('')}${dashStyle('h', 0.01)}
@keyframes eat{
0%{transform:scale(1.55);opacity:1;animation-timing-function:${EASE_OUT}}
${pct(0.45 / LOOP)}{transform:scale(.6);opacity:0}
${pct(ABSORBED / LOOP)}{transform:scale(.6);opacity:0;animation-timing-function:${EASE_OUT}}
${pct((ABSORBED + REGROW) / LOOP)}{transform:scale(1);opacity:1}
99.4%{transform:scale(1);opacity:1;animation-timing-function:ease-in}
100%{transform:scale(1.55);opacity:1}}
@keyframes swell{from{transform:translateY(-1.5px)}to{transform:translateY(1.5px)}}
${BODY.map((layer, i) => dashKeyframes(`s${i}`, layer.length)).join('')}${dashKeyframes('h', 0.01)}
@media (prefers-reduced-motion:reduce){.o,.w,.s{animation:none}}
</style>`;

  const shapes = [1, 2, 3, 4]
    .map((level) => {
      const r = RADII[level];
      return `<g id="o${level}"><circle r="${r}"/><circle cx="${n2(-r * 0.3)}" cy="${n2(-r * 0.34)}" r="${n2(r * 0.3)}" fill="#fff" fill-opacity="${theme.dropShine}"/></g>`;
    })
    .join('');
  const stops = theme.river.stops.map(([at, color]) => `<stop offset="${at}" stop-color="${color}"/>`).join('');
  const activeDays = days.filter((day) => day.count > 0).length;
  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);

  const parts = [
    style,
    `<defs>${shapes}<linearGradient id="silk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${stops}</linearGradient>`,
    `<clipPath id="card"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16"/></clipPath></defs>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${theme.card}"/>`,
    `<path d="${empties}" fill="none" stroke="${theme.line}" stroke-opacity="${theme.emptyDot}" stroke-width="2.4" stroke-linecap="round"/>`,
    monthLabels(days, x, theme),
    `<g clip-path="url(#card)">${weeks}${body}${head}</g>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
    text(`${total.toLocaleString('en-US')} contributions in the last year`, { fill: theme.ink, size: 14, x: left - 5, y: H - 22 }),
    text(`${activeDays} active days, up to ${busiest.count} in one day`, { anchor: 'end', fill: theme.muted, size: 12, x: W - left + 5, y: H - 22 }),
  ].join('');

  return svg(W, H, heroLabel(total), parts);
}

export const heroLabel = (total) =>
  `Contribution calendar with ${total.toLocaleString('en-US')} contributions in the last year: one droplet per active day, with a stream of light flowing through them in date order`;
