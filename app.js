/* Resit Relief app: views, storage and the add-receipt flow. */
(function () {
  const { reliefsFor, YEAR_NOTES } = window.Reliefs;
  const E = window.Engine;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rm = (n, dp) => 'RM' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: dp ?? (n % 1 ? 2 : 0), maximumFractionDigits: dp ?? 2 });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';

  // ---------- Icons (24px line icons, drawn for this app) ----------
  const P = {
    bag: '<path d="M5 9h14l-1 10.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M9 13a3 3 0 0 0 6 0"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="m12 7.5 3.5 2.5-1.3 4h-4.4L8.5 10z"/><path d="M12 7.5V3.3M15.5 10l4-1.5M14.2 14l2.4 3.6M9.8 14l-2.4 3.6M8.5 10l-4-1.5"/>',
    ticket: '<path d="m14.5 3.5 6 6-2 2a1.8 1.8 0 0 0-2.5 2.5l-6.5 6.5-6-6L10 8a1.8 1.8 0 0 0 2.5-2.5z"/><path d="m12 9 1 1m1.5 1.5 1 1" stroke-dasharray="1 2"/>',
    medkit: '<rect x="3.5" y="7" width="17" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M12 10.5v6M9 13.5h6"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14.5c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2"/><path d="M9 10h.01M15 10h.01" stroke-width="2.4"/>',
    drop: '<path d="M12 3.5s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/><path d="M10 17a2.5 2.5 0 0 0 2.5 1"/>',
    cap: '<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5z"/><path d="M6.5 11.6V16c1.6 1.6 3.4 2.4 5.5 2.4s3.9-.8 5.5-2.4v-4.4M21.5 9.5v5"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0M12 3v-.5"/>',
    piggy: '<path d="M5 11a6 5 0 0 1 11-2.8L19 7v4l1.5 1v3H18l-1.5 2.5V20h-3v-1.5h-3V20h-3v-2.5A5.5 5.5 0 0 1 5 13z"/><path d="M14 11h.01" stroke-width="2.4"/>',
    bolt: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="m17 4 .7 1.6 1.6.7-1.6.7L17 8.6l-.7-1.6-1.6-.7 1.6-.7z"/>',
    receipt: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    paste: '<rect x="6" y="4.5" width="12" height="16" rx="2"/><path d="M9.5 4.5V3.5h5v1M9.5 10h5M9.5 13.5h5M9.5 17h3"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
    inbox: '<path d="M3.5 13.5 6 5h12l2.5 8.5V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 13.5H8.5l1 2h5l1-2h5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/>',
    chevl: '<path d="m14.5 6-6 6 6 6"/>',
    chevr: '<path d="m9.5 6 6 6-6 6"/>',
    file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 15.5h5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5"/>',
    checkc: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m8 12.5 2.6 2.5L16 9.5" stroke="#fff" stroke-width="2"/>',
  };
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.receipt}</svg>`;

  // ---------- Storage (local IndexedDB or Supabase, see store.js) ----------
  const DB = window.Store;
  const CLOUD = DB.mode === 'cloud';

  // ---------- State ----------
  const state = {
    year: 2026, receipts: [], view: 'overview', filter: 'all', query: '', platform: '', month: '', showAll: false,
    selected: new Set(), user: null, ready: false,
    profile: { kids: true, parents: true, income: 72000 },
  };
  const VIEWS = ['overview', 'receipts', 'spending', 'reliefs', 'account'];
  const ALIASES = { claims: 'receipts', you: 'account', discover: 'reliefs' };
  const PLATFORMS = ['Shopee', 'TikTok Shop', 'Lazada', 'Shein'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearReceipts = () => state.receipts.filter(r => (r.date || '').startsWith(String(state.year)));
  const visibleReliefs = () => reliefsFor(state.year).filter(r => state.showAll || !r.needs || state.profile[r.needs]);
  const reliefById = id => reliefsFor(state.year).find(r => r.id === id) || reliefsFor(2026).find(r => r.id === id);
  const hasProof = r => !!(r.image || r.proofPath);

  const STATUS = {
    claimable: ['ok', 'Claimable'], review: ['warn', 'To check'], rejected: ['bad', 'Not claimable'],
  };
  const statusChip = r => { const [c, t] = STATUS[r.status] || STATUS.review; return `<span class="chip ${c}">${t}</span>`; };

  // ---------- Example data (clearly marked) ----------
  function examples() {
    const ex = (merchant, date, amount, relief, sub, status, platform, text) =>
      ({ id: 'ex-' + uid(), example: true, merchant, date, amount, relief, sub, status, platform, source: platform ? 'email' : 'camera', text, created: Date.now() });
    return [
      ex('MPH Bookstores', '2026-06-03', 59.9, 'lifestyle', null, 'claimable', 'TikTok Shop', 'TikTok Shop\nSeller: MPH Bookstores\nAtomic Habits (paperback) RM 59.90\nTotal payment RM 59.90\n3 Jun 2026'),
      ex('TM Unifi', '2026-02-01', 139, 'lifestyle', null, 'claimable', 'JomPAY', 'TM Unifi\nUnifi 300Mbps Internet\nAmount Due RM 139.00\n01/02/2026'),
      ex('TM Unifi', '2026-03-01', 139, 'lifestyle', null, 'claimable', 'JomPAY', 'TM Unifi\nUnifi 300Mbps Internet\nAmount Due RM 139.00\n01/03/2026'),
      ex('Amazon Kindle Store', '2026-04-11', 62.1, 'lifestyle', null, 'claimable', 'Amazon', 'Amazon Kindle e-book order\nTotal RM 62.10\n11 Apr 2026'),
      ex('Xiaomi Official Store', '2026-08-08', 699, 'lifestyle', null, 'claimable', 'Lazada', 'Lazada\nSeller: Xiaomi Official Store\nRedmi Pad SE 8+128GB RM 699.00\nOrder Total: RM 699.00\nPlaced on 08 Aug 2026'),
      ex('Decathlon Official Store', '2026-03-14', 89.8, 'sports', null, 'claimable', 'Shopee', 'Shopee\nSold by: Decathlon Official Store\nKipsta badminton racket x1 RM 89.90\nOrder Total RM 89.80\n14/03/2026'),
      ex('Arena Badminton Court', '2026-05-09', 60.2, 'sports', null, 'claimable', null, 'Arena Badminton\nCourt booking 2 hrs\nTotal RM 60.20\n09/05/2026'),
      ex('Aquaria KLCC', '2026-01-18', 160, 'tourism', null, 'claimable', null, 'Aquaria KLCC\nAdult admission x2\nTotal RM 160.00\n18/01/2026'),
      ex('Zoo Negara Malaysia', '2026-09-21', 90, 'tourism', null, 'claimable', null, 'Zoo Negara\nAdmission x2 RM 90.00\nTotal RM 90.00\n21 Sep 2026'),
      ex('Istana Budaya', '2026-07-26', 350, 'tourism', null, 'claimable', null, 'Istana Budaya\nTeater muzikal tickets x2\nTotal RM 350.00\n26/07/2026'),
      ex('Klinik Pergigian Senyum', '2026-05-02', 150, 'medical', 'dental', 'claimable', null, 'KLINIK PERGIGIAN SENYUM\nScaling & polishing\nTOTAL RM 150.00\n2026-05-02'),
      ex('Klinik Mediviron', '2026-10-06', 120, 'medical', 'vaccine', 'claimable', null, 'Klinik Mediviron\nInfluenza vaccination\nTotal RM 120.00\n06/10/2026'),
      ex('Pantai Premier Pathology', '2026-08-15', 180, 'medical', 'checkup', 'claimable', null, 'Health screening package\nTotal RM 180.00\n15/08/2026'),
      ex('Tadika Ceria', '2026-01-05', 500, 'childcare', null, 'claimable', null, 'TADIKA CERIA (KPM reg.)\nYuran Januari\nJumlah RM 500.00\n05/01/2026'),
      ex('Tadika Ceria', '2026-02-05', 500, 'childcare', null, 'claimable', null, 'TADIKA CERIA\nYuran Februari\nJumlah RM 500.00\n05/02/2026'),
      ex('Tadika Ceria', '2026-03-05', 500, 'childcare', null, 'claimable', null, 'TADIKA CERIA\nYuran Mac\nJumlah RM 500.00\n05/03/2026'),
      ex('Spectra Baby Official', '2026-04-20', 370, 'breastfeeding', null, 'claimable', 'Shopee', 'Shopee\nSold by: Spectra Baby Official\nSpectra S1+ breast pump\nOrder Total RM 370.00\n20/04/2026'),
      ex('Lembaga Zakat Selangor', '2026-04-15', 1200, 'zakat', null, 'claimable', 'FPX', 'Lembaga Zakat Selangor\nZakat Pendapatan\nJumlah RM 1,200.00\n15/04/2026'),
      ex('Guardian Pharmacy', '2026-10-30', 48.5, 'medical', 'checkup', 'review', 'Touch \'n Go', 'Guardian\nCOVID self-test kit x2 RM 29.80\nVitamin C RM 18.70\nTotal RM 48.50\n30/10/2026'),
      ex('99 Speedmart', '2026-11-02', 52.3, 'none', null, 'rejected', null, '99 Speedmart\nMilo 2kg 39.90\nTotal 52.30\n02/11/2026'),
      ex('SHEIN', '2026-09-03', 52.8, 'none', null, 'rejected', 'Shein', 'SHEIN\nFloral wrap dress x1 RM 45.90\nOrder Total RM 52.80\nOrder Date: Sep 3, 2026'),
      ex('SHEIN', '2026-11-11', 134.6, 'none', null, 'rejected', 'Shein', 'SHEIN 11.11 sale\n3 items\nOrder Total RM 134.60\nNov 11, 2026'),
      ex('Mr DIY Official', '2026-06-18', 120.4, 'none', null, 'rejected', 'Shopee', 'Shopee\nSold by: Mr DIY Official\nStorage boxes x4\nOrder Total RM 120.40\n18/06/2026'),
      ex('Shopee Supermarket', '2026-10-10', 88, 'none', null, 'rejected', 'Shopee', 'Shopee\nShopee Supermarket 10.10\nOrder Total RM 88.00\n10/10/2026'),
      ex('Snack Station', '2026-07-12', 35.5, 'none', null, 'rejected', 'TikTok Shop', 'TikTok Shop\nSeller: Snack Station\nKerepek pedas x3\nTotal payment RM 35.50\n12 Jul 2026'),
      ex('Lazada Home', '2026-11-11', 219, 'none', null, 'rejected', 'Lazada', 'Lazada\nAir fryer 5L\nOrder Total: RM 219.00\nPlaced on 11 Nov 2026'),
    ];
  }

  // ---------- Small builders ----------
  const DOODLE = {
    arrow: '<svg class="doodle d-arrow" viewBox="0 0 140 90" aria-hidden="true"><path d="M8 84c6-22 2-46-6-40-8 6 10 18 30 6 22-13 52-34 96-44"/><path d="m116 2 14 4-9 11"/></svg>',
    squiggle: '<svg class="doodle d-squiggle" viewBox="0 0 130 30" aria-hidden="true"><path d="M2 22c14 0 16-14 28-14s10 18 24 14 12-20 26-12 14 14 30 4"/></svg>',
    blob: '<svg class="doodle d-blob" viewBox="0 0 90 90" aria-hidden="true"><path d="M70 10c18 14 16 44-4 62S16 84 14 62s20-18 30-34S54-2 70 10z"/></svg>',
  };
  const fingerprint = '<svg class="fp" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8a22 22 0 0 0-22 22M32 8a22 22 0 0 1 22 22v6M18 30a14 14 0 0 1 28 0v8c0 6 2 10 4 13M24 30a8 8 0 0 1 16 0v10c0 7 3 12 6 15M32 30v12c0 8 3 13 7 17M26 38c0 8 1 14 5 20M18 38c0 6 1 11 3 15M12 36v2"/></svg>';
  const pageHead = (title, sub, extra = '') => `<div class="page-head"><div><h1 class="page-title">${title}</h1><p class="page-sub">${sub}</p></div>${extra}</div>`;

  function totals() {
    const rs = yearReceipts();
    const sum = E.summarize(rs, reliefsFor(state.year));
    const totalRelief = reliefsFor(state.year).filter(r => r.kind !== 'rebate').reduce((a, r) => a + sum[r.id].claimed, 0);
    const zakat = sum.zakat ? sum.zakat.claimed : 0;
    const inc = +state.profile.income || 0, base = Math.max(0, inc - 9000);
    const taxBefore = E.taxOn(base), taxAfter = E.taxOn(Math.max(0, base - totalRelief));
    const saved = inc ? Math.min(taxBefore, taxBefore - taxAfter + Math.min(zakat, taxAfter)) : null;
    const limitSum = visibleReliefs().filter(r => r.limit).reduce((a, r) => a + r.limit, 0);
    const spent = rs.reduce((a, r) => a + (r.amount || 0), 0);
    const online = rs.filter(r => PLATFORMS.includes(r.platform)).reduce((a, r) => a + (r.amount || 0), 0);
    return { rs, sum, totalRelief, saved, limitSum, spent, online, review: rs.filter(r => r.status === 'review').length };
  }

  function monthly(rs) {
    const m = MONTHS.map((name, i) => ({ i, name, key: `${state.year}-${String(i + 1).padStart(2, '0')}`, total: 0, claimable: 0, count: 0, proofs: 0, by: {} }));
    for (const r of rs) {
      const i = +(r.date || '').slice(5, 7) - 1; if (!(i >= 0)) continue;
      const row = m[i]; row.total += r.amount || 0; row.count++; if (hasProof(r) || r.text) row.proofs++;
      if (r.status === 'claimable' && r.relief && r.relief !== 'none') row.claimable += r.amount || 0;
      const p = PLATFORMS.includes(r.platform) ? r.platform : 'Other'; row.by[p] = (row.by[p] || 0) + (r.amount || 0);
    }
    return m;
  }

  // Single-series bar chart, drawn to scale, with a hover title per bar.
  function barChart(months, opts = {}) {
    const W = 640, H = opts.h || 200, padL = 44, padB = 26, padT = 12, innerW = W - padL - 8, innerH = H - padB - padT;
    const max = Math.max(...months.map(m => m.total), 1);
    const step = niceStep(max / 3), top = Math.ceil(max / step) * step;
    const bw = innerW / months.length, barW = Math.min(26, bw - 8);
    const nowIdx = state.year === new Date().getFullYear() ? new Date().getMonth() : 11;
    let g = '';
    for (let v = 0; v <= top; v += step) { const y = padT + innerH - v / top * innerH; g += `<line x1="${padL}" x2="${W - 8}" y1="${y}" y2="${y}" class="grid-l"/><text x="${padL - 8}" y="${y + 4}" class="ax" text-anchor="end">${v >= 1000 ? (v / 1000) + 'k' : v}</text>`; }
    const bars = months.map((m, i) => {
      const h = m.total / top * innerH, x = padL + i * bw + (bw - barW) / 2, y = padT + innerH - h;
      return `<g class="bar-g" data-month="${m.key}"><rect x="${padL + i * bw}" y="${padT}" width="${bw}" height="${innerH}" fill="transparent"/>
        ${m.total ? `<path d="M${x},${padT + innerH} V${y + 4} q0,-4 4,-4 h${barW - 8} q4,0 4,4 V${padT + innerH} Z" class="${i === nowIdx ? 'bar-now' : 'bar-m'}"/>` : ''}
        <text x="${padL + i * bw + bw / 2}" y="${H - 8}" class="ax" text-anchor="middle">${m.name[0]}${opts.full ? m.name.slice(1) : ''}</text>
        <title>${m.name} ${state.year}: ${rm(m.total, 2)} across ${m.count} receipt${m.count === 1 ? '' : 's'}</title></g>`;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly spending, YA ${state.year}">${g}${bars}</svg>`;
  }
  function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x || 1))); const n = x / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }

  function platformBars(rs) {
    const by = {}; let max = 0;
    for (const p of [...PLATFORMS, 'Other']) by[p] = { total: 0, count: 0 };
    for (const r of rs) { const p = PLATFORMS.includes(r.platform) ? r.platform : 'Other'; by[p].total += r.amount || 0; by[p].count++; }
    for (const p in by) max = Math.max(max, by[p].total);
    return `<div class="hbars">${Object.entries(by).map(([p, v]) => `<button class="hbar" data-platform="${esc(p)}"><span class="hb-top"><span>${esc(p === 'Other' ? 'Shops, bills & others' : p)}</span><b class="num">${rm(v.total, 2)}</b></span>
      <span class="bar"><i style="width:${v.total ? Math.max(2, v.total / (max || 1) * 100) : 0}%"></i></span><small>${v.count} receipt${v.count === 1 ? '' : 's'}</small></button>`).join('')}</div>`;
  }

  // ---------- Rendering ----------
  function setView(v) {
    v = ALIASES[v] || v;
    state.view = VIEWS.includes(v) ? v : 'overview';
    document.querySelectorAll('.nav a[data-view]').forEach(a => a.dataset.view === state.view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    render(); window.scrollTo(0, 0);
  }

  function topbar() {
    const pending = yearReceipts().filter(r => r.status === 'review').length;
    const links = [['overview', 'Overview'], ['receipts', 'Receipts'], ['spending', 'Spending'], ['reliefs', 'Reliefs'], ['account', 'Account']]
      .map(([k, t]) => `<a href="#${k}" data-view="${k}" ${state.view === k ? 'aria-current="page"' : ''}>${t}</a>`).join('');
    return `<header class="header">
      <a class="brand" href="#overview"><span class="mark"><i></i><i></i></span>Resit Relief</a>
      <nav class="toplinks" aria-label="Sections">${links}</nav>
      <div class="tools">
        <label class="ya"><select id="year" aria-label="Year of assessment">${[2025, 2026, 2027].map(y => `<option value="${y}" ${y === state.year ? 'selected' : ''}>YA ${y}</option>`).join('')}</select></label>
        <button class="icon-btn" data-act="go-review" aria-label="${pending} receipts to check">${icon('bell')}${pending ? '<span class="dot"></span>' : ''}</button>
        <a class="avatar" href="#account" aria-label="Account">${state.user && state.user.email ? esc(state.user.email[0].toUpperCase()) : icon('user')}</a>
        <button class="btn sm hide-sm" data-act="add">${icon('camera')}Add receipt</button>
      </div></header>`;
  }

  function render() {
    const v = $('#view');
    if (CLOUD && !state.user) { v.innerHTML = landing(); document.body.classList.add('signed-out'); return; }
    document.body.classList.remove('signed-out');
    v.innerHTML = topbar() + ({ overview, receipts, spending, reliefs, account })[state.view]();
    if (state.view === 'overview') wireCarousel();
    if (state.view === 'receipts') syncBulkBar();
  }

  // Public landing page (cloud mode, signed out).
  function landing() {
    return `<header class="header"><a class="brand" href="#"><span class="mark"><i></i><i></i></span>Resit Relief</a>
      <div class="tools"><button class="btn sm" data-act="focus-signin">Sign in</button></div></header>
      <section class="hero">
        <div class="hero-copy">${DOODLE.arrow}
          <div class="chips"><span class="float-chip"><b>15</b><em>LHDN reliefs</em></span><span class="float-chip"><b>4</b><em>shops tracked</em></span><span class="float-chip"><b>0</b><em>lost receipts</em></span></div>
          <h1>Every receipt, <span class="swash">ready for</span> LHDN</h1>
          <p class="lede">Snap paper receipts, forward Shopee, TikTok Shop, Lazada and Shein order emails, and see how much tax relief you have left for the year. Free while in beta.</p>
          <form class="signin" id="signin-form">
            <label class="f">Email<input id="signin-email" type="email" required autocomplete="email" placeholder="you@email.com"></label>
            <button class="btn" type="submit">Send me a sign-in link</button>
            <button class="btn ghost" type="button" data-act="google">Continue with Google</button>
            <small>No password needed. We email you a one-time link.</small>
          </form>${DOODLE.squiggle}
        </div>
        <div class="visual" aria-hidden="true">
          <div class="vcard v-dark"><span class="vb"><span class="mark"><i></i><i></i></span>Resit</span><div><small>Tax saved</small><br><strong>RM1,632</strong></div></div>
          <div class="vcard v-mint"><span class="vb"><span class="mark"><i></i><i></i></span>Resit</span><div><small>Receipts kept</small><br><strong>26</strong></div></div>
          <div class="vcard v-glass"><span class="vb"><span class="mark"><i></i><i></i></span>Resit Relief</span>${fingerprint}<div class="lines"><i></i><i></i><i></i><i></i></div>
            <span class="stamp">YA 2026</span><div class="total"><small>Relief backed by receipts</small><strong>RM3,929</strong></div></div>
        </div>
      </section>
      <section class="section"><div class="pair three">
        <div class="panel"><span class="tile">${icon('camera')}</span><h3>Snap or forward</h3><p>Photos are read on your phone. Order and bill emails file themselves.</p></div>
        <div class="panel"><span class="tile">${icon('shield')}</span><h3>Sorted for LHDN</h3><p>Each receipt goes to the right relief, with limits that update when LHDN changes them.</p></div>
        <div class="panel"><span class="tile">${icon('download')}</span><h3>Proof on demand</h3><p>Monthly tables and a one-tap ZIP of every receipt if LHDN ever asks.</p></div>
      </div></section>`;
  }

  function kpi(label, value, foot, cls = '', act = '') {
    return `<${act ? `button data-act="${act}"` : 'div'} class="kpi ${cls}"><span class="kpi-label">${label}</span><b class="kpi-value num">${value}</b><span class="kpi-foot">${foot}</span></${act ? 'button' : 'div'}>`;
  }

  function overview() {
    const t = totals();
    const reliefs = visibleReliefs();
    const hasEx = state.receipts.some(r => r.example);
    const recent = t.rs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
    const usedPct = t.limitSum ? Math.round(t.totalRelief / t.limitSum * 100) : 0;
    const months = monthly(t.rs);
    const near = reliefs.filter(r => r.limit).map(r => ({ r, pct: t.sum[r.id].claimed / r.limit })).filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3);
    const meta = window.Reliefs.META[state.year] || {};
    const name = state.user && state.user.email ? state.user.email.split('@')[0] : '';

    const slides = [
      `<div class="slide"><div class="slide-head"><h3>Monthly spending</h3><a class="link" href="#spending">Open table</a></div>${barChart(months)}<p class="slide-foot">Highest month: <b>${(() => { const m = months.slice().sort((a, b) => b.total - a.total)[0]; return m.total ? `${m.name}, ${rm(m.total, 2)}` : 'none yet'; })()}</b></p></div>`,
      `<div class="slide"><div class="slide-head"><h3>Online shopping</h3><a class="link" href="#spending">Details</a></div>${platformBars(t.rs)}</div>`,
      `<div class="slide"><div class="slide-head"><h3>Closest to the limit</h3><a class="link" href="#reliefs">All reliefs</a></div>
        ${near.length ? `<div class="subbars">${near.map(x => `<div><div class="top"><span>${esc(x.r.name)}</span><span class="num">${rm(t.sum[x.r.id].claimed)} of ${rm(x.r.limit)}</span></div><div class="bar"><i style="width:${Math.max(3, Math.min(100, x.pct * 100))}%"></i></div></div>`).join('')}</div>` : '<p>Add receipts to see your progress.</p>'}
        <p class="slide-foot">Room left before the year ends: <b class="num">${rm(Math.max(0, t.limitSum - t.totalRelief))}</b></p></div>`,
      `<div class="slide"><div class="slide-head"><h3>LHDN rules</h3><span class="chip ok">Version ${meta.version || 1}</span></div>
        <p>${esc(meta.note || 'Limits from the PwC Malaysian Tax Booklet 2026/2027, YA 2026 column.')}</p>
        <p class="slide-foot">${esc(YEAR_NOTES[state.year])} When LHDN changes a relief, the new limits appear here and on every card automatically.</p></div>`,
    ];

    return `<section class="dash-head">
        <div><p class="eyebrow">YA ${state.year} at a glance</p><h1 class="dash-title">${name ? `Hi ${esc(name)},` : 'Hello,'} you have <span class="swash">${rm(t.totalRelief)}</span> in relief</h1></div>
        <div class="ctas"><button class="btn" data-act="add">Scan a receipt</button><button class="link" data-act="paste">Paste an e-receipt</button></div>
      </section>
      ${hasEx ? `<div class="banner">${icon('receipt')}<p>You're seeing example receipts. Add your own, then clear these in Account.</p></div>` : ''}
      <section class="kpis" aria-label="Key numbers">
        ${kpi('Relief found', rm(t.totalRelief), `${usedPct}% of your limits`, 'kpi-hero')}
        ${kpi('Est. tax saved', t.saved == null ? '–' : rm(Math.round(t.saved)), 'set income in Account')}
        ${kpi('Total spent', rm(Math.round(t.spent)), `${t.rs.length} receipts kept`)}
        ${kpi('Online shopping', rm(Math.round(t.online)), 'Shopee, TikTok, Lazada, Shein')}
        ${kpi('To check', t.review, t.review ? 'tap to review' : 'all sorted', t.review ? 'kpi-warn' : '', 'go-review')}
      </section>
      <section class="section carousel" aria-roledescription="carousel" aria-label="Highlights">
        <div class="car-head"><h2 class="h2">Highlights</h2><div class="car-nav"><button class="icon-btn ring" data-act="car-prev" aria-label="Previous">${icon('chevl')}</button><button class="icon-btn ring" data-act="car-next" aria-label="Next">${icon('chevr')}</button></div></div>
        <div class="car-track" id="car-track">${slides.join('')}</div>
        <div class="dots" id="car-dots">${slides.map((_, i) => `<button data-act="car-go" data-i="${i}" aria-label="Slide ${i + 1}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div>
      </section>
      <section class="section glow">
        <div class="section-title"><h2>Your reliefs</h2><p>How much of each LHDN limit your receipts already cover. Tap one to see its receipts.</p></div>
        <div class="grid">${reliefs.map(r => reliefCard(r, t.sum[r.id])).join('')}</div>
        <div style="text-align:center;margin-top:18px"><button class="link" data-act="toggle-all">${state.showAll ? 'Show only reliefs that apply to me' : 'Show all reliefs'}</button></div>
      </section>
      <section class="section"><div class="pair">
        <div class="panel"><div class="panel-top"><h3>Recent receipts</h3><a class="link" href="#receipts">See all</a></div>
          ${recent.length ? `<div class="list tilt">${recent.map(receiptRow).join('')}</div>` : `<div class="empty">No receipts yet for YA ${state.year}.</div>`}</div>
        <div class="panel">${DOODLE.blob}
          <div class="check">${icon('checkc')}<span>Auto-import e-receipts<small>Shopee, TikTok Shop, Lazada, Shein, bills and clinics</small></span></div>
          <p>${t.rs.filter(r => r.source === 'email' || r.source === 'paste').length} of ${t.rs.length} receipts this year came in without a photo. Forward order emails and the rest file themselves.</p>
          <div class="bar" style="margin:6px 0"><i style="width:${Math.max(3, usedPct)}%"></i></div>
          <div class="minis"><div class="mini"><small>Limits used ${usedPct}%</small><b class="num">${rm(t.totalRelief)}</b></div><div class="mini"><small>Total limits</small><b class="num">${rm(t.limitSum)}</b></div></div>
          <div class="btns"><a class="btn ghost" href="#account">Connect your shops</a></div>
        </div></div></section>`;
  }

  function reliefCard(r, s) {
    if (r.kind === 'rebate') {
      return `<button class="card" data-relief="${r.id}"><span class="top"><span class="tile">${icon(r.icon)}</span><span class="pct">rebate</span></span>
        <span class="name">${esc(r.name)}</span><span class="amt num">${rm(s.claimed)}</span>
        <span class="rebate">paid · comes off tax payable</span></button>`;
    }
    const pct = Math.min(100, (s.claimed / r.limit) * 100);
    return `<button class="card" data-relief="${r.id}" aria-label="${esc(r.name)}: ${rm(s.claimed)} of ${rm(r.limit)}">
      <span class="top"><span class="tile">${icon(r.icon)}</span><span class="pct num">${Math.round(pct)}%</span></span>
      <span class="name">${esc(r.name)}</span>
      <span class="amt num">${rm(s.claimed)}</span>
      <span class="bar"><i style="width:${s.claimed ? Math.max(pct, 3) : 0}%"></i></span>
      <span class="of num">of ${rm(r.limit)}</span></button>`;
  }

  function receiptRow(r) {
    const rel = reliefById(r.relief);
    const meta = [fmtDate(r.date), r.platform].filter(Boolean).join(' | ');
    const cls = { claimable: 'amt-ok', rejected: 'amt-bad', review: 'amt-warn' }[r.status] || 'amt-warn';
    const label = (r.example ? 'Example · ' : '') + ((STATUS[r.status] || STATUS.review)[1]);
    return `<button class="row" data-receipt="${r.id}">
      <span class="tile sm ${rel ? '' : 't-grey'}">${icon(rel ? rel.icon : 'receipt')}</span>
      <span class="mid"><b>${esc(r.merchant)}</b><small>${esc(meta)}${rel ? ' · ' + esc(rel.name) : ''}</small></span>
      <span class="right"><b class="num ${cls}">${r.status === 'rejected' ? '' : '+'}${rm(r.amount, 2)}</b><small>${esc(label)}</small></span></button>`;
  }

  // ---------- Receipts (history table, bulk download) ----------
  function filteredReceipts() {
    const q = state.query.toLowerCase();
    return yearReceipts()
      .filter(r => state.filter === 'all' || r.status === state.filter)
      .filter(r => !state.platform || (state.platform === 'Other' ? !PLATFORMS.includes(r.platform) : r.platform === state.platform))
      .filter(r => !state.month || (r.date || '').startsWith(state.month))
      .filter(r => !q || (r.merchant + ' ' + (r.text || '') + ' ' + (r.platform || '') + ' ' + (r.notes || '')).toLowerCase().includes(q))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function receipts() {
    const rs = filteredReceipts();
    const counts = s => yearReceipts().filter(r => s === 'all' || r.status === s).length;
    const seg = [['all', 'All'], ['review', 'To check'], ['claimable', 'Claimable'], ['rejected', 'Not claimable']]
      .map(([k, t]) => `<button data-filter="${k}" aria-pressed="${state.filter === k}">${t} <span class="num">${counts(k)}</span></button>`).join('');
    const allSel = rs.length && rs.every(r => state.selected.has(r.id));
    const total = rs.reduce((a, r) => a + (r.amount || 0), 0);
    const rows = rs.map(r => {
      const rel = reliefById(r.relief);
      const cls = { claimable: 'amt-ok', rejected: 'amt-bad', review: 'amt-warn' }[r.status] || '';
      return `<tr data-receipt="${r.id}" class="${state.selected.has(r.id) ? 'sel' : ''}">
        <td class="c-sel" data-stop><input type="checkbox" class="pick" data-id="${r.id}" aria-label="Select ${esc(r.merchant)}" ${state.selected.has(r.id) ? 'checked' : ''}></td>
        <td class="c-date num">${fmtDate(r.date)}</td>
        <td class="c-merch"><b>${esc(r.merchant)}</b><small>${esc([fmtDate(r.date), r.platform, rel ? rel.name : ''].filter(Boolean).join(' · '))}</small></td>
        <td class="c-plat">${esc(r.platform || '–')}</td>
        <td class="c-rel">${esc(rel ? rel.name : r.relief === 'none' ? 'Not claimable' : '–')}</td>
        <td class="c-amt num ${cls}">${rm(r.amount, 2)}</td>
        <td class="c-stat">${r.example ? '<span class="chip ex">Example</span>' : statusChip(r)}</td>
        <td class="c-proof">${hasProof(r) ? `<span class="proof-ic" title="Photo or PDF attached">${icon(r.proofType === 'application/pdf' || (r.image || '').startsWith('data:application/pdf') ? 'file' : 'image')}</span>` : r.text ? `<span class="proof-ic" title="Receipt text kept">${icon('paste')}</span>` : '–'}</td></tr>`;
    }).join('');
    const monthOpts = MONTHS.map((m, i) => { const k = `${state.year}-${String(i + 1).padStart(2, '0')}`; return `<option value="${k}" ${state.month === k ? 'selected' : ''}>${m} ${state.year}</option>`; }).join('');
    return `<div class="wide">${pageHead('Receipts', 'Every receipt you kept this year, with its proof. Select some or all to download them in one ZIP.',
        `<div class="btns"><button class="btn ghost" data-act="export">${icon('download')}CSV</button><button class="btn" data-act="add">${icon('camera')}Add</button></div>`)}
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Status">${seg}</div>
        <div class="filters">
          <input class="search" id="q" type="search" placeholder="Search merchant, item or shop" value="${esc(state.query)}">
          <select id="f-platform" class="select" aria-label="Shop"><option value="">All shops</option>${[...PLATFORMS, 'Other'].map(p => `<option ${state.platform === p ? 'selected' : ''} value="${esc(p)}">${p === 'Other' ? 'Other shops & bills' : p}</option>`).join('')}</select>
          <select id="f-month" class="select" aria-label="Month"><option value="">All months</option>${monthOpts}</select>
        </div>
      </div>
      ${rs.length ? `<div class="table-wrap"><table class="rtable">
        <thead><tr><th class="c-sel"><input type="checkbox" id="pick-all" aria-label="Select all shown" ${allSel ? 'checked' : ''}></th><th class="c-date">Date</th><th class="c-merch">Merchant</th><th class="c-plat">Shop</th><th class="c-rel">Relief</th><th class="c-amt">Amount</th><th class="c-stat">Status</th><th class="c-proof">Proof</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td class="c-sel"></td><td class="c-date"></td><td class="c-merch"><b>${rs.length} receipts</b></td><td class="c-plat"></td><td class="c-rel"></td><td class="c-amt num"><b>${rm(total, 2)}</b></td><td class="c-stat"></td><td class="c-proof"></td></tr></tfoot>
      </table></div>` : `<div class="empty">No receipts match. Clear the filters or tap Add to snap one.</div>`}
      <div class="bulkbar" id="bulkbar" hidden><span id="bulk-count">0 selected</span><button class="btn" data-act="zip-selected">${icon('download')}Download ZIP</button><button class="btn ghost" data-act="csv-selected">CSV</button><button class="link" data-act="clear-sel">Clear</button></div>
      </div>`;
  }
  function syncBulkBar() {
    const bar = $('#bulkbar'); if (!bar) return;
    bar.hidden = state.selected.size === 0;
    $('#bulk-count').textContent = `${state.selected.size} selected`;
  }

  // ---------- Spending (monthly table with proof) ----------
  function spending() {
    const rs = yearReceipts(); const months = monthly(rs);
    const tot = months.reduce((a, m) => { a.total += m.total; a.claimable += m.claimable; a.count += m.count; a.proofs += m.proofs; for (const p of [...PLATFORMS, 'Other']) a.by[p] = (a.by[p] || 0) + (m.by[p] || 0); return a; }, { total: 0, claimable: 0, count: 0, proofs: 0, by: {} });
    const cols = [...PLATFORMS, 'Other'];
    const cell = v => v ? rm(v, 2) : '<span class="muted">–</span>';
    const rows = months.map(m => `<tr class="${m.count ? '' : 'empty-row'}"><th scope="row">${m.name}</th><td class="num"><b>${cell(m.total)}</b></td><td class="num amt-ok">${cell(m.claimable)}</td>
      ${cols.map(p => `<td class="num col-p">${cell(m.by[p])}</td>`).join('')}
      <td class="num">${m.count ? `${m.proofs}/${m.count}` : '–'}</td>
      <td class="acts">${m.count ? `<button class="link" data-act="month-open" data-month="${m.key}">View</button><button class="icon-btn" data-act="zip-month" data-month="${m.key}" aria-label="Download ${m.name} receipts">${icon('download')}</button>` : ''}</td></tr>`).join('');
    return `<div class="wide">${pageHead('Spending', `Where your money went in ${state.year}, month by month, with the receipt proof behind every figure.`,
        `<button class="btn ghost" data-act="zip-year">${icon('download')}Download all ${state.year}</button>`)}
      <section class="kpis four">
        ${kpi('Total spent', rm(Math.round(tot.total)), `${tot.count} receipts`, 'kpi-hero')}
        ${kpi('Claimable', rm(Math.round(tot.claimable)), 'counts toward reliefs')}
        ${kpi('Online shopping', rm(Math.round(PLATFORMS.reduce((a, p) => a + (tot.by[p] || 0), 0))), '4 marketplaces')}
        ${kpi('With proof', `${tot.proofs}/${tot.count}`, 'photo, PDF or e-receipt text')}
      </section>
      <div class="pair section" style="margin-top:22px">
        <div class="panel"><div class="panel-top"><h3>Monthly spending</h3><span class="muted">tap a bar to see that month</span></div>${barChart(months, { h: 220 })}</div>
        <div class="panel"><div class="panel-top"><h3>By shop</h3><span class="muted">tap to filter receipts</span></div>${platformBars(rs)}</div>
      </div>
      <div class="panel section" style="margin-top:22px"><div class="panel-top"><h3>Monthly table</h3><span class="muted">Proof = receipts with a photo, PDF or e-receipt text</span></div>
        <div class="table-wrap"><table class="mtable">
          <thead><tr><th scope="col">Month</th><th scope="col">Spent</th><th scope="col">Claimable</th>${cols.map(p => `<th scope="col" class="col-p">${p === 'Other' ? 'Others' : p}</th>`).join('')}<th scope="col">Proof</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th scope="row">Total</th><td class="num"><b>${rm(tot.total, 2)}</b></td><td class="num amt-ok"><b>${rm(tot.claimable, 2)}</b></td>${cols.map(p => `<td class="num col-p"><b>${cell(tot.by[p])}</b></td>`).join('')}<td class="num"><b>${tot.proofs}/${tot.count}</b></td><td></td></tr></tfoot>
        </table></div></div></div>`;
  }

  // ---------- Reliefs (limits, guide, rule updates) ----------
  function reliefs() {
    const t = totals(); const meta = window.Reliefs.META[state.year] || {};
    const guide = reliefsFor(state.year).map(r => `<details class="guide"><summary><span class="tile sm">${icon(r.icon)}</span><span>${esc(r.name)}</span><em class="num">${r.limit ? rm(r.limit) : 'rebate'}</em></summary>
      <div><span>${esc(r.covers)}</span><span><b>Proof:</b> ${esc(r.evidence)}</span>${r.sub ? `<span><b>Sub-limits:</b> ${r.sub.map(s => `${esc(s.name)} ${rm(s.limit)}`).join(', ')}</span>` : ''}</div></details>`).join('');
    return `<div class="wide">${pageHead('Reliefs', `Your YA ${state.year} relief limits, what each one covers, and the proof LHDN expects.`)}
      <div class="panel rules-panel"><div class="head"><span class="tile">${icon('shield')}</span><div><h3>LHDN rules, version ${meta.version || 1}</h3><p>${esc(meta.note || 'Limits from the PwC Malaysian Tax Booklet 2026/2027 (YA 2026 column).')}</p></div><span class="chip ok">Up to date</span></div>
        <p>LHDN's relief pages are checked every day. When a limit changes, the new rules are reviewed and published here, and every card and total updates on your next visit. ${esc(YEAR_NOTES[state.year])}</p></div>
      <div class="grid section" style="margin-top:20px">${visibleReliefs().map(r => reliefCard(r, t.sum[r.id])).join('')}</div>
      <div style="text-align:center;margin-top:18px"><button class="link" data-act="toggle-all">${state.showAll ? 'Show only reliefs that apply to me' : 'Show all reliefs'}</button></div>
      <div class="pair section">
        <div class="panel"><h3>Relief guide YA ${state.year}</h3>${guide}</div>
        <div class="panel"><h3>About LHDN integration</h3>
          <p>LHDN has no public API for checking or filing personal reliefs, so filing in MyTax e-Filing stays with you. Resit Relief gives you the totals per relief to type in, and the proof if you're audited.</p>
          <p>e-Invoices that shops issue with your tax number (TIN) can be pulled from MyInvois. Most shop receipts are consolidated e-invoices without your name, so ask the cashier or use the QR on the receipt to request one for big purchases.</p>
          <p class="muted">Keep receipts for 7 years after the year of assessment.</p></div>
      </div></div>`;
  }

  // ---------- Account (profile, shop connections, data) ----------
  const SHOP_FILTERS = {
    'Shopee': 'from:(shopee.com.my) subject:(order OR receipt OR "payment confirmed")',
    'TikTok Shop': 'from:(tiktok.com) subject:(order OR receipt)',
    'Lazada': 'from:(lazada.com.my) subject:(order OR receipt OR invoice)',
    'Shein': 'from:(shein.com) subject:(order OR "order confirmation")',
    'Bills': 'from:(tm.com.my OR tnb.com.my OR unifi.com.my OR maxis.com.my) subject:(bill OR statement OR receipt)',
  };
  function account() {
    const p = state.profile;
    const addr = state.inbound || (CLOUD ? 'Loading…' : 'r-yourcode@in.resitrelief.my');
    const shops = Object.entries(SHOP_FILTERS).map(([shop, q]) => `<div class="shop">
      <div class="shop-top"><b>${shop}</b><span class="chip ${CLOUD ? 'ok' : 'ex'}">${CLOUD ? 'Ready to forward' : 'Needs an account'}</span></div>
      <div class="mono">${esc(q)}</div><button class="link" data-act="copy-text" data-text="${esc(q)}">Copy Gmail search</button></div>`).join('');
    return `<div class="wide">${pageHead('Account', CLOUD ? `Signed in as ${esc(state.user && state.user.email)}` : 'Running in local mode: receipts are saved in this browser only.',
        CLOUD ? '<button class="btn ghost" data-act="signout">Sign out</button>' : '')}
      <div class="pair">
        <div class="panel"><h3>About you</h3>
          <label class="toggle"><span>I have children</span><input type="checkbox" id="p-kids" ${p.kids ? 'checked' : ''}></label>
          <label class="toggle"><span>I pay for my parents' medical care</span><input type="checkbox" id="p-parents" ${p.parents ? 'checked' : ''}></label>
          <label class="f">Yearly income before tax (RM)<input id="p-income" type="number" inputmode="numeric" min="0" step="1000" value="${esc(p.income)}"></label>
          <p class="muted">Used only for the tax-saved estimate, together with the RM9,000 self relief.</p></div>
        <div class="panel"><h3>Your data</h3>
          <p>${CLOUD ? 'Receipts and proof files are stored in your private account. Only you can see them.' : 'Receipts are saved in this browser. Sign-in and cloud backup switch on once the app is connected to its database.'}</p>
          <div class="btns"><button class="btn" data-act="zip-year">${icon('download')}Download all receipts</button><button class="btn ghost" data-act="export">CSV</button><button class="btn ghost" data-act="copy">Copy relief summary</button></div>
          <div class="btns">${state.receipts.some(r => r.example) ? '<button class="btn ghost" data-act="clear-ex">Clear example receipts</button>' : '<button class="btn ghost" data-act="load-ex">Load example receipts</button>'}
          <button class="btn danger" data-act="wipe">Delete all receipts</button></div><div id="wipe-confirm"></div></div>
      </div>
      <div class="panel section" style="margin-top:20px">${DOODLE.blob}
        <div class="head"><span class="tile">${icon('mail')}</span><div><h3>Connect Shopee, TikTok Shop, Lazada and Shein</h3><p>Track what you spend on each shop by forwarding their order emails to your private receipts address.</p></div></div>
        <div class="fwd"><span class="muted">Your receipts address</span><div class="mono big-mono">${esc(addr)}</div><button class="link" data-act="copy-text" data-text="${esc(addr)}">Copy address</button></div>
        <ol class="steps"><li>In Gmail, paste a search below into the search bar and press the filter icon.</li><li>Choose <b>Create filter</b>, tick <b>Forward it to</b> and pick your receipts address (confirm it once).</li><li>New orders now file themselves. Past orders: select them in Gmail and forward them once.</li></ol>
        <div class="shops">${shops}</div>
        <p class="muted">Why email? Shopee, TikTok Shop, Lazada and Shein only offer APIs to sellers, not to shoppers, and logging in with your password to scrape orders breaks their terms. Their order emails carry the same details safely.</p>
      </div></div>`;
  }

  // ---------- Carousel ----------
  function wireCarousel() {
    const track = $('#car-track'); if (!track) return;
    const dots = [...document.querySelectorAll('#car-dots button')];
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / (track.firstElementChild.getBoundingClientRect().width + 16));
      dots.forEach((d, j) => d.toggleAttribute('aria-current', j === Math.min(i, dots.length - 1)));
    }, { passive: true });
  }
  function carouselGo(dir, index) {
    const track = $('#car-track'); if (!track) return;
    const w = track.firstElementChild.getBoundingClientRect().width + 16;
    if (index != null) track.scrollTo({ left: index * w, behavior: 'smooth' });
    else track.scrollBy({ left: dir * w, behavior: 'smooth' });
  }

  // ---------- Sheets ----------
  function openSheet(html) {
    closeSheet();
    const s = document.createElement('div');
    s.className = 'scrim'; s.id = 'scrim';
    s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    s.addEventListener('click', e => { if (e.target === s) closeSheet(); });
    document.body.appendChild(s); document.body.style.overflow = 'hidden';
    return s.firstElementChild;
  }
  function closeSheet() { const s = $('#scrim'); if (s) s.remove(); document.body.style.overflow = ''; }
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }

  function addSheet() {
    openSheet(`<h2>Add a receipt</h2><p class="lead">The photo or email is kept as your proof.</p><div class="opts">
      <button class="opt" data-act="camera"><span class="tile sm">${icon('camera')}</span><div><b>Take a photo</b><small>Paper receipt, clinic slip, tadika resit</small></div></button>
      <button class="opt" data-act="upload"><span class="tile sm">${icon('image')}</span><div><b>Upload image or PDF</b><small>Screenshot, e-invoice PDF, bill</small></div></button>
      <button class="opt" data-act="paste"><span class="tile sm">${icon('paste')}</span><div><b>Paste an e-receipt</b><small>Shopee, TikTok Shop, Lazada, bill email</small></div></button>
      <button class="opt" data-act="manual"><span class="tile sm">${icon('pen')}</span><div><b>Type it in</b><small>No receipt to hand</small></div></button></div>`);
  }

  function pasteSheet() {
    openSheet(`<h2>Paste an e-receipt</h2><p class="lead">Copy the order details from the Shopee or TikTok Shop app, or the body of a receipt email, and paste it here.</p>
      <div class="form"><label class="f">Receipt text<textarea id="paste-text" placeholder="Shopee&#10;Sold by: Decathlon Official Store&#10;Kipsta badminton racket RM 89.90&#10;Order Total RM 89.80&#10;14/03/2026"></textarea></label>
      <button class="btn block" data-act="read-paste">Read receipt</button></div>`);
    setTimeout(() => $('#paste-text') && $('#paste-text').focus(), 50);
  }

  // Review form, used for every new or edited receipt.
  function reviewSheet(draft, note) {
    const reliefs = reliefsFor(state.year);
    const s = draft.suggestion;
    const opts = `<option value="">Choose a category</option>` + reliefs.map(r => `<option value="${r.id}" ${draft.relief === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')
      + `<option value="none" ${draft.relief === 'none' ? 'selected' : ''}>Not claimable (everyday spending)</option>`;
    const sheet = openSheet(`<h2>${draft.id ? 'Edit receipt' : 'Check the details'}</h2>
      <p class="lead">${esc(note || 'Fix anything that was read wrong, then save.')}</p>
      <div class="form">
        ${draft.image ? (draft.image.startsWith('data:application/pdf') ? `<div class="mono">PDF attached as proof (${esc(draft.fileName || 'document')})</div>` : `<img class="preview" src="${draft.image}" alt="Receipt photo">`) : ''}
        ${s && s.relief ? `<div class="suggest"><span>Suggested: <b>${esc(s.relief === 'none' ? 'Not claimable' : (reliefById(s.relief) || {}).name)}</b> · ${Math.round(s.confidence * 100)}% sure</span>
          <span class="conf"><i style="width:${s.confidence * 100}%"></i></span><span>${esc(s.reason)}</span></div>` : ''}
        ${draft.isEInvoice ? '<span class="chip info">LHDN e-invoice detected</span>' : ''}
        <label class="f">Merchant<input id="r-merchant" value="${esc(draft.merchant)}" autocomplete="off"></label>
        <div class="two"><label class="f">Date<input id="r-date" type="date" value="${esc(draft.date)}"></label>
          <label class="f">Amount (RM)<input id="r-amount" type="number" inputmode="decimal" step="0.01" min="0" value="${draft.amount ?? ''}"></label></div>
        <label class="f">Relief category<select id="r-relief">${opts}</select></label>
        <div id="sub-wrap"></div>
        <label class="toggle" id="parent-wrap" hidden><span>This was for my parent</span><input type="checkbox" id="r-parent"></label>
        <label class="f">Notes<input id="r-notes" value="${esc(draft.notes)}" placeholder="e.g. for Aisyah, 2 tickets"></label>
        ${draft.text ? `<details><summary style="color:var(--ink-3);font-size:13px;cursor:pointer">Text read from the receipt</summary><div class="mono rawtext">${esc(draft.text)}</div></details>` : ''}
        <button class="btn block" data-act="save">Save receipt</button>
      </div>`);
    sheet._draft = draft;
    const syncSub = () => {
      const r = reliefById($('#r-relief').value);
      $('#sub-wrap').innerHTML = r && r.sub ? `<label class="f">Type<select id="r-sub"><option value="">Other ${esc(r.name.toLowerCase())}</option>${r.sub.map(x => `<option value="${x.id}" ${draft.sub === x.id ? 'selected' : ''}>${esc(x.name)} (up to ${rm(x.limit)})</option>`).join('')}</select></label>` : '';
      $('#parent-wrap').hidden = $('#r-relief').value !== 'medical';
    };
    $('#r-relief').addEventListener('change', syncSub); syncSub();
    $('#r-parent').addEventListener('change', e => { if (e.target.checked) { $('#r-relief').value = 'parents'; draft.sub = null; syncSub(); } });
  }

  async function saveDraft() {
    const sheet = $('.sheet'); const d = sheet._draft;
    const relief = $('#r-relief').value || null;
    const amount = parseFloat($('#r-amount').value);
    if (!$('#r-merchant').value.trim() || !(amount >= 0) || !$('#r-date').value) { toast('Add the merchant, date and amount first'); return; }
    const conf = d.suggestion ? d.suggestion.confidence : 0;
    const userChanged = d.suggestion && relief !== d.suggestion.relief;
    const r = {
      ...d, id: d.id || uid(), merchant: $('#r-merchant').value.trim(), date: $('#r-date').value, amount,
      relief, sub: ($('#r-sub') && $('#r-sub').value) || null, notes: $('#r-notes').value.trim(), created: d.created || Date.now(),
    };
    // A person choosing the category counts as checked. A guess under 70% asks for a second look.
    r.status = !relief ? 'review' : relief === 'none' ? 'rejected' : (d.id || userChanged || conf >= 0.7 ? 'claimable' : 'review');
    delete r.suggestion;
    await DB.put(r);
    state.receipts = state.receipts.filter(x => x.id !== r.id).concat(r);
    if (!r.date.startsWith(String(state.year))) state.year = +r.date.slice(0, 4) || state.year;
    closeSheet(); render(); toast(r.status === 'claimable' ? 'Saved to ' + (reliefById(r.relief) || {}).name : 'Saved');
  }

  function draftFromText(text, extra = {}) {
    const p = E.parseReceipt(text);
    const suggestion = E.categorize(p);
    return { merchant: p.merchant, date: p.date || new Date().toISOString().slice(0, 10), amount: p.total, platform: p.platform,
      isEInvoice: p.isEInvoice, einvoiceUuid: p.einvoiceUuid, text: p.text, relief: suggestion.relief, sub: suggestion.sub, suggestion, ...extra };
  }

  // ---------- Photos and OCR ----------
  function downscale(file, max = 1600) {
    return new Promise((res, rej) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => rej(new Error('That image could not be opened.'));
      img.src = url;
    });
  }
  const readAsDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });

  // OCR runs fully on the phone with Tesseract.js, served from vendor/ocr so no receipt
  // image ever leaves the device and no outside CDN is needed.
  const OCR_BASE = new URL('vendor/ocr/', location.href).href;
  let tesseractLoading = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return tesseractLoading ||= new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = OCR_BASE + 'tesseract.min.js';
      s.onload = () => res(window.Tesseract); s.onerror = () => { tesseractLoading = null; rej(new Error('OCR library could not load')); };
      document.head.appendChild(s);
    });
  }
  let workerP = null, progressCb = () => {};
  async function ocr(dataUrl, onProgress) {
    progressCb = onProgress;
    const T = await loadTesseract();
    workerP ||= T.createWorker('eng', 1, {
      workerPath: OCR_BASE + 'worker.min.js', corePath: OCR_BASE,
      // The language file is stored as .wasm so static hosts serve it as binary. Tesseract asks for
      // `${langPath}/eng.traineddata.gz`, so the query string swallows that suffix.
      langPath: OCR_BASE + 'eng-traineddata.wasm?file=',
      logger: m => { if (m.status === 'recognizing text') progressCb(m.progress); },
    }).catch(e => { workerP = null; throw e; });
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('OCR took too long')), 90000));
    const worker = await Promise.race([workerP, timeout]);
    const out = await Promise.race([worker.recognize(dataUrl), timeout]);
    return out.data.text;
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.type === 'application/pdf') {
      if (file.size > 4e6) { toast('PDF is over 4 MB. Try a screenshot instead.'); return; }
      const image = await readAsDataURL(file);
      reviewSheet({ image, fileName: file.name, merchant: file.name.replace(/\.pdf$/i, ''), date: new Date().toISOString().slice(0, 10), source: 'upload' },
        'PDF saved as proof. Text reading for PDFs comes later, so fill in the details.');
      return;
    }
    let image;
    try { image = await downscale(file); } catch (e) { toast(e.message); return; }
    const sheet = openSheet(`<h2>Reading your receipt</h2><img class="preview" src="${image}" alt="Receipt photo">
      <div class="progress"><div class="conf"><i id="ocr-bar" style="width:4%"></i></div><span id="ocr-msg">Loading the text reader…</span></div>`);
    try {
      const text = await ocr(image, p => { const b = $('#ocr-bar'); if (b) { b.style.width = Math.max(4, p * 100) + '%'; $('#ocr-msg').textContent = 'Reading text… ' + Math.round(p * 100) + '%'; } });
      if (!sheet.isConnected) return;
      reviewSheet(draftFromText(text, { image, source: 'camera' }));
    } catch (e) {
      if (!sheet.isConnected) return;
      reviewSheet({ image, source: 'camera', date: new Date().toISOString().slice(0, 10) },
        'The text reader could not run here, so fill in the details. The photo is saved as your proof.');
    }
  }

  // ---------- Detail sheets ----------
  function reliefSheet(id) {
    const r = reliefById(id); const rs = yearReceipts().filter(x => x.relief === id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const s = E.summarize(rs, [r])[id];
    const subs = r.sub ? `<div class="subbars">${r.sub.map(x => { const v = s.sub[x.id] || 0; return `<div><div class="top"><span>${esc(x.name)}</span><span class="num">${rm(Math.min(v, x.limit))} of ${rm(x.limit)}${v > x.limit ? ' · capped' : ''}</span></div><div class="bar"><i style="width:${v ? Math.max(3, Math.min(100, v / x.limit * 100)) : 0}%"></i></div></div>`; }).join('')}</div>` : '';
    openSheet(`<div class="panel" style="border:0;padding:0"><div class="head"><span class="tile lg">${icon(r.icon)}</span><div><h2>${esc(r.name)}</h2>
      <p class="num">${r.limit ? `${rm(s.claimed)} of ${rm(r.limit)} · ${rm(Math.max(0, r.limit - s.claimed))} left` : `${rm(s.claimed)} paid`}</p></div></div>
      ${r.limit ? `<div class="bar ${s.claimed >= r.limit ? 'full' : ''}"><i style="width:${s.claimed ? Math.max(3, Math.min(100, s.claimed / r.limit * 100)) : 0}%"></i></div>` : ''}
      ${subs}<p>${esc(r.covers)}</p><p><b>Proof to keep:</b> ${esc(r.evidence)}</p></div>
      <div class="month">${rs.length} receipt${rs.length === 1 ? '' : 's'} in YA ${state.year}</div>
      ${rs.length ? `<div class="list">${rs.map(receiptRow).join('')}</div>` : `<div class="empty">Nothing yet. Snap a receipt and it lands here.</div>`}`);
  }

  function receiptSheet(id) {
    const r = state.receipts.find(x => x.id === id); if (!r) return;
    const rel = reliefById(r.relief);
    openSheet(`<div class="panel"><div class="head"><span class="tile lg ${rel ? '' : 't-grey'}">${icon(rel ? rel.icon : 'receipt')}</span>
      <div><h2>${esc(r.merchant)}</h2><p class="num">${rm(r.amount, 2)} · ${fmtDate(r.date)}</p></div>${r.example ? '<span class="chip ex">Example</span>' : statusChip(r)}</div>
      <div id="proof-slot">${hasProof(r) ? '<div class="progress">Loading proof…</div>' : ''}</div>
      <dl class="kv"><dt>Relief</dt><dd>${esc(rel ? rel.name : r.relief === 'none' ? 'Not claimable' : 'Not set')}</dd>
        ${r.sub && rel && rel.sub ? `<dt>Type</dt><dd>${esc((rel.sub.find(x => x.id === r.sub) || {}).name || r.sub)}</dd>` : ''}
        ${r.platform ? `<dt>Shop / paid via</dt><dd>${esc(r.platform)}</dd>` : ''}
        ${r.source ? `<dt>Added by</dt><dd>${esc({ camera: 'Photo', upload: 'Upload', paste: 'Pasted e-receipt', email: 'Forwarded email', manual: 'Typed in', myinvois: 'MyInvois e-invoice' }[r.source] || r.source)}</dd>` : ''}
        ${r.isEInvoice ? `<dt>e-Invoice</dt><dd>${esc(r.einvoiceUuid || 'Yes')}</dd>` : ''}
        ${r.notes ? `<dt>Notes</dt><dd>${esc(r.notes)}</dd>` : ''}</dl>
      ${r.text ? `<details ${hasProof(r) ? '' : 'open'}><summary class="muted" style="cursor:pointer">Receipt text</summary><div class="mono rawtext">${esc(r.text)}</div></details>` : ''}
      <div class="btns">${r.status === 'review' ? `<button class="btn" data-act="approve" data-id="${r.id}">Looks right</button>` : ''}
        ${hasProof(r) ? `<button class="btn ghost" data-act="proof-dl" data-id="${r.id}">${icon('download')}Proof</button>` : ''}
        <button class="btn ghost" data-act="edit" data-id="${r.id}">Edit</button>
        <button class="btn danger" data-act="del" data-id="${r.id}">Delete</button></div><div id="del-confirm"></div></div>`);
    if (hasProof(r)) DB.proofUrl(r).then(url => {
      const slot = $('#proof-slot'); if (!slot) return;
      const isPdf = r.proofType === 'application/pdf' || (r.image || '').startsWith('data:application/pdf');
      const isHtml = (r.proofType || '').includes('html');
      slot.innerHTML = !url ? '' : isPdf || isHtml ? `<a class="mono" href="${url}" target="_blank" rel="noopener">${icon(isPdf ? 'file' : 'mail')} Open ${isPdf ? 'PDF' : 'email'}: ${esc(r.fileName || 'proof')}</a>` : `<img class="preview" src="${url}" alt="Receipt photo">`;
    });
  }

  function monthSheet(key) {
    const rs = yearReceipts().filter(r => (r.date || '').startsWith(key)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const total = rs.reduce((a, r) => a + (r.amount || 0), 0);
    const label = new Date(key + '-01T00:00:00').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
    openSheet(`<h2>${label}</h2><p class="lead">${rs.length} receipts · ${rm(total, 2)} spent · ${rs.filter(r => hasProof(r) || r.text).length} with proof</p>
      <div class="list">${rs.map(receiptRow).join('')}</div>
      <div class="btns" style="margin-top:16px"><button class="btn" data-act="zip-month" data-month="${key}">${icon('download')}Download ${label} (.zip)</button></div>`);
  }

  // ---------- Export ----------
  function csv(list = yearReceipts()) {
    const rows = [['Date', 'Merchant', 'Amount (RM)', 'Relief', 'Type', 'Status', 'Shop / paid via', 'Source', 'Has proof', 'e-Invoice UUID', 'Notes']];
    list.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(r => {
      const rel = reliefById(r.relief);
      rows.push([r.date, r.merchant, (r.amount || 0).toFixed(2), rel ? rel.name : r.relief || '', r.sub || '', (STATUS[r.status] || [])[1] || '', r.platform || '', r.source || '', hasProof(r) ? 'yes' : (r.text ? 'text' : 'no'), r.einvoiceUuid || '', r.notes || '']);
    });
    return rows.map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n');
  }
  function summaryText() {
    const sum = E.summarize(yearReceipts(), reliefsFor(state.year));
    return `Tax reliefs YA ${state.year}\n` + reliefsFor(state.year).filter(r => sum[r.id].count)
      .map(r => `${r.name}: ${rm(sum[r.id].claimed, 2)}${r.limit ? ' of ' + rm(r.limit) : ' (rebate)'} from ${sum[r.id].count} receipt(s)`).join('\n');
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied'); }
    catch { openSheet(`<h2>Copy this</h2><p class="lead">Select the text and copy it.</p><textarea class="mono" style="width:100%;min-height:240px" readonly>${esc(text)}</textarea>`); }
  }

  // ---------- Bulk download ----------
  let jszipP = null;
  const loadJSZip = () => window.JSZip ? Promise.resolve(window.JSZip) : (jszipP ||= new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'vendor/jszip.min.js'; s.onload = () => res(window.JSZip); s.onerror = () => { jszipP = null; rej(new Error('ZIP tool could not load')); }; document.head.appendChild(s);
  }));
  const safe = s => String(s || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'receipt';
  function saveBlob(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function zipReceipts(list, name) {
    if (!list.length) return toast('Nothing to download');
    toast(`Preparing ${list.length} receipts…`);
    try {
      const JSZip = await loadJSZip(); const zip = new JSZip();
      for (const r of list) {
        const base = `${(r.date || 'undated').slice(0, 7)}/${r.date || 'undated'}_${safe(r.merchant)}_${(r.amount || 0).toFixed(2)}`;
        const blob = await DB.proofBlob(r).catch(() => null);
        if (blob) {
          const ext = blob.type.includes('pdf') ? 'pdf' : blob.type.includes('html') ? 'html' : blob.type.includes('png') ? 'png' : 'jpg';
          zip.file(`${base}.${ext}`, blob);
        }
        if (r.text) zip.file(`${base}${blob ? '_text' : ''}.txt`, r.text);
      }
      zip.file('receipts.csv', csv(list));
      zip.file('README.txt', `Resit Relief export, YA ${state.year}\nOne folder per month. Each file is named date_merchant_amount.\nreceipts.csv lists every receipt with its relief and status.\n`);
      saveBlob(await zip.generateAsync({ type: 'blob' }), name);
      toast('Download started. If nothing appears, open the app from its own web address.');
    } catch (e) { toast(e.message || 'Download failed'); }
  }

  // ---------- Events ----------
  document.addEventListener('click', async e => {
    if (e.target.closest('[data-stop]') && !e.target.closest('input')) return;
    if (e.target.matches('input.pick, #pick-all')) return; // handled on change
    const t = e.target.closest('[data-act],[data-relief],[data-receipt],[data-filter],[data-platform],.bar-g'); if (!t) return;
    if (t.classList.contains('bar-g')) { state.month = t.dataset.month; state.filter = 'all'; return setView('receipts'); }
    if (t.dataset.relief) return reliefSheet(t.dataset.relief);
    if (t.dataset.receipt) return receiptSheet(t.dataset.receipt);
    if (t.dataset.filter) { state.filter = t.dataset.filter; return render(); }
    if (t.dataset.platform && !t.dataset.act) { state.platform = t.dataset.platform; state.filter = 'all'; state.month = ''; return setView('receipts'); }
    const id = t.dataset.id;
    switch (t.dataset.act) {
      case 'inbox': return pasteSheet();
      case 'add': return addSheet();
      case 'camera': closeSheet(); return $('#camera').click();
      case 'upload': closeSheet(); return $('#upload').click();
      case 'paste': return pasteSheet();
      case 'manual': return reviewSheet({ date: new Date().toISOString().slice(0, 10), source: 'manual' }, 'Type in what you remember. Add a photo later if you find the receipt.');
      case 'read-paste': {
        const text = $('#paste-text').value.trim(); if (!text) return toast('Paste the receipt text first');
        return reviewSheet(draftFromText(text, { source: 'paste' }));
      }
      case 'save': return saveDraft();
      case 'go-review': state.filter = 'review'; state.platform = ''; state.month = ''; return setView('receipts');
      case 'toggle-all': state.showAll = !state.showAll; return render();
      case 'car-prev': return carouselGo(-1);
      case 'car-next': return carouselGo(1);
      case 'car-go': return carouselGo(0, +t.dataset.i);
      case 'approve': { const r = state.receipts.find(x => x.id === id); r.status = 'claimable'; await DB.put(r); closeSheet(); render(); return toast('Marked as claimable'); }
      case 'edit': { const r = state.receipts.find(x => x.id === id); return reviewSheet({ ...r }); }
      case 'proof-dl': { const r = state.receipts.find(x => x.id === id); const b = await DB.proofBlob(r); if (b) saveBlob(b, `${r.date}_${safe(r.merchant)}.${b.type.includes('pdf') ? 'pdf' : 'jpg'}`); return; }
      case 'del': $('#del-confirm').innerHTML = `<div class="banner"><p>Delete this receipt and its proof?</p><button class="btn danger" data-act="del-yes" data-id="${id}">Delete</button></div>`; return;
      case 'del-yes': await DB.del(id); state.receipts = state.receipts.filter(x => x.id !== id); state.selected.delete(id); closeSheet(); render(); return toast('Deleted');
      case 'export': saveBlob(new Blob([csv(yearReceipts())], { type: 'text/csv' }), `receipts-YA${state.year}.csv`); return toast('CSV download started');
      case 'csv-selected': saveBlob(new Blob([csv(state.receipts.filter(r => state.selected.has(r.id)))], { type: 'text/csv' }), `receipts-selected.csv`); return;
      case 'zip-selected': return zipReceipts(state.receipts.filter(r => state.selected.has(r.id)), `receipts-${state.selected.size}.zip`);
      case 'zip-month': return zipReceipts(yearReceipts().filter(r => (r.date || '').startsWith(t.dataset.month)), `receipts-${t.dataset.month}.zip`);
      case 'zip-year': return zipReceipts(yearReceipts(), `receipts-YA${state.year}.zip`);
      case 'month-open': return monthSheet(t.dataset.month);
      case 'clear-sel': state.selected.clear(); return render();
      case 'copy': return copy(summaryText());
      case 'copy-text': return copy(t.dataset.text);
      case 'signout': await DB.signOut(); state.user = null; state.receipts = []; return render();
      case 'google': try { await DB.signInGoogle(); } catch (err) { toast(err.message); } return;
      case 'focus-signin': { const i = $('#signin-email'); if (i) i.focus(); return; }
      case 'clear-ex': for (const r of state.receipts.filter(r => r.example)) await DB.del(r.id); state.receipts = state.receipts.filter(r => !r.example); await DB.setMeta('seeded', true); render(); return toast('Examples cleared');
      case 'load-ex': for (const r of examples()) { await DB.put(r); state.receipts.push(r); } state.year = 2026; render(); return toast('Examples loaded');
      case 'wipe': $('#wipe-confirm').innerHTML = `<div class="banner"><p>This deletes all ${state.receipts.length} receipts${CLOUD ? ' in your account' : ' on this device'}.</p><button class="btn danger" data-act="wipe-yes">Delete all</button></div>`; return;
      case 'wipe-yes': for (const r of state.receipts) await DB.del(r.id); state.receipts = []; state.selected.clear(); await DB.setMeta('seeded', true); render(); return toast('All receipts deleted');
    }
  });
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.id === 'year') { state.year = +el.value; state.month = ''; state.selected.clear(); render(); }
    if (el.id === 'camera' || el.id === 'upload') { const f = el.files[0]; el.value = ''; handleFile(f); }
    if (el.id === 'f-platform') { state.platform = el.value; render(); }
    if (el.id === 'f-month') { state.month = el.value; render(); }
    if (el.classList.contains('pick')) { el.checked ? state.selected.add(el.dataset.id) : state.selected.delete(el.dataset.id); el.closest('tr').classList.toggle('sel', el.checked); const all = $('#pick-all'); if (all) all.checked = filteredReceipts().every(r => state.selected.has(r.id)); syncBulkBar(); }
    if (el.id === 'pick-all') { filteredReceipts().forEach(r => el.checked ? state.selected.add(r.id) : state.selected.delete(r.id)); render(); }
    if (el.id && el.id.startsWith('p-')) {
      state.profile = { kids: $('#p-kids').checked, parents: $('#p-parents').checked, income: +$('#p-income').value || 0 };
      await DB.setMeta('profile', state.profile);
    }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'signin-form') return;
    e.preventDefault();
    const email = $('#signin-email').value.trim();
    try { await DB.signIn(email); e.target.innerHTML = `<div class="banner" style="margin:0"><p>Check <b>${esc(email)}</b> for your sign-in link. You can close this tab.</p></div>`; }
    catch (err) { toast(err.message || 'Could not send the link'); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'q') { state.query = e.target.value; const pos = e.target.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  $('#fab').addEventListener('click', addSheet);
  window.addEventListener('hashchange', () => setView(location.hash.slice(1)));
  // Paste anywhere on the page opens the review form with that text.
  document.addEventListener('paste', e => {
    if (e.target.closest('input,textarea')) return;
    const file = [...(e.clipboardData.files || [])][0]; if (file) return handleFile(file);
    const text = e.clipboardData.getData('text'); if (text && text.length > 20) reviewSheet(draftFromText(text, { source: 'paste' }));
  });

  // ---------- Boot ----------
  async function loadData() {
    try {
      const rules = await DB.rules(); if (rules) window.Reliefs.applyRules(rules);
    } catch {}
    try {
      state.receipts = await DB.all();
      const prof = await DB.getMeta('profile'); if (prof) state.profile = { ...state.profile, ...prof };
      if (!CLOUD && !state.receipts.length && !(await DB.getMeta('seeded'))) {
        const ex = examples(); for (const r of ex) await DB.put(r); state.receipts = ex; await DB.setMeta('seeded', true);
      }
      if (CLOUD) state.inbound = await DB.inboundAddress();
    } catch (e) { if (!CLOUD) state.receipts = examples(); else toast('Could not load your receipts. Check your connection.'); }
  }
  (async () => {
    await DB.ready;
    if (CLOUD) {
      state.user = await DB.user();
      DB.onAuth(async u => { const was = state.user; state.user = u; if (u && !was) { await loadData(); render(); } });
    }
    if (!CLOUD || state.user) await loadData();
    setView(location.hash.slice(1) || 'overview');
  })();
  // Render once right away so the first frame is never empty (examples in local mode, landing in cloud mode).
  if (!CLOUD) state.receipts = examples();
  setView(location.hash.slice(1) || 'overview');
})();
