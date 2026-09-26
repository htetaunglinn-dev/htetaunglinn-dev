// Builds the static profile SVGs (header + experience timeline) in dark and light.
// Run: node scripts/build-static.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { THEMES, FONT_SANS, FONT_MONO, esc, textWidth } from './theme.mjs';

mkdirSync('assets', { recursive: true });

/* ------------------------------------------------------------------ header */

const PROFILE = {
  kicker: '// hello, world — I’m',
  name: 'Htet Aung Linn',
  role: 'Full-Stack Software Engineer',
  chips: ['Next.js', 'Node.js', 'TypeScript', 'MongoDB', 'React', 'Angular'],
  status: 'Software Engineer @ Famoulee  ·  Remote (DE)  ·  Bangkok, GMT+7',
};

// Code window content: array of lines, each an array of [tokenType, text].
const CODE = [
  [['keyword', 'const '], ['punct', 'htet '], ['punct', '= {']],
  [['key', '  role'], ['punct', ': '], ['string', '"Full-Stack Engineer"'], ['punct', ',']],
  [['key', '  basedIn'], ['punct', ': '], ['string', '"Bangkok, TH"'], ['punct', ',']],
  [['key', '  workingAt'], ['punct', ': '], ['string', '"Famoulee (remote)"'], ['punct', ',']],
  [['key', '  stack'], ['punct', ': ['], ['string', '"Next"'], ['punct', ', '], ['string', '"Node"'], ['punct', ', '], ['string', '"TS"'], ['punct', ', '], ['string', '"Mongo"'], ['punct', '],']],
  [['key', '  yearsShipping'], ['punct', ': '], ['number', '4'], ['punct', '+,']],
  [['key', '  loves'], ['punct', ': '], ['string', '"fast, reliable UX"'], ['punct', ',']],
  [['punct', '};']],
];

function header(t) {
  const W = 1200, H = 420;
  const left = 64;
  const win = { x: 680, y: 60, w: 470, h: 300 };
  const lineH = 28, codeSize = 16, charW = codeSize * 0.6;

  // chips
  let cx = left;
  const chips = PROFILE.chips.map((c) => {
    const w = Math.round(textWidth(c, 16) + 26);
    const g = `<g transform="translate(${cx},262)"><rect width="${w}" height="34" rx="17" fill="${t.chipBg}" stroke="${t.chipBorder}"/><text x="${w / 2}" y="22.5" text-anchor="middle" font-size="16" font-weight="500" fill="${t.text}">${esc(c)}</text></g>`;
    cx += w + 8;
    return g;
  }).join('');

  // code lines with a typing reveal (SMIL, works inside <img>)
  const codeLines = CODE.map((tokens, i) => {
    const y = win.y + 78 + i * lineH;
    const len = tokens.reduce((n, [, s]) => n + s.length, 0);
    const full = Math.ceil(len * charW) + 4;
    const begin = (0.5 + i * 0.45).toFixed(2);
    const dur = Math.max(0.2, len * 0.018).toFixed(2);
    const spans = tokens.map(([k, s]) => `<tspan fill="${t.code[k]}">${esc(s).replace(/ /g, '&#160;')}</tspan>`).join('');
    return `<clipPath id="l${i}"><rect x="${win.x + 24}" y="${y - 18}" height="${lineH}" width="0"><animate attributeName="width" from="0" to="${full}" begin="${begin}s" dur="${dur}s" fill="freeze"/></rect></clipPath>
    <text x="${win.x + 24}" y="${y}" clip-path="url(#l${i})" font-family="${FONT_MONO}" font-size="${codeSize}">${spans}</text>`;
  }).join('\n');
  const lastY = win.y + 78 + (CODE.length - 1) * lineH;
  const cursorBegin = (0.5 + CODE.length * 0.45).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc" font-family="${FONT_SANS}">
  <title id="title">Htet Aung Linn — Full-Stack Software Engineer</title>
  <desc id="desc">Full-stack software engineer working with Next.js, Node.js, TypeScript and MongoDB. Software Engineer at Famoulee, working remotely from Bangkok.</desc>
  <defs>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.3" fill="${t.grid}"/></pattern>
    <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(160 40) scale(520 360)"><stop stop-color="${t.glow}" stop-opacity="${t.name === 'dark' ? 0.28 : 0.12}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1040 380) scale(460 300)"><stop stop-color="${t.glow}" stop-opacity="${t.name === 'dark' ? 0.22 : 0.10}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="nameGrad" x1="${left}" y1="0" x2="${left + 520}" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="${t.text}"/><stop offset="1" stop-color="${t.accent}"/></linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="20"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#glowA)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="${t.border}"/>

  <text x="${left}" y="112" font-family="${FONT_MONO}" font-size="17" fill="${t.accent}">${esc(PROFILE.kicker)}</text>
  <text x="${left - 2}" y="182" font-size="62" font-weight="800" letter-spacing="-1.5" fill="url(#nameGrad)">${esc(PROFILE.name)}</text>
  <text x="${left}" y="228" font-size="26" font-weight="500" fill="${t.muted}">${esc(PROFILE.role)}</text>
  ${chips}
  <g transform="translate(${left},336)">
    <circle cx="8" cy="0" r="5" fill="${t.good}"/>
    <circle cx="8" cy="0" r="5" fill="none" stroke="${t.good}" stroke-width="2"><animate attributeName="r" values="5;12" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite"/></circle>
    <text x="26" y="6" font-size="17" fill="${t.muted}">${esc(PROFILE.status).replace(/  /g, '&#160; ')}</text>
  </g>

  <!-- code window -->
  <rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="14" fill="${t.panel}" stroke="${t.border}"/>
  <path d="M${win.x} ${win.y + 44}h${win.w}" stroke="${t.border}"/>
  <circle cx="${win.x + 22}" cy="${win.y + 22}" r="6" fill="#ff5f57"/><circle cx="${win.x + 42}" cy="${win.y + 22}" r="6" fill="#febc2e"/><circle cx="${win.x + 62}" cy="${win.y + 22}" r="6" fill="#28c840"/>
  <text x="${win.x + win.w / 2}" y="${win.y + 27}" text-anchor="middle" font-family="${FONT_MONO}" font-size="14" fill="${t.faint}">htet.ts</text>
  ${codeLines}
  <rect x="${win.x + 24 + 2 * charW + 2}" y="${lastY - 15}" width="9" height="19" fill="${t.accent}" opacity="0"><set attributeName="opacity" to="1" begin="${cursorBegin}s"/><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" begin="${cursorBegin}s" repeatCount="indefinite"/></rect>
