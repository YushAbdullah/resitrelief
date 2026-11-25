/* LHDN MyInvois adapter (receive side).
 *
 * What is real:
 *  - MyInvois is LHDN's e-Invoice platform. Its API lets a taxpayer system search
 *    documents it SENT or RECEIVED:  GET /api/v1.0/documents/search?invoiceDirection=Received
 *  - Auth is OAuth2 client credentials: POST {identity}/connect/token with client_id,
 *    client_secret, grant_type=client_credentials, scope=InvoicingAPI. Token lasts 60 min.
 *    An intermediary adds the header `onbehalfof: <TIN>`.
 *  - A receiver only sees documents in Valid or Cancelled status.
 *  - Limits: date range of 31 days per query, page size up to 100, about 12 requests/min,
 *    and search is throttled to 1 call per 5 seconds per taxpayer.
 *
 * What is NOT available:
 *  - There is no public LHDN API for individuals to read their relief claims, file Form BE,
 *    or ask "is this claimable". Relief claiming stays in MyTax / e-Filing.
 *  - An e-invoice only reaches you if the seller issued it with YOUR TIN as buyer.
 *    Most retail receipts are consolidated e-invoices with no buyer name, so they never
 *    show up here. You must ask the seller (QR code on the receipt) for an individual e-invoice.
 *
 * Because the client secret must never sit in a browser, this adapter is meant to run on
 * a small server. The browser app talks to it through `ReceiptSource` below.
 */

const ENV = {
  sandbox: { api: 'https://preprod-api.myinvois.hasil.gov.my', identity: 'https://preprod-api.myinvois.hasil.gov.my' },
  production: { api: 'https://api.myinvois.hasil.gov.my', identity: 'https://api.myinvois.hasil.gov.my' },
};

class MyInvoisAdapter {
  /** @param {{clientId:string, clientSecret:string, env?:'sandbox'|'production', onBehalfOfTin?:string, fetch?:Function}} cfg */
  constructor(cfg) {
    this.cfg = { env: 'sandbox', ...cfg };
    this.base = ENV[this.cfg.env];
    this.fetch = cfg.fetch || globalThis.fetch;
    this.token = null; this.tokenExpiry = 0;
  }

  async login() {
    if (this.token && Date.now() < this.tokenExpiry - 60_000) return this.token; // reuse for its 60 min life
    const body = new URLSearchParams({
      client_id: this.cfg.clientId, client_secret: this.cfg.clientSecret,
      grant_type: 'client_credentials', scope: 'InvoicingAPI',
    });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (this.cfg.onBehalfOfTin) headers.onbehalfof = this.cfg.onBehalfOfTin;
    const res = await this.fetch(`${this.base.identity}/connect/token`, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`MyInvois login failed (${res.status})`);
    const j = await res.json();
    this.token = j.access_token; this.tokenExpiry = Date.now() + j.expires_in * 1000;
    return this.token;
  }

  /** Received e-invoices between two dates. Splits into 31-day windows and waits 5 s between calls. */
  async *receivedDocuments(from, to) {
    const DAY = 86_400_000;
    for (let start = new Date(from); start < to; start = new Date(start.getTime() + 31 * DAY)) {
      const end = new Date(Math.min(start.getTime() + 31 * DAY - 1000, to.getTime()));
      for (let page = 1; ; page++) {
        const q = new URLSearchParams({
          invoiceDirection: 'Received', issueDateFrom: start.toISOString(), issueDateTo: end.toISOString(),
          pageSize: '100', pageNo: String(page),
        });
        const res = await this.fetch(`${this.base.api}/api/v1.0/documents/search?${q}`, {
          headers: { Authorization: `Bearer ${await this.login()}` },
        });
        if (res.status === 429) { await sleep(10_000); page--; continue; }
        if (!res.ok) throw new Error(`MyInvois search failed (${res.status})`);
        const j = await res.json();
        for (const d of j.result || []) yield toReceipt(d);
        await sleep(5_000);
        if (!j.metadata || page >= j.metadata.totalPages) break;
      }
    }
  }
}

/** Map a MyInvois search result row to the app's receipt shape. */
function toReceipt(d) {
  return {
    source: 'myinvois',
    merchant: d.issuerName || d.supplierName,
    date: (d.dateTimeIssued || '').slice(0, 10),
    amount: d.totalPayableAmount ?? d.total,
    einvoiceUuid: d.uuid,
    isEInvoice: true,
    status: d.status === 'Cancelled' ? 'rejected' : 'review',
    text: `${d.issuerName || ''}\n${d.typeName || ''}\nUUID ${d.uuid}`,
    verifyUrl: d.longId ? `https://myinvois.hasil.gov.my/${d.uuid}/share/${d.longId}` : null,
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Every source of receipts (camera, paste, email inbox, MyInvois, bank feed) implements:
 *   name, connected(): Promise<boolean>, pull(since: Date): AsyncIterable<Receipt>
 * so the app can add new sources without changing the dashboard.
 */
class ReceiptSource { constructor(name) { this.name = name; } async connected() { return false; } async *pull() {} }

if (typeof module !== 'undefined') module.exports = { MyInvoisAdapter, ReceiptSource, toReceipt };
