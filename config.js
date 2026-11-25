/* Fill these in to switch on accounts and the cloud database (see SETUP.md).
 * Leave them empty to run in local mode, where receipts stay on this device.
 * The anon key is safe to ship to browsers: row-level security in supabase/schema.sql
 * makes sure each person only ever reads their own receipts. */
window.RESIT_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  inboundDomain: 'in.resitrelief.my', // the domain your receipt-forwarding addresses live on
};
