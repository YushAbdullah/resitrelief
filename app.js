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
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.2-3.6 4.3-5.5 8-5.5s6.8 1.9 8 5.5"/>',
    checkc: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m8 12.5 2.6 2.5L16 9.5" stroke="#fff" stroke-width="2"/>',
  };
  const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.receipt}</svg>`;

  // ---------- Storage: IndexedDB, falling back to memory ----------
  const DB = (() => {
    let db = null, mem = { receipts: [], meta: {} };
    const open = () => new Promise(res => {
      try {
        const req = indexedDB.open('resit-relief', 1);
        req.onupgradeneeded = () => { req.result.createObjectStore('receipts', { keyPath: 'id' }); req.result.createObjectStore('meta'); };
        req.onsuccess = () => { db = req.result; res(); };
        req.onerror = () => res();
      } catch { res(); }
    });
    const tx = (store, mode, fn) => new Promise((res, rej) => {
      const t = db.transaction(store, mode); const r = fn(t.objectStore(store));
      t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
    });
    return {
      ready: open(),
      async all() { if (!db) return mem.receipts.slice(); return (await tx('receipts', 'readonly', s => s.getAll())) || []; },
      async put(r) { if (!db) { mem.receipts = mem.receipts.filter(x => x.id !== r.id).concat(r); return; } await tx('receipts', 'readwrite', s => s.put(r)); },
      async del(id) { if (!db) { mem.receipts = mem.receipts.filter(x => x.id !== id); return; } await tx('receipts', 'readwrite', s => s.delete(id)); },
      async getMeta(k) { if (!db) return mem.meta[k]; return tx('meta', 'readonly', s => s.get(k)); },
      async setMeta(k, v) { if (!db) { mem.meta[k] = v; return; } await tx('meta', 'readwrite', s => s.put(v, k)); },
    };
  })();

  // ---------- State ----------
  const state = {
    year: 2026, receipts: [], view: 'overview', filter: 'all', query: '', showAll: false,
    profile: { kids: true, parents: true, income: 72000 },
  };
  const yearReceipts = () => state.receipts.filter(r => (r.date || '').startsWith(String(state.year)));
  const visibleReliefs = () => reliefsFor(state.year).filter(r => state.showAll || !r.needs || state.profile[r.needs]);
  const reliefById = id => reliefsFor(state.year).find(r => r.id === id) || reliefsFor(2026).find(r => r.id === id);

  const STATUS = {
    claimable: ['ok', 'Claimable'], review: ['warn', 'Check this'], rejected: ['bad', 'Not claimable'],
  };
  const statusChip = r => { const [c, t] = STATUS[r.status] || STATUS.review; return `<span class="chip ${c}">${t}</span>`; };

  // ---------- Example data (clearly marked) ----------
  function examples() {
    const ex = (merchant, date, amount, relief, sub, status, platform, text) =>
      ({ id: 'ex-' + uid(), example: true, merchant, date, amount, relief, sub, status, platform, source: platform ? 'paste' : 'camera', text, created: Date.now() });
    return [
      ex('MPH Bookstores', '2026-06-03', 59.9, 'lifestyle', null, 'claimable', 'TikTok Shop', 'TikTok Shop\nSeller: MPH Bookstores\nAtomic Habits (paperback) RM 59.90\nTotal payment RM 59.90\n3 Jun 2026'),
      ex('TM Unifi', '2026-02-01', 139, 'lifestyle', null, 'claimable', 'JomPAY', 'TM Unifi\nUnifi 300Mbps Internet\nAmount Due RM 139.00\n01/02/2026'),
      ex('TM Unifi', '2026-03-01', 139, 'lifestyle', null, 'claimable', 'JomPAY', 'TM Unifi\nUnifi 300Mbps Internet\nAmount Due RM 139.00\n01/03/2026'),
      ex('Amazon Kindle Store', '2026-04-11', 62.1, 'lifestyle', null, 'claimable', 'Amazon', 'Amazon Kindle e-book order\nTotal RM 62.10\n11 Apr 2026'),
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
    ];
  }

  // ---------- Rendering ----------
  function setView(v) {
    state.view = ['overview', 'claims', 'discover', 'you'].includes(v) ? v : 'overview';
    document.querySelectorAll('.nav a[data-view]').forEach(a => a.dataset.view === state.view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    render(); window.scrollTo(0, 0);
  }

  const DOODLE = {
    arrow: '<svg class="doodle d-arrow" viewBox="0 0 140 90" aria-hidden="true"><path d="M8 84c6-22 2-46-6-40-8 6 10 18 30 6 22-13 52-34 96-44"/><path d="m116 2 14 4-9 11"/></svg>',
    squiggle: '<svg class="doodle d-squiggle" viewBox="0 0 130 30" aria-hidden="true"><path d="M2 22c14 0 16-14 28-14s10 18 24 14 12-20 26-12 14 14 30 4"/></svg>',
    blob: '<svg class="doodle d-blob" viewBox="0 0 90 90" aria-hidden="true"><path d="M70 10c18 14 16 44-4 62S16 84 14 62s20-18 30-34S54-2 70 10z"/></svg>',
  };
  const fingerprint = '<svg class="fp" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8a22 22 0 0 0-22 22M32 8a22 22 0 0 1 22 22v6M18 30a14 14 0 0 1 28 0v8c0 6 2 10 4 13M24 30a8 8 0 0 1 16 0v10c0 7 3 12 6 15M32 30v12c0 8 3 13 7 17M26 38c0 8 1 14 5 20M18 38c0 6 1 11 3 15M12 36v2"/></svg>';

  function topbar() {
    const pending = yearReceipts().filter(r => r.status === 'review').length;
    const links = [['overview', 'Overview'], ['claims', 'Claims'], ['discover', 'Discover'], ['you', 'About you']]
      .map(([k, t]) => `<a href="#${k}" data-view="${k}" ${state.view === k ? 'aria-current="page"' : ''}>${t}</a>`).join('');
    return `<header class="header">
      <a class="brand" href="#overview"><span class="mark"><i></i><i></i></span>Resit Relief</a>
      <nav class="toplinks" aria-label="Sections">${links}</nav>
      <div class="tools">
        <label class="ya"><select id="year" aria-label="Year of assessment">${[2025, 2026, 2027].map(y => `<option value="${y}" ${y === state.year ? 'selected' : ''}>YA ${y}</option>`).join('')}</select></label>
        <button class="icon-btn" data-act="go-review" aria-label="${pending} receipts to check">${icon('bell')}${pending ? '<span class="dot"></span>' : ''}</button>
        <a class="avatar" href="#you" aria-label="About you">${icon('user')}</a>
      </div></header>`;
  }

  function render() {
    const v = $('#view');
    v.innerHTML = topbar() + ({ overview, claims, discover, you })[state.view]();
  }

  function totals() {
    const rs = yearReceipts();
    const sum = E.summarize(rs, reliefsFor(state.year));
    const totalRelief = reliefsFor(state.year).filter(r => r.kind !== 'rebate').reduce((a, r) => a + sum[r.id].claimed, 0);
    const zakat = sum.zakat ? sum.zakat.claimed : 0;
    const inc = +state.profile.income || 0, base = Math.max(0, inc - 9000);
    const taxBefore = E.taxOn(base), taxAfter = E.taxOn(Math.max(0, base - totalRelief));
    const saved = inc ? Math.min(taxBefore, taxBefore - taxAfter + Math.min(zakat, taxAfter)) : null;
    const limitSum = visibleReliefs().filter(r => r.limit).reduce((a, r) => a + r.limit, 0);
    return { rs, sum, totalRelief, saved, limitSum, review: rs.filter(r => r.status === 'review').length };
  }

  function overview() {
    const { rs, sum, totalRelief, saved, limitSum, review } = totals();
    const reliefs = visibleReliefs();
    const hasEx = state.receipts.some(r => r.example);
    const recent = rs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
    const fromEmail = rs.filter(r => r.source === 'paste' || r.source === 'email').length;
    const usedPct = limitSum ? Math.round(totalRelief / limitSum * 100) : 0;

    return `<section class="hero">
        <div class="hero-copy">
          ${DOODLE.arrow}
          <div class="chips">
            <span class="float-chip"><b class="num">${rm(totalRelief)}</b><em>relief found</em></span>
            <span class="float-chip"><b class="num">${saved == null ? '–' : rm(Math.round(saved))}</b><em>tax saved</em></span>
            <button class="float-chip ${review ? 'warn' : ''}" data-act="go-review"><b class="num">${review}</b><em>to check</em></button>
          </div>
          <h1>Every receipt, <span class="swash">ready for</span> LHDN</h1>
          <p class="lede">Snap a paper receipt or paste a Shopee, TikTok Shop or bill e-receipt. Resit Relief reads it, sorts it into the right YA ${state.year} tax relief and keeps it as your proof.</p>
          <div class="ctas"><button class="btn" data-act="add">Scan a receipt</button><button class="link" data-act="paste">Paste an e-receipt</button></div>
          ${DOODLE.squiggle}
        </div>
        <div class="visual" aria-hidden="true">
          <div class="vcard v-dark"><span class="vb"><span class="mark"><i></i><i></i></span>Resit</span><div><small>Tax saved</small><br><strong class="num">${saved == null ? '–' : rm(Math.round(saved))}</strong></div></div>
          <div class="vcard v-mint"><span class="vb"><span class="mark"><i></i><i></i></span>Resit</span><div><small>Receipts kept</small><br><strong class="num">${rs.length}</strong></div></div>
          <div class="vcard v-glass"><span class="vb"><span class="mark"><i></i><i></i></span>Resit Relief</span>
            ${fingerprint}
            <div class="lines"><i></i><i></i><i></i><i></i></div>
            <span class="stamp">YA ${state.year} · ${esc(YEAR_NOTES[state.year].split('.')[0])}</span>
            <div class="total"><small>Relief backed by receipts</small><strong class="num">${rm(totalRelief)}</strong></div></div>
        </div>
      </section>
      ${hasEx ? `<div class="banner">${icon('receipt')}<p>You're seeing example receipts. Add your own, then clear these in About you.</p></div>` : ''}

      <section class="section glow">
        <div class="section-title"><h2>Your reliefs</h2><p>How much of each LHDN limit your receipts already cover. Tap one to see its receipts.</p></div>
        <div class="grid">${reliefs.map(r => reliefCard(r, sum[r.id])).join('')}</div>
        <div style="text-align:center;margin-top:18px"><button class="link" data-act="toggle-all">${state.showAll ? 'Show only reliefs that apply to me' : 'Show all reliefs'}</button></div>
      </section>

      <section class="section">
        <div class="pair">
          <div class="panel"><div class="panel-top"><h3>Recent receipts</h3><a class="link" href="#claims" style="color:var(--ink);font-size:14px">See all</a></div>
            ${recent.length ? `<div class="list tilt">${recent.map(receiptRow).join('')}</div>` : `<div class="empty">No receipts yet for YA ${state.year}.</div>`}</div>
          <div class="panel">${DOODLE.blob}
            <div class="check">${icon('checkc')}<span>Auto-import e-receipts<small>Shopee, TikTok Shop, bills and clinics</small></span></div>
            <p>${fromEmail} of ${rs.length} receipts this year came in without a photo. Forward receipt emails and the rest file themselves.</p>
            <div class="bar" style="margin:6px 0"><i style="width:${Math.max(3, usedPct)}%"></i></div>
            <div class="minis"><div class="mini"><small>Limits used ${usedPct}%</small><b class="num">${rm(totalRelief)}</b></div><div class="mini"><small>Total limits</small><b class="num">${rm(limitSum)}</b></div></div>
            <div class="btns"><a class="btn ghost" href="#discover" style="text-decoration:none">Set up forwarding</a></div>
          </div>
        </div>
      </section>`;
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

  function claims() {
    const q = state.query.toLowerCase();
    let rs = yearReceipts().filter(r => state.filter === 'all' || r.status === state.filter)
      .filter(r => !q || (r.merchant + ' ' + (r.text || '') + ' ' + (r.platform || '')).toLowerCase().includes(q))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const counts = s => yearReceipts().filter(r => s === 'all' || r.status === s).length;
    const seg = [['all', 'All'], ['review', 'To check'], ['claimable', 'Claimable'], ['rejected', 'Not claimable']]
      .map(([k, t]) => `<button data-filter="${k}" aria-pressed="${state.filter === k}">${t} ${counts(k)}</button>`).join('');
    let body = '';
    if (!rs.length) body = `<div class="empty">No receipts here yet for YA ${state.year}.<br>Tap the camera to add one.</div>`;
    else {
      const groups = {};
      rs.forEach(r => { const k = r.date ? r.date.slice(0, 7) : 'none'; (groups[k] = groups[k] || []).push(r); });
      body = Object.entries(groups).map(([k, list]) => `<div class="month">${k === 'none' ? 'No date' : new Date(k + '-01T00:00:00').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</div>
        <div class="list">${list.map(receiptRow).join('')}</div>`).join('');
    }
    return `<div class="narrow"><h1 class="page-title">Claims</h1><p class="page-sub">Every receipt is your proof if LHDN audits you. Keep them for 7 years.</p>
      <div class="seg" role="group" aria-label="Filter">${seg}</div>
      <input class="search" id="q" type="search" placeholder="Search merchant, item or platform" value="${esc(state.query)}">
      ${body}</div>`;
  }

  function discover() {
    const guide = reliefsFor(state.year).map(r => `<details class="guide"><summary><span class="tile sm">${icon(r.icon)}</span><span>${esc(r.name)}</span><em class="num">${r.limit ? rm(r.limit) : 'rebate'}</em></summary>
      <div><span>${esc(r.covers)}</span><span><b>Proof:</b> ${esc(r.evidence)}</span>${r.sub ? `<span><b>Sub-limits:</b> ${r.sub.map(s => `${esc(s.name)} ${rm(s.limit)}`).join(', ')}</span>` : ''}</div></details>`).join('');
    return `<div class="narrow"><h1 class="page-title">Discover</h1><p class="page-sub">Ways to stop losing receipts, and what each relief covers.</p>
      <div class="panel"><div class="head"><span class="tile sm">${icon('mail')}</span><div><h3>Forward e-receipts by email</h3></div><span class="chip warn">Needs server</span></div>
        <p>Set Gmail to auto-forward emails from Shopee, TikTok Shop, Lazada, Unifi and your bank to a private receipts address. Each one is read and filed for you.</p>
        <div class="mono">receipts+yusri@your-domain.my</div>
        <p>Until the server is set up, paste the email text and it gets read the same way.</p>
        <div class="btns"><button class="btn ghost" data-act="paste">Paste an e-receipt</button></div></div>
      <div class="panel"><div class="head"><span class="tile sm">${icon('bag')}</span><div><h3>Shopee and TikTok Shop orders</h3></div></div>
        <p>Open My Purchases, tap an order, then share or copy the order details here. Order emails from both apps also work with forwarding.</p></div>
      <div class="panel"><div class="head"><span class="tile sm">${icon('shield')}</span><div><h3>LHDN e-invoices (MyInvois)</h3></div><span class="chip bad">Not connected</span></div>
        <p>When a shop issues an e-invoice with your tax number (TIN), it lands in your MyInvois account and can be pulled in here. Most shop receipts are consolidated e-invoices without your name, so ask for an individual e-invoice using the QR code on the receipt.</p>
        <p>LHDN has no public API for checking or filing personal reliefs. That part stays in MyTax e-Filing, and this app gives you the totals and proof to enter there.</p></div>
      <div class="panel"><div class="head"><span class="tile sm">${icon('bank')}</span><div><h3>Bank and e-wallet statements</h3></div><span class="chip ex">Planned</span></div>
        <p>Import a monthly CSV from your bank or Touch 'n Go to spot payments to clinics, tadika, gyms and bookshops you forgot to snap.</p></div>
      <h2 class="page-title" style="font-size:26px">Relief guide YA ${state.year}</h2>
      <div class="panel">${guide}</div></div>`;
  }

  function you() {
    const p = state.profile;
    return `<div class="narrow"><h1 class="page-title">About you</h1><p class="page-sub">Your answers decide which reliefs show up and how much tax you save.</p>
      <div class="panel">
        <label class="toggle"><span>I have children</span><input type="checkbox" id="p-kids" ${p.kids ? 'checked' : ''}></label>
        <label class="toggle"><span>I pay for my parents' medical care</span><input type="checkbox" id="p-parents" ${p.parents ? 'checked' : ''}></label>
        <label class="f">Yearly income before tax (RM)<input id="p-income" type="number" inputmode="numeric" min="0" step="1000" value="${esc(p.income)}"></label>
        <p style="font-size:13px;color:var(--ink-3)">Used only for the tax-saved estimate. It leaves out EPF, the RM9,000 self relief is included.</p>
      </div>
      <h2 class="page-title" style="font-size:26px">Your evidence</h2>
      <div class="panel"><p>Export every YA ${state.year} receipt with its relief, amount and status. Use it to fill in MyTax e-Filing or send to your tax agent.</p>
        <div class="btns"><button class="btn" data-act="export">Export CSV</button><button class="btn ghost" data-act="copy">Copy summary</button></div></div>
      <div class="panel"><p>Receipts are stored on this device only.</p>
        <div class="btns">${state.receipts.some(r => r.example) ? '<button class="btn ghost" data-act="clear-ex">Clear example receipts</button>' : '<button class="btn ghost" data-act="load-ex">Load example receipts</button>'}
        <button class="btn danger" data-act="wipe">Delete all receipts</button></div><div id="wipe-confirm"></div></div></div>`;
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
    openSheet(`<div class="panel" style="border:0;padding:0"><div class="head"><span class="tile lg ${rel ? '' : 't-grey'}">${icon(rel ? rel.icon : 'receipt')}</span>
      <div><h2>${esc(r.merchant)}</h2><p class="num">${rm(r.amount, 2)} · ${fmtDate(r.date)}</p></div>${r.example ? '<span class="chip ex">Example</span>' : statusChip(r)}</div>
      ${r.image && !r.image.startsWith('data:application/pdf') ? `<img class="preview" src="${r.image}" alt="Receipt photo">` : ''}
      ${r.image && r.image.startsWith('data:application/pdf') ? `<div class="mono">PDF proof: ${esc(r.fileName || 'document')}</div>` : ''}
      <dl class="kv"><dt>Relief</dt><dd>${esc(rel ? rel.name : r.relief === 'none' ? 'Not claimable' : 'Not set')}</dd>
        ${r.sub && rel && rel.sub ? `<dt>Type</dt><dd>${esc((rel.sub.find(x => x.id === r.sub) || {}).name || r.sub)}</dd>` : ''}
        ${r.platform ? `<dt>Paid via</dt><dd>${esc(r.platform)}</dd>` : ''}
        ${r.isEInvoice ? `<dt>e-Invoice</dt><dd>${esc(r.einvoiceUuid || 'Yes')}</dd>` : ''}
        ${r.notes ? `<dt>Notes</dt><dd>${esc(r.notes)}</dd>` : ''}</dl>
      ${r.text ? `<div class="mono rawtext">${esc(r.text)}</div>` : ''}
      <div class="btns">${r.status === 'review' ? `<button class="btn" data-act="approve" data-id="${r.id}">Looks right</button>` : ''}
        <button class="btn ghost" data-act="edit" data-id="${r.id}">Edit</button>
        <button class="btn danger" data-act="del" data-id="${r.id}">Delete</button></div><div id="del-confirm"></div></div>`);
  }

  // ---------- Export ----------
  function csv() {
    const rows = [['Date', 'Merchant', 'Amount (RM)', 'Relief', 'Type', 'Status', 'Paid via', 'e-Invoice UUID', 'Notes']];
    yearReceipts().sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(r => {
      const rel = reliefById(r.relief);
      rows.push([r.date, r.merchant, (r.amount || 0).toFixed(2), rel ? rel.name : r.relief || '', r.sub || '', (STATUS[r.status] || [])[1] || '', r.platform || '', r.einvoiceUuid || '', r.notes || '']);
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

  // ---------- Events ----------
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-act],[data-relief],[data-receipt],[data-filter]'); if (!t) return;
    if (t.dataset.relief) return reliefSheet(t.dataset.relief);
    if (t.dataset.receipt) return receiptSheet(t.dataset.receipt);
    if (t.dataset.filter) { state.filter = t.dataset.filter; return render(); }
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
      case 'go-review': state.filter = 'review'; return setView('claims');
      case 'toggle-all': state.showAll = !state.showAll; return render();
      case 'approve': { const r = state.receipts.find(x => x.id === id); r.status = 'claimable'; await DB.put(r); closeSheet(); render(); return toast('Marked as claimable'); }
      case 'edit': { const r = state.receipts.find(x => x.id === id); return reviewSheet({ ...r }); }
      case 'del': $('#del-confirm').innerHTML = `<div class="banner"><p>Delete this receipt and its photo?</p><button class="btn danger" data-act="del-yes" data-id="${id}">Delete</button></div>`; return;
      case 'del-yes': await DB.del(id); state.receipts = state.receipts.filter(x => x.id !== id); closeSheet(); render(); return toast('Deleted');
      case 'export': {
        const blob = new Blob([csv()], { type: 'text/csv' }); const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = `reliefs-YA${state.year}.csv`; document.body.appendChild(a); a.click(); a.remove();
        // Some embedded views block downloads, so also offer the text.
        return setTimeout(() => copy(csv()), 300);
      }
      case 'copy': return copy(summaryText());
      case 'clear-ex': for (const r of state.receipts.filter(r => r.example)) await DB.del(r.id); state.receipts = state.receipts.filter(r => !r.example); await DB.setMeta('seeded', true); render(); return toast('Examples cleared');
      case 'load-ex': for (const r of examples()) { await DB.put(r); state.receipts.push(r); } state.year = 2026; render(); return toast('Examples loaded');
      case 'wipe': $('#wipe-confirm').innerHTML = `<div class="banner"><p>This deletes all ${state.receipts.length} receipts on this device.</p><button class="btn danger" data-act="wipe-yes">Delete all</button></div>`; return;
      case 'wipe-yes': for (const r of state.receipts) await DB.del(r.id); state.receipts = []; await DB.setMeta('seeded', true); render(); return toast('All receipts deleted');
    }
  });
  document.addEventListener('change', async e => {
    if (e.target.id === 'year') { state.year = +e.target.value; render(); }
    if (e.target.id === 'camera' || e.target.id === 'upload') { const f = e.target.files[0]; e.target.value = ''; handleFile(f); }
    if (e.target.id.startsWith('p-')) {
      state.profile = { kids: $('#p-kids').checked, parents: $('#p-parents').checked, income: +$('#p-income').value || 0 };
      await DB.setMeta('profile', state.profile);
    }
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
  (async () => {
    await DB.ready;
    try {
      state.receipts = await DB.all();
      const prof = await DB.getMeta('profile'); if (prof) state.profile = prof;
      if (!state.receipts.length && !(await DB.getMeta('seeded'))) {
        const ex = examples(); for (const r of ex) await DB.put(r); state.receipts = ex; await DB.setMeta('seeded', true);
      }
    } catch { state.receipts = examples(); }
    setView(location.hash.slice(1) || 'overview');
  })();
  // Render once right away with examples so the first frame is never empty.
  state.receipts = examples(); setView(location.hash.slice(1) || 'overview');
})();
