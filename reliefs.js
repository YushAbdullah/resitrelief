/* LHDN personal tax relief rules.
 * Source: PwC Malaysian Tax Booklet 2026/2027 (YA2026 column), cross-checked with
 * StashAway's YA2027 guide. Budget 2027 items are proposals until the Finance Act passes.
 * Each relief: id, name, limit (RM), tone (icon tile colour), icon, evidence hint,
 * optional sub-limits, optional profile requirement, optional kind ("rebate").
 */
(function (root) {
  const RELIEFS_2026 = [
    { id: 'lifestyle', name: 'Lifestyle', limit: 2500, tone: 'indigo', icon: 'bag',
      covers: 'Books and e-books, smartphone, tablet or computer, internet bill in your name, upskilling course fees.',
      evidence: 'Receipt or invoice in your own name. For internet, the monthly bill.' },
    { id: 'sports', name: 'Sports extra', limit: 1000, tone: 'mint', icon: 'ball',
      covers: 'Sports equipment, court or facility rental, competition entry fees, gym membership and training fees for you, spouse, child or parents.',
      evidence: 'Receipt from the shop, facility or organiser.' },
    { id: 'tourism', name: 'Tourism & culture', limit: 1000, tone: 'peach', icon: 'ticket',
      covers: 'Entrance fees to tourist attractions and local arts or cultural programmes. YA 2026 only.',
      evidence: 'Ticket or receipt showing the attraction or programme.' , years: [2026, 2027] },
    { id: 'medical', name: 'Medical expenses', limit: 10000, tone: 'rose', icon: 'medkit',
      covers: 'Serious disease and fertility treatment, vaccination, dental, full check-ups, self-test kits, mental health and child learning-disability care for you, spouse or child.',
      evidence: 'Clinic or hospital receipt. Serious illness needs a doctor\'s certification.',
      sub: [
        { id: 'vaccine', name: 'Vaccination', limit: 1000 },
        { id: 'dental', name: 'Dental', limit: 1000 },
        { id: 'checkup', name: 'Check-up, self-test and mental health', limit: 1000 },
      ] },
    { id: 'childcare', name: 'Childcare & kindergarten', limit: 3000, tone: 'sun', icon: 'smile', needs: 'kids',
      covers: 'Fees to a registered childcare centre or kindergarten for a child aged 6 and below.',
      evidence: 'Official receipt showing the centre\'s registration number.' },
    { id: 'breastfeeding', name: 'Breastfeeding equipment', limit: 1000, tone: 'rose', icon: 'drop', needs: 'kids',
      covers: 'Breast pump, cooler bag and milk storage for a child aged 2 and below. Claimable once every 2 YAs.',
      evidence: 'Receipt for the equipment.' },
    { id: 'education', name: 'Education fees (self)', limit: 7000, tone: 'sky', icon: 'cap',
      covers: 'Degree, master\'s or doctorate fees, or recognised certificate courses. Upskilling courses up to RM2,000.',
      evidence: 'Fee receipt from the institution.',
      sub: [{ id: 'upskill', name: 'Upskilling courses', limit: 2000 }] },
    { id: 'parents', name: 'Parents\' medical & care', limit: 8000, tone: 'rose', icon: 'heart', needs: 'parents',
      covers: 'Medical treatment, dental and care for your parents or grandparents. Check-ups and vaccination up to RM1,000.',
      evidence: 'Receipt naming the parent as patient.' ,
      sub: [{ id: 'pcheckup', name: 'Check-up and vaccination', limit: 1000 }] },
    { id: 'insurance', name: 'Education & medical insurance', limit: 4000, tone: 'sky', icon: 'shield',
      covers: 'Premiums for medical or education insurance for you, spouse or child.',
      evidence: 'Annual premium statement from the insurer.' },
    { id: 'life', name: 'Life insurance & EPF', limit: 7000, tone: 'indigo', icon: 'umbrella',
      covers: 'EPF contributions up to RM4,000 plus life insurance or takaful up to RM3,000.',
      evidence: 'EPF statement and insurer premium statement.',
      sub: [{ id: 'epf', name: 'EPF', limit: 4000 }, { id: 'lifeins', name: 'Life insurance or takaful', limit: 3000 }] },
    { id: 'prs', name: 'PRS & deferred annuity', limit: 3000, tone: 'mint', icon: 'piggy',
      covers: 'Private Retirement Scheme contributions.',
      evidence: 'PRS provider statement.' },
    { id: 'sspn', name: 'SSPN savings', limit: 8000, tone: 'sun', icon: 'piggy', needs: 'kids',
      covers: 'Net deposits into SSPN for your child.',
      evidence: 'SSPN annual statement.' },
    { id: 'socso', name: 'SOCSO / PERKESO', limit: 350, tone: 'sky', icon: 'shield',
      covers: 'Your employee SOCSO contributions.',
      evidence: 'Payslip or EA form.' },
    { id: 'green', name: 'EV charging & green', limit: 2500, tone: 'mint', icon: 'bolt',
      covers: 'EV charger installation, rental or subscription, food-waste composting machine or grinder, home CCTV.',
      evidence: 'Receipt for the equipment or charging subscription.' },
    { id: 'zakat', name: 'Zakat / Fitrah rebate', limit: null, kind: 'rebate', tone: 'peach', icon: 'moon',
      covers: 'Rebate, not relief: the full amount paid to a state religious authority comes off your tax payable, up to the tax you owe.',
      evidence: 'Official receipt from the zakat centre (e.g. LZS, PPZ-MAIWP).' },
  ];

  // YA2025: same structure, without the tourism relief which started in YA2026.
  const RELIEFS = {
    2025: RELIEFS_2026.filter(r => r.id !== 'tourism'),
    2026: RELIEFS_2026,
    // YA2027: Budget 2027 proposals are not law yet, so YA2026 limits are used.
    2027: RELIEFS_2026,
  };

  const YEAR_NOTES = {
    2025: 'YA 2025 is filed by 30 April 2026. Tourism & culture did not exist yet.',
    2026: 'Current year. File in early 2027.',
    2027: 'Budget 2027 changes are proposals, so YA 2026 limits are shown for now.',
  };

  // Rule versions. The bundled list is version 1; a newer published version from the
  // relief_rules table (see supabase/schema.sql) replaces it at start-up.
  const META = { 2025: { version: 1, source: 'bundled' }, 2026: { version: 1, source: 'bundled' }, 2027: { version: 1, source: 'bundled' } };
  function applyRules(rows) {
    for (const row of rows || []) {
      if (!row || !Array.isArray(row.rules) || (META[row.ya] && META[row.ya].version >= row.version && META[row.ya].source !== 'bundled')) continue;
      RELIEFS[row.ya] = row.rules;
      META[row.ya] = { version: row.version, source: 'published', note: row.note, url: row.source_url, published: row.published_at };
    }
  }
  const api = { RELIEFS, YEAR_NOTES, META, applyRules, reliefsFor: y => RELIEFS[y] || RELIEFS[2026] };
  if (typeof module !== 'undefined') module.exports = api; else root.Reliefs = api;
})(this);
