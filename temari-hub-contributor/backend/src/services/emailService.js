const DEFAULT_SENDER = 'TemariHub <onboarding@resend.dev>';
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const PLACEHOLDER_VALUES = ['your_resend_api_key', 'replace-me', 'change-me'];
const PLACEHOLDER_SENDER_DOMAINS = ['your-verified-domain.com', 'example.com'];
const MISSING_KEY_WARNING_INTERVAL_MS = 10 * 60 * 1000;
const EMAIL_TOKEN_PATTERN = /[^\s<>,;"']+@[^\s<>,;"']+\.[^\s<>,;"']+/;
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const RESEND_BATCH_URL = 'https://api.resend.com/emails/batch';
const USER_AGENT = 'TemariHub/1.0';
const BATCH_LIMIT = 100;
const SINGLE_TIMEOUT_MS = 15000;
const BATCH_TIMEOUT_MS = 45000;

let lastMissingKeyWarningAt = 0;
let loggedSenderFallback = false;

/**
 * Reads a configuration value from the process environment.
 * Hosting dashboards often keep surrounding quotes or a trailing newline.
 */
function readEnv(name) {
  const raw = process.env[name];
  if (typeof raw !== 'string') return '';

  let value = raw.trim();
  const isQuoted = value.length >= 2
    && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")));
  if (isQuoted) {
    value = value.slice(1, -1).trim();
  }

  if (PLACEHOLDER_VALUES.includes(value.toLowerCase())) {
    return '';
  }
  return value;
}

function getApiKey() {
  return readEnv('RESEND_API_KEY');
}

/**
 * Rebuilds EMAIL_FROM into `Display Name <address>` form Resend expects.
 */
