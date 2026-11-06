import { esc, svg } from './theme.mjs';
import { text, textWidth } from './text.mjs';

const H = 32;
const ICON = 16;

const ICONS = {
  instagram: (c) =>
    `<rect x="1.5" y="1.5" width="13" height="13" rx="3.6" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="8" cy="8" r="3" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="11.7" cy="4.3" r=".9" fill="${c}"/>`,
  linkedin: (c) =>
    `<path fill="${c}" fill-rule="evenodd" d="M2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11A1.5 1.5 0 0 1 2.5 1ZM3.4 6.6v6h1.9v-6Zm.95-3a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm2.6 3v6h1.9V9.5c0-.9.5-1.4 1.2-1.4s1 .5 1 1.4v3.1h1.9V9.1c0-1.7-.9-2.6-2.3-2.6-.8 0-1.4.3-1.8.9v-.8Z"/>`,
  site: (c) =>
    `<circle cx="8" cy="8" r="6.6" fill="none" stroke="${c}" stroke-width="1.4"/><path fill="none" stroke="${c}" stroke-width="1.4" d="M1.6 8h12.8M8 1.4c2 1.9 2.9 4.1 2.9 6.6S10 12.7 8 14.6C6 12.7 5.1 10.5 5.1 8S6 3.3 8 1.4Z"/>`,
};

function pill(theme, lead, label, alt, trail = '', trailWidth = 0) {
  const width = Math.ceil(textWidth(label, 'bold', 13)) + 12 + ICON + 8 + trailWidth + 14;
  const body = [
    `<rect x=".5" y=".5" width="${width - 1}" height="${H - 1}" rx="${(H - 1) / 2}" fill="${theme.card}" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
    `<g transform="translate(12 ${(H - ICON) / 2})">${lead}</g>`,
    text(label, { fill: theme.ink, font: 'bold', size: 13, x: 12 + ICON + 8, y: 20.6 }),
    trail,
  ].join('');
  return svg(width, H, alt, body);
}

export function socialPill(theme, key, handle) {
  const label = { instagram: `@${handle}`, linkedin: handle, site: handle }[key];
  const alt = { instagram: `Instagram @${handle}`, linkedin: `LinkedIn ${handle}`, site: `Website ${handle}` }[key];
  return pill(theme, ICONS[key](theme.ink), label, alt);
}

export const socialHref = (key, handle) =>
  ({
    instagram: `https://www.instagram.com/${handle}/`,
    linkedin: `https://www.linkedin.com/in/${handle}/`,
    site: `https://${handle}`,
  })[key];

export function ctaPill(theme, label) {
  const dot = `<style>.d{animation:b 2.4s ease-in-out infinite}@keyframes b{50%{opacity:.25}}@media (prefers-reduced-motion:reduce){.d{animation:none}}</style><circle class="d" cx="8" cy="8" r="7" fill="${theme.accent}" opacity=".3"/><circle cx="8" cy="8" r="3.4" fill="${theme.accent}"/>`;
  const x = Math.ceil(textWidth(label, 'bold', 13)) + 12 + ICON + 8 + 6;
  const arrow = `<path fill="none" stroke="${theme.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M${x} 16h10m-4-4 4 4-4 4"/>`;
  return pill(theme, dot, label, esc(label), arrow, 16);
}
