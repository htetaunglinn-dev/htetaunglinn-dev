// Shared design tokens for every SVG in this profile.
// Colors follow the portfolio site (royal blue on near-black).

export const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
export const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

export const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0b0e14',
    panel: '#11151d',
    border: '#1f2633',
    grid: '#1a2030',
    text: '#f5f5f5',
    muted: '#9aa4b2',
    faint: '#5c6573',
    primary: '#4169e1',
    accent: '#7b96f2',
    chipBg: '#141b2b',
    chipBorder: '#26324d',
    good: '#3fb950',
    glow: '#4169e1',
    code: {
      keyword: '#c792ea',
      key: '#8fb1ff',
      string: '#a5e0a0',
      number: '#f5b56b',
      punct: '#9aa4b2',
    },
    // Sequential blue: on a dark surface, more = lighter (more contrast).
    heat: ['#161b26', '#103266', '#1c5cab', '#3987e5', '#86b6ef'],
    // Categorical slots 1-5 (dark steps) + neutral "Other".
    langs: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'],
    other: '#4b5261',
  },
  light: {
    name: 'light',
    bg: '#ffffff',
    panel: '#f7f8fa',
    border: '#e4e7ec',
    grid: '#eef0f4',
    text: '#0b0b0b',
    muted: '#52514e',
    faint: '#8b8f98',
    primary: '#3454b4',
    accent: '#4169e1',
    chipBg: '#f1f4fd',
    chipBorder: '#d5ddf6',
    good: '#1a7f37',
    glow: '#4169e1',
    code: {
      keyword: '#8839c9',
      key: '#2a5bd7',
      string: '#2f7d32',
      number: '#b35c00',
      punct: '#52514e',
    },
    heat: ['#eef0f4', '#b7d3f6', '#6da7ec', '#2a78d6', '#184f95'],
    langs: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
    other: '#b4b8c0',
  },
};

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Rough text width for system sans at a given size (good enough for layout).
export const textWidth = (s, size, mono = false) =>
  mono ? s.length * size * 0.6 : [...s].reduce((w, c) => w + (/[A-Z]/.test(c) ? 0.66 : /[a-z0-9]/.test(c) ? 0.54 : 0.34) * size, 0);
