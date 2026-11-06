// The three things every system has to do, drawn as one river: it opens wide (scale), narrows
// through a checkpoint (data safety), then runs lean (cost).
import { svg } from './theme.mjs';
import { riverBody, riverDefs, riverLines, riverStyle } from './river.mjs';
import { text } from './text.mjs';

const W = 846;
const H = 214;
const MID = 76;
const LINES = 24;
const KNOT_STEP = 32;
const STOPS = [141, 423, 705];
// Half the river's width along its length.
const WIDTHS = [[-40, 6], [141, 54], [300, 34], [423, 11], [560, 30], [705, 12], [W + 40, 3]];

const ICONS = {
  // One node branching into many.
  scale: `<circle cx="-8" cy="0" r="2.6"/><circle cx="8" cy="-8" r="2.6"/><circle cx="8" cy="0" r="2.6"/><circle cx="8" cy="8" r="2.6"/><path fill="none" stroke-width="1.7" d="M-8 0C0 0 0-8 8-8M-8 0H8M-8 0C0 0 0 8 8 8"/>`,
  shield: `<path fill="none" stroke-width="1.8" stroke-linejoin="round" d="M0-11 9-7.5V-.5C9 5 5 9 0 11-5 9-9 5-9-.5V-7.5Z"/><path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M-3.5 0-1 2.5 4-3"/>`,
  // A cost line coming down.
  cost: `<path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M-10-7C-4-7-4 1 1 1S5 6 10 6"/><path fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 8.5 10.5 6 7.5 2"/>`,
};

function halfWidthAt(x) {
  const i = WIDTHS.findIndex(([at], k) => k < WIDTHS.length - 1 && x >= at && x <= WIDTHS[k + 1][0]);
  const [x0, w0] = WIDTHS[Math.max(0, i)];
  const [x1, w1] = WIDTHS[Math.max(0, i) + 1];
  const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
  return w0 + (w1 - w0) * t * t * (3 - 2 * t);
}

function badge(icon, x, i, theme) {
  return [
    `<circle class="halo" style="animation-delay:${-i * 1.1}s" cx="${x}" cy="${MID}" r="31" fill="${theme.river.glow}" fill-opacity=".16"/>`,
    `<circle cx="${x}" cy="${MID}" r="24" fill="${theme.glass}" stroke="${theme.river.ring}" stroke-opacity=".7" stroke-width="1.2"/>`,
    `<g transform="translate(${x} ${MID})" fill="${theme.ink}" stroke="${theme.ink}">${ICONS[icon]}</g>`,
  ].join('');
}

function label({ title, detail }, x, theme) {
  return (
    text(title, { anchor: 'middle', fill: theme.ink, font: 'bold', size: 15, x, y: H - 54 }) +
    text(detail, { anchor: 'middle', fill: theme.muted, size: 12, x, y: H - 33 })
  );
}

export function pillarsSVG(pillars, theme) {
  const center = (x, phase) => MID + 3 * Math.sin(x / 120 + phase);
  const river = { center, from: -40, halfWidth: halfWidthAt, step: KNOT_STEP, to: W + 40 };
  const lines = riverLines({ ...river, count: LINES });
  const body = [
    `<style>${riverStyle(theme)}.halo{transform-origin:center;transform-box:fill-box;animation:halo 4s cubic-bezier(.45,0,.55,1) infinite alternate}@keyframes halo{from{transform:scale(.94);opacity:.55}to{transform:scale(1.08);opacity:1}}@media (prefers-reduced-motion:reduce){.halo{animation:none}}</style>`,
    `<defs>${riverDefs(lines, W, theme, river)}`,
    `<linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${theme.scene[0]}"/><stop offset="1" stop-color="${theme.scene[1]}"/></linearGradient>`,
    `<clipPath id="card"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16"/></clipPath></defs>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="url(#bg)"/>`,
    `<g clip-path="url(#card)">${riverBody(lines, theme, { pulses: true })}</g>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
    ...pillars.map((pillar, i) => badge(pillar.icon, STOPS[i], i, theme)),
    ...pillars.map((pillar, i) => label(pillar, STOPS[i], theme)),
  ].join('');
  return svg(W, H, pillarsLabel(pillars), body);
}

export const pillarsLabel = (pillars) => pillars.map((p) => `${p.title}: ${p.detail}.`).join(' ');
