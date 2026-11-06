// Rows of chips drifting slowly in opposite directions: the industries, what we build, the stack.
import { readFileSync } from 'node:fs';
import { svg } from './theme.mjs';
import { sharedGlyphs, textWidth } from './text.mjs';

const W = 846;
const ROW_H = 34;
const ROW_GAP = 12;
const PADDING_Y = 20;
const CHIP_GAP = 10;
const CHIP_PAD = 15;
const SIZE = 12.5;
const LOGO = 15;
const LOGO_GAP = 7;
const SPEED = 15; // px per second, constant and slow, a current rather than a ticker
const BASELINE = 21.4;

const n2 = (n) => String(Math.round(n * 100) / 100);
const { logos } = JSON.parse(readFileSync(new URL('./logos.json', import.meta.url), 'utf8'));

const chipWidth = (label, hasLogo) => textWidth(label, 'sans', SIZE) + 2 * CHIP_PAD + (hasLogo ? LOGO + LOGO_GAP : 0);

// One full set of chips and how wide it is, so the row can repeat without a visible join.
export function layoutRow(items) {
  let x = 0;
  const placed = items.map((item) => {
    const width = chipWidth(item.label, Boolean(item.d));
    const chip = { ...item, width, x };
    x += width + CHIP_GAP;
    return chip;
  });
  return { placed, width: x };
}

// The stack row: logos first, then anything the logo set doesn't carry, as plain chips.
const stackItems = (plain = []) => [...logos.map((logo) => ({ d: logo.d, label: logo.name })), ...plain.map((label) => ({ label }))];

export function marqueeSVG({ rows, stack }, theme) {
  const allRows = [...rows.map((labels) => labels.map((label) => ({ label }))), stackItems(stack)];
  const chars = allRows.flat().map((item) => item.label).join('');
  const glyphs = sharedGlyphs(chars, 'sans', SIZE, 'g');
  const H = 2 * PADDING_Y + allRows.length * ROW_H + (allRows.length - 1) * ROW_GAP;

  const rowsSvg = allRows.map((items, r) => {
    const { placed, width } = layoutRow(items);
    const chips = placed
      .map((chip) => {
        const logoWidth = chip.d ? LOGO + LOGO_GAP : 0;
        const logo = chip.d
          ? `<path transform="translate(${n2(chip.x + CHIP_PAD)} ${(ROW_H - LOGO) / 2}) scale(${LOGO / 24})" fill="${theme.muted}" d="${chip.d}"/>`
          : '';
        return (
          `<rect x="${n2(chip.x)}" y=".5" width="${n2(chip.width)}" height="${ROW_H - 1}" rx="${(ROW_H - 1) / 2}" fill="${theme.glass}" stroke="${theme.line}" stroke-opacity="${theme.lineOp * 1.2}"/>` +
          logo +
          glyphs.line(chip.label, chip.x + CHIP_PAD + logoWidth, BASELINE)
        );
      })
      .join('');
    // Enough copies to cover the card however short the set is, plus one to slide into.
    const copies = Math.ceil(W / width) + 1;
    const set = `<g id="r${r}">${chips}</g>`;
    const repeats = Array.from({ length: copies - 1 }, (_, c) => `<use href="#r${r}" x="${n2(width * (c + 1))}"/>`).join('');
    const y = PADDING_Y + r * (ROW_H + ROW_GAP);
    const name = `m${r}`;
    const forward = r % 2 === 0;
    const from = forward ? 0 : -width;
    const to = forward ? -width : 0;
    return {
      css: `.${name}{animation:${name} ${n2(width / SPEED)}s linear infinite;transform:translateX(${n2(from)}px)}@keyframes ${name}{from{transform:translateX(${n2(from)}px)}to{transform:translateX(${n2(to)}px)}}`,
      svg: `<g transform="translate(0 ${y})"><g class="${name}" fill="${theme.ink}">${set}${repeats}</g></g>`,
    };
  });

  const fade = `<linearGradient id="fade"><stop offset="0" stop-color="#000"/><stop offset=".07" stop-color="#fff"/><stop offset=".93" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="edges" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>`;
  const body = [
    `<style>${rowsSvg.map((row) => row.css).join('')}@media (prefers-reduced-motion:reduce){${rowsSvg.map((_, r) => `.m${r}`).join(',')}{animation:none}}</style>`,
    `<defs>${glyphs.defs}${fade}<linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${theme.scene[0]}"/><stop offset="1" stop-color="${theme.scene[1]}"/></linearGradient></defs>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="url(#bg)"/>`,
    `<g mask="url(#edges)">${rowsSvg.map((row) => row.svg).join('')}</g>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="none" stroke="${theme.line}" stroke-opacity="${theme.lineOp}"/>`,
  ].join('');
  return svg(W, H, marqueeLabel({ rows, stack }), body);
}

export const marqueeLabel = ({ rows, stack = [] }) =>
  `Industries: ${rows[0].join(', ')}. What we build: ${rows[1].join(', ')}. Stack: ${stackItems(stack).map((s) => s.label).join(', ')}.`;
