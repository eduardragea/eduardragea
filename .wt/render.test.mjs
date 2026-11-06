import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withLevels } from './data.mjs';
import { droplet, heroLabel, heroSVG, route } from './hero.mjs';
import { layoutRow, marqueeLabel, marqueeSVG } from './marquee.mjs';
import { pillarsLabel, pillarsSVG } from './pillars.mjs';
import { readme } from './readme.mjs';
import { distancesAlong, riverLines, smoothPath } from './river.mjs';
import { teamSlices } from './team.mjs';
import { textPath, textWidth } from './text.mjs';
import { still, THEMES } from './theme.mjs';

const year = (() => {
  const days = [];
  for (let i = 0; i < 53 * 7; i++) {
    const date = new Date(Date.UTC(2025, 10, 2 + i)).toISOString().slice(0, 10);
    days.push({ col: Math.floor(i / 7), count: i % 3 ? (i % 40) + 1 : 0, date, row: i % 7 });
  }
  return { cols: 53, days: withLevels(days), total: days.reduce((sum, d) => sum + d.count, 0) };
})();
const activeDays = year.days.filter((d) => d.count > 0);
const pillars = [
  { detail: 'd1', icon: 'scale', title: 'Scale' },
  { detail: 'd2', icon: 'shield', title: 'Safety' },
  { detail: 'd3', icon: 'cost', title: 'Cost' },
];
const member = (name, face) => ({ face, href: 'x', name, role: 'R' });

test('busier days get bigger droplets, even with one huge outlier', () => {
  const counts = [1, 2, 3, 4, 5, 6, 7, 8, 500];
  const levels = withLevels(counts.map((count, i) => ({ col: 0, count, date: `d${i}`, row: 0 }))).map((d) => d.level);
  assert.deepEqual([...new Set(levels)].sort(), [1, 2, 3, 4]);
  assert.ok(droplet(4) > droplet(3) && droplet(3) > droplet(2) && droplet(2) > droplet(1));
});

test('a day without contributions has no droplet', () => {
  assert.equal(withLevels([{ col: 0, count: 0, date: 'a', row: 0 }, { col: 0, count: 3, date: 'b', row: 1 }])[0].level, 0);
  assert.deepEqual(withLevels([]), []);
});

test('the banner draws exactly one droplet per active day', () => {
  for (const theme of Object.values(THEMES)) {
    const image = heroSVG(year, theme);
    assert.equal((image.match(/class="o"/g) ?? []).length, activeDays.length);
    assert.doesNotMatch(image, /undefined|NaN/);
    assert.ok(image.includes(`${year.total.toLocaleString('en-US')} contributions`) || image.includes(heroLabel(year.total)));
  }
});

test('the stream visits every active day once, week by week', () => {
  const path = route(year.days, year.cols);
  assert.equal(path.length, activeDays.length);
  assert.equal(new Set(path.map((d) => d.date)).size, activeDays.length);
  const cols = path.map((d) => d.col);
  assert.deepEqual(cols, [...cols].sort((a, b) => a - b), 'weeks in date order');
  const odd = path.filter((d) => d.col === 1).map((d) => d.row);
  assert.deepEqual(odd, [...odd].sort((a, b) => b - a), 'odd weeks run upward');
  const even = path.filter((d) => d.col === 2).map((d) => d.row);
  assert.deepEqual(even, [...even].sort((a, b) => a - b), 'even weeks run downward');
});

test('distances along a curve grow from point to point and are about right for a straight line', () => {
  const distances = distancesAlong([[0, 0], [10, 0], [20, 0], [30, 0]]);
  assert.equal(distances.length, 4);
  assert.ok(Math.abs(distances[3] - 30) < 0.01);
  assert.ok(distances[1] < distances[2] && distances[2] < distances[3]);
});

test('a smooth path passes through its first and last points', () => {
  const d = smoothPath([[0, 0], [10, 5], [20, 0]]);
  assert.match(d, /^M0 0C/);
  assert.match(d, / 20 0$/);
});

