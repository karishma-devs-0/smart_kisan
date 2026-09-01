/**
 * Outbound SMS.
 *
 * Provider-agnostic for the same reason the mail service is: whichever provider
 * ends up being used, the calling code should not change. Two are supported,
 * chosen by which credentials are present.
 *
 *   Brevo   already the email provider, so one account and one bill. Sends over
 *           HTTPS, which matters because hosting platforms block outbound SMTP
 *           and are similarly unfriendly to anything unusual.
 *
 *   MSG91   widely used for Indian transactional SMS and generally cheaper per
 *           message domestically.
 *
 * DELIVERY TO INDIAN NUMBERS
 * --------------------------
 * TRAI requires every commercial sender to register their business, sender ID
 * and message templates on a DLT platform. Without that registration no
 * provider will deliver to an Indian number, whatever the code does. That is a
 * business process, not a technical one, and it gates this feature going live.
 *
 * The code is written and testable regardless: with no provider configured the
 * message is logged rather than sent, so the whole flow can be exercised before
 * registration completes.
 */

const BREVO_SMS_ENDPOINT = 'https://api.brevo.com/v3/transactionalSMS/sms';
const MSG91_ENDPOINT = 'https://control.msg91.com/api/v5/flow/';

// Sender IDs for Indian transactional SMS are six alphabetic characters and
// must match one registered on DLT.
const SENDER = process.env.SMS_SENDER_ID || 'SMTKSN';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Indian mobile numbers are ten digits starting 6-9. People type them with
 * +91, a leading zero, spaces or dashes, so all of that is stripped before the
 * number is stored or sent.
 *
 * @returns {string|null} the bare ten digits, or null if it is not a valid
 *   Indian mobile number.
 */
function normalisePhone(input) {
  const digits = String(input || '').replace(/[^\d]/g, '');
  const local = digits.replace(/^(91)/, '').replace(/^0/, '');
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

/** E.164, which is what the providers expect on the wire. */
function toE164(local) {
  return `+91${local}`;
}

async function sendViaBrevo(local, message) {
  const res = await fetch(BREVO_SMS_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      recipient: toE164(local),
      content: message,
      type: 'transactional',
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SMS send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { delivered: true, via: 'brevo' };
}

async function sendViaMsg91(local, message) {
  const res = await fetch(MSG91_ENDPOINT, {
    method: 'POST',
    headers: {
      authkey: process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      sender: SENDER,
      short_url: '0',
      recipients: [{ mobiles: `91${local}`, OTP: message }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SMS send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { delivered: true, via: 'msg91' };
}

/**
 * @param {string} phone  any format the user might type
 * @param {string} code
 */
async function sendCode(phone, code, minutes) {
  const local = normalisePhone(phone);
  if (!local) throw new Error('Enter a valid 10-digit mobile number');

  // Wording is deliberately plain and short. Indian transactional SMS must
  // match a DLT-registered template, and a single segment keeps the cost down.
  const message = `${code} is your SmartKisan verification code. Valid for ${minutes} minutes. Do not share it with anyone.`;

  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    return sendViaMsg91(local, code);
  }

  if (process.env.BREVO_API_KEY && process.env.SMS_ENABLED === 'true') {
    return sendViaBrevo(local, message);
  }

  if (isProduction()) {
    throw new Error(
      'No SMS provider configured (set MSG91_AUTH_KEY, or BREVO_API_KEY with SMS_ENABLED=true)'
    );
  }

  console.log('\n─── SMS (not sent: no provider configured) ───');
  console.log(`  to:      ${toE164(local)}`);
  console.log(`  message: ${message}`);
  console.log('──────────────────────────────────────────────\n');
  return { delivered: false, reason: 'no-provider' };
}

/** Whether SMS can actually be delivered from this deployment. */
function isSmsConfigured() {
  return Boolean(
    (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ||
      (process.env.BREVO_API_KEY && process.env.SMS_ENABLED === 'true')
  );
}

module.exports = { sendCode, normalisePhone, toE164, isSmsConfigured };
