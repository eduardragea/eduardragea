// Cyan from workflowtime.com, in a few neighbouring shades so the river has depth. Light mode
// darkens everything so it still reads on white.
export const THEMES = {
  dark: {
    accent: '#22d3ee',
    card: '#0b1118',
    dropShine: 0.4,
    emptyDot: 0.13,
    faint: '#7a8894',
    // What each activity level mixes towards, and how far: quiet days sink into the dark, busy ones glow.
    levelTo: [null, ['#0b1118', 0.5], ['#0b1118', 0.2], ['#ffffff', 0.05], ['#ffffff', 0.32]],
    glass: '#121b24',
    ink: '#eef3f6',
    line: '#ffffff',
    lineOp: 0.08,
    muted: '#9aabb6',
    river: {
      bandOpacity: 0.09,
      core: 0.62,
      edge: 0.14,
      glow: '#0ea5e9',
      glowOpacity: 0.12,
      particle: '#e6fbff',
      pulse: '#a5f3fc',
      ring: '#67e8f9',
      stops: [[0, '#0891b2'], [0.35, '#22d3ee'], [0.65, '#38bdf8'], [1, '#2dd4bf']],
    },
    scene: ['#0a1016', '#0f1a24'],
  },
  light: {
    accent: '#0891b2',
    card: '#fbfdfe',
    dropShine: 0.55,
    emptyDot: 0.16,
    faint: '#6b7b85',
    // On a light page it runs the other way: quiet days are pale, busy ones deep.
    levelTo: [null, ['#fbfdfe', 0.55], ['#fbfdfe', 0.25], ['#0b3a4a', 0.05], ['#0b3a4a', 0.32]],
    glass: '#ffffff',
    ink: '#14262e',
    line: '#14262e',
    lineOp: 0.09,
    muted: '#566870',
    river: {
      bandOpacity: 0.07,
      core: 0.72,
      edge: 0.2,
      glow: '#22d3ee',
      glowOpacity: 0.1,
      particle: '#0369a1',
      pulse: '#06b6d4',
      ring: '#0891b2',
      stops: [[0, '#0e7490'], [0.35, '#0891b2'], [0.65, '#0284c7'], [1, '#0d9488']],
    },
    scene: ['#f4fafc', '#e8f4f8'],
  },
};

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const svg = (w, h, label, body, viewBox = `0 0 ${w} ${h}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${viewBox}" role="img" aria-label="${esc(label)}">${body}</svg>`;

// The same image, stopped: the river in place, with the light standing still in it.
export const still = (image) =>
  image.replace(/<animate [^>]*\/>/g, '').replace('</svg>', '<style>*{animation:none!important}</style></svg>');