</svg>
`;
}

/* ---------------------------------------------------------------- timeline */

const JOBS = [
  { when: 'Jun 2022 – Jan 2023', company: 'Smilax Global', role: 'Mid Frontend Developer', where: 'Yangon, Myanmar' },
  { when: 'Jun 2023 – Jan 2024', company: 'ThitsaWorks', role: 'Software Engineer · Fintech', where: 'Yangon, Myanmar' },
  { when: 'Jan 2024 – Feb 2026', company: 'GoFive', role: 'Software Engineer', where: 'Bangkok, Thailand' },
  { when: 'Mar 2026 – Present', company: 'Famoulee', role: 'Software Engineer', where: 'Remote · Germany', now: true },
];

function timeline(t) {
  const W = 1200, H = 252, pad = 24, gap = 20;
  const cardW = (W - pad * 2 - gap * 3) / 4;
  const lineY = 44;
  const cards = JOBS.map((j, i) => {
    const x = pad + i * (cardW + gap);
    const cxDot = x + 28;
    const stroke = j.now ? t.primary : t.border;
    const pulse = j.now
      ? `<circle cx="${cxDot}" cy="${lineY}" r="7" fill="none" stroke="${t.primary}" stroke-width="2"><animate attributeName="r" values="7;15" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite"/></circle>`
      : '';
    const badge = j.now
      ? `<rect x="${x + cardW - 70}" y="${lineY + 38}" width="50" height="22" rx="11" fill="${t.primary}"/><text x="${x + cardW - 45}" y="${lineY + 53.5}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff" letter-spacing="0.5">NOW</text>`
      : '';
    return `<g>
      <circle cx="${cxDot}" cy="${lineY}" r="7" fill="${j.now ? t.primary : t.bg}" stroke="${j.now ? t.primary : t.faint}" stroke-width="2"/>${pulse}
      <rect x="${x + 0.5}" y="${lineY + 24.5}" width="${cardW - 1}" height="${H - lineY - 40}" rx="14" fill="${t.panel}" stroke="${stroke}"/>
      <text x="${x + 20}" y="${lineY + 54}" font-family="${FONT_MONO}" font-size="15" fill="${j.now ? t.accent : t.muted}">${esc(j.when)}</text>
      ${badge}
      <text x="${x + 20}" y="${lineY + 96}" font-size="27" font-weight="700" fill="${t.text}">${esc(j.company)}</text>
      <text x="${x + 20}" y="${lineY + 128}" font-size="18" fill="${t.text}" opacity="0.85">${esc(j.role)}</text>
      <text x="${x + 20}" y="${lineY + 162}" font-size="16" fill="${t.muted}">${esc(j.where)}</text>
    </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title" font-family="${FONT_SANS}">
  <title id="title">Experience: Smilax Global (2022–2023), ThitsaWorks (2023–2024), GoFive (2024–2026), Famoulee (2026–present)</title>
  <defs><linearGradient id="rail" x1="0" x2="1"><stop stop-color="${t.border}"/><stop offset="0.7" stop-color="${t.border}"/><stop offset="1" stop-color="${t.primary}"/></linearGradient></defs>
  <path d="M${pad + 28} ${lineY}H${W - pad}" stroke="url(#rail)" stroke-width="2"/>
  <path d="M${W - pad - 8} ${lineY - 6}l8 6-8 6" fill="none" stroke="${t.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${cards}
</svg>
`;
}

for (const t of Object.values(THEMES)) {
  writeFileSync(`assets/header-${t.name}.svg`, header(t));
  writeFileSync(`assets/experience-${t.name}.svg`, timeline(t));
}
console.log('Built header + experience SVGs');
