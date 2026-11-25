const assert = require('assert');
const E = require('../engine.js');
const R = require('../reliefs.js');
const cases = [
  [`Shopee\nOrder ID 2603141ABCD\nSold by: Decathlon Official Store\nKipsta badminton racket x1  RM 89.90\nShipping RM 4.90\nShopee voucher -RM 5.00\nOrder Total RM 89.80\nPaid on 14/03/2026`, 'sports', 89.80, '2026-03-14'],
  [`KLINIK PERGIGIAN SENYUM SDN BHD\nScaling & polishing 120.00\nTOTAL RM 150.00\nDate: 2026-05-02`, 'medical', 150, '2026-05-02', 'dental'],
  [`TikTok Shop\nSeller: MPH Bookstores\nAtomic Habits (paperback) RM 59.90\nTotal payment RM 59.90\n3 Jun 2026`, 'lifestyle', 59.90, '2026-06-03'],
  [`TM Unifi\nBill for May 2026\nUnifi 300Mbps Internet\nAmount Due RM 139.00\nBill date 01/05/2026`, 'lifestyle', 139, '2026-05-01'],
  [`Lembaga Zakat Selangor\nResit Rasmi\nZakat Pendapatan\nJumlah RM 1,200.00\n15/04/2026`, 'zakat', 1200, '2026-04-15'],
  [`99 Speedmart\nMilo 2kg 39.90\nTotal 52.30\n02-02-2026`, 'none', 52.30, '2026-02-02'],
  [`Zoo Negara Malaysia\nAdult admission x2 RM 90.00\nTotal RM 90.00\n21 Sep 2026`, 'tourism', 90, '2026-09-21'],
  [`TADIKA CERIA\nYuran bulanan Julai\nJumlah bayaran RM 450.00\n05/07/2026`, 'childcare', 450, '2026-07-05'],
];
for (const [txt, relief, total, date, sub] of cases) {
  const p = E.parseReceipt(txt), c = E.categorize(p);
  assert.strictEqual(c.relief, relief, txt.split('\n')[0] + ' -> ' + JSON.stringify(c));
  if (sub) assert.strictEqual(c.sub, sub);
  assert.strictEqual(p.total, total, 'total ' + txt.split('\n')[0] + ' got ' + p.total);
  assert.strictEqual(p.date, date, 'date ' + txt.split('\n')[0]);
}
// caps
const s = E.summarize([
  { relief: 'medical', sub: 'dental', amount: 1500 }, { relief: 'medical', amount: 500 },
  { relief: 'sports', amount: 1200 },
], R.reliefsFor(2026));
assert.strictEqual(s.medical.claimed, 1500); // dental capped at 1000 + 500
assert.strictEqual(s.sports.claimed, 1000);
assert.strictEqual(E.taxOn(60000), 2600); // 1,500 on first 50k + 11% of 10k
console.log('all engine tests passed', E.taxOn(60000));
