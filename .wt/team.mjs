// The team on the same river: one scene, cut into slices so each person links to their own page.
// The photos are the ones on workflowtime.com/#/team. Anyone without a photo in team.json yet gets
// a placeholder drawn in the same style.
import { readFileSync } from 'node:fs';
import { svg } from './theme.mjs';
import { riverBody, riverDefs, riverLines, riverStyle } from './river.mjs';
import { text, textWidth } from './text.mjs';

const SCENE_W = 846;
const H = 214;
const HEIGHTS = [72, 90, 66, 86, 70, 92];
const FACE_R = 27;
const LINES = 18;
const KNOT_STEP = 32;
const NAME_SIZE = 12.5;
const ROLE_SIZE = 9.5;
const PLATE_H = 42;
const PLATE_PAD = 18;
// Light and deep ends of each placeholder's sphere, from the same family as the river.
const PLACEHOLDER_HUES = [['#7dd3fc', '#0369a1'], ['#5eead4', '#0f766e']];

const n2 = (n) => String(Math.round(n * 100) / 100);

const facePhoto = (file) =>
  `data:image/jpeg;base64,${readFileSync(new URL(`./faces/${file}`, import.meta.url)).toString('base64')}`;

// Eases between the given heights, flat at each one, so the river passes level behind each person.
function through(points, x) {
  if (x <= points[0][0]) return points[0][1];
  if (x >= points.at(-1)[0]) return points.at(-1)[1];
  const i = points.findIndex((p, k) => x >= p[0] && x <= points[k + 1][0]);
  const [x0, y0] = points[i];
  const [x1, y1] = points[i + 1];
  const t = (x - x0) / (x1 - x0);
  return y0 + (y1 - y0) * t * t * (3 - 2 * t);
}

function photo(member, cx, cy) {
  return `<image href="${facePhoto(member.face)}" x="${n2(cx - FACE_R)}" y="${cy - FACE_R}" width="${FACE_R * 2}" height="${FACE_R * 2}" clip-path="url(#face)" preserveAspectRatio="xMidYMid slice"/>`;
}

// A glassy sphere with a soft head and shoulders, so a missing photo still looks finished.
function placeholder(i, cx, cy) {
  const [light, deep] = PLACEHOLDER_HUES[i % PLACEHOLDER_HUES.length];
  return [
    `<radialGradient id="sphere" cx=".32" cy=".24" r=".95"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${deep}"/></radialGradient>`,
    `<g clip-path="url(#face)">`,
    `<circle cx="${n2(cx)}" cy="${cy}" r="${FACE_R}" fill="url(#sphere)"/>`,
    `<circle cx="${n2(cx)}" cy="${n2(cy - FACE_R * 0.2)}" r="${n2(FACE_R * 0.33)}" fill="#fff" fill-opacity=".9"/>`,
    `<ellipse cx="${n2(cx)}" cy="${n2(cy + FACE_R * 0.84)}" rx="${n2(FACE_R * 0.62)}" ry="${n2(FACE_R * 0.52)}" fill="#fff" fill-opacity=".9"/>`,
    `<ellipse cx="${n2(cx - FACE_R * 0.42)}" cy="${n2(cy - FACE_R * 0.62)}" rx="${n2(FACE_R * 0.34)}" ry="${n2(FACE_R * 0.14)}" fill="#fff" fill-opacity=".28" transform="rotate(-28 ${n2(cx - FACE_R * 0.42)} ${n2(cy - FACE_R * 0.62)})"/>`,
    '</g>',
  ].join('');
}

function portrait(member, i, cx, cy, theme) {
  const ring = `<circle cx="${n2(cx)}" cy="${cy}" r="${FACE_R + 2.5}" fill="${theme.scene[0]}" stroke="${theme.river.ring}" stroke-opacity=".75" stroke-width="1.2"/>`;
  const halo = [12, 7, 4]
    .map((extra, k) => `<circle cx="${n2(cx)}" cy="${cy}" r="${FACE_R + extra}" fill="${theme.river.glow}" fill-opacity="${[0.05, 0.08, 0.12][k]}"/>`)
    .join('');
  const clip = `<clipPath id="face"><circle cx="${n2(cx)}" cy="${cy}" r="${FACE_R}"/></clipPath>`;
  return clip + halo + ring + (member.face ? photo(member, cx, cy) : placeholder(i, cx, cy));
}

export const nameplateWidth = (member) =>
  Math.ceil(Math.max(textWidth(member.name, 'bold', NAME_SIZE), textWidth(member.role, 'sans', ROLE_SIZE))) + PLATE_PAD;

function nameplate(member, cx, y, theme) {
  const width = nameplateWidth(member);
  const x = cx - width / 2;
  return [
    `<rect x="${n2(x)}" y="${y}" width="${width}" height="${PLATE_H}" rx="12" fill="${theme.glass}" fill-opacity=".72" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
    text(member.name, { anchor: 'middle', fill: theme.ink, font: 'bold', size: NAME_SIZE, x: cx, y: y + 18 }),
    text(member.role, { anchor: 'middle', fill: theme.muted, size: ROLE_SIZE, x: cx, y: y + 32 }),
  ].join('');
}

export const sliceWidth = (team) => SCENE_W / team.length;

export function teamSlices(team, theme) {
  const sliceW = sliceWidth(team);
  const stops = team.map((_, i) => [sliceW * (i + 0.5), HEIGHTS[i % HEIGHTS.length]]);
  const center = (x, phase) => through(stops, x) + 2.5 * Math.sin(x / 110 + phase);
  // Narrow between people, opening as it reaches each one.
  const halfWidth = (x) => {
    const nearest = Math.min(...stops.map(([sx]) => Math.abs(x - sx)));
    const closeness = Math.max(0, 1 - nearest / (sliceW * 0.5));
    return 7 + 31 * closeness * closeness * (3 - 2 * closeness);
  };

  return team.map((member, i) => {
    const [cx, cy] = stops[i];
    // Only the stretch of river this slice shows, plus enough beyond it to curve the same at the seam.
    const river = { center, from: sliceW * i - 2 * KNOT_STEP, halfWidth, step: KNOT_STEP, to: sliceW * (i + 1) + 2 * KNOT_STEP };
    const lines = riverLines({ ...river, count: LINES });
    const body = [
      `<style>${riverStyle(theme)}</style>`,
      `<defs>${riverDefs(lines, SCENE_W, theme, river)}`,
      `<linearGradient id="bg" x1="0" y1="0" x2="${SCENE_W}" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${theme.scene[0]}"/><stop offset="1" stop-color="${theme.scene[1]}"/></linearGradient>`,
      `<clipPath id="card"><rect x=".5" y=".5" width="${SCENE_W - 1}" height="${H - 1}" rx="16"/></clipPath></defs>`,
      `<rect x=".5" y=".5" width="${SCENE_W - 1}" height="${H - 1}" rx="16" fill="url(#bg)"/>`,
      `<g clip-path="url(#card)">${riverBody(lines, theme)}</g>`,
      `<rect x=".5" y=".5" width="${SCENE_W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
      portrait(member, i, cx, cy, theme),
      nameplate(member, cx, cy + FACE_R + 13, theme),
      i === team.length - 1 ? text('The WorkflowTime team', { anchor: 'end', fill: theme.faint, size: 10, x: SCENE_W - 14, y: H - 11 }) : '',
    ].join('');
    return svg(n2(sliceW), H, `${member.name}, ${member.role}`, body, `${n2(sliceW * i)} 0 ${n2(sliceW)} ${H}`);
  });
}
