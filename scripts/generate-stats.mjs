// Generates assets/activity-{dark,light}.svg: contribution heatmap, headline
// numbers and language mix. Runs daily in GitHub Actions (see .github/workflows).
//
//   GITHUB_TOKEN=... node scripts/generate-stats.mjs          # live data
//   DATA_FILE=data/snapshot.json node scripts/generate-stats.mjs  # offline
//
// Set a PROFILE_TOKEN secret (classic PAT, read:user) if you want private
// contributions counted the same way your profile page counts them.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { THEMES, FONT_SANS, FONT_MONO, esc } from './theme.mjs';

const LOGIN = process.env.GH_LOGIN || 'htetaunglinn-dev';
const TOP_LANGS = 5;
const IGNORE_LANGS = new Set((process.env.IGNORE_LANGS || '').split(',').filter(Boolean));

/* -------------------------------------------------------------------- data */

async function fetchLive(token) {
  const query = `query($login:String!){ user(login:$login){
    contributionsCollection{ contributionCalendar{ totalContributions
      weeks{ contributionDays{ date contributionCount } } } }
    repositories(ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC, first:100){
      totalCount
      nodes{ languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } } }
  } }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const u = json.data.user;
  const days = {};
  for (const w of u.contributionsCollection.contributionCalendar.weeks)
    for (const d of w.contributionDays) days[d.date] = d.contributionCount;
  const languages = {};
  for (const r of u.repositories.nodes)
    for (const e of r.languages.edges) languages[e.node.name] = (languages[e.node.name] || 0) + e.size;
  return { days, languages, repoCount: u.repositories.totalCount };
}

async function loadData() {
  if (process.env.DATA_FILE) return JSON.parse(readFileSync(process.env.DATA_FILE, 'utf8'));
  const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Set GITHUB_TOKEN (or DATA_FILE for offline runs)');
  return fetchLive(token);
}

/* ----------------------------------------------------------------- metrics */

const fmt = (n) => n.toLocaleString('en-US');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };

function metrics({ days, languages, repoCount }) {
  const dates = Object.keys(days).sort();
  const counts = dates.map((d) => days[d]);
  const total = counts.reduce((a, b) => a + b, 0);
  const active = counts.filter((c) => c > 0).length;
  const last30 = counts.slice(-30).reduce((a, b) => a + b, 0);
  const prev30 = counts.slice(-60, -30).reduce((a, b) => a + b, 0);
  let best = { date: dates[0], count: 0 };
  dates.forEach((d) => { if (days[d] > best.count) best = { date: d, count: days[d] }; });

  // Quartile levels over non-zero days, like GitHub's own calendar.
  const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] || 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const level = (c) => (c === 0 ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4);

  const langEntries = Object.entries(languages).filter(([k]) => !IGNORE_LANGS.has(k)).sort((a, b) => b[1] - a[1]);
  const langTotal = langEntries.reduce((a, [, v]) => a + v, 0) || 1;
  const top = langEntries.slice(0, TOP_LANGS).map(([name, v]) => ({ name, pct: (v / langTotal) * 100 }));
  const otherPct = 100 - top.reduce((a, l) => a + l.pct, 0);
  if (otherPct > 0.05) top.push({ name: 'Other', pct: otherPct, other: true });

  return { dates, total, active, last30, prev30, best, level, cuts, langs: top, repoCount };
}

/* ------------------------------------------------------------------ render */

function render(t, m, updated) {
  const W = 1200, pad = 40;
  const cell = 15, gapC = 3, step = cell + gapC;

  // weeks: columns start on Sunday
  const first = new Date(m.dates[0] + 'T00:00:00Z');
  const offset = first.getUTCDay();
  const nWeeks = Math.ceil((m.dates.length + offset) / 7);
  const gridW = nWeeks * step - gapC;
  const labelW = 34;
  const gx = (W - gridW - labelW) / 2 + labelW;

  const tilesY = 84, tileH = 108;
  const gy = tilesY + tileH + 64;
  const langY = gy + 7 * step + 58;
  const H = langY + 92;

  // ---- tiles
  const delta = m.prev30 ? Math.round(((m.last30 - m.prev30) / m.prev30) * 100) : null;
  const tiles = [
    { label: 'Contributions · 12 mo', value: fmt(m.total) },
    { label: 'Last 30 days', value: fmt(m.last30), sub: delta === null ? '' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs prior 30` },
    { label: 'Active days', value: `${m.active}`, sub: `of ${m.dates.length}` },
    { label: 'Best day', value: fmt(m.best.count), sub: niceDate(m.best.date) },
    { label: 'Original repos', value: `${m.repoCount}`, sub: 'public, non-fork' },
  ];
  const tileGap = 16;
  const tileW = (W - pad * 2 - tileGap * (tiles.length - 1)) / tiles.length;
  const tilesSvg = tiles.map((tl, i) => {
    const x = pad + i * (tileW + tileGap);
    return `<g transform="translate(${x},${tilesY})">
      <rect width="${tileW}" height="${tileH}" rx="12" fill="${t.panel}" stroke="${t.border}"/>
      <text x="18" y="30" font-size="15" fill="${t.muted}">${esc(tl.label)}</text>
      <text x="18" y="72" font-size="34" font-weight="700" fill="${t.text}" letter-spacing="-0.5">${esc(tl.value)}</text>
      ${tl.sub ? `<text x="18" y="94" font-size="13" fill="${t.muted}">${esc(tl.sub)}</text>` : ''}
    </g>`;
  }).join('\n');

  // ---- heatmap
  let cells = '';
  let monthLabels = '';
  let lastMonth = -1, lastCol = -9;
  m.dates.forEach((d, i) => {
    const idx = i + offset;
    const col = Math.floor(idx / 7), row = idx % 7;
    const x = gx + col * step, y = gy + row * step;
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${t.heat[m.level(m.__days[d])]}"><title>${m.__days[d]} on ${niceDate(d)}</title></rect>`;
    const month = Number(d.slice(5, 7)) - 1;
    if (row === 0 && month !== lastMonth && col < nWeeks - 2) {
      if (col - lastCol < 3) { lastMonth = month; return; }
      monthLabels += `<text x="${x}" y="${gy - 10}" font-size="13" fill="${t.muted}">${MONTHS[month]}</text>`;
      lastMonth = month; lastCol = col;
    }
  });
  const dayLabels = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]
    .map(([r, s]) => `<text x="${gx - 8}" y="${gy + r * step + 12}" text-anchor="end" font-size="12" fill="${t.muted}">${s}</text>`).join('');
  const legendX = gx + gridW;
  const legendY = gy + 7 * step + 16;
  const legend = `<text x="${legendX - 5 * step - 8}" y="${legendY + 11}" text-anchor="end" font-size="12" fill="${t.muted}">Less</text>`
    + t.heat.map((c, i) => `<rect x="${legendX - (5 - i) * step + gapC}" y="${legendY}" width="${cell}" height="${cell}" rx="3" fill="${c}"/>`).join('')
    + `<text x="${legendX + 8}" y="${legendY + 11}" font-size="12" fill="${t.muted}">More</text>`;

  // ---- language bar (stacked, 2px surface gaps between segments)
  const barX = pad, barW = W - pad * 2, barH = 12;
  let bx = barX;
  const segs = m.langs.map((l, i) => {
    const w = Math.max(2, (l.pct / 100) * barW);
    const fill = l.other ? t.other : t.langs[i];
    const r = `<rect x="${bx}" y="${langY}" width="${Math.max(1, w - 2)}" height="${barH}" rx="4" fill="${fill}"><title>${esc(l.name)} ${l.pct.toFixed(1)}%</title></rect>`;
    bx += w;
    return r;
  }).join('');
  let lx = barX;
  const langLegend = m.langs.map((l, i) => {
    const fill = l.other ? t.other : t.langs[i];
    const label = `${l.name}`;
    const pct = `${l.pct < 1 ? l.pct.toFixed(1) : Math.round(l.pct)}%`;
    const g = `<g transform="translate(${lx},${langY + 40})"><circle cx="6" cy="-5" r="6" fill="${fill}"/><text x="18" y="0" font-size="15" fill="${t.text}">${esc(label)}<tspan fill="${t.muted}" dx="7">${pct}</tspan></text></g>`;
    lx += 18 + (label.length + pct.length) * 8.6 + 34;
    return g;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title" font-family="${FONT_SANS}">
  <title id="title">GitHub activity: ${fmt(m.total)} contributions in the last 12 months, ${m.active} active days. Top languages: ${m.langs.map((l) => `${l.name} ${l.pct.toFixed(0)}%`).join(', ')}.</title>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="${t.bg}" stroke="${t.border}"/>
  <text x="${pad}" y="54" font-size="22" font-weight="700" fill="${t.text}">GitHub activity</text>
  <text x="${W - pad}" y="54" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${t.faint}">auto-updated ${esc(updated)}</text>
  ${tilesSvg}
  ${monthLabels}${dayLabels}
  ${cells}
  ${legend}
  <text x="${pad}" y="${langY - 16}" font-size="15" fill="${t.muted}">Languages across original repos (by code size)</text>
  ${segs}
  ${langLegend}
</svg>
`;
}

/* -------------------------------------------------------------------- main */

const data = await loadData();
const m = metrics(data);
m.__days = data.days;
const updated = process.env.UPDATED_AT || new Date().toISOString().slice(0, 10);
mkdirSync('assets', { recursive: true });
for (const t of Object.values(THEMES)) writeFileSync(`assets/activity-${t.name}.svg`, render(t, m, updated));
console.log(`activity: ${m.total} contributions, ${m.active} active days, langs ${m.langs.map((l) => l.name).join('/')}`);
