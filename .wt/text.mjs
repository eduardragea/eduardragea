// Text drawn as paths, so it looks the same on every machine and no image depends on a font.
import { readFileSync } from 'node:fs';
import { esc } from './theme.mjs';

const FONTS = JSON.parse(readFileSync(new URL('./glyphs.json', import.meta.url), 'utf8'));
const num = (n) => String(Math.round(n * 100) / 100);

function glyph(font, ch) {
  const g = FONTS[font].glyphs[ch];
  if (!g) throw new Error(`No glyph for ${JSON.stringify(ch)} in ${font}`);
  return g;
}

export function textWidth(str, font, size, track = 0) {
  const units = [...str].reduce((sum, ch) => sum + glyph(font, ch).adv, 0);
  return (units * size) / FONTS[font].upm + track * [...str].length;
}

function glyphPath(ops, x, y, scale) {
  return ops
    .map(([cmd, ...pts]) => {
      const coords = pts.map((v, i) => num(i % 2 === 0 ? x + v * scale : y - v * scale));
      return cmd + coords.join(' ');
    })
    .join('');
}

export function textPath(str, x, y, font, size, track = 0) {
  const scale = size / FONTS[font].upm;
  let pen = x;
  let d = '';
  for (const ch of str) {
    const g = glyph(font, ch);
    d += glyphPath(g.ops, pen, y, scale);
    pen += g.adv * scale + track;
  }
  return d;
}

export function text(str, { x, y, font = 'sans', size = 13, fill, anchor = 'start', track = 0, attrs = '' }) {
  const width = textWidth(str, font, size, track);
  const left = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  return `<path fill="${esc(fill)}" d="${textPath(str, left, y, font, size, track)}"${attrs}/>`;
}

// For text that changes frame by frame: one <path> per character, reused through <use>, so 53
// frames of a counter cost a few KB instead of a hundred.
export function sharedGlyphs(chars, font, size, prefix) {
  const scale = size / FONTS[font].upm;
  const ids = new Map([...new Set(chars)].filter((c) => c !== ' ').map((c, i) => [c, `${prefix}${i}`]));
  const defs = [...ids].map(([c, id]) => `<path id="${id}" d="${glyphPath(glyph(font, c).ops, 0, 0, scale)}"/>`).join('');
  const line = (str, x, y) => {
    let pen = x;
    let out = '';
    for (const ch of str) {
      if (ch !== ' ') out += `<use href="#${ids.get(ch)}" x="${num(pen)}" y="${num(y)}"/>`;
      pen += glyph(font, ch).adv * scale;
    }
    return out;
  };
  return { defs, line };
}