test('every moment of the sway has the same path structure, or the browser could not morph it', () => {
  const [line] = riverLines({ center: (x, p) => 100 + Math.sin(x + p), count: 1, from: 0, halfWidth: () => 10, step: 28, to: 200 });
  assert.equal(line.ds.length, 3);
  assert.notEqual(line.ds[0], line.ds[1]);
  assert.equal(new Set(line.ds.map((d) => d.replace(/[^A-Z]/g, ''))).size, 1);
});

test('slices of one river meet at the seam: a shared knot lands on the same point', () => {
  const shape = { center: (x, phase) => 100 + 5 * Math.sin(x / 90 + phase), count: 3, halfWidth: () => 10, step: 28 };
  const left = riverLines({ ...shape, from: 0, to: 280 });
  const right = riverLines({ ...shape, from: 196, to: 476 });
  const knot = / 224 (-?[\d.]+)C/;
  assert.equal(left[1].ds[0].match(knot)[1], right[1].ds[0].match(knot)[1]);
});

test('text is measured and drawn from the glyph table, and an unknown character fails loudly', () => {
  assert.ok(textWidth('WorkflowTime', 'bold', 13) > 50);
  assert.match(textPath('A', 0, 0, 'sans', 10), /^M/);
  assert.throws(() => textWidth('✓', 'sans', 10), /No glyph/);
});

test('the pillars graphic describes all three and draws a badge for each', () => {
  const image = pillarsSVG(pillars, THEMES.dark);
  assert.equal((image.match(/class="halo"/g) ?? []).length, 3);
  assert.doesNotMatch(image, /undefined|NaN/);
  assert.equal(pillarsLabel(pillars), 'Scale: d1. Safety: d2. Cost: d3.');
});

test('a marquee row loops without a jump: it slides by exactly one set', () => {
  const a = layoutRow([{ label: 'One' }, { label: 'Two' }]);
  assert.equal(a.placed.length, 2);
  assert.equal(a.placed[1].x, a.placed[0].width + 10);
  assert.equal(a.width, a.placed[1].x + a.placed[1].width + 10);
  const image = marqueeSVG({ rows: [['Logistics', 'Legal'], ['Mobile apps']], stack: ['Azure'] }, THEMES.light);
  assert.doesNotMatch(image, /undefined|NaN/);
  assert.match(marqueeLabel({ rows: [['Logistics'], ['Apps']], stack: ['Azure'] }), /^Industries: Logistics\. What we build: Apps\. Stack: Python.*Azure\.$/);
});

test('each team slice shows one person, photo included, and is cut from the same scene', () => {
  const slices = teamSlices([member('Ada', 'mario.jpg'), member('Bob', 'eduard.jpg')], THEMES.dark);
  assert.equal(slices.length, 2);
  assert.match(slices[0], /viewBox="0 0 423 240"/);
  assert.match(slices[1], /viewBox="423 0 423 240"/);
  for (const s of slices) {
    assert.equal((s.match(/<image /g) ?? []).length, 1);
    assert.match(s, /data:image\/jpeg;base64,/);
    assert.doesNotMatch(s, /undefined|NaN/);
  }
});

test('readers who asked for no motion get a still copy of everything animated', () => {
  const out = readme({
    alts: { hero: 'H', marquee: 'M', pillars: 'P' },
    profile: { cta: { href: 'c', label: 'L' }, intro: ['i'], name: 'N', sections: { Experience: ['e'] } },
    raw: 'R',
    socials: [{ alt: 'a', href: 'h', key: 'site' }],
    team: [{ href: 'x', name: 'A', role: 'B' }],
  });
  for (const name of ['hero', 'pillars', 'marquee', 'cta', 'team-1']) {
    assert.ok(out.includes(`media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcset="R/${name}-dark-still.svg"`), name);
    assert.ok(out.includes(`media="(prefers-reduced-motion: reduce)" srcset="R/${name}-light-still.svg"`), name);
  }
  assert.ok(!out.includes('social-site-dark-still'), 'pills without motion need no still copy');
  assert.doesNotMatch(out, /undefined/);
});

test('a still copy stops every kind of motion', () => {
  const stopped = still(pillarsSVG(pillars, THEMES.dark));
  assert.match(stopped, /animation:none!important/);
  assert.doesNotMatch(stopped, /<animate /);
  assert.match(stopped, /<path id="l0"/);
});
