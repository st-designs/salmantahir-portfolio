// Contact form handler, runs on Cloudflare Pages Functions.
//
// The browser posts JSON here, this validates it and hands the message to
// Resend, which does the actual sending. Reply-To is the sender's address, so
// replying from Gmail goes straight back to them rather than to the site.
//
// Needs one environment variable set in the Pages dashboard: RESEND_API_KEY.

const TO = 'salmantahir0831@gmail.com';
const FROM = 'Contact form <contact@salmantahir.net>';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

// escaped before it goes anywhere near an HTML email body
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;');

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  // The honeypot is a field positioned off screen. A person never sees it, so
  // anything in it came from a bot filling every input on the page.
  if (clean(body.website, 200)) return json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Please fill in every field.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, error: 'That email address does not look right.' }, 400);
  }

  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: 'The form is not configured yet.' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `New enquiry from ${name}`,
      text: `${name} <${email}>\n\n${message}\n\nSent from salmantahir.net`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                  max-width:560px;color:#221A1C;line-height:1.6">
        <p style="font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;
                  color:#8B3A47;margin:0 0 14px">New enquiry</p>
        <p style="margin:0 0 4px;font-size:17px;font-weight:600">${esc(name)}</p>
        <p style="margin:0 0 22px"><a href="mailto:${esc(email)}"
           style="color:#8B3A47">${esc(email)}</a></p>
        <div style="white-space:pre-wrap;padding:18px 20px;background:#FAF9F7;
                    border:1px solid #E7E3E1;border-radius:14px">${esc(message)}</div>
        <p style="margin:22px 0 0;font-size:13px;color:#6F6467">
          Sent from salmantahir.net. Reply to this email to answer ${esc(name)} directly.</p>
      </div>`,
    }),
  });

  if (!res.ok) {
    return json({ ok: false, error: 'Could not send that just now. Please email me directly.' }, 502);
  }
  return json({ ok: true });
}
