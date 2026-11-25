// Daily LHDN policy watch.
// Fetches the LHDN relief and rebate pages listed in policy_watch, and flags any page whose text
// changed since the last check. An admin then reviews the change and publishes a new relief_rules
// version. Rules are never changed automatically: a wrong limit would mislead every user.
//
// Schedule it daily with Supabase Cron:  select cron.schedule('policy-watch', '0 1 * * *',
//   $$ select net.http_post(url := '<project>/functions/v1/policy-watch?key=<WATCH_SECRET>') $$);
// Optional: set RESEND_API_KEY and ADMIN_EMAIL to get an email when something changes.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (new URL(req.url).searchParams.get('key') !== Deno.env.get('WATCH_SECRET')) return new Response('forbidden', { status: 403 });
  const { data: pages } = await sb.from('policy_watch').select('*');
  const changed: string[] = [];
  for (const p of pages || []) {
    try {
      const html = await (await fetch(p.url, { headers: { 'User-Agent': 'ResitRelief-policy-watch/1.0' } })).text();
      // Hash only the readable text, so menus and tracking scripts don't trigger false alarms.
      const main = (html.match(/<main[\s\S]*?<\/main>/i) || [html])[0].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const hash = await sha256(main);
      const isChange = p.last_hash && p.last_hash !== hash;
      await sb.from('policy_watch').update({
        last_hash: hash, last_checked: new Date().toISOString(),
        ...(isChange ? { changed_at: new Date().toISOString(), needs_review: true } : {}),
      }).eq('url', p.url);
      if (isChange) changed.push(`${p.label}: ${p.url}`);
    } catch (e) { console.error('watch failed', p.url, e); }
  }
  const key = Deno.env.get('RESEND_API_KEY'), to = Deno.env.get('ADMIN_EMAIL');
  if (changed.length && key && to) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Resit Relief <alerts@resitrelief.my>', to, subject: 'LHDN relief page changed: review the rules',
        text: `These pages changed since yesterday:\n\n${changed.join('\n')}\n\nReview them and publish a new relief_rules version if a limit changed.` }),
    });
  }
  return Response.json({ checked: pages?.length || 0, changed });
});