function normalizeSender(rawSender) {
  const value = String(rawSender || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';

  const match = value.match(EMAIL_TOKEN_PATTERN);
  if (!match) return '';

  const address = match[0];
  const domain = address.split('@')[1].toLowerCase();
  if (PLACEHOLDER_SENDER_DOMAINS.includes(domain)) return '';

  const displayName = value
    .replace(EMAIL_TOKEN_PATTERN, '')
    .replace(/[<>"']/g, '')
    .trim();

  if (!displayName) return address;
  if (/[,;:()[\]\\]/.test(displayName)) {
    return `"${displayName}" <${address}>`;
  }
  return `${displayName} <${address}>`;
}

function getSender() {
  const normalized = normalizeSender(readEnv('EMAIL_FROM'));
  if (normalized) return normalized;

  if (!loggedSenderFallback) {
    loggedSenderFallback = true;
    console.warn(`[Email] EMAIL_FROM is missing or unusable. Falling back to ${DEFAULT_SENDER}.`);
  }
  return DEFAULT_SENDER;
}

function getBulkSender() {
  return normalizeSender(readEnv('EMAIL_FROM_BULK')) || getSender();
}

function warnMissingApiKey() {
  const now = Date.now();
  if (now - lastMissingKeyWarningAt < MISSING_KEY_WARNING_INTERVAL_MS) return;
  lastMissingKeyWarningAt = now;
  console.warn(
    '[Email] Email notifications are disabled: RESEND_API_KEY is not configured. '
    + 'Set it in backend/.env on the droplet (or as a process env var) and restart pm2.',
  );
}

function getFrontendBaseUrl() {
  const baseUrl = readEnv('FRONTEND_URL') || readEnv('CLIENT_ORIGIN') || DEFAULT_FRONTEND_URL;
  return baseUrl.replace(/\/+$/, '');
}

function getEmailConfigStatus() {
  const apiKey = getApiKey();
  const rawSender = readEnv('EMAIL_FROM');
  const sender = normalizeSender(rawSender);
  const bulkSender = normalizeSender(readEnv('EMAIL_FROM_BULK')) || sender || DEFAULT_SENDER;
  const issues = [];

  if (!apiKey) {
    issues.push('RESEND_API_KEY is not set, so no notification emails will be sent.');
  } else if (!apiKey.startsWith('re_')) {
    issues.push('RESEND_API_KEY does not start with "re_". It may be truncated or still wrapped in quotes.');
  }

  if (!rawSender) {
    issues.push(`EMAIL_FROM is not set. Using the shared Resend test sender ${DEFAULT_SENDER}.`);
  } else if (!sender) {
    issues.push(`EMAIL_FROM ("${rawSender}") contains no usable address. Using ${DEFAULT_SENDER}.`);
  } else if (sender !== rawSender) {
    issues.push(`EMAIL_FROM was normalized from "${rawSender}" to "${sender}".`);
  }

  if (!readEnv('EMAIL_FROM_BULK')) {
    issues.push('EMAIL_FROM_BULK is not set. Bulk/reminder emails will use EMAIL_FROM.');
  }

  if (!readEnv('FRONTEND_URL') && !readEnv('CLIENT_ORIGIN')) {
    issues.push(`Neither FRONTEND_URL nor CLIENT_ORIGIN is set. Email links will point at ${DEFAULT_FRONTEND_URL}.`);
  }

  return {
    enabled: Boolean(apiKey),
    apiKeyPresent: Boolean(apiKey),
    apiKeyLength: apiKey.length,
    sender: sender || DEFAULT_SENDER,
    bulkSender,
    frontendBaseUrl: getFrontendBaseUrl(),
    issues,
  };
}

function logEmailConfig() {
  const status = getEmailConfigStatus();
  const keyState = status.apiKeyPresent ? `present (${status.apiKeyLength} chars)` : 'missing';

  console.log(
    `[Email] Provider: Resend HTTP | Enabled: ${status.enabled ? 'yes' : 'no'} | `
    + `RESEND_API_KEY: ${keyState} | From: ${status.sender} | Bulk: ${status.bulkSender} | `
    + `Links: ${status.frontendBaseUrl} | User-Agent: ${USER_AGENT}`,
  );
  status.issues.forEach((issue) => console.warn(`[Email] ${issue}`));

  return status;
}

function describeResendError(body, statusCode, from) {
  const message = body?.message || body?.name || body?.error || 'Resend API returned an error';
  if (statusCode === 401 || statusCode === 403) {
    return `${message} (status ${statusCode}; verify RESEND_API_KEY, User-Agent, and that the domain in "${from}" is verified in Resend)`;
  }
  return statusCode ? `${message} (status ${statusCode})` : String(message);
}

function resolveActionUrl(actionUrl) {
  if (!actionUrl) return '';
  if (/^https?:\/\//i.test(actionUrl)) {
    return actionUrl;
  }
  const cleanPath = actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`;
  return `${getFrontendBaseUrl()}${cleanPath}`;
}

function buildHtmlTemplate({
  recipientName = '',
  title = 'Notification',
  message = '',
  actionUrl = '',
  actionText = 'View Details',
  details = null,
}) {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
  const fullActionUrl = resolveActionUrl(actionUrl);

  let detailsHtml = '';
  if (details && typeof details === 'object' && Object.keys(details).length > 0) {
    const rows = Object.entries(details)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(
        ([k, v]) => `
          <tr>
            <td style="padding: 6px 12px 6px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: capitalize; width: 120px; vertical-align: top;">
              ${escapeHtml(k)}:
            </td>
            <td style="padding: 6px 0; font-size: 13px; color: #1e293b; font-weight: 500;">
              ${escapeHtml(String(v))}
            </td>
          </tr>
        `,
      )
      .join('');

    if (rows) {
      detailsHtml = `
        <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  const actionButtonHtml = fullActionUrl
    ? `
      <div style="margin: 28px 0 20px 0; text-align: center;">
        <a href="${fullActionUrl}" 
           style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);"
           target="_blank">
          ${escapeHtml(actionText)}
        </a>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center; word-break: break-all;">
        If the button above does not work, visit: <br/>
        <a href="${fullActionUrl}" style="color: #3b82f6; text-decoration: underline;">${fullActionUrl}</a>
      </p>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
              <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                TEMARI<span style="color: #38bdf8;">HUB</span>
              </span>
              <div style="font-size: 11px; font-weight: 500; letter-spacing: 1px; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">
                Contributor Platform
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                ${escapeHtml(title)}
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #475569;">
                ${escapeHtml(greeting)}
              </p>
              <div style="font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">
                ${escapeHtml(message)}
              </div>
              ${detailsHtml}
              ${actionButtonHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                You are receiving this email because you are a registered contributor or administrator on TemariHub.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} TemariHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildPlainText({
  recipientName = '',
  title = 'Notification',
  message = '',
  actionUrl = '',
  actionText = 'View Details',
  details = null,
}) {
  const greeting = recipientName ? `Hello ${recipientName},\n\n` : 'Hello,\n\n';
  const fullActionUrl = resolveActionUrl(actionUrl);

  let detailsText = '';
  if (details && typeof details === 'object' && Object.keys(details).length > 0) {
    detailsText = '\nDetails:\n'
      + Object.entries(details)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')
      + '\n';
  }

  const actionTextPart = fullActionUrl
    ? `\n\n${actionText}: ${fullActionUrl}\n`
    : '';

  return (
    `TEMARIHUB CONTRIBUTOR PLATFORM\n`
    + `-----------------------------------------\n`
    + `${title.toUpperCase()}\n\n`
    + `${greeting}`
    + `${message}\n`
    + `${detailsText}`
    + `${actionTextPart}\n`
    + `-----------------------------------------\n`
    + `You received this email because of your notification settings on TemariHub.`
  );
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asciiHeaderValue(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '-')
    .slice(0, 128);
}
async function resendRequest(url, payload, { timeoutMs = SINGLE_TIMEOUT_MS, idempotencyKey } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    warnMissingApiKey();
    return { ok: false, skipped: true, error: 'RESEND_API_KEY is not configured' };
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = asciiHeaderValue(idempotencyKey);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: describeResendError(body, response.status, payload.from || payload[0]?.from),
        body,
      };
    }

    return { ok: true, status: response.status, body };
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    return {
      ok: false,
      error: aborted
        ? `Resend request timed out after ${timeoutMs}ms`
        : (err.message || 'Failed to reach Resend'),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send one transactional email via POST /emails
 * Returns { success, messageId?, error?, skipped? }
 */
async function sendEmail({ to, subject, html, text, from, idempotencyKey }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    warnMissingApiKey();
    return {
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured',
    };
  }

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.warn(`[Email] Invalid or missing recipient email address: "${to}"`);
    return {
      success: false,
      error: 'Invalid recipient email address',
    };
  }

  const sender = from || getSender();
  const recipient = to.trim();
  console.log(`[Email] Sending notification email to ${recipient} from ${sender} (Subject: "${subject}")`);

  const payload = {
    from: sender,
    to: [recipient],
    subject: subject || 'TemariHub Notification',
    html,
  };
  if (text) {
    payload.text = text;
  }

  const result = await resendRequest(RESEND_EMAILS_URL, payload, {
    timeoutMs: SINGLE_TIMEOUT_MS,
    idempotencyKey,
  });

  if (result.skipped) {
    return { success: false, skipped: true, error: result.error };
  }

  if (!result.ok) {
    console.error(`[Email] Failed to send notification email to ${recipient}: ${result.error}`);
    return { success: false, error: result.error };
  }

  const messageId = result.body?.id;
  console.log(`[Email] Notification email sent successfully to ${recipient} (ID: ${messageId})`);
  return { success: true, messageId };
}

/**
 * Bulk send via POST /emails/batch (max 100 per request).
 * messages: [{ to, subject, html, text? }, ...]
 */
async function sendBulkEmails(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { success: true, sent: 0, results: [] };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    warnMissingApiKey();
    return { success: false, skipped: true, error: 'RESEND_API_KEY is not configured', sent: 0, results: [] };
  }

  const from = getBulkSender();
  const results = [];
  let sent = 0;

  for (let start = 0; start < messages.length; start += BATCH_LIMIT) {
    const chunk = messages.slice(start, start + BATCH_LIMIT);
    const payload = chunk.map((item) => {
      const entry = {
        from,
        to: [String(item.to || '').trim()],
        subject: item.subject || 'TemariHub Notification',
        html: item.html || '',
      };
      if (item.text) entry.text = item.text;
      return entry;
    });

    console.log(`[Email] Sending bulk chunk ${start}-${start + chunk.length - 1} (${chunk.length} messages) from ${from}`);

    const result = await resendRequest(RESEND_BATCH_URL, payload, { timeoutMs: BATCH_TIMEOUT_MS });
    if (!result.ok) {
      console.error(`[Email] Bulk chunk starting at ${start} failed: ${result.error}`);
      results.push({ start, success: false, error: result.error });
      continue;
    }

    const ids = Array.isArray(result.body?.data) ? result.body.data : [];
    sent += ids.length;
    results.push({ start, success: true, ids });
    console.log(`[Email] Bulk chunk ${start}: sent ${ids.length}`);
  }

  return {
    success: sent > 0,
    sent,
    results,
  };
}

async function sendNotificationEmail({
  to,
  recipientName = '',
  subject,
  title,
  message,
  actionUrl,
  actionText = 'View Details',
  details = null,
  notificationType = 'GENERAL',
  idempotencyKey,
}) {
  const html = buildHtmlTemplate({
    recipientName,
    title: title || subject || 'TemariHub Notification',
    message,
    actionUrl,
    actionText,
    details,
  });

  const text = buildPlainText({
    recipientName,
    title: title || subject || 'TemariHub Notification',
    message,
    actionUrl,
    actionText,
    details,
  });

  return sendEmail({
    to,
    subject: subject || `${title || 'Notification'} — TemariHub`,
    html,
    text,
    idempotencyKey,
  });
}

// Compatibility shim — older tests imported getResendClient.
function getResendClient() {
  return getApiKey() ? { mode: 'http', userAgent: USER_AGENT } : null;
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendBulkEmails,
  buildHtmlTemplate,
  buildPlainText,
  resolveActionUrl,
  getResendClient,
  getSender,
  getBulkSender,
  normalizeSender,
  getFrontendBaseUrl,
  getEmailConfigStatus,
  logEmailConfig,
  USER_AGENT,
};
