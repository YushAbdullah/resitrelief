/* Storage layer.
 * Cloud mode (Supabase: Postgres + Auth + Storage) when config.js has a project URL and anon key.
 * Local mode (IndexedDB on this device) otherwise, so the app still works as a demo or offline.
 * Both expose the same API, so the screens never care which one is active.
 */
(function () {
  const CFG = window.RESIT_CONFIG || {};
  const cloud = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);

  // ---------- Local (IndexedDB) ----------
  function localStore() {
    let db = null; const mem = { receipts: [], meta: {} };
    const ready = new Promise(res => {
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
      mode: 'local', ready,
      async user() { return null; },
      async all() { if (!db) return mem.receipts.slice(); return (await tx('receipts', 'readonly', s => s.getAll())) || []; },
      async put(r) { if (!db) { mem.receipts = mem.receipts.filter(x => x.id !== r.id).concat(r); return r; } await tx('receipts', 'readwrite', s => s.put(r)); return r; },
      async del(id) { if (!db) { mem.receipts = mem.receipts.filter(x => x.id !== id); return; } await tx('receipts', 'readwrite', s => s.delete(id)); },
      async getMeta(k) { if (!db) return mem.meta[k]; return tx('meta', 'readonly', s => s.get(k)); },
      async setMeta(k, v) { if (!db) { mem.meta[k] = v; return; } await tx('meta', 'readwrite', s => s.put(v, k)); },
      // Proof lives inline as a data URL in local mode.
      async proofBlob(r) { if (!r.image) return null; return (await fetch(r.image)).blob(); },
      async proofUrl(r) { return r.image || null; },
      async rules() { return null; },
      async inboundAddress() { return null; },
    };
  }

  // ---------- Cloud (Supabase) ----------
  function cloudStore() {
    const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    const BUCKET = 'proofs';
    const toRow = (r, uid) => ({
      id: r.id, user_id: uid, merchant: r.merchant, receipt_date: r.date, amount: r.amount, relief: r.relief, sub: r.sub,
      status: r.status, platform: r.platform, source: r.source, raw_text: r.text, notes: r.notes,
      is_einvoice: !!r.isEInvoice, einvoice_uuid: r.einvoiceUuid || null,
      proof_path: r.proofPath || null, proof_name: r.fileName || null, proof_type: r.proofType || null,
    });
    const fromRow = x => ({
      id: x.id, merchant: x.merchant, date: x.receipt_date, amount: +x.amount, relief: x.relief, sub: x.sub, status: x.status,
      platform: x.platform, source: x.source, text: x.raw_text, notes: x.notes, isEInvoice: x.is_einvoice, einvoiceUuid: x.einvoice_uuid,
      proofPath: x.proof_path, fileName: x.proof_name, proofType: x.proof_type, created: Date.parse(x.created_at),
    });
    const dataUrlToBlob = async u => (await fetch(u)).blob();
    const uidOf = async () => (await sb.auth.getUser()).data.user?.id;

    return {
      mode: 'cloud', sb, ready: Promise.resolve(),
      async user() { return (await sb.auth.getUser()).data.user; },
      onAuth(cb) { sb.auth.onAuthStateChange((_e, session) => cb(session?.user || null)); },
      async signIn(email) {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
      },
      async signInGoogle() { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); },
      async signOut() { await sb.auth.signOut(); },
      async all() {
        const { data, error } = await sb.from('receipts').select('*').order('receipt_date', { ascending: false }).limit(5000);
        if (error) throw error; return data.map(fromRow);
      },
      async put(r) {
        const uid = await uidOf(); if (!uid) throw new Error('Sign in first');
        // Upload a new proof file once, then keep only its storage path.
        if (r.image && !r.proofPath) {
          const blob = await dataUrlToBlob(r.image);
          const ext = blob.type === 'application/pdf' ? 'pdf' : 'jpg';
          const path = `${uid}/${r.id}.${ext}`;
          const { error } = await sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
          if (error) throw error;
          r.proofPath = path; r.proofType = blob.type;
        }
        const { error } = await sb.from('receipts').upsert(toRow(r, uid));
        if (error) throw error;
        return r;
      },
      async del(id) {
        const { data } = await sb.from('receipts').select('proof_path').eq('id', id).single();
        if (data?.proof_path) await sb.storage.from(BUCKET).remove([data.proof_path]);
        const { error } = await sb.from('receipts').delete().eq('id', id); if (error) throw error;
      },
      async getMeta(k) {
        if (k !== 'profile') return localStorageGet(k);
        const { data } = await sb.from('profiles').select('kids,parents,income').maybeSingle(); return data || undefined;
      },
      async setMeta(k, v) {
        if (k !== 'profile') return localStorageSet(k, v);
        const uid = await uidOf(); if (uid) await sb.from('profiles').upsert({ id: uid, ...v });
      },
      async proofUrl(r) {
        if (!r.proofPath) return r.image || null;
        const { data } = await sb.storage.from(BUCKET).createSignedUrl(r.proofPath, 3600); return data?.signedUrl || null;
      },
      async proofBlob(r) {
        if (!r.proofPath) return r.image ? dataUrlToBlob(r.image) : null;
        const { data } = await sb.storage.from(BUCKET).download(r.proofPath); return data;
      },
      // Published relief rules: lets LHDN policy changes ship without a new app release.
      async rules() {
        const { data } = await sb.from('relief_rules').select('ya,version,rules,note,source_url,published_at').eq('is_active', true);
        return data || null;
      },
      async inboundAddress() {
        const { data } = await sb.from('inbound_addresses').select('token').maybeSingle();
        return data ? `${data.token}@${CFG.inboundDomain || 'in.resitrelief.my'}` : null;
      },
    };
  }

  function localStorageGet(k) { try { return JSON.parse(localStorage.getItem('rr:' + k)); } catch { return undefined; } }
  function localStorageSet(k, v) { try { localStorage.setItem('rr:' + k, JSON.stringify(v)); } catch {} }

  window.Store = cloud ? cloudStore() : localStore();
})();
