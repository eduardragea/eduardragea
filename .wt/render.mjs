// Draws the profile: README.md from profile.json, plus its images in light and dark under dist/.
// The workflow publishes dist/ to the output branch. Locally:
//   LOGIN=eduardragea GITHUB_TOKEN=$(gh auth token) node .wt/render.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { contributionYear } from './data.mjs';
import { heroLabel, heroSVG } from './hero.mjs';
import { marqueeLabel, marqueeSVG } from './marquee.mjs';
import { ctaPill, socialHref, socialPill } from './pills.mjs';
import { pillarsLabel, pillarsSVG } from './pillars.mjs';
import { readme } from './readme.mjs';
import { teamSlices } from './team.mjs';
import { still, THEMES } from './theme.mjs';

const { LOGIN, GITHUB_TOKEN } = process.env;
if (!LOGIN || !GITHUB_TOKEN) throw new Error('LOGIN and GITHUB_TOKEN are required');

const OUT = 'dist';
const RAW = `https://raw.githubusercontent.com/${LOGIN}/${LOGIN}/output`;
const SOCIAL_ALT = { instagram: 'Instagram', linkedin: 'LinkedIn', site: 'Website' };

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const profile = await readJson(new URL('../profile.json', import.meta.url));
const team = await readJson(new URL('./team.json', import.meta.url));
const year = await contributionYear(LOGIN, GITHUB_TOKEN);

await mkdir(OUT, { recursive: true });
const socials = Object.entries(profile.socials);
const withStill = (name, mode, image) => [
  [`${name}-${mode}.svg`, image],
  [`${name}-${mode}-still.svg`, still(image)],
];
const writes = Object.entries(THEMES).flatMap(([mode, theme]) => [
  ...withStill('hero', mode, heroSVG(year, theme)),
  ...withStill('pillars', mode, pillarsSVG(profile.pillars, theme)),
  ...withStill('marquee', mode, marqueeSVG(profile.marquee, theme)),
  ...withStill('cta', mode, ctaPill(theme, profile.cta.label)),
  ...socials.map(([key, handle]) => [`social-${key}-${mode}.svg`, socialPill(theme, key, handle)]),
  ...teamSlices(team, theme).flatMap((body, i) => withStill(`team-${i + 1}`, mode, body)),
]);
await Promise.all(writes.map(([name, body]) => writeFile(`${OUT}/${name}`, body)));

const socialLinks = socials.map(([key, handle]) => ({
  alt: `${SOCIAL_ALT[key]} ${handle}`,
  href: socialHref(key, handle),
  key,
}));
const alts = { hero: heroLabel(year.total), marquee: marqueeLabel(profile.marquee), pillars: pillarsLabel(profile.pillars) };
await writeFile('README.md', readme({ alts, profile, raw: RAW, socials: socialLinks, team }));
console.log(`${writes.length} images, ${year.total} contributions`);
