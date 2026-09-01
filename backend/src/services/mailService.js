/**
 * Outbound email.
 *
 * Three providers, chosen by which credentials are present, in this order:
 *
 *   Brevo   HTTPS API. Verifies a single sending address rather than a domain,
 *           so it works without owning one, and being an ordinary HTTPS request
 *           it is unaffected by the outbound SMTP blocking that hosting
 *           platforms apply. This is the path that works in production.
 *
 *   SMTP    any host, including Gmail. Also needs no domain, but a hosted
 *           server usually cannot open an outbound SMTP connection at all — the
 *           attempt hangs rather than failing. Useful locally.
 *
 *   Resend  REST API, no SDK needed since Node has fetch built in. Requires a
 *           verified domain: its shared onboarding@resend.dev sender only
 *           delivers to the address that owns the Resend account, so it cannot
 *           reach real users until a domain is added.
 *
 * SMTP wins when configured, because if someone has bothered to set it up it is
 * because the Resend path cannot reach their users. Switching later is one
 * environment variable, not a code change.
 *
 * With neither configured the service does not fail outside production — it
 * logs the message, code included, so the flows can be developed without any
 * mail account at all. In production a missing provider is an error, because
 * silently not sending a sign-in code is indistinguishable from a code that
 * never arrives.
 */
const nodemailer = require('nodemailer');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

const FROM =
  process.env.MAIL_FROM || 'SmartKisan <onboarding@resend.dev>';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

let smtpTransport = null;

function getSmtpTransport() {
  if (smtpTransport) return smtpTransport;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  smtpTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: Number(process.env.SMTP_PORT) === 465,

    // Hosting platforms commonly block outbound SMTP to stop spam being sent
    // from their address space. When they do, the connection neither succeeds
    // nor is refused — it simply never completes, and without these the request
    // hangs until the caller gives up. Observed in production: the endpoint held
    // for over two minutes while the app showed a spinner and eventually
    // reported a cancelled request.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // Google displays app passwords in spaced groups of four for
    // readability, but the spaces are presentational — leaving them in
    // produces an authentication failure that reads like a wrong password.
    auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s+/g, '') },
  });
  return smtpTransport;
}

/**
 * Splits "Name <address@host>" into the shape Brevo's API expects.
 */
function parseSender(value) {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value || '');
  if (match) return { name: match[1] || 'SmartKisan', email: match[2] };
  return { name: 'SmartKisan', email: value };
}

/**
 * Brevo over HTTPS.
 *
 * Preferred over SMTP on a hosted server: platforms routinely block outbound
 * SMTP to prevent spam, and the connection then hangs rather than failing, so
 * the request stalls until the caller times out. An HTTPS call on 443 is not
 * subject to that.
 *
 * Brevo also verifies a single sending address rather than a whole domain,
 * which matters here because there is no domain to verify yet.
 */
async function sendViaBrevo({ to, subject, html, text }) {
  const sender = parseSender(process.env.MAIL_FROM || process.env.SMTP_USER);

  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { delivered: true, via: 'brevo' };
}

async function send({ to, subject, html, text }) {
  // HTTPS providers first: they work from a hosted server, where SMTP often
  // does not.
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo({ to, subject, html, text });
  }

  const transport = getSmtpTransport();
  if (transport) {
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
    return { delivered: true, via: 'smtp' };
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (isProduction()) {
      throw new Error(
        'No mail provider configured (set BREVO_API_KEY, SMTP_*, or RESEND_API_KEY)'
      );
    }
    console.log('\n─── email (not sent: no RESEND_API_KEY) ───');
    console.log(`  to:      ${to}`);
    console.log(`  subject: ${subject}`);
    console.log(`  body:    ${text}`);
    console.log('───────────────────────────────────────────\n');
    return { delivered: false, reason: 'no-provider' };
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  return { delivered: true, via: 'resend' };
}

/** Shared shell so every message looks like it came from the same product. */
function layout(heading, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#F5F5F5;font-family:system-ui,-apple-system,sans-serif;color:#212121;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
      <div style="font-size:20px;font-weight:700;color:#2E7D32;margin-bottom:4px;">SmartKisan</div>
      <h1 style="font-size:18px;margin:16px 0 8px;">${heading}</h1>
      ${bodyHtml}
      <p style="font-size:12px;color:#757575;margin-top:24px;border-top:1px solid #EEE;padding-top:16px;">
        If you did not request this, you can ignore this email — no action will be taken.
      </p>
    </div>
  </body>
</html>`;
}

function codeBlock(code) {
  return `<div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#2E7D32;
    background:#F1F8E9;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
    ${code}</div>`;
}

const COPY = {
  login: {
    subject: 'Your SmartKisan sign-in code',
    heading: 'Sign in to SmartKisan',
    lead: 'Enter this code in the app to sign in.',
  },
  verify: {
    subject: 'Confirm your SmartKisan email',
    heading: 'Confirm your email address',
    lead: 'Enter this code in the app to confirm your email address.',
  },
  reset: {
    subject: 'Reset your SmartKisan password',
    heading: 'Reset your password',
    lead: 'Enter this code in the app to choose a new password.',
  },
};

/**
 * @param {'login'|'verify'|'reset'} purpose
 */
async function sendCode(to, code, purpose, minutes) {
  const copy = COPY[purpose] || COPY.login;
  const html = layout(
    copy.heading,
    `<p style="font-size:14px;line-height:1.6;">${copy.lead}</p>
     ${codeBlock(code)}
     <p style="font-size:13px;color:#616161;">This code expires in ${minutes} minutes and can only be used once.</p>`
  );
  const text = `${copy.lead}\n\n${code}\n\nExpires in ${minutes} minutes. Single use.`;

  return send({ to, subject: copy.subject, html, text });
}

module.exports = { send, sendCode };
