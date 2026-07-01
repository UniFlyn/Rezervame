"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.emailParagraph = emailParagraph;
exports.emailMuted = emailMuted;
exports.emailCodeBox = emailCodeBox;
exports.emailDetailsTable = emailDetailsTable;
exports.emailCtaButton = emailCtaButton;
exports.wrapEmailLayout = wrapEmailLayout;
exports.stripHtml = stripHtml;
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function emailParagraph(text) {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#334155;">${escapeHtml(text)}</p>`;
}
function emailMuted(text) {
    return `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#64748b;">${escapeHtml(text)}</p>`;
}
function emailCodeBox(code, label = 'Your verification code') {
    return `
    <div style="margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${escapeHtml(label)}</p>
      <div style="display:inline-block;padding:16px 28px;border-radius:14px;background:#fff5f5;border:2px dashed #ff5a5f;">
        <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(code)}</span>
      </div>
    </div>`;
}
function emailDetailsTable(rows) {
    const cells = rows
        .filter((r) => r.value?.trim())
        .map((r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;width:38%;vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;vertical-align:top;">${escapeHtml(r.value)}</td>
      </tr>`)
        .join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">${cells}</table>`;
}
function emailCtaButton(label, url) {
    const safeUrl = escapeHtml(url);
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 8px;">
      <tr>
        <td style="border-radius:12px;background:#ff5a5f;">
          <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}
function wrapEmailLayout(opts) {
    const platform = opts.platformName?.trim() || 'Rezervame';
    const preheader = escapeHtml(opts.preheader || opts.headline);
    const intro = opts.intro ? emailParagraph(opts.intro) : '';
    const cta = opts.cta ? emailCtaButton(opts.cta.label, opts.cta.url) : '';
    const footerNote = opts.footerNote
        ? emailMuted(opts.footerNote)
        : emailMuted(`Need help? Reply to this email or contact soporte@rezervame.com.`);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(opts.headline)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#ff5a5f 0%,#e0484d 100%);padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.82);">${escapeHtml(platform)}</p>
              <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:800;color:#ffffff;">${escapeHtml(opts.headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${intro}
              ${opts.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              ${footerNote}
              <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ${escapeHtml(platform)} · Panama</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function stripHtml(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=email-layout.util.js.map