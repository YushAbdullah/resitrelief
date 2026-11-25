// Inbound email → receipt.
// Point an inbound email provider (Postmark Inbound, or Cloudflare Email Routing + a small worker that
// re-posts as JSON) at this function. Each user forwards order and bill emails from Shopee, TikTok Shop,
// Lazada, Shein, Unifi, TNB, clinics and so on to their personal address: <token>@in.yourdomain.
//
// Expected JSON (Postmark inbound format): { To, From, Subject, TextBody, HtmlBody, MessageID, Date,
//   Attachments: [{ Name, ContentType, Content(base64) }] }
// Secured with a shared secret in the URL: /inbound-email?key=INBOUND_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import Engine from '../_shared/engine.js';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const htmlToText = (h: string) => h
  .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get('key') !== Deno.env.get('INBOUND_SECRET')) return new Response('forbidden', { status: 403 });
  const mail = await req.json();

  // Find the user from the address the email was sent to.
  const to: string = (mail.OriginalRecipient || mail.To || '').toLowerCase();
  const token = (to.match(/(r-[a-f0-9]{12})@/) || [])[1];
  if (!token) return new Response('unknown address', { status: 200 });
  const { data: addr } = await sb.from('inbound_addresses').select('user_id').eq('token', token).maybeSingle();
  if (!addr) return new Response('unknown address', { status: 200 });

  const text = [mail.Subject, mail.TextBody || htmlToText(mail.HtmlBody || '')].join('\n');
  const parsed = Engine.parseReceipt(text);
  const guess = Engine.categorize(parsed);
  if (parsed.total == null) return new Response('no amount found, skipped', { status: 200 }); // newsletters, shipping updates

  const id = crypto.randomUUID();
  let proof_path: string | null = null, proof_type: string | null = null, proof_name: string | null = null;
  const att = (mail.Attachments || []).find((a: any) => /pdf|image/.test(a.ContentType));
  if (att) {
    const bytes = Uint8Array.from(atob(att.Content), c => c.charCodeAt(0));
    proof_type = att.ContentType; proof_name = att.Name;
    proof_path = `${addr.user_id}/${id}.${att.ContentType.includes('pdf') ? 'pdf' : 'jpg'}`;
    await sb.storage.from('proofs').upload(proof_path, bytes, { contentType: att.ContentType });
  } else {
    // No attachment: keep the email itself as the proof.
    proof_type = 'text/html'; proof_name = (mail.Subject || 'receipt') + '.html';
    proof_path = `${addr.user_id}/${id}.html`;
    await sb.storage.from('proofs').upload(proof_path, new Blob([mail.HtmlBody || `<pre>${text}</pre>`], { type: 'text/html' }));
  }

  const { error } = await sb.from('receipts').upsert({
    id, user_id: addr.user_id, merchant: parsed.merchant, receipt_date: parsed.date || new Date().toISOString().slice(0, 10),
    amount: parsed.total, relief: guess.relief, sub: guess.sub, platform: parsed.platform, source: 'email',
    status: guess.relief === 'none' ? 'rejected' : guess.confidence >= 0.7 ? 'claimable' : 'review',
    raw_text: text.slice(0, 20000), is_einvoice: parsed.isEInvoice, einvoice_uuid: parsed.einvoiceUuid,
    proof_path, proof_type, proof_name, email_message_id: mail.MessageID || null,
  }, { onConflict: 'user_id,email_message_id', ignoreDuplicates: true });
  if (error) return new Response(error.message, { status: 500 });
  return new Response('ok');
});
